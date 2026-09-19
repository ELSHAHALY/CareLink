import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaSearch, 
  FaHeartbeat, 
  FaBandAid, 
  FaBrain, 
  FaTooth, 
  FaChild, 
  FaBone 
} from 'react-icons/fa'
import styles from './Home.module.css'

const STATS = [
  { value: '500+', label: 'Verified Doctors' },
  { value: '10K+', label: 'Happy Patients' },
  { value: '4.8/5', label: 'Average Rating' },
  { value: '24/7', label: 'Online Support' },
]

const STEPS = [
  {
    number: '01',
    title: 'Search',
    text: 'Browse doctors by specialty, location, or availability to find the right fit.',
  },
  {
    number: '02',
    title: 'Book',
    text: 'Pick a convenient time slot and confirm your appointment in a few clicks.',
  },
  {
    number: '03',
    title: 'Visit',
    text: 'Get a reminder and show up — your appointment details are always in your dashboard.',
  },
]

const SPECIALTIES = [
  { name: 'Cardiology', icon: <FaHeartbeat />, value: 'Cardiologist' },
  { name: 'Dermatology', icon: <FaBandAid />, value: 'Dermatologist' },
  { name: 'Neurology', icon: <FaBrain />, value: 'Neurologist' },
  { name: 'Dentistry', icon: <FaTooth />, value: 'Dentist' },
  { name: 'Pediatrics', icon: <FaChild />, value: '' },
  { name: 'Orthopedics', icon: <FaBone />, value: '' },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  function handleSearchSubmit(e) {
    e.preventDefault()
    const query = search.trim()
    navigate(
      query ? `/doctors?search=${encodeURIComponent(query)}` : '/doctors',
    )
  }

  return (
    <div className={styles.home}>
      <section className={styles.homeHero}>
        <div className={styles.homeHeroContainer}>
          <p className={styles.homeHeroEyebrow}>CARELINK</p>
          <h1 className={styles.homeHeroTitle}>
            Find the right doctor, right when you need one.
          </h1>
          <p className={styles.homeHeroSubtitle}>
            Search trusted healthcare providers, check real-time availability,
            and book your appointment online in minutes.
          </p>

          <form className={styles.homeHeroSearch} onSubmit={handleSearchSubmit}>
            <div className={styles.homeHeroSearchWrapper}>
              <FaSearch className={styles.homeHeroSearchIcon} />
              <input
                type='text'
                className={styles.homeHeroSearchInput}
                placeholder='Search by doctor name or specialty...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label='Search for a doctor or specialty'
              />
            </div>
            <button type='submit' className={styles.homeHeroSearchBtn}>
              Search
            </button>
          </form>

          <div className={styles.homeHeroActions}>
            <Link to='/doctors' className={`${styles.homeBtn} ${styles.homeBtnPrimary}`}>
              Find a Doctor
            </Link>
            <Link to='/login' className={`${styles.homeBtn} ${styles.homeBtnGhost}`}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.homeStats}>
        <div className={styles.homeStatsContainer}>
          {STATS.map((stat) => (
            <div className={styles.homeStatsItem} key={stat.label}>
              <span className={styles.homeStatsValue}>{stat.value}</span>
              <span className={styles.homeStatsLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.homeSection}>
        <div className={styles.homeSectionContainer}>
          <p className={styles.homeSectionEyebrow}>HOW IT WORKS</p>
          <h2 className={styles.homeSectionTitle}>
            Booking an appointment takes three simple steps
          </h2>

          <div className={styles.homeSteps}>
            {STEPS.map((step) => (
              <div className={styles.homeStep} key={step.number}>
                <span className={styles.homeStepNumber}>{step.number}</span>
                <h3 className={styles.homeStepTitle}>{step.title}</h3>
                <p className={styles.homeStepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.homeSection} ${styles.homeSectionMuted}`}>
        <div className={styles.homeSectionContainer}>
          <p className={styles.homeSectionEyebrow}>SPECIALTIES</p>
          <h2 className={styles.homeSectionTitle}>Browse doctors by specialty</h2>

          <div className={styles.homeSpecialties}>
            {SPECIALTIES.map((specialty) => (
              <Link
                to={
                  specialty.value
                    ? `/doctors?specialty=${encodeURIComponent(
                        specialty.value,
                      )}`
                    : '/doctors'
                }
                className={styles.homeSpecialtyCard}
                key={specialty.name}
              >
                <span className={styles.homeSpecialtyCardIcon}>
                  {specialty.icon}
                </span>
                <span className={styles.homeSpecialtyCardName}>
                  {specialty.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.homeCta}>
        <div className={styles.homeCtaContainer}>
          <h2 className={styles.homeCtaTitle}>
            Ready to book your next appointment?
          </h2>
          <p className={styles.homeCtaText}>
            Join thousands of patients who trust CareLink to manage their
            healthcare.
          </p>
          <Link to='/doctors' className={`${styles.homeBtn} ${styles.homeBtnPrimary}`}>
            Book an Appointment
          </Link>
        </div>
      </section>
    </div>
  )
}