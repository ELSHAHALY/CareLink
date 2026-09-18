import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { validateEmail, validatePassword } from '../utils/validation'
import { getRoleRedirect } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { user, authLoading, login, loading, configError, isMockAuthAllowed } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  if (!authLoading && user) {
    if (user.role === 'doctor')
      return <Navigate to='/doctor/dashboard' replace />
    if (user.role === 'admin') return <Navigate to='/admin/doctors' replace />
    return <Navigate to='/dashboard' replace />
  }

  function validate() {
    const next = {}
    if (!validateEmail(email)) {
      next.email = 'Please enter a valid email address'
    }
    if (!validatePassword(password)) {
      next.password = 'Password must be at least 6 characters'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    const result = await login(email, password)
    if (result.success) {
      navigate(getRoleRedirect(result.role))
    } else {
      setServerError(result.error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your CareLink account</p>

        {configError && !isMockAuthAllowed && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>{configError}</p>
          </div>
        )}

        {isMockAuthAllowed && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>
              Dev mode: Supabase not configured, using mock auth. Set .env for
              real authentication.
            </p>
          </div>
        )}

        {serverError && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>{serverError}</p>
          </div>
        )}

        {successMessage && (
          <div className={styles.successText}>
            <p>{successMessage}</p>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor='email'>
              Email
            </label>
            <input
              id='email'
              type='email'
              className={`${styles.input} ${
                errors.email ? styles.inputError : ''
              }`}
              placeholder='you@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete='email'
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor='password'>
              Password
            </label>
            <input
              id='password'
              type='password'
              className={`${styles.input} ${
                errors.password ? styles.inputError : ''
              }`}
              placeholder='Min. 6 characters'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='current-password'
            />
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
          </div>

          <button type='submit' className={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className={styles.forgotLink}>
          <Link to='/forgot-password'>Forgot password?</Link>
        </p>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to='/register' className={styles.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
