import { useEffect, useMemo, useState } from 'react'
import ratingsData from '../data/ratings.json'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import { PUBLIC_RATING_COLUMNS, toUiRating } from '../utils/ratings'

function legacyFallbackRatings() {
  const list = ratingsData?.ratings || []
  return list.map(toUiRating).filter(Boolean)
}

/**
 * Loads published ratings once.
 * - Supabase when configured: selects ONLY public columns, status='published'.
 * - Dev/offline fallback: src/data/ratings.json (never in production when
 *   Supabase query succeeds; on Supabase failure production returns [] so
 *   demo data is never mistaken for real reviews).
 */
export function useRatings() {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('local')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        if (isSupabaseConfigured && supabase) {
          const { data, error: dbError } = await supabase
            .from('ratings')
            .select(PUBLIC_RATING_COLUMNS)
            .eq('status', 'published')
            .order('review_date', { ascending: false })
            .limit(500)
          if (dbError) throw dbError
          if (!cancelled) {
            const mapped = (data || []).map(toUiRating).filter(Boolean)
            setRatings(mapped)
            // Empty published set is a valid result (e.g. seeds still pending).
            // Only fall back to JSON when Supabase is unreachable (error path).
            setSource('supabase')
            return
          }
        }
        if (!cancelled) {
          if (import.meta.env.PROD) {
            setRatings([])
            setSource('supabase')
          } else {
            setRatings(legacyFallbackRatings())
            setSource('local')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load ratings')
          if (import.meta.env.PROD) {
            setRatings([])
            setSource('supabase')
          } else {
            setRatings(legacyFallbackRatings())
            setSource('local')
          }
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

  const ratingsByDoctor = useMemo(() => {
    const map = {}
    ratings.forEach((r) => {
      if (!r?.doctorId) return
      if (!map[r.doctorId]) map[r.doctorId] = []
      map[r.doctorId].push(r)
    })
    return map
  }, [ratings])

  return { ratings, ratingsByDoctor, loading, error, source }
}

export default useRatings
