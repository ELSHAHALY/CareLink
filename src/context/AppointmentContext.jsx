import { createContext, useCallback, useState } from 'react'
import appointmentsData from '../data/appointments.json'
import { loadAppointments, saveAppointments } from '../services/localStore'

export const AppointmentContext = createContext(null)

const REQUIRED_APPOINTMENT_FIELDS = [
  'doctorId',
  'patientId',
  'date',
  'time',
  'type',
  'patientName',
  'patientEmail',
  'patientPhone',
]

const VALID_STATUSES = ['scheduled', 'completed', 'cancelled']

function isBlank(value) {
  if (typeof value !== 'string') {
    return true
  }
  return value.trim() === ''
}

function findMissingFields(data, fields) {
  return fields.filter((field) => isBlank(data?.[field]))
}

function generateUniqueAppointmentId(appointments) {
  let candidate
  do {
    const random = Math.random().toString(36).slice(2, 8)
    candidate = `apt-${Date.now()}-${random}`
  } while (
    appointments.some((appointment) => appointment.appointmentId === candidate)
  )
  return candidate
}

function isSlotTaken(
  appointments,
  { doctorId, date, time },
  excludeAppointmentId = null,
) {
  return appointments.some(
    (appointment) =>
      appointment.appointmentId !== excludeAppointmentId &&
      appointment.doctorId === doctorId &&
      appointment.date === date &&
      appointment.time === time &&
      appointment.status === 'scheduled',
  )
}

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState(() =>
    loadAppointments(appointmentsData.appointments),
  )
  const [error, setError] = useState(null)

  const isLoading = false

  const createAppointment = useCallback(
    (data) => {
      const missingFields = findMissingFields(data, REQUIRED_APPOINTMENT_FIELDS)
      if (missingFields.length > 0) {
        const message = `Missing required field(s): ${missingFields.join(', ')}`
        setError(message)
        return { success: false, error: message }
      }

      if (isSlotTaken(appointments, data)) {
        const message =
          'This doctor already has a scheduled appointment at that date and time.'
        setError(message)
        return { success: false, error: message }
      }

      const newAppointment = {
        appointmentId: generateUniqueAppointmentId(appointments),
        doctorId: data.doctorId,
        patientId: data.patientId,
        date: data.date,
        time: data.time,
        type: data.type,
        status: 'scheduled',
        patientName: data.patientName,
        patientEmail: data.patientEmail,
        patientPhone: data.patientPhone,
        notes: isBlank(data.notes) ? '' : data.notes,
      }

      const nextAppointments = [...appointments, newAppointment]
      const persisted = saveAppointments(nextAppointments)

      if (!persisted) {
        const message = 'Unable to save the appointment. Please try again.'
        setError(message)
        return { success: false, error: message }
      }

      setAppointments(nextAppointments)
      setError(null)
      return { success: true, appointment: newAppointment }
    },
    [appointments],
  )

  const updateAppointment = useCallback(
    (appointmentId, changes) => {
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

      const nextAppointments = appointments.map((appointment) =>
        appointment.appointmentId === appointmentId
          ? updatedAppointment
          : appointment,
      )
      const persisted = saveAppointments(nextAppointments)

      if (!persisted) {
        const message = 'Unable to save the update. Please try again.'
        setError(message)
        return { success: false, error: message }
      }

      setAppointments(nextAppointments)
      setError(null)
      return { success: true, appointment: updatedAppointment }
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
