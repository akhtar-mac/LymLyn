-- ============================================================
-- LYM|LYN — Seed Data (8 products, variants, images)
-- Run AFTER schema.sql. Requires the categories to exist.
-- ============================================================

-- ── T-Shirts ─────────────────────────────────────────────────

with cat as (select id from categories where slug = 'tshirts' limit 1)
insert into products (category_id, name, slug, description, base_price, garment_type, fit_type, is_active)
select cat.id, unnest(array[
  'Essential Oversized Tee',
  'Boxy Fit Drop-Shoulder',
  'Vintage Wash Regular Tee',
  'Box Logo Statement Tee'
]),
unnest(array[
  'essential-oversized-tee',
  'boxy-fit-drop-shoulder',
  'vintage-wash-regular-tee',
  'box-logo-statement-tee'
]),
unnest(array[
  'Our most-loved piece. Oversized silhouette, 240gsm jersey, dropped shoulders. Wash after wash, it holds shape.',
  'Wide boxy fit with deep drop shoulders. Cut for layering or wearing solo.',
  'Vintage garment-washed cotton. Each piece has a unique tone from the wash process.',
  'Heavyweight 300gsm with a chest box logo. Classic colourways, built to last.'
]),
unnest(array[799, 999, 1099, 1299]::numeric[]),
'tshirt',
unnest(array['oversized','oversized','regular','regular']),
true
from cat;

-- ── Lowers ───────────────────────────────────────────────────

with cat as (select id from categories where slug = 'lowers' limit 1)
insert into products (category_id, name, slug, description, base_price, garment_type, fit_type, is_active)
select cat.id, unnest(array[
  'Easy Cargo Lower',
  'Wide-Leg Linen Pant',
  'Track Jogger',
  'Elastic Waist Wide Fit'
]),
unnest(array[
  'easy-cargo-lower',
  'wide-leg-linen-pant',
  'track-jogger',
  'elastic-waist-wide-fit'
]),
unnest(array[
  'Relaxed cargo cut with side pockets and adjustable hem. The go-anywhere lower.',
  'Lightweight linen-blend. Wide leg, breathable, and effortlessly styled.',
  'Tapered track jogger in brushed fleece. Elastic waistband with drawstring.',
  'Elastic waist, wide cut, available in solids and heathered tones.'
]),
unnest(array[999, 1499, 799, 899]::numeric[]),
'lower',
unnest(array['regular','regular','regular','oversized']),
true
from cat;

-- ── Variants (sample — Oversized Tee in 3 colors × 5 sizes) ──

with prod as (select id from products where slug = 'essential-oversized-tee' limit 1)
insert into product_variants (product_id, color_name, color_hex, size, stock_qty, sku)
select prod.id,
  unnest(array['Ink Black','Stone White','Washed Olive','Ink Black','Stone White','Washed Olive','Ink Black','Stone White','Washed Olive','Ink Black','Stone White','Washed Olive','Ink Black','Stone White','Washed Olive']),
  unnest(array['#1A1A1A','#F0EDE8','#6B6B4E','#1A1A1A','#F0EDE8','#6B6B4E','#1A1A1A','#F0EDE8','#6B6B4E','#1A1A1A','#F0EDE8','#6B6B4E','#1A1A1A','#F0EDE8','#6B6B4E']),
  unnest(array['S','S','S','M','M','M','L','L','L','XL','XL','XL','XXL','XXL','XXL']),
  unnest(array[10,8,6,15,12,10,20,18,12,15,12,8,5,5,3]),
  unnest(array['EOT-BLK-S','EOT-WHT-S','EOT-OLV-S','EOT-BLK-M','EOT-WHT-M','EOT-OLV-M','EOT-BLK-L','EOT-WHT-L','EOT-OLV-L','EOT-BLK-XL','EOT-WHT-XL','EOT-OLV-XL','EOT-BLK-XXL','EOT-WHT-XXL','EOT-OLV-XXL'])
from prod;

-- Add simple S/M/L/XL/XXL variants for remaining products (single color each for seed)

with prod as (select id, slug from products where slug in ('boxy-fit-drop-shoulder','vintage-wash-regular-tee','box-logo-statement-tee','easy-cargo-lower','wide-leg-linen-pant','track-jogger','elastic-waist-wide-fit'))
insert into product_variants (product_id, color_name, color_hex, size, stock_qty, sku)
select
  prod.id,
  case
    when prod.slug in ('boxy-fit-drop-shoulder') then 'Cement Grey'
    when prod.slug in ('vintage-wash-regular-tee') then 'Vintage Mocha'
    when prod.slug in ('box-logo-statement-tee') then 'Ink Black'
    when prod.slug in ('easy-cargo-lower') then 'Khaki'
    when prod.slug in ('wide-leg-linen-pant') then 'Oatmeal'
    when prod.slug in ('track-jogger') then 'Charcoal'
    else 'Stone White'
  end,
  case
    when prod.slug in ('boxy-fit-drop-shoulder') then '#9E9E9E'
    when prod.slug in ('vintage-wash-regular-tee') then '#8B7355'
    when prod.slug in ('box-logo-statement-tee') then '#1A1A1A'
    when prod.slug in ('easy-cargo-lower') then '#C3A882'
    when prod.slug in ('wide-leg-linen-pant') then '#F5F0E8'
    when prod.slug in ('track-jogger') then '#4A4A4A'
    else '#F0EDE8'
  end,
  sizes.size,
  12,
  upper(left(prod.slug, 6)) || '-' || upper(left(case when prod.slug in ('boxy-fit-drop-shoulder') then 'grey' when prod.slug in ('vintage-wash-regular-tee') then 'mocha' when prod.slug in ('box-logo-statement-tee') then 'blk' when prod.slug in ('easy-cargo-lower') then 'kha' when prod.slug in ('wide-leg-linen-pant') then 'oat' when prod.slug in ('track-jogger') then 'char' else 'wht' end, 3)) || '-' || sizes.size
from prod
cross join (select unnest(array['S','M','L','XL','XXL']) as size) sizes;
