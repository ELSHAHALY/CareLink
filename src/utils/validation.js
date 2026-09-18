// Shared validation utilities for the application.
// Centralizes all validation logic to avoid duplication across components.

/**
 * Email validation using RFC 5322 compliant regex (simplified).
 */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')
}

/**
 * Password validation - minimum 6 characters.
 */
export function validatePassword(password) {
  return !!(password && password.length >= 6)
}

/**
 * Name validation - minimum 2 characters after trimming.
 */
export function validateName(name) {
  return !!(name && name.trim().length >= 2)
}

/**
 * Specialty validation - minimum 2 characters after trimming.
 */
export function validateSpecialty(specialty) {
  return !!(specialty && specialty.trim().length >= 2)
}

/**
 * Validates all required fields for a doctor profile.
 * Returns error message string or null if valid.
 */
export function validateDoctorProfile(fields) {
  if (!fields.name_en || fields.name_en.trim().length < 2) {
    return 'Doctor name (English) must be at least 2 characters'
  }
  if (!fields.specialty_en || fields.specialty_en.trim().length < 2) {
    return 'Specialty (English) must be at least 2 characters'
  }
  if (!fields.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) {
    return 'Profile URL slug is invalid'
  }
  return null
}

/**
 * Phone number validation - digits, spaces, +, -, parentheses only, min 8 digits.
 */
export function validatePhone(phone) {
  const trimmed = phone.trim()
  if (!trimmed) return false
  if (!/^[0-9+\-() ]+$/.test(trimmed)) return false
  const digitCount = trimmed.replace(/\D/g, '').length
  return digitCount >= 8
}

/**
 * Password strength calculation for visual feedback.
 */
export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '#ced4da' }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  }

  score = Object.values(checks).filter(Boolean).length

  if (password.length >= 12) score = Math.min(score + 1, 5)
  if (password.length >= 16) score = Math.min(score + 1, 5)

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd']

  return {
    score: Math.min(score, 5),
    label: labels[Math.min(score, 5) - 1] || '',
    color: colors[Math.min(score, 5) - 1] || '#ced4da',
    checks,
  }
}
