-- 004_categories.sql
-- Categories Table

create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- Create RLS Policies
create policy "Users can view categories of their own shop"
  on public.categories for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.categories.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert categories into their own shop"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.categories.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can update categories of their own shop"
  on public.categories for update
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.categories.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can delete categories from their own shop"
  on public.categories for delete
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.categories.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
