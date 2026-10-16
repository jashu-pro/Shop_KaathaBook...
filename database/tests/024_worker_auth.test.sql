-- ============================================================================
-- Tests for 024_worker_auth_and_rls.sql
-- ============================================================================
-- Run in the SQL editor of the TEST project only, after migrations 001-024.
-- Everything happens inside one transaction that is rolled back at the end,
-- so no rows are left behind. Each test raises "FAIL <id>: ..." on failure,
-- which stops the run; the last result row reads 'ALL 024 TESTS PASSED'.
--
-- Identities are simulated the way Supabase does it: role `authenticated`
-- plus request.jwt.claims (sub, session_id, app_metadata).
-- ============================================================================

begin;

-- ---------------------------------------------------------------- helpers
create function pg_temp.claims(p_sub uuid, p_session uuid default null, p_worker boolean default false)
returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', p_sub,
    'role', 'authenticated',
    'session_id', p_session,
    'app_metadata', case when p_worker then jsonb_build_object('role', 'worker') else '{}'::jsonb end
  )::text, true);
$$;

-- --------------------------------------------------------------- fixtures
-- users: owner A, owner B, worker W (shop A), manager M (shop A, staffManagement)
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'owner-a@test.invalid'),
  ('b0000000-0000-0000-0000-00000000000b', 'owner-b@test.invalid'),
  ('c0000000-0000-0000-0000-00000000000c', 'w-test@worker.test.invalid'),
  ('d0000000-0000-0000-0000-00000000000d', 'm-test@worker.test.invalid');

insert into public.profiles (id, email, full_name)
select id, email, 'Test' from auth.users
where id in ('a0000000-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-00000000000b',
             'c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d')
on conflict (id) do nothing;

insert into public.shops (id, owner_id, name, business_type, status) values
  ('aa000000-0000-0000-0000-0000000000aa', 'a0000000-0000-0000-0000-00000000000a', 'Test Shop A', 'Retail', 'active'),
  ('bb000000-0000-0000-0000-0000000000bb', 'b0000000-0000-0000-0000-00000000000b', 'Test Shop B', 'Retail', 'active');

insert into public.customers (id, shop_id, name, current_balance) values
  ('ca000000-0000-0000-0000-0000000000a1', 'aa000000-0000-0000-0000-0000000000aa', 'Cust A1', 500),
  ('ca000000-0000-0000-0000-0000000000a2', 'aa000000-0000-0000-0000-0000000000aa', 'Cust A2', 0),
  ('cb000000-0000-0000-0000-0000000000b1', 'bb000000-0000-0000-0000-0000000000bb', 'Cust B1', 0);

-- cost_price on insert must be routed to product_costs and cleared on products
insert into public.products (id, shop_id, name, price, mrp, cost_price, stock_qty) values
  ('fa000000-0000-0000-0000-0000000000a1', 'aa000000-0000-0000-0000-0000000000aa', 'Prod A1', 150, 150, 120, 10);

insert into public.sales (id, shop_id, customer_id, invoice_no, total_amount, amount_paid, payment_status)
values ('5a000000-0000-0000-0000-0000000000a1', 'aa000000-0000-0000-0000-0000000000aa',
        'ca000000-0000-0000-0000-0000000000a1', 'T-1', 500, 0, 'unpaid');

insert into public.shop_memberships (id, shop_id, user_id, member_type, name, email_or_phone, status, permissions, pin_hash, session_version)
values
  ('ea000000-0000-0000-0000-0000000000e1', 'aa000000-0000-0000-0000-0000000000aa', 'c0000000-0000-0000-0000-00000000000c',
   'worker', 'Worker W', '9000000001', 'active',
   '{"dashboard":true,"sales":{"create":true,"view":false,"edit":false,"delete":false},"payments":{"receive":false,"view":false},"customers":{"view":true,"add":false,"edit":false,"ledger":false},"inventory":{"view":true,"add":false,"edit":false,"adjustStock":false},"reports":false,"viewProfit":false,"settings":false,"staffManagement":false}',
   extensions.crypt('1234', extensions.gen_salt('bf', 4)), 1),
  ('ea000000-0000-0000-0000-0000000000e2', 'aa000000-0000-0000-0000-0000000000aa', 'd0000000-0000-0000-0000-00000000000d',
   'worker', 'Manager M', '9000000002', 'active',
   '{"dashboard":true,"sales":{"create":false,"view":false,"edit":false,"delete":false},"payments":{"receive":false,"view":false},"customers":{"view":true,"add":false,"edit":false,"ledger":false},"inventory":{"view":false,"add":false,"edit":false,"adjustStock":false},"reports":false,"viewProfit":false,"settings":false,"staffManagement":true}',
   extensions.crypt('5678', extensions.gen_salt('bf', 4)), 1);

insert into public.worker_sessions (session_id, auth_user_id, membership_id, shop_id, session_version) values
  ('5e000000-0000-0000-0000-0000000000e1', 'c0000000-0000-0000-0000-00000000000c', 'ea000000-0000-0000-0000-0000000000e1', 'aa000000-0000-0000-0000-0000000000aa', 1),
  ('5e000000-0000-0000-0000-0000000000e2', 'd0000000-0000-0000-0000-00000000000d', 'ea000000-0000-0000-0000-0000000000e2', 'aa000000-0000-0000-0000-0000000000aa', 1);

-- --------------------------------------------------- T00 cost routing
do $$ begin
  if (select cost_price from public.products where id = 'fa000000-0000-0000-0000-0000000000a1') <> 0 then
    raise exception 'FAIL T00: products.cost_price was not cleared';
  end if;
  if (select cost_price from public.product_costs where product_id = 'fa000000-0000-0000-0000-0000000000a1') is distinct from 120 then
    raise exception 'FAIL T00: cost not stored in product_costs';
  end if;
end $$;

-- ------------------------------------------------------ owner A
select pg_temp.claims('a0000000-0000-0000-0000-00000000000a');
set local role authenticated;

do $$ begin
  if (select count(*) from public.customers) <> 2 then raise exception 'FAIL T01: owner A should see exactly 2 customers'; end if;
  if (select count(*) from public.product_costs) <> 1 then raise exception 'FAIL T02: owner A should see the cost'; end if;
  if (select count(*) from public.sales) <> 1 then raise exception 'FAIL T03: owner A should see the sale'; end if;
end $$;

-- T04: registration cannot target another owner's shop or another user
do $$ begin
  begin
    perform public.rpc_submit_shop_registration('bb000000-0000-0000-0000-0000000000bb', 'a0000000-0000-0000-0000-00000000000a', 'Hijack');
    raise exception 'FAIL T04a: registered into another owner''s shop';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.rpc_submit_shop_registration(null, 'b0000000-0000-0000-0000-00000000000b', 'Hijack');
    raise exception 'FAIL T04b: registered for another user id';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- ------------------------------------------------------ owner B (other shop)
select pg_temp.claims('b0000000-0000-0000-0000-00000000000b');
set local role authenticated;
do $$ begin
  if exists (select 1 from public.customers where shop_id = 'aa000000-0000-0000-0000-0000000000aa') then
    raise exception 'FAIL T05: owner B can see shop A customers';
  end if;
  if exists (select 1 from public.product_costs where shop_id = 'aa000000-0000-0000-0000-0000000000aa') then
    raise exception 'FAIL T06: owner B can see shop A costs';
  end if;
  if (select count(*) from public.worker_sessions) <> 0 then
    raise exception 'FAIL T07: worker_sessions readable by clients';
  end if;
end $$;
reset role;

-- ------------------------------------------------------ worker W, valid session
select pg_temp.claims('c0000000-0000-0000-0000-00000000000c', '5e000000-0000-0000-0000-0000000000e1', true);
set local role authenticated;

do $$ begin
  if (select count(*) from public.customers) <> 2 then raise exception 'FAIL T10: worker should see shop A customers'; end if;
  if exists (select 1 from public.customers where shop_id = 'bb000000-0000-0000-0000-0000000000bb') then
    raise exception 'FAIL T11: worker sees another shop';
  end if;
  if (select count(*) from public.products) <> 1 then raise exception 'FAIL T12: worker should see products (inventory.view)'; end if;
  if (select count(*) from public.product_costs) <> 0 then raise exception 'FAIL T13: worker without viewProfit sees costs'; end if;
  if (select cost_price from public.products limit 1) <> 0 then raise exception 'FAIL T14: cost visible on products'; end if;
  if (select count(*) from public.sales) <> 0 then raise exception 'FAIL T15: worker without sales.view sees sales'; end if;
  if (select count(*) from public.shops) <> 1 then raise exception 'FAIL T16: worker should see exactly their shop'; end if;
  if public.has_shop_permission('aa000000-0000-0000-0000-0000000000aa', 'a0000000-0000-0000-0000-00000000000a', 'sales', 'view') then
    raise exception 'FAIL T17: permission probe for another user returned true';
  end if;
end $$;

-- T18: no direct customer insert (customers.add false)
do $$ begin
  begin
    insert into public.customers (shop_id, name) values ('aa000000-0000-0000-0000-0000000000aa', 'Sneaky');
    raise exception 'FAIL T18: worker inserted a customer without permission';
  exception when insufficient_privilege then null;
  end;
end $$;

-- T19: direct balance change has no effect (no customers.edit)
update public.customers set current_balance = 0 where id = 'ca000000-0000-0000-0000-0000000000a1';
do $$ begin
  if (select current_balance from public.customers where id = 'ca000000-0000-0000-0000-0000000000a1') <> 500 then
    raise exception 'FAIL T19: worker changed a balance directly';
  end if;
end $$;

-- T20: no direct ledger / payment / stock writes
do $$ begin
  begin
    insert into public.ledger_entries (shop_id, customer_id, entry_type, amount, balance_after)
    values ('aa000000-0000-0000-0000-0000000000aa', 'ca000000-0000-0000-0000-0000000000a1', 'credit', 500, 0);
    raise exception 'FAIL T20a: worker wrote a ledger entry directly';
  exception when insufficient_privilege or check_violation then null;
  end;
  begin
    insert into public.stock_movements (shop_id, product_id, type, quantity)
    values ('aa000000-0000-0000-0000-0000000000aa', 'fa000000-0000-0000-0000-0000000000a1', 'in', 5);
    raise exception 'FAIL T20b: worker wrote a stock movement directly';
  exception when insufficient_privilege then null;
  end;
end $$;

-- T21: adjust_stock refused without inventory.adjustStock
do $$ begin
  begin
    perform public.adjust_stock('aa000000-0000-0000-0000-0000000000aa', 'fa000000-0000-0000-0000-0000000000a1', 5, 'test');
    raise exception 'FAIL T21: adjust_stock allowed without permission';
  exception when insufficient_privilege then null;
  end;
end $$;

-- T22: worker identity cannot create a shop
do $$ begin
  begin
    insert into public.shops (owner_id, name, business_type) values ('c0000000-0000-0000-0000-00000000000c', 'Worker Shop', 'Retail');
    raise exception 'FAIL T22: worker created a shop';
  exception when insufficient_privilege or unique_violation or foreign_key_violation then null;
  end;
end $$;

-- T23: non-manager cannot list staff
do $$ begin
  begin
    perform public.staff_list('aa000000-0000-0000-0000-0000000000aa');
    raise exception 'FAIL T23: worker without staffManagement listed staff';
  exception when insufficient_privilege then null;
  end;
end $$;

-- T25: worker cannot read membership rows (PIN hash) directly
do $$ begin
  if exists (select 1 from public.shop_memberships) then
    raise exception 'FAIL T25: worker can read shop_memberships directly';
  end if;
end $$;

-- T24: heartbeat returns permissions
do $$ begin
  if not (public.worker_touch(false)->>'ok')::boolean then raise exception 'FAIL T24: valid session rejected by worker_touch'; end if;
end $$;
reset role;

-- ------------------------------------------------------ session binding
-- T30: same worker user, a session id the Edge Function never recorded
select pg_temp.claims('c0000000-0000-0000-0000-00000000000c', '5e000000-0000-0000-0000-0000000000ff', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.customers) <> 0 then raise exception 'FAIL T30: unrecorded session got data'; end if;
end $$;
reset role;

-- T31: idle for more than 30 minutes
update public.worker_sessions set last_seen_at = now() - interval '31 minutes'
  where session_id = '5e000000-0000-0000-0000-0000000000e1';
select pg_temp.claims('c0000000-0000-0000-0000-00000000000c', '5e000000-0000-0000-0000-0000000000e1', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.customers) <> 0 then raise exception 'FAIL T31: idle session still has access'; end if;
  if public.worker_touch(true)->>'reason' <> 'inactivity' then raise exception 'FAIL T31b: touch did not report inactivity'; end if;
end $$;
reset role;

-- T32: revoked (session version bumped)
insert into public.worker_sessions (session_id, auth_user_id, membership_id, shop_id, session_version)
values ('5e000000-0000-0000-0000-0000000000e1', 'c0000000-0000-0000-0000-00000000000c', 'ea000000-0000-0000-0000-0000000000e1', 'aa000000-0000-0000-0000-0000000000aa', 1);
update public.shop_memberships set session_version = 2 where id = 'ea000000-0000-0000-0000-0000000000e1';
set local role authenticated;
do $$ begin
  if (select count(*) from public.customers) <> 0 then raise exception 'FAIL T32: revoked session still has access'; end if;
end $$;
reset role;

-- T33: suspended
update public.shop_memberships set session_version = 1, status = 'suspended' where id = 'ea000000-0000-0000-0000-0000000000e1';
set local role authenticated;
do $$ begin
  if (select count(*) from public.customers) <> 0 then raise exception 'FAIL T33: suspended worker still has access'; end if;
end $$;
reset role;
update public.shop_memberships set status = 'active' where id = 'ea000000-0000-0000-0000-0000000000e1';

-- ------------------------------------------------------ worker W records a sale (sales.create)
set local role authenticated;
do $$
declare
  v_first uuid;
  v_again uuid;
  v_items jsonb := '[{"productId":"fa000000-0000-0000-0000-0000000000a1","quantity":2,"unitPrice":150,"totalPrice":300}]';
begin
  -- T34: totals that don't add up are refused
  begin
    perform public.record_sale('aa000000-0000-0000-0000-0000000000aa', null, 'T-BAD', 300, 0, 0, 1, 1, 'cash', null, null, v_items);
    raise exception 'FAIL T34a: sale with total 1 for items worth 300 accepted';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    perform public.record_sale('aa000000-0000-0000-0000-0000000000aa', null, 'T-BAD2', 300, 0, 0, 300, 300, 'cash', null, null,
      '[{"productId":"fa000000-0000-0000-0000-0000000000a1","quantity":2,"unitPrice":150,"totalPrice":1}]');
    raise exception 'FAIL T34b: item total that is not quantity x price accepted';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- T35: a repeated request id returns the first sale instead of recording twice
  v_first := public.record_sale('aa000000-0000-0000-0000-0000000000aa', null, 'T-OK', 300, 0, 0, 300, 300, 'cash', null, null,
    v_items, '0e000000-0000-0000-0000-0000000000f1');
  v_again := public.record_sale('aa000000-0000-0000-0000-0000000000aa', null, 'T-OK', 300, 0, 0, 300, 300, 'cash', null, null,
    v_items, '0e000000-0000-0000-0000-0000000000f1');
  if v_first is distinct from v_again then raise exception 'FAIL T35: same request id recorded a second sale'; end if;
end $$;
reset role;

do $$ begin
  if (select count(*) from public.sales where invoice_no = 'T-OK') <> 1 then
    raise exception 'FAIL T35b: expected exactly one T-OK sale';
  end if;
  if (select stock_qty from public.products where id = 'fa000000-0000-0000-0000-0000000000a1') <> 8 then
    raise exception 'FAIL T35c: stock should drop by 2 once, not twice';
  end if;
  -- T36: the database logged the sale against the worker
  if not exists (select 1 from public.worker_activity_logs
                 where worker_id = 'ea000000-0000-0000-0000-0000000000e1' and category = 'sale' and action like 'Created sale T-OK%') then
    raise exception 'FAIL T36: sale not logged for the worker';
  end if;
end $$;

-- T37: owner's permission change is logged
select pg_temp.claims('a0000000-0000-0000-0000-00000000000a');
set local role authenticated;
select public.staff_update('ea000000-0000-0000-0000-0000000000e1', null, null,
  (select permissions || '{"reports":true}'::jsonb from public.shop_memberships where id = 'ea000000-0000-0000-0000-0000000000e1'), null);
reset role;
do $$ begin
  if not exists (select 1 from public.worker_activity_logs where action = 'Changed permissions for Worker W') then
    raise exception 'FAIL T37: permission change not logged';
  end if;
end $$;

-- T38: sign-out is logged and ends the session
select pg_temp.claims('c0000000-0000-0000-0000-00000000000c', '5e000000-0000-0000-0000-0000000000e1', true);
set local role authenticated;
select public.worker_logout();
do $$ begin
  if (select count(*) from public.customers) <> 0 then raise exception 'FAIL T38a: signed-out session still has access'; end if;
end $$;
reset role;
do $$ begin
  if not exists (select 1 from public.worker_activity_logs
                 where worker_id = 'ea000000-0000-0000-0000-0000000000e1' and action = 'Signed out') then
    raise exception 'FAIL T38b: sign-out not logged';
  end if;
end $$;

-- ------------------------------------------------------ manager M (not owner)
select pg_temp.claims('d0000000-0000-0000-0000-00000000000d', '5e000000-0000-0000-0000-0000000000e2', true);
set local role authenticated;
do $$
declare
  v jsonb;
begin
  -- T40: may add a worker with permissions they hold
  v := public.staff_add('aa000000-0000-0000-0000-0000000000aa', 'New Hire', '9000000003',
       '{"customers":{"view":true}}'::jsonb);
  if v->>'code' !~ '^\d{6}$' then raise exception 'FAIL T40: no 6-digit code returned'; end if;

  -- T40b: can read back the worker they added
  if not exists (select 1 from public.staff_get((v->>'workerId')::uuid)) then
    raise exception 'FAIL T40b: manager cannot read back the added worker';
  end if;

  -- T41: may not grant staff management / settings
  begin
    perform public.staff_add('aa000000-0000-0000-0000-0000000000aa', 'Escalate', '9000000004', '{"staffManagement":true}'::jsonb);
    raise exception 'FAIL T41: manager granted staffManagement';
  exception when insufficient_privilege then null;
  end;

  -- T42: may not grant a permission they lack (viewProfit)
  begin
    perform public.staff_add('aa000000-0000-0000-0000-0000000000aa', 'Escalate2', '9000000005', '{"viewProfit":true}'::jsonb);
    raise exception 'FAIL T42: manager granted viewProfit';
  exception when insufficient_privilege then null;
  end;

  -- T43: record_sale refused without sales.create
  begin
    perform public.record_sale('aa000000-0000-0000-0000-0000000000aa', null, 'X-1', 1, 0, 0, 1, 1, 'cash', null, null, '[]'::jsonb);
    raise exception 'FAIL T43: record_sale allowed without permission';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- T44: manager may not manage another privileged worker (owner only)
update public.shop_memberships set permissions = permissions || '{"staffManagement":true}'::jsonb
  where id = 'ea000000-0000-0000-0000-0000000000e1';
set local role authenticated;
do $$ begin
  begin
    perform public.staff_new_code('ea000000-0000-0000-0000-0000000000e1', true);
    raise exception 'FAIL T44: manager reset another manager''s PIN';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
update public.shop_memberships set permissions = permissions - 'staffManagement'
  where id = 'ea000000-0000-0000-0000-0000000000e1';

-- ------------------------------------------------------ sign-in functions (service role path)
do $$
declare
  v jsonb;
  i int;
begin
  -- T50: unknown identity and wrong PIN look the same
  if public.worker_auth_verify_pin('0000000000', '1234', null, 'ip-t50')->>'status' <> 'invalid' then
    raise exception 'FAIL T50: unknown identity not reported as invalid';
  end if;

  -- T51: correct PIN
  v := public.worker_auth_verify_pin('9000000001', '1234', null, 'ip-t51');
  if v->>'status' <> 'ok' or v->>'membershipId' <> 'ea000000-0000-0000-0000-0000000000e1' then
    raise exception 'FAIL T51: correct PIN rejected: %', v;
  end if;

  -- T52: five wrong PINs lock the account; then even the right PIN is refused
  for i in 1..5 loop
    perform public.worker_auth_verify_pin('9000000001', '0000', null, 'ip-t52');
  end loop;
  if public.worker_auth_verify_pin('9000000001', '1234', null, 'ip-t52b')->>'status' <> 'locked' then
    raise exception 'FAIL T52: account not locked after 5 wrong PINs';
  end if;
  -- T55: failed attempts and the lockout are logged
  if (select count(*) from public.worker_activity_logs
      where worker_id = 'ea000000-0000-0000-0000-0000000000e1' and action = 'Failed sign-in attempt') < 4
     or not exists (select 1 from public.worker_activity_logs
                    where worker_id = 'ea000000-0000-0000-0000-0000000000e1' and action like 'Locked for 15 minutes%') then
    raise exception 'FAIL T55: failed attempts or lockout not logged';
  end if;
  update public.shop_memberships set locked_until = null, failed_attempts = 0 where id = 'ea000000-0000-0000-0000-0000000000e1';

  -- T53: rate limit per client address
  for i in 1..30 loop
    perform public.worker_auth_verify_pin('0000000000', '1234', null, 'ip-t53');
  end loop;
  if public.worker_auth_verify_pin('9000000001', '1234', null, 'ip-t53')->>'status' <> 'rate_limited' then
    raise exception 'FAIL T53: no rate limit after 30 attempts';
  end if;

  -- T54: suspended worker with the right PIN
  update public.shop_memberships set status = 'suspended' where id = 'ea000000-0000-0000-0000-0000000000e1';
  if public.worker_auth_verify_pin('9000000001', '1234', null, 'ip-t54')->>'status' <> 'suspended' then
    raise exception 'FAIL T54: suspended worker not reported';
  end if;
  update public.shop_memberships set status = 'active' where id = 'ea000000-0000-0000-0000-0000000000e1';
end $$;

-- T60: activation code: wrong, right, reuse, expiry
do $$
declare
  v_code text;
  v jsonb;
begin
  perform pg_temp.claims('a0000000-0000-0000-0000-00000000000a');
  v_code := public.staff_add('aa000000-0000-0000-0000-0000000000aa', 'Activate Me', '9000000009', '{"customers":{"view":true}}'::jsonb)->>'code';

  if public.worker_auth_activate('9000000009', '000000', '4321', null, 'ip-t60')->>'status' <> 'invalid' then
    raise exception 'FAIL T60a: wrong code accepted';
  end if;
  if public.worker_auth_activate('9000000009', v_code, '12', null, 'ip-t60')->>'status' <> 'bad_pin' then
    raise exception 'FAIL T60b: short PIN accepted';
  end if;
  v := public.worker_auth_activate('9000000009', v_code, '4321', null, 'ip-t60');
  if v->>'status' <> 'ok' then raise exception 'FAIL T60c: right code rejected: %', v; end if;
  if public.worker_auth_activate('9000000009', v_code, '4321', null, 'ip-t60')->>'status' <> 'invalid' then
    raise exception 'FAIL T60d: code worked twice';
  end if;
  if (select pin_hash !~ '^\$2[abxy]\$' from public.shop_memberships where id = (v->>'membershipId')::uuid) then
    raise exception 'FAIL T60e: PIN not stored as bcrypt';
  end if;

  -- expiry
  v_code := public.staff_new_code((v->>'membershipId')::uuid, true)->>'code';
  update public.shop_memberships set temp_code_expires_at = now() - interval '1 minute' where id = (v->>'membershipId')::uuid;
  if public.worker_auth_activate('9000000009', v_code, '4321', null, 'ip-t61')->>'status' <> 'invalid' then
    raise exception 'FAIL T61: expired code accepted';
  end if;

  -- T62: removal frees nothing to sign in with and keeps history
  perform public.staff_remove((v->>'membershipId')::uuid);
  if public.worker_auth_verify_pin('9000000009', '4321', null, 'ip-t62')->>'status' <> 'invalid' then
    raise exception 'FAIL T62: removed worker can still sign in';
  end if;
end $$;

-- T70: client roles cannot call the service-role sign-in functions
set local role authenticated;
do $$ begin
  begin
    perform public.worker_auth_verify_pin('9000000001', '1234', null, 'x');
    raise exception 'FAIL T70: authenticated can call worker_auth_verify_pin';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select 'ALL 024 TESTS PASSED' as result;

rollback;
