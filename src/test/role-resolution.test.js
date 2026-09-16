import { describe, it, expect } from 'vitest'

describe('Role resolution', () => {
  // Replicate the mock role resolution logic from AuthContext
  const doctorsData = {
    doctors: [
      { id: 'doc-001', name: 'Dr. James Mitchell', email: 'j.mitchell@carelink.com' },
      { id: 'doc-002', name: 'Dr. Sarah Chen', email: 's.chen@carelink.com' },
    ],
  }

  function resolveMockRole(email) {
    const doctor = doctorsData.doctors.find(
      (d) => d.email.toLowerCase() === email.toLowerCase(),
    )
    if (doctor) {
      return { role: 'doctor', doctorId: doctor.id, doctorName: doctor.name }
    }
    return { role: 'patient', doctorId: null, doctorName: null }
  }

  it('resolves doctor role for known doctor emails', () => {
    const result = resolveMockRole('j.mitchell@carelink.com')
    expect(result.role).toBe('doctor')
    expect(result.doctorId).toBe('doc-001')
  })

  it('resolves doctor role case-insensitively', () => {
    const result = resolveMockRole('J.MITCHELL@CARELINK.COM')
    expect(result.role).toBe('doctor')
    expect(result.doctorId).toBe('doc-001')
  })

  it('resolves patient role for unknown emails', () => {
    const result = resolveMockRole('unknown@test.com')
    expect(result.role).toBe('patient')
    expect(result.doctorId).toBeNull()
  })

  it('resolves patient role for admin emails in mock mode', () => {
    const result = resolveMockRole('admin@carelink.com')
    expect(result.role).toBe('patient')
    expect(result.doctorId).toBeNull()
  })
})

describe('Route role mapping', () => {
  const ROLE_REDIRECTS = {
    admin: '/admin/doctors',
    doctor: '/doctor/dashboard',
    patient: '/dashboard',
  }

  it('maps admin to admin doctors page', () => {
    expect(ROLE_REDIRECTS.admin).toBe('/admin/doctors')
  })

  it('maps doctor to doctor dashboard', () => {
    expect(ROLE_REDIRECTS.doctor).toBe('/doctor/dashboard')
  })

  it('maps patient to patient dashboard', () => {
    expect(ROLE_REDIRECTS.patient).toBe('/dashboard')
  })
})

describe('RequireRole logic', () => {
  function getRedirectPath(userRole, allowedRoles) {
    if (!userRole) return '/login'
    if (allowedRoles.includes(userRole)) return null
    if (userRole === 'doctor') return '/doctor/dashboard'
    if (userRole === 'admin') return '/admin/doctors'
    return '/dashboard'
  }

  it('allows access when role matches', () => {
    expect(getRedirectPath('admin', ['admin'])).toBeNull()
    expect(getRedirectPath('doctor', ['doctor'])).toBeNull()
    expect(getRedirectPath('patient', ['patient'])).toBeNull()
  })

  it('redirects to login when no user', () => {
    expect(getRedirectPath(null, ['admin'])).toBe('/login')
  })

  it('redirects doctor away from admin routes', () => {
    expect(getRedirectPath('doctor', ['admin'])).toBe('/doctor/dashboard')
  })

  it('redirects patient away from doctor routes', () => {
    expect(getRedirectPath('patient', ['doctor'])).toBe('/dashboard')
  })

  it('redirects admin away from patient routes', () => {
    expect(getRedirectPath('admin', ['patient'])).toBe('/admin/doctors')
  })
})
