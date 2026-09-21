const LAMBDA_URL = import.meta.env.VITE_AI_LAMBDA_URL?.trim()
const AI_ENDPOINT = import.meta.env.DEV ? '/api/ai' : LAMBDA_URL

const LOCAL_RESPONSES = [
  {
    keywords: ['hello', 'hi', 'hey'],
    response:
      "Hello! I'm CareLink AI, and I'm here to help you. I can assist with booking appointments, finding doctors, and managing your account. What would you like to know?",
  },
  {
    keywords: ['thanks', 'thank you', 'thx'],
    response: "You're welcome! If you need anything else, feel free to ask.",
  },
  {
    keywords: ['bye', 'goodbye'],
    response: 'Goodbye! Have a great day.',
  },
]

export function getLocalResponse(message) {
  // Ignore surrounding punctuation, but only match the complete message.
  // For example, "Hello!" is local while "Hello - how do I find a doctor?"
  // must be sent to the AI service.
  const normalizedMessage = message
    .toLowerCase()
    .trim()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')

  for (const item of LOCAL_RESPONSES) {
    const isMatch = item.keywords.includes(normalizedMessage)

    if (isMatch) {
      return item.response
    }
  }

  return null
}

export async function sendMessage(message, conversationHistory = []) {
  const localResponse = getLocalResponse(message)

  if (localResponse) {
    return localResponse
  }

  if (!LAMBDA_URL) {
    throw new Error(
      'Missing VITE_AI_LAMBDA_URL. Add it to .env and restart the Vite server.',
    )
  }

  let response
  try {
    response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    })
  } catch (error) {
    throw new Error(`Unable to reach the AI service. ${error.message}`, {
      cause: error,
    })
  }

  const responseText = await response.text()
  let data

  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch (error) {
    throw new Error('AI service returned an invalid JSON response.', {
      cause: error,
    })
  }

  if (!response.ok) {
    const detail =
      data.error || data.message || data.reply || response.statusText
    throw new Error(`AI service request failed (${response.status}): ${detail}`)
  }

  const reply = data.reply || data.message

  if (typeof reply !== 'string' || !reply.trim()) {
    throw new Error('AI service response did not contain a reply.')
  }

  return reply
}
