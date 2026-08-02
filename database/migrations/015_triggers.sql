-- 015_triggers.sql
-- Triggers linking tables to system logic

-- Hook new users up from Supabase Auth to profiles table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Hook product stock updates up to sale_items changes
drop trigger if exists on_sale_item_modified on public.sale_items;
create trigger on_sale_item_modified
  after insert or update or delete on public.sale_items
  for each row execute procedure public.adjust_product_stock();
