import { describe, it, expect, vi, afterEach } from 'vitest'
import { submitContactForm } from '../services/contactApi'

const VALID_INPUT = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Support request',
  message: 'Hello there',
}

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  }
}

function invalidJsonResponse(status) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('submitContactForm', () => {
  it('resolves with success and the server detail on HTTP 200', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse(200, { detail: 'Contact form submitted successfully.' }),
    )

    const result = await submitContactForm(VALID_INPUT)

    expect(result).toEqual({
      success: true,
      detail: 'Contact form submitted successfully.',
    })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('sends exactly the expected URL, method, headers, trimmed body, and signal', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(jsonResponse(200, { detail: 'ok' }))
    const controller = new AbortController()

    await submitContactForm({
      name: '  Jane Doe  ',
      email: '  jane@example.com  ',
      subject: '  Support request  ',
      message: '  Hello there  ',
      signal: controller.signal,
    })

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const [url, options] = globalThis.fetch.mock.calls[0]

    expect(url.endsWith('/api/contact/')).toBe(true)
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(options.body)).toEqual({
      email: 'jane@example.com',
      subject: 'Support request',
      fields: {
        name: 'Jane Doe',
        message: 'Hello there',
      },
    })
    expect(options.signal).toBe(controller.signal)
    // No credentials, Authorization, Cookie, or CSRF key ever gets added.
    expect(Object.keys(options).sort()).toEqual(
      ['body', 'headers', 'method', 'signal'].sort(),
    )
  })

  it('falls back to a stable success message when detail is missing', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(jsonResponse(200, {}))

    const result = await submitContactForm(VALID_INPUT)

    expect(result).toEqual({
      success: true,
      detail: 'Your message was sent successfully.',
    })
  })

  it('rejects with the server-provided "detail" message on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse(400, { detail: 'Invalid email address' }),
    )

    await expect(submitContactForm(VALID_INPUT)).rejects.toThrow(
      'Invalid email address',
    )
  })

  it('rejects with the server-provided "message" value on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse(400, { message: 'Subject is required' }),
    )

    await expect(submitContactForm(VALID_INPUT)).rejects.toThrow(
      'Subject is required',
    )
  })

  it('rejects with the server-provided "error" value on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse(400, { error: 'Rate limit exceeded' }),
    )

    await expect(submitContactForm(VALID_INPUT)).rejects.toThrow(
      'Rate limit exceeded',
    )
  })

  it('rejects with a stable status message when the HTTP error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(invalidJsonResponse(500))

    await expect(submitContactForm(VALID_INPUT)).rejects.toThrow(
      'Request failed with status 500.',
    )
  })

  it('falls back to the status message when the HTTP error JSON has no usable message', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse(422, { fieldErrors: {} }),
    )

    await expect(submitContactForm(VALID_INPUT)).rejects.toThrow(
      'Request failed with status 422.',
    )
  })

  it('rejects when a 200 response body cannot be parsed as JSON', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockResolvedValueOnce(invalidJsonResponse(200))

    await expect(submitContactForm(VALID_INPUT)).rejects.toThrow(
      'The server returned an unexpected response. Please try again later.',
    )
  })

  it('rejects with a stable message when fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn())
    globalThis.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(submitContactForm(VALID_INPUT)).rejects.toThrow(
      'Unable to reach the server. Please check your connection and try again.',
    )
  })

  it('rethrows an AbortError unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const abortError = new DOMException('Aborted', 'AbortError')
    globalThis.fetch.mockRejectedValueOnce(abortError)

    await expect(submitContactForm(VALID_INPUT)).rejects.toBe(abortError)
  })
})
