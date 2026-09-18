import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import { resolveDoctorImage } from '../utils/doctors'
import styles from './AdminDashboard.module.css'

function StatCard({ label, value, tone = 'default', linkTo = null }) {
  const content = (
    <div className={`${styles.statCard} ${styles[`tone-${tone}`]}`}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
  if (linkTo) {
    return (
      <Link to={linkTo} className={styles.statLink}>
        {content}
      </Link>
    )
  }
  return content
}

function ActionCard({ title, description, to, label }) {
  return (
    <Link to={to} className={styles.actionCard}>
      <h3 className={styles.actionTitle}>{title}</h3>
      <p className={styles.actionDescription}>{description}</p>
      <span className={styles.actionLabel}>{label} →</span>
    </Link>
  )
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    publishedDoctors: 0,
    draftDoctors: 0,
    totalPatients: 0,
    upcomingAppointments: 0,
  })
  const [recentDoctors, setRecentDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false)
        return
      }
      try {
        const today = new Date().toISOString().slice(0, 10)
        const [
          { data: recent, error: recentErr },
          { count: publishedCount, error: publishedErr },
          { count: draftCount, error: draftErr },
          { count: patientCount, error: patientErr },
          { count: upcomingCount, error: upcomingErr },
        ] = await Promise.all([
          supabase
            .from('doctors')
            .select('id, status, name_en, name_ar, specialty_en, image, created_at')
            .order('created_at', { ascending: false })
            .limit(6),
          supabase
            .from('doctors')
            .select('*', { count: 'exact', head: true })
            .or('status.is.null,status.eq.published'),
          supabase
            .from('doctors')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft'),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'patient'),
          supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .gte('date', today)
            .eq('status', 'scheduled'),
        ])
        if (cancelled) return
        if (recentErr) throw recentErr
        if (publishedErr) throw publishedErr
        if (draftErr) throw draftErr
        if (patientErr) throw patientErr
        if (upcomingErr) throw upcomingErr
        setStats({
          publishedDoctors: publishedCount || 0,
          draftDoctors: draftCount || 0,
          totalPatients: patientCount || 0,
          upcomingAppointments: upcomingCount || 0,
        })
        setRecentDoctors((recent || []).slice(0, 5))
      } catch (err) {
        if (!cancelled) {
          // Surface error via console; UI keeps previous zeros.
          console.error('Failed to load admin dashboard stats:', err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (authLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Loading...' />
      </div>
    )
  }

  if (!user) return <Navigate to='/login' replace />
  if (user.role !== 'admin') {
    if (user.role === 'doctor')
      return <Navigate to='/doctor/dashboard' replace />
    return <Navigate to='/dashboard' replace />
  }

  return (
    <DashboardLayout
      title='Admin Overview'
      subtitle='Manage doctors, users, and appointments from one place.'
      action={
        <Link to='/admin/doctors' className={styles.primaryBtn}>
          + Add Doctor
        </Link>
      }
    >
      <div className={styles.grid}>
        <StatCard
          label='Published Doctors'
          value={stats.publishedDoctors}
          tone='primary'
          linkTo='/admin/doctors'
        />
        <StatCard
          label='Draft Doctors'
          value={stats.draftDoctors}
          tone='warning'
          linkTo='/admin/doctors?status=draft'
        />
        <StatCard label='Patients' value={stats.totalPatients} tone='success' />
        <StatCard
          label='Upcoming Appointments'
          value={stats.upcomingAppointments}
          tone='info'
        />
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <ActionCard
            title='Add a Doctor'
            description='Create a new doctor profile and login account in one guided flow.'
            to='/admin/doctors'
            label='Add Doctor'
          />
          <ActionCard
            title='Manage Doctors'
            description='Search, edit, archive, and link accounts for existing doctors.'
            to='/admin/doctors'
            label='Manage'
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recently Added Doctors</h2>
          <Link to='/admin/doctors' className={styles.link}>
            View all
          </Link>
        </div>
        {loading ? (
          <Loader message='Loading doctors...' />
        ) : recentDoctors.length === 0 ? (
          <p className={styles.empty}>
            No doctors yet. Use “Add Doctor” to create the first profile.
          </p>
        ) : (
          <ul className={styles.doctorList}>
            {recentDoctors.map((doctor) => (
              <li key={doctor.id} className={styles.doctorRow}>
                <img
                  src={resolveDoctorImage(doctor.image)}
                  alt=''
                  className={styles.doctorThumb}
                />
                <div className={styles.doctorInfo}>
                  <p className={styles.doctorName}>
                    {doctor.name_en || doctor.name_ar || 'Unnamed doctor'}
                  </p>
                  <p className={styles.doctorSpecialty}>
                    {doctor.specialty_en || '—'}
                  </p>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    !doctor.status || doctor.status === 'published'
                      ? styles.published
                      : styles.draft
                  }`}
                >
                  {!doctor.status || doctor.status === 'published'
                    ? 'Published'
                    : doctor.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  )
}
