import { Navigate, Outlet } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import { authStore } from '../../stores/authStore'

export function ProtectedRoute(): React.ReactElement {
  const { isAuthenticated } = useSnapshot(authStore)

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}
