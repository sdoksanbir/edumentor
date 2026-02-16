import * as React from "react"
import { cn } from "@shared/utils/cn"

type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const positionClass =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-2"
        : side === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-2"
          : "left-full top-1/2 -translate-y-1/2 ml-2"

  return (
    <div className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <div
        className={cn(
          "pointer-events-none absolute z-50 hidden max-w-xs break-words rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground shadow-md",
          "group-hover/tooltip:block",
          positionClass
        )}
      >
        {content}
      </div>
    </div>
  )
}
