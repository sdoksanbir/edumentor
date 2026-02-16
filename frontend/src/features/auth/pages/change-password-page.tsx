// src/features/auth/pages/change-password-page.tsx
// must_change_password=true kullanıcılar için zorunlu şifre değiştirme
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { apiClient } from "@shared/api/client"
import { useAuth } from "@app/providers/auth-provider"
import { toast } from "sonner"

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

function getErrorMessage(e: unknown) {
  const data = (e as { response?: { data?: unknown } })?.response?.data
  if (!data || typeof data !== "object") return "Bir hata oluştu."
  if ("detail" in data && typeof (data as { detail: string }).detail === "string")
    return (data as { detail: string }).detail
  const first = Object.values(data)[0]
  if (Array.isArray(first)) return (first as string[])[0] ?? "Bir hata oluştu."
  if (typeof first === "string") return first
  return "Bir hata oluştu."
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { refreshMe } = useAuth()
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPassword2, setNewPassword2] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mismatch = newPassword.length > 0 && newPassword2.length > 0 && newPassword !== newPassword2

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mismatch) {
      setError("Yeni şifreler eşleşmiyor.")
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalıdır.")
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post("/auth/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
      })
      toast.success("Şifreniz güncellendi. Devam edebilirsiniz.")
      const me = await refreshMe()
      navigate(getHomeByRole(me?.role), { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Şifre Değiştir</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Güvenliğiniz için lütfen şifrenizi değiştirin. Bu adım zorunludur.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Mevcut Şifre</label>
          <Input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Mevcut şifreniz"
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Yeni Şifre</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifre"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Yeni Şifre (Tekrar)</label>
          <Input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            placeholder="Yeni şifre tekrar"
            autoComplete="new-password"
            required
          />
        </div>
        {mismatch && (
          <p className="text-sm text-destructive">Şifreler eşleşmiyor.</p>
        )}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !oldPassword || !newPassword || !newPassword2 || mismatch}
        >
          {submitting ? "Güncelleniyor…" : "Şifreyi Güncelle"}
        </Button>
      </form>
    </div>
  )
}
