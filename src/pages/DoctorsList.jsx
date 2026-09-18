import { useState, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import DoctorFilterBar from '../components/doctors/DoctorFilterBar'
import DoctorList from '../components/doctors/DoctorList'
import DoctorSkeleton from '../components/doctors/DoctorSkeleton'
import useDoctors from '../hooks/useDoctors'
import { AppointmentContext } from '../context/AppointmentContext'
import '../styles/doctors.css'
import Pagination from '../components/doctors/Pagination'
import ratingsData from '../data/ratings.json'

export default function DoctorsList() {
  const [searchParams] = useSearchParams()
  const { appointments } = useContext(AppointmentContext)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || '',
    city: '',
    rating: '',
  })

  const { doctors: filteredDoctors, loading, error } = useDoctors(filters)

  const [currentPage, setCurrentPage] = useState(1)
  const doctorsPerPage = 6

  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage)

  const startIndex = (currentPage - 1) * doctorsPerPage

  const paginatedDoctors = filteredDoctors.slice(
    startIndex,
    startIndex + doctorsPerPage,
  )

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))

    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      specialty: '',
      city: '',
      rating: '',
    })
    setCurrentPage(1)
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

        {loading && <DoctorSkeleton />}

        {error && <p className='error-message'>{error}</p>}

        {!loading && !error && filteredDoctors.length === 0 && (
          <p>No Doctors Found.</p>
        )}

        {!loading && !error && filteredDoctors.length > 0 && (
          <>
            <DoctorList
              doctors={paginatedDoctors}
              ratings={ratingsData.ratings}
              appointments={appointments}
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </main>
  )
}
