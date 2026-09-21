import { FaMapMarkerAlt } from 'react-icons/fa'
import StarRating from './StarRating'
import './DoctorCard.module.css'

import { Link } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa'; 
import StarRating from './StarRating';
import './DoctorCard.module.css'; 
main
export default function DoctorCard({ doctor, ratings, appointments }) {
  return (
    <article className="doctor-card">
      <div className="doctor-card__image-wrapper">
        <img
          src={doctor.image}
          alt={`Dr. ${doctor.name}`}
          className="doctor-card__image"
        />
      </div>

      <div className="doctor-card__content">
        <h3 className="doctor-card__name">{doctor.name}</h3>

        <p className="doctor-card__specialty">{doctor.specialty}</p>

        <div className="doctor-card__rating">
          <StarRating
            ratings={(ratings || []).filter(
              (rating) =>
                String(rating?.doctorId ?? rating?.doctor_id) ===
                String(doctor.id),
            )}
            appointments={(appointments || []).filter(
              (appointment) =>
                String(appointment.doctorId) === String(doctor.id),
            )}
          />
        </div>

          <FaMapMarkerAlt className='doctor-card__location-icon' />
          <span>
            {doctor.location.address}, {doctor.location.city},{' '}
            {doctor.location.state} {doctor.location.zip}
          </span>
        </p>

        <div className='doctor-card__availability'>
          <span
            className={`availability-dot ${
              doctor.available ? 'is-available' : 'is-unavailable'
            }`}
          ></span>
          <span className='availability-text'>
            {doctor.available ? 'Available Today' : 'Unavailable'}
          </span>
        <p className="doctor-card__location">
          <FaMapMarkerAlt className="doctor-card__location-icon" />
          <span>
            {doctor.location.address}, {doctor.location.city},{' '}
            {doctor.location.state} {doctor.location.zip}
          </span>
        </p>

        <div className="doctor-card__availability">
          <span 
            className={`availability-dot ${doctor.available ? 'is-available' : 'is-unavailable'}`}
          ></span>
          <span className="availability-text">
            {doctor.available ? 'Available Today' : 'Unavailable'}
          </span>
        </div>

        <Link to={`/doctors/${doctor.id}`} className="doctor-card__button">
          View Profile
        </Link>
      </div>
    </article>
  );
}