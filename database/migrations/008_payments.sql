-- 008_payments.sql
-- Payments Table

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  payment_date timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric(12,2) not null,
  payment_method text not null, -- 'cash', 'phonepe', 'gpay', 'paytm', 'bank_transfer'
  reference_no text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payments enable row level security;

-- Create RLS Policies
create policy "Users can view payments of their own shop"
  on public.payments for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.payments.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert payments into their own shop"
  on public.payments for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.payments.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can update payments of their own shop"
  on public.payments for update
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.payments.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can delete payments from their own shop"
  on public.payments for delete
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.payments.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
