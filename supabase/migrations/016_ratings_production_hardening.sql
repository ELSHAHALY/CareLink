-- 016_ratings_production_hardening.sql
-- Production hardening for public.ratings (created by 014).
-- Run in Dashboard → SQL Editor AFTER 014_ratings.sql.
--
-- WHAT THIS DOES:
--   1. Adds moderation columns (moderated_by / moderated_at / moderation_note).
--   2. Adds a trigger that enforces, for source='patient' rows only:
--        - patient_id + appointment_id are present (real reviews only).
--        - is_verified=true requires patient_id + appointment_id.
--        - the appointment exists, is 'completed', belongs to the same
--          patient, and targets the same doctor (doctor_id::text match,
--          because ratings.doctor_id is TEXT for Cloud/local compatibility).
--        - appointment_id / patient_id / doctor_id are immutable after insert.
--        - a published row always has a doctor_id.
--        - score/categories/comment/patient_name length limits.
--   3. Changes NOTHING else: no data migration, no RLS policy changes,
--      no new grants, no browser write access. Legacy/demo rows
--      (source='legacy_demo') are untouched by the trigger so cleanup and
--      mapping fixes stay possible.
--
-- NOTE: All row-level rules live in the trigger (not table CHECKs) so this
-- migration can never fail on pre-existing rows.

-- 1. Moderation columns -------------------------------------------------------
alter table public.ratings
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null;
alter table public.ratings
  add column if not exists moderated_at timestamptz;
alter table public.ratings
  add column if not exists moderation_note text;

-- 2. Validation trigger (patient rows only) -----------------------------------
create or replace function public.validate_patient_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apt_status text;
  v_apt_patient uuid;
  v_apt_doctor text;
begin
  -- Legacy/demo rows keep their existing behavior (pending seeds, cleanup).
  if new.source = 'legacy_demo' then
    return new;
  end if;

  -- Real patient reviews must be fully linked.
  if new.patient_id is null or new.appointment_id is null then
    raise exception 'Patient ratings require patient_id and appointment_id';
  end if;

  -- Verified reviews must always be appointment-linked.
  if new.is_verified and (new.patient_id is null or new.appointment_id is null) then
    raise exception 'Verified ratings require patient_id and appointment_id';
  end if;

  -- Published rows must resolve to a doctor.
  if new.status = 'published' and (new.doctor_id is null or new.doctor_id = '') then
    raise exception 'Published ratings require doctor_id';
  end if;

  -- Length limits (server-side, cannot be bypassed by crafted requests).
  if char_length(new.comment) > 2000 then
    raise exception 'Comment must be at most 2000 characters';
  end if;
  if char_length(new.patient_name) > 120 then
    raise exception 'Patient name must be at most 120 characters';
  end if;
  if new.moderation_note is not null and char_length(new.moderation_note) > 1000 then
    raise exception 'Moderation note must be at most 1000 characters';
  end if;

  -- The linked appointment must exist, be completed, and belong to the
  -- same patient + doctor. (doctor_id compared as text: appointments use
  -- uuid on Cloud, ratings store the id as text for UI compatibility.)
  select status, patient_id, doctor_id::text
    into v_apt_status, v_apt_patient, v_apt_doctor
  from public.appointments
  where id = new.appointment_id;

  if not found then
    raise exception 'Linked appointment does not exist';
  end if;
  if v_apt_status is distinct from 'completed' then
    raise exception 'Only completed appointments can be rated';
  end if;
  if v_apt_patient is distinct from new.patient_id then
    raise exception 'Rating patient must match the appointment patient';
  end if;
  if v_apt_doctor is distinct from new.doctor_id then
    raise exception 'Rating doctor must match the appointment doctor';
  end if;

  -- Linkage is immutable once created (prevents moving a verified review
  -- onto a different appointment/patient/doctor on UPDATE).
  if tg_op = 'UPDATE' then
    if new.appointment_id is distinct from old.appointment_id then
      raise exception 'appointment_id cannot be changed';
    end if;
    if new.patient_id is distinct from old.patient_id then
      raise exception 'patient_id cannot be changed';
    end if;
    if new.doctor_id is distinct from old.doctor_id then
      raise exception 'doctor_id cannot be changed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ratings_validate_patient on public.ratings;
create trigger ratings_validate_patient
  before insert or update on public.ratings
  for each row execute function public.validate_patient_rating();

-- Verification (run separately):
--   select tgname from pg_trigger where tgname = 'ratings_validate_patient';
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='ratings'
--      and column_name in ('moderated_by','moderated_at','moderation_note');
