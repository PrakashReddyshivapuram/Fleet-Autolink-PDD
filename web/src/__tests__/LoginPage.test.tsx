import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from '@/pages/LoginPage'

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, rtdb: {} }))
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    completeGoogleProfile: vi.fn(),
  }),
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

describe('LoginPage — Branding', () => {
  it('renders the Fleet AutoLink brand name', () => {
    render(<LoginPage />)
    expect(screen.getAllByText('Fleet AutoLink').length).toBeGreaterThan(0)
  })

  it('shows the Fleet Management Platform tagline', () => {
    render(<LoginPage />)
    expect(screen.getByText('Fleet Management Platform')).toBeInTheDocument()
  })

  it('shows the footer secure platform text', () => {
    render(<LoginPage />)
    expect(screen.getByText(/secure platform/i)).toBeInTheDocument()
  })

  it('shows the All rights reserved footer', () => {
    render(<LoginPage />)
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument()
  })
})

describe('LoginPage — Sign In Form', () => {
  it('shows the Sign in heading', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('shows "Access your fleet dashboard" subtitle', () => {
    render(<LoginPage />)
    expect(screen.getByText(/access your fleet dashboard/i)).toBeInTheDocument()
  })

  it('renders the email input', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
  })

  it('email input is of type email', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('you@company.com')).toHaveAttribute('type', 'email')
  })

  it('email input is required', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('you@company.com')).toHaveAttribute('required')
  })

  it('renders the password input', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('password input is type password by default', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
  })

  it('password input is required', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('required')
  })

  it('renders the Sign in submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('Sign in button is of type submit', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /^sign in$/i })).toHaveAttribute('type', 'submit')
  })
})

describe('LoginPage — Google Sign In', () => {
  it('renders the Continue with Google button', () => {
    render(<LoginPage />)
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
  })

  it('shows the "or" divider between Google and email login', () => {
    render(<LoginPage />)
    expect(screen.getByText(/^or$/i)).toBeInTheDocument()
  })
})

describe('LoginPage — Navigation', () => {
  it('renders the Register link', () => {
    render(<LoginPage />)
    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('Register link points to /register', () => {
    render(<LoginPage />)
    expect(screen.getByText('Register').closest('a')).toHaveAttribute('href', '/register')
  })

  it('shows "No account?" prompt', () => {
    render(<LoginPage />)
    expect(screen.getByText(/no account/i)).toBeInTheDocument()
  })
})

describe('LoginPage — Demo Accounts', () => {
  it('shows the test accounts section', () => {
    render(<LoginPage />)
    expect(screen.getByText(/test accounts/i)).toBeInTheDocument()
  })

  it('shows the Admin demo account', () => {
    render(<LoginPage />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows the Owner demo account', () => {
    render(<LoginPage />)
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('shows the Driver demo account', () => {
    render(<LoginPage />)
    expect(screen.getByText('Driver')).toBeInTheDocument()
  })

  it('shows the Mechanic demo account', () => {
    render(<LoginPage />)
    expect(screen.getByText('Mechanic')).toBeInTheDocument()
  })

  it('shows the demo password hint pw: test1234', () => {
    render(<LoginPage />)
    expect(screen.getByText(/pw: test1234/i)).toBeInTheDocument()
  })

  it('shows the "First click creates the account" info text', () => {
    render(<LoginPage />)
    expect(screen.getByText(/first click creates the account/i)).toBeInTheDocument()
  })
})
