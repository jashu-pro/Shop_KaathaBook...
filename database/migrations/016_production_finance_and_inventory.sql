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
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'Sale not found' using errcode = 'P0001';
  end if;

  if v_sale.customer_id is not null then
    update public.customers
       set current_balance = current_balance - (v_sale.total_amount - v_sale.amount_paid),
           updated_at = now()
     where id = v_sale.customer_id;
  end if;

  delete from public.ledger_entries
   where reference_id = v_sale.id
      or reference_id in (select id from public.payments where sale_id = v_sale.id);
  delete from public.stock_movements where sale_id = v_sale.id;
  delete from public.sales where id = v_sale.id;
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
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0001';
  end if;
  if v_payment.sale_id is not null then
    raise exception 'Void the associated sale instead of its immediate payment' using errcode = 'P0001';
  end if;

  update public.customers
     set current_balance = current_balance + v_payment.amount,
         updated_at = now()
   where id = v_payment.customer_id;
  delete from public.ledger_entries where reference_id = v_payment.id;
  delete from public.payments where id = v_payment.id;
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
begin
  select * into v_entry from public.ledger_entries where id = p_entry_id for update;
  if not found then
    raise exception 'Ledger entry not found' using errcode = 'P0001';
  end if;
  if v_entry.reference_type is distinct from 'adjustment' then
    raise exception 'Only manual adjustments can be removed directly' using errcode = 'P0001';
  end if;
  update public.customers
     set current_balance = current_balance + case when v_entry.entry_type = 'debit' then -v_entry.amount else v_entry.amount end,
         updated_at = now()
   where id = v_entry.customer_id;
  delete from public.ledger_entries where id = p_entry_id;
end;
$$;
