-- 012_add_catalog_columns_to_doctors.sql
-- Adds the modern catalog columns to the doctors table to support the cloud catalog schema
-- This migration is designed to be backward compatible with the existing legacy schema

-- 1. Ensure the pgcrypto extension is installed (for gen_random_uuid)
create extension if not exists pgcrypto;

-- 2. Add slug column for URL-friendly doctor identifiers
alter table public.doctors
add column if not exists slug text unique;

-- 3. Add Arabic and English name columns (keeping existing 'name' column for backward compatibility)
alter table public.doctors
add column if not exists name_ar text,
add column if not exists name_en text;

-- 4. Add Arabic and English specialty columns (keeping existing 'specialty' column for backward compatibility)
alter table public.doctors
add column if not exists specialty_ar text,
add column if not exists specialty_en text;

-- 5. Add Arabic and English bio columns
alter table public.doctors
add column if not exists bio_ar text,
add column if not exists bio_en text;

-- 6. Add image column (for doctor's profile image URL/path)
alter table public.doctors
add column if not exists image text;

-- 7. Add services column (array of service identifiers)
alter table public.doctors
add column if not exists services text[] default '{}';

-- 8. Add status column (for publication status: draft, published, needs_approval, etc.)
alter table public.doctors
add column if not exists status text default 'published';

-- 9. Add sort_order column (for custom ordering of doctors in listings)
alter table public.doctors
add column if not exists sort_order integer default 0;

-- 10. Add verified column (to indicate verified/trusted doctors)
alter table public.doctors
add column if not exists verified boolean default false;

-- 11. Set a default value for the id column (for new rows) using UUID
alter table public.doctors
alter column id set default (gen_random_uuid()::text);

-- 12. Create indexes for commonly queried columns
create index if not exists idx_doctors_slug on public.doctors(slug);
create index if not exists idx_doctors_status on public.doctors(status);
create index if not exists idx_doctors_verified on public.doctors(verified);

-- Note: We intentionally do NOT change the id column type from text to uuid
-- to maintain backward compatibility with the existing legacy schema and seed data.
-- The application's fallback mechanism in useDoctors.js handles both schemas properly.
-- Note: We also keep the existing 'name' and 'specialty' columns to maintain
-- backward compatibility. The application's mapping functions (doctorDisplayName,
-- doctorDisplaySpecialty) will prefer the new *_en/*_ar columns but fall back
-- to the existing columns when the new ones are NULL.
-- Note: The existing seed data (004_seed_doctors.sql) explicitly provides ids,
-- so they will continue to work as expected.
