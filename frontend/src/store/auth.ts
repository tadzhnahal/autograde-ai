import { create } from 'zustand'
import type { User } from '@/types/api'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  clear: () => void
}

function initialToken(): string | null {
  return localStorage.getItem('ag.token')
}

function initialUser(): User | null {
  const raw = localStorage.getItem('ag.user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: initialToken(),
  user: initialUser(),
  setAuth: (token, user) => {
    localStorage.setItem('ag.token', token)
    localStorage.setItem('ag.user', JSON.stringify(user))
    set({ token, user })
  },
  setUser: (user) => {
    localStorage.setItem('ag.user', JSON.stringify(user))
    set({ user })
  },
  clear: () => {
    localStorage.removeItem('ag.token')
    localStorage.removeItem('ag.user')
    set({ token: null, user: null })
  },
}))
