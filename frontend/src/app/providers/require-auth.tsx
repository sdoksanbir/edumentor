import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "./auth-provider"

const ACCESS_KEY = "prat_access"
const REFRESH_KEY = "prat_refresh"

export function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  const hasAnyToken = !!localStorage.getItem(ACCESS_KEY) || !!localStorage.getItem(REFRESH_KEY)

  // Token varsa ama user henüz bootstrap ile çözülmediyse: bekle (flicker yok)
  if (hasAnyToken && isBootstrapping) return null

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search ?? ""}`
    return <Navigate to="/auth/login" replace state={{ from }} />
  }

  return <Outlet />
}
