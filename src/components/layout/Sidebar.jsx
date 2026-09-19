import { NavLink, Link } from 'react-router-dom'
import { 
  FiHome, 
  FiSearch, 
  FiCalendar, 
  FiUser, 
  FiUsers, 
  FiLogOut 
} from 'react-icons/fi'
import useAuth from '../../hooks/useAuth'
import logoIcon from '../../assets/logo-icon.png'
import styles from './Sidebar.module.css'

const PATIENT_LINKS = [
  { to: '/dashboard', label: 'Overview', end: true, icon: FiHome },
  { to: '/doctors', label: 'Find a Doctor', icon: FiSearch },
  { to: '/appointments', label: 'My Appointments', icon: FiCalendar },
  { to: '/profile', label: 'Profile', icon: FiUser },
]

const DOCTOR_LINKS = [
  { to: '/doctor/dashboard', label: 'Overview', end: true, icon: FiHome },
  { to: '/doctor/appointments', label: 'Appointments', icon: FiCalendar },
  { to: '/doctor/profile', label: 'My Profile', icon: FiUser },
]

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', end: true, icon: FiHome },
  { to: '/admin/doctors', label: 'Doctors', icon: FiUsers },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const links =
    user?.role === 'admin'
      ? ADMIN_LINKS
      : user?.role === 'doctor'
      ? DOCTOR_LINKS
      : PATIENT_LINKS

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
          <Link
            to={user?.role === 'admin' ? '/admin' : '/dashboard'}
            className={styles.logo}
            onClick={onClose}
          >
            <img
              src={logoIcon}
              alt='CareLink logo'
              className={styles.logoIcon}
            />
            Care<span>Link</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {links.map((link) => {
            const IconComponent = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
                onClick={onClose}
              >
                {IconComponent && <IconComponent className={styles.navIcon} />}
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className={styles.footer}>
          {user && (
            <div className={styles.userBlock}>
              <div className={styles.userAvatar}>
                <FiUser />
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{user.name}</p>
                <p className={styles.userRole}>{user.role}</p>
              </div>
            </div>
          )}
          <button
            type='button'
            className={styles.logoutBtn}
            onClick={() => {
              logout()
              onClose()
            }}
          >
            <FiLogOut className={styles.logoutIcon} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}