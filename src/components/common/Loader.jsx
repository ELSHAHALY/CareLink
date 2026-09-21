import styles from './Loader.module.css'

export default function Loader({ message = 'Loading...' }) {
  return (
    <div className={styles.wrapper} role='status' aria-label={message}>
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  )
}