import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@shared/utils/cn"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full rounded-md border border-input bg-background pl-3 pr-12 py-2 text-sm",
            "appearance-none [-webkit-appearance:none] [-moz-appearance:none]",
            "transition-colors outline-none text-foreground",
            "border-border focus:border-ring",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    )
  }
)

Select.displayName = "Select"
