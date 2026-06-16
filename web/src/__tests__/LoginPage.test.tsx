import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from '@/pages/LoginPage'

vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  rtdb: {},
}))

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

describe('LoginPage', () => {
  it('renders the Fleet AutoLink brand', () => {
    render(<LoginPage />)
    expect(screen.getAllByText('Fleet AutoLink').length).toBeGreaterThan(0)
  })

  it('shows the Sign in heading', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the email input', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
  })

  it('renders the password input', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders demo account buttons', () => {
    render(<LoginPage />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Driver')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Mechanic')).toBeInTheDocument()
  })

  it('renders a register link', () => {
    render(<LoginPage />)
    expect(screen.getByText('Register')).toBeInTheDocument()
  })
})
