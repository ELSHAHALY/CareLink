import { useState } from 'react'
import { FiStar } from 'react-icons/fi'
import {
  MAX_COMMENT_LENGTH,
  submitRating,
  validateRatingInput,
} from '../../services/ratings'
import styles from './RatingForm.module.css'

const CATEGORIES = [
  { key: 'bedside_manner', label: 'Bedside Manner' },
  { key: 'communication', label: 'Communication' },
  { key: 'wait_time', label: 'Wait Time' },
]

/**
 * Patient review form for one completed appointment.
 * Sends ONLY the allowed fields to the submit-rating Edge Function;
 * identity, status and verification are derived server-side.
 */
export default function RatingForm({ appointmentId, onSubmitted, onCancel }) {
  const [score, setScore] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [categories, setCategories] = useState({
    bedside_manner: null,
    communication: null,
    wait_time: null,
  })
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setCategory(key, value) {
    setCategories((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      appointment_id: appointmentId,
      score,
      bedside_manner: categories.bedside_manner,
      communication: categories.communication,
      wait_time: categories.wait_time,
      comment: comment.trim(),
    }
    const validationError = validateRatingInput(payload)
    if (validationError) {
      setError(validationError)
      return
    }
    setSubmitting(true)
    setError('')
    const result = await submitRating(payload)
    setSubmitting(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    if (onSubmitted) onSubmitted(result)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <span className={styles.label}>Overall rating</span>
        <div
          className={styles.stars}
          role='radiogroup'
          aria-label='Overall rating'
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= (hovered || score)
            return (
              <button
                key={value}
                type='button'
                role='radio'
                aria-checked={score === value}
                aria-label={`${value} star${value !== 1 ? 's' : ''}`}
                className={`${styles.starBtn} ${
                  active ? styles.starActive : ''
                }`}
                onClick={() => {
                  setScore(value)
                  setError('')
                }}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                disabled={submitting}
              >
                <FiStar className={styles.starIcon} />
              </button>
            )
          })}
        </div>
      </div>

      {CATEGORIES.map(({ key, label }) => (
        <div key={key} className={styles.field}>
          <label className={styles.label} htmlFor={`rating-${key}`}>
            {label} <span className={styles.optional}>(optional)</span>
          </label>
          <select
            id={`rating-${key}`}
            className={styles.select}
            value={categories[key] ?? ''}
            onChange={(e) =>
              setCategory(
                key,
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            disabled={submitting}
          >
            <option value=''>Skip</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className={styles.field}>
        <label className={styles.label} htmlFor='rating-comment'>
          Your review
        </label>
        <textarea
          id='rating-comment'
          className={styles.textarea}
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder='How was your visit?'
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
            setError('')
          }}
          disabled={submitting}
        />
        <span className={styles.hint}>
          {comment.trim().length}/{MAX_COMMENT_LENGTH} — reviews are published
          after admin review.
        </span>
      </div>

      {error && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button
            type='button'
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type='submit'
          className={styles.submitBtn}
          disabled={submitting || score === 0}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}
