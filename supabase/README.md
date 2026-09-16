# Supabase Setup — CareLink

## 1. Create project

- https://supabase.com → New project → Region close to users.
- Settings → API → copy `Project URL` and `anon public` key into `.env`:
  ```
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhb...
  ```

## 2. Auth configuration

- Authentication → Providers → Email → **Enabled**, password ≥ 6.
- Authentication → Settings → **Confirm email = OFF** (password-only, as requested).

## 3. Run migrations (in order)

In Dashboard → SQL Editor, paste and run each file:

1. `supabase/migrations/001_profiles.sql`  — enum + table
2. `supabase/migrations/002_profile_trigger.sql` — auto-create profile
3. `supabase/migrations/003_rls.sql` — RLS policies

Or via CLI: `supabase db push` if linked.

## 4. Seed first admin

Register once via app (or Auth Dashboard), then in SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'admin@carelink.com';
```

## 5. Doctor creation (admin-only)

- Admin creates a doctor user via `supabase.auth.signUp` (future `/admin/doctors` page),
  or manually in Auth Dashboard + then:
```sql
update public.profiles set role = 'doctor', doctor_id = 'doc-001' where email = 'j.mitchell@carelink.com';
```

Public users cannot self-assign `doctor` — role is set server-side only.
