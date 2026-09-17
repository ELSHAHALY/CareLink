-- 009_cloud_adapt.sql
-- SELF-CONTAINED migration for the Supabase Cloud project whose `doctors`
-- table already exists with the uuid/bilingual schema
-- (id uuid, slug, name_ar/en, specialty_ar/en, bio_*, image, ...).
--
-- DO NOT run 001_profiles.sql / 004_seed_doctors.sql on this project:
--   001 would silently skip the doctors table (IF NOT EXISTS) and leave a
--   text-vs-uuid mismatch; 004 would fail (columns name/specialty/email do
--   not exist here). This file creates ONLY what is missing: profiles,
--   appointments, helpers, triggers, and RLS. It never touches doctors data.
--   (Local Supabase CLI from scratch: run 001-008 instead; never both.)
--
-- Run once in Dashboard → SQL Editor.

-- 1. Role enum -------------------------------------------------------------
do $$ begin
  create type user_role as enum ('patient', 'doctor', 'admin');
exception when duplicate_object then null;
end $$;

-- 2. Profiles (uuid doctor link matches the real catalog) ------------------
-- Fail fast if an incompatible profiles table was created earlier
-- (e.g. by running 001 on this project): text doctor_id can never
-- reference the uuid doctors catalog.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'doctor_id' and udt_name <> 'uuid'
  ) then
    raise exception 'profiles.doctor_id has the wrong type. Drop the incompatible profiles/appointments tables first, then re-run 009 (never run 001/007 on this project).';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appointments'
      and column_name = 'doctor_id' and udt_name <> 'uuid'
  ) then
    raise exception 'appointments.doctor_id has the wrong type. Drop the incompatible table first, then re-run 009 (never run 007 on this project).';
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role user_role not null default 'patient',
  doctor_id uuid references public.doctors(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 3. Auto-create patient profile on signup ---------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'patient'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Admin helper (recursion-safe) ------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- 5. Profiles RLS ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- New signups may only ever insert themselves as patients.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'patient');

-- Own updates may never grant admin (trigger below blocks any non-admin
-- role/doctor/email change entirely — this is defense in depth).
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role in ('patient', 'doctor'));

drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

-- 6. Block privilege escalation at the DB level -------------------------------
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  if new.doctor_id is distinct from old.doctor_id then
    if not public.is_admin() then
      raise exception 'Only admins can assign doctor profiles';
    end if;
  end if;
  if new.email is distinct from old.email then
    if not public.is_admin() then
      raise exception 'Only admins can change emails';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_escalation on public.profiles;
create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- 7. Admin bootstrap helper (admin-only via RPC; superuser in SQL Editor) -----
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can promote users';
  end if;
  update public.profiles set role = 'admin' where email = target_email;
end;
$$;

revoke all on function public.promote_to_admin(text) from anon;
grant execute on function public.promote_to_admin(text) to authenticated;

-- 8. Appointments (uuid doctor link) ------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  time text not null,
  type text not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  patient_name text not null,
  patient_email text not null,
  patient_phone text not null,
  notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists appointments_doctor_idx on public.appointments (doctor_id);
create index if not exists appointments_patient_idx on public.appointments (patient_id);
create index if not exists appointments_date_idx on public.appointments (date);

drop index if exists appointments_no_double_booking;
create unique index appointments_no_double_booking
  on public.appointments (doctor_id, date, time)
  where status = 'scheduled';

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.handle_updated_at();

alter table public.appointments enable row level security;

drop policy if exists "appointments_select_own" on public.appointments;
create policy "appointments_select_own"
  on public.appointments for select
  to authenticated
  using (auth.uid() = patient_id);

drop policy if exists "appointments_insert_own" on public.appointments;
create policy "appointments_insert_own"
  on public.appointments for insert
  to authenticated
  with check (auth.uid() = patient_id);

drop policy if exists "appointments_update_own" on public.appointments;
create policy "appointments_update_own"
  on public.appointments for update
  to authenticated
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

drop policy if exists "appointments_doctor_select" on public.appointments;
create policy "appointments_doctor_select"
  on public.appointments for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and doctor_id = appointments.doctor_id
    )
  );

drop policy if exists "appointments_doctor_update" on public.appointments;
create policy "appointments_doctor_update"
  on public.appointments for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and doctor_id = appointments.doctor_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and doctor_id = appointments.doctor_id
    )
  );

drop policy if exists "appointments_admin_select" on public.appointments;
create policy "appointments_admin_select"
  on public.appointments for select
  to authenticated
  using (public.is_admin());

drop policy if exists "appointments_admin_insert" on public.appointments;
create policy "appointments_admin_insert"
  on public.appointments for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "appointments_admin_update" on public.appointments;
create policy "appointments_admin_update"
  on public.appointments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "appointments_admin_delete" on public.appointments;
create policy "appointments_admin_delete"
  on public.appointments for delete
  to authenticated
  using (public.is_admin());

-- 9. Doctors catalog: public read (data untouched) ------------------------------
alter table public.doctors enable row level security;

drop policy if exists "doctors_public_read" on public.doctors;
create policy "doctors_public_read"
  on public.doctors for select
  to anon, authenticated
  using (true);

drop policy if exists "doctors_admin_insert" on public.doctors;
create policy "doctors_admin_insert"
  on public.doctors for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "doctors_admin_update" on public.doctors;
create policy "doctors_admin_update"
  on public.doctors for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "doctors_admin_delete" on public.doctors;
create policy "doctors_admin_delete"
  on public.doctors for delete
  to authenticated
  using (public.is_admin());

-- Verify after running (paste separately):
--   select table_name from information_schema.tables
--    where table_schema='public' and table_name in ('profiles','appointments','doctors');
--   select policyname, cmd, roles from pg_policies
--    where schemaname='public' and tablename in ('profiles','appointments','doctors')
--    order by tablename, policyname;
