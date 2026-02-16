// src/features/teacher/routes/teacher-route.tsx
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

const LOGIN_PATH = "/auth/login"

export function TeacherRoute() {
  const auth = useAuth() as any

  const isBootstrapping: boolean =
    typeof auth.isBootstrapping === "boolean"
      ? auth.isBootstrapping
      : typeof auth.isLoading === "boolean"
        ? auth.isLoading
        : false

  const isAuthenticated: boolean =
    typeof auth.isAuthenticated === "boolean" ? auth.isAuthenticated : false

  const user = auth.user as { role?: string } | null

  if (isBootstrapping) return null
  if (!isAuthenticated) return <Navigate to={LOGIN_PATH} replace />

  if (user?.role !== "TEACHER") return <Navigate to="/dashboard" replace />

  return <Outlet />
}
