import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiClock } from 'react-icons/fi'
import { useAppointments } from '../../hooks/useAppointments'
import doctorsData from '../../data/doctors.json'
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

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return appointments
      .filter((apt) => apt.status === 'scheduled' && apt.date >= today)
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
      )
      .slice(0, 3)
  }, [appointments])

  const doctorMap = useMemo(() => {
    const map = {}
    doctorsData.doctors.forEach((doc) => {
      map[doc.id] = doc
    })
    return map
  }, [])

  if (upcoming.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <span className={styles.titleIcon}>
              <FiCalendar />
            </span>
            <h2 className={styles.title}>Upcoming Appointments</h2>
          </div>
        </div>
        <div className={styles.emptyCard}>
          <EmptyState
            icon={<FiCalendar />}
            message='No upcoming appointments. Book an appointment with a doctor to get started.'
            actionLabel='Find a Doctor'
            onAction={() => (window.location.href = '/doctors')}
          />
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.titleIcon}>
            <FiCalendar />
          </span>
          <h2 className={styles.title}>Upcoming Appointments</h2>
        </div>
      </div>
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
                <div className={styles.dateTime}>
                  <FiClock className={styles.clockIcon} />
                  <span>
                    {formatDate(apt.date)} &bull; {apt.time}
                  </span>
                </div>
              </div>
              <div className={styles.cardMeta}>
                <Badge status={apt.status} />
                <Link
                  to={doctor ? `/doctors/${doctor.id}` : '/doctors'}
                  className={styles.viewLink}
                >
                  View Profile
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}