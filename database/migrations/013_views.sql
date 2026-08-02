-- 013_views.sql
-- Views for derived ledger metrics and sales reporting

-- Customer balances derived dynamically from ledger entries
create or replace view public.customer_balances_view as
select 
  c.id as customer_id,
  c.shop_id,
  c.name as customer_name,
  c.phone as customer_phone,
  c.credit_limit,
  coalesce(sum(
    case 
      when le.entry_type = 'debit' then le.amount
      when le.entry_type = 'credit' then -le.amount
      else 0.00
    end
  ), 0.00) as derived_balance
from public.customers c
left join public.ledger_entries le on c.id = le.customer_id
group by c.id, c.shop_id, c.name, c.phone, c.credit_limit;

-- Daily summaries grouping total sales and total collections by shop and date
create or replace view public.daily_summary_view as
select
  s.id as shop_id,
  d.date_val::date as summary_date,
  coalesce((
    select sum(total_amount) 
    from public.sales 
    where shop_id = s.id and sale_date::date = d.date_val::date
  ), 0.00) as total_sales,
  coalesce((
    select sum(amount) 
    from public.payments 
    where shop_id = s.id and payment_date::date = d.date_val::date
  ), 0.00) as total_collections
from public.shops s
cross join lateral (
  select distinct sale_date::date as date_val from public.sales where shop_id = s.id
  union
  select distinct payment_date::date as date_val from public.payments where shop_id = s.id
) d;
