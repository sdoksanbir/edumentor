// src/features/teacher/students/components/empty-state.tsx
import { Button } from "@shared/ui/button"
import { Users } from "lucide-react"

export type EmptyStateProps = {
  onResetFilters?: () => void
  hasActiveFilters?: boolean
}

export function EmptyState({
  onResetFilters,
  hasActiveFilters = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card py-16 px-6 text-center shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
        <Users className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {hasActiveFilters
            ? "Aramanıza uygun öğrenci bulunamadı."
            : "Henüz öğrenci kaydı yok."}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? "Filtreleri değiştirerek tekrar deneyin."
            : "Sana atanmış öğrenci bulunmuyor. Admin üzerinden atama yapılabilir."}
        </p>
      </div>
      {hasActiveFilters && onResetFilters && (
        <Button variant="secondary" size="sm" onClick={onResetFilters}>
          Filtreleri sıfırla
        </Button>
      )}
    </div>
  )
}
