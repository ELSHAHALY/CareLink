# CareLink

موقع بسيط يربط المرضى بالأطباء.

المريض يلاقي طبيب ويحجز موعد. الطبيب يشوف مواعيده ويكملها أو يلغيها. الأدمن يدير الكتالوج والحسابات.

A simple healthcare site: patients book doctors, doctors manage appointments, admins run the catalog.

---

## للجمهور — in one minute

CareLink is a clinic booking website.

| Who | What they can do |
|-----|------------------|
| **Patient** | Search doctors, open a profile, book a slot, see upcoming visits, cancel if needed |
| **Doctor** | See today’s list, mark visits complete or cancelled, edit their bio |
| **Admin** | Add doctors with a photo and login, archive/restore, watch live counts |

No downloads. Open the site, sign in, done.

### How a visit happens

1. Patient finds a doctor.
2. Picks a date and time.
3. Fills name, email, phone.
4. The doctor sees it on their dashboard.
5. Doctor marks it **Complete** or **Cancel**. Patient can cancel upcoming visits too.

That’s the whole product.

---

## للمطورين — without the noise

**Stack:** React 19 · Vite 8 · React Router 7 · Supabase (Auth + Postgres + Storage + one Edge Function) · CSS Modules · Vitest

**Auth is real.** Roles live in `profiles.role`: `patient` | `doctor` | `admin`.

**Doctors live in the database**, not in JSON. The UI still falls back to `src/data/doctors.json` if Supabase is down.

### Run it

```bash
cp .env.example .env   # then paste your Supabase URL + anon key
npm install
npm run dev            # http://localhost:5173
```

Useful commands:

```bash
npm test               # 95 tests
npm run lint
npm run build
```

Need Node **20.19+**.

### Who goes where after login

| Role | Lands on |
|------|----------|
| Patient | `/dashboard` |
| Doctor | `/doctor/dashboard` |
| Admin | `/admin` then `/admin/doctors` |

Public pages (`/`, `/doctors`, `/contact`) stay open. Dashboards need a session.

### Folder map

```
src/
  pages/          one file per screen
  components/     layout, doctors, appointments, admin, dashboard widgets
  context/        AuthContext, AppointmentContext
  hooks/          useAuth, useAppointments, useDoctors, useDoctorsCatalog
  utils/          mapping + validation (doctors, appointments)
  services/       supabase client, image upload
  data/           static fallback only
supabase/
  migrations/     001 → 013
  functions/      admin-create-doctor   (creates a doctor login without stealing the admin session)
```

### How data is shaped

- `doctors` — catalog. `id` is text (legacy `doc-001` or a UUID). New rows get `gen_random_uuid()::text`. Bilingual columns: `name_en` / `name_ar`, same for specialty and bio.
- `profiles` — one row per auth user. `doctor_id` links a doctor account to a catalog row.
- `appointments` — `doctor_id` + `patient_id` + date/time. Status: `scheduled` · `completed` · `cancelled`.
- Photos go to the public `ccc-images` bucket.

The UI talks camelCase (`doctorId`). The database talks snake_case (`doctor_id`). Mapping lives in `src/utils/appointments.js` and `src/utils/doctors.js`.

### Deploy

Static Vite build on Fly.io. Anon key is a **build arg**, not a runtime secret. Never put the service-role key in the frontend.

```bash
fly deploy \
  --build-arg VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY \
  --build-arg VITE_AI_LAMBDA_URL=https://YOUR_FUNCTION_URL.lambda-url.REGION.on.aws/
```

GitHub Action on `main` does the same if these secrets exist: `FLY_API_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AI_LAMBDA_URL`.

The Lambda Function URL must allow browser CORS for the deployed frontend
origin (and local Vite origin during development), the `POST` method, and the
`Content-Type` header. Configure CORS either on the Function URL or in the
Lambda response, but not both; duplicate `Access-Control-Allow-Origin` headers
are rejected by browsers.

The Edge Function `admin-create-doctor` must be deployed on the same Supabase project (`supabase functions deploy admin-create-doctor`).

---

## What’s solid vs what’s next

**Solid today**

- Real login, roles, RLS
- Doctor catalog with photos
- Booking + cancel / complete from the dashboards
- Admin create-doctor flow (photo → catalog → login)
- Admin numbers come from real `count` queries, not a 6-row sample

**Later, if we want it professional**

- Admin users page and appointments page
- Doctor calendar + working hours
- Toasts instead of `window.confirm`
- Arabic / English UI
- Favorites saved on the account, not only in `localStorage`

That’s it. If something’s unclear, the code is small — start at `src/routes/AppRoutes.jsx`.
