import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import styles from './Login.module.css'

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
    if (!password || password.length < 6) {
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
        <h1 className={styles.title}>Set new password</h1>
        <p className={styles.subtitle}>Enter your new password</p>

        {error && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}
        {success && <p className={styles.successText}>{success}</p>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor='password'>
              New password
            </label>
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
          <div className={styles.field}>
            <label className={styles.label} htmlFor='confirm'>
              Confirm password
            </label>
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
          <button type='submit' className={styles.button} disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
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
