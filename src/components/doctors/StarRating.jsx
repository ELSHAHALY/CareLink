import { useMemo } from 'react'
import styles from './StarRating.module.css'
import {
  averageScore,
  filterPublishedRatings,
  isVerifiedRating,
  toUiRating,
} from '../../utils/ratings'

export function calculateRatings(ratings = [], appointments = []) {
  const normalized = (ratings || []).map(toUiRating).filter(Boolean)
  const published = filterPublishedRatings(normalized)

  if (published.length === 0) {
    return {
      average: 0,
      count: 0,
      validRatings: [],
      verifiedRatings: [],
      legacyRatings: [],
    }
  }

  const verifiedRatings = published.filter((r) =>
    isVerifiedRating(r, appointments),
  )
  const legacyRatings = published.filter(
    (r) => r.source === 'legacy_demo' || r.isVerified === false,
  )
  const { average, count } = averageScore(published)

  return {
    average,
    count,
    validRatings: published,
    verifiedRatings,
    legacyRatings,
  }
}

export default function StarRating({ ratings = [], appointments = [] }) {
  const { average, count } = useMemo(() => {
    return calculateRatings(ratings, appointments)
  }, [ratings, appointments])

  const renderStar = (index) => {
    const fillPercentage = Math.min(100, Math.max(0, (average - index) * 100))
    const gradientId = `star-gradient-${index}`

    return (
      <svg
        key={index}
        width='20'
        height='20'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
        className={styles.starIcon}
        aria-hidden='true'
      >
        <defs>
          <linearGradient id={gradientId}>
            <stop offset={`${fillPercentage}%`} stopColor='#f59e0b' />
            <stop offset={`${fillPercentage}%`} stopColor='#e5e7eb' />
          </linearGradient>
        </defs>
        <path
          d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
          fill={`url(#${gradientId})`}
          stroke='#f59e0b'
          strokeWidth='0.5'
        />
      </svg>
    )
  }

  return (
    <div
      className={styles.starRating}
      role='img'
      aria-label={`Rating: ${average.toFixed(
        1,
      )} out of 5 stars based on ${count} reviews`}
    >
      <div className={styles.starRatingStars}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      <span className={styles.starRatingValue}>{average.toFixed(1)}</span>
      <span className={styles.starRatingCount}>
        ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  )
}
