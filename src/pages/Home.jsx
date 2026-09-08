import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/home.css'

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
  { name: 'Cardiology', icon: '❤️' },
  { name: 'Dermatology', icon: '🩹' },
  { name: 'Neurology', icon: '🧠' },
  { name: 'Dentistry', icon: '🦷' },
  { name: 'Pediatrics', icon: '🧒' },
  { name: 'Orthopedics', icon: '🦴' },
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
    <div className='home'>
      {/* Hero */}
      <section className='home-hero'>
        <div className='home-hero__container'>
          <p className='home-hero__eyebrow'>CARELINK</p>
          <h1 className='home-hero__title'>
            Find the right doctor, right when you need one.
          </h1>
          <p className='home-hero__subtitle'>
            Search trusted healthcare providers, check real-time availability,
            and book your appointment online in minutes.
          </p>

          <form className='home-hero__search' onSubmit={handleSearchSubmit}>
            <input
              type='text'
              className='home-hero__search-input'
              placeholder='Search by doctor name or specialty...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label='Search for a doctor or specialty'
            />
            <button type='submit' className='home-hero__search-btn'>
              Search
            </button>
          </form>

          <div className='home-hero__actions'>
            <Link to='/doctors' className='home-btn home-btn--primary'>
              Find a Doctor
            </Link>
            <Link to='/login' className='home-btn home-btn--ghost'>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className='home-stats'>
        <div className='home-stats__container'>
          {STATS.map((stat) => (
            <div className='home-stats__item' key={stat.label}>
              <span className='home-stats__value'>{stat.value}</span>
              <span className='home-stats__label'>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className='home-section'>
        <div className='home-section__container'>
          <p className='home-section__eyebrow'>HOW IT WORKS</p>
          <h2 className='home-section__title'>
            Booking an appointment takes three simple steps
          </h2>

          <div className='home-steps'>
            {STEPS.map((step) => (
              <div className='home-step' key={step.number}>
                <span className='home-step__number'>{step.number}</span>
                <h3 className='home-step__title'>{step.title}</h3>
                <p className='home-step__text'>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className='home-section home-section--muted'>
        <div className='home-section__container'>
          <p className='home-section__eyebrow'>SPECIALTIES</p>
          <h2 className='home-section__title'>Browse doctors by specialty</h2>

          <div className='home-specialties'>
            {SPECIALTIES.map((specialty) => (
              <Link
                to='/doctors'
                className='home-specialty-card'
                key={specialty.name}
              >
                <span className='home-specialty-card__icon'>
                  {specialty.icon}
                </span>
                <span className='home-specialty-card__name'>
                  {specialty.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className='home-cta'>
        <div className='home-cta__container'>
          <h2 className='home-cta__title'>
            Ready to book your next appointment?
          </h2>
          <p className='home-cta__text'>
            Join thousands of patients who trust CareLink to manage their
            healthcare.
          </p>
          <Link to='/doctors' className='home-btn home-btn--primary'>
            Book an Appointment
          </Link>
        </div>
      </section>
    </div>
  )
}
