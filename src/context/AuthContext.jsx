import { createContext, useState, useEffect, useCallback } from 'react'

export const AuthContext = createContext(null)

const STORAGE_KEY = 'carelink_user'

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
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock validation: accept any valid email + password >= 6 chars
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address')
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      const mockUser = {
        id: 1,
        name: email.split('@')[0],
        email,
        avatar: null,
      }
      setUser(mockUser)
      return { success: true }
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
