import supabase, { isSupabaseConfigured } from './supabase'

export const MAX_COMMENT_LENGTH = 2000

/**
 * Client-side validation mirroring the submit-rating Edge Function.
 * Returns an error message string, or null when the input is valid.
 * Server-side validation is authoritative; this only improves UX.
 */
export function validateRatingInput(input) {
  if (!input || typeof input !== 'object') return 'Invalid review data.'
  if (!input.appointment_id || typeof input.appointment_id !== 'string') {
    return 'Appointment is required.'
  }
  if (
    typeof input.score !== 'number' ||
    !Number.isInteger(input.score) ||
    input.score < 1 ||
    input.score > 5
  ) {
    return 'Please select a star rating from 1 to 5.'
  }
  for (const field of ['bedside_manner', 'communication', 'wait_time']) {
    const value = input[field]
    if (
      value !== undefined &&
      value !== null &&
      (!Number.isInteger(value) || value < 1 || value > 5)
    ) {
      return 'Category ratings must be from 1 to 5.'
    }
  }
  const comment = typeof input.comment === 'string' ? input.comment.trim() : ''
  if (!comment) return 'Please write a short review.'
  if (comment.length > MAX_COMMENT_LENGTH) {
    return `Review must be at most ${MAX_COMMENT_LENGTH} characters.`
  }
  return null
}

function mapFunctionError(fnError, data, fallback) {
  const serverMessage =
    (typeof data?.error === 'string' && data.error) ||
    (typeof fnError?.message === 'string' && fnError.message) ||
    ''
  const lower = serverMessage.toLowerCase()
  if (
    lower.includes('already submitted') ||
    lower.includes('duplicate') ||
    lower.includes('unique')
  ) {
    return 'You have already submitted a review for this appointment.'
  }
  if (lower.includes('completed')) {
    return 'Only completed appointments can be rated.'
  }
  if (lower.includes('not yours') || lower.includes('forbidden')) {
    return 'You can only review your own appointments.'
  }
  if (lower.includes('not found')) {
    return 'Appointment not found.'
  }
  if (lower.includes('unauthorized') || lower.includes('session')) {
    return 'Please log in to submit a review.'
  }
  return serverMessage || fallback
}

/**
 * Submits a patient review via the submit-rating Edge Function.
 * Only sends the allowed fields; identity/status are derived server-side.
 */
export async function submitRating(input) {
  const validationError = validateRatingInput(input)
  if (validationError) return { success: false, error: validationError }
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured.' }
  }
  try {
    const body = {
      appointment_id: input.appointment_id,
      score: input.score,
      bedside_manner: input.bedside_manner ?? null,
      communication: input.communication ?? null,
      wait_time: input.wait_time ?? null,
      comment: input.comment.trim(),
    }
    const { data, error: fnError } = await supabase.functions.invoke(
      'submit-rating',
      { body },
    )
    if (fnError || data?.error) {
      return {
        success: false,
        error: mapFunctionError(fnError, data, 'Failed to submit review.'),
      }
    }
    return { success: true, ratingId: data?.rating_id, status: data?.status }
  } catch (err) {
    return {
      success: false,
      error: mapFunctionError(err, null, 'Failed to submit review.'),
    }
  }
}

/**
 * Loads the caller's own ratings (appointment linkage only) via my-ratings.
 * Returns { success, appointmentIds: string[] }.
 */
export async function fetchMyReviewedAppointments() {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, appointmentIds: [] }
  }
  try {
    const { data, error: fnError } = await supabase.functions.invoke(
      'my-ratings',
      { body: {} },
    )
    if (fnError || data?.error) return { success: false, appointmentIds: [] }
    const ids = (data?.ratings || [])
      .map((r) => r?.appointment_id)
      .filter(Boolean)
      .map(String)
    return { success: true, appointmentIds: ids }
  } catch {
    return { success: false, appointmentIds: [] }
  }
}

/**
 * Admin: lists ratings by status via the admin-ratings Edge Function.
 */
export async function fetchAdminRatings(status = 'pending') {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured.', ratings: [] }
  }
  try {
    const { data, error: fnError } = await supabase.functions.invoke(
      'admin-ratings',
      { body: { status } },
    )
    if (fnError || data?.error) {
      return {
        success: false,
        error: mapFunctionError(fnError, data, 'Failed to load ratings.'),
        ratings: [],
      }
    }
    return { success: true, ratings: data?.ratings || [] }
  } catch (err) {
    return {
      success: false,
      error: mapFunctionError(err, null, 'Failed to load ratings.'),
      ratings: [],
    }
  }
}

/**
 * Admin: publishes or hides a rating via the admin-ratings Edge Function.
 */
export async function moderateRating(id, action, note = '') {
  if (!id || (action !== 'publish' && action !== 'hide')) {
    return { success: false, error: 'Invalid moderation request.' }
  }
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured.' }
  }
  try {
    const { data, error: fnError } = await supabase.functions.invoke(
      'admin-ratings',
      { body: { id, action, note } },
    )
    if (fnError || data?.error) {
      return {
        success: false,
        error: mapFunctionError(fnError, data, 'Failed to update rating.'),
      }
    }
    return { success: true, rating: data?.rating }
  } catch (err) {
    return {
      success: false,
      error: mapFunctionError(err, null, 'Failed to update rating.'),
    }
  }
}
