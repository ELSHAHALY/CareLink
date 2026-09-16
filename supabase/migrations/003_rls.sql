-- 003_rls.sql
-- Row Level Security: each user can only read/update own profile.
-- Admin override is intentionally NOT added here -- use service_role or future admin policy.

alter table public.profiles enable row level security;

-- Allow authenticated users to read their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Allow user to insert own profile (needed if trigger not used / fallback)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Allow user to update own profile (name, etc. -- role change blocked by app, not DB alone)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- To seed the first admin, run as service_role / SQL editor (bypasses RLS):
--   update public.profiles set role = 'admin' where email = 'admin@carelink.com';
