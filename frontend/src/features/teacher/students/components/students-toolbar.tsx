// src/features/teacher/students/components/students-toolbar.tsx
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { Search } from "lucide-react"

export type FilterState = {
  search: string
  status: "all" | "ACTIVE" | "PASSIVE"
}

export type StudentsToolbarProps = {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
}

export function StudentsToolbar({
  filters,
  onFiltersChange,
}: StudentsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ad, e-posta veya telefon ara..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="rounded-lg pl-9"
        />
      </div>
      <Select
        value={filters.status}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            status: e.target.value as FilterState["status"],
          })
        }
        className="w-full sm:w-[140px] rounded-lg"
      >
        <option value="all">Tümü</option>
        <option value="ACTIVE">Aktif</option>
        <option value="PASSIVE">Pasif</option>
      </Select>
    </div>
  )
}
