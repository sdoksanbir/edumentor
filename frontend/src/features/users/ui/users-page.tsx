import { useState, useMemo, useEffect, useLayoutEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { PhoneInput } from "@shared/ui/phone-input"
import { CrudModal } from "@features/admin/components/crud-modal"
import { Checkbox } from "@shared/ui/checkbox"
import { UsersTable } from "@features/users/components/users-table"
import { trTitle } from "@shared/lib/tr-string"
import { normalizeTrPhone, getTrPhoneValidationError } from "@shared/lib/phone"
import type { Gender } from "@features/admin/api/users-api"
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  usersKeys,
  type PanelUser,
  type CreateUserPayload,
} from "@features/admin/api/users-api"
import { listGradeLevels, catalogKeys } from "@features/admin/api/admin-api"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@shared/ui/dropdown"
import { Loader2, Plus, Download, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { confirmDelete } from "@shared/lib/swal"
import { getErrorMessage } from "@shared/lib/toast-messages"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Öğretmen",
  STUDENT: "Öğrenci",
  PARENT: "Veli",
}

function fullName(u: PanelUser) {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Kopyalandı")
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="secondary" size="sm" onClick={copy}>
      {copied ? "Kopyalandı!" : label}
    </Button>
  )
}

const TEMP_PASSWORD_STORAGE_KEY = "panel_temp_password"

function storeTempPassword(userId: number, password: string) {
  try {
    const raw = sessionStorage.getItem(TEMP_PASSWORD_STORAGE_KEY)
    const parsed: Record<number, string> = raw ? JSON.parse(raw) : {}
    parsed[userId] = password
    sessionStorage.setItem(TEMP_PASSWORD_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // ignore
  }
}

export function UsersPage() {
  const qc = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PanelUser | null>(null)
  const [createResult, setCreateResult] = useState<{ password: string } | null>(null)
  const [resetResult, setResetResult] = useState<{ id: number; password: string } | null>(null)
  const [bulkResetResult, setBulkResetResult] = useState<Array<{ id: number; email: string; password: string }>>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    plan: "", // placeholder
    status: "", // approved + active combined
  })
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.role, filters.status])

  const editUserId = (location.state as { editUserId?: number })?.editUserId
  useEffect(() => {
    if (editUserId) {
      navigate(".", { replace: true, state: {} })
      getUser(editUserId).then((u) => {
        setEditing(u)
        setModalOpen(true)
      })
    }
  }, [editUserId])

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = {}
    if (debouncedSearch) p.search = debouncedSearch
    if (filters.role) p.role = filters.role
    if (filters.status === "active") {
      p.approved = "true"
      p.active = "true"
    } else if (filters.status === "inactive") {
      p.active = "false"
    } else if (filters.status === "pending") {
      p.approved = "false"
    }
    p.page = page
    p.page_size = pageSize
    return p
  }, [debouncedSearch, filters.role, filters.status, page, pageSize])

  const { data, isLoading, isError } = useQuery({
    queryKey: usersKeys.list(queryParams),
    queryFn: () => listUsers(queryParams),
  })

  const users = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      setEditing(null)
      setCreateResult({ password: data.generated_password })
      storeTempPassword(data.user.id, data.generated_password)
      toast.success("Kullanıcı oluşturuldu.")
    },
    onError: (e) => {
      setModalOpen(false)
      setEditing(null)
      toast.error(getErrorMessage(e))
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, data),
    onSuccess: (data: PanelUser) => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      setModalOpen(false)
      setEditing(null)
      toast.success(`"${fullName(data)}" güncellendi.`)
    },
    onError: (e) => {
      setModalOpen(false)
      setEditing(null)
      toast.error(getErrorMessage(e))
    },
  })

  const resetMut = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (data, userId) => {
      setResetResult({ id: userId, password: data.generated_password })
      storeTempPassword(userId, data.generated_password)
      toast.success("Yeni şifre oluşturuldu.")
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      setModalOpen(false)
      setEditing(null)
      setSelectedIds(new Set())
      toast.success("Kullanıcı silindi.")
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkApproveMut = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => updateUser(id, { is_approved: true })))
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      setSelectedIds(new Set())
      toast.success(`${ids.length} kullanıcı onaylandı.`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkUnapproveMut = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => updateUser(id, { is_approved: false })))
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      setSelectedIds(new Set())
      toast.success(`${ids.length} kullanıcının onayı kaldırıldı.`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => deleteUser(id)))
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      setModalOpen(false)
      setEditing(null)
      setSelectedIds(new Set())
      toast.success(`${ids.length} kullanıcı silindi.`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkResetMut = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const data = await resetUserPassword(id)
          const user = users.find((u) => u.id === id)
          storeTempPassword(id, data.generated_password)
          return { id, email: user?.email ?? "", password: data.generated_password }
        })
      )
      return results
    },
    onSuccess: (results) => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      setSelectedIds(new Set())
      setBulkResetResult(results)
      toast.success(`${results.length} kullanıcının şifresi sıfırlandı.`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function openCreate() {
    setEditing(null)
    setCreateResult(null)
    setResetResult(null)
    createMut.reset()
    setModalOpen(true)
  }

  function openEdit(u: PanelUser) {
    setEditing(u)
    setCreateResult(null)
    setResetResult(null)
    setModalOpen(true)
  }

  const handleResetPassword = (u: PanelUser) => {
    setResetResult(null)
    resetMut.mutate(u.id)
  }

  const handleApprove = (u: PanelUser) => {
    updateMut.mutate({
      id: u.id,
      data: { is_approved: !u.is_approved },
    })
  }

  const handleDelete = (u: PanelUser) => {
    confirmDelete(
      `${fullName(u)} kullanıcısı silinsin mi?`,
      "Bu işlem geri alınamaz."
    ).then(({ isConfirmed }) => {
      if (isConfirmed) deleteMut.mutate(u.id)
    })
  }

  const handleBulkApprove = (ids: number[]) => {
    bulkApproveMut.mutate(ids)
  }

  const handleBulkUnapprove = (ids: number[]) => {
    bulkUnapproveMut.mutate(ids)
  }

  const handleBulkDelete = (ids: number[]) => {
    confirmDelete(
      `${ids.length} kullanıcı silinsin mi?`,
      "Bu işlem geri alınamaz."
    ).then(({ isConfirmed }) => {
      if (isConfirmed) bulkDeleteMut.mutate(ids)
    })
  }

  const handleBulkResetPassword = (ids: number[]) => {
    bulkResetMut.mutate(ids)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-8">
        <p className="text-center text-sm text-destructive">Veriler yüklenirken hata oluştu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Kullanıcı Yönetimi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sisteme kullanıcı ekleyin, düzenleyin ve yönetin.
        </p>
      </div>

      {/* Top: 3 Filter selects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Kullanıcı Türü</label>
          <Select
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            className="h-10 rounded-lg"
          >
            <option value="">Tüm Kullanıcılar</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Plan</label>
          <Select
            value={filters.plan}
            onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value }))}
            className="h-10 rounded-lg"
          >
            <option value="">Tüm planlar</option>
            <option value="free">Ücretsiz</option>
            <option value="pro">Pro</option>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Durum</label>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="h-10 rounded-lg"
          >
            <option value="">Tüm durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
            <option value="pending">Onay Bekliyor</option>
          </Select>
        </div>
      </div>

      {/* Second row: Export left, Search + Add right */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Dışa Aktar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => toast.info("CSV dışa aktarma yakında eklenecek")}>
              CSV olarak dışa aktar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Excel dışa aktarma yakında eklenecek")}>
              Excel olarak dışa aktar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kullanıcı ara"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="pl-9 h-10 w-64"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kullanıcı Ekle
          </Button>
        </div>
      </div>

      {/* Table veya boş mesaj */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
          <p className="text-sm">Filtrelere uygun kullanıcı bulunamadı.</p>
        </div>
      ) : (
        <>
        <UsersTable
          users={users}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={openEdit}
          onApprove={handleApprove}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
          onBulkApprove={handleBulkApprove}
          onBulkUnapprove={handleBulkUnapprove}
          onBulkDelete={handleBulkDelete}
          onBulkResetPassword={handleBulkResetPassword}
          onView={(u) => navigate(`/panel/users/${u.id}`)}
          isResetPending={resetMut.isPending}
          isBulkActionPending={
            bulkApproveMut.isPending ||
            bulkUnapproveMut.isPending ||
            bulkDeleteMut.isPending ||
            bulkResetMut.isPending
          }
        />

        {/* Sayfalama */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sayfa başına:</span>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-9"
            >
              {[5, 10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
            <span className="text-sm text-muted-foreground">
              {totalCount > 0
                ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} / ${totalCount} kayıt`
                : "0 kayıt"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Button>
            <span className="px-3 text-sm text-muted-foreground">
              Sayfa {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <CrudModal
        open={modalOpen}
        title={editing ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          setCreateResult(null)
          setResetResult(null)
          createMut.reset()
        }}
      >
        {createResult ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                Kullanıcı oluşturuldu.
              </p>
              <p className="mt-2 text-sm">
                Geçici şifre: <code className="bg-muted px-1 rounded">{createResult.password}</code>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Kullanıcı ilk girişte şifre değiştirmek zorunda.
              </p>
            </div>
            <div className="flex gap-2">
              <CopyButton text={createResult.password} label="Şifreyi Kopyala" />
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Kapat
              </Button>
            </div>
          </div>
        ) : editing ? (
          <EditUserForm
            user={editing}
            onSave={(data) => updateMut.mutate({ id: editing.id, data })}
            onCancel={() => setModalOpen(false)}
            isPending={updateMut.isPending}
          />
        ) : (
          <CreateUserForm
            onSubmit={(data) => createMut.mutate(data)}
            onCancel={() => setModalOpen(false)}
            isPending={createMut.isPending}
            error={createMut.isError ? getErrorMessage(createMut.error) : null}
          />
        )}
      </CrudModal>

      {/* Reset password modal */}
      {resetResult && !modalOpen && (
        <CrudModal
          open={!!resetResult}
          title="Şifre Sıfırlandı"
          onClose={() => setResetResult(null)}
        >
          <div className="space-y-4">
            <p className="text-sm">
              Yeni şifre: <code className="bg-muted px-1 rounded">{resetResult.password}</code>
            </p>
            <CopyButton text={resetResult.password} label="Kopyala" />
          </div>
        </CrudModal>
      )}

      {/* Bulk reset password modal */}
      {bulkResetResult.length > 0 && (
        <CrudModal
          open={bulkResetResult.length > 0}
          title="Toplu Şifre Sıfırlama"
          onClose={() => setBulkResetResult([])}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aşağıdaki kullanıcıların yeni şifreleri:
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
              {bulkResetResult.map(({ email, password }) => (
                <div
                  key={email}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="truncate">{email}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{password}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(password)
                        toast.success("Kopyalandı")
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={() => setBulkResetResult([])}>
              Kapat
            </Button>
          </div>
        </CrudModal>
      )}
    </div>
  )
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Kadın" },
  { value: "MALE", label: "Erkek" },
  { value: "UNSPECIFIED", label: "Belirtmek istemiyorum" },
]

function CreateUserForm({
  onSubmit,
  onCancel,
  isPending,
  error: apiError,
}: {
  onSubmit: (data: CreateUserPayload) => void
  onCancel: () => void
  isPending: boolean
  error?: string | null
}) {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<CreateUserPayload["role"]>("TEACHER")
  const [gender, setGender] = useState<Gender>("UNSPECIFIED")
  const [gradeLevelId, setGradeLevelId] = useState<string>("")
  const [localError, setLocalError] = useState<string | null>(null)

  const { data: gradeLevels = [] } = useQuery({
    queryKey: catalogKeys.gradeLevels("CLASS_EXAM"),
    queryFn: () => listGradeLevels(),
  })
  const gradeLevelOptions = gradeLevels.filter(
    (g) => g.is_active !== false && (g.kind === "CLASS" || g.kind === "EXAM")
  )

  const error = apiError || localError

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!email.trim()) {
      setLocalError("E-posta zorunludur.")
      return
    }
    const phoneErr = phone.trim() ? getTrPhoneValidationError(phone) : null
    if (phoneErr) {
      setLocalError(phoneErr)
      return
    }
    const fn = trTitle(firstName.trim())
    const ln = trTitle(lastName.trim())
    const ph = phone.trim() ? normalizeTrPhone(phone) : undefined
    onSubmit({
      email: email.trim().toLowerCase(),
      first_name: fn,
      last_name: ln,
      phone: ph,
      gender,
      role,
      grade_level_id: role === "STUDENT" && gradeLevelId ? Number(gradeLevelId) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">E-posta *</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Ad</label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(trTitle(e.target.value))}
            placeholder="Ad"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Soyad</label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(trTitle(e.target.value))}
            placeholder="Soyad"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Telefon</label>
        <PhoneInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
            setRole(e.target.value as CreateUserPayload["role"])
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
      <p className="text-xs text-muted-foreground">
        Şifre otomatik oluşturulacak. Kullanıcı ilk girişte şifresini değiştirmek zorunda olacaktır.
      </p>
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

function EditUserForm({
  user,
  onSave,
  onCancel,
  isPending,
}: {
  user: PanelUser
  onSave: (data: Parameters<typeof updateUser>[1]) => void
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
  const [localError, setLocalError] = useState<string | null>(null)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    const phoneErr = phone.trim() ? getTrPhoneValidationError(phone) : null
    if (phoneErr) {
      setLocalError(phoneErr)
      return
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {localError && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {localError}
        </div>
      )}
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
