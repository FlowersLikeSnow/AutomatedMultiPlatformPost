import { Navigate, Outlet } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import { authStore, isAdmin } from '../../stores/authStore'

export function AdminRoute(): React.ReactElement {
  const { isAuthenticated, currentUser } = useSnapshot(authStore)

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isAdmin(currentUser?.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
