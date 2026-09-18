const LAMBDA_URL = import.meta.env.VITE_AI_LAMBDA_URL

export async function sendMessage(message, conversationHistory = []) {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationHistory,
    }),
  })

  if (!response.ok) {
    throw new Error('AI service request failed')
  }

  const data = await response.json()

  return data.reply
}