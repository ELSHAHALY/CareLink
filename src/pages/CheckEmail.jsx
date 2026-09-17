import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import styles from './Login.module.css'

export default function CheckEmail() {
  const location = useLocation()
  const email = location.state?.email || ''
  const navigate = useNavigate()
  const { resendConfirmation } = useAuth()

  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true })
    }
  }, [email, navigate])

  async function handleResend() {
    if (!email) return
    setResendLoading(true)
    setResendError('')
    setResendMessage('')

    try {
      const result = await resendConfirmation(email)
      if (result.success) {
        setResendMessage('Confirmation email sent. Please check your inbox.')
      } else {
        setResendError(result.error)
      }
    } catch {
      setResendError('Failed to resend email. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          We&apos;ve sent a confirmation link to <strong>{email}</strong>.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            Please check your inbox (and spam folder) for an email from
            CareLink. Click the confirmation link to activate your account.
          </p>
        </div>

        {resendError && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>{resendError}</p>
          </div>
        )}
        {resendMessage && (
          <div className={styles.successText}>
            <p>{resendMessage}</p>
          </div>
        )}

        <div className={styles.resendSection}>
          <p className={styles.resendText}>Didn&apos;t receive the email?</p>
          <button
            type='button'
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? 'Sending...' : 'Resend confirmation email'}
          </button>
        </div>

        <p className={styles.footer}>
          <Link to='/login' className={styles.link}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
