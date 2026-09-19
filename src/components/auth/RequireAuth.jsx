import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Loader from '../common/Loader'
import styles from './RequireAuth.module.css'

export default function RequireAuth({ children }) {
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

  return children
}