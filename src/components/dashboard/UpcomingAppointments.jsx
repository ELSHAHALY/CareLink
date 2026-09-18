import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppointments } from '../../hooks/useAppointments'
import { useDoctorsCatalog } from '../../hooks/useDoctorsCatalog'
import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'
import styles from './UpcomingAppointments.module.css'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function UpcomingAppointments() {
  const { appointments } = useAppointments()
  const { doctorMap } = useDoctorsCatalog()

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return appointments
      .filter((apt) => apt.status === 'scheduled' && apt.date >= today)
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
      )
      .slice(0, 3)
  }, [appointments])

  if (upcoming.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Upcoming Appointments</h2>
        <EmptyState
          icon='📅'
          message='No upcoming appointments. Book an appointment with a doctor to get started.'
          actionLabel='Find a Doctor'
          onAction={() => (window.location.href = '/doctors')}
        />
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Upcoming Appointments</h2>
      <div className={styles.list}>
        {upcoming.map((apt) => {
          const doctor = doctorMap[apt.doctorId]
          return (
            <div key={apt.appointmentId} className={styles.card}>
              <div className={styles.cardBody}>
                <p className={styles.doctorName}>
                  {doctor?.name || 'Unknown Doctor'}
                </p>
                <p className={styles.specialty}>{doctor?.specialty || ''}</p>
                <p className={styles.dateTime}>
                  {formatDate(apt.date)} &bull; {apt.time}
                </p>
              </div>
              <div className={styles.cardMeta}>
                <Badge status={apt.status} />
                <Link
                  to={doctor ? `/doctors/${doctor.id}` : '/doctors'}
                  className={styles.viewLink}
                >
                  View
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
