import { describe, it, expect } from 'vitest'
import {
  mapCatalogDoctor,
  toUiDoctor,
  resolveDoctorImage,
  doctorDisplayName,
  doctorDisplaySpecialty,
  doctorOptionLabel,
} from '../utils/doctors'
import { filterDoctors } from '../hooks/useDoctors'

const REAL_ROW = {
  id: '673f67bc-f5bb-4b39-9078-0e4542a32b87',
  slug: 'Hesham',
  name_ar: 'أستاذ علاج الأورام',
  name_en: 'Prof. Example',
  specialty_ar: 'علاج الأورام',
  specialty_en: 'Oncology',
  bio_ar: 'سيرة',
  bio_en: 'Biography.',
  image: 'https://example.supabase.co/storage/v1/object/public/x.jpg',
  services: ['demo-oncology-clinic'],
  status: 'published',
  sort_order: 1,
  verified: true,
}

describe('Catalog mapping (real cloud schema)', () => {
  it('maps a uuid catalog row to a crash-safe UI shape', () => {
    const d = mapCatalogDoctor(REAL_ROW)
    expect(d.id).toBe(REAL_ROW.id)
    expect(d.name).toBe('Prof. Example')
    expect(d.specialty).toBe('Oncology')
    expect(d.bio).toBe('Biography.')
    expect(d.image).toBe(REAL_ROW.image)
    // Fields components read directly must always exist:
    expect(d.location).toEqual({ address: '', city: '', state: '', zip: '' })
    expect(d.languages).toEqual([])
    expect(d.specializations).toEqual([])
    expect(d.education).toEqual([])
    expect(d.yearsOfExperience).toBe(0)
    expect(d.email).toBe('')
  })

  it('falls back to Arabic columns when English is missing', () => {
    const d = mapCatalogDoctor({ ...REAL_ROW, name_en: null, specialty_en: '' })
    expect(d.name).toBe('أستاذ علاج الأورام')
    expect(d.specialty).toBe('علاج الأورام')
    expect(doctorDisplayName({ name_ar: 'س' })).toBe('س')
    expect(doctorDisplaySpecialty({})).toBe('')
  })

  it('returns null for null input (no phantom doctors)', () => {
    expect(mapCatalogDoctor(null)).toBeNull()
    expect(toUiDoctor(null)).toBeNull()
  })

  it('passes legacy/static rows through with defaults filled', () => {
    const d = toUiDoctor({ id: 'doc-001', name: 'Dr. A' })
    expect(d.id).toBe('doc-001')
    expect(d.specialty).toBe('')
    expect(d.location.city).toBe('')
    expect(d.languages).toEqual([])
  })

  it('resolves absolute and relative images correctly', () => {
    expect(resolveDoctorImage('https://x/y.jpg')).toBe('https://x/y.jpg')
    expect(resolveDoctorImage('a.png')).toBe('/a.png')
    expect(resolveDoctorImage('/a.png')).toBe('/a.png')
    expect(resolveDoctorImage(null)).toBeNull()
  })

  it('builds admin dropdown labels without crashing', () => {
    expect(doctorOptionLabel(mapCatalogDoctor(REAL_ROW))).toBe(
      'Prof. Example — Oncology',
    )
    expect(doctorOptionLabel(null)).toBe('')
  })

  it('filter helper searches mapped catalog doctors', () => {
    const doctors = [
      mapCatalogDoctor(REAL_ROW),
      mapCatalogDoctor({
        ...REAL_ROW,
        id: 'other',
        name_en: 'Sara',
        specialty_en: 'Derma',
      }),
    ]
    expect(filterDoctors(doctors, { search: 'sara' }).map((d) => d.id)).toEqual(
      ['other'],
    )
    expect(filterDoctors(doctors, { search: 'onco' }).map((d) => d.id)).toEqual(
      [REAL_ROW.id],
    )
    expect(filterDoctors(doctors, { search: '' }).length).toBe(2)
  })
})
