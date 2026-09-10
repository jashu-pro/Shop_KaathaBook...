-- 020_profiles_insert_policy_and_sync.sql
-- Ensure profiles can be inserted by authenticated users and backfill any missing profiles

-- 1. Allow authenticated users to insert their own profile row
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Update trigger function to be robust and handle conflicts & phone users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, new.phone || '@phone.local', new.id::text || '@user.local'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- 3. Backfill any existing auth users missing from profiles
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  coalesce(email, phone || '@phone.local', id::text || '@user.local'), 
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''), 
  coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', '')
from auth.users
on conflict (id) do nothing;
