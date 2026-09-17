import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { useDoctorById } from '../hooks/useDoctors'
import { resolveDoctorImage } from '../utils/doctors'
import supabase, { isSupabaseConfigured } from '../services/supabase'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import styles from './DoctorProfilePage.module.css'

export default function DoctorProfilePage() {
  const { user, loading } = useAuth()
  const { doctor, loading: doctorLoading } = useDoctorById(user?.doctorId)

  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [bioEn, setBioEn] = useState('')
  const [bioAr, setBioAr] = useState('')

  useEffect(() => {
    if (doctor) {
      setBioEn(doctor.bio_en || doctor.bio || '')
      setBioAr(doctor.bio_ar || '')
    }
  }, [doctor])

  const handleSave = useCallback(async () => {
    if (!doctor) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase not configured. Cannot save changes.')
        return
      }

      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          bio_en: bioEn.trim(),
          bio_ar: bioAr.trim(),
        })
        .eq('id', doctor.id)

      if (updateError) throw updateError

      setSuccess('Profile updated successfully')
      setEditMode(false)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }, [bioEn, bioAr, doctor])

  const handleCancel = () => {
    setBioEn(doctor?.bio_en || doctor?.bio || '')
    setBioAr(doctor?.bio_ar || '')
    setEditMode(false)
    setError('')
    setSuccess('')
  }

  if (loading || (user?.role === 'doctor' && user?.doctorId && doctorLoading)) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Loading profile...' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (user.role !== 'doctor') {
    if (user.role === 'admin') return <Navigate to='/admin/doctors' replace />
    return <Navigate to='/dashboard' replace />
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <p className={styles.error}>
          Doctor profile not found. Ask your admin to link your account to a
          doctor in the catalog.
        </p>
      </DashboardLayout>
    )
  }

  const languages = doctor.languages || []
  const specializations = doctor.specializations || []

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>My Profile</h1>
          {!editMode && (
            <button
              type='button'
              className={styles.editBtn}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          )}
        </header>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <section className={styles.card}>
          <div className={styles.header}>
            {resolveDoctorImage(doctor.image) && (
              <img
                src={resolveDoctorImage(doctor.image)}
                alt={doctor.name}
                className={styles.avatar}
              />
            )}
            <div className={styles.headerInfo}>
              <h2 className={styles.name}>{doctor.name}</h2>
              {doctor.specialty && (
                <p className={styles.specialty}>{doctor.specialty}</p>
              )}
              {doctor.yearsOfExperience > 0 && (
                <p className={styles.experience}>
                  {doctor.yearsOfExperience} years of experience
                </p>
              )}
            </div>
          </div>

          {editMode ? (
            <form
              className={styles.editForm}
              onSubmit={(e) => e.preventDefault()}
            >
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor='bio_en'>
                  Bio (English)
                </label>
                <textarea
                  id='bio_en'
                  value={bioEn}
                  onChange={(e) => setBioEn(e.target.value)}
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor='bio_ar'>
                  Bio (Arabic)
                </label>
                <textarea
                  id='bio_ar'
                  value={bioAr}
                  onChange={(e) => setBioAr(e.target.value)}
                  className={styles.textarea}
                  dir='auto'
                  rows={4}
                />
              </div>

              <div className={styles.editActions}>
                <button
                  type='button'
                  className={styles.cancelBtn}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {bioEn && <p className={styles.bio}>{bioEn}</p>}

              <dl className={styles.details}>
                <div className={styles.detailRow}>
                  <dt>Account email</dt>
                  <dd>{user.email}</dd>
                </div>
                {bioEn && (
                  <div className={styles.detailRow}>
                    <dt>Bio (English)</dt>
                    <dd>{bioEn}</dd>
                  </div>
                )}
                {bioAr && (
                  <div className={styles.detailRow}>
                    <dt>Bio (Arabic)</dt>
                    <dd>{bioAr}</dd>
                  </div>
                )}
                {doctor.phone && (
                  <div className={styles.detailRow}>
                    <dt>Phone</dt>
                    <dd>{doctor.phone}</dd>
                  </div>
                )}
                {doctor.location?.address && (
                  <div className={styles.detailRow}>
                    <dt>Address</dt>
                    <dd>{doctor.location.address}</dd>
                  </div>
                )}
                {doctor.location?.city && (
                  <div className={styles.detailRow}>
                    <dt>City</dt>
                    <dd>{doctor.location.city}</dd>
                  </div>
                )}
                {doctor.location?.state && (
                  <div className={styles.detailRow}>
                    <dt>State</dt>
                    <dd>{doctor.location.state}</dd>
                  </div>
                )}
                {doctor.location?.zip && (
                  <div className={styles.detailRow}>
                    <dt>ZIP</dt>
                    <dd>{doctor.location.zip}</dd>
                  </div>
                )}
                {languages.length > 0 && (
                  <div className={styles.detailRow}>
                    <dt>Languages</dt>
                    <dd>{languages.join(', ')}</dd>
                  </div>
                )}
                {specializations.length > 0 && (
                  <div className={styles.detailRow}>
                    <dt>Specializations</dt>
                    <dd>{specializations.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
