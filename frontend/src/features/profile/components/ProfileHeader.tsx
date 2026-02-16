import { useRef, useState } from "react"
import { Button } from "@shared/ui/button"
import { Badge } from "@shared/ui/badge"
import { Tooltip } from "@shared/ui/tooltip"
import type { MeUser } from "../types"
import { Shield, Pencil, Camera, Trash2, Loader2 } from "lucide-react"
import { profileApi } from "../api/profileApi"
import { toast } from "sonner"
import { getErrorMessage } from "@shared/lib/toast-messages"

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg"
const MAX_SIZE_MB = 2

type ProfileHeaderProps = {
  user: MeUser | null
  onEditClick: () => void
  onAvatarChange?: () => void
}

export function ProfileHeader({ user, onEditClick, onAvatarChange }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  if (!user) return null

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.email
  const initials = (() => {
    const s = fullName || user.email || "U"
    const parts = s.split(/\s|@|\.|_|-/).filter(Boolean)
    const a = parts[0]?.[0] ?? "U"
    const b = parts[1]?.[0] ?? ""
    return (a + b).toUpperCase()
  })()

  const roleLabel = user.role === "ADMIN" ? "ADMIN" : user.is_superuser ? "Yönetici" : user.is_staff ? "Personel" : user.role || "Kullanıcı"

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Dosya boyutu ${MAX_SIZE_MB}MB'ı aşamaz.`)
      return
    }

    setUploading(true)
    try {
      await profileApi.uploadAvatar(file)
      toast.success("Profil fotoğrafı güncellendi.")
      onAvatarChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleRemoveAvatar = async () => {
    setRemoving(true)
    try {
      await profileApi.removeAvatar()
      toast.success("Profil fotoğrafı kaldırıldı.")
      onAvatarChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setRemoving(false)
    }
  }

  const isBusy = uploading || removing

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
            disabled={isBusy}
          />
          <div
            className={`h-16 w-16 rounded-2xl overflow-hidden border border-primary/20 shadow-inner transition-all duration-300 flex items-center justify-center ${
              user.avatar_url
                ? "bg-muted"
                : "bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10"
            } group-hover:ring-2 group-hover:ring-primary/40 group-hover:ring-offset-2 group-hover:ring-offset-card`}
          >
            {isBusy ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">{initials}</span>
            )}
          </div>
          {!isBusy && (
            <Tooltip content="Fotoğraf değiştir" side="bottom">
              <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Camera className="h-3.5 w-3.5" />
              </div>
            </Tooltip>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">{fullName}</h1>
            <Badge variant="muted" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {roleLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium">
              {user.is_active !== false ? "Aktif" : "Pasif"}
            </span>
            {user.is_approved && (
              <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Onaylı
              </span>
            )}
            {user.profile_completed && (
              <span className="inline-flex items-center rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                Profil tamamlandı
              </span>
            )}
          </div>
          {user.avatar_url && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-muted-foreground hover:text-destructive"
              onClick={handleRemoveAvatar}
              disabled={isBusy}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Fotoğrafı kaldır
            </Button>
          )}
        </div>
      </div>
      <Button variant="secondary" size="md" onClick={onEditClick} className="shrink-0">
        <Pencil className="h-4 w-4" />
        Profili Düzenle
      </Button>
    </div>
  )
}
