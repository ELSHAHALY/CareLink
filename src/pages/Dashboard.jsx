import { Link, Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'
import UpcomingAppointments from '../components/dashboard/UpcomingAppointments'
import FavoriteDoctors from '../components/dashboard/FavoriteDoctors'
import AppointmentHistory from '../components/dashboard/AppointmentHistory'
import Loader from '../components/common/Loader'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Loading dashboard...' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (user.role === 'doctor') {
    return <Navigate to='/doctor/dashboard' replace />
  }

  if (user.role === 'admin') {
    return <Navigate to='/admin/doctors' replace />
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <section className={styles.welcome}>
          <h1 className={styles.greeting}>Welcome back, {user.name}</h1>
          <p className={styles.subtitle}>Manage your healthcare appointments</p>
        </section>

        <UpcomingAppointments />

        <section className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actions}>
            <Link to='/doctors' className={styles.actionBtn}>
              Find a Doctor
            </Link>
            <Link to='/doctors' className={styles.actionBtn}>
              Book Appointment
            </Link>
          </div>
        </section>

        <FavoriteDoctors />

        <AppointmentHistory />
      </div>
    </DashboardLayout>
  )
}
