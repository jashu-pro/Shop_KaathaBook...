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
