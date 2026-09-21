import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import { averageCategory, canReviewAppointment } from '../utils/ratings'
import { validateRatingInput } from '../services/ratings'

function readSource(rel) {
  const here = new URL(import.meta.url)
  const file = new URL(rel, here)
  return fs.readFileSync(file, 'utf8')
}

const validInput = {
  appointment_id: '11111111-1111-4111-8111-111111111111',
  score: 5,
  bedside_manner: 4,
  communication: 5,
  wait_time: null,
  comment: 'Great visit, everything was explained clearly.',
}

describe('rating submission validation (client mirror)', () => {
  it('accepts a complete valid review', () => {
    expect(validateRatingInput(validInput)).toBeNull()
  })

  it('accepts a minimal review (score + comment only)', () => {
    expect(
      validateRatingInput({
        appointment_id: 'a',
        score: 3,
        comment: 'ok',
      }),
    ).toBeNull()
  })

  it('rejects missing appointment_id', () => {
    expect(
      validateRatingInput({ ...validInput, appointment_id: '' }),
    ).toContain('Appointment')
  })

  it('rejects missing or out-of-range score', () => {
    expect(validateRatingInput({ ...validInput, score: 0 })).toContain('1 to 5')
    expect(validateRatingInput({ ...validInput, score: 6 })).toContain('1 to 5')
    expect(validateRatingInput({ ...validInput, score: 4.5 })).toContain(
      '1 to 5',
    )
    expect(validateRatingInput({ ...validInput, score: undefined })).toContain(
      '1 to 5',
    )
  })

  it('rejects out-of-range category scores', () => {
    expect(validateRatingInput({ ...validInput, bedside_manner: 0 })).toContain(
      '1 to 5',
    )
    expect(validateRatingInput({ ...validInput, wait_time: 6 })).toContain(
      '1 to 5',
    )
  })

  it('rejects empty or oversized comments', () => {
    expect(validateRatingInput({ ...validInput, comment: '   ' })).toContain(
      'write a short review',
    )
    expect(
      validateRatingInput({ ...validInput, comment: 'x'.repeat(2001) }),
    ).toContain('2000')
  })
})

describe('review button gating', () => {
  const completed = { appointmentId: 'apt-1', status: 'completed' }

  it('shows Leave a Review for completed, unreviewed appointments', () => {
    expect(canReviewAppointment(completed, new Set())).toBe(true)
    expect(canReviewAppointment(completed, ['other'])).toBe(true)
  })

  it('hides the button for scheduled and cancelled appointments', () => {
    expect(
      canReviewAppointment({ ...completed, status: 'scheduled' }, new Set()),
    ).toBe(false)
    expect(
      canReviewAppointment({ ...completed, status: 'cancelled' }, new Set()),
    ).toBe(false)
  })

  it('hides the button once reviewed', () => {
    expect(canReviewAppointment(completed, new Set(['apt-1']))).toBe(false)
    expect(canReviewAppointment(completed, ['apt-1'])).toBe(false)
  })

  it('hides the button without an appointment id', () => {
    expect(canReviewAppointment({ status: 'completed' }, new Set())).toBe(false)
    expect(canReviewAppointment(null, new Set())).toBe(false)
  })
})

describe('category averages without score fallback', () => {
  it('averages rated values only', () => {
    const ratings = [
      { bedsideManner: 5, communication: 4, waitTime: null, score: 5 },
      { bedsideManner: 3, communication: null, waitTime: 2, score: 4 },
    ]
    expect(averageCategory(ratings, 'bedsideManner')).toBeCloseTo(4)
    expect(averageCategory(ratings, 'communication')).toBe(4)
    expect(averageCategory(ratings, 'waitTime')).toBe(2)
  })

  it('returns null when nothing was rated (renders as dash)', () => {
    expect(averageCategory([{ score: 5 }], 'bedsideManner')).toBeNull()
    expect(averageCategory([], 'communication')).toBeNull()
  })
})

describe('016 production hardening migration guards', () => {
  it('adds moderation fields, patient trigger, and no destructive changes', () => {
    const migration = readSource(
      '../../supabase/migrations/016_ratings_production_hardening.sql',
    )
    expect(migration).toContain('moderated_by')
    expect(migration).toContain('moderated_at')
    expect(migration).toContain('moderation_note')
    expect(migration).toContain('validate_patient_rating')
    expect(migration).toContain('ratings_validate_patient')
    expect(migration).toContain("'completed'")
    expect(migration).toContain('appointment_id cannot be changed')
    expect(migration).toContain('patient_id cannot be changed')
    expect(migration).toContain('doctor_id cannot be changed')
    expect(migration).toContain('Published ratings require doctor_id')
    // Legacy/demo rows must stay manageable (cleanup + mapping fixes).
    expect(migration).toContain("new.source = 'legacy_demo'")
    // Never destructive: no data deletes, no grants, no RLS rewrites.
    expect(migration).not.toMatch(/delete\s+from/i)
    expect(migration).not.toMatch(/grant\s+(insert|update|delete)/i)
    expect(migration).not.toMatch(/drop\s+table/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.doctors/i)
  })
})

describe('ratings Edge Function guards', () => {
  it('submit-rating enforces ownership, completion, and pending start', () => {
    const fn = readSource('../../supabase/functions/submit-rating/index.ts')
    expect(fn).toContain("appointment.status !== 'completed'")
    expect(fn).toContain('appointment.patient_id !== caller.id')
    expect(fn).toContain('409')
    expect(fn).toContain("status: 'pending'")
    expect(fn).toContain('is_verified: true')
    expect(fn).toContain("source: 'patient'")
    // Identity comes from JWT/profile, never from the request body.
    expect(fn).toContain('profile?.name')
    expect(fn).not.toContain('payload.patient_id')
    expect(fn).not.toContain('payload.doctor_id')
    expect(fn).not.toContain('payload.is_verified')
    expect(fn).not.toContain('payload.status')
  })

  it('my-ratings returns only the caller own rows', () => {
    const fn = readSource('../../supabase/functions/my-ratings/index.ts')
    expect(fn).toContain(".eq('patient_id', caller.id)")
    expect(fn).toContain('appointment_id')
  })

  it('admin-ratings requires admin and only changes status', () => {
    const fn = readSource('../../supabase/functions/admin-ratings/index.ts')
    expect(fn).toContain("role !== 'admin'")
    expect(fn).toContain('403')
    expect(fn).toContain('moderated_by')
    expect(fn).toContain('moderated_at')
    expect(fn).not.toContain('payload.doctor_id')
    expect(fn).not.toContain('payload.is_verified')
  })
})

describe('ratings client safety', () => {
  it('never bundles service_role material in src', () => {
    const service = readSource('../services/ratings.js')
    const form = readSource('../components/ratings/RatingForm.jsx')
    for (const src of [service, form]) {
      expect(src.toLowerCase()).not.toContain('service_role')
      expect(src).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
      expect(src).not.toContain('SUPABASE_SECRET_KEY')
    }
  })

  it('never writes the ratings table directly from the browser', () => {
    const service = readSource('../services/ratings.js')
    expect(service).toContain("functions.invoke(\n      'submit-rating'")
    expect(service).not.toMatch(
      /from\(['"]ratings['"]\)\s*\.\s*(insert|update|delete)/,
    )
  })
})
