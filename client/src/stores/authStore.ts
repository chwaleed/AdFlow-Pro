import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'client' | 'moderator' | 'admin' | 'super_admin'

export interface AuthUser {
  _id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'suspended'
  createdAt: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'adflow-auth',
      // Only persist user + refreshToken; accessToken is short-lived
      partialize: (s) => ({ user: s.user, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    },
  ),
)
