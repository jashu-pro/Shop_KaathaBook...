-- 009_ledger.sql
-- Ledger Entries Table

create table if not exists public.ledger_entries (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  entry_date timestamp with time zone default timezone('utc'::text, now()) not null,
  entry_type text not null, -- 'debit' (customer owes), 'credit' (customer paid)
  amount numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  description text,
  reference_type text, -- 'sale', 'payment', 'initial'
  reference_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ledger_entries enable row level security;

-- Create RLS Policies
create policy "Users can view ledger entries of their own shop"
  on public.ledger_entries for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.ledger_entries.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert ledger entries into their own shop"
  on public.ledger_entries for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.ledger_entries.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can update ledger entries of their own shop"
  on public.ledger_entries for update
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.ledger_entries.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can delete ledger entries from their own shop"
  on public.ledger_entries for delete
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.ledger_entries.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
