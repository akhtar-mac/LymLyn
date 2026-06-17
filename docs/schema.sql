-- ============================================================
-- LYM|LYN — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── PROFILES (extends Supabase auth.users) ──────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  gender text check (gender in ('male','female','unisex')),
  height_cm int,
  weight_kg int,
  body_type text check (body_type in ('slim','average','heavy')),
  fit_preference text check (fit_preference in ('regular','oversized')),
  skin_tone_hex text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile row on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── CATEGORIES ───────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

-- ── PRODUCTS ─────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  slug text unique not null,
  description text,
  base_price numeric(10,2) not null,
  garment_type text check (garment_type in ('tshirt','lower')),
  fit_type text check (fit_type in ('regular','oversized')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── PRODUCT VARIANTS (colour × size) ─────────────────────────
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  color_name text not null,
  color_hex text not null,
  size text check (size in ('S','M','L','XL','XXL')),
  stock_qty int default 0,
  sku text unique not null
);

-- ── PRODUCT IMAGES ────────────────────────────────────────────
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references product_variants(id),
  image_url text not null,
  image_type text check (image_type in ('lifestyle','flat_front','flat_back','flat_side')),
  sort_order int default 0
);

-- ── AVATAR TEMPLATES (virtual try-on) ────────────────────────
create table if not exists avatar_templates (
  id uuid primary key default gen_random_uuid(),
  gender text check (gender in ('male','female')),
  body_type text check (body_type in ('slim','average','heavy')),
  size_label text,
  silhouette_svg_url text not null,
  front_view_url text,
  back_view_url text,
  side_view_url text,
  anchor_points jsonb  -- { shoulder_left, shoulder_right, waist, hip_left, hip_right, ankle_left, ankle_right }
);

-- ── ORDERS ───────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  status text check (status in ('pending','paid','shipped','delivered','cancelled')) default 'pending',
  total_amount numeric(10,2) not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  shipping_address jsonb,
  created_at timestamptz default now()
);

-- ── ORDER ITEMS ──────────────────────────────────────────────
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  variant_id uuid references product_variants(id),
  quantity int not null,
  unit_price numeric(10,2) not null
);

-- ── WISHLIST ─────────────────────────────────────────────────
create table if not exists wishlist (
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table avatar_templates enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wishlist enable row level security;

-- ── Profiles: only the owner can read/write ──────────────────
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- ── Public catalog: anyone can read ─────────────────────────
create policy "Public can read categories" on categories
  for select using (true);

create policy "Public can read products" on products
  for select using (is_active = true);

create policy "Public can read product_variants" on product_variants
  for select using (true);

create policy "Public can read product_images" on product_images
  for select using (true);

create policy "Public can read avatar_templates" on avatar_templates
  for select using (true);

-- ── Orders: users see only their own ─────────────────────────
create policy "Users can view own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users can insert own orders" on orders
  for insert with check (auth.uid() = user_id);

create policy "Users can view own order items" on order_items
  for select using (
    exists (
      select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

-- ── Wishlist ─────────────────────────────────────────────────
create policy "Users can manage own wishlist" on wishlist
  for all using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA (basic categories)
-- ============================================================

insert into categories (name, slug) values
  ('T-Shirts', 'tshirts'),
  ('Lowers', 'lowers')
on conflict (slug) do nothing;
