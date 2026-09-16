import DoctorCard from './DoctorCard'

export default function DoctorList({ doctors, ratings, appointments }) {
  return (
    <div className='doctor-list'>
      {doctors.map((doctor) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          ratings={ratings}
          appointments={appointments}
        />
      ))}
    </div>
  )
}
