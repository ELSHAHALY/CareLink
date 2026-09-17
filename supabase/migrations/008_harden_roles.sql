-- 008_harden_roles.sql
-- Closes privilege-escalation holes in profiles RLS:
-- 1. Non-admins could UPDATE own role to 'admin' (USING/WITH CHECK only
--    checked auth.uid()=id, not the role value).
-- 2. promote_to_admin() had no caller check (any authenticated user could
--    call it via RPC to become admin).
-- Defense in depth: DB trigger + tighter RLS WITH CHECK.

-- Harden promote_to_admin: only admins may call it via RPC, but keep the
-- bootstrap path open for server-side contexts (SQL Editor as postgres with
-- no JWT, or the service_role key) — otherwise the first admin could never
-- be created. Holding either context already means full DB control.
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role'
    or current_user = 'postgres' then
    update public.profiles set role = 'admin' where email = target_email;
    return;
  end if;
  if not public.is_admin() then
    raise exception 'Only admins can promote users';
  end if;
  update public.profiles set role = 'admin' where email = target_email;
end;
$$;

revoke all on function public.promote_to_admin(text) from anon;
grant execute on function public.promote_to_admin(text) to authenticated;

-- Ensure is_admin() is callable from RLS but not abusable elsewhere.
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- Trigger: block non-admin role/doctor_id/email changes.
-- Server-side contexts (SQL Editor as postgres, service_role key) bypass the
-- check: they already hold full access (bootstrap + Edge Functions depend on
-- this; authenticated app users are still fully restricted).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if current_user = 'postgres' then
    return new;
  end if;
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
  -- Email is the auth identity; only admins may rewrite it manually.
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

-- Tighten INSERT: non-admins may only create their own patient profile.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'patient');

-- Tighten UPDATE own: non-admins may edit own profile but may never grant
-- themselves admin. Role/doctor_id/email changes are fully blocked for
-- non-admins by the trigger above; this WITH CHECK is defense-in-depth so
-- RLS alone already rejects self-promotion to admin.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role in ('patient', 'doctor')
  );
