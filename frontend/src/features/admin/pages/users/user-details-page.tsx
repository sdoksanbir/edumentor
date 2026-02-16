import { useState, useRef, useLayoutEffect, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  User,
  CheckCircle,
  XCircle,
  KeyRound,
  Pencil,
  Users,
  Activity,
  StickyNote,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react"
import { Button } from "@shared/ui/button"
import { Switch } from "@shared/ui/switch"
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { PhoneInput } from "@shared/ui/phone-input"
import { UserAvatar } from "@features/users/components/user-avatar"
import { CrudModal } from "@features/admin/components/crud-modal"
import { Checkbox } from "@shared/ui/checkbox"
import {
  getUser,
  updateUser,
  resetUserPassword,
  usersKeys,
  type PanelUser,
  type UpdateUserPayload,
} from "@features/admin/api/users-api"
import { listGradeLevels, catalogKeys } from "@features/admin/api/admin-api"
import type { Gender } from "@features/admin/api/users-api"
import { getTeacherStudents, type StudentListItem } from "@features/admin/api/teachers-api"
import { trTitle } from "@shared/lib/tr-string"
import { normalizeTrPhone, validateTrGsmPhone } from "@shared/lib/phone"
import { getErrorMessage } from "@shared/lib/toast-messages"
import { resetPasswordConfirm, resetPasswordSuccess } from "@shared/lib/swal"
import { cn } from "@shared/utils/cn"

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Kadın" },
  { value: "MALE", label: "Erkek" },
  { value: "UNSPECIFIED", label: "Belirtmek istemiyorum" },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Öğretmen",
  STUDENT: "Öğrenci",
  PARENT: "Veli",
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  TEACHER: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  STUDENT: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  PARENT: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
}

const COVER_BY_ROLE: Record<string, string> = {
  TEACHER: "/covers/teacher.jpg",
  STUDENT: "/covers/student.jpg",
  ADMIN: "/covers/admin.jpg",
  PARENT: "/covers/parent.jpg",
}

function getCoverSrc(role: string): string {
  return COVER_BY_ROLE[role] ?? "/covers/default.jpg"
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Erkek",
  FEMALE: "Kadın",
  UNSPECIFIED: "Belirtilmemiş",
}

function fullName(u: PanelUser) {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email
}

function formatDate(s: string | null | undefined) {
  if (!s) return "—"
  const d = new Date(s)
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: d.getHours() || d.getMinutes() ? "2-digit" : undefined,
    minute: d.getHours() || d.getMinutes() ? "2-digit" : undefined,
  })
}

const ROLE_RING_ACCENT: Record<string, string> = {
  ADMIN: "ring-indigo-400/30 dark:ring-indigo-500/20",
  TEACHER: "ring-orange-400/30 dark:ring-orange-500/20",
  STUDENT: "ring-sky-400/30 dark:ring-sky-500/20",
  PARENT: "ring-emerald-400/30 dark:ring-emerald-500/20",
}

const TEMP_PASSWORD_STORAGE_KEY = "panel_temp_password"

function getStoredTempPassword(userId: number): string | null {
  try {
    const raw = sessionStorage.getItem(TEMP_PASSWORD_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<number, string>
    return parsed[userId] ?? null
  } catch {
    return null
  }
}

function setStoredTempPassword(userId: number, password: string): void {
  try {
    const raw = sessionStorage.getItem(TEMP_PASSWORD_STORAGE_KEY)
    const parsed: Record<number, string> = raw ? JSON.parse(raw) : {}
    parsed[userId] = password
    sessionStorage.setItem(TEMP_PASSWORD_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // ignore
  }
}

function clearStoredTempPassword(userId: number): void {
  try {
    const raw = sessionStorage.getItem(TEMP_PASSWORD_STORAGE_KEY)
    if (!raw) return
    const parsed: Record<number, string> = JSON.parse(raw)
    delete parsed[userId]
    sessionStorage.setItem(TEMP_PASSWORD_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // ignore
  }
}

type UserHeroProps = {
  user: PanelUser
  onApprove: () => void
  onToggleActive: () => void
  onResetPassword: () => void
  onEdit: () => void
  isPending: boolean
}

function UserHero({
  user,
  onApprove,
  onToggleActive,
  onResetPassword,
  onEdit,
  isPending,
}: UserHeroProps) {
  const coverSrc = getCoverSrc(user.role)
  const ringAccent = ROLE_RING_ACCENT[user.role] ?? ""

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Cover area */}
      <div className="relative h-[120px] sm:h-[160px] lg:h-[180px]">
        <img
          src={coverSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/covers/default.jpg"
            target.onerror = () => {
              target.style.display = "none"
            }
          }}
        />
        {/* Gradient overlay (light: hafif, dark: daha belirgin) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/8 to-transparent dark:from-black/50 dark:via-black/12 dark:to-transparent" />
      </div>

      {/* Profile bar (overlaps cover) */}
      <div className="px-6 pb-6">
        <div className="-mt-12 flex flex-col gap-4 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          {/* Sol: avatar + ad/email + badges + tarih */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div
              className={cn(
                "shrink-0 rounded-full ring-4 ring-background p-0.5",
                ringAccent
              )}
            >
              <UserAvatar
                user={user}
                firstName={user.first_name}
                lastName={user.last_name}
                email={user.email}
                className="h-[68px] w-[68px] text-lg"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {fullName(user)}
              </h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                    ROLE_COLORS[user.role] ?? "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                {user.is_approved ? (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    Onaylı
                  </span>
                ) : (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    Onay Bekliyor
                  </span>
                )}
                {user.is_active ? (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    Aktif
                  </span>
                ) : (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-gray-500/20 text-gray-500 dark:text-gray-400">
                    Pasif
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Kayıt: {formatDate(user.created_at)}
                {user.last_login && ` · Son giriş: ${formatDate(user.last_login)}`}
              </p>
            </div>
          </div>

          {/* Sağ: hızlı aksiyonlar */}
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={onApprove}
              disabled={isPending}
            >
              {user.is_approved ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Onayı Kaldır
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Onayla
                </>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Aktif</span>
              <Switch
                checked={user.is_active}
                onCheckedChange={onToggleActive}
                disabled={isPending}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onResetPassword}
              disabled={isPending}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Şifre Sıfırla
            </Button>
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </div>
  )
}

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "students" | "activity" | "notes">("general")
  const [lastResetPassword, setLastResetPassword] = useState<string | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)

  const userId = id ? parseInt(id, 10) : NaN

  const { data: user, isLoading, error } = useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => getUser(userId),
    enabled: !isNaN(userId),
  })

  const { data: teacherStudents = [] } = useQuery({
    queryKey: ["panel", "teachers", user?.teacher_profile_id, "students"],
    queryFn: () => getTeacherStudents(user!.teacher_profile_id!),
    enabled: !!user?.teacher_profile_id && user.role === "TEACHER",
  })

  useEffect(() => {
    if (!user) return
    if (!user.must_change_password) {
      setLastResetPassword(null)
      setPasswordVisible(false)
      clearStoredTempPassword(user.id)
      return
    }
    const stored = getStoredTempPassword(user.id)
    if (stored) setLastResetPassword(stored)
  }, [user])

  const updateMut = useMutation({
    mutationFn: ({ id: uid, data }: { id: number; data: Parameters<typeof updateUser>[1] }) =>
      updateUser(uid, data),
    onSuccess: (updated, v) => {
      qc.invalidateQueries({ queryKey: usersKeys.detail(v.id) })
      qc.invalidateQueries({ queryKey: usersKeys.all })
      const data = v.data ?? {}
      const keys = Object.keys(data)
      if (keys.length === 1 && "is_approved" in data) {
        toast.success(
          data.is_approved
            ? `"${fullName(updated)}" hesabı onaylandı.`
            : "Onay kaldırıldı."
        )
      } else if (keys.length === 1 && "is_active" in data) {
        toast.success(
          data.is_active ? "Hesap aktif hale getirildi." : "Hesap pasif duruma alındı."
        )
      } else {
        toast.success(`"${fullName(updated)}" güncellendi.`)
        setEditModalOpen(false)
      }
    },
    onError: (e) => {
      setEditModalOpen(false)
      toast.error(getErrorMessage(e))
    },
  })

  const resetMut = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: async (data, uid) => {
      qc.invalidateQueries({ queryKey: usersKeys.detail(uid) })
      setLastResetPassword(data.generated_password)
      setPasswordVisible(false)
      setStoredTempPassword(uid, data.generated_password)
      await resetPasswordSuccess(data.generated_password)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const handleApprove = () => {
    if (!user) return
    updateMut.mutate({
      id: user.id,
      data: { is_approved: !user.is_approved },
    })
  }

  const handleToggleActive = () => {
    if (!user) return
    updateMut.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    })
  }

  const handleResetPassword = () => {
    if (!user) return
    resetPasswordConfirm({ fullName: fullName(user) }).then(({ isConfirmed }) => {
      if (isConfirmed) resetMut.mutate(user.id)
    })
  }

  if (!id || isNaN(userId)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Geçersiz kullanıcı ID</p>
        <Button variant="secondary" onClick={() => navigate("/panel/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kullanıcılara Dön
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/40 bg-destructive/5 p-8">
        <p className="text-center text-sm text-destructive">Kullanıcı bulunamadı.</p>
        <Button variant="secondary" onClick={() => navigate("/panel/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kullanıcılara Dön
        </Button>
      </div>
    )
  }

  const TABS = [
    { id: "general" as const, label: "Genel", icon: User },
    ...(user.role === "TEACHER"
      ? [{ id: "students" as const, label: "Öğrenciler", icon: Users }]
      : []),
    { id: "activity" as const, label: "Aktivite", icon: Activity },
    { id: "notes" as const, label: "Notlar", icon: StickyNote },
  ]

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/panel/users")}
        className="-ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kullanıcılara Dön
      </Button>

      {/* Hero: cover + profile bar */}
      <UserHero
        user={user}
        onApprove={handleApprove}
        onToggleActive={handleToggleActive}
        onResetPassword={handleResetPassword}
        onEdit={() => setEditModalOpen(true)}
        isPending={updateMut.isPending || resetMut.isPending}
      />

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1" aria-label="Sekmeler">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg -mb-px",
                activeTab === tab.id
                  ? "bg-card border border-border border-b-0 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <InfoCard title="Profil Bilgileri" icon={User}>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Ad</dt>
                <dd className="font-medium">{user.first_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Soyad</dt>
                <dd className="font-medium">{user.last_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cinsiyet</dt>
                <dd>{GENDER_LABELS[user.gender] ?? user.gender}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Telefon</dt>
                <dd className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user.phone || "—"}
                </dd>
              </div>
            </dl>
          </InfoCard>

          <InfoCard title="Hesap & Güvenlik" icon={Mail}>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">E-posta</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rol</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ROLE_COLORS[user.role]
                    )}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Şifre Değişikliği</dt>
                <dd>
                  {user.must_change_password ? (
                    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      İlk girişte değiştirmeli
                    </span>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Geçici Şifre</dt>
                <dd>
                  {user.must_change_password === true ? (
                    lastResetPassword ? (
                      <span className="inline-flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                          {passwordVisible
                            ? lastResetPassword
                            : "*".repeat(Math.max(1, lastResetPassword.length))}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setPasswordVisible((v) => !v)}
                          title={passwordVisible ? "Gizle" : "Göster"}
                        >
                          {passwordVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(lastResetPassword)
                            toast.success("Şifre panoya kopyalandı")
                          }}
                          title="Panoya kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">*****</code>
                        <span className="text-xs text-muted-foreground">
                          (Şifre sadece oluşturulduğu anda görüntülenir)
                        </span>
                      </span>
                    )
                  ) : user.must_change_password === false ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      Kullanıcı geçici şifreyi değiştirdi
                    </span>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Son Giriş</dt>
                <dd>{formatDate(user.last_login)}</dd>
              </div>
            </dl>
          </InfoCard>

          {user.role === "TEACHER" && (
            <div className="lg:col-span-2">
              <InfoCard title="Atanan Öğrenciler" icon={Users}>
                <UserAssignmentsList
                  students={teacherStudents}
                  teacherProfileId={user.teacher_profile_id!}
                  onRefresh={() =>
                    qc.invalidateQueries({
                      queryKey: ["panel", "teachers", user.teacher_profile_id, "students"],
                    })
                  }
                />
              </InfoCard>
            </div>
          )}
        </div>
      )}

      {activeTab === "students" && user.role === "TEACHER" && (
        <InfoCard title="Öğrenciler" icon={Users}>
          <UserAssignmentsList
            students={teacherStudents}
            teacherProfileId={user.teacher_profile_id!}
            onRefresh={() =>
              qc.invalidateQueries({
                queryKey: ["panel", "teachers", user.teacher_profile_id, "students"],
              })
            }
          />
        </InfoCard>
      )}

      {activeTab === "activity" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <Activity className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Aktivite logu yakında eklenecek.</p>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <StickyNote className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Admin notları yakında eklenecek.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <CrudModal
          open={editModalOpen}
          title="Kullanıcı Düzenle"
          onClose={() => setEditModalOpen(false)}
        >
          <EditUserForm
            user={user}
            onSave={(data) => updateMut.mutate({ id: user.id, data })}
            onCancel={() => setEditModalOpen(false)}
            isPending={updateMut.isPending}
          />
        </CrudModal>
      )}

    </div>
  )
}

function EditUserForm({
  user,
  onSave,
  onCancel,
  isPending,
}: {
  user: PanelUser
  onSave: (data: UpdateUserPayload) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [email, setEmail] = useState(user.email)
  const [firstName, setFirstName] = useState(user.first_name)
  const [lastName, setLastName] = useState(user.last_name)
  const [phone, setPhone] = useState(user.phone || "")
  const [role, setRole] = useState(user.role)
  const [gender, setGender] = useState<Gender>(user.gender ?? "UNSPECIFIED")
  const [isActive, setIsActive] = useState(user.is_active)
  const [isApproved, setIsApproved] = useState(user.is_approved)
  const [gradeLevelId, setGradeLevelId] = useState<string>(
    user.role === "STUDENT" && user.grade_level_id ? String(user.grade_level_id) : ""
  )
  const lastPhoneToastRef = useRef<{ value: string; time: number }>({ value: "", time: 0 })

  const { data: gradeLevels = [] } = useQuery({
    queryKey: catalogKeys.gradeLevels("CLASS_EXAM"),
    queryFn: () => listGradeLevels(),
  })
  const gradeLevelOptions = gradeLevels.filter(
    (g) => g.is_active !== false && (g.kind === "CLASS" || g.kind === "EXAM")
  )

  useLayoutEffect(() => {
    setGradeLevelId(
      user.role === "STUDENT" && user.grade_level_id ? String(user.grade_level_id) : ""
    )
  }, [user.id, user.role, user.grade_level_id])

  const showPhoneErrorToast = (code: "NOT_TR_GSM" | "INCOMPLETE") => {
    const now = Date.now()
    if (lastPhoneToastRef.current.value === phone && now - lastPhoneToastRef.current.time < 300)
      return
    lastPhoneToastRef.current = { value: phone, time: now }
    if (code === "NOT_TR_GSM") toast.error("Geçerli bir telefon numarası giriniz.")
    else toast.error("Hatalı ya da eksik numara girdiniz.")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.trim()) {
      const v = validateTrGsmPhone(phone)
      if (!v.ok) {
        showPhoneErrorToast(v.code)
        return
      }
    }
    const fn = trTitle(firstName.trim())
    const ln = trTitle(lastName.trim())
    const ph = phone.trim() ? normalizeTrPhone(phone) : ""
    onSave({
      email: email.trim().toLowerCase(),
      first_name: fn,
      last_name: ln,
      phone: ph,
      gender,
      role,
      is_active: isActive,
      is_approved: isApproved,
      student_grade_level_id:
        role === "STUDENT" ? (gradeLevelId ? Number(gradeLevelId) : null) : undefined,
    })
  }

  const handlePhoneBlur = () => {
    if (!phone.trim()) return
    const v = validateTrGsmPhone(phone)
    if (!v.ok) showPhoneErrorToast(v.code)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">E-posta *</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Ad</label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(trTitle(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Soyad</label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(trTitle(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Telefon</label>
        <PhoneInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={handlePhoneBlur}
          placeholder="0(5xx) xxx xx xx"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Cinsiyet</label>
        <Select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="h-9"
        >
          {GENDER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Kullanıcı Türü</label>
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as PanelUser["role"])
            if (e.target.value !== "STUDENT") setGradeLevelId("")
          }}
          className="h-9"
        >
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>
      {role === "STUDENT" && (
        <div>
          <label className="mb-1 block text-sm font-medium">Sınıf Düzeyi</label>
          <Select
            value={gradeLevelId}
            onChange={(e) => setGradeLevelId(e.target.value)}
            className="h-9"
          >
            <option value="">Seçiniz</option>
            {gradeLevelOptions.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <span className="text-sm">Aktif</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={isApproved}
            onCheckedChange={setIsApproved}
          />
          <span className="text-sm">Onaylı</span>
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </form>
  )
}

function UserAssignmentsList({
  students,
  teacherProfileId: _teacherProfileId,
  onRefresh: _onRefresh,
}: {
  students: StudentListItem[]
  teacherProfileId: number
  onRefresh: () => void
}) {
  const fullName = (s: StudentListItem) =>
    [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Henüz atanmış öğrenci yok.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {students.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
              {(s.first_name?.[0] ?? s.email[0]).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{fullName(s)}</p>
              <p className="text-xs text-muted-foreground truncate">{s.email}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
