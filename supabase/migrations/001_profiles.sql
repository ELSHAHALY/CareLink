-- 001_profiles.sql
-- Creates user_role enum and profiles table linked 1:1 to auth.users

do $$ begin
  create type user_role as enum ('patient', 'doctor', 'admin');
exception when duplicate_object then null;
end $$;

-- Doctor catalog: mirrors the static doctors.json so doctor_id has a
-- real table reference.  The client app still reads doctors.json for
-- display; this table exists purely so the profiles.doctor_id FK is
-- valid and RLS/admin queries can join if needed.
create table if not exists public.doctors (
  id text primary key,
  name text not null,
  specialty text not null,
  email text unique
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role user_role not null default 'patient',
  doctor_id text references public.doctors(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Keep updated_at fresh
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
