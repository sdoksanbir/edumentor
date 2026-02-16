// src/features/admin/assignments/components/students-dual-list.tsx
import { useMemo } from "react"
import { Card, CardContent, CardHeader } from "@shared/ui/card"
import { StudentRow } from "./student-row"
import { AssignmentToolbar } from "./assignment-toolbar"
import { EmptyState } from "./empty-state"
import type { Student, ListFilters } from "../types"
import type { GradeLevelOption } from "./assignment-toolbar"

export type StudentListMode = "available" | "assigned"

export type StudentsDualListProps = {
  mode: StudentListMode
  students: Student[]
  filters: ListFilters
  onFiltersChange: (f: ListFilters) => void
  selectedIds: Set<number>
  onToggleSelection: (id: number) => void
  onBulkAction: () => void
  actionLabel: string
  actionVariant: "primary" | "destructive"
  actionDisabled: boolean
  actionLoading?: boolean
  actionTooltip?: string
  emptyMessage?: string
  gradeLevels?: GradeLevelOption[]
}

function filterStudents(students: Student[], filters: ListFilters): Student[] {
  let result = [...students]
  const q = filters.search.trim().toLowerCase()
  if (q) {
    result = result.filter(
        (s) =>
          (s.firstName ?? "").toLowerCase().includes(q) ||
          (s.lastName ?? "").toLowerCase().includes(q) ||
          (s.email ?? "").toLowerCase().includes(q) ||
          (s.phone ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    )
  }
  if (filters.status !== "all") {
    result = result.filter((s) => s.status === filters.status)
  }
  if (filters.grade !== "all") {
    result = result.filter((s) => s.grade === filters.grade)
  }
  return result
}

export function StudentsDualList({
  mode,
  students,
  filters,
  onFiltersChange,
  selectedIds,
  onToggleSelection,
  onBulkAction,
  actionLabel,
  actionVariant,
  actionDisabled,
  actionLoading,
  actionTooltip,
  emptyMessage,
  gradeLevels = [],
}: StudentsDualListProps) {
  const filtered = useMemo(() => filterStudents(students, filters), [students, filters])
  const label = mode === "available" ? "Uygun Öğrenciler" : "Atanan Öğrenciler"

  return (
    <Card className="rounded-2xl border-border shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <CardHeader className="pb-2">
        <AssignmentToolbar
          filters={filters}
          onFiltersChange={onFiltersChange}
          label={label}
          selectionCount={selectedIds.size}
          actionLabel={actionLabel}
          onAction={onBulkAction}
          actionVariant={actionVariant}
          actionDisabled={actionDisabled}
          actionLoading={actionLoading}
          actionTooltip={actionTooltip}
          gradeLevels={gradeLevels}
        />
      </CardHeader>
      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <EmptyState
            message={emptyMessage ?? (mode === "available" ? "Uygun öğrenci yok." : "Atanan öğrenci yok.")}
            compact
          />
        ) : (
          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border/60">
            <div className="divide-y divide-border/60">
              {filtered.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  selected={selectedIds.has(s.id)}
                  onToggle={() => onToggleSelection(s.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
