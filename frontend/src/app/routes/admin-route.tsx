// src/app/routes/admin-route.tsx
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

export function AdminRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.is_staff === true ||
    user?.is_superuser === true

  if (!isAdmin) {
    // Rol bazlı yönlendirme: kendi dashboardlarına
    if (user?.role === "TEACHER") return <Navigate to="/teacher/dashboard" replace />
    if (user?.role === "STUDENT") return <Navigate to="/student/dashboard" replace />
    // PARENT veya diğer: genel dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
