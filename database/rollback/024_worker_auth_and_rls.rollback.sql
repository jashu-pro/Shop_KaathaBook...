-- ============================================================================
-- ROLLBACK for 024_worker_auth_and_rls.sql
-- ============================================================================
-- Restores the pre-024 behaviour: owner-only access, original record_sale /
-- record_payment / rpc_submit_shop_registration, cost prices back on products.
-- Business data (shops, customers, sales, payments, ledger, stock) is not
-- touched. Worker accounts created after 024 stay in shop_memberships but can
-- no longer sign in. Run in one transaction; check the result before commit.
-- ============================================================================

begin;

-- 1. Cost prices back on products
update public.products p set cost_price = c.cost_price
  from public.product_costs c where c.product_id = p.id;

drop trigger if exists trg_route_product_cost_on_update on public.products;
drop trigger if exists trg_route_product_cost_on_insert on public.products;
drop trigger if exists trg_guard_worker_product_update on public.products;
drop trigger if exists trg_guard_worker_customer_update on public.customers;
drop function if exists public.route_product_cost_on_update();
drop function if exists public.route_product_cost_on_insert();
drop function if exists public._store_product_cost(uuid, uuid, numeric);
drop function if exists public.guard_worker_product_update();
drop function if exists public.guard_worker_customer_update();
drop table if exists public.product_costs;

-- 2. Worker policies
drop policy if exists worker_shops_select on public.shops;
drop policy if exists worker_customers_select on public.customers;
drop policy if exists worker_customers_insert on public.customers;
drop policy if exists worker_customers_update on public.customers;
drop policy if exists worker_categories_select on public.categories;
drop policy if exists worker_categories_insert on public.categories;
drop policy if exists worker_categories_update on public.categories;
drop policy if exists worker_products_select on public.products;
drop policy if exists worker_products_insert on public.products;
drop policy if exists worker_products_update on public.products;
drop policy if exists worker_sales_select on public.sales;
drop policy if exists worker_sale_items_select on public.sale_items;
drop policy if exists worker_payments_select on public.payments;
drop policy if exists worker_ledger_select on public.ledger_entries;
drop policy if exists worker_stock_select on public.stock_movements;
drop policy if exists worker_reports_select on public.reports;
drop policy if exists worker_notifications_select on public.notifications;
drop policy if exists worker_activity_select on public.worker_activity_logs;
drop policy if exists no_worker_shop_insert on public.shops;
drop policy if exists no_worker_registration_insert on public.shop_registration_requests;

-- 017's self-read policy, which 024 removed.
drop policy if exists "Workers can view their own membership" on public.shop_memberships;
create policy "Workers can view their own membership"
  on public.shop_memberships
  for select
  using (user_id = auth.uid());

-- 3. Original finance and registration functions back under their names
drop function if exists public.record_sale(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb, uuid);
alter function public._record_sale_impl(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb)
  rename to record_sale;
alter function public.record_sale(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb)
  security invoker;

drop function if exists public.record_payment(uuid, uuid, numeric, text, text, text, text, uuid);
alter function public._record_payment_impl(uuid, uuid, numeric, text, text, text, text) rename to record_payment;
alter function public.record_payment(uuid, uuid, numeric, text, text, text, text) security invoker;

grant execute on function public.record_sale(uuid, uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, jsonb) to authenticated;
grant execute on function public.record_payment(uuid, uuid, numeric, text, text, text, text) to authenticated;

-- NOTE: restoring the 021 registration function also restores its
-- owner-id vulnerability. Keep the 024 wrapper unless you must roll back fully.
drop function if exists public.rpc_submit_shop_registration(
  uuid, uuid, text, text, text, text, text, text, text, text, text,
  double precision, double precision, text, text, text, text, text, text, text, text, text);
alter function public._rpc_submit_shop_registration_impl(
  uuid, uuid, text, text, text, text, text, text, text, text, text,
  double precision, double precision, text, text, text, text, text, text, text, text, text
) rename to rpc_submit_shop_registration;
grant execute on function public.rpc_submit_shop_registration(
  uuid, uuid, text, text, text, text, text, text, text, text, text,
  double precision, double precision, text, text, text, text, text, text, text, text, text) to authenticated;

drop function if exists public.adjust_stock(uuid, uuid, numeric, text);
drop function if exists public._claim_financial_request(uuid, uuid, text);
drop function if exists public._check_sale_totals(numeric, numeric, numeric, numeric, jsonb);
drop table if exists public.financial_requests;

-- 4. Worker sign-in and staff functions
drop function if exists public.worker_auth_verify_pin(text, text, uuid, text);
drop function if exists public.worker_auth_activate(text, text, text, uuid, text);
drop function if exists public.worker_auth_link_user(uuid, uuid);
drop function if exists public.worker_auth_open_session(uuid, uuid, uuid);
drop function if exists public.worker_touch(boolean);
drop function if exists public.worker_logout();
drop function if exists public.log_shop_activity(uuid, text, text, numeric);
drop function if exists public.staff_list(uuid);
drop function if exists public.staff_get(uuid);
drop function if exists public.staff_add(uuid, text, text, jsonb);
drop function if exists public.staff_update(uuid, text, text, jsonb, text);
drop function if exists public.staff_new_code(uuid, boolean);
drop function if exists public.staff_revoke_sessions(uuid);
drop function if exists public.staff_remove(uuid);
drop function if exists public.staff_activity(uuid, uuid, int);
drop function if exists public._staff_member_for_manager(uuid);
drop function if exists public._check_permission_grant(uuid, jsonb);
drop function if exists public._new_activation_code();
drop function if exists public._worker_rate_limited(text);
drop function if exists public._worker_fail_attempt(uuid);

-- 5. Membership helpers back to owner-only behaviour (017 semantics minus workers)
create or replace function public.has_shop_permission(p_shop_id uuid, p_user_id uuid, p_module text, p_action text default null)
returns boolean language sql security definer stable set search_path = public as $$
  select p_user_id is not null and p_user_id = auth.uid()
     and exists (select 1 from public.shops where id = p_shop_id and owner_id = p_user_id);
$$;
create or replace function public.is_active_shop_member(p_shop_id uuid, p_user_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select p_user_id is not null and p_user_id = auth.uid()
     and exists (select 1 from public.shops where id = p_shop_id and owner_id = p_user_id);
$$;
drop function if exists public.can(uuid, text, text);
drop function if exists public.can_manage_staff(uuid);
drop function if exists public.current_worker_member_id(uuid);
drop function if exists public._worker_membership(uuid, uuid);
drop function if exists public._is_shop_owner_caller(uuid);
drop function if exists public._is_privileged(jsonb);
drop function if exists public._request_is_worker();
drop function if exists public._request_session_id();

-- 6. Session tables (worker auth users remain in auth.users; delete them in
--    the dashboard if needed: app_metadata.role = 'worker')
drop table if exists public.worker_sessions;
drop table if exists public.worker_auth_attempts;

-- Check, then: commit;  (or rollback; to abandon)
