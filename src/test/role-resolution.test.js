import { describe, it, expect } from 'vitest'
import {
  resolveMockRole,
  toUserFromProfile,
  getRoleRedirect,
} from '../context/AuthContext'

describe('Role resolution (real implementation)', () => {
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

  it('resolves patient role for admin emails in mock mode (no admin in mock)', () => {
    const result = resolveMockRole('admin@carelink.com')
    expect(result.role).toBe('patient')
  })

  it('defaults to patient when profile is missing (fail-closed, no escalation)', () => {
    const sessionUser = { id: 'uuid-1', email: 'x@test.com' }
    const user = toUserFromProfile(sessionUser, null)
    expect(user.role).toBe('patient')
    expect(user.profileMissing).toBe(true)
  })

  it('uses profile role when present', () => {
    const sessionUser = { id: 'uuid-2', email: 'd@test.com' }
    expect(
      toUserFromProfile(sessionUser, { role: 'doctor', doctor_id: 'doc-002' })
        .role,
    ).toBe('doctor')
    expect(
      toUserFromProfile(sessionUser, { role: 'admin', doctor_id: null }).role,
    ).toBe('admin')
  })
})

describe('Route role mapping (real implementation)', () => {
  it('maps admin to admin doctors page', () => {
    expect(getRoleRedirect('admin')).toBe('/admin/doctors')
  })

  it('maps doctor to doctor dashboard', () => {
    expect(getRoleRedirect('doctor')).toBe('/doctor/dashboard')
  })

  it('maps patient to patient dashboard', () => {
    expect(getRoleRedirect('patient')).toBe('/dashboard')
  })

  it('defaults unknown roles to patient dashboard (no privilege leak)', () => {
    expect(getRoleRedirect(undefined)).toBe('/dashboard')
    expect(getRoleRedirect('hacker')).toBe('/dashboard')
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
