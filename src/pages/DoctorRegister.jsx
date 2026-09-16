import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import doctorsData from '../data/doctors.json'
import styles from './Login.module.css'

export default function DoctorRegister() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const { signupDoctor, loading } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const next = {}
    if (!name.trim() || name.trim().length < 2)
      next.name = 'Name must be at least 2 characters'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Please enter a valid email address'
    if (!password || password.length < 6)
      next.password = 'Password must be at least 6 characters'
    if (password !== confirm) next.confirm = 'Passwords do not match'
    if (!doctorId) next.doctorId = 'Please select a doctor profile'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    const result = await signupDoctor({ name, email, password, doctorId })
    if (result.success) {
      navigate('/doctor/dashboard')
    } else {
      setServerError(result.error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Doctor registration</h1>
        <p className={styles.subtitle}>
          Create a doctor account — admin will verify
        </p>

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
            <input
              id='name'
              type='text'
              className={`${styles.input} ${
                errors.name ? styles.inputError : ''
              }`}
              placeholder='Dr. John Doe'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete='name'
            />
            {errors.name && <p className={styles.errorText}>{errors.name}</p>}
          </div>

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
              placeholder='doctor@carelink.com'
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
              autoComplete='new-password'
            />
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor='confirm'>
              Confirm password
            </label>
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
            {errors.confirm && (
              <p className={styles.errorText}>{errors.confirm}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor='doctorId'>
              Doctor profile
            </label>
            <select
              id='doctorId'
              className={`${styles.input} ${
                errors.doctorId ? styles.inputError : ''
              }`}
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value=''>Select a doctor</option>
              {doctorsData.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
            {errors.doctorId && (
              <p className={styles.errorText}>{errors.doctorId}</p>
            )}
          </div>

          <button type='submit' className={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Create doctor account'}
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
