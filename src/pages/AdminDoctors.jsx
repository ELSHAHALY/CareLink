import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import { mapSupabaseError } from '../context/AuthContext'
import doctorsData from '../data/doctors.json'
import {
  buildDoctorProfileInsert,
  buildDoctorSlug,
  doctorOptionLabel,
  mapCatalogDoctor,
  toUiDoctor,
} from '../utils/doctors'
import { uploadDoctorImage } from '../services/doctorImages'
import DoctorForm from '../components/admin/DoctorForm'
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
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [catalog, setCatalog] = useState(() =>
    doctorsData.doctors.map((d) => toUiDoctor(d)),
  )

  const doctorMap = useMemo(() => {
    const m = {}
    catalog.forEach((d) => {
      m[d.id] = d
    })
    return m
  }, [catalog])

  async function loadCatalog() {
    if (!isSupabaseConfigured || !supabase) return
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id,slug,name_ar,name_en,specialty_ar,specialty_en,status')
        .order('sort_order', { ascending: true })
      if (error) throw error
      if (data && data.length > 0) {
        const mapped = data.map(mapCatalogDoctor)
        const published = mapped.filter(
          (d) => !d.status || d.status === 'published',
        )
        setCatalog(published.length > 0 ? published : mapped)
        return
      }
    } catch {
      // Keep static fallback — dropdown stays usable offline.
    }
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialty')
      if (!error && data && data.length > 0) {
        setCatalog(data.map((row) => toUiDoctor(row)))
      }
    } catch {
      // static fallback already set
    }
  }

  async function loadProfiles() {
    if (!isSupabaseConfigured || !supabase) {
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
    loadCatalog()
  }, [])

  async function insertDoctorProfile(profile, imageUrl, attempt = 0) {
    const payload = buildDoctorProfileInsert(
      { ...profile, slug: buildDoctorSlug(profile.slug || profile.name_en) },
      imageUrl,
    )
    const { data, error } = await supabase
      .from('doctors')
      .insert(payload)
      .select('id, slug')
      .single()
    if (error) {
      // Slug collision despite the random suffix — retry once with a fresh one.
      if (error.code === '23505' && attempt === 0) {
        return insertDoctorProfile(profile, imageUrl, 1)
      }
      throw new Error(error.message)
    }
    return data
  }

  async function invokeCreateDoctor({
    email: loginEmail,
    password,
    name,
    doctor_id,
  }) {
    // Secure path: Edge Function uses the privileged server key and does
    // NOT change the admin's own session (client signup would log the
    // admin out and is therefore intentionally NOT used here).
    const { data, error: fnError } = await supabase.functions.invoke(
      'admin-create-doctor',
      { body: { email: loginEmail, password, name, doctor_id } },
    )
    if (fnError) {
      throw new Error(mapEdgeFunctionError(fnError, data))
    }
    if (data?.error) {
      throw new Error(data.error)
    }
  }

  async function handleCreateDoctor({
    mode,
    profile,
    auth,
    doctorId,
    photoFile,
  }) {
    setError('')
    setSuccess('')
    setProgress(null)
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase not configured. Admin requires production DB.')
      return
    }

    setCreating(true)
    let catalogId = doctorId
    let catalogCreated = false
    try {
      if (mode === 'new') {
        let imageUrl = null
        if (photoFile) {
          setProgress('Uploading photo…')
          const uploaded = await uploadDoctorImage(photoFile)
          if (!uploaded.success) throw new Error(uploaded.error)
          imageUrl = uploaded.url
        }
        setProgress('Creating doctor profile…')
        const created = await insertDoctorProfile(profile, imageUrl)
        catalogId = created.id
        catalogCreated = true
      }

      setProgress('Creating login account…')
      await invokeCreateDoctor({ ...auth, doctor_id: catalogId })

      setSuccess(
        `Doctor created: ${auth.email} → ${
          doctorOptionLabel(doctorMap[catalogId]) || catalogId
        }`,
      )
      setFormKey((k) => k + 1)
      setProgress(null)
      loadCatalog()
      loadProfiles()
    } catch (err) {
      // Never leave a published profile without a login: park it as draft.
      if (catalogCreated && catalogId) {
        await supabase
          .from('doctors')
          .update({ status: 'draft', needs_approval: true })
          .eq('id', catalogId)
        loadCatalog()
      }
      setProgress(null)
      setError(err.message || 'Failed to create doctor')
    } finally {
      setCreating(false)
    }
  }

  async function handlePromote(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase not configured.')
      return
    }
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
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase not configured.')
      return
    }
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
            Add the doctor&apos;s personal data and an optional photo, plus the
            login credentials. The profile is published and linked to the new
            account in one step.
          </p>

          <DoctorForm
            key={formKey}
            catalog={catalog}
            submitting={creating || loading}
            onSubmit={handleCreateDoctor}
          />
          {progress && <p className={styles.progress}>{progress}</p>}
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
              {catalog.map((d) => (
                <option key={d.id} value={d.id}>
                  {doctorOptionLabel(d)}
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
                        ? doctorMap[p.doctor_id]?.name ||
                          `${String(p.doctor_id).slice(0, 8)}…`
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

function mapEdgeFunctionError(fnError, data) {
  const raw =
    data?.error ||
    fnError?.message ||
    fnError?.toString?.() ||
    'Creation failed'
  if (/function not found|404|Failed to send a request/i.test(raw)) {
    return (
      'admin-create-doctor function not deployed. Deploy with: ' +
      'supabase functions deploy admin-create-doctor. ' +
      `Detail: ${raw}`
    )
  }
  return mapSupabaseError(raw)
}
