import React from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type UserRole } from '@/stores/authStore'
import RootLayout from '@/components/layouts/RootLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import NotFoundPage from '@/pages/NotFoundPage'

function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

const lazy = (importFn: () => Promise<{ default: React.ComponentType }>) =>
  importFn().then((m) => ({ Component: m.default }))

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, lazy: () => lazy(() => import('@/pages/LandingPage')) },
      { path: 'login',    element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Static pages
      { path: 'faq',          lazy: () => lazy(() => import('@/pages/static/FaqPage')) },
      { path: 'contact',      lazy: () => lazy(() => import('@/pages/static/ContactPage')) },
      { path: 'terms',        lazy: () => lazy(() => import('@/pages/static/TermsPage')) },
      { path: 'privacy',      lazy: () => lazy(() => import('@/pages/static/PrivacyPage')) },
      { path: 'usage-policy', lazy: () => lazy(() => import('@/pages/static/UsagePolicyPage')) },

      // Client + all authenticated roles
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard',       lazy: () => lazy(() => import('@/pages/client/DashboardPage')) },
          { path: 'ads/new',         lazy: () => lazy(() => import('@/pages/client/CreateAdPage')) },
          { path: 'ads/:id/edit',    lazy: () => lazy(() => import('@/pages/client/CreateAdPage')) },
          { path: 'profile',         lazy: () => lazy(() => import('@/pages/client/ProfilePage')) },
        ],
      },

      // Moderator +
      {
        element: <ProtectedRoute roles={['moderator', 'admin', 'super_admin']} />,
        children: [
          { path: 'moderator', lazy: () => lazy(() => import('@/pages/moderator/ReviewQueuePage')) },
        ],
      },

      // Admin +
      {
        element: <ProtectedRoute roles={['admin', 'super_admin']} />,
        children: [
          { path: 'admin', lazy: () => lazy(() => import('@/pages/admin/AdminDashboardPage')) },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
