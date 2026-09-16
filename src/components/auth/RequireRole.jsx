import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Loader from '../common/Loader'

export default function RequireRole({ roles, children }) {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}
      >
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
