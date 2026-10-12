-- ============================================================================
-- 023: MAKE REPORTING VIEWS RESPECT ROW LEVEL SECURITY
-- ============================================================================
-- Views run with their owner's rights by default, which bypasses RLS on the
-- underlying tables. Supabase flags these as "UNRESTRICTED": anyone holding
-- the public anon key could read every shop's customer names, phones and
-- balances (customer_balances_view), daily sales/collections
-- (daily_summary_view) and stock movements (inventory_movements).
--
-- security_invoker makes each view run with the caller's rights, so the
-- existing RLS policies on customers, ledger_entries, sales, payments, shops
-- and stock_movements apply. Requires Postgres 15+ (all current Supabase
-- projects).
-- ============================================================================

alter view if exists public.customer_balances_view set (security_invoker = on);
alter view if exists public.daily_summary_view set (security_invoker = on);
alter view if exists public.inventory_movements set (security_invoker = on);

-- The app never reads these views anonymously.
revoke all on public.customer_balances_view from anon;
revoke all on public.daily_summary_view from anon;
revoke all on public.inventory_movements from anon;
