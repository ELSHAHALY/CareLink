import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  FaUser,
  FaSignOutAlt,
  FaChevronDown,
  FaRegCalendarAlt,
  FaIdCard,
  FaTimes,
} from 'react-icons/fa'
import useAuth from '../../hooks/useAuth'
import logoIcon from '../../assets/logo-icon.png'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/doctors', label: 'Find a Doctor' },
  { to: '/contact', label: 'Contact Us' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLinkClick() {
    setIsOpen(false)
    setDropdownOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    setIsOpen(false)
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link to='/' className={styles.logo} onClick={handleLinkClick}>
          <img src={logoIcon} alt='CareLink logo' className={styles.logoIcon} />
          Care<span>Link</span>
        </Link>

        <nav className={styles.links} aria-label='Primary navigation'>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                styles.link + (isActive ? ` ${styles.linkActive}` : '')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.userSection} ref={dropdownRef}>
              <button
                type='button'
                className={styles.userToggle}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className={styles.userAvatar}>
                  <FaUser />
                </div>
                <span className={styles.userName}>Hi, {user.name}</span>
                <FaChevronDown
                  className={`${styles.chevron} ${
                    dropdownOpen ? styles.chevronRotate : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user.name}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <Link
                    to='/appointments'
                    className={styles.dropdownItem}
                    onClick={handleLinkClick}
                  >
                    <FaRegCalendarAlt />
                    <span>My Appointments</span>
                  </Link>
                  <Link
                    to='/profile'
                    className={styles.dropdownItem}
                    onClick={handleLinkClick}
                  >
                    <FaIdCard />
                    <span>Profile</span>
                  </Link>
                  <div className={styles.dropdownDivider}></div>
                  <button
                    type='button'
                    className={styles.dropdownLogout}
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to='/login' className={`${styles.btn} ${styles.btnGhost}`}>
                Login
              </Link>
              <Link
                to='/doctors'
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Book Appointment
              </Link>
            </>
          )}
        </div>

        <button
          className={styles.toggle}
          onClick={() => setIsOpen(true)}
          aria-label='Open navigation menu'
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div
        className={
          styles.mobileOverlay + (isOpen ? ` ${styles.mobileOverlayOpen}` : '')
        }
        onClick={() => setIsOpen(false)}
      ></div>

      <div
        className={
          styles.mobileDrawer + (isOpen ? ` ${styles.mobileDrawerOpen}` : '')
        }
      >
        <div className={styles.mobileDrawerHeader}>
          <Link to='/' className={styles.logo} onClick={handleLinkClick}>
            <img
              src={logoIcon}
              alt='CareLink logo'
              className={styles.logoIcon}
            />
            Care<span>Link</span>
          </Link>
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label='Close navigation menu'
          >
            <FaTimes />
          </button>
        </div>

        {user && (
          <div className={styles.mobileUserProfile}>
            <div className={styles.mobileUserAvatar}>
              <FaUser />
            </div>
            <div className={styles.mobileUserInfo}>
              <p className={styles.mobileUserName}>{user.name}</p>
              <p className={styles.mobileUserEmail}>{user.email}</p>
            </div>
          </div>
        )}

        <nav className={styles.mobileLinks} aria-label='Mobile navigation'>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                styles.mobileLink +
                (isActive ? ` ${styles.mobileLinkActive}` : '')
              }
            >
              {link.label}
            </NavLink>
          ))}

          {user && (
            <>
              <div className={styles.mobileDivider}></div>
              <NavLink
                to='/my-appointments'
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  styles.mobileLink +
                  (isActive ? ` ${styles.mobileLinkActive}` : '')
                }
              >
                <FaRegCalendarAlt className={styles.mobileLinkIcon} />
                <span>My Appointments</span>
              </NavLink>
              <NavLink
                to='/profile'
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  styles.mobileLink +
                  (isActive ? ` ${styles.mobileLinkActive}` : '')
                }
              >
                <FaIdCard className={styles.mobileLinkIcon} />
                <span>Profile</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className={styles.mobileActions}>
          {user ? (
            <button
              type='button'
              className={styles.mobileLogoutBtn}
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          ) : (
            <>
              <Link
                to='/login'
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={handleLinkClick}
              >
                Login
              </Link>
              <Link
                to='/doctors'
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleLinkClick}
              >
                Book Appointment
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
