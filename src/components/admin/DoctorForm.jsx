import { useEffect, useState } from 'react'
import {
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation'
import {
  doctorOptionLabel,
  parseServicesInput,
  slugifyName,
  validateDoctorProfile,
} from '../../utils/doctors'
import { validateDoctorImage } from '../../services/doctorImages'
import styles from './DoctorForm.module.css'

const EMPTY_PROFILE = {
  slug: '',
  name_en: '',
  name_ar: '',
  specialty_en: '',
  specialty_ar: '',
  bio_en: '',
  bio_ar: '',
  servicesText: '',
}

export default function DoctorForm({ catalog, submitting, onSubmit }) {
  const [mode, setMode] = useState('new')
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [slugTouched, setSlugTouched] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  function setField(key, value) {
    setProfile((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name_en' && !slugTouched) {
        next.slug = slugifyName(value)
      }
      return next
    })
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] || null
    if (!file) {
      setPhotoFile(null)
      return
    }
    const check = validateDoctorImage(file)
    if (!check.ok) {
      setFormError(check.error)
      e.target.value = ''
      return
    }
    setFormError('')
    setPhotoFile(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const trimmedEmail = email.trim().toLowerCase()
    if (!validateEmail(trimmedEmail)) {
      setFormError('Please enter a valid email address')
      return
    }
    if (!validatePassword(password)) {
      setFormError('Password must be at least 6 characters')
      return
    }

    if (mode === 'link') {
      if (!doctorId) {
        setFormError('Please select a doctor profile')
        return
      }
      const name = accountName.trim() || email.trim().split('@')[0]
      if (!validateName(name)) {
        setFormError('Account name must be at least 2 characters')
        return
      }
      onSubmit({
        mode,
        doctorId,
        auth: { name, email: trimmedEmail, password },
        photoFile: null,
        profile: null,
      })
      return
    }

    const profileError = validateDoctorProfile(profile)
    if (profileError) {
      setFormError(profileError)
      return
    }
    const hasLatinChars = /[a-zA-Z]/.test(profile.name_en)
    const fallbackName = hasLatinChars
      ? profile.name_en.trim()
      : slugifyName(profile.name_en) || trimmedEmail.split('@')[0]
    const name = accountName.trim() || fallbackName
    if (!validateName(name)) {
      setFormError('Account name must be at least 2 characters')
      return
    }
    onSubmit({
      mode,
      doctorId: null,
      profile: {
        ...profile,
        name_en: profile.name_en.trim(),
        services: parseServicesInput(profile.servicesText),
      },
      auth: { name, email: trimmedEmail, password },
      photoFile,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div
        className={styles.modeToggle}
        role='tablist'
        aria-label='Creation mode'
      >
        <button
          type='button'
          role='tab'
          aria-selected={mode === 'new'}
          className={`${styles.modeBtn} ${
            mode === 'new' ? styles.modeBtnActive : ''
          }`}
          onClick={() => setMode('new')}
          disabled={submitting}
        >
          New profile
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={mode === 'link'}
          className={`${styles.modeBtn} ${
            mode === 'link' ? styles.modeBtnActive : ''
          }`}
          onClick={() => setMode('link')}
          disabled={submitting}
        >
          Link existing
        </button>
      </div>

      {mode === 'link' ? (
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          className={styles.select}
          aria-label='Doctor profile'
        >
          <option value=''>Select doctor profile</option>
          {catalog.map((d) => (
            <option key={d.id} value={d.id}>
              {doctorOptionLabel(d)}
            </option>
          ))}
        </select>
      ) : (
        <>
          <div className={styles.photoRow}>
            {photoPreview ? (
              <img
                src={photoPreview}
                alt='Doctor photo preview'
                className={styles.photoPreview}
              />
            ) : (
              <div className={styles.photoPlaceholder} aria-hidden='true'>
                No photo
              </div>
            )}
            <label className={styles.photoBtn}>
              {photoFile ? 'Change photo' : 'Upload photo'}
              <input
                type='file'
                accept='image/jpeg,image/png,image/webp'
                onChange={handlePhotoChange}
                className={styles.photoInput}
                disabled={submitting}
              />
            </label>
            {photoFile && <span className={styles.fileName}>{photoFile.name}</span>}
          </div>

          <input
            type='text'
            placeholder='Name (English) *'
            value={profile.name_en}
            onChange={(e) => setField('name_en', e.target.value)}
            className={styles.input}
            disabled={submitting}
          />
          <input
            type='text'
            placeholder='Name (Arabic)'
            value={profile.name_ar}
            onChange={(e) => setField('name_ar', e.target.value)}
            className={styles.input}
            dir='auto'
            disabled={submitting}
          />
          <input
            type='text'
            placeholder='Specialty (English) *'
            value={profile.specialty_en}
            onChange={(e) => setField('specialty_en', e.target.value)}
            className={styles.input}
            disabled={submitting}
          />
          <input
            type='text'
            placeholder='Specialty (Arabic)'
            value={profile.specialty_ar}
            onChange={(e) => setField('specialty_ar', e.target.value)}
            className={styles.input}
            dir='auto'
            disabled={submitting}
          />
          <textarea
            placeholder='Bio (English)'
            value={profile.bio_en}
            onChange={(e) => setField('bio_en', e.target.value)}
            className={`${styles.input} ${styles.textarea}`}
            rows={3}
            disabled={submitting}
          />
          <textarea
            placeholder='Bio (Arabic)'
            value={profile.bio_ar}
            onChange={(e) => setField('bio_ar', e.target.value)}
            className={`${styles.input} ${styles.textarea}`}
            dir='auto'
            rows={3}
            disabled={submitting}
          />
          <input
            type='text'
            placeholder='Services (comma separated)'
            value={profile.servicesText}
            onChange={(e) => setField('servicesText', e.target.value)}
            className={styles.input}
            disabled={submitting}
          />
          <input
            type='text'
            placeholder='Profile URL slug (auto)'
            value={profile.slug}
            onChange={(e) => {
              setSlugTouched(true)
              setField('slug', slugifyName(e.target.value))
            }}
            className={styles.input}
            disabled={submitting}
          />
        </>
      )}

      <input
        type='text'
        placeholder='Account display name (defaults to doctor name)'
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
        className={styles.input}
        disabled={submitting}
      />
      <input
        type='email'
        placeholder='Login email *'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
        autoComplete='off'
        disabled={submitting}
      />
      <input
        type='password'
        placeholder='Password (min. 6 characters) *'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
        autoComplete='new-password'
        disabled={submitting}
      />
      <button type='submit' className={styles.button} disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Doctor Account'}
      </button>

      {formError && <p className={styles.error}>{formError}</p>}
      {mode === 'new' && (
        <p className={styles.hint}>
          The profile is published immediately. The photo uploads first — if
          account creation fails, the profile is parked as draft.
        </p>
      )}
    </form>
  )
}