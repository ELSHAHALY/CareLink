import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import logoIcon from '../../assets/logo-icon.png'
import '../../styles/navbar.css'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/doctors', label: 'Find a Doctor' },
  { to: '/appointments', label: 'My Appointments' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Close the mobile menu whenever the route changes (link click)
  function handleLinkClick() {
    setIsOpen(false)
  }

  // Prevent background scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  function handleLogout() {
    logout()
    setIsOpen(false)
    navigate('/')
  }

  return (
    <header className='navbar'>
      <div className='navbar__container'>
        <Link to='/' className='navbar__logo' onClick={handleLinkClick}>
          <img
            src={logoIcon}
            alt='CareLink logo'
            className='navbar__logo-icon'
          />
          Care<span>Link</span>
        </Link>

        {/* Desktop links */}
        <nav className='navbar__links' aria-label='Primary navigation'>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                'navbar__link' + (isActive ? ' navbar__link--active' : '')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className='navbar__actions'>
          {user ? (
            <>
              <Link to='/dashboard' className='navbar__user'>
                Hi, {user.name}
              </Link>
              <button
                className='navbar__btn navbar__btn--ghost'
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to='/login' className='navbar__btn navbar__btn--ghost'>
                Login
              </Link>
              <Link to='/doctors' className='navbar__btn navbar__btn--primary'>
                Book Appointment
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={'navbar__toggle' + (isOpen ? ' navbar__toggle--open' : '')}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label='Toggle navigation menu'
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={'navbar__mobile' + (isOpen ? ' navbar__mobile--open' : '')}
      >
        <nav className='navbar__mobile-links' aria-label='Mobile navigation'>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                'navbar__mobile-link' +
                (isActive ? ' navbar__mobile-link--active' : '')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className='navbar__mobile-actions'>
          {user ? (
            <>
              <Link
                to='/dashboard'
                className='navbar__btn navbar__btn--ghost'
                onClick={handleLinkClick}
              >
                Dashboard
              </Link>
              <button
                className='navbar__btn navbar__btn--primary'
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to='/login'
                className='navbar__btn navbar__btn--ghost'
                onClick={handleLinkClick}
              >
                Login
              </Link>
              <Link
                to='/doctors'
                className='navbar__btn navbar__btn--primary'
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
