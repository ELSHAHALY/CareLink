import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import doctorsData from '../data/doctors.json'
import supabase, {
  isSupabaseConfigured,
  isProduction,
  allowMockAuth,
  getSupabaseConfigError,
} from '../services/supabase'

export const AuthContext = createContext(null)

const STORAGE_KEY = 'carelink_user'

// Mock auth is opt-in via VITE_ALLOW_MOCK_AUTH=true.
// In production builds, mock auth is NEVER allowed (isProduction overrides).
export const isMockAuthAllowed = allowMockAuth && !isProduction

// Mock fallback when Supabase not configured — keeps app usable without .env
export function resolveMockRole(email) {
  const doctor = doctorsData.doctors.find(
    (d) => d.email.toLowerCase() === email.toLowerCase(),
  )
  if (doctor) {
    return { role: 'doctor', doctorId: doctor.id, doctorName: doctor.name }
  }
  return { role: 'patient', doctorId: null, doctorName: null }
}

function loadMockUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function toUserFromProfile(sessionUser, profile) {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: profile?.name || sessionUser.email?.split('@')[0] || 'User',
    avatar: null,
    role: profile?.role || 'patient',
    doctorId: profile?.doctor_id || null,
    profileMissing: !profile,
  }
}

export async function fetchProfile(userId) {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, doctor_id, email')
      .eq('id', userId)
      .single()
    if (error) return null
    return data
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (isSupabaseConfigured) return null
    if (isMockAuthAllowed) return loadMockUser()
    return null
  })
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [actionLoading, setActionLoading] = useState(false)
  const [configError] = useState(() =>
    isSupabaseConfigured ? null : getSupabaseConfigError(),
  )
  // Tracks the auth user id we already resolved, to avoid redundant
  // profile fetches on TOKEN_REFRESHED without closing over stale `user`.
  const resolvedUserIdRef = useRef(null)

  // Supabase session handling
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined
    }

    let mounted = true

    async function init() {
      setAuthLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (!mounted) return
          resolvedUserIdRef.current = session.user.id
          setUser(toUserFromProfile(session.user, profile))
        } else {
          resolvedUserIdRef.current = null
          setUser(null)
        }
      } catch {
        if (mounted) {
          resolvedUserIdRef.current = null
          setUser(null)
        }
      } finally {
        if (mounted) setAuthLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        resolvedUserIdRef.current = null
        setUser(null)
        setAuthLoading(false)
        return
      }
      if (session?.user) {
        // On TOKEN_REFRESHED the session user id is unchanged and the
        // role/profile cannot change via refresh alone, so skip the extra
        // DB round-trip using the ref (no stale `user` closure).
        if (
          event === 'TOKEN_REFRESHED' &&
          resolvedUserIdRef.current === session.user.id
        ) {
          setAuthLoading(false)
          return
        }
        const profile = await fetchProfile(session.user.id)
        if (!mounted) return
        resolvedUserIdRef.current = session.user.id
        setUser(toUserFromProfile(session.user, profile))
      } else {
        resolvedUserIdRef.current = null
        setUser(null)
      }
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Mock persistence when Supabase not configured (dev only)
  useEffect(() => {
    if (!isMockAuthAllowed) return
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // storage unavailable — ignore
    }
  }, [user])

  const login = useCallback(async (email, password) => {
    setActionLoading(true)
    try {
      const trimmedEmail = email.trim()
      const trimmedPassword = password

      if (!validateEmail(trimmedEmail)) {
        throw new Error('Please enter a valid email address')
      }
      if (!validatePassword(trimmedPassword)) {
        throw new Error('Password must be at least 6 characters')
      }

      if (!isSupabaseConfigured || !supabase) {
        if (isProduction) {
          throw new Error(
            getSupabaseConfigError() ||
              'Authentication is not configured. Contact support.',
          )
        }
        // In dev/test, mock auth is opt-in via VITE_ALLOW_MOCK_AUTH=true.
        // Never silently fall back to mock auth.
        if (!isMockAuthAllowed) {
          throw new Error(
            getSupabaseConfigError() || 'Authentication is not configured.',
          )
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
        const { role, doctorId, doctorName } = resolveMockRole(trimmedEmail)
        const mockUser = {
          id: role === 'doctor' ? doctorId : trimmedEmail.toLowerCase(),
          name: role === 'doctor' ? doctorName : trimmedEmail.split('@')[0],
          email: trimmedEmail,
          avatar: null,
          role,
          doctorId,
          profileMissing: false,
        }
        resolvedUserIdRef.current = mockUser.id
        setUser(mockUser)
        return { success: true, role }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      })
      if (error) throw new Error(mapSupabaseError(error.message))
      const profile = await fetchProfile(data.user.id)
      const nextUser = toUserFromProfile(data.user, profile)
      setUser(nextUser)
      return { success: true, role: nextUser.role }
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' }
    } finally {
      setActionLoading(false)
    }
  }, [])

  const signupPatient = useCallback(async ({ name, email, password }) => {
    setActionLoading(true)
    try {
      const trimmedEmail = email.trim()
      const trimmedName = name.trim()
      if (!validateName(trimmedName)) {
        throw new Error('Name must be at least 2 characters')
      }
      if (!validateEmail(trimmedEmail)) {
        throw new Error('Please enter a valid email address')
      }
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters')
      }

      if (!isSupabaseConfigured || !supabase) {
        return {
          success: false,
          error:
            getSupabaseConfigError() ||
            'Supabase not configured. Set .env to enable signup.',
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { name: trimmedName, role: 'patient' } },
      })
      if (error) throw new Error(mapSupabaseError(error.message))
      if (!data.user) throw new Error('Signup failed. Please try again.')

      // Trigger creates profile as patient; if RLS blocks, insert explicitly
      // (idempotent due to on conflict)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Signup failed' }
    } finally {
      setActionLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut()
      }
    } finally {
      resolvedUserIdRef.current = null
      setUser(null)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: getSupabaseConfigError() || 'Password reset requires Supabase.',
      }
    }
    const trimmed = email.trim()
    if (!validateEmail(trimmed)) {
      return { success: false, error: 'Please enter a valid email address' }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { success: false, error: mapSupabaseError(error.message) }
    return { success: true }
  }, [])

  const resendConfirmation = useCallback(async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: getSupabaseConfigError() || 'Not configured.',
      }
    }
    const trimmed = email.trim()
    if (!validateEmail(trimmed)) {
      return { success: false, error: 'Please enter a valid email address' }
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed,
    })
    if (error) return { success: false, error: mapSupabaseError(error.message) }
    return { success: true }
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: getSupabaseConfigError() || 'Not configured.',
      }
    }
    if (!validatePassword(newPassword)) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: mapSupabaseError(error.message) }
    return { success: true }
  }, [])

  // Keep `loading` for backward compat (Login.jsx uses it); expose both
  const value = {
    user,
    loading: authLoading || actionLoading,
    authLoading,
    actionLoading,
    isSupabaseConfigured,
    isProduction,
    isMockAuthAllowed,
    configError,
    login,
    signupPatient,
    logout,
    resetPassword,
    updatePassword,
    resendConfirmation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')
}

export function validatePassword(password) {
  return !!(password && password.length >= 6)
}

export function validateName(name) {
  return !!(name && name.trim().length >= 2)
}

export function getRoleRedirect(role) {
  if (role === 'admin') return '/admin/doctors'
  if (role === 'doctor') return '/doctor/dashboard'
  return '/dashboard'
}

export function mapSupabaseError(msg) {
  const m = String(msg || '').toLowerCase()
  if (!m) return 'Something went wrong. Please try again.'
  if (m.includes('invalid login credentials'))
    return 'Invalid email or password.'
  if (
    m.includes('email already registered') ||
    m.includes('already registered')
  )
    return 'An account with this email already exists.'
  if (m.includes('email not confirmed'))
    return 'Please confirm your email first.'
  if (m.includes('password should be at least'))
    return 'Password must be at least 6 characters.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Too many attempts. Please try again later.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Please check your connection.'
  return String(msg)
}
