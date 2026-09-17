-- 010_fix_server_side_admin.sql
-- Fixes a bootstrap lockout in 008/009: prevent_role_escalation() and
-- promote_to_admin() only accepted is_admin() (an *authenticated* user whose
-- profile is already admin). But two legitimate server-side contexts have no
-- auth.uid() at all:
--   1. SQL Editor runs as postgres with no JWT (first-admin bootstrap).
--   2. Edge Functions / server scripts using the service_role key
--      (admin-create-doctor profile promotion).
-- Without this fix the very first admin could never be created (chicken-and-
-- egg), and the Edge Function's profile update would always fail.
-- The bypass is narrow: service_role JWT claim or postgres superuser.
-- Holding either already means full database control, so nothing is weakened.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Server-side contexts bypass the check (they already hold full access).
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

create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bootstrap path: SQL Editor (postgres, no JWT) or service_role key.
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
