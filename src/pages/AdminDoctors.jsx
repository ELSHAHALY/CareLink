import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import {
  buildDoctorProfileInsert,
  buildDoctorSlug,
  doctorOptionLabel,
  mapCatalogDoctor,
  resolveDoctorImage,
} from '../utils/doctors'
import { uploadDoctorImage } from '../services/doctorImages'
import DoctorForm from '../components/admin/DoctorForm'
import styles from './AdminDoctors.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

function StatusBadge({ status }) {
  const isPublished = !status || status === 'published'
  return (
    <span
      className={`${styles.statusBadge} ${
        isPublished ? styles.published : styles.draft
      }`}
    >
      {isPublished ? 'Published' : status}
    </span>
  )
}

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
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState(null)

  const loadDoctors = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase not configured. Admin requires production DB.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('doctors')
        .select(
          'id,slug,name_ar,name_en,specialty_ar,specialty_en,bio_en,bio_ar,image,status,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(200)
      if (err) throw err
      setDoctors((data || []).map(mapCatalogDoctor))
    } catch (err) {
      setError(err.message || 'Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  const loadProfiles = async () => {
    if (!isSupabaseConfigured || !supabase) return
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, email, name, role, doctor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (err) setError(err.message)
    else setProfiles(data || [])
  }

  useEffect(() => {
    loadDoctors()
    loadProfiles()
  }, [])

  const filteredDoctors = useMemo(() => {
    const term = search.trim().toLowerCase()
    return doctors.filter((d) => {
      const name = (d.name_en || d.name_ar || '').toLowerCase()
      const specialty = (d.specialty_en || d.specialty_ar || '').toLowerCase()
      const matchesSearch =
        !term || name.includes(term) || specialty.includes(term)
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'published' &&
          (!d.status || d.status === 'published')) ||
        d.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [doctors, search, statusFilter])

  const doctorToProfile = useMemo(() => {
    const map = {}
    profiles.forEach((p) => {
      if (p.doctor_id) map[p.doctor_id] = p
    })
    return map
  }, [profiles])

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
      if (error.code === '23505' && attempt === 0) {
        return insertDoctorProfile(profile, imageUrl, 1)
      }
      throw new Error(error.message)
    }
    return data
  }

  function mapEdgeFunctionError(fnError, data) {
    if (fnError?.message) return fnError.message
    if (data?.error) return data.error
    return 'Failed to create doctor account'
  }

  async function invokeCreateDoctor({
    email: loginEmail,
    password,
    name,
    doctor_id,
  }) {
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
          doctorOptionLabel(doctors.find((d) => d.id === catalogId)) ||
          catalogId
        }`,
      )
      setShowAdd(false)
      setProgress(null)
      loadDoctors()
      loadProfiles()
    } catch (err) {
      if (catalogCreated && catalogId) {
        await supabase
          .from('doctors')
          .update({ status: 'draft', needs_approval: true })
          .eq('id', catalogId)
        loadDoctors()
      }
      setProgress(null)
      setError(err.message || 'Failed to create doctor')
    } finally {
      setCreating(false)
    }
  }

  async function handleArchive(doctorId, currentStatus) {
    setError('')
    setSuccess('')
    const nextStatus = currentStatus === 'archived' ? 'draft' : 'archived'
    const { error: err } = await supabase
      .from('doctors')
      .update({ status: nextStatus })
      .eq('id', doctorId)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(
        `Doctor ${nextStatus === 'archived' ? 'archived' : 'restored'}`,
      )
      loadDoctors()
    }
  }

  return (
    <DashboardLayout
      title='Doctors'
      subtitle='Search, manage, and add doctors to the catalog.'
      action={
        <button
          type='button'
          className={styles.primaryBtn}
          onClick={() => setShowAdd(true)}
          disabled={creating}
        >
          + Add Doctor
        </button>
      }
    >
      {showAdd && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer} role='dialog' aria-modal='true'>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>Add Doctor</h2>
              <button
                type='button'
                className={styles.closeBtn}
                onClick={() => !creating && setShowAdd(false)}
                aria-label='Close'
                disabled={creating}
              >
                ×
              </button>
            </div>
            <div className={styles.drawerBody}>
              <DoctorForm
                catalog={doctors}
                submitting={creating || loading}
                onSubmit={handleCreateDoctor}
              />
              {progress && <p className={styles.progress}>{progress}</p>}
            </div>
          </div>
        </div>
      )}

      <section className={styles.toolbar}>
        <input
          type='search'
          placeholder='Search by name or specialty…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </section>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {loading ? (
        <Loader message='Loading doctors...' />
      ) : filteredDoctors.length === 0 ? (
        <div className={styles.emptyPanel}>
          <p>No doctors match your filters.</p>
          <button
            type='button'
            className={styles.linkBtn}
            onClick={() => setShowAdd(true)}
          >
            Add the first doctor
          </button>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Status</th>
                <th>Account</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((d) => {
                const account = doctorToProfile[d.id]
                return (
                  <tr key={d.id}>
                    <td>
                      <div className={styles.doctorCell}>
                        <img
                          src={resolveDoctorImage(d.image)}
                          alt=''
                          className={styles.doctorThumb}
                        />
                        <div>
                          <p className={styles.doctorName}>
                            {d.name_en || d.name_ar || 'Unnamed doctor'}
                          </p>
                          {d.name_ar && (
                            <p className={styles.doctorNameAr}>{d.name_ar}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{d.specialty_en || d.specialty_ar || '—'}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      {account ? (
                        <span className={styles.accountLinked}>
                          {account.email}
                        </span>
                      ) : (
                        <span className={styles.accountMissing}>
                          Not linked
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          to={`/doctors/${d.id}`}
                          className={styles.actionLink}
                          target='_blank'
                          rel='noreferrer'
                        >
                          View
                        </Link>
                        <button
                          type='button'
                          className={styles.actionLink}
                          onClick={() => handleArchive(d.id, d.status)}
                        >
                          {d.status === 'archived' ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
