-- 007_appointments.sql
-- Real appointments table + public doctors catalog RLS.
-- Replaces localStorage-only appointments with Supabase-backed storage.

-- Appointments table: patient books with a doctor; doctor manages own.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null references public.doctors(id) on delete restrict,
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

-- Prevent double-booking the same doctor/date/time while scheduled.
drop index if exists appointments_no_double_booking;
create unique index appointments_no_double_booking
  on public.appointments (doctor_id, date, time)
  where status = 'scheduled';

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.handle_updated_at();

alter table public.appointments enable row level security;

-- Patients: read own appointments only.
drop policy if exists "appointments_select_own" on public.appointments;
create policy "appointments_select_own"
  on public.appointments for select
  to authenticated
  using (auth.uid() = patient_id);

-- Patients: create appointments only for themselves.
drop policy if exists "appointments_insert_own" on public.appointments;
create policy "appointments_insert_own"
  on public.appointments for insert
  to authenticated
  with check (auth.uid() = patient_id);

-- Patients: update (cancel) own appointments only.
drop policy if exists "appointments_update_own" on public.appointments;
create policy "appointments_update_own"
  on public.appointments for update
  to authenticated
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

-- Doctors: read appointments assigned to their doctor profile.
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

-- Doctors: update status of their own appointments (complete/cancel).
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

-- Admins: full access via helper (no recursion).
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

-- Doctors catalog: public read (needed for booking + doctor list).
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
