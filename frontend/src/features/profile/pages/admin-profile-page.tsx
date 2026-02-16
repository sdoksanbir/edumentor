import { useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@app/providers/auth-provider"
import { useThemeContext } from "@app/providers/theme-provider"
import { profileApi } from "../api/profileApi"
import { ProfileHeader } from "../components/ProfileHeader"
import { ProfileEditDialog } from "../components/ProfileEditDialog"
import { ChangePasswordDialog } from "../components/ChangePasswordDialog"
import { RecentActivity } from "../components/RecentActivity"
import { Button } from "@shared/ui/button"
import { Tooltip } from "@shared/ui/tooltip"
import { formatFullTimestamp, formatRelativeTime } from "@shared/utils/time"
import { parseUserAgent } from "@features/reports/utils/userAgent"
import {
  LogOut,
  Shield,
  ShieldOff,
  User,
  Smartphone,
  AlertTriangle,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { useMemo, useState } from "react"
import { confirmAction } from "@shared/lib/swal"
import { toast } from "sonner"
import { getErrorMessage } from "@shared/lib/toast-messages"
import type { MeUser, AuthEventItem } from "../types"

function useProfileMe() {
  const { user: authUser } = useAuth()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.getMe(),
    enabled: !!authUser,
  })
  return { user: data ?? authUser, isLoading, refetch }
}

function useDevicesFromEvents() {
  const { data } = useQuery({
    queryKey: ["profile", "events", "devices", 30],
    queryFn: () => profileApi.getEvents({ days: 30, page: 1, page_size: 50 }),
  })
  return useMemo(() => {
    if (!data?.items) return []
    const logins = data.items.filter((e) => e.event_type === "LOGIN_SUCCESS")
    const seen = new Set<string>()
    const result: AuthEventItem[] = []
    for (const e of logins) {
      const key = `${e.ip_address}|${e.user_agent}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(e)
      if (result.length >= 5) break
    }
    return result
  }, [data?.items])
}

function AccountSummaryCard({ user }: { user: MeUser }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Hesap Özeti</h3>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Hesap açılış</dt>
          <dd>{user.created_at ? formatFullTimestamp(user.created_at) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Son giriş</dt>
          <dd>{user.last_login ? formatFullTimestamp(user.last_login) : "—"}</dd>
        </div>
        {user.approved_at_iso && (
          <div>
            <dt className="text-muted-foreground">Onay tarihi</dt>
            <dd>{formatFullTimestamp(user.approved_at_iso)}</dd>
          </div>
        )}
        {user.approved_by_email && (
          <div>
            <dt className="text-muted-foreground">Onaylayan</dt>
            <dd>{user.approved_by_email}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Profil durumu</dt>
          <dd>{user.profile_completed ? "Tamamlandı" : "Eksik"}</dd>
        </div>
      </dl>
    </div>
  )
}

function DevicesCard({ devices, onViewAll }: { devices: AuthEventItem[]; onViewAll: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Cihazlar & Oturumlar</h3>
      {devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz giriş kaydı yok.</p>
      ) : (
        <ul className="space-y-3">
          {devices.map((e) => {
            const ua = parseUserAgent(e.user_agent)
            return (
              <li key={e.id} className="flex items-center gap-3 text-sm">
                <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{ua.label}</div>
                  <div className="text-muted-foreground truncate">
                    {e.ip_address} · {e.created_at ? formatRelativeTime(e.created_at) : ""}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={onViewAll}>
        Tümünü gör
      </Button>
    </div>
  )
}

function SettingsCard() {
  const { mode, setMode } = useThemeContext()
  const [themeOpen, setThemeOpen] = useState(false)
  const modes = [
    { id: "light" as const, label: "Açık", icon: Sun },
    { id: "dark" as const, label: "Koyu", icon: Moon },
    { id: "system" as const, label: "Sistem", icon: Monitor },
  ] as const

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Ayarlar</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-2">Tema</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen(!themeOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              {modes.find((m) => m.id === mode)?.label ?? "Sistem"}
              <ChevronDown className={`h-4 w-4 transition-transform ${themeOpen ? "rotate-180" : ""}`} />
            </button>
            {themeOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg z-10 py-1">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id)
                      setThemeOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                    {mode === m.id && <Check className="h-4 w-4 ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Bildirimler</label>
          <p className="text-sm text-muted-foreground">Yakında eklenecek.</p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Dil</label>
          <p className="text-sm text-muted-foreground">Türkçe (TR)</p>
        </div>
      </div>
    </div>
  )
}

function DangerZoneCard({
  onLogout,
  onLogoutAll,
}: {
  onLogout: () => void
  onLogoutAll: () => Promise<void>
}) {
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)

  const handleLogoutAll = async () => {
    const { isConfirmed } = await confirmAction(
      "Tüm cihazlardan çıkmak istediğinize emin misiniz?",
      "Bu işlem tüm aktif oturumlarınızı sonlandırır.",
      "Evet, çıkış yap"
    )
    if (!isConfirmed) return
    setLogoutAllLoading(true)
    try {
      await onLogoutAll()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLogoutAllLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Tehlikeli Alan
      </h3>
      <div className="space-y-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full border border-destructive text-destructive hover:bg-destructive/10"
            onClick={handleLogoutAll}
            loading={logoutAllLoading}
          >
            <LogOut className="h-4 w-4" />
            Tüm cihazlardan çık
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Bu işlem diğer tüm cihazlardaki oturumlarınızı sonlandırır.
          </p>
        </div>
        <Button variant="destructive" size="sm" className="w-full" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Çıkış yap
        </Button>
      </div>
    </div>
  )
}

export function AdminProfilePage() {
  const { user, isLoading, refetch } = useProfileMe()
  const auth = useAuth()
  const devices = useDevicesFromEvents()
  const activityRef = useRef<HTMLDivElement>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const handleRefreshMe = async () => {
    await Promise.all([refetch(), auth.refreshMe()])
  }

  const scrollToActivity = () => {
    activityRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-32 rounded-2xl bg-muted" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-pulse h-48 rounded-2xl bg-muted" />
            <div className="animate-pulse h-64 rounded-2xl bg-muted" />
          </div>
          <div className="space-y-6">
            <div className="animate-pulse h-48 rounded-2xl bg-muted" />
            <div className="animate-pulse h-40 rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
        <p className="text-destructive font-medium">Oturum bilgisi yüklenemedi.</p>
        <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
          Tekrar Dene
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProfileHeader
        user={user}
        onEditClick={() => setEditOpen(true)}
        onAvatarChange={handleRefreshMe}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol kolon 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kişisel Bilgiler */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Kişisel Bilgiler
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Ad</dt>
                <dd>{user.first_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Soyad</dt>
                <dd>{user.last_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Telefon</dt>
                <dd>{user.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cinsiyet</dt>
                <dd>
                  {user.gender === "MALE" ? "Erkek" : user.gender === "FEMALE" ? "Kadın" : "Belirtilmedi"}
                </dd>
              </div>
            </dl>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditOpen(true)}>
              Düzenle
            </Button>
          </div>

          {/* Güvenlik */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Güvenlik
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Şifre</p>
                  <p className="text-muted-foreground text-sm">Hesabınızı güvende tutmak için şifrenizi periyodik olarak güncelleyin.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setPasswordOpen(true)}>
                  Şifre değiştir
                </Button>
              </div>
              {user.must_change_password && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-2">
                  <ShieldOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Zorunlu şifre değişimi gerekli</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">İki Faktörlü Doğrulama (2FA)</p>
                  <p className="text-muted-foreground text-sm">Yakında eklenecek.</p>
                </div>
                <Tooltip content="Yakında eklenecek">
                  <span className="block">
                    <button
                      type="button"
                      disabled
                      className="h-6 w-11 rounded-full bg-muted cursor-not-allowed opacity-60"
                      aria-label="2FA (devre dışı)"
                    />
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Son Aktiviteler */}
          <div ref={activityRef}>
            <RecentActivity />
          </div>
        </div>

        {/* Sağ kolon 1/3 */}
        <div className="space-y-6">
          <AccountSummaryCard user={user} />
          <DevicesCard devices={devices} onViewAll={scrollToActivity} />
          <SettingsCard />
          <DangerZoneCard onLogout={auth.logout} onLogoutAll={auth.logoutAll} />
        </div>
      </div>

      <ProfileEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSuccess={handleRefreshMe}
      />
      <ChangePasswordDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSuccess={handleRefreshMe}
      />
    </div>
  )
}
