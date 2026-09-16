import { Navigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Loader from '../components/common/Loader'
import styles from './Login.module.css'

export default function DoctorRegister() {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className={styles.container}>
        <Loader message='Loading...' />
      </div>
    )
  }

  // If already logged in, redirect to appropriate dashboard
  if (user) {
    if (user.role === 'admin') return <Navigate to='/admin/doctors' replace />
    if (user.role === 'doctor')
      return <Navigate to='/doctor/dashboard' replace />
    return <Navigate to='/dashboard' replace />
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Doctor Registration</h1>
        <p className={styles.subtitle}>
          Doctor accounts are created by administrators. Please contact your
          admin to get a doctor account, or sign in if you already have one.
        </p>

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
