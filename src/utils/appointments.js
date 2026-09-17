export const REQUIRED_APPOINTMENT_FIELDS = [
  'doctorId',
  'patientId',
  'date',
  'time',
  'type',
  'patientName',
  'patientEmail',
  'patientPhone',
]

export const VALID_STATUSES = ['scheduled', 'completed', 'cancelled']

export function isBlank(value) {
  if (typeof value !== 'string') return true
  return value.trim() === ''
}

export function findMissingFields(data, fields = REQUIRED_APPOINTMENT_FIELDS) {
  return (fields || []).filter((field) => isBlank(data?.[field]))
}

export function generateUniqueAppointmentId(appointments = []) {
  let candidate
  do {
    const random = Math.random().toString(36).slice(2, 8)
    candidate = `apt-${Date.now()}-${random}`
  } while (
    (appointments || []).some(
      (appointment) => appointment.appointmentId === candidate,
    )
  )
  return candidate
}

export function isSlotTaken(
  appointments,
  { doctorId, date, time },
  excludeAppointmentId = null,
) {
  return (appointments || []).some(
    (appointment) =>
      appointment.appointmentId !== excludeAppointmentId &&
      appointment.doctorId === doctorId &&
      appointment.date === date &&
      appointment.time === time &&
      appointment.status === 'scheduled',
  )
}

export function isValidStatus(status) {
  return VALID_STATUSES.includes(status)
}

// Maps Supabase row (snake_case) to legacy camelCase shape used by the UI.
export function toLegacyAppointment(row) {
  if (!row) return null
  return {
    appointmentId: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date,
    time: row.time,
    type: row.type,
    status: row.status,
    patientName: row.patient_name,
    patientEmail: row.patient_email,
    patientPhone: row.patient_phone,
    notes: row.notes || '',
  }
}

// Maps legacy input + patient uuid to Supabase insert shape.
export function toDbAppointmentInsert(data, patientUuid) {
  return {
    doctor_id: data.doctorId,
    patient_id: patientUuid,
    date: data.date,
    time: data.time,
    type: data.type,
    status: 'scheduled',
    patient_name: data.patientName,
    patient_email: data.patientEmail,
    patient_phone: data.patientPhone,
    notes: isBlank(data.notes) ? '' : data.notes,
  }
}

export function mapSupabaseAppointmentError(err) {
  const msg = err?.message || 'Failed to save appointment'
  if (err?.code === '23505' || /duplicate|unique/i.test(msg)) {
    return 'This doctor already has a scheduled appointment at that date and time.'
  }
  if (/row-level security|RLS|policy/i.test(msg)) {
    return 'You are not allowed to perform this action.'
  }
  return msg
}
