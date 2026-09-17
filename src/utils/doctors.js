// Shared mapping between the Supabase doctors catalog and the shape the UI
// expects. The cloud catalog uses uuid ids and bilingual columns
// (name_en/name_ar, specialty_en/specialty_ar, bio_en/bio_ar, image URL),
// while the legacy static data uses text ids (doc-xxx) with flat fields.
// Every mapper below returns a null-safe UI shape so components never crash
// on missing columns.

export const EMPTY_LOCATION = Object.freeze({
  address: '',
  city: '',
  state: '',
  zip: '',
})

export function resolveDoctorImage(image) {
  if (!image) return null
  if (/^https?:\/\//i.test(image)) return image
  return image.startsWith('/') ? image : `/${image}`
}

export function doctorDisplayName(row) {
  if (!row) return 'Doctor'
  return row.name_en || row.name_ar || row.name || 'Doctor'
}

export function doctorDisplaySpecialty(row) {
  if (!row) return ''
  return row.specialty_en || row.specialty_ar || row.specialty || ''
}

/**
 * Maps one Supabase catalog row (uuid schema) to the UI doctor shape.
 * Never throws; fills every field components read directly.
 */
export function mapCatalogDoctor(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug || null,
    name: doctorDisplayName(row),
    name_en: row.name_en || null,
    name_ar: row.name_ar || null,
    specialty: doctorDisplaySpecialty(row),
    specialty_en: row.specialty_en || null,
    specialty_ar: row.specialty_ar || null,
    bio: row.bio_en || row.bio_ar || '',
    bio_en: row.bio_en || null,
    bio_ar: row.bio_ar || null,
    image: row.image || null,
    email: row.email || '',
    phone: row.phone || '',
    services: Array.isArray(row.services) ? row.services : [],
    specializations: Array.isArray(row.specializations)
      ? row.specializations
      : [],
    education: Array.isArray(row.education) ? row.education : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    location:
      row.location && typeof row.location === 'object'
        ? {
            address: row.location.address || '',
            city: row.location.city || '',
            state: row.location.state || '',
            zip: row.location.zip || '',
          }
        : { ...EMPTY_LOCATION },
    rating: typeof row.rating === 'number' ? row.rating : 0,
    yearsOfExperience:
      typeof row.yearsOfExperience === 'number'
        ? row.yearsOfExperience
        : typeof row.years_of_experience === 'number'
        ? row.years_of_experience
        : 0,
    available: row.available !== false,
    verified: row.verified !== false,
    status: row.status || 'published',
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    // Keeps the raw row for admin/debug display without extra queries.
    _source: 'catalog',
  }
}

/**
 * Normalizes any doctor-like object (catalog row, legacy row, static json)
 * into the same null-safe UI shape. Static/legacy rows already match the
 * UI shape, so they pass through with defaults filled.
 */
export function toUiDoctor(input) {
  if (!input) return null
  if (input._source === 'catalog' && input.location) return input
  // Catalog rows carry bilingual columns — detect and map them.
  if (input.name_en || input.name_ar || input.specialty_en) {
    return mapCatalogDoctor(input)
  }
  return {
    ...input,
    name: input.name || 'Doctor',
    specialty: input.specialty || '',
    bio: input.bio || '',
    image: input.image || null,
    email: input.email || '',
    phone: input.phone || '',
    specializations: Array.isArray(input.specializations)
      ? input.specializations
      : [],
    education: Array.isArray(input.education) ? input.education : [],
    languages: Array.isArray(input.languages) ? input.languages : [],
    location:
      input.location && typeof input.location === 'object'
        ? {
            address: input.location.address || '',
            city: input.location.city || '',
            state: input.location.state || '',
            zip: input.location.zip || '',
          }
        : { ...EMPTY_LOCATION },
    rating: typeof input.rating === 'number' ? input.rating : 0,
    yearsOfExperience:
      typeof input.yearsOfExperience === 'number' ? input.yearsOfExperience : 0,
    available: input.available !== false,
  }
}

/** Display label for admin dropdowns: name — specialty (slug/id fallback). */
export function doctorOptionLabel(doctor) {
  if (!doctor) return ''
  const name = doctor.name || doctorDisplayName(doctor)
  const spec = doctor.specialty || doctorDisplaySpecialty(doctor)
  return spec ? `${name} — ${spec}` : name
}

/**
 * URL-safe slug base from a display name. Arabic-only names have no latin
 * characters, so fall back to 'doctor' (uniqueness comes from the suffix).
 */
export function slugifyName(name) {
  const base = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'doctor'
}

/** Unique-by-construction slug: base + short random suffix. */
export function buildDoctorSlug(name) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${slugifyName(name)}-${rand}`
}

export function parseServicesInput(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Builds the catalog INSERT payload for an admin-created doctor.
 * Admin-created entries are pre-approved (published), unlike public
 * submissions which stay draft with needs_approval=true.
 */
export function buildDoctorProfileInsert(fields, imageUrl) {
  return {
    slug: fields.slug,
    name_en: fields.name_en.trim(),
    name_ar: (fields.name_ar || '').trim(),
    specialty_en: fields.specialty_en.trim(),
    specialty_ar: (fields.specialty_ar || '').trim(),
    bio_en: (fields.bio_en || '').trim(),
    bio_ar: (fields.bio_ar || '').trim(),
    image: imageUrl || null,
    services: Array.isArray(fields.services) ? fields.services : [],
    status: 'published',
    verified: false,
    is_demo: false,
    needs_approval: false,
  }
}

/** Minimal client-side check for the required profile fields. */
export function validateDoctorProfile(fields) {
  if (!fields.name_en || fields.name_en.trim().length < 2) {
    return 'Doctor name (English) must be at least 2 characters'
  }
  if (!fields.specialty_en || fields.specialty_en.trim().length < 2) {
    return 'Specialty (English) must be at least 2 characters'
  }
  if (!fields.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) {
    return 'Profile URL slug is invalid'
  }
  return null
}
