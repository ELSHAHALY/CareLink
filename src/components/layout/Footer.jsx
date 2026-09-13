import '../../styles/footer.css'

export default function Footer() {
  return (
    <footer className='footer'>
      <div className='footer__container'>
        {/* Brand */}
        <div className='footer__brand'>
          <a href='/' className='footer__logo'>
            Care<span>Link</span>
          </a>

          <p className='footer__description'>
            Connecting you with trusted healthcare professionals, whenever you
            need them.
          </p>
        </div>

        {/* Quick Links */}
        <div className='footer__section'>
          <h3>Quick Links</h3>

          <ul>
            <li>
              <a href='/'>Home</a>
            </li>
            <li>
              <a href='/doctors'>Find a Doctor</a>
            </li>
            <li>
              <a href='/services'>Services</a>
            </li>
            <li>
              <a href='/about'>About Us</a>
            </li>
          </ul>
        </div>

        {/* For Patients */}
        <div className='footer__section'>
          <h3>For Patients</h3>

          <ul>
            <li>
              <a href='/doctors'>Find a Doctor</a>
            </li>
            <li>
              <a href='/appointments'>Appointments</a>
            </li>
            <li>
              <a href='/health-tips'>Health Tips</a>
            </li>
            <li>
              <a href='/help'>Help Center</a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className='footer__section footer__contact'>
          <h3>Contact Us</h3>

          <p>hello@carelink.com</p>
          <p>+20 100 000 0000</p>
          <p>Cairo, Egypt</p>
        </div>
      </div>

      {/* Bottom */}
      <div className='footer__bottom'>
        <p>© 2026 CareLink. All rights reserved.</p>

        <div className='footer__legal'>
          <a href='/privacy'>Privacy Policy</a>
          <a href='/terms'>Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
