import { useMemo } from 'react'

export function calculateRatings(ratings = [], appointments = []) {
  const eligiblePatients = new Set(
    appointments
      .filter((apt) => apt.status === 'completed')
      .map((apt) => apt.patientId),
  )

  const validRatings = ratings.filter((r) => eligiblePatients.has(r.patientId))

  if (validRatings.length === 0) {
    return { average: 0, count: 0, validRatings: [] }
  }

  const sum = validRatings.reduce((acc, r) => acc + r.score, 0)
  return {
    average: sum / validRatings.length,
    count: validRatings.length,
    validRatings,
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
        width='22'
        height='22'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
        style={{ marginRight: 2 }}
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
      className='star-rating'
      role='img'
      aria-label={`Rating: ${average.toFixed(
        1,
      )} out of 5 stars based on ${count} reviews`}
    >
      <div className='star-rating__stars'>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      <span className='star-rating__value'>{average.toFixed(1)}</span>
      <span className='star-rating__count'>
        ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  )
}
