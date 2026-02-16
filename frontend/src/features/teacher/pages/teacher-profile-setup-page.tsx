import { useMemo, useState } from "react"
import type { AxiosError } from "axios"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { useAuth } from "@app/providers/auth-provider"
import { apiClient } from "@shared/api/client"

function parseFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return { first_name: "", last_name: "" }
  if (parts.length === 1) return { first_name: parts[0], last_name: "" }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  }
}

export function TeacherProfileSetupPage() {
  const { user, refreshMe } = useAuth()

  const [fullName, setFullName] = useState(
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || ""
  )
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => Boolean(fullName.trim()) && !submitting, [fullName, submitting])

  const handleComplete = async () => {
    setError(null)
    setSuccess(false)
    setSubmitting(true)

    const { first_name, last_name } = parseFullName(fullName)
    const payload = { first_name, last_name, phone: phone.trim() }

    const url = "/auth/me/"
    const method = "PATCH"

    console.log("[Profile Submit] Request URL:", apiClient.defaults.baseURL + url)
    console.log("[Profile Submit] HTTP method:", method)
    console.log("[Profile Submit] Payload:", payload)

    try {
      await apiClient.patch(url, payload)
      console.log("[Profile Submit] API call succeeded (200/204)")

      await refreshMe()
      setSuccess(true)
    } catch (e) {
      const err = e as AxiosError
      console.error("[Profile Submit] Error:", err.response?.data ?? err.message ?? err)
      setError("Profil kaydedilemedi.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Öğretmen Profili</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devam etmek için profilini tamamlamalısın.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Giriş yapan: {user?.email}</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            Profil kaydedildi.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Ad Soyad</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Örn: Ahmet Yılmaz"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon (opsiyonel)</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
        </div>

        <Button className="w-full" disabled={!canSubmit} onClick={handleComplete}>
          {submitting ? "Kaydediliyor..." : "Profili Tamamla"}
        </Button>
      </div>
    </div>
  )
}
