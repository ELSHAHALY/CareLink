import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import doctorsData from '../data/doctors.json'
import ratingsData from '../data/ratings.json'
import appointmentsData from '../data/appointments.json'
import StarRating, { calculateRatings } from '../components/doctors/StarRating'
import styles from './DoctorProfile.module.css'

const imageModules = import.meta.glob('../assets/doctor-*.jpg', {
  eager: true,
  import: 'default',
})

function resolveImage(filename) {
  const key = `../assets/${filename}`
  return imageModules[key] ?? null
}

function MiniStars({ score }) {
  return (
    <div className={styles.reviewStars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`material-symbols-outlined ${styles.starIcon}`}
          style={{
            fontVariationSettings: i <= score ? '"FILL" 1' : '"FILL" 0',
            color: i <= score ? '#10b981' : '#e5e7eb',
          }}
        >
          star
        </span>
      ))}
    </div>
  )
}

function formatMonthYear(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })
}

function RatingBar({ label, value }) {
  const percentage = (value / 5) * 100
  return (
    <div className={styles.ratingBarContainer}>
      <div className={styles.ratingBarHeader}>
        <span className={styles.ratingBarLabel}>{label}</span>
        <span className={styles.ratingBarValue}>{value.toFixed(1)} / 5.0</span>
      </div>
      <div className={styles.ratingBarTrack}>
        <div
          className={styles.ratingBarFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function DoctorProfile() {
  const { doctorId } = useParams()
  const navigate = useNavigate()

  const doctor = useMemo(() => {
    if (doctorId) {
      return (
        doctorsData.doctors.find((d) => d.id === doctorId) ??
        doctorsData.doctors[0]
      )
    }
    return doctorsData.doctors[0]
  }, [doctorId])

  const imageSrc = resolveImage(doctor.image)

  const rawDoctorRatings = useMemo(() => {
    return ratingsData.ratings.filter((r) => r.doctorId === doctor.id)
  }, [doctor.id])

  const doctorAppointments = useMemo(() => {
    return appointmentsData.appointments.filter((a) => a.doctorId === doctor.id)
  }, [doctor.id])

  const { average, count, validRatings } = useMemo(() => {
    return calculateRatings(rawDoctorRatings, doctorAppointments)
  }, [rawDoctorRatings, doctorAppointments])

  const categoryAverages = useMemo(() => {
    if (validRatings.length === 0) {
      return { bedsideManner: 0, communication: 0, waitTime: 0 }
    }
    const sums = validRatings.reduce(
      (acc, r) => ({
        bedsideManner: acc.bedsideManner + (r.bedsideManner || r.score),
        communication: acc.communication + (r.communication || r.score),
        waitTime: acc.waitTime + (r.waitTime || r.score),
      }),
      { bedsideManner: 0, communication: 0, waitTime: 0 }
    )
    return {
      bedsideManner: sums.bedsideManner / validRatings.length,
      communication: sums.communication / validRatings.length,
      waitTime: sums.waitTime / validRatings.length,
    }
  }, [validRatings])

  const nameParts = doctor.name.split(' ')
  const lastName = nameParts[nameParts.length - 1]

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <section className={styles.card}>
          <div className={styles.headerLayout}>
            <div className={styles.avatarContainer}>
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={doctor.name}
                  className={styles.avatarImage}
                />
              )}
              <span className="material-symbols-outlined" id={styles.verifiedBadgeIcon}>
                verified
              </span>
            </div>

            <div className={styles.headerDetails}>
              <div className={styles.titleRow}>
                <h1 className={styles.doctorName}>{doctor.name}, MD</h1>
                <span className={styles.verifiedTag}>
                  <span className="material-symbols-outlined">verified</span>
                  Verified Doctor
                </span>
              </div>

              <div className={styles.subtitleRow}>
                <span>{doctor.specialty}</span>
                <span className={styles.dot}>•</span>
                <span>{doctor.yearsOfExperience} yrs exp</span>
              </div>

              <div className={styles.ratingRow}>
                <StarRating ratings={rawDoctorRatings} appointments={doctorAppointments} />
                <span className={styles.dot}>•</span>
                <span className={styles.recommendedText}>
                  {count > 0 ? 'Highly Recommended' : 'New Doctor'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoItem}>
                  <span className="material-symbols-outlined">translate</span>
                  Speaks {doctor.languages.join(' & ')}
                </span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                className={styles.primaryButton}
                onClick={() => navigate('/book-appointment')}
              >
                <span className="material-symbols-outlined">calendar_month</span>
                Book Appointment
              </button>
              <button className={styles.secondaryButton}>
                <span className="material-symbols-outlined">share</span>
                Share Profile
              </button>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>About {doctor.name.includes('Dr.') ? doctor.name : `Dr. ${lastName}`}</h2>
          <p className={styles.bioText}>{doctor.bio}</p>

          {doctor.specializations && doctor.specializations.length > 0 && (
            <div className={styles.subSection}>
              <h3 className={styles.subTitle}>Clinical Specializations</h3>
              <div className={styles.chipsContainer}>
                {doctor.specializations.map((spec, index) => (
                  <span key={index} className={styles.chip}>
                    <span className="material-symbols-outlined">medical_services</span>
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {doctor.education && doctor.education.length > 0 && (
            <div className={styles.subSection}>
              <h3 className={styles.subTitle}>Education & Training</h3>
              <div className={styles.educationGrid}>
                {doctor.education.map((edu, index) => {
                  const parts = typeof edu === 'string' ? edu.split(' — ') : []
                  const degree = parts[0] || edu.degree || edu
                  const institution = parts[1] || edu.institution || ''
                  
                  return (
                    <div key={index} className={styles.educationCard}>
                      <div className={styles.eduIconWrapper}>
                        <span className="material-symbols-outlined">school</span>
                      </div>
                      <div className={styles.eduDetails}>
                        <h4 className={styles.eduDegree}>{degree}</h4>
                        {institution && <p className={styles.eduInstitution}>{institution}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {validRatings.length > 0 && (
          <section className={styles.card}>
            <div className={styles.reviewsHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Patient Reviews & Testimonials</h2>
                <p className={styles.sectionSubtitle}>
                  Verified reviews from patients treated in the last 12 months
                </p>
              </div>
              <div className={styles.overallRatingBadge}>
                <span className={styles.overallRatingNumber}>{average.toFixed(1)}</span>
                <MiniStars score={Math.round(average)} />
              </div>
            </div>

            <div className={styles.ratingStatistics}>
              <RatingBar label="Bedside Manner" value={categoryAverages.bedsideManner} />
              <RatingBar label="Communication" value={categoryAverages.communication} />
              <RatingBar label="Wait Time" value={categoryAverages.waitTime} />
            </div>

            <div className={styles.reviewsList}>
              {validRatings.map((review, idx) => {
                const name = review.patientName || `Patient ${review.patientId.slice(-3)}`
                const initials = name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div key={idx} className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <div className={styles.reviewerAvatar}>{initials}</div>
                      <div className={styles.reviewerInfo}>
                        <h4 className={styles.reviewerName}>{name}</h4>
                        <div className={styles.reviewMeta}>
                          <span className={styles.verifiedPatientText}>Verified Patient</span>
                          <span className={styles.dot}>•</span>
                          <span>{formatMonthYear(review.date)}</span>
                        </div>
                      </div>
                      <div className={styles.reviewCardStars}>
                        <MiniStars score={review.score} />
                      </div>
                    </div>
                    <p className={styles.reviewComment}>{review.comment}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
