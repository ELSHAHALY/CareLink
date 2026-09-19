import { FiInbox } from 'react-icons/fi'
import styles from './EmptyState.module.css'

export default function EmptyState({
  icon,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconContainer} aria-hidden='true'>
        {icon || <FiInbox className={styles.icon} />}
      </div>
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <button type='button' className={styles.button} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}