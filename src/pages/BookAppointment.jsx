import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import TimeSlotPicker from '../components/appointments/TimeSlotPicker'

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function BookAppointment() {
  const location = useLocation()
  const doctor = location.state?.doctor

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  const minimumDate = getLocalDateString()

  const handleDateChange = (event) => {
    const nextDate = event.target.value
    if (nextDate && nextDate < minimumDate) {
      return
    }
    setSelectedDate(nextDate)
    setSelectedTime('')
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
        .book-appointment-page .confirm-button {
          background: #00A676;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          width: 100%;
          cursor: not-allowed;
          opacity: 0.6;
        }
        @media (min-width: 600px) {
          .book-appointment-page {
            padding: 2rem;
          }
          .book-appointment-page .confirm-button {
            width: auto;
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
          key={selectedDate}
          doctorId={doctor?.id}
          selectedDate={selectedDate}
          onSelectTime={setSelectedTime}
        />
        {selectedTime && (
          <p className='selected-time-summary'>
            Selected time: <strong>{selectedTime}</strong>
          </p>
        )}
      </section>

      <section aria-label='Patient information'>
        <h2>Patient Information</h2>
        <p className='placeholder-text'>Booking form coming in Week 3.</p>
      </section>

      <button className='confirm-button' disabled>
        Confirm Booking
      </button>
    </div>
  )
}
