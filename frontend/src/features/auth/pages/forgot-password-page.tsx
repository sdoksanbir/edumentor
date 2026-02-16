import { Link } from "react-router-dom"
import { useState } from "react"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { apiClient } from "@shared/api/client"

function getErrorMessage(e: any) {
  const data = e?.response?.data
  if (typeof data === "string" && (data.includes("<") || data.toLowerCase().includes("html")))
    return "Veri yüklenemedi."
  if (!data) return e?.message ?? "Veri yüklenemedi."
  if (typeof data?.detail === "string") return data.detail
  if (Array.isArray(data?.email) && data.email[0]) return data.email[0]
  return "Veri yüklenemedi."
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await apiClient.post("/auth/password/forgot/", { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (e: any) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Şifre Sıfırlama</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Şifre sıfırlama bağlantısını e-posta adresine göndereceğiz.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
            <div className="mt-2 text-xs text-emerald-200/80">
              Mail birkaç dakika içinde gelmezse spam/önemsiz klasörünü kontrol edebilirsin.
            </div>
          </div>

          <Button type="button" className="w-full" onClick={() => setSent(false)}>
            Farklı e-posta ile dene
          </Button>

          <div className="text-center text-sm">
            <Link to="/auth/login" className="text-primary hover:underline">
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">E-posta</div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@edumath.com"
              autoComplete="email"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit()
              }}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button className="w-full" onClick={onSubmit} disabled={submitting || !email.trim()}>
            {submitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
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
