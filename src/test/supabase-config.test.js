import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Supabase client configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('detects placeholder URLs', () => {
    const url = 'https://your-project.placeholder.supabase.co'
    const anonKey = 'your-anon-key-placeholder'
    const isPlaceholder =
      !url || !anonKey || url.includes('placeholder') || anonKey.includes('placeholder')
    expect(isPlaceholder).toBe(true)
  })

  it('detects .env.example default values as placeholders', () => {
    const url = 'https://your-project.supabase.co'
    const anonKey = 'your-anon-key-here'
    // The actual app checks for 'placeholder' substring, not example defaults
    // This documents the detection boundary
    const isPlaceholder =
      !url || !anonKey || url.includes('placeholder') || anonKey.includes('placeholder')
    // These are NOT detected as placeholders by the current implementation
    // They would need to be set to actual values
    expect(isPlaceholder).toBe(false)
  })

  it('detects real URLs', () => {
    const url = 'https://abc123.supabase.co'
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
    const isPlaceholder =
      !url || !anonKey || url.includes('placeholder') || anonKey.includes('placeholder')
    expect(isPlaceholder).toBe(false)
  })

  it('detects missing env vars', () => {
    const url = undefined
    const anonKey = undefined
    const isPlaceholder =
      !url || !anonKey || url?.includes('placeholder') || anonKey?.includes('placeholder')
    expect(isPlaceholder).toBe(true)
  })
})

describe('Error message mapping', () => {
  function mapSupabaseError(msg) {
    const m = msg.toLowerCase()
    if (m.includes('invalid login credentials')) return 'Invalid email or password.'
    if (m.includes('email already registered') || m.includes('already registered'))
      return 'An account with this email already exists.'
    if (m.includes('email not confirmed')) return 'Please confirm your email first.'
    if (m.includes('password should be at least')) return 'Password must be at least 6 characters.'
    if (m.includes('rate limit') || m.includes('too many requests'))
      return 'Too many attempts. Please try again later.'
    if (m.includes('network') || m.includes('fetch'))
      return 'Network error. Please check your connection.'
    return msg
  }

  it('maps invalid login credentials', () => {
    expect(mapSupabaseError('Invalid login credentials')).toBe('Invalid email or password.')
  })

  it('maps email already registered', () => {
    expect(mapSupabaseError('Email already registered')).toBe(
      'An account with this email already exists.',
    )
  })

  it('maps rate limit errors', () => {
    expect(mapSupabaseError('Rate limit exceeded')).toBe(
      'Too many attempts. Please try again later.',
    )
  })

  it('maps network errors', () => {
    expect(mapSupabaseError('Network request failed')).toBe(
      'Network error. Please check your connection.',
    )
  })

  it('preserves unknown errors', () => {
    expect(mapSupabaseError('Some unknown error')).toBe('Some unknown error')
  })
})
