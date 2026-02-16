// src/features/admin/assignments/components/teacher-picker.tsx
import { useMemo, useState } from "react"
import { Input } from "@shared/ui/input"
import { cn } from "@shared/utils/cn"
import { Search, GraduationCap, ChevronDown } from "lucide-react"
import type { Teacher } from "../types"

export type TeacherPickerProps = {
  teachers: Teacher[]
  selectedId: number | null
  onSelect: (teacher: Teacher | null) => void
  isLoading?: boolean
  placeholder?: string
}

export function TeacherPicker({
  teachers,
  selectedId,
  onSelect,
  isLoading,
  placeholder = "Öğretmen seçin",
}: TeacherPickerProps) {
  const [search, setSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter(
      (t) =>
        t.firstName.toLowerCase().includes(q) ||
        t.lastName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.branch.toLowerCase().includes(q)
    )
  }, [teachers, search])

  const selected = teachers.find((t) => t.id === selectedId)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen((o) => !o)}
        disabled={isLoading}
        className={cn(
          "flex w-full min-w-[280px] items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="truncate text-sm font-medium text-foreground">
                {selected.firstName} {selected.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {selected.branch} · {selected.email}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{placeholder}</p>
          )}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-card py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
          <div className="border-b border-border px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Öğretmen ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 rounded-lg"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t)
                  setDropdownOpen(false)
                  setSearch("")
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/70",
                  selectedId === t.id && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{t.firstName} {t.lastName}</span>
                  <span className="text-xs text-muted-foreground">· {t.branch}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{t.email}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Öğretmen bulunamadı.</p>
            )}
          </div>
        </div>
      )}

      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
