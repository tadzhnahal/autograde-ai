import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import type { Role } from '@/types/api'

export function ProtectedRoute({ role }: { role: Role }) {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
  }
  return <Outlet />
}
