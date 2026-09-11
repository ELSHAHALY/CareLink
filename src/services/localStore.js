const STORAGE_KEY = 'carelink_appointments'

function getFallbackAppointments(fallbackAppointments) {
  return Array.isArray(fallbackAppointments) ? [...fallbackAppointments] : []
}

function isStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }

    const testKey = '__carelink_storage_test__'

    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)

    return true
  } catch {
    return false
  }
}

export function loadAppointments(fallbackAppointments = []) {
  const fallback = getFallbackAppointments(fallbackAppointments)

  if (!isStorageAvailable()) {
    return fallback
  }

  try {
    const rawAppointments = window.localStorage.getItem(STORAGE_KEY)

    if (!rawAppointments) {
      return fallback
    }

    const parsedAppointments = JSON.parse(rawAppointments)

    if (!Array.isArray(parsedAppointments)) {
      return fallback
    }

    return parsedAppointments
  } catch {
    return fallback
  }
}

export function saveAppointments(appointments) {
  if (!Array.isArray(appointments) || !isStorageAvailable()) {
    return false
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))

    return true
  } catch {
    return false
  }
}
