import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DoctorFilterBar from '../components/doctors/DoctorFilterBar'
import DoctorList from '../components/doctors/DoctorList'
import doctorsData from '../data/doctors.json'

import '../styles/doctors.css'

export default function DoctorsList() {
const doctors = doctorsData.doctors;
  // Seed the filters from the URL once on load, so a search or specialty
  // picked on the Home page arrives here already applied.
  const [searchParams] = useSearchParams()

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || '',
    availability: '',
    rating: '',
  })

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      specialty: '',
      availability: '',
      rating: '',
    })
  }

  return (
    <main className='doctors-page'>
      <div className='doctors-container'>
        <header className='doctors-header'>
          <p className='doctors-header__eyebrow'>CARELINK</p>

          <h1>Find Your Doctor</h1>

          <p>Find the right healthcare professional for your needs.</p>
        </header>

        <DoctorFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <div className='doctors-results-header'>
          <h2>Our Doctors</h2>
          <span>{doctors.length} Doctors</span>
        </div>

        <DoctorList doctors={doctors} />
      </div>
    </main>
  )
}
