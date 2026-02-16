import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

type Role = "ADMIN" | "TEACHER" | "STUDENT"

export function RoleGuard({ allow }: { allow: Role[] }) {
  const { isBootstrapping, isAuthenticated, user } = useAuth()

  if (isBootstrapping) return null
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />

  const role = user?.role as Role | undefined
  if (!role || !allow.includes(role)) return <Navigate to="/" replace />

  return <Outlet />
}
