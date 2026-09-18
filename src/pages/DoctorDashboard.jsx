import { useMemo } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { FaCalendarAlt, FaClipboardList } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import Loader from '../components/common/Loader'
import styles from './DoctorDashboard.module.css'

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

function compareAppointments(a, b) {
  const dateCmp = a.date.localeCompare(b.date)
  if (dateCmp !== 0) return dateCmp
  return a.time.localeCompare(b.time)
}

export default function DoctorDashboard() {
  const { user, loading } = useAuth()
  const { appointments, isLoading, error } = useAppointments()

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

  if (user.role !== 'doctor') {
    if (user.role === 'admin') return <Navigate to='/admin/doctors' replace />
    return <Navigate to='/dashboard' replace />
  }

  return (
    <DoctorDashboardContent
      user={user}
      appointments={appointments}
      isLoading={isLoading}
      error={error}
    />
  )
}

function DoctorDashboardContent({ user, appointments, isLoading, error }) {
  const doctorId = user.doctorId

  const doctorAppointments = useMemo(
    () => appointments.filter((a) => a.doctorId === doctorId),
    [appointments, doctorId],
  )

  const todayStr = getTodayString()

  const todayAppointments = useMemo(
    () =>
      doctorAppointments
        .filter((a) => a.date === todayStr && a.status === 'scheduled')
        .sort(compareAppointments),
    [doctorAppointments, todayStr],
  )

  const upcomingAppointments = useMemo(
    () =>
      doctorAppointments
        .filter((a) => a.status === 'scheduled' && a.date >= todayStr)
        .sort(compareAppointments)
        .slice(0, 5),
    [doctorAppointments, todayStr],
  )

  const completedCount = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'completed').length,
    [doctorAppointments],
  )

  const upcomingCount = useMemo(
    () =>
      doctorAppointments.filter(
        (a) => a.status === 'scheduled' && a.date >= todayStr,
      ).length,
    [doctorAppointments, todayStr],
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loader message='Loading appointments...' />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <section className={styles.welcome}>
          <h1 className={styles.greeting}>Welcome back, {user.name}</h1>
          <p className={styles.subtitle}>
            Here&apos;s your appointment overview.
          </p>
        </section>

        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.summary} aria-label='Appointment summary'>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              Today&apos;s Appointments
            </span>
            <span className={styles.summaryValue}>
              {todayAppointments.length}
            </span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Upcoming</span>
            <span className={styles.summaryValue}>{upcomingCount}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Completed</span>
            <span className={styles.summaryValue}>{completedCount}</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Today&apos;s Appointments</h2>
          {todayAppointments.length === 0 ? (
            <EmptyState
              icon={<FaCalendarAlt />}
              message="You don't have any appointments scheduled for today."
            />
          ) : (
            <div className={styles.appointmentList}>
              {todayAppointments.map((apt) => (
                <DoctorAppointmentRow
                  key={apt.appointmentId}
                  appointment={apt}
                />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Upcoming Appointments</h2>
            <Link to='/doctor/appointments' className={styles.viewAll}>
              View All
            </Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <EmptyState icon={<FaClipboardList />} message='No upcoming appointments.' />
          ) : (
            <div className={styles.appointmentList}>
              {upcomingAppointments.map((apt) => (
                <DoctorAppointmentRow
                  key={apt.appointmentId}
                  appointment={apt}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}

function DoctorAppointmentRow({ appointment }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.rowTime}>{appointment.time}</span>
        <div className={styles.rowInfo}>
          <p className={styles.patientName}>{appointment.patientId}</p>
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