import styles from './Badge.module.css'

const STATUS_MAP = {
  scheduled: { label: 'Scheduled', className: styles.scheduled },
  completed: { label: 'Completed', className: styles.completed },
  cancelled: { label: 'Cancelled', className: styles.cancelled },
}

export default function Badge({ status }) {
  const config = STATUS_MAP[status] || STATUS_MAP.scheduled

  return (
    <span
      className={`${styles.badge} ${config.className}`}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
