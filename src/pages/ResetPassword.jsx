import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import { validatePassword } from '../utils/validation'
import PasswordStrength from '../components/common/PasswordStrength'
import styles from './ResetPassword.module.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { updatePassword, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    const result = await updatePassword(password)
    if (result.success) {
      setSuccess('Password updated. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconHeader}>
          <FaLock className={styles.headerIcon} />
        </div>
        <h1 className={styles.title}>Set new password</h1>
        <p className={styles.subtitle}>Enter your new password below</p>

        {error && (
          <div className={styles.globalError}>
            <FaExclamationTriangle className={styles.alertIcon} />
            <p className={styles.errorText}>{error}</p>
          </div>
        )}
        {success && (
          <div className={styles.globalSuccess}>
            <FaCheckCircle className={styles.alertIcon} />
            <p className={styles.successText}>{success}</p>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor='password'>
              New password
            </label>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.inputIcon} />
              <input
                id='password'
                type='password'
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                placeholder='Min. 6 characters'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='new-password'
              />
            </div>
            <PasswordStrength password={password} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor='confirm'>
              Confirm password
            </label>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.inputIcon} />
              <input
                id='confirm'
                type='password'
                className={styles.input}
                placeholder='Repeat password'
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete='new-password'
              />
            </div>
          </div>
          <button type='submit' className={styles.button} disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to='/login' className={styles.link}>
            <FaArrowLeft className={styles.backIcon} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}