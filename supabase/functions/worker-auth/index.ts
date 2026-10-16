// supabase/functions/worker-auth/index.ts
//
// Worker PIN sign-in and first-time activation (migration 024).
// Deployed by pasting into Supabase Dashboard > Edge Functions; it has no
// imports, only Deno built-ins and fetch.
//
// The PIN/code is checked in Postgres (bcrypt, lockout, rate limit) by
// service-role-only functions. Only after that succeeds does this function
// create/find the worker's own auth user and issue a session for it. The
// session id is then recorded so RLS honours that session and no other.
//
// Environment (provided automatically by Supabase):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// Optional:
//   ALLOWED_ORIGINS  comma-separated list for CORS (default: *)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '*').split(',').map((o) => o.trim());

// Worker accounts never receive mail; the reserved .invalid TLD guarantees it.
const WORKER_EMAIL_DOMAIN = 'worker.shopkhattabook.invalid';

type AuthStatus = 'ok' | 'invalid' | 'locked' | 'suspended' | 'bad_pin' | 'rate_limited' | 'choose_shop' | 'error';

const corsHeaders = (origin: string | null): Record<string, string> => {
  const allowed = ALLOWED_ORIGINS.includes('*')
    ? '*'
    : origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0] ?? '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
};

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });

const serviceHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`rpc ${fn} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function jwtClaim(token: string, claim: string): string | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded))[claim] ?? null;
  } catch {
    return null;
  }
}

const workerEmail = (membershipId: string) => `w-${membershipId}@${WORKER_EMAIL_DOMAIN}`;

/** Returns the worker's auth user id, creating and linking it on first sign-in. */
async function ensureWorkerUser(membershipId: string, userId: string | null): Promise<string> {
  if (userId) return userId;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      id: membershipId,
      email: workerEmail(membershipId),
      email_confirm: true,
      app_metadata: { role: 'worker', membership_id: membershipId },
    }),
  });

  let newId: string | null = null;
  if (res.ok) {
    newId = (await res.json()).id ?? null;
  } else if (res.status === 422 || res.status === 409) {
    // Created by an earlier attempt that failed before linking.
    const existing = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${membershipId}`, { headers: serviceHeaders });
    if (existing.ok) newId = (await existing.json()).id ?? null;
  }
  if (!newId) throw new Error(`could not create worker user: ${res.status}`);

  await rpc('worker_auth_link_user', { p_membership_id: membershipId, p_user_id: newId });
  return newId;
}

/** Issues a session for the worker user without any password. */
async function issueSession(membershipId: string) {
  const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({ type: 'magiclink', email: workerEmail(membershipId) }),
  });
  if (!linkRes.ok) throw new Error(`generate_link failed: ${linkRes.status}`);
  const link = await linkRes.json();
  const tokenHash: string | undefined = link.hashed_token ?? link.properties?.hashed_token;
  if (!tokenHash) throw new Error('generate_link returned no token');

  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash: tokenHash }),
  });
  if (!verifyRes.ok) throw new Error(`verify failed: ${verifyRes.status}`);
  const session = await verifyRes.json();
  if (!session.access_token || !session.refresh_token) throw new Error('verify returned no session');
  return session as { access_token: string; refresh_token: string; user: { id: string } };
}

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const shortString = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ status: 'error' }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return json({ status: 'error' }, 500, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ status: 'invalid' }, 400, origin);
  }

  const { action, identity, pin, code, shopId } = body;
  if ((action !== 'login' && action !== 'activate') || !shortString(identity, 120) || !shortString(pin, 8)) {
    return json({ status: 'invalid' }, 400, origin);
  }
  if (action === 'activate' && !shortString(code, 12)) {
    return json({ status: 'invalid' }, 400, origin);
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const ipHash = await sha256Hex(ip);

  try {
    const check = action === 'login'
      ? await rpc<{ status: AuthStatus; membershipId?: string; userId?: string | null; shops?: unknown }>(
          'worker_auth_verify_pin',
          { p_identity: identity, p_pin: pin, p_shop_id: isUuid(shopId) ? shopId : null, p_ip_hash: ipHash },
        )
      : await rpc<{ status: AuthStatus; membershipId?: string; userId?: string | null }>(
          'worker_auth_activate',
          { p_identity: identity, p_code: code, p_new_pin: pin, p_shop_id: isUuid(shopId) ? shopId : null, p_ip_hash: ipHash },
        );

    if (check.status !== 'ok' || !check.membershipId) {
      const out: Record<string, unknown> = { status: check.status };
      if (check.status === 'choose_shop') out.shops = (check as { shops?: unknown }).shops;
      return json(out, 200, origin);
    }

    const userId = await ensureWorkerUser(check.membershipId, check.userId ?? null);
    const session = await issueSession(check.membershipId);
    if (session.user?.id !== userId) throw new Error('session issued for unexpected user');

    const sessionId = jwtClaim(session.access_token, 'session_id');
    if (!isUuid(sessionId)) throw new Error('session has no session_id');

    const worker = await rpc('worker_auth_open_session', {
      p_membership_id: check.membershipId,
      p_session_id: sessionId,
      p_user_id: userId,
    });

    return json({
      status: 'ok',
      session: { access_token: session.access_token, refresh_token: session.refresh_token },
      worker,
    }, 200, origin);
  } catch (err) {
    // Details go to the function logs only.
    console.error('worker-auth error', err instanceof Error ? err.message : err);
    return json({ status: 'error' }, 500, origin);
  }
});
