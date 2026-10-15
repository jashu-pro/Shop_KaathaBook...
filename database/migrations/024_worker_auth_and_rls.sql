-- ============================================================================
-- 024: WORKER ACCOUNTS, PIN SIGN-IN AND DATABASE-ENFORCED PERMISSIONS
-- ============================================================================
-- Design (Option B: a dedicated Supabase Auth user per worker)
--
--   Identity
--     * Each worker membership gets its own auth.users row, created by the
--       `worker-auth` Edge Function (service role, server side) and stored in
--       shop_memberships.user_id. Its app_metadata.role = 'worker', which only
--       the service role can set.
--     * A worker never has a password. The Edge Function verifies the PIN with
--       worker_auth_verify_pin() (bcrypt in Postgres, lockout, rate limit) and
--       only then issues a Supabase session for that user.
--
--   Binding
--     * The issued session's id (JWT claim `session_id`) is recorded in
--       worker_sessions. Data access requires a request whose JWT carries a
--       session id recorded there. A session created any other way (e.g. a
--       password someone set on the account) carries no shop access.
--
--   Authorization
--     * has_shop_permission() honours a worker only when: the membership is
--       active, the request's session is recorded for it, the session version
--       matches (revocation), and the session was active in the last 30
--       minutes (inactivity). Every worker RLS policy goes through it, so an
--       already-issued access token stops working the moment any of these
--       change, before the token expires.
--     * Sales and payments go through checked functions; workers get no direct
--       write access to balances, ledger entries, payments, sale items or
--       stock movements.
--     * Cost prices live in product_costs, readable only by the owner and
--       workers with the viewProfit permission.
--
-- Also fixes rpc_submit_shop_registration trusting a caller-supplied owner id.
--
-- Prerequisites: pgcrypto (default on Supabase, schema "extensions").
-- Anonymous sign-ins are NOT used and can stay disabled.
-- Apply to a test project first. Owner policies from earlier migrations are
-- kept; this migration only adds worker paths and the fixes listed above.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. Membership data
-- ----------------------------------------------------------------------------

-- Identities are matched case-insensitively and without spaces.
create or replace function public.normalize_worker_identity(p_identity text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(coalesce(p_identity, ''), '\s', '', 'g'));
$$;

create index if not exists idx_shop_memberships_identity
  on public.shop_memberships (public.normalize_worker_identity(email_or_phone));
create index if not exists idx_shop_memberships_user on public.shop_memberships (user_id);

-- Removed workers are kept (status 'removed') so activity history stays intact;
-- activity logs may be immutable (migration 018), which blocks deleting rows they reference.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.shop_memberships'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.shop_memberships drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.shop_memberships
  add constraint shop_memberships_status_check
  check (status in ('invited', 'active', 'suspended', 'removed'));

-- Hashes written by the old client-side flow (SHA-256) can never match bcrypt.
-- Those workers are reset to "invited"; the owner issues them a new code.
update public.shop_memberships
   set pin_hash = null,
       pin_salt = null,
       temp_code_hash = null,
       temp_code_expires_at = null,
       status = case when status = 'active' then 'invited' else status end,
       updated_at = now()
 where member_type = 'worker'
   and ((pin_hash is not null and pin_hash !~ '^\$2[abxy]\$')
     or (temp_code_hash is not null and temp_code_hash !~ '^\$2[abxy]\$'));

-- ----------------------------------------------------------------------------
-- 2. Worker sessions and sign-in attempts
-- ----------------------------------------------------------------------------
create table if not exists public.worker_sessions (
  session_id uuid primary key,              -- auth session id (JWT claim session_id)
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid not null references public.shop_memberships(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  session_version int not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists idx_worker_sessions_membership on public.worker_sessions (membership_id);
create index if not exists idx_worker_sessions_user on public.worker_sessions (auth_user_id);
alter table public.worker_sessions enable row level security;   -- no policies: functions only

create table if not exists public.worker_auth_attempts (
  id bigserial primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_worker_auth_attempts_ip on public.worker_auth_attempts (ip_hash, created_at desc);
alter table public.worker_auth_attempts enable row level security;  -- no policies: functions only

-- ----------------------------------------------------------------------------
-- 3. Permission helpers (017 signatures kept)
-- ----------------------------------------------------------------------------

-- Session id of the current request, from the verified JWT.
create or replace function public._request_session_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt()->>'session_id', '')::uuid;
$$;

-- True when the request comes from a worker account (set only by the service role).
create or replace function public._request_is_worker()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'worker';
$$;

-- Internal: the membership a valid worker session grants in a shop, or null.
-- Not executable by clients (the row includes the PIN hash).
create or replace function public._worker_membership(p_shop_id uuid, p_user_id uuid)
returns public.shop_memberships
language sql
security definer
stable
set search_path = public
as $$
  select m.*
  from public.worker_sessions ws
  join public.shop_memberships m on m.id = ws.membership_id
  where ws.session_id = public._request_session_id()
    and ws.auth_user_id = p_user_id
    and ws.shop_id = p_shop_id
    and m.shop_id = p_shop_id
    and m.user_id = p_user_id
    and m.member_type = 'worker'
    and m.status = 'active'
    and ws.session_version = m.session_version
    and ws.last_seen_at > now() - interval '30 minutes'
  limit 1;
$$;

-- For policies and the app: the caller's own worker membership id in a shop.
create or replace function public.current_worker_member_id(p_shop_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select (public._worker_membership(p_shop_id, auth.uid())).id;
$$;

create or replace function public.is_active_shop_member(p_shop_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  -- Clients may only ask about themselves.
  if p_user_id is null or p_user_id is distinct from auth.uid() then
    return false;
  end if;
  return exists (select 1 from public.shops where id = p_shop_id and owner_id = p_user_id)
      or (public._worker_membership(p_shop_id, p_user_id)).id is not null;
end;
$$;

create or replace function public.has_shop_permission(
  p_shop_id uuid,
  p_user_id uuid,
  p_module text,
  p_action text default null
)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_perms jsonb;
begin
  -- Clients may only ask about themselves.
  if p_user_id is null or p_user_id is distinct from auth.uid() then
    return false;
  end if;

  if exists (select 1 from public.shops where id = p_shop_id and owner_id = p_user_id) then
    return true;
  end if;

  v_perms := (public._worker_membership(p_shop_id, p_user_id)).permissions;
  if v_perms is null then
    return false;
  end if;
  if coalesce((v_perms->>'all')::boolean, false) then
    return true;
  end if;
  if p_action is not null then
    return coalesce((v_perms->p_module->>p_action)::boolean, false);
  end if;
  return coalesce((v_perms->>p_module)::boolean, false);
end;
$$;

-- Shorthand used by the policies below.
create or replace function public.can(p_shop_id uuid, p_module text, p_action text default null)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_shop_permission(p_shop_id, auth.uid(), p_module, p_action);
$$;

create or replace function public.can_manage_staff(p_shop_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_shop_permission(p_shop_id, auth.uid(), 'staffManagement');
$$;

create or replace function public._is_shop_owner_caller(p_shop_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.shops where id = p_shop_id and owner_id = auth.uid());
$$;

-- Permissions that only the owner may hand out or change.
create or replace function public._is_privileged(p_permissions jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce((p_permissions->>'staffManagement')::boolean, false)
      or coalesce((p_permissions->>'settings')::boolean, false)
      or coalesce((p_permissions->>'all')::boolean, false);
$$;

-- ----------------------------------------------------------------------------
-- 4. Sign-in (called only by the worker-auth Edge Function, service role)
-- ----------------------------------------------------------------------------

-- Records a failed attempt; locks the membership for 15 minutes after 5.
-- Both are written to the activity log (never the PIN or code itself).
create or replace function public._worker_fail_attempt(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.shop_memberships;
  v_locked boolean;
begin
  update public.shop_memberships
    set failed_attempts = case when failed_attempts + 1 >= 5 then 0 else failed_attempts + 1 end,
        locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
        updated_at = now()
    where id = p_member_id
    returning * into v_member;
  if v_member.id is null then
    return;
  end if;

  v_locked := v_member.locked_until is not null and v_member.locked_until > now() and v_member.failed_attempts = 0;
  insert into public.worker_activity_logs (shop_id, worker_id, worker_name, action, category)
  values (
    v_member.shop_id, v_member.id, v_member.name,
    case when v_locked then 'Locked for 15 minutes after 5 failed attempts' else 'Failed sign-in attempt' end,
    'security'
  );
end;
$$;

-- At most 30 sign-in attempts per client address per 15 minutes.
create or replace function public._worker_rate_limited(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.worker_auth_attempts where created_at < now() - interval '1 day';
  select count(*) into v_count from public.worker_auth_attempts
    where ip_hash = coalesce(p_ip_hash, 'unknown') and created_at > now() - interval '15 minutes';
  insert into public.worker_auth_attempts (ip_hash) values (coalesce(p_ip_hash, 'unknown'));
  return v_count >= 30;
end;
$$;

-- Returns jsonb rather than raising so failed-attempt counts are not rolled back.
-- status: ok | invalid | locked | suspended | rate_limited | choose_shop
-- An unknown identity, a wrong PIN and an account without a PIN all return
-- "invalid" after the same bcrypt work, so responses don't reveal who exists.
create or replace function public.worker_auth_verify_pin(
  p_identity text,
  p_pin text,
  p_shop_id uuid default null,
  p_ip_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member public.shop_memberships;
  v_matches public.shop_memberships[] := '{}';
  v_any_locked boolean := false;
  v_checked boolean := false;
begin
  if public._worker_rate_limited(p_ip_hash) then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  if coalesce(p_pin, '') !~ '^\d{4}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  for v_member in
    select * from public.shop_memberships
    where member_type = 'worker'
      and status <> 'removed'
      and public.normalize_worker_identity(email_or_phone) = public.normalize_worker_identity(p_identity)
      and (p_shop_id is null or shop_id = p_shop_id)
    for update
  loop
    if v_member.locked_until is not null and v_member.locked_until > now() then
      v_any_locked := true;
      continue;
    end if;
    if v_member.pin_hash is null then
      continue;
    end if;
    v_checked := true;
    if v_member.pin_hash = extensions.crypt(p_pin, v_member.pin_hash) then
      v_matches := v_matches || v_member;
    else
      perform public._worker_fail_attempt(v_member.id);
    end if;
  end loop;

  if not v_checked then
    -- Equalise timing with a real bcrypt comparison.
    perform extensions.crypt(p_pin, '$2a$08$0123456789abcdefghijkl');
  end if;

  if array_length(v_matches, 1) is null then
    return jsonb_build_object('status', case when v_any_locked then 'locked' else 'invalid' end);
  end if;

  if array_length(v_matches, 1) > 1 then
    return jsonb_build_object(
      'status', 'choose_shop',
      'shops', (
        select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name))
        from unnest(v_matches) m join public.shops s on s.id = m.shop_id
      )
    );
  end if;

  v_member := v_matches[1];
  if v_member.status = 'suspended' then
    return jsonb_build_object('status', 'suspended');
  end if;

  update public.shop_memberships set failed_attempts = 0, locked_until = null where id = v_member.id;
  return jsonb_build_object(
    'status', 'ok',
    'membershipId', v_member.id,
    'userId', v_member.user_id
  );
end;
$$;

-- First-time activation with the owner's one-time code; sets the PIN.
-- status: ok | invalid | locked | suspended | bad_pin | rate_limited
create or replace function public.worker_auth_activate(
  p_identity text,
  p_code text,
  p_new_pin text,
  p_shop_id uuid default null,
  p_ip_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member public.shop_memberships;
  v_match public.shop_memberships;
  v_any_locked boolean := false;
  v_checked boolean := false;
begin
  if public._worker_rate_limited(p_ip_hash) then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  if coalesce(p_new_pin, '') !~ '^\d{4}$' then
    return jsonb_build_object('status', 'bad_pin');
  end if;
  if coalesce(p_code, '') !~ '^\d{6}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  for v_member in
    select * from public.shop_memberships
    where member_type = 'worker'
      and status <> 'removed'
      and temp_code_hash is not null
      and public.normalize_worker_identity(email_or_phone) = public.normalize_worker_identity(p_identity)
      and (p_shop_id is null or shop_id = p_shop_id)
    for update
  loop
    if v_member.locked_until is not null and v_member.locked_until > now() then
      v_any_locked := true;
      continue;
    end if;
    v_checked := true;
    if v_member.temp_code_expires_at is not null
       and v_member.temp_code_expires_at > now()
       and v_member.temp_code_hash = extensions.crypt(p_code, v_member.temp_code_hash) then
      v_match := v_member;
      exit;
    end if;
    perform public._worker_fail_attempt(v_member.id);
  end loop;

  if not v_checked then
    perform extensions.crypt(p_code, '$2a$08$0123456789abcdefghijkl');
  end if;

  if v_match.id is null then
    return jsonb_build_object('status', case when v_any_locked then 'locked' else 'invalid' end);
  end if;
  if v_match.status = 'suspended' then
    return jsonb_build_object('status', 'suspended');
  end if;

  update public.shop_memberships
    set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf', 10)),
        pin_salt = null,
        temp_code_hash = null,           -- one-time: the code is spent
        temp_code_expires_at = null,
        status = 'active',
        failed_attempts = 0,
        locked_until = null,
        updated_at = now()
    where id = v_match.id;

  return jsonb_build_object('status', 'ok', 'membershipId', v_match.id, 'userId', v_match.user_id);
end;
$$;

-- Links the worker's auth user to the membership (first sign-in only).
create or replace function public.worker_auth_link_user(p_membership_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shop_memberships
    set user_id = p_user_id, updated_at = now()
    where id = p_membership_id and member_type = 'worker' and (user_id is null or user_id = p_user_id);
  if not found then
    raise exception 'Membership already linked to another user' using errcode = 'P0001';
  end if;
end;
$$;

-- Records the issued auth session for the membership; returns the worker profile.
create or replace function public.worker_auth_open_session(
  p_membership_id uuid,
  p_session_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.shop_memberships;
begin
  select * into v_member from public.shop_memberships
    where id = p_membership_id and user_id = p_user_id and status = 'active' and member_type = 'worker';
  if v_member.id is null then
    raise exception 'Worker is not active' using errcode = 'P0001';
  end if;

  insert into public.worker_sessions (session_id, auth_user_id, membership_id, shop_id, session_version, last_seen_at)
  values (p_session_id, p_user_id, v_member.id, v_member.shop_id, v_member.session_version, now())
  on conflict (session_id) do update
    set session_version = excluded.session_version, last_seen_at = now();

  update public.shop_memberships set last_active_at = now() where id = v_member.id;

  insert into public.worker_activity_logs (shop_id, worker_id, worker_name, action, category)
  values (v_member.shop_id, v_member.id, v_member.name, 'Signed in', 'access');

  return jsonb_build_object(
    'id', v_member.id,
    'shopId', v_member.shop_id,
    'name', v_member.name,
    'emailOrPhone', v_member.email_or_phone,
    'status', v_member.status,
    'permissions', v_member.permissions,
    'sessionVersion', v_member.session_version
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Worker session upkeep (called by the signed-in worker app)
-- ----------------------------------------------------------------------------

-- Validates the current session and returns current permissions.
-- p_extend = true only when the worker was actually active, so an idle device
-- still expires after 30 minutes.
-- reason when not ok: inactivity | revoked | suspended | removed | none
create or replace function public.worker_touch(p_extend boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ws public.worker_sessions;
  v_member public.shop_memberships;
  v_reason text;
begin
  select * into v_ws from public.worker_sessions
    where session_id = public._request_session_id() and auth_user_id = auth.uid();
  if v_ws.session_id is null then
    return jsonb_build_object('ok', false, 'reason', 'none');
  end if;

  select * into v_member from public.shop_memberships where id = v_ws.membership_id;
  v_reason := case
    when v_member.id is null or v_member.status = 'removed' then 'removed'
    when v_member.status = 'suspended' then 'suspended'
    when v_member.status <> 'active' or v_ws.session_version <> v_member.session_version then 'revoked'
    when v_ws.last_seen_at <= now() - interval '30 minutes' then 'inactivity'
    else null
  end;

  if v_reason is not null then
    delete from public.worker_sessions where session_id = v_ws.session_id;
    return jsonb_build_object('ok', false, 'reason', v_reason);
  end if;

  if p_extend then
    update public.worker_sessions set last_seen_at = now() where session_id = v_ws.session_id;
    update public.shop_memberships set last_active_at = now() where id = v_member.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'worker', jsonb_build_object(
      'id', v_member.id,
      'shopId', v_member.shop_id,
      'name', v_member.name,
      'emailOrPhone', v_member.email_or_phone,
      'status', v_member.status,
      'permissions', v_member.permissions,
      'sessionVersion', v_member.session_version
    )
  );
end;
$$;

create or replace function public.worker_logout()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ws public.worker_sessions;
begin
  delete from public.worker_sessions
  where session_id = public._request_session_id() and auth_user_id = auth.uid()
  returning * into v_ws;
  if v_ws.session_id is not null then
    insert into public.worker_activity_logs (shop_id, worker_id, worker_name, action, category)
    select m.shop_id, m.id, m.name, 'Signed out', 'access'
    from public.shop_memberships m where m.id = v_ws.membership_id;
  end if;
end;
$$;

-- Activity entry for the caller (owner or worker); identity comes from the
-- session, never from the client.
create or replace function public.log_shop_activity(
  p_shop_id uuid,
  p_action text,
  p_category text,
  p_amount numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.shop_memberships;
begin
  if public._is_shop_owner_caller(p_shop_id) then
    insert into public.worker_activity_logs (shop_id, worker_id, worker_name, action, category, amount)
    values (p_shop_id, null, 'Shop Owner', left(p_action, 300), p_category, p_amount);
    return;
  end if;

  v_member := public._worker_membership(p_shop_id, auth.uid());
  if v_member.id is null then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  insert into public.worker_activity_logs (shop_id, worker_id, worker_name, action, category, amount)
  values (p_shop_id, v_member.id, v_member.name, left(p_action, 300), p_category, p_amount);
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Staff management (owner, or a worker with staffManagement)
-- ----------------------------------------------------------------------------

-- 6-digit one-time code from a CSPRNG.
create or replace function public._new_activation_code()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select lpad((abs(('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::int::bigint) % 1000000)::text, 6, '0');
$$;

-- Loads a worker the caller may manage. Privileged workers (staff management,
-- settings, all) can only be managed by the owner.
create or replace function public._staff_member_for_manager(p_member_id uuid)
returns public.shop_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.shop_memberships;
begin
  select * into v_member from public.shop_memberships
    where id = p_member_id and member_type = 'worker' and status <> 'removed'
    for update;
  if v_member.id is null or not public.can_manage_staff(v_member.shop_id) then
    raise exception 'Worker not found' using errcode = 'P0002';
  end if;
  if public._is_privileged(v_member.permissions) and not public._is_shop_owner_caller(v_member.shop_id) then
    raise exception 'Only the shop owner can manage this worker' using errcode = '42501';
  end if;
  return v_member;
end;
$$;

-- A non-owner manager may only grant permissions they hold themselves, and
-- never staff management or settings.
create or replace function public._check_permission_grant(p_shop_id uuid, p_permissions jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_val jsonb;
  v_action text;
  v_flag jsonb;
begin
  if p_permissions is null or public._is_shop_owner_caller(p_shop_id) then
    return;
  end if;
  if public._is_privileged(p_permissions) then
    raise exception 'Only the shop owner can grant staff management or settings access' using errcode = '42501';
  end if;
  for v_key, v_val in select * from jsonb_each(p_permissions) loop
    if jsonb_typeof(v_val) = 'object' then
      for v_action, v_flag in select * from jsonb_each(v_val) loop
        if v_flag = 'true'::jsonb and not public.can(p_shop_id, v_key, v_action) then
          raise exception 'You cannot grant a permission you do not have' using errcode = '42501';
        end if;
      end loop;
    elsif v_val = 'true'::jsonb and not public.can(p_shop_id, v_key) then
      raise exception 'You cannot grant a permission you do not have' using errcode = '42501';
    end if;
  end loop;
end;
$$;

-- Safe columns only: no hashes.
create or replace function public.staff_list(p_shop_id uuid)
returns table (
  id uuid,
  shop_id uuid,
  name text,
  email_or_phone text,
  status text,
  permissions jsonb,
  has_pin boolean,
  code_expires_at timestamptz,
  session_version int,
  sessions_revoked_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.can_manage_staff(p_shop_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
    select m.id, m.shop_id, m.name, m.email_or_phone, m.status, m.permissions,
           m.pin_hash is not null, m.temp_code_expires_at, m.session_version,
           m.sessions_revoked_at, m.last_active_at, m.created_at
    from public.shop_memberships m
    where m.shop_id = p_shop_id and m.member_type = 'worker' and m.status <> 'removed'
    order by m.created_at;
end;
$$;

create or replace function public.staff_add(
  p_shop_id uuid,
  p_name text,
  p_identity text,
  p_permissions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text := public._new_activation_code();
  v_id uuid;
begin
  if not public.can_manage_staff(p_shop_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  perform public._check_permission_grant(p_shop_id, p_permissions);
  if trim(coalesce(p_name, '')) = '' or public.normalize_worker_identity(p_identity) = '' then
    raise exception 'Name and email or phone are required' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.shop_memberships
    where shop_id = p_shop_id
      and public.normalize_worker_identity(email_or_phone) = public.normalize_worker_identity(p_identity)
  ) then
    raise exception 'A worker with this email or phone already exists in this shop' using errcode = '23505';
  end if;

  insert into public.shop_memberships (
    shop_id, member_type, name, email_or_phone, status, permissions,
    temp_code_hash, temp_code_expires_at
  ) values (
    p_shop_id, 'worker', trim(p_name), public.normalize_worker_identity(p_identity), 'invited',
    coalesce(p_permissions, '{}'::jsonb),
    extensions.crypt(v_code, extensions.gen_salt('bf', 10)), now() + interval '48 hours'
  ) returning id into v_id;

  perform public.log_shop_activity(p_shop_id, 'Added worker ' || trim(p_name), 'security');
  return jsonb_build_object('workerId', v_id, 'code', v_code);
end;
$$;

-- p_status: 'active' or 'suspended'. Reactivating someone without a PIN puts
-- them back to 'invited'. Null arguments leave a field unchanged.
create or replace function public.staff_update(
  p_member_id uuid,
  p_name text default null,
  p_identity text default null,
  p_permissions jsonb default null,
  p_status text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.shop_memberships := public._staff_member_for_manager(p_member_id);
begin
  perform public._check_permission_grant(v_member.shop_id, p_permissions);
  if p_status is not null and p_status not in ('active', 'suspended', 'invited') then
    raise exception 'Invalid status' using errcode = 'P0001';
  end if;
  if p_identity is not null and exists (
    select 1 from public.shop_memberships
    where shop_id = v_member.shop_id and id <> v_member.id
      and public.normalize_worker_identity(email_or_phone) = public.normalize_worker_identity(p_identity)
  ) then
    raise exception 'A worker with this email or phone already exists in this shop' using errcode = '23505';
  end if;

  update public.shop_memberships set
    name = coalesce(nullif(trim(p_name), ''), name),
    email_or_phone = coalesce(nullif(public.normalize_worker_identity(p_identity), ''), email_or_phone),
    permissions = coalesce(p_permissions, permissions),
    status = case
      when p_status is null then status
      when p_status in ('active', 'invited') and pin_hash is null then 'invited'
      when p_status in ('active', 'invited') then 'active'
      else p_status
    end,
    updated_at = now()
  where id = v_member.id;

  if p_status = 'suspended' then
    delete from public.worker_sessions where membership_id = v_member.id;
  end if;

  if p_permissions is not null and p_permissions is distinct from v_member.permissions then
    perform public.log_shop_activity(v_member.shop_id, 'Changed permissions for ' || v_member.name, 'security');
  end if;
  if p_status is not null and p_status is distinct from v_member.status then
    perform public.log_shop_activity(
      v_member.shop_id,
      case when p_status = 'suspended' then 'Suspended ' else 'Reactivated ' end || v_member.name,
      'security'
    );
  end if;
end;
$$;

-- New one-time code (48 h). reset_pin also clears the PIN and signs them out.
create or replace function public.staff_new_code(p_member_id uuid, p_reset_pin boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member public.shop_memberships := public._staff_member_for_manager(p_member_id);
  v_code text := public._new_activation_code();
begin
  update public.shop_memberships set
    temp_code_hash = extensions.crypt(v_code, extensions.gen_salt('bf', 10)),
    temp_code_expires_at = now() + interval '48 hours',
    failed_attempts = 0,
    locked_until = null,
    pin_hash = case when p_reset_pin then null else pin_hash end,
    status = case when p_reset_pin and status <> 'suspended' then 'invited' else status end,
    session_version = case when p_reset_pin then session_version + 1 else session_version end,
    sessions_revoked_at = case when p_reset_pin then now() else sessions_revoked_at end,
    updated_at = now()
  where id = v_member.id;

  if p_reset_pin then
    delete from public.worker_sessions where membership_id = v_member.id;
  end if;
  perform public.log_shop_activity(
    v_member.shop_id,
    case when p_reset_pin then 'Reset PIN for ' else 'New activation code for ' end || v_member.name,
    'security'
  );
  return jsonb_build_object('workerId', v_member.id, 'code', v_code);
end;
$$;

create or replace function public.staff_revoke_sessions(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.shop_memberships := public._staff_member_for_manager(p_member_id);
begin
  update public.shop_memberships
    set session_version = session_version + 1, sessions_revoked_at = now(), updated_at = now()
    where id = v_member.id;
  delete from public.worker_sessions where membership_id = v_member.id;
  perform public.log_shop_activity(v_member.shop_id, 'Signed out ' || v_member.name || ' on all devices', 'security');
end;
$$;

-- Soft removal: frees the email/phone for re-use and keeps the history.
create or replace function public.staff_remove(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.shop_memberships := public._staff_member_for_manager(p_member_id);
begin
  perform public.log_shop_activity(v_member.shop_id, 'Removed worker ' || v_member.name, 'security');
  update public.shop_memberships set
    status = 'removed',
    email_or_phone = 'removed:' || id::text,
    pin_hash = null,
    pin_salt = null,
    temp_code_hash = null,
    temp_code_expires_at = null,
    permissions = '{}'::jsonb,
    session_version = session_version + 1,
    sessions_revoked_at = now(),
    updated_at = now()
  where id = v_member.id;
  delete from public.worker_sessions where membership_id = v_member.id;
end;
$$;

create or replace function public.staff_activity(
  p_shop_id uuid,
  p_member_id uuid default null,
  p_limit int default 200
)
returns setof public.worker_activity_logs
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.can_manage_staff(p_shop_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
    select * from public.worker_activity_logs
    where shop_id = p_shop_id and (p_member_id is null or worker_id = p_member_id)
    order by created_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end;
$$;

-- The 017 PIN function trusted a client-made hash; retire it.
drop function if exists public.authenticate_worker_pin(uuid, text, text);

-- ----------------------------------------------------------------------------
-- 7. Sales, payments and stock through checked functions
-- ----------------------------------------------------------------------------
-- record_sale / record_payment (016) keep their bodies; the originals become
-- internal and a permission-checked wrapper takes their name.
do $$
begin
  if to_regprocedure('public._record_sale_impl(uuid,uuid,text,numeric,numeric,numeric,numeric,numeric,text,text,text,jsonb)') is null then
    alter function public.record_sale(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb)
      rename to _record_sale_impl;
  end if;
  if to_regprocedure('public._record_payment_impl(uuid,uuid,numeric,text,text,text,text)') is null then
    alter function public.record_payment(uuid, uuid, numeric, text, text, text, text)
      rename to _record_payment_impl;
  end if;
end $$;

-- The wrappers below take an extra request id. After the rename, the old
-- signatures only exist if an earlier draft of this migration created them.
drop function if exists public.record_sale(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb);
drop function if exists public.record_payment(uuid, uuid, numeric, text, text, text, text);

alter function public._record_sale_impl(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb)
  security definer set search_path = public;
alter function public._record_payment_impl(uuid, uuid, numeric, text, text, text, text)
  security definer set search_path = public;

-- A repeated submission (double tap, retry after a timeout) carries the same
-- request id and returns the first result instead of recording twice.
create table if not exists public.financial_requests (
  request_id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  kind text not null check (kind in ('sale', 'payment')),
  result_id uuid,
  created_at timestamptz not null default now()
);
alter table public.financial_requests enable row level security;  -- no policies: functions only

-- Returns the earlier result for this request id, or null after claiming it.
-- A concurrent duplicate waits on the claim and then sees the result.
create or replace function public._claim_financial_request(p_request_id uuid, p_shop_id uuid, p_kind text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.financial_requests;
begin
  if p_request_id is null then
    return null;
  end if;
  insert into public.financial_requests (request_id, shop_id, kind)
  values (p_request_id, p_shop_id, p_kind)
  on conflict (request_id) do nothing;
  if found then
    return null;
  end if;

  select * into v_existing from public.financial_requests where request_id = p_request_id;
  if v_existing.shop_id <> p_shop_id or v_existing.kind <> p_kind or v_existing.result_id is null then
    raise exception 'This request id was already used' using errcode = 'P0001';
  end if;
  return v_existing.result_id;
end;
$$;

-- Totals must add up: item total = quantity x unit price, subtotal = sum of
-- items, total = subtotal - discount + tax (to the paisa).
create or replace function public._check_sale_totals(
  p_subtotal numeric,
  p_tax_amount numeric,
  p_discount_amount numeric,
  p_total_amount numeric,
  p_items jsonb
)
returns void
language plpgsql
immutable
as $$
declare
  v_item jsonb;
  v_sum numeric := 0;
begin
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'A sale must contain at least one item' using errcode = 'P0001';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item->>'quantity') is null or (v_item->>'unitPrice') is null or (v_item->>'totalPrice') is null
       or (v_item->>'unitPrice')::numeric < 0
       or abs((v_item->>'totalPrice')::numeric
              - (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric) > 0.01 then
      raise exception 'Sale item total does not match quantity x price' using errcode = 'P0001';
    end if;
    v_sum := v_sum + (v_item->>'totalPrice')::numeric;
  end loop;

  if abs(coalesce(p_subtotal, 0) - v_sum) > 0.01
     or coalesce(p_discount_amount, 0) < 0
     or coalesce(p_discount_amount, 0) > coalesce(p_subtotal, 0) + 0.01
     or coalesce(p_tax_amount, 0) < 0
     or abs(coalesce(p_total_amount, 0)
            - (coalesce(p_subtotal, 0) - coalesce(p_discount_amount, 0) + coalesce(p_tax_amount, 0))) > 0.01 then
    raise exception 'Sale totals do not add up' using errcode = 'P0001';
  end if;
end;
$$;

-- p_request_id is optional; the app sends one per submission.
create or replace function public.record_sale(
  p_shop_id uuid,
  p_customer_id uuid,
  p_invoice_no text,
  p_subtotal numeric,
  p_tax_amount numeric,
  p_discount_amount numeric,
  p_total_amount numeric,
  p_amount_paid numeric,
  p_payment_method text,
  p_bill_image_url text,
  p_notes text,
  p_items jsonb,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
begin
  if not public.can(p_shop_id, 'sales', 'create') then
    raise exception 'You do not have permission to record sales' using errcode = '42501';
  end if;
  v_sale_id := public._claim_financial_request(p_request_id, p_shop_id, 'sale');
  if v_sale_id is not null then
    return v_sale_id;
  end if;

  perform public._check_sale_totals(p_subtotal, p_tax_amount, p_discount_amount, p_total_amount, p_items);
  v_sale_id := public._record_sale_impl(
    p_shop_id, p_customer_id, p_invoice_no, p_subtotal, p_tax_amount, p_discount_amount,
    p_total_amount, p_amount_paid, p_payment_method, p_bill_image_url, p_notes, p_items
  );

  if p_request_id is not null then
    update public.financial_requests set result_id = v_sale_id where request_id = p_request_id;
  end if;
  perform public.log_shop_activity(
    p_shop_id, 'Created sale ' || coalesce(p_invoice_no, '') || ' (' || jsonb_array_length(p_items) || ' items)',
    'sale', p_total_amount
  );
  return v_sale_id;
end;
$$;

create or replace function public.record_payment(
  p_shop_id uuid,
  p_customer_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference_no text,
  p_proof_image_url text,
  p_notes text,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
begin
  if not public.can(p_shop_id, 'payments', 'receive') then
    raise exception 'You do not have permission to receive payments' using errcode = '42501';
  end if;
  v_payment_id := public._claim_financial_request(p_request_id, p_shop_id, 'payment');
  if v_payment_id is not null then
    return v_payment_id;
  end if;

  v_payment_id := public._record_payment_impl(
    p_shop_id, p_customer_id, p_amount, p_payment_method, p_reference_no, p_proof_image_url, p_notes
  );

  if p_request_id is not null then
    update public.financial_requests set result_id = v_payment_id where request_id = p_request_id;
  end if;
  perform public.log_shop_activity(
    p_shop_id, 'Received payment (' || upper(coalesce(p_payment_method, 'cash')) || ')', 'payment', p_amount
  );
  return v_payment_id;
end;
$$;

-- Manual stock adjustment: changes stock_qty only and records the movement.
create or replace function public.adjust_stock(
  p_shop_id uuid,
  p_product_id uuid,
  p_delta numeric,
  p_reason text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new numeric;
begin
  if not public.can(p_shop_id, 'inventory', 'adjustStock') then
    raise exception 'You do not have permission to adjust stock' using errcode = '42501';
  end if;
  if coalesce(p_delta, 0) = 0 then
    raise exception 'Adjustment must not be zero' using errcode = 'P0001';
  end if;

  update public.products
    set stock_qty = greatest(0, stock_qty + p_delta), updated_at = now()
    where id = p_product_id and shop_id = p_shop_id
    returning stock_qty into v_new;
  if v_new is null then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  insert into public.stock_movements (shop_id, product_id, type, quantity, reason)
  values (p_shop_id, p_product_id, case when p_delta > 0 then 'in' else 'out' end,
          abs(p_delta), coalesce(nullif(trim(p_reason), ''), 'Manual stock adjustment'));
  return v_new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. Cost prices: owner and viewProfit only
-- ----------------------------------------------------------------------------
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  updated_at timestamptz not null default now()
);
create index if not exists idx_product_costs_shop on public.product_costs (shop_id);
alter table public.product_costs enable row level security;

-- Move existing costs over, then stop storing them on products.
insert into public.product_costs (product_id, shop_id, cost_price)
select id, shop_id, coalesce(cost_price, 0) from public.products
on conflict (product_id) do nothing;

update public.products set cost_price = 0 where cost_price <> 0;

-- Anything written to products.cost_price is moved into product_costs (when the
-- writer may see costs) and the column is cleared, so products never exposes it.
create or replace function public._store_product_cost(p_product_id uuid, p_shop_id uuid, p_cost numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.can(p_shop_id, 'viewProfit') then
    insert into public.product_costs (product_id, shop_id, cost_price, updated_at)
    values (p_product_id, p_shop_id, p_cost, now())
    on conflict (product_id) do update set cost_price = excluded.cost_price, updated_at = now();
  end if;
end;
$$;

-- Updates: BEFORE, so the column is cleared in the same write.
create or replace function public.route_product_cost_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.cost_price, 0) <> 0 then
    perform public._store_product_cost(new.id, new.shop_id, new.cost_price);
    new.cost_price := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_route_product_cost_on_update on public.products;
create trigger trg_route_product_cost_on_update
  before update on public.products
  for each row execute function public.route_product_cost_on_update();

-- Inserts: AFTER (product_costs references the new row), then clear the column.
create or replace function public.route_product_cost_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._store_product_cost(new.id, new.shop_id, new.cost_price);
  update public.products set cost_price = 0 where id = new.id;
  return null;
end;
$$;

drop trigger if exists trg_route_product_cost_on_insert on public.products;
create trigger trg_route_product_cost_on_insert
  after insert on public.products
  for each row when (new.cost_price <> 0)
  execute function public.route_product_cost_on_insert();

drop policy if exists product_costs_select on public.product_costs;
create policy product_costs_select on public.product_costs for select to authenticated
  using (public.can(shop_id, 'viewProfit'));
drop policy if exists product_costs_insert on public.product_costs;
create policy product_costs_insert on public.product_costs for insert to authenticated
  with check (public.can(shop_id, 'viewProfit') and public.can(shop_id, 'inventory', 'edit'));
drop policy if exists product_costs_update on public.product_costs;
create policy product_costs_update on public.product_costs for update to authenticated
  using (public.can(shop_id, 'viewProfit') and public.can(shop_id, 'inventory', 'edit'))
  with check (public.can(shop_id, 'viewProfit') and public.can(shop_id, 'inventory', 'edit'));

-- ----------------------------------------------------------------------------
-- 9. Column guards for direct edits by workers
-- ----------------------------------------------------------------------------
-- Balances change only through record_sale / record_payment / ledger
-- functions; stock only through sales or adjust_stock. Those run as the
-- function owner, so these guards only affect direct client edits.
create or replace function public.guard_worker_customer_update()
returns trigger
language plpgsql
security invoker
as $$
begin
  if current_user not in ('authenticated', 'anon') or public._is_shop_owner_caller(new.shop_id) then
    return new;
  end if;
  if new.current_balance is distinct from old.current_balance then
    raise exception 'Balances can only change through sales and payments' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_worker_customer_update on public.customers;
create trigger trg_guard_worker_customer_update
  before update on public.customers
  for each row execute function public.guard_worker_customer_update();

create or replace function public.guard_worker_product_update()
returns trigger
language plpgsql
security invoker
as $$
begin
  if current_user not in ('authenticated', 'anon') or public._is_shop_owner_caller(new.shop_id) then
    return new;
  end if;
  if new.stock_qty is distinct from old.stock_qty then
    raise exception 'Stock can only change through sales or a stock adjustment' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_worker_product_update on public.products;
create trigger trg_guard_worker_product_update
  before update on public.products
  for each row execute function public.guard_worker_product_update();

-- ----------------------------------------------------------------------------
-- 10. RLS: worker policies (owner policies from earlier migrations stay)
-- ----------------------------------------------------------------------------
-- 018 policies built on a helper that does not match this schema.
drop policy if exists customers_read on public.customers;
drop policy if exists customers_write on public.customers;
drop policy if exists products_read on public.products;
drop policy if exists products_write on public.products;
drop policy if exists sales_read on public.sales;
drop policy if exists sales_insert on public.sales;
drop policy if exists ledger_read on public.ledger_entries;
drop policy if exists ledger_insert on public.ledger_entries;

-- shops: a worker can read their own shop, never change it.
drop policy if exists worker_shops_select on public.shops;
create policy worker_shops_select on public.shops for select to authenticated
  using (public.current_worker_member_id(id) is not null);

-- customers (balances: see guard above)
drop policy if exists worker_customers_select on public.customers;
create policy worker_customers_select on public.customers for select to authenticated
  using (public.can(shop_id, 'customers', 'view') or public.can(shop_id, 'sales', 'create') or public.can(shop_id, 'payments', 'receive'));
drop policy if exists worker_customers_insert on public.customers;
create policy worker_customers_insert on public.customers for insert to authenticated
  with check (public.can(shop_id, 'customers', 'add') and coalesce(current_balance, 0) = 0);
drop policy if exists worker_customers_update on public.customers;
create policy worker_customers_update on public.customers for update to authenticated
  using (public.can(shop_id, 'customers', 'edit')) with check (public.can(shop_id, 'customers', 'edit'));

-- categories
drop policy if exists worker_categories_select on public.categories;
create policy worker_categories_select on public.categories for select to authenticated
  using (public.can(shop_id, 'inventory', 'view') or public.can(shop_id, 'sales', 'create'));
drop policy if exists worker_categories_insert on public.categories;
create policy worker_categories_insert on public.categories for insert to authenticated
  with check (public.can(shop_id, 'inventory', 'add'));
drop policy if exists worker_categories_update on public.categories;
create policy worker_categories_update on public.categories for update to authenticated
  using (public.can(shop_id, 'inventory', 'edit')) with check (public.can(shop_id, 'inventory', 'edit'));

-- products (stock: see guard above; cost: product_costs)
drop policy if exists worker_products_select on public.products;
create policy worker_products_select on public.products for select to authenticated
  using (public.can(shop_id, 'inventory', 'view') or public.can(shop_id, 'sales', 'create'));
drop policy if exists worker_products_insert on public.products;
create policy worker_products_insert on public.products for insert to authenticated
  with check (public.can(shop_id, 'inventory', 'add'));
drop policy if exists worker_products_update on public.products;
create policy worker_products_update on public.products for update to authenticated
  using (public.can(shop_id, 'inventory', 'edit')) with check (public.can(shop_id, 'inventory', 'edit'));

-- sales, sale_items, payments, ledger, stock: read only for workers; writes go
-- through record_sale / record_payment / adjust_stock.
drop policy if exists worker_sales_select on public.sales;
create policy worker_sales_select on public.sales for select to authenticated
  using (public.can(shop_id, 'sales', 'view'));

drop policy if exists worker_sale_items_select on public.sale_items;
create policy worker_sale_items_select on public.sale_items for select to authenticated
  using (exists (select 1 from public.sales s where s.id = sale_id and public.can(s.shop_id, 'sales', 'view')));

drop policy if exists worker_payments_select on public.payments;
create policy worker_payments_select on public.payments for select to authenticated
  using (public.can(shop_id, 'payments', 'view'));

drop policy if exists worker_ledger_select on public.ledger_entries;
create policy worker_ledger_select on public.ledger_entries for select to authenticated
  using (public.can(shop_id, 'customers', 'ledger'));

drop policy if exists worker_stock_select on public.stock_movements;
create policy worker_stock_select on public.stock_movements for select to authenticated
  using (public.can(shop_id, 'inventory', 'view'));

-- reports / notifications
drop policy if exists worker_reports_select on public.reports;
create policy worker_reports_select on public.reports for select to authenticated
  using (public.can(shop_id, 'reports'));
drop policy if exists worker_notifications_select on public.notifications;
create policy worker_notifications_select on public.notifications for select to authenticated
  using (public.can(shop_id, 'customers', 'view'));

-- worker_activity_logs: writes only through log_shop_activity()
drop policy if exists "Workers with access can insert activity logs" on public.worker_activity_logs;
drop policy if exists worker_activity_select on public.worker_activity_logs;
create policy worker_activity_select on public.worker_activity_logs for select to authenticated
  using (public.can_manage_staff(shop_id));

-- ----------------------------------------------------------------------------
-- 11. Worker and anonymous accounts can never act as owners
-- ----------------------------------------------------------------------------
drop policy if exists no_worker_shop_insert on public.shops;
create policy no_worker_shop_insert on public.shops as restrictive for insert to authenticated
  with check (not public._request_is_worker() and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

drop policy if exists no_worker_registration_insert on public.shop_registration_requests;
create policy no_worker_registration_insert on public.shop_registration_requests as restrictive for insert to authenticated
  with check (not public._request_is_worker() and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- ----------------------------------------------------------------------------
-- 12. rpc_submit_shop_registration: the owner is always the caller
-- ----------------------------------------------------------------------------
-- 021 trusted p_owner_id, so any signed-in user could rename another user's
-- shop or reset it to pending. The original becomes internal; the wrapper
-- forces p_owner_id = auth.uid() and refuses shops owned by someone else.
do $$
begin
  if to_regprocedure('public._rpc_submit_shop_registration_impl(uuid,uuid,text,text,text,text,text,text,text,text,text,double precision,double precision,text,text,text,text,text,text,text,text,text)') is null then
    alter function public.rpc_submit_shop_registration(
      uuid, uuid, text, text, text, text, text, text, text, text, text,
      double precision, double precision, text, text, text, text, text, text, text, text, text
    ) rename to _rpc_submit_shop_registration_impl;
  end if;
end $$;

alter function public._rpc_submit_shop_registration_impl(
  uuid, uuid, text, text, text, text, text, text, text, text, text,
  double precision, double precision, text, text, text, text, text, text, text, text, text
) set search_path = public;

create or replace function public.rpc_submit_shop_registration(
  p_shop_id uuid,
  p_owner_id uuid,
  p_name text,
  p_tagline text default null,
  p_business_type text default 'General Store',
  p_phone text default null,
  p_address text default null,
  p_landmark text default null,
  p_city text default null,
  p_state text default null,
  p_pincode text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_gstin text default null,
  p_pan text default null,
  p_upi_id text default null,
  p_logo_url text default null,
  p_currency text default 'INR',
  p_theme text default 'dark',
  p_language text default 'en',
  p_owner_email text default null,
  p_owner_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or public._request_is_worker()
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_owner_id is not null and p_owner_id is distinct from auth.uid() then
    raise exception 'You can only register a shop for your own account' using errcode = '42501';
  end if;
  if p_shop_id is not null and exists (
    select 1 from public.shops where id = p_shop_id and owner_id is distinct from auth.uid()
  ) then
    raise exception 'This shop belongs to another account' using errcode = '42501';
  end if;

  return public._rpc_submit_shop_registration_impl(
    p_shop_id, auth.uid(), p_name, p_tagline, p_business_type, p_phone, p_address, p_landmark,
    p_city, p_state, p_pincode, p_latitude, p_longitude, p_gstin, p_pan, p_upi_id, p_logo_url,
    p_currency, p_theme, p_language, p_owner_email, p_owner_name
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 13. Grants
-- ----------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  -- Internal: no client access.
  foreach fn in array array[
    'public._worker_membership(uuid, uuid)',
    'public._worker_fail_attempt(uuid)',
    'public._worker_rate_limited(text)',
    'public._new_activation_code()',
    'public._staff_member_for_manager(uuid)',
    'public._check_permission_grant(uuid, jsonb)',
    'public._store_product_cost(uuid, uuid, numeric)',
    'public._record_sale_impl(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb)',
    'public._record_payment_impl(uuid, uuid, numeric, text, text, text, text)',
    'public._claim_financial_request(uuid, uuid, text)',
    'public._check_sale_totals(numeric, numeric, numeric, numeric, jsonb)',
    'public._rpc_submit_shop_registration_impl(uuid, uuid, text, text, text, text, text, text, text, text, text, double precision, double precision, text, text, text, text, text, text, text, text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;

  -- Edge Function only (service role).
  foreach fn in array array[
    'public.worker_auth_verify_pin(text, text, uuid, text)',
    'public.worker_auth_activate(text, text, text, uuid, text)',
    'public.worker_auth_link_user(uuid, uuid)',
    'public.worker_auth_open_session(uuid, uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;

  -- Signed-in app users (owners and workers).
  foreach fn in array array[
    'public.is_active_shop_member(uuid, uuid)',
    'public.has_shop_permission(uuid, uuid, text, text)',
    'public.can(uuid, text, text)',
    'public.can_manage_staff(uuid)',
    'public.current_worker_member_id(uuid)',
    'public._is_shop_owner_caller(uuid)',
    'public.worker_touch(boolean)',
    'public.worker_logout()',
    'public.log_shop_activity(uuid, text, text, numeric)',
    'public.staff_list(uuid)',
    'public.staff_add(uuid, text, text, jsonb)',
    'public.staff_update(uuid, text, text, jsonb, text)',
    'public.staff_new_code(uuid, boolean)',
    'public.staff_revoke_sessions(uuid)',
    'public.staff_remove(uuid)',
    'public.staff_activity(uuid, uuid, int)',
    'public.record_sale(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb, uuid)',
    'public.record_payment(uuid, uuid, numeric, text, text, text, text, uuid)',
    'public.adjust_stock(uuid, uuid, numeric, text)',
    'public.rpc_submit_shop_registration(uuid, uuid, text, text, text, text, text, text, text, text, text, double precision, double precision, text, text, text, text, text, text, text, text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
