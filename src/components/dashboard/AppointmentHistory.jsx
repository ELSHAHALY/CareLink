import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiClock, FiChevronRight, FiCheck, FiStar } from 'react-icons/fi'
import { useAppointments } from '../../hooks/useAppointments'
import { useDoctorsCatalog } from '../../hooks/useDoctorsCatalog'
import { fetchMyReviewedAppointments } from '../../services/ratings'
import { isSupabaseConfigured } from '../../services/supabase'
import RatingForm from '../ratings/RatingForm'
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
  const [reviewedIds, setReviewedIds] = useState(() => new Set())
  const [reviewFormFor, setReviewFormFor] = useState(null)

  const recentCompleted = useMemo(() => {
    return appointments
      .filter((apt) => apt.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
  }, [appointments])

  // Load the caller's own submitted reviews once (real UUIDs only).
  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) return undefined
    fetchMyReviewedAppointments().then((result) => {
      if (!cancelled && result.success) {
        setReviewedIds(new Set(result.appointmentIds))
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (recentCompleted.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <span className={styles.titleIcon}>
              <FiClock />
            </span>
            <h2 className={styles.title}>Recent Appointments</h2>
          </div>
        </div>
        <div className={styles.emptyCard}>
          <EmptyState
            icon={<FiClock />}
            message='No appointment history yet. Your completed appointments will appear here.'
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
            <FiClock />
          </span>
          <h2 className={styles.title}>Recent Appointments</h2>
        </div>
        <Link to='/appointments' className={styles.viewAll}>
          <span>View All</span>
          <FiChevronRight className={styles.viewAllIcon} />
        </Link>
      </div>
      <div className={styles.list}>
        {recentCompleted.map((apt) => {
          const doctor = doctorMap[apt.doctorId]
          const reviewed = reviewedIds.has(String(apt.appointmentId))
          const formOpen = reviewFormFor === apt.appointmentId
          return (
            <div key={apt.appointmentId}>
              <div className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.doctorName}>
                    {doctor?.name || 'Unknown Doctor'}
                  </p>
                  <p className={styles.specialty}>{doctor?.specialty || ''}</p>
                </div>
                <div className={styles.rowMeta}>
                  <span className={styles.date}>{formatDate(apt.date)}</span>
                  <Badge status={apt.status} />
                  {reviewed ? (
                    <span
                      className={styles.reviewedBadge}
                      title='You already submitted a review for this visit'
                    >
                      <FiCheck className={styles.reviewedIcon} />
                      <span>Review submitted</span>
                    </span>
                  ) : (
                    <button
                      type='button'
                      className={styles.reviewBtn}
                      onClick={() =>
                        setReviewFormFor(formOpen ? null : apt.appointmentId)
                      }
                      aria-expanded={formOpen}
                    >
                      <FiStar className={styles.reviewBtnIcon} />
                      <span>{formOpen ? 'Close' : 'Leave a Review'}</span>
                    </button>
                  )}
                </div>
              </div>
              {formOpen && !reviewed && (
                <div className={styles.formWrapper}>
                  <RatingForm
                    appointmentId={apt.appointmentId}
                    onCancel={() => setReviewFormFor(null)}
                    onSubmitted={() => {
                      setReviewedIds((prev) =>
                        new Set(prev).add(String(apt.appointmentId)),
                      )
                      setReviewFormFor(null)
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
