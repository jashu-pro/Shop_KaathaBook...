-- ============================================================================
-- 022: ADMIN AUTHORIZATION HARDENING
-- ============================================================================
-- Fixes two privilege-escalation paths introduced in 021:
--   1. is_platform_admin() trusted user-controlled data (raw_user_meta_data
--      'role' / 'is_admin', and email patterns like '%admin@%'). Any user could
--      sign up as "x-admin@..." or with is_admin metadata and become an admin.
--   2. The admin RPCs took the acting admin from a caller-supplied p_admin_id,
--      so anyone who knew an admin's UUID could act as that admin.
--
-- After this migration the ONLY source of admin rights is a row in
-- public.platform_admins, and admin RPCs always act as auth.uid().
--
-- IMPORTANT: before running, make sure every real admin has a row in
-- public.platform_admins, or they will lose admin access. In the Supabase SQL
-- editor (runs as the service role, bypassing RLS):
--
--   insert into public.platform_admins (id, email, role)
--   select id, email, 'super_admin' from auth.users
--   where email = '<your-admin-email>'
--   on conflict (id) do nothing;
-- ============================================================================

-- 1. Admin check: platform_admins table only.
create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_user_id is not null
     and exists (select 1 from public.platform_admins where id = p_user_id);
$$;

-- 2. Admin RPCs: act only as the authenticated caller.
--    p_admin_id is kept in the signatures so existing clients keep working,
--    but it is ignored.
create or replace function public.rpc_approve_shop_registration(
  p_request_id uuid,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_owner_id uuid;
  v_shop_name text;
  v_admin_email text;
  v_caller_admin uuid := auth.uid();
begin
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

  select email into v_admin_email from auth.users where id = v_caller_admin;

  update public.shop_registration_requests set
    status = 'approved',
    approved_by = v_caller_admin,
    approved_at = timezone('utc'::text, now()),
    rejection_reason = null,
    updated_at = timezone('utc'::text, now())
  where id = p_request_id;

  update public.shops set
    status = 'active',
    updated_at = timezone('utc'::text, now())
  where id = v_shop_id;

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

create or replace function public.rpc_reject_shop_registration(
  p_request_id uuid,
  p_rejection_reason text,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_owner_id uuid;
  v_shop_name text;
  v_admin_email text;
  v_caller_admin uuid := auth.uid();
begin
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

  select email into v_admin_email from auth.users where id = v_caller_admin;

  update public.shop_registration_requests set
    status = 'rejected',
    rejection_reason = trim(p_rejection_reason),
    rejected_by = v_caller_admin,
    rejected_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  where id = p_request_id;

  update public.shops set
    status = 'rejected',
    updated_at = timezone('utc'::text, now())
  where id = v_shop_id;

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

create or replace function public.rpc_suspend_shop(
  p_shop_id uuid,
  p_reason text,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_admin uuid := auth.uid();
  v_admin_email text;
  v_shop_name text;
begin
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
set search_path = public
as $$
declare
  v_caller_admin uuid := auth.uid();
  v_admin_email text;
  v_shop_name text;
begin
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

-- 3. Only signed-in users may call admin functions (Postgres grants EXECUTE
--    to PUBLIC by default, which includes the anon role).
revoke execute on function public.is_platform_admin(uuid) from public, anon;
revoke execute on function public.rpc_approve_shop_registration(uuid, uuid) from public, anon;
revoke execute on function public.rpc_reject_shop_registration(uuid, text, uuid) from public, anon;
revoke execute on function public.rpc_suspend_shop(uuid, text, uuid) from public, anon;
revoke execute on function public.rpc_reactivate_shop(uuid, uuid) from public, anon;

grant execute on function public.is_platform_admin(uuid) to authenticated;
grant execute on function public.rpc_approve_shop_registration(uuid, uuid) to authenticated;
grant execute on function public.rpc_reject_shop_registration(uuid, text, uuid) to authenticated;
grant execute on function public.rpc_suspend_shop(uuid, text, uuid) to authenticated;
grant execute on function public.rpc_reactivate_shop(uuid, uuid) to authenticated;
