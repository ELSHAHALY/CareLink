import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiStar } from 'react-icons/fi'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import { useDoctorsCatalog } from '../hooks/useDoctorsCatalog'
import { fetchAdminRatings, moderateRating } from '../services/ratings'
import styles from './AdminRatings.module.css'

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'hidden', label: 'Hidden' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminRatings() {
  const { doctorMap } = useDoctorsCatalog()
  const [tab, setTab] = useState('pending')
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [notes, setNotes] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await fetchAdminRatings(tab)
    if (!result.success) {
      setError(result.error)
      setRatings([])
    } else {
      setRatings(result.ratings)
    }
    setLoading(false)
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => ({ total: ratings.length }), [ratings])

  async function handleModerate(id, action) {
    setActingId(id)
    setError('')
    const result = await moderateRating(id, action, notes[id] || '')
    setActingId(null)
    if (!result.success) {
      setError(result.error)
      return
    }
    setRatings((prev) => prev.filter((r) => r.id !== id))
    setNotes((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <DashboardLayout
      title='Review Moderation'
      subtitle='Approve or hide patient reviews. Only status changes are allowed.'
    >
      <div className={styles.tabs} role='tablist' aria-label='Review status'>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type='button'
            role='tab'
            aria-selected={tab === key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}

      {loading ? (
        <Loader message='Loading reviews...' />
      ) : ratings.length === 0 ? (
        <EmptyState
          icon={<FiStar />}
          message={`No ${tab} reviews. ${
            counts.total === 0 ? 'New patient reviews will appear here.' : ''
          }`}
        />
      ) : (
        <ul className={styles.list}>
          {ratings.map((rating) => {
            const doctor = doctorMap[String(rating.doctor_id)]
            const busy = actingId === rating.id
            return (
              <li key={rating.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.doctorName}>
                      {doctor?.name || 'Unknown Doctor'}
                    </p>
                    <p className={styles.meta}>
                      {rating.patient_name || 'Patient'} •{' '}
                      {formatDate(rating.review_date)} • score {rating.score}/5
                    </p>
                  </div>
                  <div className={styles.badges}>
                    <span className={styles.badge}>{rating.source}</span>
                    <span className={styles.badge}>
                      {rating.is_verified ? 'verified' : 'unverified'}
                    </span>
                  </div>
                </div>
                <p className={styles.comment}>{rating.comment}</p>
                <div className={styles.scores}>
                  {[
                    ['Bedside', rating.bedside_manner],
                    ['Communication', rating.communication],
                    ['Wait', rating.wait_time],
                  ].map(([label, value]) => (
                    <span key={label} className={styles.score}>
                      {label}: {typeof value === 'number' ? value : '—'}
                    </span>
                  ))}
                </div>
                <div className={styles.moderation}>
                  <input
                    type='text'
                    className={styles.noteInput}
                    placeholder='Moderation note (optional)'
                    maxLength={1000}
                    value={notes[rating.id] || ''}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [rating.id]: e.target.value,
                      }))
                    }
                    disabled={busy}
                    aria-label={`Moderation note for review by ${
                      rating.patient_name || 'patient'
                    }`}
                  />
                  <div className={styles.actions}>
                    {tab !== 'published' && (
                      <button
                        type='button'
                        className={styles.publishBtn}
                        disabled={busy}
                        onClick={() => handleModerate(rating.id, 'publish')}
                      >
                        {busy ? 'Working…' : 'Publish'}
                      </button>
                    )}
                    {tab !== 'hidden' && (
                      <button
                        type='button'
                        className={styles.hideBtn}
                        disabled={busy}
                        onClick={() => handleModerate(rating.id, 'hide')}
                      >
                        {busy ? 'Working…' : 'Hide'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardLayout>
  )
}
