import { useEffect, useMemo, useState } from 'react'
import doctorsData from '../data/doctors.json'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import { mapCatalogDoctor, toUiDoctor } from '../utils/doctors'

const DEFAULT_FILTERS = { search: '', specialty: '', city: '', rating: '' }

// Real cloud catalog columns (uuid schema). Selected explicitly so a
// missing column fails fast and falls through to the next strategy.
const CATALOG_COLUMNS =
  'id,slug,name_ar,name_en,specialty_ar,specialty_en,bio_ar,bio_en,image,services,status,sort_order,verified'

// Legacy local-dev schema from migrations 001/004 (text ids).
const LEGACY_COLUMNS = 'id, name, specialty, email'

export function filterDoctors(doctors, filters = {}) {
  const merged = { ...DEFAULT_FILTERS, ...(filters || {}) }
  const searchTerm = (merged.search || '').toLowerCase().trim()
  return (doctors || []).filter((doctor) => {
    const name = doctor.name || ''
    const specialty = doctor.specialty || ''
    const matchesSearch =
      !searchTerm ||
      name.toLowerCase().includes(searchTerm) ||
      specialty.toLowerCase().includes(searchTerm)
    const matchesSpecialty = !merged.specialty || specialty === merged.specialty
    const matchesCity = !merged.city || doctor.location?.city === merged.city
    const matchesRating =
      !merged.rating || (doctor.rating ?? 0) >= Number(merged.rating)
    return matchesSearch && matchesSpecialty && matchesCity && matchesRating
  })
}

async function loadCatalogDoctors() {
  // Strategy 1: real cloud catalog (uuid + bilingual columns).
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select(CATALOG_COLUMNS)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) throw error
    if (data && data.length > 0) {
      const mapped = data
        .map(mapCatalogDoctor)
        .filter((d) => !d.status || d.status === 'published')
      if (mapped.length > 0) return mapped
      // Catalog exists but nothing published — show all rather than empty.
      return data.map(mapCatalogDoctor)
    }
  } catch {
    // Fall through to legacy shape (local dev DB or older schema).
  }

  // Strategy 2: legacy text-id schema (local Supabase CLI output).
  const { data, error } = await supabase.from('doctors').select(LEGACY_COLUMNS)
  if (error) throw error
  if (!data || data.length === 0) return []
  const staticById = new Map(doctorsData.doctors.map((d) => [d.id, d]))
  return data.map((row) =>
    toUiDoctor({ ...(staticById.get(row.id) || {}), ...row }),
  )
}

/**
 * Fetches one doctor by id: static data first (instant, offline-safe),
 * then the Supabase catalog (covers uuid ids). Returns null when missing.
 */
export async function fetchDoctorById(doctorId) {
  if (!doctorId) return null
  const local = doctorsData.doctors.find((d) => d.id === doctorId)
  if (local) return toUiDoctor(local)
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select(CATALOG_COLUMNS)
      .eq('id', doctorId)
      .single()
    if (error || !data) return null
    return mapCatalogDoctor(data)
  } catch {
    return null
  }
}

export function useDoctorById(doctorId) {
  const [doctor, setDoctor] = useState(() =>
    doctorId
      ? toUiDoctor(doctorsData.doctors.find((d) => d.id === doctorId) || null)
      : null,
  )
  const [loading, setLoading] = useState(() => {
    if (!doctorId) return false
    if (doctorsData.doctors.some((d) => d.id === doctorId)) return false
    return isSupabaseConfigured
  })

  useEffect(() => {
    let cancelled = false
    if (!doctorId) {
      setDoctor(null)
      setLoading(false)
      return undefined
    }
    const local = doctorsData.doctors.find((d) => d.id === doctorId)
    if (local) {
      setDoctor(toUiDoctor(local))
      setLoading(false)
      return undefined
    }
    if (!isSupabaseConfigured || !supabase) {
      setDoctor(null)
      setLoading(false)
      return undefined
    }
    setLoading(true)
    fetchDoctorById(doctorId).then((found) => {
      if (!cancelled) {
        setDoctor(found)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [doctorId])

  return { doctor, loading }
}

export default function useDoctors(filters) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const loadDoctors = async () => {
      try {
        setLoading(true)
        setError(null)

        // Prefer the Supabase catalog when configured (public read),
        // fall back to static doctors.json for dev/offline.
        if (isSupabaseConfigured && supabase) {
          const catalog = await loadCatalogDoctors()
          if (!cancelled && catalog.length > 0) {
            setDoctors(catalog)
            return
          }
        }

        if (!cancelled)
          setDoctors(doctorsData.doctors.map((d) => toUiDoctor(d)))
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load doctors')
          // Fall back to static data so the UI stays usable.
          setDoctors(doctorsData.doctors.map((d) => toUiDoctor(d)))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDoctors()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredDoctors = useMemo(
    () => filterDoctors(doctors, filters),
    [doctors, filters],
  )

  return {
    doctors: filteredDoctors,
    loading,
    error,
  }
}
