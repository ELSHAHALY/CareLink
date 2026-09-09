import DoctorCard from './DoctorCard'

export default function DoctorList({ doctors }) {
  return (
    <div className='doctor-list'>
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </div>
  )
}
