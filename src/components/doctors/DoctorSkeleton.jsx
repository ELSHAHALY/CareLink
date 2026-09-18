import styles from './DoctorSkeleton.module.css'

export default function DoctorSkeleton() {
  return (
    <div className={styles.grid}>
      {[1, 2, 3].map((i) => (
        <article key={i} className={styles.card}>
          <div className={styles.imageWrapper}>
            <div className={`${styles.skeleton} ${styles.image}`} />
          </div>
          <div className={styles.content}>
            <div className={`${styles.skeleton} ${styles.name}`} />
            <div className={`${styles.skeleton} ${styles.specialty}`} />
            <div className={styles.rating}>
              <div className={`${styles.skeleton} ${styles.ratingBar}`} />
              <div className={`${styles.skeleton} ${styles.ratingText}`} />
            </div>
            <div className={`${styles.skeleton} ${styles.location}`} />
            <div className={`${styles.skeleton} ${styles.availability}`} />
            <div className={`${styles.skeleton} ${styles.button}`} />
          </div>
        </article>
      ))}
    </div>
  )
}
