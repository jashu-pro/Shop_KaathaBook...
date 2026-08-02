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
