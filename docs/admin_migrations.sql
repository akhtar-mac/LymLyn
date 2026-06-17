-- ============================================================
-- LYM|LYN Admin Panel — Database Migrations
-- Run in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ── Admin roles on profiles ───────────────────────────────────
alter table profiles
  add column if not exists admin_role text
  check (admin_role in ('super_admin', 'manager', 'support', 'packer'))
  default null;

-- ── Low stock threshold on product_variants ───────────────────
alter table product_variants
  add column if not exists low_stock_threshold int default 5;

-- ── Coupon code on orders (for tracking which coupon was used) ─
alter table orders
  add column if not exists coupon_code text default null;

-- ── Coupons table ─────────────────────────────────────────────
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text check (discount_type in ('percent', 'flat')) not null,
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) default 0,
  max_uses int default null,           -- null = unlimited
  uses_count int default 0,
  expires_at timestamptz default null, -- null = no expiry
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── Reviews table ─────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  rating int check (rating between 1 and 5) not null,
  title text,
  body text,
  status text check (status in ('published', 'hidden')) default 'published',
  created_at timestamptz default now()
);

-- ── Audit log ─────────────────────────────────────────────────
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ── Inventory movements ───────────────────────────────────────
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references product_variants(id) on delete cascade,
  change_qty int not null,
  reason text check (reason in ('sale', 'restock', 'manual_adjustment', 'return')),
  admin_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- ── RLS for new tables ────────────────────────────────────────

alter table coupons enable row level security;
alter table reviews enable row level security;
alter table admin_audit_log enable row level security;
alter table inventory_movements enable row level security;

-- Public can read active coupons (needed for checkout validation)
create policy "Public can read active coupons" on coupons
  for select using (is_active = true);

-- Public can read published reviews
create policy "Public can read published reviews" on reviews
  for select using (status = 'published');

-- Users can insert their own review
create policy "Users can insert own review" on reviews
  for insert with check (auth.uid() = user_id);

-- Audit log: no client reads at all (backend service role only)
-- No SELECT policy = no client access

-- Inventory movements: no client reads (backend only)
-- No SELECT policy = no client access

-- ── Make yourself a super_admin ───────────────────────────────
-- Replace 'your@email.com' with your actual email, then run this:
-- update profiles
--   set admin_role = 'super_admin'
-- where id = (select id from auth.users where email = 'your@email.com');
