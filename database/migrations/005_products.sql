-- 005_products.sql
-- Products Table

create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  barcode text,
  price numeric(12,2) default 0.00 not null,
  cost_price numeric(12,2) default 0.00 not null,
  sku text,
  stock_qty numeric(10,2) default 0.00 not null,
  alert_qty numeric(10,2) default 5.00 not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.products enable row level security;

-- Create RLS Policies
create policy "Users can view products of their own shop"
  on public.products for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.products.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert products into their own shop"
  on public.products for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.products.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can update products of their own shop"
  on public.products for update
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.products.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can delete products from their own shop"
  on public.products for delete
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.products.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
