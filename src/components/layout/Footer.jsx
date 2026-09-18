import { Link } from 'react-router-dom'
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerBrand}>
          <Link to='/' className={styles.footerLogo}>
            Care<span>Link</span>
          </Link>

          <p className={styles.footerDescription}>
            Connecting you with trusted healthcare professionals, whenever you
            need them.
          </p>
        </div>

        <div className={styles.footerSection}>
          <h3>Quick Links</h3>

          <ul>
            <li>
              <Link to='/'>Home</Link>
            </li>
            <li>
              <Link to='/doctors'>Find a Doctor</Link>
            </li>
            <li>
              <Link to='/services'>Services</Link>
            </li>
            <li>
              <Link to='/about'>About Us</Link>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h3>For Patients</h3>

          <ul>
            <li>
              <Link to='/doctors'>Find a Doctor</Link>
            </li>
            <li>
              <Link to='/appointments'>Appointments</Link>
            </li>
            <li>
              <Link to='/health-tips'>Health Tips</Link>
            </li>
            <li>
              <Link to='/help'>Help Center</Link>
            </li>
          </ul>
        </div>

        <div className={`${styles.footerSection} ${styles.footerContact}`}>
          <h3>
            <Link to='/contact'>Contact Us</Link>
          </h3>

          <p>
            <FaEnvelope className={styles.contactIcon} />
            <span>hello@carelink.com</span>
          </p>
          <p>
            <FaPhone className={styles.contactIcon} />
            <span>+20 100 000 0000</span>
          </p>
          <p>
            <FaMapMarkerAlt className={styles.contactIcon} />
            <span>Cairo, Egypt</span>
          </p>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© 2026 CareLink. All rights reserved.</p>

        <div className={styles.footerLegal}>
          <Link to='/privacy'>Privacy Policy</Link>
          <Link to='/terms'>Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}