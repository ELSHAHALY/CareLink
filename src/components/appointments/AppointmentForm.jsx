import { useState } from 'react'

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
    <form className='appointment-form' onSubmit={handleSubmit} noValidate>
      <style>{`
        .appointment-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .appointment-form .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .appointment-form label {
          font-size: 0.85rem;
          color: #343A40;
          font-weight: 600;
        }
        .appointment-form input,
        .appointment-form select,
        .appointment-form textarea {
          padding: 0.6rem 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #343A40;
          font-family: inherit;
          width: 100%;
        }
        .appointment-form input:focus,
        .appointment-form select:focus,
        .appointment-form textarea:focus {
          outline: none;
          border-color: #007BFF;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
        }
        .appointment-form input[aria-invalid='true'],
        .appointment-form select[aria-invalid='true'],
        .appointment-form textarea[aria-invalid='true'] {
          border-color: #d64545;
        }
        .appointment-form textarea {
          resize: vertical;
          min-height: 80px;
        }
        .appointment-form .field-error {
          color: #d64545;
          font-size: 0.8rem;
        }
        .appointment-form .field-help {
          color: #6c757d;
          font-size: 0.78rem;
        }
        .appointment-form .char-count {
          align-self: flex-end;
          font-size: 0.75rem;
          color: #6c757d;
        }
        .appointment-form .form-error {
          background: #fdecea;
          border: 1px solid #d64545;
          color: #843534;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .appointment-form .submit-button {
          background: #00A676;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          width: 100%;
        }
        .appointment-form .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (min-width: 600px) {
          .appointment-form .submit-button {
            width: auto;
          }
        }
      `}</style>

      {submissionError && (
        <div role='alert' className='form-error'>
          {submissionError}
        </div>
      )}

      <div className='form-field'>
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
        />
        {errors.patientName && (
          <p id='patientName-error' role='alert' className='field-error'>
            {errors.patientName}
          </p>
        )}
      </div>

      <div className='form-field'>
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
        />
        {errors.patientEmail && (
          <p id='patientEmail-error' role='alert' className='field-error'>
            {errors.patientEmail}
          </p>
        )}
      </div>

      <div className='form-field'>
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
        />
        <p id='patientPhone-help' className='field-help'>
          Digits, spaces, +, -, and parentheses are allowed.
        </p>
        {errors.patientPhone && (
          <p id='patientPhone-error' role='alert' className='field-error'>
            {errors.patientPhone}
          </p>
        )}
      </div>

      <div className='form-field'>
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
          <p id='type-error' role='alert' className='field-error'>
            {errors.type}
          </p>
        )}
      </div>

      <div className='form-field'>
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
        />
        <span id='notes-counter' className='char-count'>
          {values.notes.length}/{NOTES_MAX_LENGTH}
        </span>
        {errors.notes && (
          <p id='notes-error' role='alert' className='field-error'>
            {errors.notes}
          </p>
        )}
      </div>

      <button type='submit' className='submit-button' disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Continue'}
      </button>
    </form>
  )
}
