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
