import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom'
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import { validateEmail, validatePassword } from '../utils/validation'
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

  // إذا كان المستخدم مسجل الدخول بالفعل، سيتم توجيهه إلى الصفحة الرئيسية (/)
  if (!authLoading && user) {
    return <Navigate to='/' replace />
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
      // توجيه المستخدم إلى الصفحة الرئيسية (/) مباشرة بعد نجاح تسجيل الدخول
      navigate('/', { replace: true })
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
            <div className={styles.inputWrapper}>
              <FaEnvelope className={styles.inputIcon} />
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
            </div>
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor='password'>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.inputIcon} />
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
            </div>
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
          </div>

          <button type='submit' className={styles.button} disabled={loading}>
            <FaSignInAlt />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <br />
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