import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const url = typeof rawUrl === 'string' ? rawUrl.trim() : ''
const anonKey = typeof rawAnonKey === 'string' ? rawAnonKey.trim() : ''

export const isProduction = Boolean(import.meta.env.PROD)

const PLACEHOLDER_PATTERNS = [
  'placeholder',
  'your-project',
  'your-anon-key',
  'example',
  'changeme',
  'replace-me',
  'xxx',
  '<',
  '>',
]

export function containsPlaceholder(value) {
  if (!value) return true
  const lower = value.toLowerCase()
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))
}

export function isValidSupabaseUrl(value) {
  if (!value || containsPlaceholder(value)) return false
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:') return true
    // Allow local Supabase CLI (http://127.0.0.1:54321 or http://localhost:54321)
    if (parsed.protocol === 'http:') {
      const host = parsed.hostname
      if (host === '127.0.0.1' || host === 'localhost') return true
      return false
    }
    return false
  } catch {
    return false
  }
}

export function isValidAnonKey(value) {
  if (!value || containsPlaceholder(value)) return false
  // Real anon keys are long JWTs; require a sane minimum to catch "test"/"123".
  if (value.length < 20) return false
  return true
}

export const supabaseUrlValid = isValidSupabaseUrl(url)
export const supabaseAnonKeyValid = isValidAnonKey(anonKey)
export const isSupabaseConfigured = supabaseUrlValid && supabaseAnonKeyValid

export function getSupabaseConfigError() {
  if (isSupabaseConfigured) return null
  if (!url && !anonKey) {
    return 'Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill values from Supabase Dashboard → Settings → API.'
  }
  if (!supabaseUrlValid) {
    return 'Invalid VITE_SUPABASE_URL. Expected https://xxx.supabase.co (or http://127.0.0.1:54321 for local CLI).'
  }
  return 'Invalid VITE_SUPABASE_ANON_KEY. Copy the anon public key from Supabase Dashboard → Settings → API.'
}

function createSupabaseClient() {
  if (!isSupabaseConfigured) {
    const detail = getSupabaseConfigError()
    if (isProduction) {
      // Fail closed in production: never silently fall back to mock auth.
      console.error(`[Supabase] NOT configured in production. ${detail}`)
    } else {
      console.warn(`[Supabase] Running in local mock mode. ${detail}`)
    }
    return null
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

const supabase = createSupabaseClient()

export default supabase
