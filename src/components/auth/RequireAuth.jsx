import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Loader from '../common/Loader'

export default function RequireAuth({ children }) {
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

  return children
}
