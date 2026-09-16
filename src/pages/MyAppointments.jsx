import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Plus,
  Edit3,
  Award,
  Loader2,
  Star,
  Search,
  Trash2,
} from 'lucide-react'
import doctor1 from '../assets/doctor-1.jpg'
import doctor2 from '../assets/doctor-2.jpg'
import doctor3 from '../assets/doctor-3.jpg'

import doctorsData from '../data/doctors.json'
import appointmentsData from '../data/appointments.json'
import ratingsData from '../data/ratings.json'

const defaultDoctorAvatar =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'

const doctorImages = {
  'doctor-1.jpg': doctor1,
  'doctor-2.jpg': doctor2,
  'doctor-3.jpg': doctor3,
}

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: #f8f9fa;
    color: #343a40;
  }

  .btn-carelink-primary {
    background-color: #007bff;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    padding: 0.625rem 1.25rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 14px rgba(0, 123, 255, 0.25);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-carelink-primary:hover {
    background-color: #0066c0;
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0, 123, 255, 0.4);
  }

  .btn-carelink-primary:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
  }

  .stat-card-total,
  .stat-card-scheduled,
  .stat-card-completed,
  .stat-card-cancelled {
    border-radius: 20px;
    background: #ffffff;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .stat-card-total:hover,
  .stat-card-scheduled:hover,
  .stat-card-completed:hover,
  .stat-card-cancelled:hover {
    transform: translateY(-6px) scale(1.02);
  }

  .glow-icon-dark,
  .glow-icon-amber,
  .glow-icon-emerald,
  .glow-icon-rose {
    transition: all 0.3s ease;
  }

  .stat-card-total {
    border: 1.5px solid #cbd5e1;
    box-shadow: 0 0 12px rgba(15, 23, 42, 0.08);
  }
  .stat-card-total:hover {
    border-color: #0f172a;
    box-shadow: 0 0 22px rgba(15, 23, 42, 0.25), 0 12px 24px -6px rgba(15, 23, 42, 0.15);
  }
  .glow-icon-dark {
    background: #f1f5f9;
    color: #0f172a;
    border: 1.5px solid #94a3b8;
    box-shadow: 0 0 8px rgba(15, 23, 42, 0.15);
  }
  .stat-card-total:hover .glow-icon-dark {
    background: #0f172a;
    color: #ffffff;
    border-color: #020617;
    box-shadow: 0 0 16px rgba(15, 23, 42, 0.5);
  }
  .stat-title-dark { color: #0f172a; }

  .stat-card-scheduled {
    border: 1.5px solid #fde68a;
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
  }
  .stat-card-scheduled:hover {
    border-color: #f59e0b;
    box-shadow: 0 0 22px rgba(245, 158, 11, 0.4), 0 12px 24px -6px rgba(245, 158, 11, 0.25);
  }
  .glow-icon-amber {
    background: #fffbeb;
    color: #d97706;
    border: 1.5px solid #fbbf24;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.25);
  }
  .stat-card-scheduled:hover .glow-icon-amber {
    background: #f59e0b;
    color: #ffffff;
    border-color: #d97706;
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.6);
  }
  .stat-title-amber { color: #d97706; }

  .stat-card-completed {
    border: 1.5px solid #6ee7b7;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
  }
  .stat-card-completed:hover {
    border-color: #10b981;
    box-shadow: 0 0 22px rgba(16, 185, 129, 0.4), 0 12px 24px -6px rgba(16, 185, 129, 0.25);
  }
  .glow-icon-emerald {
    background: #ecfdf5;
    color: #059669;
    border: 1.5px solid #34d399;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.25);
  }
  .stat-card-completed:hover .glow-icon-emerald {
    background: #10b981;
    color: #ffffff;
    border-color: #059669;
    box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
  }
  .stat-title-emerald { color: #059669; }

  .stat-card-cancelled {
    border: 1.5px solid #fca5a5;
    box-shadow: 0 0 12px rgba(244, 63, 94, 0.15);
  }
  .stat-card-cancelled:hover {
    border-color: #f43f5e;
    box-shadow: 0 0 22px rgba(244, 63, 94, 0.4), 0 12px 24px -6px rgba(244, 63, 94, 0.25);
  }
  .glow-icon-rose {
    background: #fff1f2;
    color: #e11d48;
    border: 1.5px solid #fb7185;
    box-shadow: 0 0 8px rgba(244, 63, 94, 0.25);
  }
  .stat-card-cancelled:hover .glow-icon-rose {
    background: #f43f5e;
    color: #ffffff;
    border-color: #e11d48;
    box-shadow: 0 0 16px rgba(244, 63, 94, 0.6);
  }
  .stat-title-rose { color: #e11d48; }

  .search-input-wrapper {
    background-color: #f8fafc !important;
    border: 1.5px solid #e2e8f0 !important;
    border-radius: 16px;
    padding: 4px 8px;
    transition: all 0.3s ease;
  }

  .search-input-wrapper:focus-within {
    background-color: #ffffff !important;
    border-color: #2563eb !important;
    box-shadow: 0 0 16px rgba(37, 99, 235, 0.25) !important;
  }

  .search-icon-badge {
    width: 36px;
    height: 36px;
    min-width: 36px;
    background-color: #2563eb !important;
    color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 0 12px rgba(37, 99, 235, 0.5);
    transition: transform 0.3s ease;
  }

  .search-input-wrapper:focus-within .search-icon-badge {
    transform: scale(1.08) rotate(-5deg);
    box-shadow: 0 0 16px rgba(37, 99, 235, 0.7);
  }

  .custom-search-input::placeholder {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .filter-pills-container {
    background-color: #f1f5f9 !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 4px;
  }

  .btn-carelink-all {
    background-color: #0f172a !important;
    color: #ffffff !important;
  }

  .btn-carelink-amber {
    background-color: #f59e0b !important;
    color: #ffffff !important;
  }

  .btn-carelink-emerald {
    background-color: #10b981 !important;
    color: #ffffff !important;
  }

  .btn-carelink-rose {
    background-color: #f43f5e !important;
    color: #ffffff !important;
  }

  .table-custom {
    border-collapse: separate;
    border-spacing: 0 10px;
  }

  .table-custom tbody tr {
    background-color: #ffffff;
    box-shadow: 0 2px 8px rgba(52, 58, 64, 0.04);
    border-radius: 14px;
    transition: all 0.25s ease;
  }

  .table-custom tbody tr:hover {
    transform: scale(1.008);
    box-shadow: 0 8px 20px rgba(0, 123, 255, 0.1);
  }

  .table-custom td:first-child, .table-custom th:first-child {
    border-top-left-radius: 14px;
    border-bottom-left-radius: 14px;
  }

  .table-custom td:last-child, .table-custom th:last-child {
    border-top-right-radius: 14px;
    border-bottom-right-radius: 14px;
  }

/* =========================
   Appointment Status Badges
   ========================= */

.badge-scheduled,
.badge-completed,
.badge-cancelled {
  font-weight: 800 !important;
  color: #111827 !important;
  letter-spacing: 0.2px;
  border-width: 1.5px !important;
  border-style: solid !important;
  transition: all 0.25s ease;
}

/* Scheduled - Amber */
.badge-scheduled {
  background-color: #fff3c4 !important;
  color: #111827 !important;
  border-color: #f59e0b !important;
  box-shadow:
    0 0 8px rgba(245, 158, 11, 0.35),
    0 3px 8px rgba(245, 158, 11, 0.15);
}

.badge-scheduled:hover {
  background-color: #fde68a !important;
  border-color: #d97706 !important;
  box-shadow:
    0 0 14px rgba(245, 158, 11, 0.55),
    0 4px 12px rgba(245, 158, 11, 0.2);
  transform: translateY(-1px);
}


/* Completed - Emerald */
.badge-completed {
  background-color: #d1fae5 !important;
  color: #111827 !important;
  border-color: #10b981 !important;
  box-shadow:
    0 0 8px rgba(16, 185, 129, 0.35),
    0 3px 8px rgba(16, 185, 129, 0.15);
}

.badge-completed:hover {
  background-color: #a7f3d0 !important;
  border-color: #059669 !important;
  box-shadow:
    0 0 14px rgba(16, 185, 129, 0.55),
    0 4px 12px rgba(16, 185, 129, 0.2);
  transform: translateY(-1px);
}


/* Cancelled - Rose */
.badge-cancelled {
  background-color: #ffe0e6 !important;
  color: #111827 !important;
  border-color: #f43f5e !important;
  box-shadow:
    0 0 8px rgba(244, 63, 94, 0.35),
    0 3px 8px rgba(244, 63, 94, 0.15);
}

.badge-cancelled:hover {
  background-color: #fecdd3 !important;
  border-color: #e11d48 !important;
  box-shadow:
    0 0 14px rgba(244, 63, 94, 0.55),
    0 4px 12px rgba(244, 63, 94, 0.2);
  transform: translateY(-1px);
}
  .doctor-avatar {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 12px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .doctor-avatar:hover {
    transform: scale(1.1) rotate(2deg);
    box-shadow: 0 0 12px rgba(0, 123, 255, 0.4);
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: none;
    transition: all 0.2s ease;
  }

  .icon-btn:hover {
    transform: scale(1.15);
  }

  .animate-modal-in {
    animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes modalFadeIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`

const CareLinkLogo = ({ onBookClick }) => (
  <>
    <style>{`
      .carelink-logo-container {
        transition: transform 0.3s ease;
      }
      .carelink-logo-container:hover {
        transform: translateY(-2px);
      }
      .carelink-logo-svg {
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .carelink-logo-container:hover .carelink-logo-svg {
        transform: scale(1.08) rotate(-3deg);
      }
      .carelink-blue-person, .carelink-green-person {
        transition: transform 0.3s ease;
      }
      .carelink-logo-container:hover .carelink-blue-person {
        transform: translateY(-2px);
      }
      .carelink-logo-container:hover .carelink-green-person {
        transform: translateY(-3px);
      }
      .carelink-btn {
        background-color: #0077FE;
        color: #ffffff;
        border: none;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 119, 254, 0.25);
      }
      .carelink-btn:hover {
        background-color: #0056b3;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0, 119, 254, 0.38);
        color: #ffffff;
      }
      .carelink-btn:active {
        transform: translateY(0);
      }
    `}</style>

    <div className='d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 p-3 border-0 rounded-4 w-100 mb-4 bg-white shadow-sm'>
      <div className='d-flex align-items-center gap-3 cursor-pointer carelink-logo-container'>
        <svg
          width='52'
          height='52'
          viewBox='0 0 100 100'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='carelink-logo-svg'
        >
          <g className='carelink-blue-person'>
            <circle cx='46' cy='22' r='8.5' fill='#0077FE' />
            <path
              d='M 23 58 C 23 37, 43 35, 52 46'
              stroke='#0077FE'
              strokeWidth='9.5'
              strokeLinecap='round'
            />
            <path
              d='M 23 58 C 23 80, 52 82, 59 71'
              stroke='#0077FE'
              strokeWidth='9.5'
              strokeLinecap='round'
            />
          </g>

          <g className='carelink-green-person'>
            <circle cx='69' cy='28' r='7.5' fill='#00A870' />
            <path
              d='M 49 53 C 58 39, 73 43, 73 53 C 73 67, 50 63, 49 53'
              stroke='#00A870'
              strokeWidth='8.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </g>
        </svg>

        <div>
          <h2
            className='fw-extrabold mb-0 tracking-tight d-flex align-items-center'
            style={{
              fontSize: '28px',
              lineHeight: '1',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <span style={{ color: '#2B303A', fontWeight: '800' }}>Care</span>
            <span style={{ color: '#00A870', fontWeight: '800' }}>Link</span>
          </h2>
          <p
            className='small fw-medium mb-0 mt-1'
            style={{ color: '#6c757d', fontSize: '12px' }}
          >
            Your Smart Gateway to Seamless Healthcare
          </p>
        </div>
      </div>

      <button
        onClick={onBookClick}
        className='btn carelink-btn fw-bold px-4 py-2 rounded-pill d-inline-flex align-items-center justify-content-center gap-2'
      >
        <span>Book Appointment</span>
        <Plus size={18} />
      </button>
    </div>
  </>
)

const AppointmentContext = createContext()

export const AppointmentProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    setDoctors(doctorsData?.doctors || doctorsData || [])
    setAppointments(appointmentsData?.appointments || appointmentsData || [])
    setRatings(ratingsData?.ratings || ratingsData || {})
    setLoading(false)
  }, [])

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  const cancelAppointment = (appointmentId) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.appointmentId === appointmentId
          ? { ...app, status: 'cancelled' }
          : app,
      ),
    )
    showNotification('Appointment status changed to Cancelled.', 'warning')
  }

  const updateAppointment = (appointmentId, updatedData) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.appointmentId === appointmentId ? { ...app, ...updatedData } : app,
      ),
    )
    showNotification('Appointment details updated successfully!', 'success')
  }

  const addAppointment = (newApp) => {
    const created = {
      ...newApp,
      appointmentId: `apt-${Math.floor(100 + Math.random() * 900)}`,
    }
    setAppointments((prev) => [created, ...prev])
    showNotification('New appointment scheduled successfully!', 'success')
  }

  const deleteAppointment = (appointmentId) => {
    setAppointments((prev) =>
      prev.filter((app) => app.appointmentId !== appointmentId),
    )
    showNotification('Appointment record deleted permanently.', 'error')
  }

  if (loading) {
    return (
      <div className='d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light'>
        <Loader2
          className='animate-spin text-primary mb-3'
          size={40}
          style={{ color: '#007bff' }}
        />
        <h5 className='fw-bold text-secondary'>Loading CareLink Data...</h5>
      </div>
    )
  }

  return (
    <AppointmentContext.Provider
      value={{
        doctors,
        appointments,
        ratings,
        cancelAppointment,
        updateAppointment,
        addAppointment,
        deleteAppointment,
        notification,
      }}
    >
      <style>{customStyles}</style>
      <link
        rel='stylesheet'
        href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
      />
      {children}
    </AppointmentContext.Provider>
  )
}

const useAppointments = () => {
  const context = useContext(AppointmentContext)
  if (!context) {
    throw new Error(
      'useAppointments must be used within an AppointmentProvider',
    )
  }
  return context
}

const DoctorModal = ({ doctor, ratingInfo, onClose }) => {
  if (!doctor) return null

  return (
    <div
      className='modal show d-block'
      tabIndex='-1'
      style={{
        backgroundColor: 'rgba(52, 58, 64, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className='modal-dialog modal-dialog-centered modal-lg animate-modal-in'>
        <div className='modal-content border-0 rounded-4 shadow-lg overflow-hidden'>
          <div
            className='position-relative p-4 text-white'
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #00A676 100%)',
              height: '140px',
            }}
          >
            <button
              type='button'
              onClick={onClose}
              className='btn-close btn-close-white position-absolute top-0 end-0 m-3'
            ></button>
          </div>

          <div className='modal-body px-4 pb-4 pt-0 position-relative'>
            <div
              className='d-flex flex-column flex-sm-row align-items-center align-items-sm-end gap-3 mb-4'
              style={{ marginTop: '-60px' }}
            >
              <img
                src={doctorImages[doctor?.image] || defaultDoctorAvatar}
                alt={doctor?.name || 'Doctor'}
                className='rounded-4 border border-4 border-white shadow-sm'
                style={{ width: '110px', height: '110px', objectFit: 'cover' }}
              />
              <div className='text-center text-sm-start'>
                <h4 className='fw-bold mb-0 text-dark'>{doctor.name}</h4>
                <span className='fw-semibold' style={{ color: '#007bff' }}>
                  {doctor.specialty}
                </span>

                <div className='d-flex align-items-center justify-content-center justify-content-sm-start gap-3 mt-1'>
                  <div className='d-flex align-items-center gap-1 text-muted small'>
                    <Award style={{ color: '#007bff' }} size={16} />
                    <span>{doctor.yearsOfExperience} Years Experience</span>
                  </div>

                  {ratingInfo && (
                    <div className='d-flex align-items-center gap-1 bg-warning-subtle text-warning-emphasis px-2 py-0.5 rounded-pill small fw-bold'>
                      <Star size={14} className='fill-warning text-warning' />
                      <span>
                        {ratingInfo.score || ratingInfo.rating || ratingInfo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='mb-3'>
              <h6 className='text-uppercase fw-bold text-muted small tracking-wide mb-2'>
                About Practitioner
              </h6>
              <p className='text-secondary small leading-relaxed mb-0'>
                {doctor.bio}
              </p>
            </div>

            <div className='row g-3 p-3 bg-light rounded-4 mb-3 border border-1'>
              <div className='col-12 col-md-6'>
                <div className='d-flex align-items-center gap-2 small text-secondary mb-2'>
                  <MapPin
                    size={16}
                    style={{ color: '#007bff' }}
                    className='flex-shrink-0'
                  />
                  <span className='text-truncate'>
                    {doctor.location?.address}, {doctor.location?.city}
                  </span>
                </div>
                <div className='d-flex align-items-center gap-2 small text-secondary mb-2'>
                  <Phone
                    size={16}
                    style={{ color: '#00A676' }}
                    className='flex-shrink-0'
                  />
                  <span>{doctor.phone}</span>
                </div>
                <div className='d-flex align-items-center gap-2 small text-secondary'>
                  <Mail
                    size={16}
                    style={{ color: '#007bff' }}
                    className='flex-shrink-0'
                  />
                  <span>{doctor.email}</span>
                </div>
              </div>

              <div className='col-12 col-md-6'>
                <h6 className='fw-semibold text-muted small mb-2'>
                  Available Practice Days
                </h6>
                <div className='d-flex flex-wrap gap-1'>
                  {doctor.availableDays?.map((day) => (
                    <span
                      key={day}
                      className='badge rounded-2 px-2 py-1'
                      style={{
                        backgroundColor: '#e6f0ff',
                        color: '#007bff',
                        border: '1px solid #b3d7ff',
                      }}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AppointmentModal = ({ isOpen, onClose, appointmentToEdit = null }) => {
  const { doctors, updateAppointment, addAppointment } = useAppointments()

  const [formData, setFormData] = useState({
    doctorId: doctors[0]?.id || '',
    patientId: `pat-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'Consultation',
    status: 'scheduled',
  })

  useEffect(() => {
    if (appointmentToEdit) {
      setFormData({
        doctorId: appointmentToEdit.doctorId,
        patientId: appointmentToEdit.patientId,
        date: appointmentToEdit.date,
        time: appointmentToEdit.time,
        type: appointmentToEdit.type,
        status: appointmentToEdit.status,
      })
    } else {
      setFormData({
        doctorId: doctors[0]?.id || '',
        patientId: `pat-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        type: 'Consultation',
        status: 'scheduled',
      })
    }
  }, [appointmentToEdit, doctors])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (appointmentToEdit) {
      updateAppointment(appointmentToEdit.appointmentId, formData)
    } else {
      addAppointment(formData)
    }
    onClose()
  }

  return (
    <div
      className='modal show d-block'
      tabIndex='-1'
      style={{
        backgroundColor: 'rgba(52, 58, 64, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className='modal-dialog modal-dialog-centered animate-modal-in'>
        <div className='modal-content border-0 rounded-4 shadow-lg p-3'>
          <div className='modal-header border-0 pb-0'>
            <h5
              className='modal-title fw-bold d-flex align-items-center gap-2'
              style={{ color: '#007bff' }}
            >
              {appointmentToEdit ? <Edit3 size={20} /> : <Plus size={20} />}
              {appointmentToEdit
                ? 'Reschedule Appointment'
                : 'Book New Appointment'}
            </h5>
            <button
              type='button'
              onClick={onClose}
              className='btn-close'
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className='modal-body space-y-3'>
              <div className='mb-3'>
                <label className='form-label small fw-bold text-uppercase text-muted'>
                  Select Healthcare Professional
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorId: e.target.value })
                  }
                  className='form-select rounded-3 py-2'
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className='row g-3 mb-3'>
                <div className='col-6'>
                  <label className='form-label small fw-bold text-uppercase text-muted'>
                    Patient Reference ID
                  </label>
                  <input
                    type='text'
                    required
                    value={formData.patientId}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: e.target.value })
                    }
                    className='form-control rounded-3 py-2'
                  />
                </div>
                <div className='col-6'>
                  <label className='form-label small fw-bold text-uppercase text-muted'>
                    Consultation Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className='form-select rounded-3 py-2'
                  >
                    <option value='Consultation'>Consultation</option>
                    <option value='Follow-up'>Follow-up</option>
                    <option value='Treatment'>Treatment</option>
                    <option value='Check-up'>Check-up</option>
                  </select>
                </div>
              </div>

              <div className='row g-3 mb-3'>
                <div className='col-6'>
                  <label className='form-label small fw-bold text-uppercase text-muted'>
                    Date
                  </label>
                  <input
                    type='date'
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className='form-control rounded-3 py-2'
                  />
                </div>
                <div className='col-6'>
                  <label className='form-label small fw-bold text-uppercase text-muted'>
                    Time
                  </label>
                  <input
                    type='time'
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className='form-control rounded-3 py-2'
                  />
                </div>
              </div>

              {appointmentToEdit && (
                <div className='mb-3'>
                  <label className='form-label small fw-bold text-uppercase text-muted'>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className='form-select rounded-3 py-2'
                  >
                    <option value='scheduled'>Scheduled</option>
                    <option value='completed'>Completed</option>
                    <option value='cancelled'>Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            <div className='modal-footer border-0 pt-0'>
              <button
                type='button'
                onClick={onClose}
                className='btn btn-light rounded-3 px-4 fw-medium'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-carelink-primary rounded-3 px-4'
              >
                {appointmentToEdit ? 'Save Changes' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const AppointmentsList = () => {
  const {
    doctors,
    appointments,
    ratings,
    cancelAppointment,
    deleteAppointment,
    notification,
  } = useAppointments()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const doctorMap = useMemo(() => {
    const map = {}
    doctors.forEach((doc) => {
      map[doc.id] = doc
    })
    return map
  }, [doctors])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const doc = doctorMap[app.doctorId]
      const matchesSearch =
        (doc?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.patientId || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (app.type || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        filterStatus === 'all' || app.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [appointments, doctorMap, searchTerm, filterStatus])

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      scheduled: appointments.filter((a) => a.status === 'scheduled').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    }
  }, [appointments])

  return (
    <div className='container py-4'>
      <CareLinkLogo onBookClick={() => setIsBookingOpen(true)} />

      {notification && (
        <div
          className={`alert alert-${
            notification.type === 'error'
              ? 'danger'
              : notification.type === 'warning'
              ? 'warning'
              : 'success'
          } rounded-4 shadow-sm mb-4 border-0 d-flex align-items-center justify-content-between`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stats Section */}
      <div className='row g-3 mb-4'>
        <div className='col-12 col-sm-6 col-lg-3'>
          <div
            className='stat-card-total p-3 d-flex align-items-center justify-content-between'
            onClick={() => setFilterStatus('all')}
          >
            <div>
              <span className='stat-title-dark small fw-bold text-uppercase'>
                Total Appointments
              </span>
              <h2 className='fw-extrabold text-dark mb-0 mt-1'>
                {stats.total}
              </h2>
            </div>
            <div className='glow-icon-dark p-3 rounded-4 d-flex align-items-center justify-content-center'>
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className='col-12 col-sm-6 col-lg-3'>
          <div
            className='stat-card-scheduled p-3 d-flex align-items-center justify-content-between'
            onClick={() => setFilterStatus('scheduled')}
          >
            <div>
              <span className='stat-title-amber small fw-bold text-uppercase'>
                Scheduled
              </span>
              <h2 className='fw-extrabold text-dark mb-0 mt-1'>
                {stats.scheduled}
              </h2>
            </div>
            <div className='glow-icon-amber p-3 rounded-4 d-flex align-items-center justify-content-center'>
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className='col-12 col-sm-6 col-lg-3'>
          <div
            className='stat-card-completed p-3 d-flex align-items-center justify-content-between'
            onClick={() => setFilterStatus('completed')}
          >
            <div>
              <span className='stat-title-emerald small fw-bold text-uppercase'>
                Completed
              </span>
              <h2 className='fw-extrabold text-dark mb-0 mt-1'>
                {stats.completed}
              </h2>
            </div>
            <div className='glow-icon-emerald p-3 rounded-4 d-flex align-items-center justify-content-center'>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className='col-12 col-sm-6 col-lg-3'>
          <div
            className='stat-card-cancelled p-3 d-flex align-items-center justify-content-between'
            onClick={() => setFilterStatus('cancelled')}
          >
            <div>
              <span className='stat-title-rose small fw-bold text-uppercase'>
                Cancelled
              </span>
              <h2 className='fw-extrabold text-dark mb-0 mt-1'>
                {stats.cancelled}
              </h2>
            </div>
            <div className='glow-icon-rose p-3 rounded-4 d-flex align-items-center justify-content-center'>
              <XCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white'>
        <div className='row g-3 align-items-center'>
          <div className='col-12 col-md-6'>
            <div className='d-flex align-items-center search-input-wrapper'>
              <div className='search-icon-badge d-flex align-items-center justify-content-center me-2'>
                <Search size={18} />
              </div>
              <input
                type='text'
                className='form-control border-0 bg-transparent custom-search-input shadow-none'
                placeholder='Search doctor, patient ID, or type...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className='col-12 col-md-6'>
            <div className='d-flex gap-2 filter-pills-container overflow-x-auto'>
              <button
                className={`btn btn-sm flex-fill rounded-3 fw-bold py-2 ${
                  filterStatus === 'all'
                    ? 'btn-carelink-all'
                    : 'btn-light text-secondary'
                }`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button
                className={`btn btn-sm flex-fill rounded-3 fw-bold py-2 ${
                  filterStatus === 'scheduled'
                    ? 'btn-carelink-amber'
                    : 'btn-light text-secondary'
                }`}
                onClick={() => setFilterStatus('scheduled')}
              >
                Scheduled
              </button>
              <button
                className={`btn btn-sm flex-fill rounded-3 fw-bold py-2 ${
                  filterStatus === 'completed'
                    ? 'btn-carelink-emerald'
                    : 'btn-light text-secondary'
                }`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </button>
              <button
                className={`btn btn-sm flex-fill rounded-3 fw-bold py-2 ${
                  filterStatus === 'cancelled'
                    ? 'btn-carelink-rose'
                    : 'btn-light text-secondary'
                }`}
                onClick={() => setFilterStatus('cancelled')}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className='table-responsive'>
        <table className='table table-custom align-middle mb-0'>
          <thead>
            <tr className='text-muted small text-uppercase'>
              <th className='border-0 ps-3'>Doctor</th>
              <th className='border-0'>Patient ID</th>
              <th className='border-0'>Date & Time</th>
              <th className='border-0'>Type</th>
              <th className='border-0'>Status</th>
              <th className='border-0 text-end pe-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={6} className='text-center py-5 text-muted'>
                  No appointments found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((app) => {
                const doc = doctorMap[app.doctorId]
                return (
                  <tr key={app.appointmentId}>
                    <td className='ps-3'>
                      <div
                        className='d-flex align-items-center gap-3 cursor-pointer'
                        onClick={() => setSelectedDoctor(doc)}
                      >
                        <img
                          src={
                            doc
                              ? doctorImages[doc.image] || defaultDoctorAvatar
                              : defaultDoctorAvatar
                          }
                          alt={doc?.name || 'Doctor'}
                          className='doctor-avatar'
                        />
                        <div>
                          <h6 className='fw-bold mb-0 text-dark'>
                            {doc?.name || 'Unknown Practitioner'}
                          </h6>
                          <small className='text-muted'>{doc?.specialty}</small>
                        </div>
                      </div>
                    </td>
                    <td className='fw-semibold text-secondary'>
                      {app.patientId}
                    </td>
                    <td>
                      <div className='d-flex flex-column'>
                        <span className='fw-bold text-dark'>{app.date}</span>
                        <small className='text-muted'>{app.time}</small>
                      </div>
                    </td>
                    <td>
                      <span className='badge bg-light text-dark border px-3 py-2 rounded-pill'>
                        {app.type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge px-3 py-2 rounded-pill badge-${app.status}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className='text-end pe-3'>
                      <div className='d-inline-flex gap-2'>
                        <button
                          onClick={() => setEditingAppointment(app)}
                          className='icon-btn bg-light text-primary'
                          title='Edit Appointment'
                        >
                          <Edit3 size={16} />
                        </button>
                        {app.status !== 'cancelled' && (
                          <button
                            onClick={() => cancelAppointment(app.appointmentId)}
                            className='icon-btn bg-light text-warning'
                            title='Cancel Appointment'
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteAppointment(app.appointmentId)}
                          className='icon-btn bg-light text-danger'
                          title='Delete Record'
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedDoctor && (
        <DoctorModal
          doctor={selectedDoctor}
          ratingInfo={ratings[selectedDoctor.id]}
          onClose={() => setSelectedDoctor(null)}
        />
      )}

      {(isBookingOpen || editingAppointment) && (
        <AppointmentModal
          isOpen={isBookingOpen || Boolean(editingAppointment)}
          appointmentToEdit={editingAppointment}
          onClose={() => {
            setIsBookingOpen(false)
            setEditingAppointment(null)
          }}
        />
      )}
    </div>
  )
}

const MyAppointments = () => {
  return (
    <AppointmentProvider>
      <AppointmentsList />
    </AppointmentProvider>
  )
}

export default MyAppointments
