import React from 'react'
import { render, screen } from '@testing-library/react-native'
import LoginScreen from '../app/login'

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}))

jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: () => [null, null, jest.fn()],
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}))

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    loginWithGoogleCredential: jest.fn(),
    completeGoogleProfile: jest.fn(),
    appUser: null,
    loading: false,
  }),
}))

describe('LoginScreen', () => {
  it('renders the Fleet AutoLink app name', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Fleet AutoLink')).toBeTruthy()
  })

  it('renders the Welcome back heading', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Welcome back')).toBeTruthy()
  })

  it('renders the Sign in button', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Sign in')).toBeTruthy()
  })

  it('renders the feature list items', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Real-time GPS tracking')).toBeTruthy()
    expect(screen.getByText('Multi-role dashboards')).toBeTruthy()
    expect(screen.getByText('Maintenance scheduling')).toBeTruthy()
  })
})
