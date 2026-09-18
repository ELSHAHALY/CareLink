import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateName,
  mapSupabaseError,
} from '../context/AuthContext'

describe('Auth validation helpers (real implementation)', () => {
  describe('email validation', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('admin@carelink.com')).toBe(true)
      expect(validateEmail('test.user+tag@domain.co')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user @domain.com')).toBe(false)
      expect(validateEmail(null)).toBe(false)
      expect(validateEmail(undefined)).toBe(false)
    })
  })

  describe('password validation', () => {
    it('accepts passwords >= 6 chars', () => {
      expect(validatePassword('123456')).toBe(true)
      expect(validatePassword('longpassword')).toBe(true)
    })

    it('rejects short passwords', () => {
      expect(validatePassword('')).toBe(false)
      expect(validatePassword('12345')).toBe(false)
      expect(validatePassword('abc')).toBe(false)
      expect(validatePassword(null)).toBe(false)
    })
  })

  describe('name validation', () => {
    it('accepts names >= 2 chars', () => {
      expect(validateName('John')).toBe(true)
      expect(validateName('Dr. Smith')).toBe(true)
      expect(validateName('  John  ')).toBe(true)
    })

    it('rejects short or empty names', () => {
      expect(validateName('')).toBe(false)
      expect(validateName(' ')).toBe(false)
      expect(validateName('A')).toBe(false)
    })
  })

  describe('Supabase error mapping (real implementation)', () => {
    it('maps invalid login credentials to safe message', () => {
      expect(mapSupabaseError('Invalid login credentials')).toBe(
        'Invalid email or password.',
      )
    })

    it('maps duplicate email without leaking internals', () => {
      expect(mapSupabaseError('User already registered')).toBe(
        'An account with this email already exists.',
      )
    })

    it('maps rate limit errors', () => {
      expect(mapSupabaseError('Rate limit exceeded')).toBe(
        'Too many attempts. Please try again later.',
      )
    })
  })
})
