const FALLBACK_BASE_URL = 'https://gig-program-apis-production.up.railway.app'
const CONTACT_PATH = '/api/contact/'

const rawBaseUrl = import.meta.env.VITE_GIG_API_BASE_URL
const configuredBaseUrl =
  typeof rawBaseUrl === 'string' ? rawBaseUrl.trim() : ''
const baseUrl = configuredBaseUrl || FALLBACK_BASE_URL

const CONTACT_ENDPOINT = `${baseUrl.replace(/\/+$/, '')}${CONTACT_PATH}`

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function pickErrorMessage(data) {
  if (!data || typeof data !== 'object') {
    return null
  }
  const candidates = [data.detail, data.message, data.error]
  const found = candidates.find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  )
  return found || null
}

function rethrowIfAborted(err) {
  if (err?.name === 'AbortError') {
    throw err
  }
}

export async function submitContactForm({
  name,
  email,
  subject,
  message,
  signal,
}) {
  const payload = {
    email: toTrimmedString(email),
    subject: toTrimmedString(subject),
    fields: {
      name: toTrimmedString(name),
      message: toTrimmedString(message),
    },
  }

  let response
  try {
    response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (err) {
    rethrowIfAborted(err)
    throw new Error(
      'Unable to reach the server. Please check your connection and try again.',
    )
  }

  if (!response.ok) {
    let serverMessage = null
    try {
      const errorData = await response.json()
      serverMessage = pickErrorMessage(errorData)
    } catch (err) {
      rethrowIfAborted(err)
      serverMessage = null
    }
    throw new Error(
      serverMessage || `Request failed with status ${response.status}.`,
    )
  }

  let data
  try {
    data = await response.json()
  } catch (err) {
    rethrowIfAborted(err)
    throw new Error(
      'The server returned an unexpected response. Please try again later.',
    )
  }

  const detail =
    typeof data?.detail === 'string' && data.detail.trim()
      ? data.detail
      : 'Your message was sent successfully.'

  return { success: true, detail }
}
