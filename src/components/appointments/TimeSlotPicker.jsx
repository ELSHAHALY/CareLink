import { getDoctorTimezone, convertTimeToLocal } from '../../utils/timezone'
import styles from './TimeSlotPicker.module.css'

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
  doctor,
  selectedDate,
  selectedTime,
  appointments,
  onSelectTime,
}) {
  const safeAppointments = Array.isArray(appointments) ? appointments : []

  if (!doctor) {
    return (
      <div className={styles.slotStateContainer}>
        <p className={styles.placeholderText}>A doctor must be selected before choosing a time.</p>
      </div>
    )
  }

  if (!selectedDate) {
    return (
      <div className={styles.slotStateContainer}>
        <p className={styles.placeholderText}>Please select a date to view available time slots.</p>
      </div>
    )
  }

  const doctorTimezone = getDoctorTimezone(doctor)
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const showTimezone = doctorTimezone !== userTimezone

  const weekday = getWeekdayName(selectedDate)
  const isWorkingDay = doctor.availableDays?.includes(weekday) ?? false

  if (!isWorkingDay) {
    return (
      <div className={styles.slotStateContainer}>
        <p className={styles.placeholderText}>This doctor is not available on this day.</p>
      </div>
    )
  }

  const bookedTimes = safeAppointments
    .filter(
      (appointment) =>
        appointment.doctorId === doctor.id &&
        appointment.date === selectedDate &&
        appointment.status === 'scheduled',
    )
    .map((appointment) => appointment.time)

  const handleSelect = (time) => {
    if (typeof onSelectTime === 'function') {
      onSelectTime(time)
    }
  }

  return (
    <div className={styles.timeSlotWrapper}>
      {showTimezone && (
        <p className={styles.timezoneNotice}>
          Times shown in your local timezone (doctor is in{' '}
          {doctor.location?.state || 'unknown timezone'})
        </p>
      )}
      
      <div
        className={styles.timeSlotGrid}
        role='group'
        aria-label='Available time slots'
      >
        {DAILY_SLOTS.map((time) => {
          const isBooked = bookedTimes.includes(time)
          const isSelected = time === selectedTime
          const displayTime = showTimezone
            ? convertTimeToLocal(time, getDoctorTimezone(doctor))
            : time
          return (
            <button
              key={time}
              type='button'
              className={`${styles.timeSlot} ${isSelected ? styles.timeSlotSelected : ''}`}
              disabled={isBooked}
              aria-pressed={isSelected}
              onClick={() => handleSelect(time)}
              title={showTimezone ? `${time} (doctor's local)` : ''}
            >
              {displayTime}
            </button>
          )
        })}
      </div>
    </div>
  )
}