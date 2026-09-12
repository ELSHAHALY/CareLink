import React, { useState } from 'react'
import {
  Users,
  Calendar,
  Clock,
  Activity,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  X,
  Sparkles,
  User,
  Hand,
  Stethoscope,
  Pencil,
  Trash2,
} from 'lucide-react'
import useAuth from '../hooks/useAuth'

export default function Dashboard() {
  const { user } = useAuth()
  const doctorName = user?.name || user?.doctorName || 'Dr. Vance'

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [appointments, setAppointments] = useState([
    {
      id: 1,
      name: 'Sarah Jenkins',
      time: '09:30 AM',
      mrn: 'MRN-8842',
      type: 'Follow-up',
      status: 'In Progress',
      statusBg: 'bg-primary-subtle text-primary border-primary-subtle',
    },
    {
      id: 2,
      name: 'Michael Chang',
      time: '10:15 AM',
      mrn: 'MRN-9012',
      type: 'Consultation',
      status: 'Waiting',
      statusBg: 'bg-warning-subtle text-warning border-warning-subtle',
    },
    {
      id: 3,
      name: 'Emma Watson',
      time: '11:00 AM',
      mrn: 'MRN-7731',
      type: 'Routine Check',
      status: 'Confirmed',
      statusBg: 'bg-success-subtle text-success border-success-subtle',
    },
    {
      id: 4,
      name: 'Robert Miller',
      time: '01:30 PM',
      mrn: 'MRN-3304',
      type: 'Lab Results',
      status: 'Scheduled',
      statusBg: 'bg-secondary-subtle text-secondary border-secondary-subtle',
    },
  ])

  const [formData, setFormData] = useState({
    name: '',
    time: '',
    type: 'Consultation',
    status: 'Confirmed',
  })

  const stats = [
    {
      title: 'Total Patients',
      value: '1,248',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary-subtle',
      glowClass: 'glow-blue',
      hoverClass: 'hover-glow-blue',
      change: '+12% this month',
    },
    {
      title: "Today's Appointments",
      value: appointments.length.toString(),
      icon: Calendar,
      color: 'text-info',
      bg: 'bg-info-subtle',
      glowClass: 'glow-cyan',
      hoverClass: 'hover-glow-cyan',
      change: 'Active schedule',
    },
    {
      title: 'Pending Reports',
      value: '6',
      icon: FileText,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
      glowClass: 'glow-amber',
      hoverClass: 'hover-glow-amber',
      change: 'Requires review',
    },
    {
      title: 'Critical Cases',
      value: '2',
      icon: AlertCircle,
      color: 'text-danger',
      bg: 'bg-danger-subtle',
      glowClass: 'glow-red',
      hoverClass: 'hover-glow-red',
      change: 'Urgent attention',
    },
  ]

  const filteredAppointments = appointments.filter(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.mrn.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenAddModal = () => {
    setEditingId(null)
    setFormData({
      name: '',
      time: '',
      type: 'Consultation',
      status: 'Confirmed',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      time: item.time,
      type: item.type,
      status: item.status,
    })
    setIsModalOpen(true)
  }

  const handleDeletePatient = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setAppointments(appointments.filter((app) => app.id !== id))
    }
  }

  const handleSavePatient = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.time) return

    const getStatusBg = (status) => {
      switch (status) {
        case 'In Progress':
          return 'bg-primary-subtle text-primary border-primary-subtle'
        case 'Waiting':
          return 'bg-warning-subtle text-warning border-warning-subtle'
        case 'Confirmed':
          return 'bg-success-subtle text-success border-success-subtle'
        default:
          return 'bg-secondary-subtle text-secondary border-secondary-subtle'
      }
    }

    if (editingId) {
      setAppointments(
        appointments.map((app) =>
          app.id === editingId
            ? {
                ...app,
                name: formData.name,
                time: formData.time,
                type: formData.type,
                status: formData.status,
                statusBg: getStatusBg(formData.status),
              }
            : app,
        ),
      )
    } else {
      const createdRecord = {
        id: Date.now(),
        name: formData.name,
        time: formData.time,
        mrn: `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: formData.type,
        status: formData.status,
        statusBg: getStatusBg(formData.status),
      }
      setAppointments([createdRecord, ...appointments])
    }

    setIsModalOpen(false)
  }

  return (
    <div className='bg-light min-vh-100 pb-5 fade-in-container'>
      <style>{`
        .fade-in-container {
          animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Waving animation for hand icon */
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(14deg); }
          40% { transform: rotate(-8deg); }
          60% { transform: rotate(14deg); }
          80% { transform: rotate(-4deg); }
        }
        .wave-icon {
          animation: wave 2.2s infinite ease-in-out;
          transform-origin: 70% 70%;
          display: inline-block;
        }

        /* Glowing Effects */
        .glow-blue { filter: drop-shadow(0 0 6px rgba(13, 110, 253, 0.6)); }
        .glow-cyan { filter: drop-shadow(0 0 6px rgba(13, 202, 240, 0.6)); }
        .glow-amber { filter: drop-shadow(0 0 6px rgba(255, 193, 7, 0.6)); }
        .glow-red { filter: drop-shadow(0 0 6px rgba(220, 53, 69, 0.6)); }
        .glow-green { filter: drop-shadow(0 0 6px rgba(25, 135, 84, 0.6)); }

        .doctor-name-glow {
          color: #0d6efd;
          text-shadow: 0 0 10px rgba(13, 110, 253, 0.25);
        }

        /* Card Custom Styling */
        .welcome-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: all 0.3s ease;
        }
        .welcome-card:hover {
          box-shadow: 0 10px 20px -8px rgba(13, 110, 253, 0.12) !important;
          border-color: rgba(13, 110, 253, 0.25);
        }

        .stat-card-custom {
          transition: all 0.25s ease-in-out;
        }
        .hover-glow-blue:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(13, 110, 253, 0.18) !important;
          border-color: rgba(13, 110, 253, 0.3) !important;
        }
        .hover-glow-cyan:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(13, 202, 240, 0.18) !important;
          border-color: rgba(13, 202, 240, 0.3) !important;
        }
        .hover-glow-amber:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(255, 193, 7, 0.18) !important;
          border-color: rgba(255, 193, 7, 0.3) !important;
        }
        .hover-glow-red:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(220, 53, 69, 0.18) !important;
          border-color: rgba(220, 53, 69, 0.3) !important;
        }

        /* Glowing Button */
        .btn-glow-primary {
          background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
          border: none;
          color: #fff;
          transition: all 0.25s ease;
        }
        .btn-glow-primary:hover {
          background: linear-gradient(135deg, #0b5ed7 0%, #084298 100%);
          box-shadow: 0 6px 18px rgba(13, 110, 253, 0.35) !important;
          transform: translateY(-1.5px);
          color: #fff;
        }

        /* Input Glow */
        .custom-form-control {
          transition: all 0.2s ease;
        }
        .custom-form-control:hover, .custom-form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 8px rgba(13, 110, 253, 0.25);
        }

        .custom-table-row {
          transition: background-color 0.2s ease;
        }
        .custom-table-row:hover {
          background-color: rgba(13, 110, 253, 0.04) !important;
        }

        .action-btn {
          opacity: 0.7;
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .modal-backdrop-custom {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      {/* Navbar */}

      <div className='container-fluid py-4 px-4'>
        {/* Welcome Card Section */}
        <div className='card welcome-card shadow-sm rounded-3 p-4 mb-4'>
          <div className='d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3'>
            <div className='d-flex align-items-center gap-3'>
              <div
                className='bg-primary-subtle text-primary p-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0'
                style={{ width: 52, height: 52 }}
              >
                <Stethoscope size={26} className='glow-blue' />
              </div>
              <div>
                <h3 className='fw-bold text-dark mb-1 d-flex align-items-center gap-2 fs-4'>
                  Welcome back Dr,{' '}
                  <span className='doctor-name-glow fw-bolder'>
                    {doctorName}
                  </span>
                  <Hand size={22} className='text-warning wave-icon ms-1' />
                </h3>
                <p className='text-muted small mb-0 d-flex align-items-center gap-1'>
                  <Sparkles size={14} className='text-primary' />
                  Here is your clinical dashboard and daily appointments
                  schedule.
                </p>
              </div>
            </div>

            <div>
              <button
                onClick={handleOpenAddModal}
                className='btn btn-glow-primary btn-md d-flex align-items-center gap-2 rounded-3 px-4 py-2.5 fw-medium shadow'
              >
                <Plus size={18} className='glow-blue' />
                <span>New Patient Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='row g-3 mb-4'>
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className='col-12 col-sm-6 col-xl-3'>
                <div
                  className={`card border shadow-sm rounded-3 h-100 stat-card-custom ${stat.hoverClass}`}
                >
                  <div className='card-body p-3'>
                    <div className='d-flex align-items-center justify-content-between mb-2'>
                      <span className='text-muted small fw-medium'>
                        {stat.title}
                      </span>
                      <div
                        className={`${stat.bg} ${stat.color} p-2 rounded-circle d-flex align-items-center justify-content-center`}
                        style={{ width: 38, height: 38 }}
                      >
                        <Icon size={18} className={stat.glowClass} />
                      </div>
                    </div>
                    <h4 className='fw-bold mb-1 text-dark'>{stat.value}</h4>
                    <span
                      className='text-muted d-flex align-items-center gap-1'
                      style={{ fontSize: '12px' }}
                    >
                      <TrendingUp
                        size={12}
                        className='text-success glow-green'
                      />
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Area */}
        <div className='row g-4'>
          {/* Table Container */}
          <div className='col-12 col-lg-8'>
            <div className='card border shadow-sm rounded-3 overflow-hidden'>
              <div className='card-header bg-white border-bottom py-3 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2'>
                <h5 className='fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2'>
                  <Clock size={18} className='text-primary glow-blue' /> Today’s
                  Schedule
                </h5>

                {/* Filter Input */}
                <div
                  className='input-group input-group-sm rounded-2 overflow-hidden border'
                  style={{ maxWidth: '240px' }}
                >
                  <span className='input-group-text bg-white border-0 pe-1'>
                    <Search size={14} className='text-muted glow-blue' />
                  </span>
                  <input
                    type='text'
                    className='form-control bg-white border-0 ps-1 shadow-none custom-form-control'
                    placeholder='Filter by name or MRN...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className='btn btn-link text-muted p-0 pe-2 text-decoration-none'
                      onClick={() => setSearchTerm('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className='card-body p-0'>
                <div className='table-responsive'>
                  <table className='table align-middle mb-0'>
                    <thead className='table-light'>
                      <tr className='text-muted small'>
                        <th className='ps-4'>Time</th>
                        <th>Patient Name</th>
                        <th>MRN</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th className='text-end pe-4'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((item) => (
                          <tr key={item.id} className='custom-table-row'>
                            <td className='ps-4 fw-medium text-dark'>
                              {item.time}
                            </td>
                            <td>
                              <span className='fw-semibold text-dark'>
                                {item.name}
                              </span>
                            </td>
                            <td>
                              <span className='badge bg-light text-secondary border font-monospace'>
                                {item.mrn}
                              </span>
                            </td>
                            <td className='text-muted small'>{item.type}</td>
                            <td>
                              <span
                                className={`badge ${item.statusBg} border rounded-pill px-2.5 py-1 fw-medium`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className='text-end pe-4'>
                              <div className='d-flex align-items-center justify-content-end gap-2'>
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  className='btn btn-sm btn-outline-primary p-1 border-0 action-btn'
                                  title='Edit Record'
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeletePatient(item.id)}
                                  className='btn btn-sm btn-outline-danger p-1 border-0 action-btn'
                                  title='Delete Record'
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan='6'
                            className='text-center py-5 text-muted'
                          >
                            <Search
                              size={24}
                              className='mb-2 text-muted opacity-50 glow-blue'
                            />
                            <p className='mb-0 small'>
                              No matching appointments found.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Info Cards */}
          <div className='col-12 col-lg-4'>
            <div className='card border shadow-sm rounded-3 mb-4 hover-glow-blue'>
              <div className='card-header bg-white border-bottom py-3 px-4'>
                <h5 className='fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2'>
                  <Activity size={18} className='text-primary glow-blue' />{' '}
                  Clinical Notifications
                </h5>
              </div>
              <div className='card-body p-3'>
                <ul className='list-group list-group-flush'>
                  <li className='list-group-item d-flex align-items-center gap-2 border-0 px-0 py-2'>
                    <CheckCircle2
                      size={16}
                      className='text-success glow-green flex-shrink-0'
                    />
                    <span className='small text-dark'>
                      Prescriptions batch signed (3)
                    </span>
                  </li>
                  <li className='list-group-item d-flex align-items-center gap-2 border-0 px-0 py-2'>
                    <AlertCircle
                      size={16}
                      className='text-warning glow-amber flex-shrink-0'
                    />
                    <span className='small text-dark'>
                      MRI results ready for Sarah Jenkins
                    </span>
                  </li>
                  <li className='list-group-item d-flex align-items-center gap-2 border-0 px-0 py-2'>
                    <FileText
                      size={16}
                      className='text-info glow-cyan flex-shrink-0'
                    />
                    <span className='small text-dark'>
                      EHR synchronization completed
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className='card border-0 shadow-sm rounded-3 bg-primary text-white p-3 hover-glow-blue'>
              <div className='d-flex align-items-center justify-content-between mb-2'>
                <span className='small text-white-50 d-flex align-items-center gap-1'>
                  <Sparkles size={14} className='glow-cyan' /> System
                  Integration
                </span>
                <span className='badge bg-white text-primary fw-bold'>
                  Active
                </span>
              </div>
              <h6 className='fw-bold mb-1'>FHIR v4.0.1 Data Stream</h6>
              <p className='small text-white-50 mb-0'>
                Connected to hospital EHR endpoint. Live telemetry enabled.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Form Modal (Add / Edit) */}
      {isModalOpen && (
        <div className='modal-backdrop-custom'>
          <div
            className='card border-0 shadow-lg rounded-3 w-100 mx-3 fade-in-container'
            style={{ maxWidth: '450px' }}
          >
            <div className='card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center'>
              <h5 className='fw-bold mb-0 fs-6 text-dark d-flex align-items-center gap-2'>
                <User size={18} className='text-primary glow-blue' />
                {editingId ? 'Edit Patient Record' : 'Add New Patient Record'}
              </h5>
              <button
                type='button'
                className='btn-close'
                onClick={() => setIsModalOpen(false)}
              ></button>
            </div>
            <form onSubmit={handleSavePatient}>
              <div className='card-body p-4'>
                <div className='mb-3'>
                  <label className='form-label small fw-medium text-dark'>
                    Patient Name
                  </label>
                  <input
                    type='text'
                    required
                    className='form-control form-control-sm custom-form-control'
                    placeholder='e.g. John Doe'
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className='mb-3'>
                  <label className='form-label small fw-medium text-dark'>
                    Appointment Time
                  </label>
                  <input
                    type='text'
                    required
                    className='form-control form-control-sm custom-form-control'
                    placeholder='e.g. 02:15 PM'
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                  />
                </div>
                <div className='mb-3'>
                  <label className='form-label small fw-medium text-dark'>
                    Consultation Type
                  </label>
                  <select
                    className='form-select form-select-sm custom-form-control'
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value='Consultation'>Consultation</option>
                    <option value='Follow-up'>Follow-up</option>
                    <option value='Routine Check'>Routine Check</option>
                    <option value='Lab Results'>Lab Results</option>
                  </select>
                </div>
                <div className='mb-3'>
                  <label className='form-label small fw-medium text-dark'>
                    Status
                  </label>
                  <select
                    className='form-select form-select-sm custom-form-control'
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value='Confirmed'>Confirmed</option>
                    <option value='In Progress'>In Progress</option>
                    <option value='Waiting'>Waiting</option>
                    <option value='Scheduled'>Scheduled</option>
                  </select>
                </div>
              </div>
              <div className='card-footer bg-light border-top py-3 px-4 d-flex justify-content-end gap-2'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn-sm btn-primary px-3 hover-glow-blue'
                >
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
