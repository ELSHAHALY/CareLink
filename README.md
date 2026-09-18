# CareLink — Healthcare Appointment Platform

> **What is CareLink?** A simple website where patients find doctors and book appointments, and doctors manage their own appointments. Made with React.

> **ما هو CareLink؟** موقع بسيط يربط المرضى بالأطباء: المريض يبحث عن طبيب ويحجز موعد، والطبيب يشوف مواعيده ويديرها. معمول بـ React.

---



### What does the app do?

- **Patient:** Browse doctors, see doctor details, pick a date and time, and book an appointment. See upcoming and past appointments in a dashboard.
- **Doctor:** Log in with doctor email, see today's appointments, upcoming ones, and completed ones. See own profile and appointment list.
- **Anyone:** Responsive on phone, tablet, and desktop. Works even without backend — uses local mock data.

### How to use it?

1. Open the app (after `npm run dev`, link is usually `http://localhost:5173`)
2. **As Patient:** Go to Login → enter any email (like `patient@test.com`) + password 6+ chars → you go to `/dashboard`
3. **As Doctor:** Go to Login → click **"Continue as Doctor (Demo)"** or enter `j.mitchell@carelink.com` / `s.chen@carelink.com` / `r.kim@carelink.com` + `123456` → you go to `/doctor/dashboard`

### Colors & Design

- Blue `#007bff` for main actions, Teal `#00a676` for highlights, Light gray `#f8f9fa` for backgrounds. Simple and clean, same style everywhere.

---

## Roadmap & Current Status

### Roadmap (خريطة الطريق)

```
Phase 1 — Foundation ✅ Done
  ├─ Project setup (React + Vite + React Router)
  ├─ Mock data (doctors, appointments, ratings)
  ├─ Search & filter doctors
  ├─ Doctor profile with reviews
  ├─ Booking: date + time slot picker
  └─ Code quality: ESLint + Prettier, build passes

Phase 2 — Patient Experience ✅ Done
  ├─ Login with validation
  ├─ Patient Dashboard: welcome + upcoming + quick actions + favorites + history
  ├─ Sidebar + responsive layout
  └─ Role detection (patient vs doctor by email)

Phase 3 — Doctor Portal ✅ Done
  ├─ Doctor Dashboard: welcome + summary (Today / Upcoming / Completed) + today's list + upcoming list
  ├─ Doctor Appointments page with tabs (Upcoming / Completed / Cancelled)
  ├─ Doctor Profile (read-only from doctors.json)
  └─ Doctor sees ONLY own appointments (filter by doctorId)

Phase 4 — Next Steps 🔜 Planned
  ├─ Real booking form (patient name, phone, notes) + save to localStorage
  ├─ My Appointments page for patients (cancel / reschedule)
  ├─ Profile editing
  ├─ Home page polish (hero, stats, specialties)
  └─ Optional: API / backend integration (replace mock data)

Phase 5 — Future Ideas 💡
  ├─ Notifications, messaging
  ├─ Real authentication (not mock)
  ├─ Payments, prescriptions, medical records
  └─ Admin panel
```

### Current Status (الحالة الحالية)

| Area | Status | Notes |
|------|--------|-------|
| **Pages — Public** | ✅ Working | `/`, `/doctors`, `/doctors/:id`, `/book-appointment` |
| **Login** | ✅ Working | Any valid email + 6-char password; doctor emails auto-detect role |
| **Patient Dashboard** | ✅ Working | `/dashboard` — auth guard, welcome, upcoming (3), quick actions, favorites (3), history (5) |
| **Doctor Dashboard** | ✅ Working | `/doctor/dashboard` — summary cards, today's list, upcoming (5) |
| **Doctor Appointments** | ✅ Working | `/doctor/appointments` — tabs by status, same data source |
| **Doctor Profile** | ✅ Working | `/doctor/profile` — read-only from `doctors.json` |
| **Patient Appointments / Profile** | 🚧 Placeholder | `/appointments`, `/profile` show "coming soon" |
| **Build & Lint** | ✅ Passing | `npm run lint` 0 errors, `npm run build` 83 modules |

---

## For Developers (للمطورين)

### Tech Stack

- **React 19**, **Vite 8**, **React Router 7**, plain **CSS** + CSS Modules, no UI framework, no state library.

### Project Structure

```
src/
├── pages/                  # Route pages
│   ├── Login.jsx           # Login + "Continue as Doctor" demo button
│   ├── Dashboard.jsx       # Patient dashboard (role guard)
│   ├── DoctorDashboard.jsx # Doctor dashboard
│   ├── DoctorAppointments.jsx
│   ├── DoctorProfilePage.jsx
│   ├── DoctorProfile.jsx   # Public doctor detail page (with reviews)
│   ├── DoctorsList.jsx, Home.jsx, BookAppointment.jsx, ...
│   └── *.module.css
├── components/
│   ├── layout/             # MainLayout, DashboardLayout, Sidebar, Navbar, Footer
│   ├── dashboard/          # UpcomingAppointments, FavoriteDoctors, AppointmentHistory
│   ├── doctors/            # DoctorCard, DoctorFilterBar, DoctorList, StarRating
│   ├── appointments/       # TimeSlotPicker, AppointmentCard, AppointmentForm
│   └── common/             # Button, Badge, Loader, EmptyState, Modal
├── context/                # AuthContext (role + doctorId), AppointmentContext
├── hooks/                  # useAuth, useAppointments, useFavorites
├── data/                   # doctors.json, appointments.json, ratings.json
├── services/localStore.js  # localStorage for appointments
├── styles/                 # global.css (design tokens), navbar.css, etc.
└── assets/                 # logo-icon.png
```

### Key Design Decisions

- **One appointment source:** `src/data/appointments.json` + `AppointmentContext` — both patient and doctor filter the same array (`appointment.doctorId === user.doctorId` for doctors).
- **Role by email:** `AuthContext` checks login email against `doctors.json` → `role: 'doctor' | 'patient'` and `doctorId`. No separate auth system, no hardcoded IDs.
- **Routing:** Standalone dashboards (`/dashboard`, `/doctor/*`) outside `MainLayout`; public pages inside `MainLayout` (Navbar + Footer). See `src/routes/AppRoutes.jsx`.
- **Styling:** Reuse `global.css` tokens (`--color-primary`, `--color-accent`, `--color-bg-soft`, etc.). No Tailwind/Bootstrap.

### Getting Started

```bash
npm install
npm run dev      # start at http://localhost:5173
npm run lint     # check code
npm run format   # auto-fix formatting
npm run build    # production build
```

### Deploy to Fly.io

This project includes a production `Dockerfile`, Nginx SPA fallback, and `fly.toml`.

1. Install and authenticate the Fly CLI, then make sure Docker is running:

```bash
fly auth login
```

2. Change the `app` value in `fly.toml` to a globally unique Fly app name, then create it:

```bash
fly apps create YOUR_UNIQUE_APP_NAME
```

3. Deploy with the Supabase values used by the production Vite build:

```bash
fly deploy --build-arg VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co --build-arg VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

The anon key is intended for browser use, but do not use a Supabase service-role key here. After deployment, open the URL shown by `fly status` or run `fly open`.

Because this is a static Vite build, changing Supabase values requires another `fly deploy` with the new build arguments.

#### GitHub Actions deployment

The included `.github/workflows/fly-deploy.yml` deploys automatically when code is pushed to `main`. Add these repository secrets in GitHub under **Settings → Secrets and variables → Actions**:

- `FLY_API_TOKEN`: create with `fly tokens create deploy`
- `VITE_SUPABASE_URL`: your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: your Supabase public anon key

Update `app` in `fly.toml` before pushing. The Fly app must already exist with that exact name.

### Demo Accounts

| Role | Email | Password | Redirect |
|------|-------|----------|----------|
| Doctor | `j.mitchell@carelink.com` | `123456` | `/doctor/dashboard` |
| Doctor | `s.chen@carelink.com` | `123456` | `/doctor/dashboard` |
| Doctor | `r.kim@carelink.com` | `123456` | `/doctor/dashboard` |
| Patient | any email (e.g. `ali@test.com`) | any 6+ chars | `/dashboard` |

Or just click **"Continue as Doctor (Demo)"** on the login page.

### Known Limitations (MVP)

- Auth is mock (no real backend, password not verified).
- Today's appointments depend on mock dates (`2026-xx-xx`) — may show empty if not matching current date.
- Patient `/appointments` and `/profile` are placeholders.
- Doctor cannot change appointment status from UI yet (logic exists in `AppointmentContext`).

---

## Quick Links

- Routes: `src/routes/AppRoutes.jsx`
- Auth logic: `src/context/AuthContext.jsx`
- Appointments: `src/context/AppointmentContext.jsx` + `src/data/appointments.json`
- Design tokens: `src/styles/global.css`
