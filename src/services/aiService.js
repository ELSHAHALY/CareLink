/**
 * AI Help Center Service
 *
 * Handles communication with the AI backend.
 * Currently returns mock responses for UI development and testing.
 *
 * Future integration:
 *   Replace the mock logic inside sendMessage() with a fetch() call to
 *   import.meta.env.VITE_AI_LAMBDA_URL — no changes needed in the UI layer.
 */

const MOCK_DELAY_MS = 800

/**
 * Mock responses keyed by topic keywords.
 * The first matching keyword determines the response.
 */
const MOCK_RESPONSES = [
  {
    keywords: ['appointment', 'book', 'schedule', 'reschedule', 'cancel'],
    response:
      'You can manage your appointments from the "My Appointments" page. To book a new appointment, browse our doctors and select an available time slot. Need help with something specific?',
  },
  {
    keywords: ['doctor', 'specialist', 'find'],
    response:
      'You can find doctors by visiting the "Find a Doctor" page. Use the filters to search by specialty, location, or rating. Would you like me to help you find a specific type of doctor?',
  },
  {
    keywords: ['account', 'profile', 'password', 'login', 'register', 'sign'],
    response:
      'For account-related questions, you can update your profile from the Profile page. If you\'re having trouble logging in, try the "Forgot Password" option on the login page.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'help', 'support'],
    response:
      "Hello! I'm here to help you with CareLink. I can assist with booking appointments, finding doctors, managing your account, and more. What would you like to know?",
  },
  {
    keywords: ['thank', 'thanks', 'bye', 'goodbye'],
    response:
      "You're welcome! If you need anything else, feel free to ask. Have a great day! 😊",
  },
  {
    keywords: ['insurance', 'payment', 'cost', 'price', 'fee'],
    response:
      'For billing and insurance questions, please contact our support team at hello@carelink.com or call +20 100 000 0000. They can help with payment details and insurance verification.',
  },
]

const DEFAULT_RESPONSE =
  "Thank you for your question! I'm still learning, but I can help with booking appointments, finding doctors, and managing your account. Could you tell me more about what you need?"

/**
 * Find a mock response based on keyword matching.
 * @param {string} message - The user's message.
 * @returns {string} A contextual mock response.
 */
function getMockResponse(message) {
  const lower = message.toLowerCase()

  for (const entry of MOCK_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response
    }
  }

  return DEFAULT_RESPONSE
}

/**
 * Send a message to the AI backend and return the assistant's response.
 *
 * @param {string} message - The user's current message.
 * @param {Array<{role: string, content: string}>} conversationHistory - Previous messages for context.
 * @returns {Promise<string>} The assistant's reply text.
 *
 * @example
 *   const reply = await sendMessage('How do I book an appointment?', [])
 */
export async function sendMessage(message, conversationHistory = []) {
  // ─── Future implementation ───────────────────────────────────
  // Replace the mock block below with:
  //
  // const res = await fetch(import.meta.env.VITE_AI_LAMBDA_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message, conversationHistory }),
  // })
  //
  // if (!res.ok) throw new Error('AI service request failed')
  //
  // const data = await res.json()
  // return data.reply
  // ─────────────────────────────────────────────────────────────

  // Mock implementation — simulate network latency
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))

  return getMockResponse(message)
}

