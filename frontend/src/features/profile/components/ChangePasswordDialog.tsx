import { useState, useEffect } from "react"
import { CrudModal } from "@features/admin/components/crud-modal"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { profileApi } from "../api/profileApi"
import { toast } from "sonner"
import { getErrorMessage } from "@shared/lib/toast-messages"

type ChangePasswordDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ChangePasswordDialog({ open, onClose, onSuccess }: ChangePasswordDialogProps) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPassword2, setNewPassword2] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setOldPassword("")
      setNewPassword("")
      setNewPassword2("")
      setError(null)
    }
  }, [open])

  const mismatch = newPassword.length > 0 && newPassword2.length > 0 && newPassword !== newPassword2

  const handleSubmit = async (e: React.FormEvent) => {
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
      await profileApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })
      toast.success("Şifreniz başarıyla güncellendi.")
      onSuccess()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CrudModal open={open} title="Şifre Değiştir" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mevcut şifre</label>
          <Input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Mevcut şifreniz"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Yeni şifre</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifre"
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Yeni şifre (tekrar)</label>
          <Input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            placeholder="Yeni şifre tekrar"
            autoComplete="new-password"
            required
          />
        </div>
        {mismatch && <p className="text-sm text-destructive">Şifreler eşleşmiyor.</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="submit"
            disabled={submitting || !oldPassword || !newPassword || !newPassword2 || mismatch}
          >
            {submitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </Button>
        </div>
      </form>
    </CrudModal>
  )
}
