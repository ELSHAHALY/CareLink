import { describe, it, expect } from 'vitest'
import {
  findMissingFields,
  isSlotTaken,
  isBlank,
  isValidStatus,
  toLegacyAppointment,
  mapSupabaseAppointmentError,
  REQUIRED_APPOINTMENT_FIELDS,
} from '../utils/appointments'

describe('Appointment validation (real implementation)', () => {
  it('finds no missing fields for complete data', () => {
    const data = {
      doctorId: 'doc-001',
      patientId: 'patient@test.com',
      date: '2026-01-15',
      time: '10:00',
      type: 'Consultation',
      patientName: 'John Doe',
      patientEmail: 'patient@test.com',
      patientPhone: '555-0100',
    }
    expect(findMissingFields(data, REQUIRED_APPOINTMENT_FIELDS)).toEqual([])
  })

  it('finds missing fields', () => {
    const data = { doctorId: 'doc-001', patientId: 'patient@test.com' }
    const missing = findMissingFields(data, REQUIRED_APPOINTMENT_FIELDS)
    expect(missing).toContain('date')
    expect(missing).toContain('time')
    expect(missing).toContain('type')
    expect(missing).toContain('patientName')
  })

  it('rejects blank string fields', () => {
    const data = {
      doctorId: 'doc-001',
      patientId: 'patient@test.com',
      date: '  ',
      time: '',
      type: 'Consultation',
      patientName: 'John Doe',
      patientEmail: 'patient@test.com',
      patientPhone: '555-0100',
    }
    const missing = findMissingFields(data, REQUIRED_APPOINTMENT_FIELDS)
    expect(missing).toContain('date')
    expect(missing).toContain('time')
  })

  it('treats non-string required values as blank', () => {
    expect(isBlank(undefined)).toBe(true)
    expect(isBlank(null)).toBe(true)
    expect(isBlank(123)).toBe(true)
  })

  it('validates appointment statuses', () => {
    expect(isValidStatus('scheduled')).toBe(true)
    expect(isValidStatus('completed')).toBe(true)
    expect(isValidStatus('cancelled')).toBe(true)
    expect(isValidStatus('pending')).toBe(false)
    expect(isValidStatus('deleted')).toBe(false)
  })

  it('maps Supabase rows to legacy shape without leaking extra fields', () => {
    const legacy = toLegacyAppointment({
      id: 'uuid-1',
      doctor_id: 'doc-001',
      patient_id: 'patient-uuid',
      date: '2026-01-15',
      time: '10:00',
      type: 'Consultation',
      status: 'scheduled',
      patient_name: 'John',
      patient_email: 'p@test.com',
      patient_phone: '123',
      notes: 'n',
    })
    expect(legacy).toMatchObject({
      appointmentId: 'uuid-1',
      doctorId: 'doc-001',
      patientId: 'patient-uuid',
    })
    expect(legacy).not.toHaveProperty('doctor_id')
  })

  it('maps unique violations to double-booking message', () => {
    expect(
      mapSupabaseAppointmentError({ code: '23505', message: 'duplicate key' }),
    ).toMatch(/already has a scheduled appointment/i)
  })
})

describe('Slot conflict detection (real implementation)', () => {
  const existingAppointments = [
    {
      appointmentId: 'apt-1',
      doctorId: 'doc-001',
      date: '2026-01-15',
      time: '10:00',
      status: 'scheduled',
    },
    {
      appointmentId: 'apt-2',
      doctorId: 'doc-001',
      date: '2026-01-15',
      time: '11:00',
      status: 'cancelled',
    },
  ]

  it('detects slot conflict', () => {
    expect(
      isSlotTaken(existingAppointments, {
        doctorId: 'doc-001',
        date: '2026-01-15',
        time: '10:00',
      }),
    ).toBe(true)
  })

  it('allows slot that only has cancelled appointment', () => {
    expect(
      isSlotTaken(existingAppointments, {
        doctorId: 'doc-001',
        date: '2026-01-15',
        time: '11:00',
      }),
    ).toBe(false)
  })

  it('allows slot for different doctor (isolation)', () => {
    expect(
      isSlotTaken(existingAppointments, {
        doctorId: 'doc-002',
        date: '2026-01-15',
        time: '10:00',
      }),
    ).toBe(false)
  })

  it('allows excluding the appointment being edited', () => {
    expect(
      isSlotTaken(
        existingAppointments,
        { doctorId: 'doc-001', date: '2026-01-15', time: '10:00' },
        'apt-1',
      ),
    ).toBe(false)
  })
})
