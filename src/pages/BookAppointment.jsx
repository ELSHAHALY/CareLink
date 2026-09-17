import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppointmentForm from '../components/appointments/AppointmentForm'
import TimeSlotPicker from '../components/appointments/TimeSlotPicker'
import useAuth from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import styles from './BookAppointment.module.css'

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function BookAppointment() {
  const location = useLocation()
  const doctor = location.state?.doctor

  const { user } = useAuth()
  const { appointments, createAppointment } = useAppointments()

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [submissionError, setSubmissionError] = useState(null)
  const [confirmedAppointment, setConfirmedAppointment] = useState(null)

  const minimumDate = getLocalDateString()

  const handleDateChange = (event) => {
    const nextDate = event.target.value
    if (nextDate && nextDate < minimumDate) {
      return
    }
    setSelectedDate(nextDate)
    setSelectedTime('')
    setSubmissionError(null)
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setSubmissionError(null)
  }

  const handleBookingSubmit = async (patientData) => {
    setSubmissionError(null)

    if (!doctor || !selectedDate || !selectedTime) {
      setSubmissionError('Select a doctor, date, and time before booking.')
      return
    }

    const result = await createAppointment({
      doctorId: doctor.id,
      date: selectedDate,
      time: selectedTime,
      type: patientData.type,
      patientName: patientData.patientName,
      patientEmail: patientData.patientEmail,
      patientPhone: patientData.patientPhone,
      notes: patientData.notes,
    })

    if (!result.success) {
      setSubmissionError(result.error)
      return
    }

    setConfirmedAppointment(result.appointment)
    setSubmissionError(null)
  }

  const handleBookAnother = () => {
    setConfirmedAppointment(null)
    setSelectedDate('')
    setSelectedTime('')
    setSubmissionError(null)
  }

  const initialValues = {
    patientName: user?.name ?? '',
    patientEmail: user?.email ?? '',
  }

  return (
    <div className={styles.bookAppointmentPage}>
      <h1>Book an Appointment</h1>

      <section aria-label='Doctor information'>
        <h2>Doctor</h2>
        {doctor ? (
          <p>
            {doctor.name} — {doctor.specialty}
          </p>
        ) : (
          <p className={styles.placeholderText}>
            Doctor details will appear here once a doctor is selected.
          </p>
        )}
      </section>

      <section aria-label='Date selection'>
        <h2>Select a Date</h2>
        <label htmlFor='appointment-date'>Appointment date</label>
        <input
          id='appointment-date'
          type='date'
          className={styles.dateInput}
          value={selectedDate}
          min={minimumDate}
          onChange={handleDateChange}
        />
      </section>

      <section aria-label='Time slot selection'>
        <h2>Select a Time</h2>
        <TimeSlotPicker
          doctor={doctor}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          appointments={appointments}
          onSelectTime={handleTimeSelect}
        />
        {selectedTime && (
          <p className={styles.selectedTimeSummary}>
            Selected time: <strong>{selectedTime}</strong>
          </p>
        )}
      </section>

      {confirmedAppointment ? (
        <section aria-label='Booking confirmation'>
          <div
            className={styles.bookingConfirmation}
            role='status'
            aria-live='polite'
          >
            <h2>Appointment Confirmed</h2>
            <dl className={styles.confirmationDetails}>
              <dt>Doctor</dt>
              <dd>{doctor?.name}</dd>
              <dt>Specialty</dt>
              <dd>{doctor?.specialty}</dd>
              <dt>Date</dt>
              <dd>{confirmedAppointment.date}</dd>
              <dt>Time</dt>
              <dd>{confirmedAppointment.time}</dd>
              <dt>Appointment type</dt>
              <dd>{confirmedAppointment.type}</dd>
              <dt>Patient name</dt>
              <dd>{confirmedAppointment.patientName}</dd>
              <dt>Confirmation ID</dt>
              <dd>{confirmedAppointment.appointmentId}</dd>
            </dl>
            <button
              type='button'
              className={styles.bookAnotherButton}
              onClick={handleBookAnother}
            >
              Book Another Appointment
            </button>
          </div>
        </section>
      ) : (
        <section aria-label='Patient information'>
          <h2>Patient Information</h2>
          {doctor && selectedDate && selectedTime ? (
            <AppointmentForm
              initialValues={initialValues}
              onSubmit={handleBookingSubmit}
              submissionError={submissionError}
            />
          ) : (
            <p className={styles.placeholderText}>
              Select a doctor, date, and available time before entering patient
              information.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
