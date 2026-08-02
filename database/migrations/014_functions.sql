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
