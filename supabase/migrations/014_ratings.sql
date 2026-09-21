-- 014_ratings.sql
-- Patient ratings / reviews for the doctors catalog.
-- Run in Dashboard → SQL Editor AFTER 009_cloud_adapt.sql (010/011/013 optional).
--
-- Design notes:
--   - `doctor_id` is TEXT (not uuid FK) on purpose: the UI compares doctor ids
--     as strings, and local dev catalogs still use text ids (doc-001). Cloud
--     uuids are stored as text (d.id::text). This keeps one migration working
--     on both Path A (cloud uuid) and Path B (local text) without type errors.
--   - Real patient UUIDs (`patient_id`) and `appointment_id` are NEVER exposed
--     to anon/authenticated via column-level grants.
--   - Browser write access is intentionally NOT granted. Only project
--     administrators in SQL Editor / service_role can write until a verified
--     review submission flow (server-side) exists.
--   - Seed rows are legacy/demo reviews from src/data/ratings.json. They are
--     NOT verified visits: source='legacy_demo', status='pending',
--     is_verified=false. Do not publish before manual review (some comments
--     mention a different doctor name than the catalog row).

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  doctor_id text,
  legacy_doctor_id text,
  legacy_patient_id text,
  patient_id uuid references public.profiles(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_name text not null,
  score smallint not null check (score between 1 and 5),
  bedside_manner numeric(2,1) check (bedside_manner between 1 and 5),
  communication numeric(2,1) check (communication between 1 and 5),
  wait_time numeric(2,1) check (wait_time between 1 and 5),
  comment text not null default '',
  review_date date not null,
  source text not null default 'patient' check (source in ('patient', 'legacy_demo')),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ratings_legacy_identity unique (legacy_doctor_id, legacy_patient_id, source),
  constraint ratings_verified_appointment check (not is_verified or appointment_id is not null)
);

create index if not exists ratings_doctor_status_idx
  on public.ratings (doctor_id, status);
create unique index if not exists ratings_one_per_appointment_idx
  on public.ratings (appointment_id) where appointment_id is not null;

alter table public.ratings enable row level security;

drop policy if exists ratings_public_read_published on public.ratings;
create policy ratings_public_read_published on public.ratings
  for select to anon, authenticated using (status = 'published');

-- Column-level access keeps real patient/appointment UUIDs private even
-- after a review is published. The frontend must select only these columns.
revoke all on public.ratings from public, anon, authenticated;
grant select (
  id, doctor_id, patient_name, score, bedside_manner, communication,
  wait_time, comment, review_date, source, status, is_verified
) on public.ratings to anon, authenticated;

-- Seed: the five legacy/demo reviews in src/data/ratings.json.
-- Mapping strategy (explicit, in order):
--   1. d.id::text = legacy id (works on local text catalogs AND cloud uuid
--      catalogs that kept legacy ids — exact match wins).
--   2. Fallback by catalog display name (name_en preferred, then name).
--      Cloud catalog names differ from legacy seed names, so this fallback is
--      best-effort only. ALWAYS verify the SELECT output below and fix
--      doctor_id manually when it is NULL or looks wrong.
with seed (legacy_doctor_id, legacy_patient_id, patient_name, score,
           bedside_manner, communication, wait_time, comment, review_date) as (
  values
  ('doc-001','pat-101','Michael R.',5,5.0,4.9,4.8,
   '"Dr. Jenkins took the time to listen to all my concerns regarding my arrhythmia. Her explanation was clear, comforting, and thorough."','2024-10-15'::date),
  ('doc-001','pat-102','Elena Gomez',5,5.0,5.0,4.5,
   '"Incredible bedside manner and extremely professional. The clinic staff and appointment process were seamless."','2024-09-02'::date),
  ('doc-001','pat-103','David P.',5,5.0,4.8,4.9,
   '"Hands down the best cardiologist in the city. Her preventive care plan has made a huge difference in my health."','2024-08-20'::date),
  ('doc-002','pat-201','Sarah T.',5,5.0,4.9,4.2,
   '"Dr. Chen is amazing! My skin has never looked better."','2024-05-20'::date),
  ('doc-003','pat-301','James L.',5,4.8,5.0,4.0,
   '"Dr. Kim is a genius. Diagnosed my condition when others couldn''t."','2024-04-20'::date)
)
insert into public.ratings (
  doctor_id, legacy_doctor_id, legacy_patient_id, patient_name, score,
  bedside_manner, communication, wait_time, comment, review_date,
  source, status, is_verified
)
select d.id::text, s.legacy_doctor_id, s.legacy_patient_id, s.patient_name,
       s.score, s.bedside_manner, s.communication, s.wait_time, s.comment,
       s.review_date, 'legacy_demo', 'pending', false
from seed s
left join lateral (
  select id from public.doctors d
  where d.id::text = s.legacy_doctor_id
     or (s.legacy_doctor_id = 'doc-001' and coalesce(to_jsonb(d)->>'name_en', to_jsonb(d)->>'name') = 'Dr. James Mitchell')
     or (s.legacy_doctor_id = 'doc-002' and coalesce(to_jsonb(d)->>'name_en', to_jsonb(d)->>'name') = 'Dr. Sarah Chen')
     or (s.legacy_doctor_id = 'doc-003' and coalesce(to_jsonb(d)->>'name_en', to_jsonb(d)->>'name') = 'Dr. Robert Kim')
  order by (d.id::text = s.legacy_doctor_id) desc
  limit 1
) d on true
on conflict (legacy_doctor_id, legacy_patient_id, source) do nothing;

-- Verification (run separately, review before publishing anything):
-- 1) Mapping check — doctor_id must not be NULL:
-- select legacy_doctor_id, patient_name, doctor_id, score, source, status, is_verified
-- from public.ratings where source = 'legacy_demo'
-- order by legacy_doctor_id, review_date desc;
-- 2) Orphans (fix manually by setting doctor_id to the correct catalog id):
-- select * from public.ratings where source = 'legacy_demo' and doctor_id is null;
-- 3) Public surface check (what anon sees):
-- select id, doctor_id, patient_name, score, review_date, source, status, is_verified
-- from public.ratings where status = 'published' order by review_date desc;
