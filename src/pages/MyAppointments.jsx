import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import Loader from '../components/common/Loader'
import styles from './MyAppointments.module.css'

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

function compareAppointments(a, b) {
  const dateCmp = a.date.localeCompare(b.date)
  if (dateCmp !== 0) return dateCmp
  return a.time.localeCompare(b.time)
}

export default function MyAppointments() {
  const { user, loading: authLoading } = useAuth()
  const { appointments, isLoading, error } = useAppointments()

  const todayStr = getTodayString()

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'scheduled' && a.date >= todayStr)
        .sort(compareAppointments),
    [appointments, todayStr],
  )

  const pastAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== 'scheduled' || a.date < todayStr)
        .sort(compareAppointments)
        .slice(0, 20),
    [appointments, todayStr],
  )

  if (authLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Checking session...' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loader message='Loading appointments...' />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>My Appointments</h1>

        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Upcoming Appointments
            <span className={styles.count}>
              ({upcomingAppointments.length})
            </span>
          </h2>
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon='📅'
              message="You don't have any upcoming appointments."
              actionLabel='Book Appointment'
              onAction={() => (window.location.href = '/doctors')}
            />
          ) : (
            <div className={styles.appointmentList}>
              {upcomingAppointments.map((apt) => (
                <AppointmentRow key={apt.appointmentId} appointment={apt} />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Past Appointments
            <span className={styles.count}>({pastAppointments.length})</span>
          </h2>
          {pastAppointments.length === 0 ? (
            <EmptyState icon='📋' message='No past appointments found.' />
          ) : (
            <div className={styles.appointmentList}>
              {pastAppointments.map((apt) => (
                <AppointmentRow key={apt.appointmentId} appointment={apt} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}

function AppointmentRow({ appointment }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.rowTime}>{appointment.time}</span>
        <div className={styles.rowInfo}>
          <p className={styles.doctorName}>{appointment.doctorId}</p>
          <p className={styles.appointmentType}>{appointment.type}</p>
        </div>
      </div>
      <div className={styles.rowMeta}>
        <span className={styles.rowDate}>{appointment.date}</span>
        <Badge status={appointment.status} />
      </div>
    </div>
  )
}
