import { FiCheck, FiX } from 'react-icons/fi'
import styles from './PasswordStrength.module.css'

export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '#ced4da' }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  }

  score = Object.values(checks).filter(Boolean).length

  if (password.length >= 12) score = Math.min(score + 1, 5)
  if (password.length >= 16) score = Math.min(score + 1, 5)

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd']

  return {
    score: Math.min(score, 5),
    label: labels[Math.min(score, 5) - 1] || '',
    color: colors[Math.min(score, 5) - 1] || '#ced4da',
    checks,
  }
}

export default function PasswordStrength({ password }) {
  const { score, label, color, checks } = calculatePasswordStrength(password)

  if (!password) return null

  return (
    <div
      className={styles.container}
      role='progressbar'
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-label='Password strength'
    >
      <div className={styles.bar}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`${styles.segment} ${i <= score ? styles.filled : ''}`}
            style={{ backgroundColor: i <= score ? color : undefined }}
          />
        ))}
      </div>
      <div className={styles.label} style={{ color }}>
        {label}
      </div>
      <ul className={styles.checklist}>
        {Object.entries(checks).map(([key, passed]) => (
          <li
            key={key}
            className={`${styles.checkItem} ${passed ? styles.passed : ''}`}
          >
            <span className={styles.checkIcon}>
              {passed ? <FiCheck /> : <FiX />}
            </span>
            <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}