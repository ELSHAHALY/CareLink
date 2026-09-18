import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../../hooks/useFavorites'
import { useDoctorsCatalog } from '../../hooks/useDoctorsCatalog'
import ratingsData from '../../data/ratings.json'
import appointmentsData from '../../data/appointments.json'
import { calculateRatings } from '../doctors/StarRating'
import { resolveDoctorImage } from '../../utils/doctors'
import EmptyState from '../common/EmptyState'
import styles from './FavoriteDoctors.module.css'

export default function FavoriteDoctors() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const { doctorMap } = useDoctorsCatalog()

  const favoriteDoctors = useMemo(() => {
    return favorites
      .map((id) => doctorMap[id])
      .filter(Boolean)
      .slice(0, 3)
  }, [favorites, doctorMap])

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
        <h2 className={styles.title}>Favorite Doctors</h2>
        <EmptyState
          icon='⭐'
          message='No favorite doctors yet. Explore doctors and save your favorites here.'
        />
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Favorite Doctors</h2>
      <div className={styles.grid}>
        {favoriteDoctors.map((doctor) => {
          const { average, count } = getDoctorRating(doctor.id)
          return (
            <div key={doctor.id} className={styles.card}>
              <img
                src={resolveDoctorImage(doctor.image)}
                alt={doctor.name}
                className={styles.image}
              />
              <div className={styles.cardBody}>
                <p className={styles.name}>{doctor.name}</p>
                <p className={styles.specialty}>{doctor.specialty}</p>
                {count > 0 && (
                  <p className={styles.rating}>
                    ★ {average.toFixed(1)}{' '}
                    <span className={styles.reviewCount}>
                      ({count} review{count !== 1 ? 's' : ''})
                    </span>
                  </p>
                )}
                <div className={styles.actions}>
                  <Link to={`/doctors/${doctor.id}`} className={styles.viewBtn}>
                    View Profile
                  </Link>
                  <button
                    type='button'
                    className={styles.favBtn}
                    onClick={() => toggleFavorite(doctor.id)}
                    aria-label={
                      isFavorite(doctor.id)
                        ? `Remove ${doctor.name} from favorites`
                        : `Add ${doctor.name} to favorites`
                    }
                  >
                    {isFavorite(doctor.id) ? '♥' : '♡'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
