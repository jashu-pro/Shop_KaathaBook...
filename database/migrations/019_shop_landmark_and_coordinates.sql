-- 019_shop_landmark_and_coordinates.sql
-- Add landmark and GPS coordinates to public.shops table

alter table public.shops
  add column if not exists landmark text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
