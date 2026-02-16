import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

export function AdminOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.is_staff === true ||
    user?.is_superuser === true

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
