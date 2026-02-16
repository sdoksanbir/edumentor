import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

const ACCESS_KEY = "prat_access"
const REFRESH_KEY = "prat_refresh"

export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  const hasAnyToken = !!localStorage.getItem(ACCESS_KEY) || !!localStorage.getItem(REFRESH_KEY)

  if (hasAnyToken && isBootstrapping) return null

  if (hasAnyToken && isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}
