// src/features/teacher/components/section-card.tsx
import * as React from "react"
import { cn } from "@shared/utils/cn"

export type SectionCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string
  count?: number
  emptyMessage?: string
  isEmpty?: boolean
}

export function SectionCard({
  title,
  count,
  emptyMessage = "Henüz kayıt yok.",
  isEmpty,
  className,
  children,
  ...props
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
        className
      )}
      {...props}
    >
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            {count}
          </span>
        )}
      </h3>
      {isEmpty !== undefined && isEmpty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  )
}
