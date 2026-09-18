import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FaRegCalendarAlt, FaRegClipboard } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
<<<<<<< HEAD
// تم إزالة استيراد DashboardLayout
=======
import { useDoctorsCatalog } from '../hooks/useDoctorsCatalog'
import { resolveDoctorImage } from '../utils/doctors'
import DashboardLayout from '../components/layout/DashboardLayout'
>>>>>>> ef1d91dc3df2459ca1fae9b1f6f134504a780871
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
  const { appointments, isLoading, error, cancelAppointment } = useAppointments()
  const { doctorMap } = useDoctorsCatalog()
  const [cancellingId, setCancellingId] = useState(null)

  const todayStr = getTodayString()

  async function handleCancel(appointmentId) {
    if (!window.confirm('Cancel this appointment?')) return
    setCancellingId(appointmentId)
    await cancelAppointment(appointmentId)
    setCancellingId(null)
  }

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
      <div className={styles.pageContainer}>
        <Loader message='Loading appointments...' />
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
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
              icon={<FaRegCalendarAlt />}
              message="You don't have any upcoming appointments."
              actionLabel='Book Appointment'
              onAction={() => (window.location.href = '/doctors')}
            />
          ) : (
            <div className={styles.appointmentList}>
              {upcomingAppointments.map((apt) => (
                <AppointmentRow
                  key={apt.appointmentId}
                  appointment={apt}
                  doctorMap={doctorMap}
                  onCancel={handleCancel}
                  cancellingId={cancellingId}
                />
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
            <EmptyState icon={<FaRegClipboard />} message='No past appointments found.' />
          ) : (
            <div className={styles.appointmentList}>
              {pastAppointments.map((apt) => (
                <AppointmentRow
                  key={apt.appointmentId}
                  appointment={apt}
                  doctorMap={doctorMap}
                  onCancel={handleCancel}
                  cancellingId={cancellingId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function AppointmentRow({ appointment, doctorMap, onCancel, cancellingId }) {
  const doctor = doctorMap?.[appointment.doctorId]
  const canCancel =
    appointment.status === 'scheduled' && appointment.date >= getTodayString()
  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        {doctor?.image && (
          <img
            src={resolveDoctorImage(doctor.image)}
            alt={doctor.name}
            className={styles.doctorThumb}
          />
        )}
        <div className={styles.rowInfo}>
          <p className={styles.doctorName}>
            {doctor?.name || 'Unknown Doctor'}
          </p>
          <p className={styles.appointmentType}>{appointment.type}</p>
        </div>
      </div>
      <div className={styles.rowMeta}>
        <span className={styles.rowTime}>{appointment.time}</span>
        <span className={styles.rowDate}>{appointment.date}</span>
        <Badge status={appointment.status} />
        {canCancel && (
          <button
            type='button'
            className={styles.cancelBtn}
            onClick={() => onCancel(appointment.appointmentId)}
            disabled={cancellingId === appointment.appointmentId}
          >
            {cancellingId === appointment.appointmentId
              ? 'Cancelling…'
              : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  )
}