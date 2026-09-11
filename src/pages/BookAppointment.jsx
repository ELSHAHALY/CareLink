import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppointmentForm from '../components/appointments/AppointmentForm'
import TimeSlotPicker from '../components/appointments/TimeSlotPicker'
import useAuth from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'

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

  const handleBookingSubmit = (patientData) => {
    setSubmissionError(null)

    if (!doctor || !selectedDate || !selectedTime) {
      setSubmissionError('Select a doctor, date, and time before booking.')
      return
    }

    // Mock auth has no real patient identity (user.id is always hardcoded
    // to 1), so the authenticated user's email stands in for patientId
    // here; the booking route itself remains public and login is not
    // required to book.
    const patientId = user?.email
      ? user.email.trim().toLowerCase()
      : patientData.patientEmail.trim().toLowerCase()

    const result = createAppointment({
      doctorId: doctor.id,
      patientId,
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
    <div className='book-appointment-page'>
      <style>{`
        .book-appointment-page {
          max-width: 700px;
          margin: 0 auto;
          padding: 1.5rem;
          color: #343A40;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .book-appointment-page h1 {
          color: #007BFF;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .book-appointment-page section {
          background: #F8F9FA;
          border: 1px solid #e2e5e8;
          border-radius: 8px;
          padding: 1rem 1.25rem;
          margin-bottom: 1rem;
        }
        .book-appointment-page h2 {
          font-size: 1.05rem;
          color: #343A40;
          margin: 0 0 0.5rem 0;
        }
        .book-appointment-page .placeholder-text {
          color: #6c757d;
          font-size: 0.9rem;
        }
        .book-appointment-page label {
          display: block;
          font-size: 0.85rem;
          color: #343A40;
          margin-bottom: 0.35rem;
        }
        .book-appointment-page input[type='date'] {
          padding: 0.5rem 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #343A40;
          width: 100%;
          max-width: 220px;
        }
        .book-appointment-page input[type='date']:focus {
          outline: none;
          border-color: #007BFF;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
        }
        .book-appointment-page .selected-time-summary {
          margin-top: 0.75rem;
          font-size: 0.9rem;
          color: #343A40;
        }
        .book-appointment-page .booking-confirmation {
          background: #fff;
          border: 1px solid #00A676;
          border-radius: 8px;
          padding: 1.25rem;
        }
        .book-appointment-page .booking-confirmation h2 {
          color: #00A676;
          margin: 0 0 0.75rem 0;
        }
        .book-appointment-page .confirmation-details {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
        }
        .book-appointment-page .confirmation-details dt {
          font-weight: 600;
          color: #343A40;
        }
        .book-appointment-page .confirmation-details dd {
          margin: 0 0 0.6rem 0;
          color: #343A40;
        }
        .book-appointment-page .book-another-button {
          background: #007BFF;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
        }
        @media (min-width: 600px) {
          .book-appointment-page {
            padding: 2rem;
          }
        }
      `}</style>

      <h1>Book an Appointment</h1>

      <section aria-label='Doctor information'>
        <h2>Doctor</h2>
        {doctor ? (
          <p>
            {doctor.name} — {doctor.specialty}
          </p>
        ) : (
          <p className='placeholder-text'>
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
          value={selectedDate}
          min={minimumDate}
          onChange={handleDateChange}
        />
      </section>

      <section aria-label='Time slot selection'>
        <h2>Select a Time</h2>
        <TimeSlotPicker
          doctorId={doctor?.id}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          appointments={appointments}
          onSelectTime={handleTimeSelect}
        />
        {selectedTime && (
          <p className='selected-time-summary'>
            Selected time: <strong>{selectedTime}</strong>
          </p>
        )}
      </section>

      {confirmedAppointment ? (
        <section aria-label='Booking confirmation'>
          <div
            className='booking-confirmation'
            role='status'
            aria-live='polite'
          >
            <h2>Appointment Confirmed</h2>
            <dl className='confirmation-details'>
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
              className='book-another-button'
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
            <p className='placeholder-text'>
              Select a doctor, date, and available time before entering patient
              information.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
