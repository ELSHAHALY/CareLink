import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import doctorsData from '../data/doctors.json'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import styles from './AdminDoctors.module.css'

export default function AdminDoctors() {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Loading...' />
      </div>
    )
  }

  if (!user) return <Navigate to='/login' replace />
  if (user.role !== 'admin') {
    if (user.role === 'doctor')
      return <Navigate to='/doctor/dashboard' replace />
    return <Navigate to='/dashboard' replace />
  }

  return <AdminDoctorsContent />
}

function AdminDoctorsContent() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')

  const doctorMap = useMemo(() => {
    const m = {}
    doctorsData.doctors.forEach((d) => {
      m[d.id] = d
    })
    return m
  }, [])

  async function loadProfiles() {
    if (!isSupabaseConfigured) {
      setError('Supabase not configured. Admin requires production DB.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, email, name, role, doctor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    if (err) setError(err.message)
    else setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  async function handlePromote(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email.trim() || !selectedDoctorId) {
      setError('Enter email and select a doctor profile')
      return
    }
    const normalized = email.trim().toLowerCase()
    const { error: err } = await supabase
      .from('profiles')
      .update({ role: 'doctor', doctor_id: selectedDoctorId })
      .eq('email', normalized)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Promoted ${normalized} to doctor (${selectedDoctorId})`)
      setEmail('')
      loadProfiles()
    }
  }

  async function handleDemote(profileId) {
    const { error: err } = await supabase
      .from('profiles')
      .update({ role: 'patient', doctor_id: null })
      .eq('id', profileId)
    if (err) setError(err.message)
    else {
      setSuccess('Role updated')
      loadProfiles()
    }
  }

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Admin — Doctors</h1>
        <p className={styles.subtitle}>
          Promote a registered user to doctor by email. Users must have signed
          up first.
        </p>

        <form className={styles.form} onSubmit={handlePromote}>
          <input
            type='email'
            placeholder='user@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className={styles.input}
          >
            <option value=''>Select doctor</option>
            {doctorsData.doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.specialty}
              </option>
            ))}
          </select>
          <button type='submit' className={styles.button}>
            Make doctor
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        {loading ? (
          <Loader message='Loading users...' />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Doctor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.email}</td>
                    <td>{p.name}</td>
                    <td>
                      <span className={styles.badge}>{p.role}</span>
                    </td>
                    <td>
                      {p.doctor_id
                        ? doctorMap[p.doctor_id]?.name || p.doctor_id
                        : '—'}
                    </td>
                    <td>
                      {p.role === 'doctor' && (
                        <button
                          type='button'
                          className={styles.linkBtn}
                          onClick={() => handleDemote(p.id)}
                        >
                          Demote
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
