/**
 * Timezone utilities for appointment handling.
 *
 * Strategy: Store appointment times as "local time" strings (HH:mm) in the doctor's timezone.
 * Display times converted to the viewer's local timezone using browser Intl API.
 *
 * For production, consider migrating to full UTC timestamps with timezone storage.
 */

export function getDoctorTimezone(doctor) {
  // Try to derive timezone from doctor's location state/city
  // This is a fallback - in production, store timezone explicitly
  if (!doctor?.location) return Intl.DateTimeFormat().resolvedOptions().timeZone

  const timezoneMap = {
    // US states
    AL: 'America/Chicago',
    AK: 'America/Anchorage',
    AZ: 'America/Phoenix',
    AR: 'America/Chicago',
    CA: 'America/Los_Angeles',
    CO: 'America/Denver',
    CT: 'America/New_York',
    DE: 'America/New_York',
    FL: 'America/New_York',
    GA: 'America/New_York',
    HI: 'Pacific/Honolulu',
    ID: 'America/Denver',
    IL: 'America/Chicago',
    IN: 'America/Indiana/Indianapolis',
    IA: 'America/Chicago',
    KS: 'America/Chicago',
    KY: 'America/New_York',
    LA: 'America/Chicago',
    ME: 'America/New_York',
    MD: 'America/New_York',
    MA: 'America/New_York',
    MI: 'America/Detroit',
    MN: 'America/Chicago',
    MS: 'America/Chicago',
    MO: 'America/Chicago',
    MT: 'America/Denver',
    NE: 'America/Chicago',
    NV: 'America/Los_Angeles',
    NH: 'America/New_York',
    NJ: 'America/New_York',
    NM: 'America/Denver',
    NY: 'America/New_York',
    NC: 'America/New_York',
    ND: 'America/Chicago',
    OH: 'America/New_York',
    OK: 'America/Chicago',
    OR: 'America/Los_Angeles',
    PA: 'America/New_York',
    RI: 'America/New_York',
    SC: 'America/New_York',
    SD: 'America/Chicago',
    TN: 'America/Chicago',
    TX: 'America/Chicago',
    UT: 'America/Denver',
    VT: 'America/New_York',
    VA: 'America/New_York',
    WA: 'America/Los_Angeles',
    WV: 'America/New_York',
    WI: 'America/Chicago',
    WY: 'America/Denver',
    DC: 'America/New_York',
  }

  if (doctor.location.state && timezoneMap[doctor.location.state]) {
    return timezoneMap[doctor.location.state]
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert a local time string (HH:mm) in a given timezone to the user's local time
 * @param {string} timeStr - Time in HH:mm format
 * @param {string} sourceTz - Source timezone (doctor's timezone)
 * @returns {string} Formatted time in user's local timezone
 */
export function convertTimeToLocal(timeStr, sourceTz) {
  if (!timeStr) return ''

  try {
    const now = new Date()
    const [hours, minutes] = timeStr.split(':').map(Number)

    // Create date in source timezone at today's date
    const sourceDate = new Date(
      now.toLocaleString('en-US', { timeZone: sourceTz }),
    )
    sourceDate.setHours(hours, minutes, 0, 0)

    // Format in user's local timezone
    return sourceDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return timeStr
  }
}

/**
 * Format time for display with timezone indicator
 * @param {string} timeStr - Time in HH:mm format
 * @param {string} sourceTz - Source timezone
 * @param {boolean} showTz - Whether to show timezone abbreviation
 * @returns {string} Formatted time string
 */
export function formatTimeForDisplay(timeStr, sourceTz, showTz = true) {
  const localTime = convertTimeToLocal(timeStr, sourceTz)
  if (!showTz) return localTime

  try {
    const now = new Date()
    const [hours, minutes] = timeStr.split(':').map(Number)
    const sourceDate = new Date(
      now.toLocaleString('en-US', { timeZone: sourceTz }),
    )
    sourceDate.setHours(hours, minutes, 0, 0)

    const tzAbbr = sourceDate
      .toLocaleTimeString([], {
        timeZone: sourceTz,
        timeZoneName: 'short',
      })
      .split(' ')
      .pop()

    return `${localTime} (${tzAbbr || sourceTz})`
  } catch {
    return `${timeStr} (${sourceTz})`
  }
}

/**
 * Get the user's current timezone
 */
export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Check if two timezones are equivalent
 */
export function timezonesEqual(tz1, tz2) {
  if (!tz1 || !tz2) return false
  return tz1 === tz2
}
