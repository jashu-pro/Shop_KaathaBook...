-- 021_shop_registration_requests_and_approval_system.sql
-- Step: Production Admin Approval & Shop Management System
-- Atomic registration, transactional approvals/rejections, strict credential isolation, and immutable audit logs.

-- ============================================================================
-- 1. ADD STATUS COLUMN TO SHOPS TABLE
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'shops' and column_name = 'status'
  ) then
    alter table public.shops 
      add column status text not null default 'pending' 
      check (status in ('pending', 'active', 'suspended', 'rejected'));
      
    -- Upgrade existing legacy shops to 'active' so established data is unaffected
    update public.shops set status = 'active' where status = 'pending';
  end if;
end $$;

create index if not exists idx_shops_status on public.shops(status);

-- ============================================================================
-- 2. PLATFORM ADMINS TABLE & HELPER FUNCTION
-- ============================================================================
create table if not exists public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'super_admin' check (role in ('super_admin', 'support_admin', 'auditor')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.platform_admins enable row level security;

drop policy if exists "Admins can view platform admins" on public.platform_admins;
create policy "Admins can view platform admins"
  on public.platform_admins for select
  using (
    auth.uid() is not null and (
      auth.uid() = id or public.is_platform_admin(auth.uid())
    )
  );

drop policy if exists "Admins can insert platform admins" on public.platform_admins;
create policy "Admins can insert platform admins"
  on public.platform_admins for insert
  with check (
    auth.uid() is not null and public.is_platform_admin(auth.uid())
  );

drop policy if exists "Admins can update platform admins" on public.platform_admins;
create policy "Admins can update platform admins"
  on public.platform_admins for update
  using (
    auth.uid() is not null and public.is_platform_admin(auth.uid())
  );

drop policy if exists "Admins can delete platform admins" on public.platform_admins;
create policy "Admins can delete platform admins"
  on public.platform_admins for delete
  using (
    auth.uid() is not null and public.is_platform_admin(auth.uid())
  );

create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_is_admin boolean;
  v_email text;
begin
  if p_user_id is null then
    return false;
  end if;

  -- 1. Check platform_admins table
  select exists (
    select 1 from public.platform_admins where id = p_user_id
  ) into v_is_admin;

  if v_is_admin then
    return true;
  end if;

  -- 2. Check auth.users user_metadata role or email pattern
  select 
    (raw_user_meta_data->>'role' = 'admin' or 
     raw_user_meta_data->>'is_admin' = 'true' or
     email = 'jaswanthmajji43@gmail.com' or
     email like '%admin@%' or
     email like '%@admin.%')
  into v_is_admin
  from auth.users
  where id = p_user_id;

  return coalesce(v_is_admin, false);
end;
$$;

-- ============================================================================
-- 3. SHOP REGISTRATION REQUESTS TABLE (ZERO PASSWORDS/CREDENTIALS)
-- ============================================================================
create table if not exists public.shop_registration_requests (
  id uuid default gen_random_uuid() primary key,
  owner_user_id uuid references auth.users(id) on delete cascade not null,
  shop_id uuid references public.shops(id) on delete cascade not null,
  shop_name text not null,
  business_type text not null,
  email text not null,
  phone text,
  address text,
  landmark text,
  city text,
  state text,
  pincode text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamp with time zone,
  rejected_by uuid references auth.users(id) on delete set null,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_shop_reg_shop_id unique (shop_id)
);

alter table public.shop_registration_requests enable row level security;

create index if not exists idx_shop_reg_status on public.shop_registration_requests(status);
create index if not exists idx_shop_reg_owner on public.shop_registration_requests(owner_user_id);
create index if not exists idx_shop_reg_created on public.shop_registration_requests(created_at desc);

-- RLS Policies for shop_registration_requests
drop policy if exists "Owners can view their own registration requests" on public.shop_registration_requests;
create policy "Owners can view their own registration requests"
  on public.shop_registration_requests for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Owners can create registration requests" on public.shop_registration_requests;
create policy "Owners can create registration requests"
  on public.shop_registration_requests for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "Admins can view all registration requests" on public.shop_registration_requests;
create policy "Admins can view all registration requests"
  on public.shop_registration_requests for select
  using (public.is_platform_admin(auth.uid()));

drop policy if exists "Admins can update registration requests" on public.shop_registration_requests;
create policy "Admins can update registration requests"
  on public.shop_registration_requests for update
  using (public.is_platform_admin(auth.uid()));

-- ============================================================================
-- 4. IMMUTABLE ADMIN AUDIT LOGS TABLE
-- ============================================================================
create table if not exists public.admin_audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) on delete set null,
  admin_email text,
  shop_id uuid references public.shops(id) on delete cascade,
  action text not null check (action in (
    'ADMIN_APPROVED_SHOP',
    'ADMIN_REJECTED_SHOP',
    'ADMIN_SUSPENDED_SHOP',
    'ADMIN_REACTIVATED_SHOP'
  )),
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.admin_audit_logs enable row level security;

create index if not exists idx_admin_audit_shop on public.admin_audit_logs(shop_id);
create index if not exists idx_admin_audit_created on public.admin_audit_logs(created_at desc);

-- Platform admins can view and insert audit logs
drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
  on public.admin_audit_logs for select
  using (public.is_platform_admin(auth.uid()));

drop policy if exists "Admins can insert audit logs" on public.admin_audit_logs;
create policy "Admins can insert audit logs"
  on public.admin_audit_logs for insert
  with check (
    auth.uid() is not null and (
      public.is_platform_admin(auth.uid()) or auth.uid() = admin_id
    )
  );

-- ============================================================================
-- 5. ATOMIC RPC: SUBMIT SHOP REGISTRATION
-- (User Profile -> Shop 'pending' -> Request 'pending' -> Membership 'owner')
-- ============================================================================
create or replace function public.rpc_submit_shop_registration(
  p_shop_id uuid,
  p_owner_id uuid,
  p_name text,
  p_tagline text default null,
  p_business_type text default 'General Store',
  p_phone text default null,
  p_address text default null,
  p_landmark text default null,
  p_city text default null,
  p_state text default null,
  p_pincode text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_gstin text default null,
  p_pan text default null,
  p_upi_id text default null,
  p_logo_url text default null,
  p_currency text default 'INR',
  p_theme text default 'dark',
  p_language text default 'en',
  p_owner_email text default null,
  p_owner_name text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_shop_id uuid;
  v_request_id uuid;
  v_user_email text;
  v_user_name text;
begin
  -- Resolve caller authentication or provided owner ID
  if p_owner_id is null then
    p_owner_id := auth.uid();
  end if;
  
  if p_owner_id is null then
    raise exception 'Authentication required: owner_id cannot be null';
  end if;

  v_shop_id := coalesce(p_shop_id, gen_random_uuid());

  -- Ensure profile exists
  select email, raw_user_meta_data->>'full_name' 
  into v_user_email, v_user_name 
  from auth.users 
  where id = p_owner_id;

  v_user_email := coalesce(p_owner_email, v_user_email, (p_owner_id::text || '@user.local'));
  v_user_name := coalesce(p_owner_name, v_user_name, p_name);

  insert into public.profiles (id, email, full_name)
  values (p_owner_id, v_user_email, v_user_name)
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email);

  -- 1. Create shop with status 'pending'
  insert into public.shops (
    id, owner_id, name, tagline, business_type, phone, address, landmark,
    city, state, pincode, latitude, longitude, gstin, pan, upi_id, logo_url,
    currency, theme, language, status
  ) values (
    v_shop_id, p_owner_id, p_name, p_tagline, p_business_type, p_phone, p_address, p_landmark,
    p_city, p_state, p_pincode, p_latitude, p_longitude, p_gstin, p_pan, p_upi_id, p_logo_url,
    p_currency, p_theme, p_language, 'pending'
  )
  on conflict (id) do update set
    name = excluded.name,
    business_type = excluded.business_type,
    phone = excluded.phone,
    address = excluded.address,
    status = 'pending',
    updated_at = timezone('utc'::text, now());

  -- 2. Create registration request with status 'pending'
  insert into public.shop_registration_requests (
    owner_user_id, shop_id, shop_name, business_type, email, phone,
    address, landmark, city, state, pincode, status
  ) values (
    p_owner_id, v_shop_id, p_name, p_business_type, v_user_email, p_phone,
    p_address, p_landmark, p_city, p_state, p_pincode, 'pending'
  )
  on conflict (shop_id) do update set
    shop_name = excluded.shop_name,
    business_type = excluded.business_type,
    email = excluded.email,
    phone = excluded.phone,
    address = excluded.address,
    status = 'pending',
    rejection_reason = null,
    rejected_by = null,
    rejected_at = null,
    updated_at = timezone('utc'::text, now())
  returning id into v_request_id;

  -- 3. Create owner membership in shop_memberships
  insert into public.shop_memberships (
    shop_id, user_id, member_type, name, email_or_phone, status, permissions
  ) values (
    v_shop_id, p_owner_id, 'owner', v_user_name, v_user_email, 'active', '{"all": true}'::jsonb
  )
  on conflict (shop_id, email_or_phone) do update set
    status = 'active',
    updated_at = timezone('utc'::text, now());

  return jsonb_build_object(
    'success', true,
    'shop_id', v_shop_id,
    'request_id', v_request_id,
    'status', 'pending'
  );
end;
$$;

-- ============================================================================
-- 6. ATOMIC RPC: APPROVE SHOP REGISTRATION
-- ============================================================================
create or replace function public.rpc_approve_shop_registration(
  p_request_id uuid,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_shop_id uuid;
  v_owner_id uuid;
  v_shop_name text;
  v_admin_email text;
  v_caller_admin uuid;
begin
  v_caller_admin := coalesce(p_admin_id, auth.uid());

  -- Verify admin authorization
  if not public.is_platform_admin(v_caller_admin) then
    raise exception 'Unauthorized: Only platform administrators can approve shop registrations.';
  end if;

  select shop_id, owner_user_id, shop_name
  into v_shop_id, v_owner_id, v_shop_name
  from public.shop_registration_requests
  where id = p_request_id;

  if v_shop_id is null then
    raise exception 'Registration request not found for ID: %', p_request_id;
  end if;

  -- Get admin email
  select email into v_admin_email from auth.users where id = v_caller_admin;

  -- 1. Update registration request
  update public.shop_registration_requests set
    status = 'approved',
    approved_by = v_caller_admin,
    approved_at = timezone('utc'::text, now()),
    rejection_reason = null,
    updated_at = timezone('utc'::text, now())
  where id = p_request_id;

  -- 2. Update shop to active
  update public.shops set
    status = 'active',
    updated_at = timezone('utc'::text, now())
  where id = v_shop_id;

  -- 3. Write immutable audit log
  insert into public.admin_audit_logs (
    admin_id, admin_email, shop_id, action, metadata
  ) values (
    v_caller_admin,
    v_admin_email,
    v_shop_id,
    'ADMIN_APPROVED_SHOP',
    jsonb_build_object(
      'request_id', p_request_id,
      'shop_name', v_shop_name,
      'owner_id', v_owner_id,
      'approved_at', timezone('utc'::text, now())
    )
  );

  return jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'shop_id', v_shop_id,
    'status', 'active'
  );
end;
$$;

-- ============================================================================
-- 7. ATOMIC RPC: REJECT SHOP REGISTRATION
-- ============================================================================
create or replace function public.rpc_reject_shop_registration(
  p_request_id uuid,
  p_rejection_reason text,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_shop_id uuid;
  v_owner_id uuid;
  v_shop_name text;
  v_admin_email text;
  v_caller_admin uuid;
begin
  v_caller_admin := coalesce(p_admin_id, auth.uid());

  -- Verify admin authorization
  if not public.is_platform_admin(v_caller_admin) then
    raise exception 'Unauthorized: Only platform administrators can reject shop registrations.';
  end if;

  if trim(coalesce(p_rejection_reason, '')) = '' then
    raise exception 'A rejection reason is required when rejecting a shop registration.';
  end if;

  select shop_id, owner_user_id, shop_name
  into v_shop_id, v_owner_id, v_shop_name
  from public.shop_registration_requests
  where id = p_request_id;

  if v_shop_id is null then
    raise exception 'Registration request not found for ID: %', p_request_id;
  end if;

  -- Get admin email
  select email into v_admin_email from auth.users where id = v_caller_admin;

  -- 1. Update registration request
  update public.shop_registration_requests set
    status = 'rejected',
    rejection_reason = trim(p_rejection_reason),
    rejected_by = v_caller_admin,
    rejected_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  where id = p_request_id;

  -- 2. Update shop to rejected
  update public.shops set
    status = 'rejected',
    updated_at = timezone('utc'::text, now())
  where id = v_shop_id;

  -- 3. Write immutable audit log
  insert into public.admin_audit_logs (
    admin_id, admin_email, shop_id, action, metadata
  ) values (
    v_caller_admin,
    v_admin_email,
    v_shop_id,
    'ADMIN_REJECTED_SHOP',
    jsonb_build_object(
      'request_id', p_request_id,
      'shop_name', v_shop_name,
      'owner_id', v_owner_id,
      'rejection_reason', trim(p_rejection_reason),
      'rejected_at', timezone('utc'::text, now())
    )
  );

  return jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'shop_id', v_shop_id,
    'status', 'rejected',
    'rejection_reason', trim(p_rejection_reason)
  );
end;
$$;

-- ============================================================================
-- 8. ATOMIC RPC: SUSPEND & REACTIVATE SHOP
-- ============================================================================
create or replace function public.rpc_suspend_shop(
  p_shop_id uuid,
  p_reason text,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_caller_admin uuid;
  v_admin_email text;
  v_shop_name text;
begin
  v_caller_admin := coalesce(p_admin_id, auth.uid());
  if not public.is_platform_admin(v_caller_admin) then
    raise exception 'Unauthorized: Admin privileges required.';
  end if;

  select name into v_shop_name from public.shops where id = p_shop_id;
  if v_shop_name is null then
    raise exception 'Shop not found.';
  end if;

  select email into v_admin_email from auth.users where id = v_caller_admin;

  update public.shops set
    status = 'suspended',
    updated_at = timezone('utc'::text, now())
  where id = p_shop_id;

  insert into public.admin_audit_logs (
    admin_id, admin_email, shop_id, action, metadata
  ) values (
    v_caller_admin,
    v_admin_email,
    p_shop_id,
    'ADMIN_SUSPENDED_SHOP',
    jsonb_build_object('shop_name', v_shop_name, 'reason', p_reason)
  );

  return jsonb_build_object('success', true, 'shop_id', p_shop_id, 'status', 'suspended');
end;
$$;

create or replace function public.rpc_reactivate_shop(
  p_shop_id uuid,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_caller_admin uuid;
  v_admin_email text;
  v_shop_name text;
begin
  v_caller_admin := coalesce(p_admin_id, auth.uid());
  if not public.is_platform_admin(v_caller_admin) then
    raise exception 'Unauthorized: Admin privileges required.';
  end if;

  select name into v_shop_name from public.shops where id = p_shop_id;
  if v_shop_name is null then
    raise exception 'Shop not found.';
  end if;

  select email into v_admin_email from auth.users where id = v_caller_admin;

  update public.shops set
    status = 'active',
    updated_at = timezone('utc'::text, now())
  where id = p_shop_id;

  insert into public.admin_audit_logs (
    admin_id, admin_email, shop_id, action, metadata
  ) values (
    v_caller_admin,
    v_admin_email,
    p_shop_id,
    'ADMIN_REACTIVATED_SHOP',
    jsonb_build_object('shop_name', v_shop_name)
  );

  return jsonb_build_object('success', true, 'shop_id', p_shop_id, 'status', 'active');
end;
$$;
