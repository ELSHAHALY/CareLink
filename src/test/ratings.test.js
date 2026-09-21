import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import { calculateRatings } from '../components/doctors/StarRating'
import {
  averageScore,
  filterPublishedRatings,
  isVerifiedRating,
  toUiRating,
} from '../utils/ratings'

function readSource(rel) {
  const here = new URL(import.meta.url)
  const file = new URL(rel, here)
  return fs.readFileSync(file, 'utf8')
}

describe('ratings mapping + aggregation', () => {
  it('maps Supabase snake_case rows to camelCase UI shape', () => {
    const ui = toUiRating({
      id: 'r1',
      doctor_id: 'd1',
      patient_name: 'A',
      score: 5,
      bedside_manner: 4.5,
      communication: 4,
      wait_time: 3.5,
      comment: 'great',
      review_date: '2024-10-15',
      source: 'patient',
      status: 'published',
      is_verified: true,
    })
    expect(ui.doctorId).toBe('d1')
    expect(ui.bedsideManner).toBe(4.5)
    expect(ui.waitTime).toBe(3.5)
    expect(ui.date).toBe('2024-10-15')
    expect(ui.isVerified).toBe(true)
  })

  it('never treats legacy_demo as verified', () => {
    const ui = toUiRating({
      id: 'r2',
      doctor_id: 'd1',
      patient_name: 'B',
      score: 5,
      comment: 'demo',
      review_date: '2024-09-02',
      source: 'legacy_demo',
      status: 'published',
      is_verified: false,
    })
    expect(isVerifiedRating(ui, [])).toBe(false)
  })

  it('filters out pending and hidden reviews', () => {
    const rows = [
      { id: 'a', status: 'published', score: 5 },
      { id: 'b', status: 'pending', score: 5 },
      { id: 'c', status: 'hidden', score: 5 },
    ]
    expect(filterPublishedRatings(rows).map((r) => r.id)).toEqual(['a'])
  })

  it('does not leak patient_id / appointment_id into the UI shape', () => {
    const ui = toUiRating({
      id: 'r3',
      doctor_id: 'd1',
      patient_id: 'secret-patient',
      appointment_id: 'secret-apt',
      patient_name: 'C',
      score: 4,
      review_date: '2024-08-20',
      source: 'patient',
      status: 'published',
      is_verified: true,
    })
    expect(ui).not.toHaveProperty('patient_id')
    expect(ui).not.toHaveProperty('appointment_id')
    expect(ui).not.toHaveProperty('patientId', 'secret-patient')
  })

  it('calculateRatings counts published reviews and splits verified/legacy', () => {
    const ratings = [
      {
        id: 'v1',
        doctorId: 'd1',
        score: 5,
        source: 'patient',
        status: 'published',
        isVerified: true,
        date: '2024-10-15',
      },
      {
        id: 'l1',
        doctorId: 'd1',
        score: 4,
        source: 'legacy_demo',
        status: 'published',
        isVerified: false,
        date: '2024-09-02',
      },
      {
        id: 'p1',
        doctorId: 'd1',
        score: 5,
        source: 'patient',
        status: 'pending',
        isVerified: false,
        date: '2024-08-20',
      },
    ]
    const result = calculateRatings(ratings, [])
    expect(result.count).toBe(2)
    expect(result.average).toBeCloseTo(4.5)
    expect(result.validRatings.map((r) => r.id).sort()).toEqual(['l1', 'v1'])
    expect(result.verifiedRatings.map((r) => r.id)).toEqual(['v1'])
  })

  it('legacy JSON fallback still verifies via completed appointments', () => {
    const ratings = [{ doctorId: 'doc-001', patientId: 'pat-101', score: 5 }]
    const withCompleted = calculateRatings(ratings, [
      { patientId: 'pat-101', status: 'completed' },
    ])
    expect(withCompleted.count).toBe(1)
    const withoutCompleted = calculateRatings(ratings, [
      { patientId: 'pat-101', status: 'scheduled' },
    ])
    // Counted in the average (public view) but not marked verified.
    expect(withoutCompleted.count).toBe(1)
    expect(withoutCompleted.verifiedRatings.length).toBe(0)
  })

  it('averageScore handles empty input', () => {
    expect(averageScore([])).toEqual({ average: 0, count: 0 })
  })
})

describe('015 demo ratings migration guards (mo/gg)', () => {
  it('links demo rows to the real mo/gg UUIDs, published but never verified', () => {
    const migration = readSource(
      '../../supabase/migrations/015_demo_ratings_mo_gg.sql',
    )
    // Real doctor UUIDs (mo x3, gg x2).
    expect(migration).toContain('7f077f3d-6de6-446e-b085-b8d2a6c6742b')
    expect(migration).toContain('627aa7ac-e011-450e-b88a-40a4831aeb8d')
    // Demo rows: published for the domain check, never verified.
    expect(migration).toContain("'legacy_demo', 'published', false")
    // Idempotent re-runs (no duplicates).
    expect(migration).toContain(
      'on conflict (legacy_doctor_id, legacy_patient_id, source) do nothing',
    )
    // Safe on projects without mo/gg (inserts nothing instead of failing).
    expect(migration).toContain('where exists (')
    // Comments must not misattribute other doctors' names to mo/gg.
    expect(migration.toLowerCase()).not.toContain('jenkins')
    expect(migration).not.toContain('Dr. Chen')
    expect(migration).not.toContain('Dr. Kim')
    // Must not touch the doctors catalog or grant browser writes.
    expect(migration).not.toMatch(/insert\s+into\s+public\.doctors/i)
    expect(migration).not.toMatch(/grant\s+(insert|update|delete)/i)
    // Must not publish the old doc-00X seed rows.
    expect(migration).not.toContain("'doc-001'")
  })

  it('UUID doctor ids match the UI string comparison', () => {
    const ui = toUiRating({
      id: 'demo-1',
      doctor_id: '7f077f3d-6de6-446e-b085-b8d2a6c6742b',
      patient_name: 'Omar K.',
      score: 5,
      review_date: '2025-08-12',
      source: 'legacy_demo',
      status: 'published',
      is_verified: false,
    })
    expect(ui.doctorId).toBe('7f077f3d-6de6-446e-b085-b8d2a6c6742b')
    expect(String(ui.doctorId)).toBe(
      String('7f077f3d-6de6-446e-b085-b8d2a6c6742b'),
    )
    expect(isVerifiedRating(ui, [])).toBe(false)
    expect(filterPublishedRatings([ui]).length).toBe(1)
  })
})

describe('remove_demo_ratings script guards', () => {
  it('deletes only legacy_demo ratings and keeps everything else', () => {
    const script = readSource('../../supabase/scripts/remove_demo_ratings.sql')
    expect(script).toContain('delete from public.ratings')
    expect(script).toContain("where source = 'legacy_demo'")
    // Must never delete doctors, profiles, appointments, or real ratings.
    expect(script).not.toMatch(/delete\s+from\s+public\.doctors/i)
    expect(script).not.toMatch(/delete\s+from\s+public\.profiles/i)
    expect(script).not.toMatch(/delete\s+from\s+public\.appointments/i)
    // The only DELETE statement must target legacy_demo rows. (The
    // 'patient' reference elsewhere is a read-only verification SELECT.)
    const deletes = script.match(/delete\s+from[^;]*;/gi) || []
    expect(deletes.length).toBe(1)
    expect(deletes[0]).toMatch(/source\s*=\s*'legacy_demo'/i)
  })
})

describe('014 ratings migration guards', () => {
  it('publishes only via RLS, hides patient/appointment UUIDs, no browser writes', () => {
    const migration = readSource('../../supabase/migrations/014_ratings.sql')
    expect(migration).toContain('ratings_public_read_published')
    expect(migration).toContain("status = 'published'")
    expect(migration).toContain('revoke all on public.ratings')
    expect(migration).toContain('grant select (')
    expect(migration).not.toContain('patient_id, appointment_id')
    // Seeds stay pending + unverified legacy demo rows.
    expect(migration).toContain("'legacy_demo', 'pending', false")
    expect(migration).toContain('ratings_verified_appointment')
    expect(migration).toContain('ratings_one_per_appointment_idx')
    // Must not touch the doctors catalog data.
    expect(migration).not.toMatch(/insert\s+into\s+public\.doctors/i)
  })
})
