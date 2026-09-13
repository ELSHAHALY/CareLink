import styles from './EmptyState.module.css'

export default function EmptyState({
  icon = '📋',
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon} aria-hidden='true'>
        {icon}
      </span>
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <button type='button' className={styles.button} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
