import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppointments } from '../../hooks/useAppointments'
import { useDoctorsCatalog } from '../../hooks/useDoctorsCatalog'
import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'
import styles from './AppointmentHistory.module.css'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AppointmentHistory() {
  const { appointments } = useAppointments()
  const { doctorMap } = useDoctorsCatalog()

  const recentCompleted = useMemo(() => {
    return appointments
      .filter((apt) => apt.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
  }, [appointments])

  if (recentCompleted.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>Recent Appointments</h2>
        </div>
        <EmptyState
          icon='📋'
          message='No appointment history yet. Your completed appointments will appear here.'
        />
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Appointments</h2>
        <Link to='/appointments' className={styles.viewAll}>
          View All
        </Link>
      </div>
      <div className={styles.list}>
        {recentCompleted.map((apt) => {
          const doctor = doctorMap[apt.doctorId]
          return (
            <div key={apt.appointmentId} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.doctorName}>
                  {doctor?.name || 'Unknown Doctor'}
                </p>
                <p className={styles.specialty}>{doctor?.specialty || ''}</p>
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.date}>{formatDate(apt.date)}</span>
                <Badge status={apt.status} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
