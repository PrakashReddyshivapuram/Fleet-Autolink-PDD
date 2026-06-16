import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RegisterPage from '@/pages/RegisterPage'

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, rtdb: {} }))
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ register: vi.fn() }),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
      <a href={String(to)}>{children}</a>,
  }
})

describe('RegisterPage — Branding', () => {
  it('renders the Fleet AutoLink brand name', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Fleet AutoLink')).toBeInTheDocument()
  })

  it('shows "Create your account" under the logo', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  it('shows the footer secure platform text', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/secure platform/i)).toBeInTheDocument()
  })

  it('shows All rights reserved in footer', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument()
  })
})

describe('RegisterPage — Form Headings', () => {
  it('shows "Get started" heading', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument()
  })

  it('shows "Join your fleet in under a minute" subtitle', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/join your fleet in under a minute/i)).toBeInTheDocument()
  })
})

describe('RegisterPage — Form Fields', () => {
  it('renders the Full name input', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
  })

  it('Full name input is required', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('John Doe')).toHaveAttribute('required')
  })

  it('renders the Phone input', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('+91 ...')).toBeInTheDocument()
  })

  it('Phone input is optional (no required attr)', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('+91 ...')).not.toHaveAttribute('required')
  })

  it('Phone input is of type tel', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('+91 ...')).toHaveAttribute('type', 'tel')
  })

  it('renders the Email input', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
  })

  it('Email input is of type email', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('you@company.com')).toHaveAttribute('type', 'email')
  })

  it('Email input is required', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('you@company.com')).toHaveAttribute('required')
  })

  it('renders the Password input', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument()
  })

  it('Password is type password by default', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('Min. 6 characters')).toHaveAttribute('type', 'password')
  })

  it('Password input is required', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('Min. 6 characters')).toHaveAttribute('required')
  })
})

describe('RegisterPage — Role Selection', () => {
  it('renders the Driver role option', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Driver')).toBeInTheDocument()
  })

  it('renders the Mechanic role option', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Mechanic')).toBeInTheDocument()
  })

  it('shows Driver role description', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Manage trips')).toBeInTheDocument()
  })

  it('shows Mechanic role description', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Handle maintenance')).toBeInTheDocument()
  })

  it('shows "Select role" label', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/select role/i)).toBeInTheDocument()
  })
})

describe('RegisterPage — Submit & Navigation', () => {
  it('renders the Create account button', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('Create account button is type submit', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toHaveAttribute('type', 'submit')
  })

  it('shows "Already registered?" prompt', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/already registered/i)).toBeInTheDocument()
  })

  it('shows the Sign in link', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('Sign in link points to /login', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Sign in').closest('a')).toHaveAttribute('href', '/login')
  })
})
