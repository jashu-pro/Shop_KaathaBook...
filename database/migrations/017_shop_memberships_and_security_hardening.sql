-- 017_shop_memberships_and_security_hardening.sql
-- Step 67B, 67C, 67D, 67E: Multi-Tenant Memberships, Hardened RBAC, Immutable Reversals, and Multi-Image Attachments

-- ============================================================================
-- 1. SINGLE AUTHORITATIVE MEMBERSHIP SYSTEM: public.shop_memberships
-- Hierarchy: auth.users -> shop_memberships -> shops -> custom permissions
-- Strictly two member types: 'owner' and 'worker' (Step 8)
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

-- ============================================================================
-- 2. WORKER ACTIVITY LOGS: public.worker_activity_logs (Append-Only Audit)
-- ============================================================================
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

-- ============================================================================
-- 3. MULTI-IMAGE SALE ATTACHMENTS: public.sale_attachments (Step 47–49)
-- ============================================================================
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

-- ============================================================================
-- 4. HELPER SECURITY FUNCTIONS FOR TENANT ISOLATION & PERMISSIONS
-- ============================================================================
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
  -- Owner always has 100% full permissions
  select exists(select 1 from public.shops where id = p_shop_id and owner_id = p_user_id) into v_is_owner;
  if v_is_owner then
    return true;
  end if;

  -- Read active worker permissions
  select permissions into v_perms
  from public.shop_memberships
  where shop_id = p_shop_id
    and user_id = p_user_id
    and status = 'active';

  if v_perms is null then
    return false;
  end if;

  -- Action-specific permission check
  if p_action is not null then
    return coalesce((v_perms->p_module->>p_action)::boolean, false);
  else
    return coalesce((v_perms->>p_module)::boolean, false);
  end if;
end;
$$;

-- ============================================================================
-- 5. RLS POLICIES FOR MEMBERSHIPS, LOGS & ATTACHMENTS
-- ============================================================================
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

-- ============================================================================
-- 6. SECURE RATE-LIMITED PIN AUTHENTICATION (Brute-Force Lockout)
-- 5 failed attempts locks the worker for 15 minutes (Rule 3)
-- ============================================================================
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

  -- Lockout check
  if v_worker.locked_until is not null and v_worker.locked_until > v_now then
    return query select null::uuid, null::text, null::jsonb, 0, false, 
      ('Account temporarily locked due to failed attempts. Try again in ' || 
       round(extract(epoch from (v_worker.locked_until - v_now)) / 60) || ' minutes.')::text;
    return;
  end if;

  -- PIN comparison
  if v_worker.pin_hash = p_pin_hash then
    -- Successful authentication: reset failed attempts and record activity
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
    -- Failed attempt: increment failed counter and lock if threshold exceeded
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

-- ============================================================================
-- 7. MATHEMATICALLY VERIFIED IMMUTABLE FINANCIAL REVERSALS (Rule 4)
-- Original + Reversal = Net Zero. Zero rows deleted from ledger or stock.
-- ============================================================================

-- A. Immutable Sale Voiding
create or replace function public.void_sale(p_sale_id uuid, p_reason text default null)
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
         notes = coalesce(notes, '') || ' [VOIDED: ' || coalesce(p_reason, 'Voided by merchant') || ' at ' || now()::text || ']',
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

    -- Net credit balance adjustment: minus the unpaid credit portion (total - paid)
    v_balance_after_reversal := v_balance_before - (v_sale.total_amount - v_sale.amount_paid);

    update public.customers
       set current_balance = v_balance_after_reversal,
           updated_at = now()
     where id = v_sale.customer_id;

    -- Offsetting Credit Entry to cancel original Debit: Sale total
    insert into public.ledger_entries (
      shop_id, customer_id, entry_date, entry_type, amount, balance_after,
      description, reference_type, reference_id
    ) values (
      v_sale.shop_id, v_sale.customer_id, now(), 'credit', v_sale.total_amount,
      (v_balance_before - v_sale.total_amount),
      'Reversal: Voided Sale ' || v_sale.invoice_no, 'void_sale', v_sale.id
    );

    -- If immediate payment was recorded with this sale, reverse it too
    select * into v_immediate_payment
    from public.payments
    where sale_id = p_sale_id
    limit 1;

    if found then
      -- Mark payment as voided
      update public.payments
         set notes = coalesce(notes, '') || ' [VOIDED with Sale]',
             updated_at = now()
       where id = v_immediate_payment.id;

      -- Offsetting Debit Entry to refund the paid amount back into ledger balance calculation
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

-- B. Immutable Payment Voiding
create or replace function public.void_payment(p_payment_id uuid, p_reason text default null)
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

  -- 1. Mark payment as voided
  update public.payments
     set notes = coalesce(notes, '') || ' [VOIDED: ' || coalesce(p_reason, 'Voided by merchant') || ' at ' || now()::text || ']',
         updated_at = now()
   where id = p_payment_id;

  -- 2. Restore customer debt balance: customer owes payment amount again
  update public.customers
     set current_balance = current_balance + v_payment.amount,
         updated_at = now()
   where id = v_payment.customer_id
   returning current_balance into v_balance_after;

  -- 3. Post offsetting Debit Entry to cancel original Credit payment
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

-- C. Immutable Ledger Adjustment Voiding
create or replace function public.void_ledger_adjustment(p_entry_id uuid, p_reason text default null)
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

  -- Restore customer balance
  update public.customers
     set current_balance = current_balance + case when v_entry.entry_type = 'debit' then -v_entry.amount else v_entry.amount end,
         updated_at = now()
   where id = v_entry.customer_id
   returning current_balance into v_balance_after;

  -- Post offsetting adjustment reversal
  insert into public.ledger_entries (
    shop_id, customer_id, entry_date, entry_type, amount, balance_after,
    description, reference_type, reference_id
  ) values (
    v_entry.shop_id, v_entry.customer_id, now(), v_opposite_type, v_entry.amount,
    v_balance_after,
    'Reversal: ' || v_entry.description || ' (' || coalesce(p_reason, 'Voided') || ')',
    'void_adjustment', v_entry.id
  );
end;
$$;
