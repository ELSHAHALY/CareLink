import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { FaClipboardList } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import Loader from '../components/common/Loader'
import styles from './DoctorAppointments.module.css'

const TABS = [
  { key: 'scheduled', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

function compareAppointments(a, b) {
  const dateCmp = a.date.localeCompare(b.date)
  if (dateCmp !== 0) return dateCmp
  return a.time.localeCompare(b.time)
}

export default function DoctorAppointments() {
  const { user, loading } = useAuth()
  const { appointments, isLoading, error } = useAppointments()
  const [activeTab, setActiveTab] = useState('scheduled')

  const doctorAppointments = useMemo(() => {
    if (!user?.doctorId) return []
    return appointments.filter((a) => a.doctorId === user.doctorId)
  }, [appointments, user?.doctorId])

  const filtered = useMemo(
    () =>
      doctorAppointments
        .filter((a) => a.status === activeTab)
        .sort(compareAppointments),
    [doctorAppointments, activeTab],
  )

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Loading...' />
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
        <h1 className={styles.title}>Appointments</h1>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tabs} role='tablist'>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type='button'
              role='tab'
              aria-selected={activeTab === tab.key}
              className={`${styles.tab} ${
                activeTab === tab.key ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<FaClipboardList />} message={`No ${activeTab} appointments.`} />
        ) : (
          <div className={styles.list}>
            {filtered.map((apt) => (
              <div key={apt.appointmentId} className={styles.card}>
                <div className={styles.cardMain}>
                  <span className={styles.time}>{apt.time}</span>
                  <div className={styles.cardInfo}>
                    <p className={styles.patient}>{apt.patientId}</p>
                    <p className={styles.type}>{apt.type}</p>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.date}>{apt.date}</span>
                  <Badge status={apt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}