import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import { validateEmail, toUserFromProfile } from '../context/AuthContext'
import { isValidSupabaseUrl } from '../services/supabase'
import { filterDoctors } from '../hooks/useDoctors'

function readSource(rel) {
  // Resolve relative to this test file without relying on cwd.
  const here = new URL(import.meta.url)
  const file = new URL(rel, here)
  return fs.readFileSync(file, 'utf8')
}

describe('Security constraints (evidence-based)', () => {
  it('never bundles a service_role key in client source', () => {
    const authSrc = readSource('../context/AuthContext.jsx')
    const supabaseSrc = readSource('../services/supabase.js')
    const adminSrc = readSource('../pages/AdminDoctors.jsx')
    for (const src of [authSrc, supabaseSrc, adminSrc]) {
      expect(src.toLowerCase()).not.toContain('service_role')
      expect(src.toLowerCase()).not.toContain('service-role')
    }
  })

  it('admin creation does not use client signUp (would swap admin session)', () => {
    const adminSrc = readSource('../pages/AdminDoctors.jsx')
    expect(adminSrc).toContain('admin-create-doctor')
    expect(adminSrc).not.toContain('supabase.auth.signUp')
  })

  it('missing profile defaults to patient (no privilege escalation)', () => {
    const user = toUserFromProfile(
      { id: 'u1', email: 'attacker@test.com' },
      null,
    )
    expect(user.role).toBe('patient')
    expect(user.role).not.toBe('admin')
    expect(user.role).not.toBe('doctor')
  })

  it('patient signup cannot inject admin role via validation helpers', () => {
    expect(validateEmail('patient@test.com')).toBe(true)
    // Role assignment is server-side (trigger defaults to patient);
    // the client never sends a role field for patient signup.
    const patientSignupSrc = readSource('../context/AuthContext.jsx')
    const signupSection = patientSignupSrc.slice(
      patientSignupSrc.indexOf('const signupPatient'),
      patientSignupSrc.indexOf('const logout'),
    )
    expect(signupSection).not.toMatch(/role:\s*['"]admin['"]/)
    expect(signupSection).not.toMatch(/role:\s*['"]doctor['"]/)
  })

  it('RLS hardening migration blocks self role escalation', () => {
    const migration = readSource(
      '../../supabase/migrations/008_harden_roles.sql',
    )
    expect(migration).toContain('prevent_role_escalation')
    expect(migration).toContain('Only admins can change roles')
    expect(migration).toContain("role in ('patient', 'doctor')")
  })

  it('appointments migration enforces ownership + no double booking', () => {
    const migration = readSource(
      '../../supabase/migrations/007_appointments.sql',
    )
    expect(migration).toContain('auth.uid() = patient_id')
    expect(migration).toContain('appointments_no_double_booking')
    expect(migration).toContain('public.is_admin()')
  })

  it('cloud adapt migration matches the uuid catalog and guards wrong types', () => {
    const migration = readSource(
      '../../supabase/migrations/009_cloud_adapt.sql',
    )
    expect(migration).toContain('doctor_id uuid references public.doctors(id)')
    expect(migration).toContain('prevent_role_escalation')
    expect(migration).toContain('appointments_no_double_booking')
    expect(migration).toContain('wrong type')
    // Must never attempt to recreate the existing doctors table/data
    // (FK references to public.doctors are expected and fine).
    expect(migration).not.toMatch(
      /create\s+table\s+(if\s+not\s+exists\s+)?public\.doctors\s*\(/i,
    )
    // Must never seed/overwrite the existing doctors data (the filename may
    // appear in the DO-NOT-RUN warning comment — only DML matters).
    expect(migration).not.toMatch(/insert\s+into\s+public\.doctors/i)
  })

  it('doctor data isolation holds in filter helper', () => {
    const doctors = [
      {
        id: 'doc-001',
        name: 'A',
        specialty: 'Cardio',
        location: { city: 'X' },
        rating: 5,
      },
      {
        id: 'doc-002',
        name: 'B',
        specialty: 'Derm',
        location: { city: 'Y' },
        rating: 4,
      },
    ]
    expect(filterDoctors(doctors, { search: '' }).length).toBe(2)
    expect(filterDoctors(doctors, { search: 'A' }).map((d) => d.id)).toEqual([
      'doc-001',
    ])
  })

  it('Supabase URL validator rejects example placeholders', () => {
    expect(isValidSupabaseUrl('https://your-project.supabase.co')).toBe(false)
  })

  it('escalation guard keeps a server-side bootstrap path (no lockout)', () => {
    // Regression: the trigger must still let postgres (SQL Editor) and the
    // service_role key (Edge Functions) through, or the first admin could
    // never be created and admin-create-doctor would always fail.
    for (const f of [
      '../../supabase/migrations/008_harden_roles.sql',
      '../../supabase/migrations/010_fix_server_side_admin.sql',
    ]) {
      const migration = readSource(f)
      expect(migration).toContain("coalesce(auth.role(), '') = 'service_role'")
      expect(migration).toContain("current_user = 'postgres'")
    }
  })
})
