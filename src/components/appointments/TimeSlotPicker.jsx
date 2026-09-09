import { useState } from 'react'
import doctorsData from '../../data/doctors.json'
import appointmentsData from '../../data/appointments.json'

const START_HOUR = 9
const END_HOUR = 17
const INTERVAL_MINUTES = 30

function generateDailySlots() {
  const slots = []
  for (
    let minutes = START_HOUR * 60;
    minutes <= END_HOUR * 60;
    minutes += INTERVAL_MINUTES
  ) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mins = String(minutes % 60).padStart(2, '0')
    slots.push(`${hours}:${mins}`)
  }
  return slots
}

const DAILY_SLOTS = generateDailySlots()

function getWeekdayName(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  return localDate.toLocaleDateString('en-US', { weekday: 'long' })
}

export default function TimeSlotPicker({
  doctorId,
  selectedDate,
  onSelectTime,
}) {
  const [activeTime, setActiveTime] = useState('')

  if (!doctorId) {
    return (
      <p className='placeholder-text'>
        A doctor must be selected before choosing a time.
      </p>
    )
  }

  if (!selectedDate) {
    return (
      <p className='placeholder-text'>
        Please select a date to view available time slots.
      </p>
    )
  }

  const doctor = doctorsData.doctors.find((d) => d.id === doctorId)

  if (!doctor) {
    return (
      <p className='placeholder-text'>Doctor information is unavailable.</p>
    )
  }

  const weekday = getWeekdayName(selectedDate)
  const isWorkingDay = doctor.availableDays?.includes(weekday) ?? false

  if (!isWorkingDay) {
    return (
      <p className='placeholder-text'>
        This doctor is not available on this day.
      </p>
    )
  }

  const bookedTimes = appointmentsData.appointments
    .filter(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.date === selectedDate &&
        apt.status === 'scheduled',
    )
    .map((apt) => apt.time)

  const handleSelect = (time) => {
    setActiveTime(time)
    onSelectTime(time)
  }

  return (
    <div
      className='time-slot-grid'
      role='group'
      aria-label='Available time slots'
    >
      <style>{`
        .time-slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.5rem;
        }
        .time-slot {
          padding: 0.5rem;
          border: 1px solid #007BFF;
          border-radius: 6px;
          background: #fff;
          color: #007BFF;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .time-slot:hover:not(:disabled) {
          background: #e7f1ff;
        }
        .time-slot:disabled {
          border-color: #ced4da;
          color: #adb5bd;
          background: #F8F9FA;
          cursor: not-allowed;
          text-decoration: line-through;
        }
        .time-slot--selected {
          background: #00A676;
          border-color: #00A676;
          color: #fff;
        }
      `}</style>
      {DAILY_SLOTS.map((time) => {
        const isBooked = bookedTimes.includes(time)
        const isSelected = time === activeTime
        return (
          <button
            key={time}
            type='button'
            className={`time-slot${isSelected ? ' time-slot--selected' : ''}`}
            disabled={isBooked}
            aria-pressed={isSelected}
            onClick={() => handleSelect(time)}
          >
            {time}
          </button>
        )
      })}
    </div>
  )
}
