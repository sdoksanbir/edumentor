import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

export function StudentProfileGuard() {
  const { isAuthenticated, isBootstrapping, user } = useAuth()

  if (isBootstrapping) return null
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />

  const role = (user as { role?: string })?.role
  if (role !== "STUDENT") return <Navigate to="/" replace />

  return <Outlet />
}
