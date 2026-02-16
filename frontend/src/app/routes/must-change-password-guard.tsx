// src/app/routes/must-change-password-guard.tsx
// must_change_password=true ise /force-change-password'a yönlendir (render-phase Navigate)
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

const FORCE_CHANGE_PASSWORD_PATH = "/force-change-password"

export function MustChangePasswordGuard() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (user?.must_change_password === true && location.pathname !== FORCE_CHANGE_PASSWORD_PATH) {
    return <Navigate to={FORCE_CHANGE_PASSWORD_PATH} replace state={{ from: location }} />
  }

  return <Outlet />
}
