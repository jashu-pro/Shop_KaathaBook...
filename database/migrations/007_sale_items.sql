-- 007_sale_items.sql
-- Sale Items Table

create table if not exists public.sale_items (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid references public.sales(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity numeric(10,2) not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  tax_rate numeric(5,2) default 0.00 not null
);

-- Enable RLS
alter table public.sale_items enable row level security;

-- Create RLS Policies
create policy "Users can view sale items of their own shop"
  on public.sale_items for select
  using (
    exists (
      select 1 from public.sales
      join public.shops on public.shops.id = public.sales.shop_id
      where public.sales.id = public.sale_items.sale_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert sale items into their own shop"
  on public.sale_items for insert
  with check (
    exists (
      select 1 from public.sales
      join public.shops on public.shops.id = public.sales.shop_id
      where public.sales.id = public.sale_items.sale_id
      and public.shops.owner_id = auth.uid()
    )
  );
