import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import {
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validation'
import PasswordStrength from '../components/common/PasswordStrength'
import styles from './Register.module.css'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const { signupPatient, loading } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const next = {}
    if (!validateName(name)) next.name = 'Name must be at least 2 characters'
    if (!validateEmail(email)) next.email = 'Please enter a valid email address'
    if (!validatePassword(password))
      next.password = 'Password must be at least 6 characters'
    if (password !== confirm) next.confirm = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    const result = await signupPatient({ name, email, password })
    if (result.success) {
      navigate('/check-email', {
        state: { email },
      })
    } else {
      setServerError(result.error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.headerIcon}>
          <FaUserPlus />
        </div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join CareLink as a patient</p>

        {serverError && (
          <div className={styles.globalError}>
            <p className={styles.errorText}>{serverError}</p>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor='name'>
              Full name
            </label>
            <div className={styles.inputWrapper}>
              <FaUser className={styles.fieldIcon} />
              <input
                id='name'
                type='text'
                className={`${styles.input} ${
                  errors.name ? styles.inputError : ''
                }`}
                placeholder='John Doe'
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <FaEnvelope className={styles.fieldIcon} />
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
              <FaLock className={styles.fieldIcon} />
              <input
                id='password'
                type='password'
                className={`${styles.input} ${
                  errors.password ? styles.inputError : ''
                }`}
                placeholder='Min. 6 characters'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='new-password'
              />
            </div>
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
            <PasswordStrength password={password} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor='confirm'>
              Confirm password
            </label>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.fieldIcon} />
              <input
                id='confirm'
                type='password'
                className={`${styles.input} ${
                  errors.confirm ? styles.inputError : ''
                }`}
                placeholder='Repeat password'
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete='new-password'
              />
            </div>
            {errors.confirm && (
              <p className={styles.errorText}>{errors.confirm}</p>
            )}
          </div>

          <button type='submit' className={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

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