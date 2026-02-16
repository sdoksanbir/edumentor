// protected-route.tsx
// İSTEK: useEffect+navigate KULLANMA. Redirectleri sadece <Navigate /> ile yap.
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"
import { Loader2 } from "lucide-react"

const PROFILE_PATH = "/profile"
const FORCE_CHANGE_PASSWORD_PATH = "/force-change-password"

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  const location = useLocation()
  const pathname = location.pathname
  const search = location.search ?? ""

  if (isBootstrapping) return <LoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: `${pathname}${search}` }} />
  }

  // 1) Zorunlu şifre değişikliği: force-change-password harici her yerde kilitle
  if (user?.must_change_password === true && pathname !== FORCE_CHANGE_PASSWORD_PATH) {
    return <Navigate to={FORCE_CHANGE_PASSWORD_PATH} replace />
  }

  // 2) Profil tamamlanmadıysa profile sayfasına yönlendir (muaf: /profile)
  // ⚠️ must_change_password aktifken profile guard'ı çalışmaz (aksi halde /force-change-password <-> /profile döngüsü olur)
  if (user?.must_change_password !== true && user?.profile_completed === false && pathname !== PROFILE_PATH) {
    return <Navigate to={PROFILE_PATH} replace />
  }

  return <Outlet />
}
