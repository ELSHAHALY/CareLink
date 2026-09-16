import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isPlaceholder =
  !url ||
  !anonKey ||
  url.includes('placeholder') ||
  anonKey.includes('placeholder')

export const isSupabaseConfigured = !isPlaceholder

function createSupabaseClient() {
  if (isPlaceholder) {
    console.warn(
      '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — running in local mock mode. Set .env to enable real auth.',
    )
    return null
  }
  return createClient(url, anonKey)
}

const supabase = createSupabaseClient()

export default supabase
