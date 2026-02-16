import { useMemo, useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { apiClient } from "@shared/api/client"

function getErrorMessage(e: any) {
  const data = e?.response?.data
  if (typeof data === "string" && (data.includes("<") || data.toLowerCase().includes("html")))
    return "Veri yüklenemedi."
  if (!data) return e?.message ?? "Veri yüklenemedi."

  const pick =
    (Array.isArray(data?.new_password) && data.new_password[0]) ||
    (Array.isArray(data?.token) && data.token[0]) ||
    (Array.isArray(data?.uid) && data.uid[0]) ||
    (typeof data?.detail === "string" && data.detail)

  return pick || "Veri yüklenemedi."
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const uid = params.get("uid") ?? ""
  const token = params.get("token") ?? ""

  const hasParams = useMemo(() => Boolean(uid && token), [uid, token])

  const [newPassword, setNewPassword] = useState("")
  const [newPassword2, setNewPassword2] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch = newPassword.length > 0 && newPassword2.length > 0 && newPassword !== newPassword2

  const onSubmit = async () => {
    setError(null)

    if (!hasParams) {
      setError("Geçersiz sıfırlama bağlantısı.")
      return
    }
    if (mismatch) {
      setError("Şifreler eşleşmiyor.")
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post("/auth/password/reset/", {
        uid,
        token,
        new_password: newPassword,
      })
      setDone(true)

      // UX: kısa bir yönlendirme
      setTimeout(() => {
        navigate("/auth/login", { replace: true })
      }, 800)
    } catch (e: any) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Yeni Şifre Belirle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Yeni şifreni oluştur ve hesabına tekrar giriş yap.
        </p>
      </div>

      {!hasParams && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Bu sıfırlama bağlantısı geçersiz görünüyor. Lütfen tekrar şifre sıfırlama isteği gönder.
          <div className="mt-3">
            <Link to="/auth/forgot" className="text-primary hover:underline">
              Şifre sıfırlama sayfasına git
            </Link>
          </div>
        </div>
      )}

      {done ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Şifren başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsun…
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Yeni Şifre</div>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifre"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Yeni Şifre (Tekrar)</div>
            <Input
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              placeholder="Yeni şifre (tekrar)"
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit()
              }}
            />
          </div>

          {mismatch && (
            <div className="text-xs text-red-200">Şifreler eşleşmiyor.</div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={submitting || !hasParams || !newPassword || !newPassword2 || mismatch}
          >
            {submitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </Button>

          <div className="text-center text-sm">
            <Link to="/auth/login" className="text-primary hover:underline">
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
