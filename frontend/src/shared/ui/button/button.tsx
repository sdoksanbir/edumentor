import React from "react"
import { cn } from "@shared/utils/cn"

type Variant = "primary" | "secondary" | "ghost" | "destructive"
type Size = "sm" | "md" | "lg" | "icon"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors outline-none " +
  "border border-transparent " +
  "focus-visible:border-ring " +
  "disabled:opacity-50 disabled:pointer-events-none"

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-muted text-foreground hover:bg-muted/80 active:bg-muted/70",
  ghost: "bg-transparent hover:bg-muted active:bg-muted/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-red-700 active:bg-red-800",
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-9 w-9 p-0",
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  )
}
