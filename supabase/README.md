# Supabase Setup — CareLink

> **Which path?** Pick ONE:
> - **A. Cloud project with the real `doctors` catalog** (uuid + bilingual
>   columns, e.g. `hfcbjjnhxqwpsflwambn`) → run **only `009_cloud_adapt.sql`**.
>   Never run `001`/`004`/`007` there (wrong `doctors` schema: text vs uuid).
> - **B. Fresh local Supabase CLI from scratch** → run `001`–`008` in order
>   (they create the legacy text-id `doctors` table). Never run `009` there.

## 1. Create / open project

- https://supabase.com → New project → Region close to users.
- Settings → API → copy `Project URL` and `anon public` key into `.env`:
  ```
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhb...
  ```

## 2. Auth configuration

- Authentication → Providers → Email → **Enabled**, password ≥ 6.
- Authentication → Settings → **Confirm email = OFF** (password-only, as requested).

## 3. Run migrations

**Path A — Cloud with existing catalog (production):**

In Dashboard → SQL Editor, run exactly one file:

- `supabase/migrations/009_cloud_adapt.sql` — profiles + appointments +
  helpers + triggers + RLS, adapted to the uuid catalog. Doctors data is
  never touched.
- `supabase/migrations/010_fix_server_side_admin.sql` — allows the
  SQL-Editor/service_role bootstrap path in the escalation trigger
  (without it the first admin could never be created).
- `supabase/migrations/011_storage_admin_upload.sql` — lets admins upload
  doctor photos to the public `ccc-images` bucket (public read untouched).
- `supabase/migrations/014_ratings.sql` — patient ratings table + legacy/demo
  seed (stays `pending`, never verified). Public reads published rows only;
  `patient_id` / `appointment_id` are never granted to anon/authenticated.

Then verify (paste separately):

```sql
select table_name from information_schema.tables
 where table_schema='public' and table_name in ('profiles','appointments','doctors');
select tablename, policyname, cmd from pg_policies
 where schemaname='public' and tablename in ('profiles','appointments','doctors')
 order by tablename, policyname;
```

**Path B — Local CLI from scratch (dev):**

In Dashboard → SQL Editor (or `supabase db push` if linked), run in order:

1. `supabase/migrations/001_profiles.sql` — enum + tables
2. `supabase/migrations/002_profile_trigger.sql` — auto-create profile
3. `supabase/migrations/003_rls.sql` — base RLS policies
4. `supabase/migrations/004_seed_doctors.sql` — doctors catalog + promote helper
5. `supabase/migrations/005_fix_rls_recursion.sql` — is_admin() helper
6. `supabase/migrations/006_promote_admin.sql` — initial admin promotion
7. `supabase/migrations/007_appointments.sql` — appointments table + doctors RLS
8. `supabase/migrations/008_harden_roles.sql` — block self role escalation

Or via CLI: `supabase db push` if linked.

## 4. Seed first admin

Register once via app (or Auth Dashboard), then in SQL Editor (bypasses RLS):

```sql
select public.promote_to_admin('admin@carelink.com');
-- Only an existing admin can call this via RPC; in SQL Editor it runs as
-- superuser for initial bootstrap.
```

## 5. Doctor creation (admin-only)

- Deploy the secure Edge Function (requires service_role, server-side only):
  ```
  supabase functions deploy admin-create-doctor
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role> --project-ref xxx
  ```
- Admin creates doctors via `/admin/doctors` (calls the function; admin
  session is preserved). Never use client `signUp` for doctor creation.
- Fallback (SQL Editor only):
```sql
update public.profiles set role = 'doctor', doctor_id = 'doc-001' where email = 'j.mitchell@carelink.com';
```

Public users cannot self-assign `doctor` — role is set server-side only.
`008_harden_roles.sql` adds a DB trigger rejecting non-admin role changes.
