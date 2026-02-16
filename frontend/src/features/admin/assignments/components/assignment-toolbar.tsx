// src/features/admin/assignments/components/assignment-toolbar.tsx
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { Button } from "@shared/ui/button"
import { Search } from "lucide-react"
import type { ListFilters } from "../types"

export type GradeLevelOption = { id: number; name: string }

export type AssignmentToolbarProps = {
  filters: ListFilters
  onFiltersChange: (f: ListFilters) => void
  label: string
  selectionCount: number
  actionLabel: string
  onAction: () => void
  actionVariant: "primary" | "destructive"
  actionDisabled: boolean
  actionLoading?: boolean
  gradeLevels?: GradeLevelOption[]
}

export function AssignmentToolbar({
  filters,
  onFiltersChange,
  label,
  selectionCount,
  actionLabel,
  onAction,
  actionVariant,
  actionDisabled,
  actionLoading,
  gradeLevels = [],
}: AssignmentToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {selectionCount > 0 && (
          <span className="text-xs text-muted-foreground">{selectionCount} seçili</span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ad, e-posta veya telefon ara..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 h-9 rounded-lg"
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({ ...filters, status: e.target.value as ListFilters["status"] })
          }
          className="h-9 w-full sm:w-[120px] rounded-lg"
        >
          <option value="all">Tümü</option>
          <option value="ACTIVE">Aktif</option>
          <option value="PASSIVE">Pasif</option>
        </Select>
        <Select
          value={filters.grade}
          onChange={(e) => onFiltersChange({ ...filters, grade: e.target.value })}
          className="h-9 w-full sm:w-[120px] rounded-lg"
        >
          <option value="all">Sınıf</option>
          {gradeLevels.map((gl) => (
            <option key={gl.id} value={gl.name}>
              {gl.name}
            </option>
          ))}
        </Select>
      </div>
      {selectionCount > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant={actionVariant === "destructive" ? "destructive" : "primary"}
            size="sm"
            onClick={onAction}
            disabled={actionDisabled || actionLoading}
            loading={actionLoading}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
