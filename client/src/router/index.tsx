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

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, lazy: () => import('@/pages/LandingPage').then((m) => ({ Component: m.default })) },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Client + all roles
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            lazy: () => import('@/pages/client/DashboardPage').then((m) => ({ Component: m.default })),
          },
        ],
      },

      // Moderator +
      {
        element: <ProtectedRoute roles={['moderator', 'admin', 'super_admin']} />,
        children: [
          {
            path: 'moderator',
            lazy: () => import('@/pages/moderator/ReviewQueuePage').then((m) => ({ Component: m.default })),
          },
        ],
      },

      // Admin +
      {
        element: <ProtectedRoute roles={['admin', 'super_admin']} />,
        children: [
          {
            path: 'admin',
            lazy: () => import('@/pages/admin/AdminDashboardPage').then((m) => ({ Component: m.default })),
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
