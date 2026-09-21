import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { FaUserMd, FaEnvelope, FaStethoscope, FaCommentAlt, FaPaperPlane } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import Loader from '../components/common/Loader'
import styles from './DoctorRegister.module.css'

const INTEREST_STORAGE_KEY = 'carelink_doctor_interest'

export default function DoctorRegister() {
  const { user, authLoading } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const next = {}
    if (!formData.name.trim()) next.name = 'Name is required'
    if (!formData.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = 'Please enter a valid email address'
    }
    if (!formData.specialty.trim()) next.specialty = 'Specialty is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const existing = JSON.parse(
        localStorage.getItem(INTEREST_STORAGE_KEY) || '[]',
      )
      existing.push({
        ...formData,
        submittedAt: new Date().toISOString(),
      })
      localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(existing))
      setSubmitted(true)
      setFormData({ name: '', email: '', specialty: '', message: '' })
    } catch {
      setSubmitError('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className={styles.container}>
        <Loader message='Loading...' />
      </div>
    )
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to='/admin/doctors' replace />
    if (user.role === 'doctor')
      return <Navigate to='/doctor/dashboard' replace />
    return <Navigate to='/dashboard' replace />
  }

  const renderForm = () => (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor='name'>
          Full Name
        </label>
        <div className={styles.inputWrapper}>
          <FaUserMd className={styles.inputIcon} />
          <input
            id='name'
            type='text'
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder='Dr. Jane Smith'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete='name'
          />
        </div>
        {errors.name && <p className={styles.errorText}>{errors.name}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor='email'>
          Email
        </label>
        <div className={styles.inputWrapper}>
          <FaEnvelope className={styles.inputIcon} />
          <input
            id='email'
            type='email'
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            placeholder='you@example.com'
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            autoComplete='email'
          />
        </div>
        {errors.email && <p className={styles.errorText}>{errors.email}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor='specialty'>
          Specialty
        </label>
        <div className={styles.inputWrapper}>
          <FaStethoscope className={styles.inputIcon} />
          <input
            id='specialty'
            type='text'
            className={`${styles.input} ${
              errors.specialty ? styles.inputError : ''
            }`}
            placeholder='e.g., Cardiology, Dermatology'
            value={formData.specialty}
            onChange={(e) =>
              setFormData({ ...formData, specialty: e.target.value })
            }
            autoComplete='off'
          />
        </div>
        {errors.specialty && (
          <p className={styles.errorText}>{errors.specialty}</p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor='message'>
          Message (optional)
        </label>
        <div className={styles.inputWrapper}>
          <FaCommentAlt className={`${styles.inputIcon} ${styles.textareaIcon}`} />
          <textarea
            id='message'
            className={`${styles.input} ${styles.textarea}`}
            rows={4}
            placeholder='Tell us about your experience, location, or any other details...'
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
          />
        </div>
      </div>

      <button type='submit' className={styles.button} disabled={isSubmitting}>
        <FaPaperPlane />
        {isSubmitting ? 'Submitting...' : 'Submit Interest'}
      </button>
    </form>
  )

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Thank You!</h1>
          <p className={styles.subtitle}>
            Your interest has been recorded. Our admin team will review and
            contact you if a doctor account becomes available.
          </p>
          <p className={styles.footer}>
            <Link to='/login' className={styles.link}>
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Doctor Registration Interest</h1>
        <p className={styles.subtitle}>
          Doctor accounts are created by administrators. Fill out the form below
          to express your interest — our team will review and contact you.
        </p>

        {submitError && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>{submitError}</p>
          </div>
        )}

        {renderForm()}

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to='/login' className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}