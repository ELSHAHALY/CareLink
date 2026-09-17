import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DoctorForm from '../components/admin/DoctorForm'

// jsdom has no URL.createObjectURL — stub it for the photo preview path.
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview')
  global.URL.revokeObjectURL = vi.fn()
})

const CATALOG = [
  { id: 'uuid-1', name: 'Prof. Example', specialty: 'Oncology' },
  { id: 'uuid-2', name: 'Dr. Sara', specialty: 'Derma' },
]

function fillNewProfile() {
  fireEvent.change(screen.getByPlaceholderText('Name (English) *'), {
    target: { value: 'Dr. Omar Test' },
  })
  fireEvent.change(screen.getByPlaceholderText('Specialty (English) *'), {
    target: { value: 'Cardiology' },
  })
  fireEvent.change(screen.getByPlaceholderText('Login email *'), {
    target: { value: 'OMAR.TEST@Example.COM' },
  })
  fireEvent.change(screen.getByPlaceholderText('Password (min. 6 characters) *'), {
    target: { value: 'secret123' },
  })
}

describe('DoctorForm — smart admin creation (5 cases)', () => {
  it('1. renders new-profile mode with photo upload and bilingual fields', () => {
    render(<DoctorForm catalog={CATALOG} submitting={false} onSubmit={() => {}} />)
    expect(screen.getByPlaceholderText('Name (English) *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Name (Arabic)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Specialty (English) *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Bio (Arabic)')).toBeInTheDocument()
    expect(screen.getByText('Upload photo')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create Doctor Account' }),
    ).toBeInTheDocument()
  })

  it('2. blocks submit with invalid email and reports the error', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <DoctorForm catalog={CATALOG} submitting={false} onSubmit={onSubmit} />,
    )
    fireEvent.submit(container.querySelector('form'))
    expect(
      screen.getByText('Please enter a valid email address'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('3. switches to link-existing mode with the real catalog dropdown', () => {
    render(<DoctorForm catalog={CATALOG} submitting={false} onSubmit={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Link existing' }))
    const select = screen.getByLabelText('Doctor profile')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Prof. Example — Oncology' })).toBeInTheDocument()
    // new-profile-only fields disappear
    expect(screen.queryByPlaceholderText('Name (English) *')).not.toBeInTheDocument()
  })

  it('4. auto-generates the URL slug from the English name', () => {
    render(<DoctorForm catalog={CATALOG} submitting={false} onSubmit={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Name (English) *'), {
      target: { value: 'Dr. Sarah Chen' },
    })
    expect(screen.getByPlaceholderText('Profile URL slug (auto)')).toHaveValue(
      'dr-sarah-chen',
    )
  })

  it('5. submits a normalized payload (lowercased email, parsed services)', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <DoctorForm catalog={CATALOG} submitting={false} onSubmit={onSubmit} />,
    )
    fillNewProfile()
    fireEvent.change(screen.getByPlaceholderText('Services (comma separated)'), {
      target: { value: 'clinic, surgery , ,x-ray' },
    })
    fireEvent.submit(container.querySelector('form'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0]
    expect(payload.mode).toBe('new')
    expect(payload.auth.email).toBe('omar.test@example.com')
    expect(payload.auth.password).toBe('secret123')
    expect(payload.profile.name_en).toBe('Dr. Omar Test')
    expect(payload.profile.services).toEqual(['clinic', 'surgery', 'x-ray'])
    expect(payload.photoFile).toBeNull()
  })
})
