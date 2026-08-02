-- 003_customers.sql
-- Customers Table

create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  village text,
  credit_limit numeric(12,2) default 0.00 not null,
  photo_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.customers enable row level security;

-- Create RLS Policies
create policy "Users can view customers of their own shop"
  on public.customers for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.customers.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert customers into their own shop"
  on public.customers for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.customers.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can update customers of their own shop"
  on public.customers for update
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.customers.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can delete customers of their own shop"
  on public.customers for delete
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.customers.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
