import { describe, it, expect } from 'vitest'

describe('Appointment validation', () => {
  const REQUIRED_FIELDS = [
    'doctorId',
    'patientId',
    'date',
    'time',
    'type',
    'patientName',
    'patientEmail',
    'patientPhone',
  ]

  const VALID_STATUSES = ['scheduled', 'completed', 'cancelled']

  function isBlank(value) {
    if (typeof value !== 'string') return true
    return value.trim() === ''
  }

  function findMissingFields(data, fields) {
    return fields.filter((field) => isBlank(data?.[field]))
  }

  function generateAppointmentId() {
    const random = Math.random().toString(36).slice(2, 8)
    return `apt-${Date.now()}-${random}`
  }

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
    expect(findMissingFields(data, REQUIRED_FIELDS)).toEqual([])
  })

  it('finds missing fields', () => {
    const data = {
      doctorId: 'doc-001',
      patientId: 'patient@test.com',
    }
    const missing = findMissingFields(data, REQUIRED_FIELDS)
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
    const missing = findMissingFields(data, REQUIRED_FIELDS)
    expect(missing).toContain('date')
    expect(missing).toContain('time')
  })

  it('validates appointment statuses', () => {
    expect(VALID_STATUSES).toContain('scheduled')
    expect(VALID_STATUSES).toContain('completed')
    expect(VALID_STATUSES).toContain('cancelled')
    expect(VALID_STATUSES).not.toContain('pending')
    expect(VALID_STATUSES).not.toContain('deleted')
  })

  it('generates unique appointment IDs', () => {
    const id1 = generateAppointmentId()
    const id2 = generateAppointmentId()
    expect(id1).toMatch(/^apt-\d+-[a-z0-9]+$/)
    expect(id2).toMatch(/^apt-\d+-[a-z0-9]+$/)
    expect(id1).not.toBe(id2)
  })
})

describe('Slot conflict detection', () => {
  function isSlotTaken(appointments, { doctorId, date, time }, excludeId = null) {
    return appointments.some(
      (a) =>
        a.appointmentId !== excludeId &&
        a.doctorId === doctorId &&
        a.date === date &&
        a.time === time &&
        a.status === 'scheduled',
    )
  }

  const existingAppointments = [
    { appointmentId: 'apt-1', doctorId: 'doc-001', date: '2026-01-15', time: '10:00', status: 'scheduled' },
    { appointmentId: 'apt-2', doctorId: 'doc-001', date: '2026-01-15', time: '11:00', status: 'cancelled' },
  ]

  it('detects slot conflict', () => {
    expect(isSlotTaken(existingAppointments, { doctorId: 'doc-001', date: '2026-01-15', time: '10:00' })).toBe(true)
  })

  it('allows slot that only has cancelled appointment', () => {
    expect(isSlotTaken(existingAppointments, { doctorId: 'doc-001', date: '2026-01-15', time: '11:00' })).toBe(false)
  })

  it('allows slot for different doctor', () => {
    expect(isSlotTaken(existingAppointments, { doctorId: 'doc-002', date: '2026-01-15', time: '10:00' })).toBe(false)
  })

  it('allows different time slot', () => {
    expect(isSlotTaken(existingAppointments, { doctorId: 'doc-001', date: '2026-01-15', time: '14:00' })).toBe(false)
  })

  it('allows excluding the appointment being edited', () => {
    expect(isSlotTaken(existingAppointments, { doctorId: 'doc-001', date: '2026-01-15', time: '10:00' }, 'apt-1')).toBe(false)
  })
})
