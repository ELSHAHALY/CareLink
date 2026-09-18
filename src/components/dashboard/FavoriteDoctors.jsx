import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiStar, FiHeart, FiBookmark } from 'react-icons/fi'
import { useFavorites } from '../../hooks/useFavorites'
import doctorsData from '../../data/doctors.json'
import ratingsData from '../../data/ratings.json'
import appointmentsData from '../../data/appointments.json'
import { calculateRatings } from '../doctors/StarRating'
import EmptyState from '../common/EmptyState'
import styles from './FavoriteDoctors.module.css'

export default function FavoriteDoctors() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites()

  const favoriteDoctors = useMemo(() => {
    return favorites
      .map((id) => doctorsData.doctors.find((d) => d.id === id))
      .filter(Boolean)
      .slice(0, 3)
  }, [favorites])

  function getDoctorRating(doctorId) {
    const doctorRatings = ratingsData.ratings.filter(
      (r) => r.doctorId === doctorId,
    )
    const doctorAppointments = appointmentsData.appointments.filter(
      (a) => a.doctorId === doctorId,
    )
    const { average, count } = calculateRatings(
      doctorRatings,
      doctorAppointments,
    )
    return { average, count }
  }

  if (favoriteDoctors.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <span className={styles.titleIcon}>
              <FiBookmark />
            </span>
            <h2 className={styles.title}>Favorite Doctors</h2>
          </div>
        </div>
        <div className={styles.emptyCard}>
          <EmptyState
            icon={<FiHeart />}
            message='No favorite doctors yet. Explore doctors and save your favorites here.'
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
            <FiBookmark />
          </span>
          <h2 className={styles.title}>Favorite Doctors</h2>
        </div>
      </div>
      <div className={styles.grid}>
        {favoriteDoctors.map((doctor) => {
          const { average, count } = getDoctorRating(doctor.id)
          const favorited = isFavorite(doctor.id)
          return (
            <div key={doctor.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img
                  src={`/${doctor.image}`}
                  alt={doctor.name}
                  className={styles.image}
                />
                <button
                  type='button'
                  className={`${styles.favBtn} ${favorited ? styles.favorited : ''}`}
                  onClick={() => toggleFavorite(doctor.id)}
                  aria-label={
                    favorited
                      ? `Remove ${doctor.name} from favorites`
                      : `Add ${doctor.name} to favorites`
                  }
                >
                  <FiHeart className={styles.favIcon} />
                </button>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.name}>{doctor.name}</p>
                <p className={styles.specialty}>{doctor.specialty}</p>
                {count > 0 && (
                  <div className={styles.ratingWrapper}>
                    <FiStar className={styles.starIcon} />
                    <span className={styles.ratingScore}>{average.toFixed(1)}</span>
                    <span className={styles.reviewCount}>
                      ({count} review{count !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
                <div className={styles.actions}>
                  <Link to={`/doctors/${doctor.id}`} className={styles.viewBtn}>
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}