import { useState, useEffect } from "react"
import { CrudModal } from "@features/admin/components/crud-modal"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { PhoneInput } from "@shared/ui/phone-input"
import { profileApi } from "../api/profileApi"
import type { MeUser, MeUpdatePayload, Gender } from "../types"
import { trCapitalizeFirst, trUpper } from "@shared/lib/tr-string"
import { toast } from "sonner"
import { getErrorMessage } from "@shared/lib/toast-messages"
import { normalizeTrPhone, getTrPhoneValidationError } from "@shared/lib/phone"

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Kadın" },
  { value: "MALE", label: "Erkek" },
  { value: "UNSPECIFIED", label: "Belirtmek istemiyorum" },
]

type ProfileEditDialogProps = {
  open: boolean
  onClose: () => void
  user: MeUser
  onSuccess: () => void
}

export function ProfileEditDialog({ open, onClose, user, onSuccess }: ProfileEditDialogProps) {
  const [firstName, setFirstName] = useState(user?.first_name ?? "")
  const [lastName, setLastName] = useState(user?.last_name ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [gender, setGender] = useState<Gender>((user?.gender as Gender) ?? "UNSPECIFIED")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && user) {
      setFirstName(user.first_name ?? "")
      setLastName(user.last_name ?? "")
      setPhone(user.phone ?? "")
      setGender((user.gender as Gender) ?? "UNSPECIFIED")
      setError(null)
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const phoneErr = phone.trim() ? getTrPhoneValidationError(phone) : null
    if (phoneErr) {
      setError(phoneErr)
      return
    }

    setSubmitting(true)
    const payload: MeUpdatePayload = {
      first_name: trCapitalizeFirst(firstName.trim()),
      last_name: trUpper(lastName.trim()),
      phone: phone.trim() ? normalizeTrPhone(phone) : "",
      gender,
    }

    try {
      await profileApi.updateMe(payload)
      toast.success("Profil güncellendi.")
      onSuccess()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CrudModal open={open} title="Profili Düzenle" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
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
          <label className="text-sm font-medium">Telefon (opsiyonel)</label>
          <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Cinsiyet</label>
          <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="h-10">
            {GENDER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </CrudModal>
  )
}
