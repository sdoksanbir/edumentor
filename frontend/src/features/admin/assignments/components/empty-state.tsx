// src/features/admin/assignments/components/empty-state.tsx
import { Users } from "lucide-react"

export type EmptyStateProps = {
  message: string
  compact?: boolean
}

export function EmptyState({ message, compact }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center ${
        compact ? "py-8 px-4" : "py-12 px-6"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-muted/60 ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <Users className={compact ? "h-5 w-5 text-muted-foreground" : "h-6 w-6 text-muted-foreground"} />
      </div>
      <p className={`mt-2 text-muted-foreground ${compact ? "text-sm" : "text-base"}`}>{message}</p>
    </div>
  )
}
