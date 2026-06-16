import React from 'react'
import { render, screen } from '@testing-library/react-native'
import LoginScreen from '../app/login'

jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }))
jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: () => [null, null, jest.fn()],
}))
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }))
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    loginWithGoogleCredential: jest.fn(),
    completeGoogleProfile: jest.fn(),
    appUser: null,
    loading: false,
  }),
}))

describe('LoginScreen — Branding', () => {
  it('renders the Fleet AutoLink app name', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Fleet AutoLink')).toBeTruthy()
  })

  it('renders the Fleet Management Platform tag', () => {
    render(<LoginScreen />)
    expect(screen.getByText('FLEET MANAGEMENT PLATFORM')).toBeTruthy()
  })

  it('renders the hero headline word Intelligence', () => {
    render(<LoginScreen />)
    expect(screen.getByText(/intelligence/i)).toBeTruthy()
  })

  it('renders the hero sub description text', () => {
    render(<LoginScreen />)
    expect(screen.getByText(/real-time gps, maintenance scheduling/i)).toBeTruthy()
  })
})

describe('LoginScreen — Feature List', () => {
  it('shows Real-time GPS tracking feature', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Real-time GPS tracking')).toBeTruthy()
  })

  it('shows Multi-role dashboards feature', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Multi-role dashboards')).toBeTruthy()
  })

  it('shows Maintenance scheduling feature', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Maintenance scheduling')).toBeTruthy()
  })
})

describe('LoginScreen — Form Card', () => {
  it('renders the Welcome back heading', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Welcome back')).toBeTruthy()
  })

  it('renders the Sign in to fleet dashboard subtitle', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Sign in to your fleet dashboard')).toBeTruthy()
  })

  it('renders the Sign in button', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Sign in')).toBeTruthy()
  })

  it('renders the Continue with Google button', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Continue with Google')).toBeTruthy()
  })

  it('renders the or sign in with email divider', () => {
    render(<LoginScreen />)
    expect(screen.getByText('or sign in with email')).toBeTruthy()
  })

  it('renders the Email address label', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Email address')).toBeTruthy()
  })

  it('renders the Password label', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Password')).toBeTruthy()
  })
})

describe('LoginScreen — Stats Strip', () => {
  it('renders 500+ fleets stat value', () => {
    render(<LoginScreen />)
    expect(screen.getByText('500+')).toBeTruthy()
  })

  it('renders Fleets stat label', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Fleets')).toBeTruthy()
  })

  it('renders 2M+ trips stat value', () => {
    render(<LoginScreen />)
    expect(screen.getByText('2M+')).toBeTruthy()
  })

  it('renders Trips stat label', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Trips')).toBeTruthy()
  })

  it('renders 99.9% uptime stat value', () => {
    render(<LoginScreen />)
    expect(screen.getByText('99.9%')).toBeTruthy()
  })

  it('renders Uptime stat label', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Uptime')).toBeTruthy()
  })
})
