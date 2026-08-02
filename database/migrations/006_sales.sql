-- 006_sales.sql
-- Sales Table

create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  invoice_no text not null,
  sale_date timestamp with time zone default timezone('utc'::text, now()) not null,
  subtotal numeric(12,2) default 0.00 not null,
  tax_amount numeric(12,2) default 0.00 not null,
  discount_amount numeric(12,2) default 0.00 not null,
  total_amount numeric(12,2) default 0.00 not null,
  amount_paid numeric(12,2) default 0.00 not null,
  payment_status text not null, -- 'paid', 'partially_paid', 'unpaid'
  payment_method text, -- 'cash', 'upi', 'card', 'bank_transfer', 'credit'
  bill_image_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.sales enable row level security;

-- Create RLS Policies
create policy "Users can view sales of their own shop"
  on public.sales for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.sales.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert sales into their own shop"
  on public.sales for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.sales.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can update sales of their own shop"
  on public.sales for update
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.sales.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can delete sales from their own shop"
  on public.sales for delete
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.sales.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
