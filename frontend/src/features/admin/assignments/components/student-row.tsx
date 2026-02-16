// src/features/admin/assignments/components/student-row.tsx
import { Checkbox } from "@shared/ui/checkbox"
import { cn } from "@shared/utils/cn"
import type { Student } from "../types"

export type StudentRowProps = {
  student: Student
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

function getInitials(s: Student): string {
  const f = (s.firstName ?? "").charAt(0)
  const l = (s.lastName ?? "").charAt(0)
  return `${f}${l}`.toUpperCase() || "?"
}

function fullName(s: Student): string {
  return `${s.firstName} ${s.lastName}`.trim()
}

export function StudentRow({ student, selected, onToggle, disabled }: StudentRowProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        "hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => !disabled && onToggle()}
        disabled={disabled}
      />
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {getInitials(student)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{fullName(student)}</p>
        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
        {(student.phone || student.grade) && (
          <p className="text-xs text-muted-foreground/80">
            {[student.phone, student.grade ? `Sınıf ${student.grade}` : null].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      {student.status && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            student.status === "ACTIVE"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {student.status === "ACTIVE" ? "Aktif" : "Pasif"}
        </span>
      )}
    </label>
  )
}
