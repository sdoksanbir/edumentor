import * as React from "react"
import { cn } from "@shared/utils/cn"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm",
          "border transition-colors outline-none",
          "text-foreground placeholder:text-muted-foreground",
          error
            ? "border-red-500 focus:border-red-500"
            : "border-border focus:border-ring",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
