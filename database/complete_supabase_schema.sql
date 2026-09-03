-- 001_profiles.sql
-- User Profiles Table (linked to Supabase Auth.users)

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create RLS Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
-- 002_shops.sql
-- Shops Table (One Account = One Shop)

create table if not exists public.shops (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade unique not null,
  name text not null,
  tagline text,
  business_type text not null,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  gstin text,
  pan text,
  upi_id text,
  logo_url text,
  currency text default 'INR' not null,
  theme text default 'dark' not null,
  language text default 'en' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.shops enable row level security;

-- Create RLS Policies
create policy "Owners can view their own shop"
  on public.shops for select
  using (auth.uid() = owner_id);

create policy "Owners can create their own shop"
  on public.shops for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own shop"
  on public.shops for update
  using (auth.uid() = owner_id);
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
-- 010_reports.sql
-- Reports Table

create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  report_type text not null, -- 'daily', 'weekly', 'monthly', 'outstanding'
  report_date date not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reports enable row level security;

-- Create RLS Policies
create policy "Users can view reports of their own shop"
  on public.reports for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.reports.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert reports into their own shop"
  on public.reports for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.reports.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
-- 011_notifications.sql
-- Notifications Table

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  type text not null, -- 'whatsapp', 'sms', 'email'
  message text not null,
  status text not null, -- 'pending', 'sent', 'failed'
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create RLS Policies
create policy "Users can view notifications of their own shop"
  on public.notifications for select
  using (
    exists (
      select 1 from public.shops
      where public.shops.id = public.notifications.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );

create policy "Users can insert notifications into their own shop"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.shops
      where public.shops.id = public.notifications.shop_id
      and public.shops.owner_id = auth.uid()
    )
  );
-- 012_indexes.sql
-- Performance Indexes for Shop KhattaBook

-- Profiles Index
create index if not exists idx_profiles_email on public.profiles(email);

-- Shops Index
create index if not exists idx_shops_owner on public.shops(owner_id);

-- Customers Indexes
create index if not exists idx_customers_shop_id on public.customers(shop_id);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_name_village on public.customers(name, village);

-- Categories Index
create index if not exists idx_categories_shop_id on public.categories(shop_id);

-- Products Indexes
create index if not exists idx_products_shop_category on public.products(shop_id, category_id);
create index if not exists idx_products_barcode on public.products(barcode);
create index if not exists idx_products_name on public.products(name);

-- Sales Indexes
create index if not exists idx_sales_shop_customer on public.sales(shop_id, customer_id);
create index if not exists idx_sales_invoice_no on public.sales(invoice_no);
create index if not exists idx_sales_sale_date on public.sales(sale_date);

-- Sale Items Indexes
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);

-- Payments Indexes
create index if not exists idx_payments_shop_customer on public.payments(shop_id, customer_id);
create index if not exists idx_payments_date on public.payments(payment_date);

-- Ledger Entries Indexes
create index if not exists idx_ledger_entries_shop_customer on public.ledger_entries(shop_id, customer_id);
create index if not exists idx_ledger_entries_date on public.ledger_entries(entry_date);
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
-- 014_functions.sql
-- Database functions for Auth profile synchronization and inventory management

-- Auth profile trigger handler
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Stock deduction trigger handler
create or replace function public.adjust_product_stock()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.products
    set stock_qty = stock_qty - new.quantity,
        updated_at = now()
    where id = new.product_id;
  elsif (TG_OP = 'DELETE') then
    update public.products
    set stock_qty = stock_qty + old.quantity,
        updated_at = now()
    where id = old.product_id;
  elsif (TG_OP = 'UPDATE') then
    update public.products
    set stock_qty = stock_qty + old.quantity - new.quantity,
        updated_at = now()
    where id = new.product_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;
-- 015_triggers.sql
-- Triggers linking tables to system logic

-- Hook new users up from Supabase Auth to profiles table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Hook product stock updates up to sale_items changes
drop trigger if exists on_sale_item_modified on public.sale_items;
create trigger on_sale_item_modified
  after insert or update or delete on public.sale_items
  for each row execute procedure public.adjust_product_stock();
-- 016_production_finance_and_inventory.sql
-- Align the database with the application model and make financial writes atomic.

-- Columns used by the current domain model but absent from the original schema.
alter table public.customers
  add column if not exists current_balance numeric(12,2) not null default 0,
  add column if not exists tag text;

alter table public.categories
  add column if not exists color text,
  add column if not exists icon text;

alter table public.products
  add column if not exists mrp numeric(12,2),
  add column if not exists unit text not null default 'piece',
  add column if not exists notes text;

update public.products set mrp = price where mrp is null;
alter table public.products alter column mrp set not null;

alter table public.sale_items
  add column if not exists unit text not null default 'piece';

alter table public.payments
  add column if not exists proof_image_url text,
  add column if not exists sale_id uuid references public.sales(id) on delete cascade;

create table if not exists public.stock_movements (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  sale_id uuid references public.sales(id) on delete set null,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity numeric(10,2) not null check (quantity > 0),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stock_movements enable row level security;

create policy "Users can view stock movements of their own shop"
  on public.stock_movements for select
  using (exists (
    select 1 from public.shops
    where public.shops.id = public.stock_movements.shop_id
      and public.shops.owner_id = auth.uid()
  ));

create policy "Users can insert stock movements into their own shop"
  on public.stock_movements for insert
  with check (exists (
    select 1 from public.shops
    where public.shops.id = public.stock_movements.shop_id
      and public.shops.owner_id = auth.uid()
  ));

create index if not exists idx_stock_movements_shop_created
  on public.stock_movements(shop_id, created_at desc);
create index if not exists idx_payments_sale_id on public.payments(sale_id);
create index if not exists idx_ledger_customer_date
  on public.ledger_entries(customer_id, entry_date desc);

-- Keep the stock trigger as the single stock mutation for sale-item writes.
create or replace function public.adjust_product_stock()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  affected_rows integer;
begin
  if TG_OP = 'INSERT' then
    update public.products
       set stock_qty = stock_qty - new.quantity,
           updated_at = now()
     where id = new.product_id
       and stock_qty >= new.quantity;
    get diagnostics affected_rows = row_count;
    if affected_rows = 0 then
      raise exception 'Insufficient stock for product %', new.product_id using errcode = 'P0001';
    end if;
  elsif TG_OP = 'DELETE' then
    update public.products
       set stock_qty = stock_qty + old.quantity,
           updated_at = now()
     where id = old.product_id;
  elsif TG_OP = 'UPDATE' then
    -- Product changes are not supported through a sale-item update; replace the item instead.
    if new.product_id <> old.product_id then
      raise exception 'Changing a sale item product is not supported' using errcode = 'P0001';
    end if;
    update public.products
       set stock_qty = stock_qty + old.quantity - new.quantity,
           updated_at = now()
     where id = new.product_id
       and stock_qty + old.quantity >= new.quantity;
    get diagnostics affected_rows = row_count;
    if affected_rows = 0 then
      raise exception 'Insufficient stock for product %', new.product_id using errcode = 'P0001';
    end if;
  end if;
  return null;
end;
$$;

-- A sale, its stock impact, payment, balance and ledger entries must succeed or fail together.
create or replace function public.record_sale(
  p_shop_id uuid,
  p_customer_id uuid,
  p_invoice_no text,
  p_subtotal numeric,
  p_tax_amount numeric,
  p_discount_amount numeric,
  p_total_amount numeric,
  p_amount_paid numeric,
  p_payment_method text,
  p_bill_image_url text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_payment_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_balance_before numeric;
  v_balance_after_sale numeric;
  v_balance_after_payment numeric;
  v_payment_status text;
begin
  if p_total_amount < 0 or p_amount_paid < 0 or p_amount_paid > p_total_amount then
    raise exception 'Invalid sale amounts' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A sale must contain at least one item' using errcode = 'P0001';
  end if;
  if p_customer_id is null and p_amount_paid <> p_total_amount then
    raise exception 'A customer is required for a credit sale' using errcode = 'P0001';
  end if;

  if p_customer_id is not null then
    select current_balance into v_balance_before
      from public.customers
     where id = p_customer_id and shop_id = p_shop_id
     for update;
    if not found then
      raise exception 'Customer does not belong to this shop' using errcode = 'P0001';
    end if;
  end if;

  v_payment_status := case
    when p_amount_paid = p_total_amount then 'paid'
    when p_amount_paid > 0 then 'partially_paid'
    else 'unpaid'
  end;

  insert into public.sales (
    shop_id, customer_id, invoice_no, subtotal, tax_amount, discount_amount,
    total_amount, amount_paid, payment_status, payment_method, bill_image_url, notes
  ) values (
    p_shop_id, p_customer_id, p_invoice_no, p_subtotal, p_tax_amount, p_discount_amount,
    p_total_amount, p_amount_paid, v_payment_status, p_payment_method, p_bill_image_url, p_notes
  ) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'productId')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity <= 0 then
      raise exception 'Sale item quantity must be positive' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.products where id = v_product_id and shop_id = p_shop_id) then
      raise exception 'Product does not belong to this shop' using errcode = 'P0001';
    end if;

    insert into public.sale_items (sale_id, product_id, quantity, unit_price, total_price, tax_rate, unit)
    values (
      v_sale_id,
      v_product_id,
      v_quantity,
      (v_item->>'unitPrice')::numeric,
      (v_item->>'totalPrice')::numeric,
      coalesce((v_item->>'taxRate')::numeric, 0),
      coalesce(v_item->>'unit', 'piece')
    );

    insert into public.stock_movements (shop_id, product_id, sale_id, type, quantity, reason)
    values (p_shop_id, v_product_id, v_sale_id, 'out', v_quantity, 'Sale ' || p_invoice_no);
  end loop;

  if p_customer_id is not null then
    v_balance_after_sale := v_balance_before + p_total_amount;
    v_balance_after_payment := v_balance_after_sale - p_amount_paid;

    update public.customers
       set current_balance = v_balance_after_payment,
           updated_at = now()
     where id = p_customer_id;

    insert into public.ledger_entries (
      shop_id, customer_id, entry_date, entry_type, amount, balance_after,
      description, reference_type, reference_id
    ) values (
      p_shop_id, p_customer_id, now(), 'debit', p_total_amount, v_balance_after_sale,
      'Sale ' || p_invoice_no, 'sale', v_sale_id
    );

    if p_amount_paid > 0 then
      insert into public.payments (
        shop_id, customer_id, sale_id, amount, payment_method, notes
      ) values (
        p_shop_id, p_customer_id, v_sale_id, p_amount_paid,
        coalesce(p_payment_method, 'cash'), 'Immediate payment for sale ' || p_invoice_no
      ) returning id into v_payment_id;

      insert into public.ledger_entries (
        shop_id, customer_id, entry_date, entry_type, amount, balance_after,
        description, reference_type, reference_id
      ) values (
        p_shop_id, p_customer_id, now(), 'credit', p_amount_paid, v_balance_after_payment,
        'Payment for sale ' || p_invoice_no, 'payment', v_payment_id
      );
    end if;
  end if;

  return v_sale_id;
end;
$$;

create or replace function public.record_payment(
  p_shop_id uuid,
  p_customer_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference_no text,
  p_proof_image_url text,
  p_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_balance_after numeric;
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero' using errcode = 'P0001';
  end if;

  update public.customers
     set current_balance = current_balance - p_amount,
         updated_at = now()
   where id = p_customer_id and shop_id = p_shop_id
   returning current_balance into v_balance_after;
  if not found then
    raise exception 'Customer does not belong to this shop' using errcode = 'P0001';
  end if;

  insert into public.payments (
    shop_id, customer_id, amount, payment_method, reference_no, proof_image_url, notes
  ) values (
    p_shop_id, p_customer_id, p_amount, p_payment_method, p_reference_no, p_proof_image_url, p_notes
  ) returning id into v_payment_id;

  insert into public.ledger_entries (
    shop_id, customer_id, entry_date, entry_type, amount, balance_after,
    description, reference_type, reference_id
  ) values (
    p_shop_id, p_customer_id, now(), 'credit', p_amount, v_balance_after,
    coalesce(p_notes, 'Payment received (' || upper(p_payment_method) || ')'), 'payment', v_payment_id
  );

  return v_payment_id;
end;
$$;

create or replace function public.void_sale(p_sale_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_item record;
  v_balance_before numeric;
  v_balance_after_reversal numeric;
  v_immediate_payment public.payments%rowtype;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'Sale not found' using errcode = 'P0001';
  end if;

  if v_sale.payment_status = 'voided' then
    raise exception 'Sale is already voided' using errcode = 'P0001';
  end if;

  -- 1. Mark sale status as voided (Immutable state preservation)
  update public.sales
     set payment_status = 'voided',
         notes = coalesce(notes, '') || ' [VOIDED at ' || now()::text || ']',
         updated_at = now()
   where id = p_sale_id;

  -- 2. Reverse stock movements (Add back stock and post offsetting 'in' movement)
  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    update public.products
       set stock_qty = stock_qty + v_item.quantity,
           updated_at = now()
     where id = v_item.product_id;

    insert into public.stock_movements (
      shop_id, product_id, sale_id, type, quantity, reason
    ) values (
      v_sale.shop_id, v_item.product_id, v_sale.id, 'in', v_item.quantity,
      'Reversal: Voided Sale ' || v_sale.invoice_no
    );
  end loop;

  -- 3. Reverse customer credit balance & post immutable offsetting ledger entries
  if v_sale.customer_id is not null then
    select current_balance into v_balance_before
      from public.customers
     where id = v_sale.customer_id and shop_id = v_sale.shop_id
     for update;

    v_balance_after_reversal := v_balance_before - (v_sale.total_amount - v_sale.amount_paid);

    update public.customers
       set current_balance = v_balance_after_reversal,
           updated_at = now()
     where id = v_sale.customer_id;

    insert into public.ledger_entries (
      shop_id, customer_id, entry_date, entry_type, amount, balance_after,
      description, reference_type, reference_id
    ) values (
      v_sale.shop_id, v_sale.customer_id, now(), 'credit', v_sale.total_amount,
      (v_balance_before - v_sale.total_amount),
      'Reversal: Voided Sale ' || v_sale.invoice_no, 'void_sale', v_sale.id
    );

    select * into v_immediate_payment
    from public.payments
    where sale_id = p_sale_id
    limit 1;

    if found then
      update public.payments
         set notes = coalesce(notes, '') || ' [VOIDED with Sale]',
             updated_at = now()
       where id = v_immediate_payment.id;

      insert into public.ledger_entries (
        shop_id, customer_id, entry_date, entry_type, amount, balance_after,
        description, reference_type, reference_id
      ) values (
        v_sale.shop_id, v_sale.customer_id, now(), 'debit', v_immediate_payment.amount,
        v_balance_after_reversal,
        'Reversal: Refunded Downpayment for Voided Sale ' || v_sale.invoice_no,
        'void_payment', v_immediate_payment.id
      );
    end if;
  end if;
end;
$$;

create or replace function public.void_payment(p_payment_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_balance_after numeric;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0001';
  end if;

  if v_payment.notes is not null and v_payment.notes like '%[VOIDED]%' then
    raise exception 'Payment is already voided' using errcode = 'P0001';
  end if;

  if v_payment.sale_id is not null then
    raise exception 'Cannot void immediate sale payment directly; void the associated sale instead.' using errcode = 'P0001';
  end if;

  -- Mark payment as voided
  update public.payments
     set notes = coalesce(notes, '') || ' [VOIDED at ' || now()::text || ']',
         updated_at = now()
   where id = p_payment_id;

  -- Restore customer debt
  update public.customers
     set current_balance = current_balance + v_payment.amount,
         updated_at = now()
   where id = v_payment.customer_id
   returning current_balance into v_balance_after;

  -- Post offsetting Debit Entry
  insert into public.ledger_entries (
    shop_id, customer_id, entry_date, entry_type, amount, balance_after,
    description, reference_type, reference_id
  ) values (
    v_payment.shop_id, v_payment.customer_id, now(), 'debit', v_payment.amount,
    v_balance_after,
    'Reversal: Voided Payment ' || coalesce(v_payment.reference_no, '#' || substr(p_payment_id::text, 1, 8)),
    'void_payment', v_payment.id
  );
end;
$$;

create or replace function public.record_ledger_adjustment(
  p_shop_id uuid,
  p_customer_id uuid,
  p_entry_date timestamptz,
  p_entry_type text,
  p_amount numeric,
  p_description text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_balance_after numeric;
begin
  if p_amount <= 0 or p_entry_type not in ('debit', 'credit') then
    raise exception 'Invalid ledger adjustment' using errcode = 'P0001';
  end if;

  update public.customers
     set current_balance = current_balance + case when p_entry_type = 'debit' then p_amount else -p_amount end,
         updated_at = now()
   where id = p_customer_id and shop_id = p_shop_id
   returning current_balance into v_balance_after;
  if not found then
    raise exception 'Customer does not belong to this shop' using errcode = 'P0001';
  end if;

  insert into public.ledger_entries (
    shop_id, customer_id, entry_date, entry_type, amount, balance_after, description, reference_type
  ) values (
    p_shop_id, p_customer_id, coalesce(p_entry_date, now()), p_entry_type, p_amount,
    v_balance_after, p_description, 'adjustment'
  ) returning id into v_entry_id;
  return v_entry_id;
end;
$$;

create or replace function public.void_ledger_adjustment(p_entry_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_entry public.ledger_entries%rowtype;
  v_opposite_type text;
  v_balance_after numeric;
begin
  select * into v_entry from public.ledger_entries where id = p_entry_id for update;
  if not found then
    raise exception 'Ledger entry not found' using errcode = 'P0001';
  end if;
  if v_entry.reference_type is distinct from 'adjustment' then
    raise exception 'Only manual adjustments can be reversed with this function' using errcode = 'P0001';
  end if;

  v_opposite_type := case when v_entry.entry_type = 'debit' then 'credit' else 'debit' end;

  update public.customers
     set current_balance = current_balance + case when v_entry.entry_type = 'debit' then -v_entry.amount else v_entry.amount end,
         updated_at = now()
   where id = v_entry.customer_id
   returning current_balance into v_balance_after;

  insert into public.ledger_entries (
    shop_id, customer_id, entry_date, entry_type, amount, balance_after,
    description, reference_type, reference_id
  ) values (
    v_entry.shop_id, v_entry.customer_id, now(), v_opposite_type, v_entry.amount,
    v_balance_after,
    'Reversal: ' || v_entry.description,
    'void_adjustment', v_entry.id
  );
end;
$$;

-- ============================================================================
-- 017: Multi-Tenant Memberships, Hardened RBAC & Multi-Image Attachments
-- ============================================================================
create table if not exists public.shop_memberships (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  member_type text not null check (member_type in ('owner', 'worker')),
  name text not null,
  email_or_phone text not null,
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended')),
  permissions jsonb not null default '{}'::jsonb,
  pin_salt text,
  pin_hash text,
  temp_code_hash text,
  temp_code_expires_at timestamp with time zone,
  failed_attempts integer not null default 0,
  locked_until timestamp with time zone,
  session_version integer not null default 1,
  sessions_revoked_at timestamp with time zone,
  last_active_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_shop_membership_identity unique (shop_id, email_or_phone)
);

alter table public.shop_memberships enable row level security;

create index if not exists idx_shop_memberships_shop_id on public.shop_memberships(shop_id);
create index if not exists idx_shop_memberships_user_id on public.shop_memberships(user_id);
create index if not exists idx_shop_memberships_auth on public.shop_memberships(shop_id, email_or_phone);

create table if not exists public.worker_activity_logs (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  worker_id uuid references public.shop_memberships(id) on delete set null,
  worker_name text not null,
  action text not null,
  category text not null check (category in ('sale', 'payment', 'customer', 'inventory', 'access', 'security')),
  amount numeric(12,2),
  metadata jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.worker_activity_logs enable row level security;

create index if not exists idx_worker_activity_logs_shop_created 
  on public.worker_activity_logs(shop_id, created_at desc);

create table if not exists public.sale_attachments (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  sale_id uuid references public.sales(id) on delete cascade not null,
  file_url text not null,
  file_name text,
  file_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sale_attachments enable row level security;

create index if not exists idx_sale_attachments_sale_id on public.sale_attachments(sale_id);
create index if not exists idx_sale_attachments_shop_id on public.sale_attachments(shop_id);

create or replace function public.is_shop_owner(p_shop_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.shops
    where id = p_shop_id and owner_id = p_user_id
  );
$$;

create or replace function public.is_active_shop_member(p_shop_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.shop_memberships
    where shop_id = p_shop_id
      and user_id = p_user_id
      and status = 'active'
  );
$$;

create or replace function public.has_shop_permission(
  p_shop_id uuid,
  p_user_id uuid,
  p_module text,
  p_action text default null
)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_perms jsonb;
  v_is_owner boolean;
begin
  select exists(select 1 from public.shops where id = p_shop_id and owner_id = p_user_id) into v_is_owner;
  if v_is_owner then
    return true;
  end if;

  select permissions into v_perms
  from public.shop_memberships
  where shop_id = p_shop_id
    and user_id = p_user_id
    and status = 'active';

  if v_perms is null then
    return false;
  end if;

  if p_action is not null then
    return coalesce((v_perms->p_module->>p_action)::boolean, false);
  else
    return coalesce((v_perms->>p_module)::boolean, false);
  end if;
end;
$$;

create policy "Owners can manage all memberships of their shop"
  on public.shop_memberships
  for all
  using (public.is_shop_owner(shop_id, auth.uid()))
  with check (public.is_shop_owner(shop_id, auth.uid()));

create policy "Workers can view their own membership"
  on public.shop_memberships
  for select
  using (user_id = auth.uid());

create policy "Owners can view all worker activity logs"
  on public.worker_activity_logs
  for select
  using (public.is_shop_owner(shop_id, auth.uid()));

create policy "Workers with access can insert activity logs"
  on public.worker_activity_logs
  for insert
  with check (
    public.is_shop_owner(shop_id, auth.uid()) or
    public.is_active_shop_member(shop_id, auth.uid())
  );

create policy "Shop members can view sale attachments"
  on public.sale_attachments
  for select
  using (
    public.is_shop_owner(shop_id, auth.uid()) or
    public.has_shop_permission(shop_id, auth.uid(), 'sales', 'view')
  );

create policy "Shop members can insert sale attachments"
  on public.sale_attachments
  for insert
  with check (
    public.is_shop_owner(shop_id, auth.uid()) or
    public.has_shop_permission(shop_id, auth.uid(), 'sales', 'create')
  );

create or replace function public.authenticate_worker_pin(
  p_shop_id uuid,
  p_email_or_phone text,
  p_pin_hash text
)
returns table (
  worker_id uuid,
  name text,
  permissions jsonb,
  session_version integer,
  authenticated boolean,
  lockout_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker public.shop_memberships%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_worker
  from public.shop_memberships
  where shop_id = p_shop_id and email_or_phone = p_email_or_phone
  for update;

  if not found then
    return query select null::uuid, null::text, null::jsonb, 0, false, 'Invalid credentials'::text;
    return;
  end if;

  if v_worker.status <> 'active' then
    return query select null::uuid, null::text, null::jsonb, 0, false, 'Worker account is not active'::text;
    return;
  end if;

  if v_worker.locked_until is not null and v_worker.locked_until > v_now then
    return query select null::uuid, null::text, null::jsonb, 0, false, 
      ('Account temporarily locked due to failed attempts. Try again in ' || 
       round(extract(epoch from (v_worker.locked_until - v_now)) / 60) || ' minutes.')::text;
    return;
  end if;

  if v_worker.pin_hash = p_pin_hash then
    update public.shop_memberships
    set failed_attempts = 0,
        locked_until = null,
        last_active_at = v_now
    where id = v_worker.id;

    insert into public.worker_activity_logs (
      shop_id, worker_id, worker_name, action, category
    ) values (
      p_shop_id, v_worker.id, v_worker.name, 'Worker logged in via PIN', 'access'
    );

    return query select v_worker.id, v_worker.name, v_worker.permissions, v_worker.session_version, true, null::text;
  else
    if v_worker.failed_attempts + 1 >= 5 then
      update public.shop_memberships
      set failed_attempts = v_worker.failed_attempts + 1,
          locked_until = v_now + interval '15 minutes'
      where id = v_worker.id;

      insert into public.worker_activity_logs (
        shop_id, worker_id, worker_name, action, category
      ) values (
        p_shop_id, v_worker.id, v_worker.name, 'Worker account locked (5 failed PIN attempts)', 'security'
      );

      return query select null::uuid, null::text, null::jsonb, 0, false, 'Too many failed attempts. Account locked for 15 minutes.'::text;
    else
      update public.shop_memberships
      set failed_attempts = v_worker.failed_attempts + 1
      where id = v_worker.id;

      return query select null::uuid, null::text, null::jsonb, 0, false, 
        ('Incorrect PIN. ' || (5 - (v_worker.failed_attempts + 1)) || ' attempt(s) remaining.')::text;
    end if;
  end if;
end;
$$;

-- ==============================================================================
-- 018: COMPOSITE KEYS, IMMUTABILITY TRIGGERS, AND ACTION PERMISSION ENGINE
-- ==============================================================================

-- STRICT IMMUTABILITY TRIGGERS
CREATE OR REPLACE FUNCTION enforce_strict_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Hard Security Violation: Records in % are completely immutable and cannot be updated or deleted. You must record a compensating reversal entry.', TG_TABLE_NAME;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_ledger_entries ON ledger_entries;
CREATE TRIGGER trg_immutable_ledger_entries
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION enforce_strict_immutability();

DROP TRIGGER IF EXISTS trg_immutable_inventory_movements ON inventory_movements;
CREATE TRIGGER trg_immutable_inventory_movements
    BEFORE UPDATE OR DELETE ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION enforce_strict_immutability();

DROP TRIGGER IF EXISTS trg_immutable_worker_activity_logs ON worker_activity_logs;
CREATE TRIGGER trg_immutable_worker_activity_logs
    BEFORE UPDATE OR DELETE ON worker_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION enforce_strict_immutability();

-- ATOMIC STORED PROCEDURE: EXECUTE CREDIT SALE
CREATE OR REPLACE FUNCTION execute_credit_sale(
    p_shop_id UUID,
    p_customer_id UUID,
    p_member_id UUID,
    p_invoice_number VARCHAR,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_paid_amount NUMERIC,
    p_payment_method payment_method,
    p_items JSONB,
    p_notes TEXT
) RETURNS UUID AS $$
DECLARE
    v_sale_id UUID;
    v_balance NUMERIC;
    v_cust_balance NUMERIC;
    v_cust_limit NUMERIC;
    v_item RECORD;
    v_current_stock NUMERIC;
    v_resulting_stock NUMERIC;
BEGIN
    v_balance := p_total - p_paid_amount;

    IF NOT has_shop_permission(p_shop_id, 'sales:create') THEN
        RAISE EXCEPTION 'Authorization Error: Missing sales:create permission';
    END IF;

    SELECT current_balance, credit_limit 
    INTO v_cust_balance, v_cust_limit
    FROM customers 
    WHERE id = p_customer_id AND shop_id = p_shop_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid customer identifier for this shop';
    END IF;

    IF v_cust_limit > 0 AND (v_cust_balance + v_balance) > v_cust_limit THEN
        RAISE EXCEPTION 'Transaction Rejected: Credit limit of % exceeded. Projected: %', 
            v_cust_limit, (v_cust_balance + v_balance);
    END IF;

    INSERT INTO sales (
        shop_id, customer_id, created_by_member_id, invoice_number,
        subtotal, discount_amount, total_amount, paid_amount, balance_amount,
        payment_method, notes
    ) VALUES (
        p_shop_id, p_customer_id, p_member_id, p_invoice_number,
        p_subtotal, p_discount, p_total, p_paid_amount, v_balance,
        p_payment_method, p_notes
    ) RETURNING id INTO v_sale_id;

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID, quantity NUMERIC, unit_price NUMERIC, cost_price NUMERIC, total_price NUMERIC
    )
    LOOP
        SELECT current_stock INTO v_current_stock 
        FROM products 
        WHERE id = v_item.product_id AND shop_id = p_shop_id 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found in this shop', v_item.product_id;
        END IF;

        v_resulting_stock := v_current_stock - v_item.quantity;

        INSERT INTO sale_items (sale_id, shop_id, product_id, quantity, unit_price, cost_price, total_price)
        VALUES (v_sale_id, p_shop_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_item.cost_price, v_item.total_price);

        UPDATE products 
        SET current_stock = v_resulting_stock, updated_at = NOW() 
        WHERE id = v_item.product_id AND shop_id = p_shop_id;

        INSERT INTO inventory_movements (
            shop_id, product_id, movement_type, quantity_delta, resulting_stock,
            reference_sale_id, created_by_member_id
        ) VALUES (
            p_shop_id, v_item.product_id, 'sale', -v_item.quantity, v_resulting_stock,
            v_sale_id, p_member_id
        );
    END LOOP;

    IF v_balance > 0 THEN
        INSERT INTO ledger_entries (
            shop_id, customer_id, entry_type, debit, credit,
            running_balance, reference_sale_id, notes, created_by_member_id
        ) VALUES (
            p_shop_id, p_customer_id, 'credit_sale', v_balance, 0.00,
            v_cust_balance + v_balance, v_sale_id, 'Credit Sale: ' || p_invoice_number, p_member_id
        );

        UPDATE customers 
        SET current_balance = current_balance + v_balance, updated_at = NOW() 
        WHERE id = p_customer_id AND shop_id = p_shop_id;
    END IF;

    INSERT INTO worker_activity_logs (shop_id, member_id, action_type, metadata)
    VALUES (
        p_shop_id, p_member_id, 'SALE_CREATED',
        jsonb_build_object('sale_id', v_sale_id, 'total', p_total, 'credit', v_balance)
    );

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql;

-- SECURE WORKER AUTHENTICATION RPC
CREATE OR REPLACE FUNCTION verify_worker_login(
    p_shop_id UUID,
    p_phone VARCHAR,
    p_pin VARCHAR
) RETURNS TABLE (
    token_member_id UUID,
    worker_name VARCHAR,
    permissions JSONB
) SECURITY DEFINER AS $$
DECLARE
    v_member RECORD;
BEGIN
    SELECT id, worker_name, pin_hash, permissions, is_active
    INTO v_member
    FROM shop_memberships
    WHERE shop_id = p_shop_id 
      AND worker_phone = p_phone 
      AND member_type = 'worker';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Authentication Failed: Invalid shop or phone number';
    END IF;

    IF NOT v_member.is_active THEN
        RAISE EXCEPTION 'Account Inactive: Activation required by shop owner';
    END IF;

    IF v_member.pin_hash != crypt(p_pin, v_member.pin_hash) THEN
        RAISE EXCEPTION 'Authentication Failed: Incorrect security PIN';
    END IF;

    INSERT INTO worker_activity_logs (shop_id, member_id, action_type, metadata)
    VALUES (p_shop_id, v_member.id, 'WORKER_LOGIN', jsonb_build_object('timestamp', NOW()));

    RETURN QUERY SELECT v_member.id, v_member.worker_name, v_member.permissions;
END;
$$ LANGUAGE plpgsql;


