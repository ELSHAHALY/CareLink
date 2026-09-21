import { useEffect, useRef, useState } from 'react'
import { 
  FiMail, 
  FiUser, 
  FiMessageSquare, 
  FiSend, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiArrowRight 
} from 'react-icons/fi'
import { submitContactForm } from '../services/contactApi'
import styles from './Contact.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIELD_ORDER = ['name', 'email', 'subject', 'message']

const LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  subject: { min: 3, max: 120 },
  message: { min: 10, max: 1000 },
}

const EMPTY_VALUES = { name: '', email: '', subject: '', message: '' }

function validateField(field, values) {
  switch (field) {
    case 'name': {
      const trimmed = values.name.trim()
      if (!trimmed) return 'Full name is required.'
      if (trimmed.length < LIMITS.name.min)
        return `Full name must be at least ${LIMITS.name.min} characters.`
      if (trimmed.length > LIMITS.name.max)
        return `Full name must be ${LIMITS.name.max} characters or fewer.`
      return null
    }
    case 'email': {
      const trimmed = values.email.trim()
      if (!trimmed) return 'Email is required.'
      if (trimmed.length > LIMITS.email.max)
        return `Email must be ${LIMITS.email.max} characters or fewer.`
      if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.'
      return null
    }
    case 'subject': {
      const trimmed = values.subject.trim()
      if (!trimmed) return 'Subject is required.'
      if (trimmed.length < LIMITS.subject.min)
        return `Subject must be at least ${LIMITS.subject.min} characters.`
      if (trimmed.length > LIMITS.subject.max)
        return `Subject must be ${LIMITS.subject.max} characters or fewer.`
      return null
    }
    case 'message': {
      const trimmed = values.message.trim()
      if (!trimmed) return 'Message is required.'
      if (trimmed.length < LIMITS.message.min)
        return `Message must be at least ${LIMITS.message.min} characters.`
      if (trimmed.length > LIMITS.message.max)
        return `Message must be ${LIMITS.message.max} characters or fewer.`
      return null
    }
    default:
      return null
  }
}

function validateAll(values) {
  const errors = {}
  FIELD_ORDER.forEach((field) => {
    const message = validateField(field, values)
    if (message) {
      errors[field] = message
    }
  })
  return errors
}

export default function Contact() {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submissionError, setSubmissionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nameRef = useRef(null)
  const emailRef = useRef(null)
  const subjectRef = useRef(null)
  const messageRef = useRef(null)
  const fieldRefs = {
    name: nameRef,
    email: emailRef,
    subject: subjectRef,
    message: messageRef,
  }

  const submissionErrorRef = useRef(null)
  const successRef = useRef(null)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)
  const wasShowingSuccessRef = useRef(false)
  const submissionLockRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (submissionError && submissionErrorRef.current) {
      submissionErrorRef.current.focus()
    }
  }, [submissionError])

  useEffect(() => {
    if (successMessage) {
      wasShowingSuccessRef.current = true
      successRef.current?.focus()
    } else if (wasShowingSuccessRef.current) {
      wasShowingSuccessRef.current = false
      nameRef.current?.focus()
    }
  }, [successMessage])

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const focusFirstInvalidField = (errors) => {
    const firstField = FIELD_ORDER.find((field) => errors[field])
    fieldRefs[firstField]?.current?.focus()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting || submissionLockRef.current) return

    const validationErrors = validateAll(values)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      focusFirstInvalidField(validationErrors)
      return
    }

    setFieldErrors({})
    setSubmissionError(null)
    submissionLockRef.current = true
    setIsSubmitting(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const result = await submitContactForm({
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
        signal: controller.signal,
      })
      if (!isMountedRef.current) return
      setSuccessMessage(result.detail)
    } catch (err) {
      if (err?.name === 'AbortError') {
        return
      }
      if (!isMountedRef.current) return
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Unable to send your message. Please try again.',
      )
    } finally {
      submissionLockRef.current = false

      if (isMountedRef.current) {
        setIsSubmitting(false)
      }

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }

  const handleSendAnother = () => {
    setValues(EMPTY_VALUES)
    setFieldErrors({})
    setSubmissionError(null)
    setSuccessMessage(null)
  }

  return (
    <main className={styles.page}>
      <section className={styles.container} aria-label='Contact CareLink'>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>
          Have a question or need help? Send us a message and our team will get
          back to you.
        </p>

        {successMessage ? (
          <div
            ref={successRef}
            className={styles.successCard}
            role='status'
            aria-live='polite'
            tabIndex={-1}
          >
            <div className={styles.successHeader}>
              <FiCheckCircle className={styles.successIcon} />
              <h2 className={styles.successHeading}>Message Sent</h2>
            </div>
            <p className={styles.successText}>{successMessage}</p>
            <button
              type='button'
              className={styles.secondaryButton}
              onClick={handleSendAnother}
            >
              <span>Send Another Message</span>
              <FiArrowRight className={styles.btnIcon} />
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {submissionError && (
              <div
                ref={submissionErrorRef}
                className={styles.formError}
                role='alert'
                tabIndex={-1}
              >
                <FiAlertCircle className={styles.errorAlertIcon} />
                <span>{submissionError}</span>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor='contact-name'>
                Full name
              </label>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.fieldIcon} />
                <input
                  id='contact-name'
                  ref={nameRef}
                  type='text'
                  className={`${styles.input} ${
                    fieldErrors.name ? styles.inputError : ''
                  }`}
                  value={values.name}
                  onChange={handleFieldChange('name')}
                  disabled={isSubmitting}
                  required
                  autoComplete='name'
                  maxLength={LIMITS.name.max}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={
                    fieldErrors.name ? 'contact-name-error' : undefined
                  }
                />
              </div>
              {fieldErrors.name && (
                <p
                  id='contact-name-error'
                  role='alert'
                  className={styles.fieldError}
                >
                  <FiAlertCircle className={styles.fieldErrorIcon} />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor='contact-email'>
                Email
              </label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.fieldIcon} />
                <input
                  id='contact-email'
                  ref={emailRef}
                  type='email'
                  className={`${styles.input} ${
                    fieldErrors.email ? styles.inputError : ''
                  }`}
                  value={values.email}
                  onChange={handleFieldChange('email')}
                  disabled={isSubmitting}
                  required
                  autoComplete='email'
                  maxLength={LIMITS.email.max}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? 'contact-email-error' : undefined
                  }
                />
              </div>
              {fieldErrors.email && (
                <p
                  id='contact-email-error'
                  role='alert'
                  className={styles.fieldError}
                >
                  <FiAlertCircle className={styles.fieldErrorIcon} />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor='contact-subject'>
                Subject
              </label>
              <div className={styles.inputWrapper}>
                <FiMessageSquare className={styles.fieldIcon} />
                <input
                  id='contact-subject'
                  ref={subjectRef}
                  type='text'
                  className={`${styles.input} ${
                    fieldErrors.subject ? styles.inputError : ''
                  }`}
                  value={values.subject}
                  onChange={handleFieldChange('subject')}
                  disabled={isSubmitting}
                  required
                  maxLength={LIMITS.subject.max}
                  aria-invalid={Boolean(fieldErrors.subject)}
                  aria-describedby={
                    fieldErrors.subject ? 'contact-subject-error' : undefined
                  }
                />
              </div>
              {fieldErrors.subject && (
                <p
                  id='contact-subject-error'
                  role='alert'
                  className={styles.fieldError}
                >
                  <FiAlertCircle className={styles.fieldErrorIcon} />
                  <span>{fieldErrors.subject}</span>
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor='contact-message'>
                Message
              </label>
              <textarea
                id='contact-message'
                ref={messageRef}
                className={`${styles.textarea} ${
                  fieldErrors.message ? styles.inputError : ''
                }`}
                value={values.message}
                onChange={handleFieldChange('message')}
                disabled={isSubmitting}
                required
                maxLength={LIMITS.message.max}
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={
                  fieldErrors.message
                    ? 'contact-message-error contact-message-counter'
                    : 'contact-message-counter'
                }
              />
              <span id='contact-message-counter' className={styles.charCount}>
                {values.message.length}/{LIMITS.message.max}
              </span>
              {fieldErrors.message && (
                <p
                  id='contact-message-error'
                  role='alert'
                  className={styles.fieldError}
                >
                  <FiAlertCircle className={styles.fieldErrorIcon} />
                  <span>{fieldErrors.message}</span>
                </p>
              )}
            </div>

            <button
              type='submit'
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              <FiSend className={styles.btnIcon} />
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        )}
      </section>
    </main>
  )
}