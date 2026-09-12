import { useState, useCallback } from 'react'

const STORAGE_KEY = 'carelink_favorites'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites)

  const toggleFavorite = useCallback((doctorId) => {
    setFavorites((prev) => {
      const next = prev.includes(doctorId)
        ? prev.filter((id) => id !== doctorId)
        : [...prev, doctorId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (doctorId) => favorites.includes(doctorId),
    [favorites],
  )

  return { favorites, toggleFavorite, isFavorite }
}
