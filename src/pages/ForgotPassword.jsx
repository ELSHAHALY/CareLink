import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import { validateEmail } from '../utils/validation'
import styles from './ForgotPassword.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { resetPassword, loading } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    const result = await resetPassword(email)
    if (result.success) {
      setSuccess(
        'If an account exists, a reset link has been sent to your email.',
      )
    } else {
      setError(result.error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot password</h1>
        <p className={styles.subtitle}>
          Enter your email to receive a reset link
        </p>

        {error && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}
        {success && <p className={styles.successText}>{success}</p>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor='email'>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <FaEnvelope className={styles.inputIcon} />
              <input
                id='email'
                type='email'
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete='email'
              />
            </div>
          </div>
          <button type='submit' className={styles.button} disabled={loading}>
            <FaPaperPlane />
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to='/login' className={styles.link}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}