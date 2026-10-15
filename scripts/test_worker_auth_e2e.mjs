// scripts/test_worker_auth_e2e.mjs
//
// End-to-end checks for worker sign-in (migration 024 + worker-auth Edge
// Function) against a TEST Supabase project. No dependencies: Node 18+ fetch.
//
// Usage (values from the test project's dashboard; never commit them):
//   I_AM_NOT_PRODUCTION=1 \
//   SUPABASE_TEST_URL=https://<test-ref>.supabase.co \
//   SUPABASE_TEST_ANON_KEY=<anon or publishable key> \
//   TEST_OWNER_EMAIL=<owner account on the test project> \
//   TEST_OWNER_PASSWORD=<its password> \
//   node scripts/test_worker_auth_e2e.mjs
//
// The owner account must already have an active shop in the test project.
// The script adds one throw-away worker and removes it at the end.

const { SUPABASE_TEST_URL: URL_, SUPABASE_TEST_ANON_KEY: ANON, TEST_OWNER_EMAIL, TEST_OWNER_PASSWORD, I_AM_NOT_PRODUCTION } = process.env;

if (I_AM_NOT_PRODUCTION !== '1') {
  console.error('Refusing to run: set I_AM_NOT_PRODUCTION=1 to confirm this is the TEST project.');
  process.exit(2);
}
for (const [k, v] of Object.entries({ SUPABASE_TEST_URL: URL_, SUPABASE_TEST_ANON_KEY: ANON, TEST_OWNER_EMAIL, TEST_OWNER_PASSWORD })) {
  if (!v) {
    console.error(`Missing ${k}`);
    process.exit(2);
  }
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  -> ${detail}` : ''}`);
};

const headers = (token) => ({
  apikey: ANON,
  Authorization: `Bearer ${token ?? ANON}`,
  'Content-Type': 'application/json',
});

async function call(method, path, token, body) {
  const res = await fetch(`${URL_}${path}`, { method, headers: headers(token), body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty body
  }
  return { status: res.status, data };
}

const rpc = (fn, token, args) => call('POST', `/rest/v1/rpc/${fn}`, token, args);
const select = (table, token, query = '') => call('GET', `/rest/v1/${table}?select=*${query}`, token);
const workerAuth = (body) => call('POST', '/functions/v1/worker-auth', null, body);

async function main() {
  // Owner session
  const login = await call('POST', '/auth/v1/token?grant_type=password', null, { email: TEST_OWNER_EMAIL, password: TEST_OWNER_PASSWORD });
  const ownerToken = login.data?.access_token;
  if (!ownerToken) throw new Error(`owner sign-in failed (${login.status})`);
  const ownerId = login.data.user.id;

  const shops = await select('shops', ownerToken, `&owner_id=eq.${ownerId}`);
  const shopId = shops.data?.[0]?.id;
  if (!shopId) throw new Error('owner has no shop in the test project');

  const identity = `9${Date.now().toString().slice(-9)}`;
  const perms = {
    dashboard: true,
    sales: { create: false, view: false, edit: false, delete: false },
    payments: { receive: false, view: false },
    customers: { view: true, add: false, edit: false, ledger: false },
    inventory: { view: true, add: false, edit: false, adjustStock: false },
    reports: false, viewProfit: false, settings: false, staffManagement: false,
  };

  // Owner adds a worker
  const added = await rpc('staff_add', ownerToken, { p_shop_id: shopId, p_name: 'E2E Worker', p_identity: identity, p_permissions: perms });
  const code = added.data?.code;
  const memberId = added.data?.workerId;
  check('owner can add a worker and gets a 6-digit code', /^\d{6}$/.test(code ?? ''), JSON.stringify(added));

  try {
    // Activation
    const wrong = await workerAuth({ action: 'activate', identity, code: code === '000000' ? '111111' : '000000', pin: '2468' });
    check('wrong activation code is refused', wrong.data?.status === 'invalid', JSON.stringify(wrong.data));

    const act = await workerAuth({ action: 'activate', identity, code, pin: '2468' });
    check('activation with the right code returns a session', act.data?.status === 'ok' && !!act.data?.session?.access_token, JSON.stringify(act.data));
    let workerToken = act.data?.session?.access_token;

    const reuse = await workerAuth({ action: 'activate', identity, code, pin: '2468' });
    check('activation code works only once', reuse.data?.status === 'invalid', JSON.stringify(reuse.data));

    // Worker data access
    const custs = await select('customers', workerToken);
    check('worker can read customers (customers.view)', custs.status === 200 && Array.isArray(custs.data), JSON.stringify(custs));
    check('worker only sees own shop customers', (custs.data ?? []).every((c) => c.shop_id === shopId));

    const costs = await select('product_costs', workerToken);
    check('worker without viewProfit sees no cost prices', Array.isArray(costs.data) && costs.data.length === 0, JSON.stringify(costs));

    const sales = await select('sales', workerToken);
    check('worker without sales.view sees no sales', Array.isArray(sales.data) && sales.data.length === 0, JSON.stringify(sales));

    const directShop = await call('POST', '/rest/v1/shops', workerToken, { owner_id: act.data?.session ? memberId : null, name: 'x', business_type: 'x' });
    check('worker cannot create a shop', directShop.status >= 400, String(directShop.status));

    const touch = await rpc('worker_touch', workerToken, { p_extend: true });
    check('heartbeat accepts the live session', touch.data?.ok === true, JSON.stringify(touch.data));

    // PIN sign-in, lockout
    const ok = await workerAuth({ action: 'login', identity, pin: '2468' });
    check('sign-in with the right PIN works', ok.data?.status === 'ok', JSON.stringify(ok.data));
    workerToken = ok.data?.session?.access_token ?? workerToken;

    const unknown = await workerAuth({ action: 'login', identity: '9000000000', pin: '2468' });
    const badPin = await workerAuth({ action: 'login', identity, pin: '1111' });
    check('unknown account and wrong PIN give the same answer', unknown.data?.status === 'invalid' && badPin.data?.status === 'invalid');

    for (let i = 0; i < 4; i += 1) await workerAuth({ action: 'login', identity, pin: '1111' });
    const locked = await workerAuth({ action: 'login', identity, pin: '2468' });
    check('5 wrong PINs lock the account (right PIN refused)', locked.data?.status === 'locked', JSON.stringify(locked.data));

    // Revocation applies to an already-issued access token
    const before = await select('customers', workerToken);
    await rpc('staff_revoke_sessions', ownerToken, { p_member_id: memberId });
    const after = await select('customers', workerToken);
    check('issued token loses access right after "sign out everywhere"',
      Array.isArray(before.data) && Array.isArray(after.data) && after.data.length === 0,
      `before=${before.data?.length} after=${after.data?.length}`);
    const touchAfter = await rpc('worker_touch', workerToken, { p_extend: true });
    check('heartbeat reports the revocation', touchAfter.data?.ok === false, JSON.stringify(touchAfter.data));

    // Suspension
    await rpc('staff_update', ownerToken, { p_member_id: memberId, p_status: 'suspended' });
    const reset = await rpc('staff_new_code', ownerToken, { p_member_id: memberId, p_reset_pin: false });
    const suspended = await workerAuth({ action: 'login', identity, pin: '2468' });
    check('suspended worker cannot sign in', ['suspended', 'locked'].includes(suspended.data?.status), JSON.stringify(suspended.data));
    void reset;

    // Owner still has full access
    const ownerCosts = await select('product_costs', ownerToken);
    check('owner can still read cost prices', ownerCosts.status === 200, JSON.stringify(ownerCosts));
  } finally {
    const removed = await rpc('staff_remove', ownerToken, { p_member_id: memberId });
    check('cleanup: worker removed', removed.status < 300, JSON.stringify(removed.data));
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('E2E run aborted:', err.message);
  process.exit(1);
});
