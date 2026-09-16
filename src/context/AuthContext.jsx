import { createContext, useState, useEffect, useCallback } from 'react'
import doctorsData from '../data/doctors.json'
import supabase, { isSupabaseConfigured } from '../services/supabase'

export const AuthContext = createContext(null)

const STORAGE_KEY = 'carelink_user'

// Mock fallback when Supabase not configured — keeps app usable without .env
function resolveMockRole(email) {
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

function toUserFromProfile(sessionUser, profile) {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: profile?.name || sessionUser.email?.split('@')[0] || 'User',
    avatar: null,
    role: profile?.role || 'patient',
    doctorId: profile?.doctor_id || null,
  }
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, role, doctor_id, email')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    isSupabaseConfigured ? null : loadMockUser(),
  )
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [actionLoading, setActionLoading] = useState(false)

  // Supabase session handling
  useEffect(() => {
    if (!isSupabaseConfigured) {
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
          setUser(toUserFromProfile(session.user, profile))
        } else {
          setUser(null)
        }
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setAuthLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthLoading(false)
        return
      }
      if (session?.user) {
        if (event === 'TOKEN_REFRESHED' && user) {
          return
        }
        const profile = await fetchProfile(session.user.id)
        setUser(toUserFromProfile(session.user, profile))
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mock persistence when Supabase not configured
  useEffect(() => {
    if (isSupabaseConfigured) return
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = useCallback(async (email, password) => {
    setActionLoading(true)
    try {
      const trimmedEmail = email.trim()
      const trimmedPassword = password

      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address')
      }
      if (!trimmedPassword || trimmedPassword.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const { role, doctorId, doctorName } = resolveMockRole(trimmedEmail)
        const mockUser = {
          id: role === 'doctor' ? doctorId : trimmedEmail.toLowerCase(),
          name: role === 'doctor' ? doctorName : trimmedEmail.split('@')[0],
          email: trimmedEmail,
          avatar: null,
          role,
          doctorId,
        }
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
      if (!trimmedName || trimmedName.length < 2) {
        throw new Error('Name must be at least 2 characters')
      }
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address')
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      if (!isSupabaseConfigured) {
        return {
          success: false,
          error: 'Supabase not configured. Set .env to enable signup.',
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

  const signupDoctor = useCallback(
    async ({ name, email, password, doctorId }) => {
      setActionLoading(true)
      try {
        const trimmedEmail = email.trim()
        const trimmedName = name.trim()
        if (!trimmedName || trimmedName.length < 2) {
          throw new Error('Name must be at least 2 characters')
        }
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          throw new Error('Please enter a valid email address')
        }
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        if (!doctorId) throw new Error('Please select a doctor profile')

        if (!isSupabaseConfigured) {
          return { success: false, error: 'Supabase not configured.' }
        }

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { name: trimmedName, role: 'patient', doctor_id: doctorId },
          },
        })
        if (error) throw new Error(mapSupabaseError(error.message))
        if (!data.user) throw new Error('Signup failed. Please try again.')

        // Role promotion to 'doctor' must be done by an admin via the
        // AdminDoctors page.  The trigger creates the profile as 'patient'
        // by default.  We do NOT update role from the client to prevent
        // privilege escalation.

        return { success: true }
      } catch (err) {
        return { success: false, error: err.message || 'Signup failed' }
      } finally {
        setActionLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    if (!isSupabaseConfigured) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Password reset requires Supabase.' }
    }
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { success: false, error: 'Please enter a valid email address' }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { success: false, error: mapSupabaseError(error.message) }
    return { success: true }
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Not configured.' }
    }
    if (!newPassword || newPassword.length < 6) {
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
    login,
    signupPatient,
    signupDoctor,
    logout,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function mapSupabaseError(msg) {
  const m = msg.toLowerCase()
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
  return msg
}
