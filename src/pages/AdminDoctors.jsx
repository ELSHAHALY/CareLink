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
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [creating, setCreating] = useState(false)

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

  async function handleCreateDoctor(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!selectedDoctorId) {
      setError('Please select a doctor profile')
      return
    }

    setCreating(true)
    try {
      const normalized = email.trim().toLowerCase()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          data: { name: name.trim(), role: 'doctor', doctor_id: selectedDoctorId },
        },
      })
      if (signUpError) throw new Error(mapSupabaseError(signUpError.message))
      if (!data.user) throw new Error('Signup failed. Please try again.')

      // The trigger creates profile as 'patient'. Now promote to doctor.
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: 'doctor', doctor_id: selectedDoctorId, name: name.trim() })
        .eq('id', data.user.id)
      if (updateErr) {
        // If RLS blocks the update, the auth user was created but role wasn't set.
        // The user exists but needs manual role assignment.
        console.error('Profile update failed:', updateErr)
        throw new Error(
          `Auth user created but role assignment failed: ${updateErr.message}. ` +
            'You may need to update the profile manually in Supabase Dashboard.',
        )
      }

      setSuccess(
        `Doctor created: ${normalized} → ${doctorMap[selectedDoctorId]?.name || selectedDoctorId}`,
      )
      setEmail('')
      setPassword('')
      setName('')
      setSelectedDoctorId('')
      loadProfiles()
    } catch (err) {
      setError(err.message || 'Failed to create doctor')
    } finally {
      setCreating(false)
    }
  }

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

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Create New Doctor</h2>
          <p className={styles.subtitle}>
            Create a new doctor account with auth credentials and assign a doctor
            profile.
          </p>

          <form className={styles.form} onSubmit={handleCreateDoctor}>
            <input
              type='text'
              placeholder='Full name (e.g. Dr. John Doe)'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
            <input
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
            <input
              type='password'
              placeholder='Password (min. 6 characters)'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className={styles.input}
            >
              <option value=''>Select doctor profile</option>
              {doctorsData.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
            <button
              type='submit'
              className={styles.button}
              disabled={creating || loading}
            >
              {creating ? 'Creating...' : 'Create Doctor Account'}
            </button>
          </form>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Promote Existing User</h2>
          <p className={styles.subtitle}>
            Promote a registered user to doctor by email.
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
        </section>

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

function mapSupabaseError(msg) {
  const m = msg.toLowerCase()
  if (m.includes('email already registered') || m.includes('already registered'))
    return 'An account with this email already exists.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Too many attempts. Please try again later.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Please check your connection.'
  return msg
}
