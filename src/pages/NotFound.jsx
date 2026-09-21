import { Link } from 'react-router-dom'
import { FaExclamationTriangle, FaHome } from 'react-icons/fa'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <FaExclamationTriangle className={styles.icon} />
        </div>
        <h1 className={styles.title}>404</h1>
        <p className={styles.message}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link to='/' className={styles.homeLink}>
          <FaHome />
          <span>Go back home</span>
        </Link>
      </div>
    </div>
  )
}