import { Trash2, Eye, MoreVertical, Pencil, KeyRound, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@shared/utils/cn"
import { Button } from "@shared/ui/button"
import { Checkbox } from "@shared/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@shared/ui/dropdown"
import { UserAvatar } from "./user-avatar"
import type { PanelUser } from "@features/admin/api/users-api"

const GRID_COLS =
  "48px minmax(0, 1.5fr) minmax(0, 1fr) 140px 140px 160px"

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

function fullName(u: PanelUser) {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email
}

function StatusPill({ approved, active }: { approved: boolean; active: boolean }) {
  if (!active)
    return (
      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-500/20 text-gray-400 dark:bg-gray-500/30 dark:text-gray-400">
        Pasif
      </span>
    )
  if (!approved)
    return (
      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400">
        Onay Bekliyor
      </span>
    )
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400">
      Aktif
    </span>
  )
}

type UsersTableProps = {
  users: PanelUser[]
  selectedIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  onEdit: (u: PanelUser) => void
  onApprove: (u: PanelUser) => void
  onResetPassword: (u: PanelUser) => void
  onDelete: (u: PanelUser) => void
  onBulkApprove?: (ids: number[]) => void
  onBulkUnapprove?: (ids: number[]) => void
  onBulkDelete?: (ids: number[]) => void
  onBulkResetPassword?: (ids: number[]) => void
  onView?: (u: PanelUser) => void
  isResetPending?: boolean
  isBulkActionPending?: boolean
}

export function UsersTable({
  users,
  selectedIds,
  onSelectionChange,
  onEdit,
  onApprove,
  onResetPassword,
  onDelete,
  onBulkApprove,
  onBulkUnapprove,
  onBulkDelete,
  onBulkResetPassword,
  onView,
  isResetPending,
  isBulkActionPending,
}: UsersTableProps) {
  const selectedCount = selectedIds.size
  const selectedList = Array.from(selectedIds)
  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id))
  const someSelected = users.some((u) => selectedIds.has(u.id))

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(users.map((u) => u.id)))
    }
  }

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions bar - her zaman görünür, seçim yokken pasif */}
      <div
        className={cn(
          "sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3 shadow-sm transition-colors",
          selectedCount > 0 ? "bg-card" : "bg-muted/20"
        )}
      >
        <span className="text-sm font-medium text-muted-foreground">
          {selectedCount > 0 ? `${selectedCount} kullanıcı seçili` : "Kullanıcı seçin"}
        </span>
        <div className="flex gap-2">
          {onBulkApprove && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => selectedCount > 0 && onBulkApprove(selectedList)}
              disabled={selectedCount === 0 || isBulkActionPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Toplu Onayla
            </Button>
          )}
          {onBulkUnapprove && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => selectedCount > 0 && onBulkUnapprove(selectedList)}
              disabled={selectedCount === 0 || isBulkActionPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Toplu Onayı Kaldır
            </Button>
          )}
          {onBulkResetPassword && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => selectedCount > 0 && onBulkResetPassword(selectedList)}
              disabled={selectedCount === 0 || isResetPending || isBulkActionPending}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Toplu Şifre Sıfırla
            </Button>
          )}
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedCount > 0 && onBulkDelete(selectedList)}
              disabled={selectedCount === 0 || isBulkActionPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Toplu Sil
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectionChange(new Set())}
          disabled={selectedCount === 0}
        >
          Seçimi temizle
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div
        className="grid items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={toggleAll}
          />
        </div>
        <div>Kullanıcı</div>
        <div className="flex justify-center">Telefon</div>
        <div className="flex justify-center">Kullanıcı Türü</div>
        <div className="flex justify-center">Durum</div>
        <div className="flex justify-center">İşlemler</div>
      </div>

      {/* Rows */}
      {users.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          Kullanıcı bulunamadı.
        </div>
      ) : (
        users.map((u) => {
          const roleColor = ROLE_COLORS[u.role] ?? "bg-gray-500/20 text-gray-600 dark:text-gray-400"
          return (
            <div
              key={u.id}
              className="grid items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors text-sm text-foreground"
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={selectedIds.has(u.id)}
                  onCheckedChange={() => toggleOne(u.id)}
                />
              </div>

              {/* User */}
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  user={u}
                  firstName={u.first_name}
                  lastName={u.last_name}
                  email={u.email}
                />
                <div className="min-w-0">
                  <div className="font-medium truncate">{fullName(u)}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-center min-w-0 text-sm text-muted-foreground">
                {u.phone || "—"}
              </div>

              {/* Role */}
              <div className="flex items-center justify-center min-w-0">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    roleColor
                  )}
                >
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center">
                <StatusPill approved={u.is_approved} active={u.is_active} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(u)}
                  title="Sil"
                >
                  <Trash2 className="h-7 w-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 p-0 rounded-md hover:bg-muted"
                  onClick={() => onView?.(u)}
                  title="Görüntüle"
                >
                  <Eye className="h-7 w-7" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 p-0 rounded-md hover:bg-muted"
                      title="Daha fazla"
                    >
                      <MoreVertical className="h-7 w-7" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="auto" className="min-w-[180px]">
                    <DropdownMenuItem onClick={() => onEdit(u)}>
                      <Pencil className="mr-2 h-5 w-5" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => !isResetPending && onResetPassword(u)}
                      disabled={isResetPending}
                    >
                      <KeyRound className="mr-2 h-5 w-5" />
                      Şifre Sıfırla
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onApprove(u)}>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {u.is_approved ? "Onayı Kaldır" : "Onayla"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })
      )}
      </div>
    </div>
  )
}
