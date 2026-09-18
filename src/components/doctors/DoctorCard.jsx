import { Link } from 'react-router-dom'
import StarRating from './StarRating'

export default function DoctorCard({
  doctor,
  ratings = [],
  appointments = [],
}) {
  const location =
    typeof doctor.location === 'string'
      ? doctor.location
      : doctor.location
      ? `${doctor.location.address}, ${doctor.location.city}, ${doctor.location.state} ${doctor.location.zip}`
      : 'Location not available'

  return (
    <article className='doctor-card'>
      <div className='doctor-card__image-wrapper'>
        <img
          src={doctor.image}
          alt={`Dr. ${doctor.name}`}
          className='doctor-card__image'
        />
      </div>

      <div className='doctor-card__content'>
        <h3 className='doctor-card__name'>{doctor.name}</h3>

        <p className='doctor-card__specialty'>{doctor.specialty}</p>

        <div className='doctor-card__rating'>
          <StarRating
            ratings={ratings.filter((rating) => rating.doctorId === doctor.id)}
            appointments={appointments.filter(
              (appointment) => appointment.doctorId === doctor.id,
            )}
          />
        </div>

        <p className='doctor-card__location'>📍 {location}</p>

        <div className='doctor-card__availability'>
          <span className='availability-dot'></span>
          {doctor.available ? 'Available Today' : 'Unavailable'}
        </div>

        <Link to={`/doctors/${doctor.id}`} className='doctor-card__button'>
          View Profile
        </Link>
      </div>
    </article>
  )
}
