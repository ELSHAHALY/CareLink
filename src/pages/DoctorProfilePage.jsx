import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import doctorsData from '../data/doctors.json'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import styles from './DoctorProfilePage.module.css'

export default function DoctorProfilePage() {
  const { user, loading } = useAuth()

  const doctor = useMemo(() => {
    if (!user?.doctorId) return null
    return doctorsData.doctors.find((d) => d.id === user.doctorId) || null
  }, [user?.doctorId])

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Loading profile...' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (user.role !== 'doctor') {
    return <Navigate to='/dashboard' replace />
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <p className={styles.error}>Doctor profile not found.</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>My Profile</h1>

        <section className={styles.card}>
          <div className={styles.header}>
            <img
              src={`/${doctor.image}`}
              alt={doctor.name}
              className={styles.avatar}
            />
            <div className={styles.headerInfo}>
              <h2 className={styles.name}>{doctor.name}</h2>
              <p className={styles.specialty}>{doctor.specialty}</p>
              <p className={styles.experience}>
                {doctor.yearsOfExperience} years of experience
              </p>
            </div>
          </div>

          <p className={styles.bio}>{doctor.bio}</p>

          <dl className={styles.details}>
            <div className={styles.detailRow}>
              <dt>Email</dt>
              <dd>{doctor.email}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Phone</dt>
              <dd>{doctor.phone}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Location</dt>
              <dd>
                {doctor.location.address}, {doctor.location.city},{' '}
                {doctor.location.state} {doctor.location.zip}
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Languages</dt>
              <dd>{doctor.languages.join(', ')}</dd>
            </div>
            {doctor.specializations && (
              <div className={styles.detailRow}>
                <dt>Specializations</dt>
                <dd>{doctor.specializations.join(', ')}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </DashboardLayout>
  )
}
