-- 012_add_catalog_columns_to_doctors.sql
-- Brings the doctors table to the cloud-catalog shape the app expects:
-- bilingual columns, publishing-workflow columns, a self-generating id,
-- and a unique slug. Idempotent: safe on the local legacy schema (001/004)
-- and on the cloud project where some columns already exist.
--
-- Fixes: "null value in column id of relation doctors violates not-null
-- constraint" when an admin creates a doctor (the app never sends an id).

-- 1. Catalog columns (no-ops where they already exist) ---------------------
alter table public.doctors add column if not exists slug text;
alter table public.doctors add column if not exists name_ar text;
alter table public.doctors add column if not exists name_en text;
alter table public.doctors add column if not exists specialty_ar text;
alter table public.doctors add column if not exists specialty_en text;
alter table public.doctors add column if not exists bio_ar text;
alter table public.doctors add column if not exists bio_en text;
alter table public.doctors add column if not exists image text;
alter table public.doctors add column if not exists services text[] not null default '{}';
alter table public.doctors add column if not exists status text not null default 'published';
alter table public.doctors add column if not exists sort_order integer not null default 0;
alter table public.doctors add column if not exists is_demo boolean not null default false;
alter table public.doctors add column if not exists source text;
alter table public.doctors add column if not exists source_url text;
alter table public.doctors add column if not exists verified boolean not null default false;
alter table public.doctors add column if not exists needs_approval boolean not null default false;
alter table public.doctors add column if not exists created_at timestamptz not null default now();
alter table public.doctors add column if not exists updated_at timestamptz not null default now();

-- 2. Legacy columns must accept NULLs: the app writes name_en/specialty_en
--    and never populates the legacy name/specialty columns.
alter table public.doctors alter column name drop not null;
alter table public.doctors alter column specialty drop not null;

-- 3. Self-generating id so admin inserts never send one.
--    gen_random_uuid() is built into Postgres 13+; id stays text so the
--    legacy seed ids (doc-001...) and profiles.doctor_id text FK keep working.
alter table public.doctors alter column id set default gen_random_uuid()::text;

-- 4. Unique slug (the admin UI retries once on conflict 23505).
do $$ begin
  alter table public.doctors add constraint doctors_slug_key unique (slug);
exception when duplicate_object then null;
end $$;

-- 5. Backfill bilingual columns from legacy ones so seeded rows display.
update public.doctors set name_en = name where name_en is null and name is not null;
update public.doctors set specialty_en = specialty where specialty_en is null and specialty is not null;

-- 6. Keep updated_at fresh (handle_updated_at comes from 001/009).
drop trigger if exists doctors_updated_at on public.doctors;
create trigger doctors_updated_at
  before update on public.doctors
  for each row execute function public.handle_updated_at();

-- 7. Indexes for the catalog queries (useDoctors orders/filters on these).
create index if not exists idx_doctors_status on public.doctors(status);
create index if not exists idx_doctors_sort on public.doctors(sort_order);
