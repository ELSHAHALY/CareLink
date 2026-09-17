import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { useDoctorById } from '../hooks/useDoctors'
import { resolveDoctorImage } from '../utils/doctors'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import styles from './DoctorProfilePage.module.css'

export default function DoctorProfilePage() {
  const { user, loading } = useAuth()
  const { doctor, loading: doctorLoading } = useDoctorById(user?.doctorId)

  if (loading || (user?.role === 'doctor' && user?.doctorId && doctorLoading)) {
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
    if (user.role === 'admin') return <Navigate to='/admin/doctors' replace />
    return <Navigate to='/dashboard' replace />
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <p className={styles.error}>
          Doctor profile not found. Ask your admin to link your account to a
          doctor in the catalog.
        </p>
      </DashboardLayout>
    )
  }

  const languages = doctor.languages || []
  const location = doctor.location || {}

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>My Profile</h1>

        <section className={styles.card}>
          <div className={styles.header}>
            {resolveDoctorImage(doctor.image) && (
              <img
                src={resolveDoctorImage(doctor.image)}
                alt={doctor.name}
                className={styles.avatar}
              />
            )}
            <div className={styles.headerInfo}>
              <h2 className={styles.name}>{doctor.name}</h2>
              {doctor.specialty && (
                <p className={styles.specialty}>{doctor.specialty}</p>
              )}
              {doctor.yearsOfExperience > 0 && (
                <p className={styles.experience}>
                  {doctor.yearsOfExperience} years of experience
                </p>
              )}
            </div>
          </div>

          {doctor.bio && <p className={styles.bio}>{doctor.bio}</p>}

          <dl className={styles.details}>
            <div className={styles.detailRow}>
              <dt>Account email</dt>
              <dd>{user.email}</dd>
            </div>
            {doctor.email && (
              <div className={styles.detailRow}>
                <dt>Email</dt>
                <dd>{doctor.email}</dd>
              </div>
            )}
            {doctor.phone && (
              <div className={styles.detailRow}>
                <dt>Phone</dt>
                <dd>{doctor.phone}</dd>
              </div>
            )}
            {(location.address || location.city) && (
              <div className={styles.detailRow}>
                <dt>Location</dt>
                <dd>
                  {[
                    location.address,
                    location.city,
                    location.state,
                    location.zip,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </dd>
              </div>
            )}
            {languages.length > 0 && (
              <div className={styles.detailRow}>
                <dt>Languages</dt>
                <dd>{languages.join(', ')}</dd>
              </div>
            )}
            {doctor.specializations && doctor.specializations.length > 0 && (
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
