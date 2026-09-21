// Shared mapping + aggregation for patient ratings.
//
// Sources:
//   - Supabase `public.ratings` (snake_case, only public columns):
//     id, doctor_id, patient_name, score, bedside_manner, communication,
//     wait_time, comment, review_date, source, status, is_verified
//   - Legacy static fallback `src/data/ratings.json` (camelCase):
//     doctorId, patientId, patientName, score, bedsideManner,
//     communication, waitTime, comment, date
//
// UI shape (camelCase, null-safe):
//   { id, doctorId, patientName, score, bedsideManner, communication,
//     waitTime, comment, date, source, status, isVerified }

export const PUBLIC_RATING_COLUMNS =
  'id,doctor_id,patient_name,score,bedside_manner,communication,wait_time,comment,review_date,source,status,is_verified'

export function toUiRating(row) {
  if (!row) return null
  const source = row.source || row.legacySource || 'patient'
  const status = row.status || 'published'
  // Legacy JSON has no verification metadata — verification is derived
  // by the caller via appointments when available.
  const hasExplicitVerification =
    typeof row.is_verified === 'boolean' || typeof row.isVerified === 'boolean'
  return {
    id:
      row.id ||
      `${row.doctor_id || row.doctorId}-${
        row.patient_name || row.patientName
      }-${row.review_date || row.date}`,
    doctorId:
      row.doctor_id !== undefined && row.doctor_id !== null
        ? String(row.doctor_id)
        : row.doctorId
        ? String(row.doctorId)
        : null,
    patientId: row.patientId ? String(row.patientId) : null,
    patientName: row.patient_name || row.patientName || 'Patient',
    score: typeof row.score === 'number' ? row.score : 0,
    bedsideManner:
      typeof row.bedside_manner === 'number'
        ? row.bedside_manner
        : typeof row.bedsideManner === 'number'
        ? row.bedsideManner
        : null,
    communication:
      typeof row.communication === 'number' ? row.communication : null,
    waitTime:
      typeof row.wait_time === 'number'
        ? row.wait_time
        : typeof row.waitTime === 'number'
        ? row.waitTime
        : null,
    comment: row.comment || '',
    date: row.review_date || row.date || null,
    source,
    status,
    isVerified: hasExplicitVerification
      ? Boolean(row.is_verified ?? row.isVerified)
      : source === 'legacy_demo'
      ? false
      : null, // null = unknown, resolve via appointments
  }
}

export function isPublishedRating(rating) {
  if (!rating) return false
  // Legacy JSON rows carry no status — treat as published fallback data.
  if (!rating.status) return true
  return rating.status === 'published'
}

/**
 * A rating counts as verified only when:
 *  - the DB explicitly marks is_verified=true (server-side, appointment-linked), or
 *  - legacy fallback data matches a completed appointment for the same patient.
 * Legacy demo rows (source='legacy_demo', isVerified=false) are NEVER verified.
 */
export function isVerifiedRating(rating, appointments = []) {
  if (!rating) return false
  if (rating.isVerified === true) return true
  if (rating.isVerified === false) return false
  if (rating.source === 'legacy_demo') return false
  if (!rating.patientId || !Array.isArray(appointments)) return false
  return appointments.some(
    (apt) =>
      apt &&
      apt.status === 'completed' &&
      String(apt.patientId) === String(rating.patientId),
  )
}

export function filterPublishedRatings(ratings = []) {
  return (ratings || []).filter(isPublishedRating)
}

export function averageScore(ratings = []) {
  const valid = (ratings || []).filter(
    (r) => typeof r?.score === 'number' && r.score >= 1 && r.score <= 5,
  )
  if (valid.length === 0) return { average: 0, count: 0 }
  const sum = valid.reduce((acc, r) => acc + r.score, 0)
  return { average: sum / valid.length, count: valid.length }
}

/**
 * Averages one category from rated values only. Missing values stay out;
 * returns null when nothing was rated (rendered as '—', never faked
 * from the overall score).
 */
export function averageCategory(ratings = [], key) {
  const values = (ratings || [])
    .map((r) => r?.[key])
    .filter((v) => typeof v === 'number')
  if (values.length === 0) return null
  return values.reduce((acc, v) => acc + v, 0) / values.length
}

/**
 * Whether the review button may be shown: completed appointments that the
 * caller has not reviewed yet. Anything else (scheduled/cancelled/reviewed)
 * must not offer submission.
 */
export function canReviewAppointment(appointment, reviewedIds) {
  if (!appointment || appointment.status !== 'completed') return false
  if (!appointment.appointmentId) return false
  if (reviewedIds instanceof Set) {
    return !reviewedIds.has(String(appointment.appointmentId))
  }
  if (Array.isArray(reviewedIds)) {
    return !reviewedIds.map(String).includes(String(appointment.appointmentId))
  }
  return true
}
