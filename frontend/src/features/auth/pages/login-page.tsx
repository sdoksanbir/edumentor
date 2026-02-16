import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { useAuth } from "@app/providers/auth-provider"
import { useMemo, useState } from "react"

type Role = "ADMIN" | "TEACHER" | "STUDENT"

function roleHome(role?: Role) {
  if (role === "ADMIN") return "/panel/dashboard"
  if (role === "TEACHER") return "/teacher/dashboard"
  if (role === "STUDENT") return "/student/dashboard"
  return "/dashboard"
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  // ProtectedRoute gönderdiyse öncelik orada
  const from = useMemo(() => location.state?.from ?? "", [location.state?.from])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const me = await login(email.trim(), password)

      // 0) Geçici şifre ile giriş: önce şifre değiştirme zorunlu
      if (me.must_change_password === true) {
        navigate("/force-change-password", { replace: true })
        return
      }

      // 1) Eğer bir hedef varsa (örn /dashboard/users) oraya git
      if (from) {
        navigate(from, { replace: true })
        return
      }

      // 2) Yoksa role'a göre ana sayfaya git
      navigate(roleHome(me.role as Role), { replace: true })
    } catch (e: any) {
      const data = e?.response?.data
      const msg = (() => {
        if (typeof data === "string" && (data.includes("<") || data.toLowerCase().includes("html")))
          return "Veri yüklenemedi."
        if (typeof data?.detail === "string") return data.detail
        if (e?.message && typeof e.message === "string") return e.message
        return "Giriş yapılamadı."
      })()
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Giriş Yap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tekrar hoş geldin. Lütfen bilgilerini gir.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="text-sm font-medium">E-posta</div>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@edumath.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Şifre</div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifreni gir"
            autoComplete="current-password"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit()
            }}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link to="/auth/forgot" className="text-sm text-primary hover:underline">
            Şifremi unuttum
          </Link>
        </div>

        <Button type="button" className="w-full" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Hesabın yok mu?{" "}
        <Link to="/auth/register" className="text-primary hover:underline">
          Kayıt ol
        </Link>
      </div>
    </div>
  )
}
