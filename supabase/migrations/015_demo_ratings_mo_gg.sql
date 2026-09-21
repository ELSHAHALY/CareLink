-- 015_demo_ratings_mo_gg.sql
-- TEMPORARY demo ratings for the two real catalog doctors, used to verify
-- the domain end-to-end (list average + doctor profile reviews).
-- Run in Dashboard → SQL Editor AFTER 014_ratings.sql.
--
-- SAFETY / LIFECYCLE:
--   - Rows are source='legacy_demo', status='published', is_verified=false.
--     They are demo rows, NEVER verified visits.
--   - The 014 seed rows (doc-001/doc-002/doc-003) stay 'pending' and are NOT
--     touched here: their comments name different doctors and must never be
--     shown on mo/gg.
--   - Comments below are generic on purpose: they name NO doctor and NO
--     specialty, so they cannot misattribute a doctor identity.
--   - Delete everything this file adds with:
--       supabase/scripts/remove_demo_ratings.sql
--     (deletes WHERE source='legacy_demo' only — real patient ratings kept).
--   - Re-running is safe: rows are unique by (legacy_doctor_id,
--     legacy_patient_id, source) via on conflict do nothing.
--   - Inserts are guarded by doctor existence: if mo/gg do not exist in this
--     project, zero rows are inserted and nothing fails.
--   - This file grants NO privileges and changes NO RLS policy from 014.

with demo_seed (
  doctor_uuid, legacy_doctor_id, legacy_patient_id, patient_name, score,
  bedside_manner, communication, wait_time, comment, review_date
) as (
  values
  -- mo: 7f077f3d-6de6-446e-b085-b8d2a6c6742b (3 reviews)
  ('7f077f3d-6de6-446e-b085-b8d2a6c6742b','demo-mo','demo-mo-01','Omar K.',5,5.0,4.9,4.7,
   'Very professional appointment. Everything was explained clearly and I felt comfortable throughout the visit.','2025-08-12'::date),
  ('7f077f3d-6de6-446e-b085-b8d2a6c6742b','demo-mo','demo-mo-02','Layla H.',5,4.9,5.0,4.6,
   'Booking was easy and the clinic ran on time. The consultation was thorough and all my questions were answered.','2025-07-03'::date),
  ('7f077f3d-6de6-446e-b085-b8d2a6c6742b','demo-mo','demo-mo-03','Adel S.',4,4.5,4.6,4.0,
   'Good experience overall. Short wait and clear follow-up instructions after the appointment.','2025-05-21'::date),
  -- gg: 627aa7ac-e011-450e-b88a-40a4831aeb8d (2 reviews)
  ('627aa7ac-e011-450e-b88a-40a4831aeb8d','demo-gg','demo-gg-01','Nour A.',5,5.0,4.8,4.9,
   'Excellent care from start to finish. The staff were welcoming and the visit felt unrushed.','2025-08-28'::date),
  ('627aa7ac-e011-450e-b88a-40a4831aeb8d','demo-gg','demo-gg-02','Karim T.',5,4.9,5.0,4.4,
   'Highly recommended. Clear diagnosis, honest advice, and a practical treatment plan.','2025-06-15'::date)
)
insert into public.ratings (
  doctor_id, legacy_doctor_id, legacy_patient_id, patient_name, score,
  bedside_manner, communication, wait_time, comment, review_date,
  source, status, is_verified, patient_id, appointment_id
)
select s.doctor_uuid, s.legacy_doctor_id, s.legacy_patient_id, s.patient_name,
       s.score, s.bedside_manner, s.communication, s.wait_time, s.comment,
       s.review_date, 'legacy_demo', 'published', false, null, null
from demo_seed s
where exists (
  select 1 from public.doctors d
  where d.id::text = s.doctor_uuid
)
on conflict (legacy_doctor_id, legacy_patient_id, source) do nothing;

-- Verification (run separately):
-- Must show exactly 5 rows: 3 for mo, 2 for gg, all published + unverified.
-- select r.patient_name, r.doctor_id,
--        coalesce(to_jsonb(d)->>'name_en', to_jsonb(d)->>'name') as doctor_name,
--        r.score, r.source, r.status, r.is_verified
-- from public.ratings r
-- left join public.doctors d on d.id::text = r.doctor_id
-- where r.legacy_doctor_id in ('demo-mo', 'demo-gg')
-- order by r.doctor_id, r.review_date desc;
-- Orphan check (must return 0 rows):
-- select * from public.ratings
-- where legacy_doctor_id in ('demo-mo', 'demo-gg') and doctor_id is null;
