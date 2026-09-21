import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Loader from '../common/Loader'
import styles from './RequireRole.module.css'

export default function RequireRole({ roles, children }) {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader message='Checking session...' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (!roles.includes(user.role)) {
    if (user.role === 'doctor')
      return <Navigate to='/doctor/dashboard' replace />
    if (user.role === 'admin') return <Navigate to='/admin/doctors' replace />
    return <Navigate to='/dashboard' replace />
  }

  return children
}