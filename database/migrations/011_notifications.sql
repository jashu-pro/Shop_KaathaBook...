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
