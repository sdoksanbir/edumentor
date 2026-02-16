import { Navigate } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

function getHomeByRole(role?: string) {
  switch (role) {
    case "ADMIN":
      return "/panel/dashboard"
    case "TEACHER":
      return "/teacher/dashboard"
    case "STUDENT":
      return "/student/dashboard"
    case "PARENT":
      return "/dashboard"
    default:
      return "/dashboard"
  }
}

export function RoleLanding() {
  const { isBootstrapping, isAuthenticated, user } = useAuth()

  if (isBootstrapping) return null
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />

  return <Navigate to={getHomeByRole(user?.role)} replace />
}
