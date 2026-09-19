import { useState } from 'react'
import styles from './AppointmentForm.module.css'

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Treatment', 'Check-up']

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_CHAR_PATTERN = /^[0-9+\-() ]+$/
const NOTES_MAX_LENGTH = 500

function getInitialString(value) {
  return typeof value === 'string' ? value : ''
}

function validateField(field, values) {
  switch (field) {
    case 'patientName': {
      const trimmed = values.patientName.trim()
      if (!trimmed) return 'Full name is required.'
      if (trimmed.length < 2) return 'Full name must be at least 2 characters.'
      return null
    }
    case 'patientEmail': {
      const trimmed = values.patientEmail.trim()
      if (!trimmed) return 'Email is required.'
      if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.'
      return null
    }
    case 'patientPhone': {
      const trimmed = values.patientPhone.trim()
      if (!trimmed) return 'Phone number is required.'
      if (!PHONE_CHAR_PATTERN.test(trimmed)) {
        return 'Use only digits, spaces, +, -, and parentheses.'
      }
      const digitCount = trimmed.replace(/\D/g, '').length
      if (digitCount < 8) return 'Phone number must contain at least 8 digits.'
      return null
    }
    case 'type': {
      if (!values.type) return 'Please select an appointment type.'
      if (!APPOINTMENT_TYPES.includes(values.type)) {
        return 'Select a valid appointment type.'
      }
      return null
    }
    case 'notes': {
      const trimmed = values.notes.trim()
      if (trimmed.length > NOTES_MAX_LENGTH) {
        return `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`
      }
      return null
    }
    default:
      return null
  }
}

function validateAll(values) {
  const fields = [
    'patientName',
    'patientEmail',
    'patientPhone',
    'type',
    'notes',
  ]
  const errors = {}
  fields.forEach((field) => {
    const message = validateField(field, values)
    if (message) {
      errors[field] = message
    }
  })
  return errors
}

export default function AppointmentForm({
  initialValues,
  onSubmit,
  submissionError = null,
  isSubmitting = false,
}) {
  const [values, setValues] = useState(() => ({
    patientName: getInitialString(initialValues?.patientName),
    patientEmail: getInitialString(initialValues?.patientEmail),
    patientPhone: getInitialString(initialValues?.patientPhone),
    type: getInitialString(initialValues?.type),
    notes: getInitialString(initialValues?.notes),
  }))
  const [errors, setErrors] = useState({})

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const nextErrors = validateAll(values)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    onSubmit({
      patientName: values.patientName.trim(),
      patientEmail: values.patientEmail.trim(),
      patientPhone: values.patientPhone.trim(),
      type: values.type,
      notes: values.notes.trim(),
    })
  }

  return (
    <form className={styles.appointmentForm} onSubmit={handleSubmit} noValidate>
      {submissionError && (
        <div role='alert' className={styles.formError}>
          {submissionError}
        </div>
      )}

      <div className={styles.formField}>
        <label htmlFor='patientName'>Full name</label>
        <input
          id='patientName'
          type='text'
          value={values.patientName}
          onChange={handleFieldChange('patientName')}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.patientName)}
          aria-describedby={
            errors.patientName ? 'patientName-error' : undefined
          }
          placeholder='Enter patient full name'
        />
        {errors.patientName && (
          <p id='patientName-error' role='alert' className={styles.fieldError}>
            {errors.patientName}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor='patientEmail'>Email</label>
        <input
          id='patientEmail'
          type='email'
          value={values.patientEmail}
          onChange={handleFieldChange('patientEmail')}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.patientEmail)}
          aria-describedby={
            errors.patientEmail ? 'patientEmail-error' : undefined
          }
          placeholder='example@domain.com'
        />
        {errors.patientEmail && (
          <p id='patientEmail-error' role='alert' className={styles.fieldError}>
            {errors.patientEmail}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor='patientPhone'>Phone number</label>
        <input
          id='patientPhone'
          type='tel'
          value={values.patientPhone}
          onChange={handleFieldChange('patientPhone')}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.patientPhone)}
          aria-describedby={
            errors.patientPhone
              ? 'patientPhone-error patientPhone-help'
              : 'patientPhone-help'
          }
          placeholder='+1 (555) 000-0000'
        />
        <p id='patientPhone-help' className={styles.fieldHelp}>
          Digits, spaces, +, -, and parentheses are allowed.
        </p>
        {errors.patientPhone && (
          <p id='patientPhone-error' role='alert' className={styles.fieldError}>
            {errors.patientPhone}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor='type'>Appointment type</label>
        <select
          id='type'
          value={values.type}
          onChange={handleFieldChange('type')}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.type)}
          aria-describedby={errors.type ? 'type-error' : undefined}
        >
          <option value='' disabled>
            Select an appointment type
          </option>
          {APPOINTMENT_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.type && (
          <p id='type-error' role='alert' className={styles.fieldError}>
            {errors.type}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor='notes'>Notes (optional)</label>
        <textarea
          id='notes'
          value={values.notes}
          onChange={handleFieldChange('notes')}
          disabled={isSubmitting}
          maxLength={NOTES_MAX_LENGTH}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={
            errors.notes ? 'notes-error notes-counter' : 'notes-counter'
          }
          placeholder='Add any additional instructions or information...'
        />
        <span id='notes-counter' className={styles.charCount}>
          {values.notes.length}/{NOTES_MAX_LENGTH}
        </span>
        {errors.notes && (
          <p id='notes-error' role='alert' className={styles.fieldError}>
            {errors.notes}
          </p>
        )}
      </div>

      <button type='submit' className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Continue'}
      </button>
    </form>
  )
}