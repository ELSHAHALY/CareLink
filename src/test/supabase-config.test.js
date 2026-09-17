import { describe, it, expect } from 'vitest'
import {
  isValidSupabaseUrl,
  isValidAnonKey,
  containsPlaceholder,
} from '../services/supabase'

describe('Supabase client configuration (real implementation)', () => {
  it('detects placeholder URLs', () => {
    expect(
      isValidSupabaseUrl('https://your-project.placeholder.supabase.co'),
    ).toBe(false)
    expect(containsPlaceholder('https://your-project.placeholder.supabase.co')).toBe(
      true,
    )
  })

  it('rejects .env.example default values as invalid', () => {
    // Regression test: old code only checked for 'placeholder' and treated
    // https://your-project.supabase.co as configured, causing runtime crash.
    expect(isValidSupabaseUrl('https://your-project.supabase.co')).toBe(false)
    expect(isValidAnonKey('your-anon-key-here')).toBe(false)
  })

  it('accepts real https URLs', () => {
    expect(isValidSupabaseUrl('https://abc123.supabase.co')).toBe(true)
  })

  it('accepts local Supabase CLI http URLs', () => {
    expect(isValidSupabaseUrl('http://127.0.0.1:54321')).toBe(true)
    expect(isValidSupabaseUrl('http://localhost:54321')).toBe(true)
  })

  it('rejects non-local http and malformed URLs', () => {
    expect(isValidSupabaseUrl('http://evil.com:54321')).toBe(false)
    expect(isValidSupabaseUrl('not-a-url')).toBe(false)
    expect(isValidSupabaseUrl('')).toBe(false)
    expect(isValidSupabaseUrl(undefined)).toBe(false)
  })

  it('rejects short or placeholder anon keys', () => {
    expect(isValidAnonKey(undefined)).toBe(false)
    expect(isValidAnonKey('short')).toBe(false)
    expect(
      isValidAnonKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.payload.signature-long-enough'),
    ).toBe(true)
  })
})
