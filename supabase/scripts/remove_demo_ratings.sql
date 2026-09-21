-- remove_demo_ratings.sql
-- Deletes ONLY temporary demo ratings. Run in Dashboard → SQL Editor AFTER
-- the domain check passes and real production data is ready.
--
-- SAFETY:
--   - Deletes from public.ratings ONLY where source = 'legacy_demo'.
--   - NEVER touches public.doctors, public.profiles, or public.appointments.
--   - NEVER touches real patient ratings (source = 'patient').
--   - Re-running is safe (second run deletes 0 rows).

delete from public.ratings
where source = 'legacy_demo';

-- Verification: both counts must be 0 after a successful cleanup.
select count(*) as remaining_demo_ratings
from public.ratings
where source = 'legacy_demo';

select count(*) as real_patient_ratings_kept
from public.ratings
where source = 'patient';
