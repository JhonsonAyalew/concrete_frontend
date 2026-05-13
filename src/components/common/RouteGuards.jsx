import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/stores/authStore'
export const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (roles && !roles.includes(user?.role)) {
    const dashPaths = {
      admin: '/admin', superadmin: '/admin',
      owner: '/owner', customer: '/customer'
    }
    return <Navigate to={dashPaths[user?.role] || '/'} replace />
  }
  return children
}
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    const dashPaths = {
      admin: '/admin', superadmin: '/admin',
      owner: '/owner', customer: '/customer'
    }
    return <Navigate to={dashPaths[user?.role] || '/'} replace />
  }
  return children
}