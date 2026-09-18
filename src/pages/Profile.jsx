import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { FaUserEdit, FaCheck, FaTimes, FaSignOutAlt } from 'react-icons/fa'
import useAuth from '../hooks/useAuth'
import supabase, { isSupabaseConfigured } from '../services/supabase'
// تم إزالة استيراد DashboardLayout
import Loader from '../components/common/Loader'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, authLoading, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    if (!isSupabaseConfigured || !supabase) {
      setProfile({ name: user.name, email: user.email, role: user.role })
      setName(user.name)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email, role, created_at')
        .eq('id', user.id)
        .single()

      if (error) {
        setProfile({ name: user.name, email: user.email, role: user.role })
        setName(user.name)
      } else if (data) {
        setProfile(data)
        setName(data.name)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [user, authLoading])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Name cannot be empty')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!isSupabaseConfigured || !supabase) {
        setProfile({ ...profile, name })
        setSuccess('Profile updated')
        setEditMode(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, name: name.trim() })
      setSuccess('Profile updated')
      setEditMode(false)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }, [name, profile, user])

  if (authLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader message='Checking session...' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.page}>
        <h1 className={styles.title}>My Profile</h1>

        {loading ? (
          <Loader message='Loading profile...' />
        ) : (
          <div className={styles.content}>
            <section className={styles.card}>
              <div className={styles.header}>
                <div className={styles.avatar}>
                  {profile?.name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase()}
                </div>
                <div className={styles.headerInfo}>
                  <h2 className={styles.name}>
                    {editMode ? (
                      <input
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.editInput}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave()
                          if (e.key === 'Escape') {
                            setEditMode(false)
                            setName(profile?.name || user.name)
                            setError('')
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      profile?.name
                    )}
                  </h2>
                  <span className={styles.roleBadge}>{profile?.role}</span>
                </div>
              </div>

              <dl className={styles.details}>
                <div className={styles.detailRow}>
                  <dt>Email</dt>
                  <dd>{profile?.email}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Role</dt>
                  <dd>{profile?.role}</dd>
                </div>
                {profile?.created_at && (
                  <div className={styles.detailRow}>
                    <dt>Member since</dt>
                    <dd>
                      {new Date(profile.created_at).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </dd>
                  </div>
                )}
              </dl>

              <div className={styles.actionGroup}>
                {!editMode ? (
                  <button
                    type='button'
                    className={styles.editBtn}
                    onClick={() => setEditMode(true)}
                  >
                    <FaUserEdit />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button
                      type='button'
                      className={styles.cancelBtn}
                      onClick={() => {
                        setEditMode(false)
                        setName(profile?.name || user.name)
                        setError('')
                      }}
                    >
                      <FaTimes />
                      <span>Cancel</span>
                    </button>
                    <button
                      type='button'
                      className={styles.saveBtn}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <FaCheck />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}

                <button
                  type='button'
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>

              {error && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.success}>{success}</p>}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}