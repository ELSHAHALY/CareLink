import { useEffect, useState } from 'react'
import doctorsData from '../data/doctors.json'

export default function useDoctors(filters) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true)
        setError(null)

        //! This will be replaced inCase using API
        await new Promise((resolve) => setTimeout(resolve, 500))

        setDoctors(doctorsData.doctors)
      } catch (error) {
        setError('Failed To Load Doctors', error)
      } finally {
        setLoading(false)
      }
    }

    loadDoctors()
  }, [])

  const filteredDoctors = doctors.filter((doctor) => {
    const searchTerm = filters.search.toLowerCase().trim()

    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm) ||
      doctor.specialty.toLowerCase().includes(searchTerm)

    const matchesSpecialty =
      !filters.specialty || doctor.specialty === filters.specialty

    const matchesCity = !filters.city || doctor.location.city === filters.city

    const matchesRating =
      !filters.rating || doctor.rating >= Number(filters.rating)

    return matchesSearch && matchesSpecialty && matchesCity && matchesRating
  })

  return {
    doctors: filteredDoctors,
    loading,
    error,
  }
}
