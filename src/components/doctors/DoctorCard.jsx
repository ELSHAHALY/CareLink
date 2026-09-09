export default function DoctorCard({ doctor }) {
  return (
    <article className='doctor-card'>
      <div className='doctor-card__image-wrapper'>
        <img
          src={doctor.image}
          alt={doctor.name}
          className='doctor-card__image'
        />
      </div>

      <div className='doctor-card__content'>
        <h3 className='doctor-card__name'>{doctor.name}</h3>

        <p className='doctor-card__specialty'>{doctor.specialty}</p>

        <div className='doctor-card__rating'>
          <span>★</span>
          <span>{doctor.rating}</span>
          <span className='doctor-card__reviews'>
            ({doctor.reviews} reviews)
          </span>
        </div>

        <p className='doctor-card__location'>📍 {doctor.location}</p>

        <div className='doctor-card__availability'>
          <span className='availability-dot'></span>
          {doctor.available ? 'Available Today' : 'Unavailable'}
        </div>

        <button className='doctor-card__button'>View Profile</button>
      </div>
    </article>
  )
}
