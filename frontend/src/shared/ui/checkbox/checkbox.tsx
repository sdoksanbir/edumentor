import * as React from "react"
import { useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@shared/utils/cn"

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> & {
  onCheckedChange?: (checked: boolean) => void
  indeterminate?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
}

const iconSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, indeterminate, size = "lg", ...props }, ref) => {
    const isControlled = checked !== undefined
    const [uncontrolled, setUncontrolled] = React.useState(false)
    const isChecked = isControlled ? checked : uncontrolled

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked
      if (!isControlled) setUncontrolled(next)
      onCheckedChange?.(next)
      props.onChange?.(e)
    }

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const setRef = (el: HTMLInputElement | null) => {
      inputRef.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    }
    useEffect(() => {
      if (inputRef.current && indeterminate !== undefined) {
        inputRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    return (
      <label
        className={cn(
          "inline-flex items-center justify-center shrink-0 cursor-pointer",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          type="checkbox"
          ref={setRef}
          checked={isChecked}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <span
          className={cn(
            "rounded border-2 border-input bg-background",
            sizeClasses[size],
            "flex items-center justify-center",
            "transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-disabled:pointer-events-none peer-disabled:opacity-50",
            isChecked && "bg-primary border-primary text-primary-foreground"
          )}
        >
          {isChecked && <Check className={cn(iconSizes[size], "stroke-[3]")} />}
        </span>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"
