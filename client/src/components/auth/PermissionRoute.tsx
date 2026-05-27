import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { hasTablePermission } from '../../store/slices/authSlice'
import { showWarningToast } from '../../store/slices/toastSlice'

interface PermissionRouteProps {
  tableName: string
  permissionType?: 'canView' | 'canCreate' | 'canEdit' | 'canDelete'
  redirectTo?: string
}

// Map table names to display names
const tableDisplayNames: Record<string, string> = {
  'onboarding_cdr': 'Onboarding',
  'smodb_cdr': 'SMO',
  'websitedb': 'Website',
}

export default function PermissionRoute({ 
  tableName, 
  permissionType = 'canView',
  redirectTo = '/dashboard-cms' 
}: PermissionRouteProps) {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const hasShownToast = useRef(false)
  
  // Admin always has access
  if (user?.role === 'admin') {
    return <Outlet />
  }
  
  // Check if user has permission for this table
  const hasPermission = hasTablePermission(user, tableName, permissionType)
  
  // Show toast when permission denied (only once per navigation)
  useEffect(() => {
    if (!hasPermission && !hasShownToast.current) {
      const displayName = tableDisplayNames[tableName] || tableName
      dispatch(showWarningToast(
        'Access Denied',
        `You don't have permission to access the ${displayName} table.`
      ))
      hasShownToast.current = true
    }
  }, [hasPermission, tableName, dispatch, location.pathname])
  
  if (hasPermission) {
    return <Outlet />
  }
  
  // No permission - redirect
  return <Navigate to={redirectTo} replace />
}
