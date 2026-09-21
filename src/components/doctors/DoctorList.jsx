import DoctorCard from './DoctorCard'
import styles from './DoctorList.module.css'

export default function DoctorList({ doctors, ratings, appointments }) {
  return (
    <div className={styles.doctorList}>
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