import { createContext, useState, useEffect, useCallback } from 'react'
import doctorsData from '../data/doctors.json'

export const AuthContext = createContext(null)

const STORAGE_KEY = 'carelink_user'

function resolveRole(email) {
  const doctor = doctorsData.doctors.find(
    (d) => d.email.toLowerCase() === email.toLowerCase(),
  )
  if (doctor) {
    return { role: 'doctor', doctorId: doctor.id, doctorName: doctor.name }
  }
  return { role: 'patient', doctorId: null, doctorName: null }
}

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address')
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      const { role, doctorId, doctorName } = resolveRole(email)

      const mockUser = {
        id: role === 'doctor' ? doctorId : 1,
        name: role === 'doctor' ? doctorName : email.split('@')[0],
        email,
        avatar: null,
        role,
        doctorId,
      }
      setUser(mockUser)
      return { success: true, role }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = { user, loading, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
