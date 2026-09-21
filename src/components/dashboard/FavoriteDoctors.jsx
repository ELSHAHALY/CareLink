import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../../hooks/useFavorites'
import { useDoctorsCatalog } from '../../hooks/useDoctorsCatalog'
import { useRatings } from '../../hooks/useRatings'
import { calculateRatings } from '../doctors/StarRating'
import { resolveDoctorImage } from '../../utils/doctors'
import EmptyState from '../common/EmptyState'
import styles from './FavoriteDoctors.module.css'

export default function FavoriteDoctors() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const { doctorMap } = useDoctorsCatalog()
  const { ratingsByDoctor } = useRatings()

  const favoriteDoctors = useMemo(() => {
    return favorites
      .map((id) => doctorMap[id])
      .filter(Boolean)
      .slice(0, 3)
  }, [favorites, doctorMap])

  function getDoctorRating(doctorId) {
    const doctorRatings = ratingsByDoctor[String(doctorId)] || []
    const { average, count } = calculateRatings(doctorRatings, [])
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
<<<<<<< Updated upstream
=======
              <div className={styles.imageWrapper}>
                <img
                  src={`/${doctor.image}`}
                  alt={doctor.name}
                  className={styles.image}
                />
                <button
                  type='button'
                  className={`${styles.favBtn} ${
                    favorited ? styles.favorited : ''
                  }`}
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
>>>>>>> Stashed changes
              <div className={styles.cardBody}>
                <p className={styles.name}>{doctor.name}</p>
                <p className={styles.specialty}>{doctor.specialty}</p>
                {count > 0 && (
<<<<<<< Updated upstream
                  <p className={styles.rating}>
                    ★ {average.toFixed(1)}{' '}
=======
                  <div className={styles.ratingWrapper}>
                    <FiStar className={styles.starIcon} />
                    <span className={styles.ratingScore}>
                      {average.toFixed(1)}
                    </span>
>>>>>>> Stashed changes
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
