import { describe, it, expect } from 'vitest'
import {
  buildDoctorProfileInsert,
  buildDoctorSlug,
  parseServicesInput,
  slugifyName,
  validateDoctorProfile,
} from '../utils/doctors'
import {
  buildDoctorImagePath,
  validateDoctorImage,
  DOCTOR_IMAGE_BUCKET,
  MAX_DOCTOR_IMAGE_BYTES,
} from '../services/doctorImages'

function fakeFile({ type = 'image/jpeg', size = 1024 } = {}) {
  return { type, size, name: 'photo.jpg' }
}

describe('Doctor photo validation', () => {
  it('accepts JPG/PNG/WebP within size limit', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateDoctorImage(fakeFile({ type })).ok).toBe(true)
    }
  })

  it('rejects non-image types', () => {
    expect(
      validateDoctorImage(fakeFile({ type: 'application/pdf' })),
    ).toMatchObject({
      ok: false,
    })
    expect(validateDoctorImage(fakeFile({ type: 'image/gif' })).ok).toBe(false)
  })

  it('rejects oversized and empty files', () => {
    expect(
      validateDoctorImage(fakeFile({ size: MAX_DOCTOR_IMAGE_BYTES + 1 })).ok,
    ).toBe(false)
    expect(validateDoctorImage(fakeFile({ size: 0 })).ok).toBe(false)
    expect(validateDoctorImage(null).ok).toBe(false)
  })

  it('builds bucket paths under doctors/ with matching extension', () => {
    const path = buildDoctorImagePath(fakeFile({ type: 'image/png' }))
    expect(path.startsWith('doctors/')).toBe(true)
    expect(path.endsWith('.png')).toBe(true)
    expect(DOCTOR_IMAGE_BUCKET).toBe('ccc-images')
  })
})

describe('Doctor slug helpers', () => {
  it('slugifies latin names', () => {
    expect(slugifyName('Dr. Sarah Chen')).toBe('dr-sarah-chen')
    expect(slugifyName('  A  B__C  ')).toBe('a-b-c')
  })

  it('falls back for Arabic-only names', () => {
    expect(slugifyName('أستاذ علاج الأورام')).toBe('doctor')
    expect(slugifyName('')).toBe('doctor')
  })

  it('builds unique-by-construction slugs', () => {
    const a = buildDoctorSlug('Sarah Chen')
    const b = buildDoctorSlug('Sarah Chen')
    expect(a).toMatch(/^sarah-chen-[a-z0-9]+$/)
    expect(a).not.toBe(b)
  })
})

describe('Doctor profile payload', () => {
  it('parses services input', () => {
    expect(parseServicesInput('a, b ,,c')).toEqual(['a', 'b', 'c'])
    expect(parseServicesInput('')).toEqual([])
  })

  it('builds a pre-approved published payload', () => {
    const payload = buildDoctorProfileInsert(
      {
        slug: 'sarah-chen-x1',
        name_en: ' Dr. Sarah ',
        name_ar: '',
        specialty_en: 'Derma',
        specialty_ar: '',
        bio_en: '',
        bio_ar: '',
        services: ['clinic'],
      },
      'https://x/y.jpg',
    )
    expect(payload).toMatchObject({
      slug: 'sarah-chen-x1',
      name_en: 'Dr. Sarah',
      specialty_en: 'Derma',
      image: 'https://x/y.jpg',
      status: 'published',
      verified: false,
      is_demo: false,
      needs_approval: false,
      services: ['clinic'],
    })
  })

  it('validates required profile fields', () => {
    expect(
      validateDoctorProfile({
        name_en: 'AB',
        specialty_en: 'CD',
        slug: 'ab-cd',
      }),
    ).toBeNull()
    expect(
      validateDoctorProfile({ name_en: 'x', specialty_en: 'B', slug: 'a' }),
    ).toMatch(/name/i)
    expect(
      validateDoctorProfile({ name_en: 'AB', specialty_en: '', slug: 'a' }),
    ).toMatch(/specialty/i)
    expect(
      validateDoctorProfile({
        name_en: 'AB',
        specialty_en: 'CD',
        slug: 'BAD SLUG!',
      }),
    ).toMatch(/slug/i)
  })
})
