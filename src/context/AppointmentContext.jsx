import { createContext, useCallback, useEffect, useState } from 'react'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import {
  REQUIRED_APPOINTMENT_FIELDS,
  VALID_STATUSES,
  findMissingFields,
  isSlotTaken,
  toLegacyAppointment,
  toDbAppointmentInsert,
  mapSupabaseAppointmentError,
} from '../utils/appointments'

export const AppointmentContext = createContext(null)

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  // Load from Supabase when configured (RLS scopes rows to the caller).
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false)
      return undefined
    }
    let cancelled = false

    async function loadFromSupabase() {
      setIsLoading(true)
      try {
        const { data, error: dbError } = await supabase
          .from('appointments')
          .select(
            'id, doctor_id, patient_id, date, time, type, status, patient_name, patient_email, patient_phone, notes',
          )
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit(500)
        if (cancelled) return
        if (dbError) throw dbError
        setAppointments((data || []).map(toLegacyAppointment).filter(Boolean))
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load appointments')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadFromSupabase()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadFromSupabase()
    })
    return () => {
      cancelled = true
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const createAppointment = useCallback(
    async (data) => {
      const missingFields = findMissingFields(data, REQUIRED_APPOINTMENT_FIELDS)
      if (missingFields.length > 0) {
        const message = `Missing required field(s): ${missingFields.join(', ')}`
        setError(message)
        return { success: false, error: message }
      }

      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase not configured. Cannot create appointment.')
        return { success: false, error: 'Supabase not configured.' }
      }

      try {
        const {
          data: { user: sessionUser },
        } = await supabase.auth.getUser()
        if (!sessionUser) {
          const message = 'No active session. Please log in.'
          setError(message)
          return { success: false, error: message }
        }
        if (isSlotTaken(appointments, data)) {
          const message =
            'This doctor already has a scheduled appointment at that date and time.'
          setError(message)
          return { success: false, error: message }
        }
        const { data: inserted, error: insertError } = await supabase
          .from('appointments')
          .insert(toDbAppointmentInsert(data, sessionUser.id))
          .select(
            'id, doctor_id, patient_id, date, time, type, status, patient_name, patient_email, patient_phone, notes',
          )
          .single()
        if (insertError) {
          const message = mapSupabaseAppointmentError(insertError)
          setError(message)
          return { success: false, error: message }
        }
        const legacy = toLegacyAppointment(inserted)
        setAppointments((prev) => [...prev, legacy])
        setError(null)
        return { success: true, appointment: legacy }
      } catch (err) {
        const message = mapSupabaseAppointmentError(err)
        setError(message)
        return { success: false, error: message }
      }
    },
    [appointments],
  )

  const updateAppointment = useCallback(
    async (appointmentId, changes) => {
      const existing = appointments.find(
        (appointment) => appointment.appointmentId === appointmentId,
      )

      if (!existing) {
        const message = 'Appointment not found.'
        setError(message)
        return { success: false, error: message }
      }

      if (
        changes?.status !== undefined &&
        !VALID_STATUSES.includes(changes.status)
      ) {
        const message = `Invalid status. Must be one of: ${VALID_STATUSES.join(
          ', ',
        )}`
        setError(message)
        return { success: false, error: message }
      }

      const updatedAppointment = {
        ...existing,
        ...changes,
        appointmentId: existing.appointmentId,
      }

      if (
        updatedAppointment.status === 'scheduled' &&
        isSlotTaken(appointments, updatedAppointment, appointmentId)
      ) {
        const message =
          'Another appointment already occupies that doctor, date, and time.'
        setError(message)
        return { success: false, error: message }
      }

      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase not configured. Cannot update appointment.')
        return { success: false, error: 'Supabase not configured.' }
      }

      try {
        const dbChanges = {}
        if (changes.status !== undefined) dbChanges.status = changes.status
        if (changes.type !== undefined) dbChanges.type = changes.type
        if (changes.date !== undefined) dbChanges.date = changes.date
        if (changes.time !== undefined) dbChanges.time = changes.time
        if (changes.notes !== undefined) dbChanges.notes = changes.notes
        const { data: updated, error: updateError } = await supabase
          .from('appointments')
          .update(dbChanges)
          .eq('id', appointmentId)
          .select(
            'id, doctor_id, patient_id, date, time, type, status, patient_name, patient_email, patient_phone, notes',
          )
          .single()
        if (updateError) {
          const message = mapSupabaseAppointmentError(updateError)
          setError(message)
          return { success: false, error: message }
        }
        const legacy = toLegacyAppointment(updated)
        setAppointments((prev) =>
          prev.map((a) => (a.appointmentId === appointmentId ? legacy : a)),
        )
        setError(null)
        return { success: true, appointment: legacy }
      } catch (err) {
        const message = mapSupabaseAppointmentError(err)
        setError(message)
        return { success: false, error: message }
      }
    },
    [appointments],
  )

  const cancelAppointment = useCallback(
    (appointmentId) =>
      updateAppointment(appointmentId, { status: 'cancelled' }),
    [updateAppointment],
  )

  const value = {
    appointments,
    isLoading,
    error,
    createAppointment,
    updateAppointment,
    cancelAppointment,
  }

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  )
}
