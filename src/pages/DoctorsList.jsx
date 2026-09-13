import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DoctorFilterBar from '../components/doctors/DoctorFilterBar'
import DoctorList from '../components/doctors/DoctorList'
import useDoctors from '../hooks/useDoctors'
import '../styles/doctors.css'

export default function DoctorsList() {
  const [searchParams] = useSearchParams()

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || '',
    city: '',
    rating: '',
  })

  const { doctors: filteredDoctors, loading, error } = useDoctors(filters)

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
      city: '',
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
          <span>{filteredDoctors.length} Doctors</span>
        </div>

        {loading && <p>Loading doctors...</p>}
        {error && <p className='error-message'>{error}</p>}
        {!loading && !error && <DoctorList doctors={filteredDoctors} />}
      </div>
    </main>
  )
}
