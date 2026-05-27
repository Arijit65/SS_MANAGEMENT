import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'

export default function AdminRoute() {
  const user = useAppSelector((state) => state.auth.user)

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard-cms" replace />
  }

  return <Outlet />
}
