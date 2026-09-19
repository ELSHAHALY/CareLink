import { describe, expect, it } from 'vitest'
import { getLocalResponse } from '../services/aiService'

describe('AI service local responses', () => {
  it.each(['hello', ' Hello ', 'HELLO!', 'hi', 'hey?'])(
    'handles a standalone greeting locally: %s',
    (message) => {
      expect(getLocalResponse(message)).toContain('CareLink AI')
    },
  )

  it.each([
    'Hello, how can I find a doctor?',
    'hello - how do I book?',
    'Hi, I need help',
    'hey can you answer this?',
  ])('does not intercept a greeting inside a question: %s', (message) => {
    expect(getLocalResponse(message)).toBeNull()
  })

  it('only handles other automated phrases when they are standalone', () => {
    expect(getLocalResponse('thank you!')).toContain("You're welcome")
    expect(
      getLocalResponse('thank you for explaining the appointment'),
    ).toBeNull()
    expect(getLocalResponse('goodbye')).toContain('Goodbye')
    expect(getLocalResponse('goodbye, one more question')).toBeNull()
  })
})
