import { useEffect, useMemo, useState } from "react"
import type { AxiosError } from "axios"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { PhoneInput } from "@shared/ui/phone-input"
import { useAuth } from "@app/providers/auth-provider"
import { apiClient } from "@shared/api/client"
import { normalizeTrPhone, getTrPhoneValidationError } from "@shared/lib/phone"
import { trCapitalizeFirst, trUpper } from "@shared/lib/tr-string"

type Gender = "MALE" | "FEMALE" | "UNSPECIFIED"

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Kadın" },
  { value: "MALE", label: "Erkek" },
  { value: "UNSPECIFIED", label: "Belirtmek istemiyorum" },
]

export function ProfilePage() {
  const { user, refreshMe } = useAuth()

  const [firstName, setFirstName] = useState(user?.first_name ?? "")
  const [lastName, setLastName] = useState(user?.last_name ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [gender, setGender] = useState<Gender>(user?.gender ?? "UNSPECIFIED")

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "")
      setLastName(user.last_name ?? "")
      setPhone(user.phone ?? "")
      setGender((user.gender as Gender) ?? "UNSPECIFIED")
    }
  }, [user])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(
    () => Boolean(firstName.trim() || lastName.trim()) && !submitting,
    [firstName, lastName, submitting]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const phoneErr = phone.trim() ? getTrPhoneValidationError(phone) : null
    if (phoneErr) {
      setError(phoneErr)
      return
    }
    setSubmitting(true)

    const payload = {
      first_name: trCapitalizeFirst(firstName.trim()),
      last_name: trUpper(lastName.trim()),
      phone: phone.trim() ? normalizeTrPhone(phone) : "",
      gender,
    }

    const url = "/auth/me/"

    try {
      await apiClient.patch(url, payload)

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
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil bilgilerini güncelle.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-4">
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
          <label className="text-sm font-medium">Ad</label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={(e) => setFirstName(trCapitalizeFirst(e.target.value))}
            placeholder="Ad"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Soyad</label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={(e) => setLastName(trUpper(e.target.value))}
            placeholder="Soyad"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cinsiyet</label>
          <Select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="h-10"
          >
            {GENDER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon (opsiyonel)</label>
          <PhoneInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {submitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>
    </div>
  )
}
