import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  render,
  screen,
  within,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react'
import Contact from '../pages/Contact'
import { submitContactForm } from '../services/contactApi'

vi.mock('../services/contactApi', () => ({
  submitContactForm: vi.fn(),
}))

const VALID_VALUES = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Support request',
  message: 'I need help with my appointment.',
}

function createControlledPromise() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Full name'), {
    target: { value: VALID_VALUES.name },
  })
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: VALID_VALUES.email },
  })
  fireEvent.change(screen.getByLabelText('Subject'), {
    target: { value: VALID_VALUES.subject },
  })
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: VALID_VALUES.message },
  })
}

afterEach(() => {
  cleanup()
  submitContactForm.mockReset()
})

describe('Contact', () => {
  it('renders the initial form', () => {
    render(<Contact />)

    expect(
      screen.getByRole('heading', { name: 'Contact Us' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Subject')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Send Message' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0/1000')).toBeInTheDocument()
  })

  it('shows all required-field errors and focuses the first invalid field on empty submission', async () => {
    render(<Contact />)

    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))

    expect(
      await screen.findByText('Full name is required.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Subject is required.')).toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(4)
    expect(submitContactForm).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Full name')).toHaveFocus()
  })

  it('shows field-specific validation errors for invalid values', async () => {
    render(<Contact />)

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'a' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invalid-email' },
    })
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'ab' },
    })
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'short' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))

    expect(
      await screen.findByText('Full name must be at least 2 characters.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(
      screen.getByText('Subject must be at least 3 characters.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Message must be at least 10 characters.'),
    ).toBeInTheDocument()
    expect(submitContactForm).not.toHaveBeenCalled()
  })

  it('clears only the changed field error while the others remain', async () => {
    render(<Contact />)

    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))
    expect(
      await screen.findByText('Full name is required.'),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Jane' },
    })

    expect(screen.queryByText('Full name is required.')).not.toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Subject is required.')).toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()
  })

  it('updates the character counter as the message changes and caps input length', () => {
    render(<Contact />)

    expect(screen.getByText('0/1000')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Hello there' },
    })

    expect(screen.getByText('11/1000')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toHaveAttribute(
      'maxlength',
      '1000',
    )
  })

  it('calls submitContactForm with the entered values and shows the loading state before resolving', async () => {
    const controlled = createControlledPromise()
    submitContactForm.mockReturnValue(controlled.promise)

    render(<Contact />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))

    expect(submitContactForm).toHaveBeenCalledTimes(1)
    expect(submitContactForm).toHaveBeenCalledWith(
      expect.objectContaining({
        name: VALID_VALUES.name,
        email: VALID_VALUES.email,
        subject: VALID_VALUES.subject,
        message: VALID_VALUES.message,
        signal: expect.any(AbortSignal),
      }),
    )

    const submitButton = screen.getByRole('button', { name: 'Sending...' })
    expect(submitButton).toBeDisabled()
    expect(screen.getByLabelText('Full name')).toBeDisabled()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Subject')).toBeDisabled()
    expect(screen.getByLabelText('Message')).toBeDisabled()

    await act(async () => {
      controlled.resolve({
        success: true,
        detail: 'Contact form submitted successfully.',
      })
      await controlled.promise
    })
  })

  it('shows the success state with the server detail and focuses it after a successful submission', async () => {
    submitContactForm.mockResolvedValueOnce({
      success: true,
      detail: 'Contact form submitted successfully.',
    })

    render(<Contact />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))

    const successStatus = await screen.findByRole('status')
    expect(
      within(successStatus).getByRole('heading', { name: 'Message Sent' }),
    ).toBeInTheDocument()
    expect(
      within(successStatus).getByText('Contact form submitted successfully.'),
    ).toBeInTheDocument()

    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Subject')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Message')).not.toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Send Another Message' }),
    ).toBeInTheDocument()
    expect(successStatus).toHaveFocus()
  })

  it('keeps entered values, shows a focused alert, and re-enables controls on API failure', async () => {
    submitContactForm.mockRejectedValueOnce(
      new Error('Unable to send message.'),
    )

    render(<Contact />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Unable to send message.')
    expect(alert).toHaveFocus()

    expect(screen.getByLabelText('Full name')).toHaveValue(VALID_VALUES.name)
    expect(screen.getByLabelText('Email')).toHaveValue(VALID_VALUES.email)
    expect(screen.getByLabelText('Subject')).toHaveValue(VALID_VALUES.subject)
    expect(screen.getByLabelText('Message')).toHaveValue(VALID_VALUES.message)

    expect(screen.getByLabelText('Full name')).toBeEnabled()
    expect(screen.getByLabelText('Email')).toBeEnabled()
    expect(screen.getByLabelText('Subject')).toBeEnabled()
    expect(screen.getByLabelText('Message')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('prevents a second submission dispatched before React commits the submitting state', async () => {
    const controlled = createControlledPromise()
    submitContactForm.mockReturnValue(controlled.promise)

    render(<Contact />)
    fillValidForm()

    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    const form = submitButton.closest('form')

    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(submitContactForm).toHaveBeenCalledTimes(1)

    await act(async () => {
      controlled.resolve({
        success: true,
        detail: 'Contact form submitted successfully.',
      })
      await controlled.promise
    })
  })

  it('resets the form and focuses Full name after Send Another Message', async () => {
    submitContactForm.mockResolvedValueOnce({
      success: true,
      detail: 'Contact form submitted successfully.',
    })

    render(<Contact />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))
    await screen.findByRole('status')

    fireEvent.click(
      screen.getByRole('button', { name: 'Send Another Message' }),
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Message Sent' }),
    ).not.toBeInTheDocument()

    const nameInput = screen.getByLabelText('Full name')
    expect(nameInput).toHaveValue('')
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Subject')).toHaveValue('')
    expect(screen.getByLabelText('Message')).toHaveValue('')
    expect(screen.getByText('0/1000')).toBeInTheDocument()
    expect(nameInput).toHaveFocus()
  })

  it('aborts the in-flight request signal when the component unmounts', async () => {
    const controlled = createControlledPromise()
    let capturedSignal
    submitContactForm.mockImplementation(({ signal }) => {
      capturedSignal = signal
      return controlled.promise
    })

    const { unmount } = render(<Contact />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))

    expect(capturedSignal).toBeInstanceOf(AbortSignal)
    expect(capturedSignal.aborted).toBe(false)

    unmount()

    expect(capturedSignal.aborted).toBe(true)

    controlled.resolve({
      success: true,
      detail: 'Contact form submitted successfully.',
    })
    await controlled.promise
  })
})
