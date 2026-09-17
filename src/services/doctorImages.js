import supabase from './supabase'

export const DOCTOR_IMAGE_BUCKET = 'ccc-images'
export const DOCTOR_IMAGE_PREFIX = 'doctors'
export const MAX_DOCTOR_IMAGE_BYTES = 5 * 1024 * 1024

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function validateDoctorImage(file) {
  if (!file) return { ok: false, error: 'Please choose a photo.' }
  const ext = EXT_BY_MIME[file.type]
  if (!ext) {
    return { ok: false, error: 'Photo must be JPG, PNG, or WebP.' }
  }
  if (file.size > MAX_DOCTOR_IMAGE_BYTES) {
    return { ok: false, error: 'Photo must be 5MB or smaller.' }
  }
  if (file.size === 0) {
    return { ok: false, error: 'That file appears to be empty.' }
  }
  return { ok: true, ext }
}

export function buildDoctorImagePath(file) {
  const check = validateDoctorImage(file)
  const ext = check.ok ? check.ext : 'jpg'
  const rand = Math.random().toString(36).slice(2, 8)
  return `${DOCTOR_IMAGE_PREFIX}/${Date.now()}-${rand}.${ext}`
}

/**
 * Uploads a doctor photo to the public catalog bucket.
 * Requires an admin session (see 011_storage_admin_upload.sql).
 * Returns { success, url, path } or { success: false, error }.
 */
export async function uploadDoctorImage(file) {
  const check = validateDoctorImage(file)
  if (!check.ok) return { success: false, error: check.error }
  if (!supabase) {
    return { success: false, error: 'Supabase not configured.' }
  }
  const path = buildDoctorImagePath(file)
  const { error } = await supabase.storage
    .from(DOCTOR_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) {
    if (
      /row-level security|policy|permission|unauthorized/i.test(error.message)
    ) {
      return {
        success: false,
        error:
          'Upload blocked by storage permissions. Run 011_storage_admin_upload.sql, then retry.',
      }
    }
    return { success: false, error: error.message }
  }
  const { data } = supabase.storage.from(DOCTOR_IMAGE_BUCKET).getPublicUrl(path)
  return { success: true, url: data.publicUrl, path }
}
