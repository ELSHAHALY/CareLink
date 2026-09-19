import { useEffect, useMemo, useState } from 'react'
import doctorsData from '../data/doctors.json'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import { loadCatalogDoctors } from './useDoctors'
import { toUiDoctor } from '../utils/doctors'

/**
 * Lightweight hook that loads the full doctors catalog once and exposes both
 * an array and a map by id. Used by dashboard widgets that need to resolve
 * doctor names/images from appointment rows without re-running filters.
 */
export function useDoctorsCatalog() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        if (isSupabaseConfigured && supabase) {
          const catalog = await loadCatalogDoctors()
          if (!cancelled && catalog.length > 0) {
            setDoctors(catalog)
            return
          }
        }
        if (!cancelled) {
          setDoctors(doctorsData.doctors.map((d) => toUiDoctor(d)))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load doctors')
          setDoctors(doctorsData.doctors.map((d) => toUiDoctor(d)))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const doctorMap = useMemo(() => {
    const map = {}
    doctors.forEach((d) => {
      if (d?.id) map[d.id] = d
    })
    return map
  }, [doctors])

  return { doctors, doctorMap, loading, error }
}

export default useDoctorsCatalog
