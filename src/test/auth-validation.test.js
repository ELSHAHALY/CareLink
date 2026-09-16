import { describe, it, expect } from 'vitest'

describe('Auth validation helpers', () => {
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validatePassword(password) {
    return !!(password && password.length >= 6)
  }

  function validateName(name) {
    return !!(name && name.trim().length >= 2)
  }

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
})
