import { NavLink, Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import logoIcon from '../../assets/logo-icon.png'
import styles from './Sidebar.module.css'

const PATIENT_LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/doctors', label: 'Find a Doctor' },
  { to: '/appointments', label: 'My Appointments' },
  { to: '/profile', label: 'Profile' },
]

const DOCTOR_LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', end: true },
  { to: '/doctor/appointments', label: 'Appointments' },
  { to: '/doctor/profile', label: 'Profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const links = user?.role === 'doctor' ? DOCTOR_LINKS : PATIENT_LINKS

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden='true' />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        aria-label='Dashboard navigation'
      >
        <div className={styles.header}>
          <Link to='/' className={styles.logo}>
            <img
              src={logoIcon}
              alt='CareLink logo'
              className={styles.logoIcon}
            />
            Care<span>Link</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={onClose}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          {user && <p className={styles.userName}>{user.name}</p>}
          <button
            type='button'
            className={styles.logoutBtn}
            onClick={() => {
              logout()
              onClose()
            }}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
