import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@shared/utils/cn"

const MENU_EST_HEIGHT = 150

type DropdownContextType = {
  open: boolean
  setOpen: (open: boolean) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)

  return (
    <DropdownContext.Provider value={{ open, setOpen, containerRef, triggerRef }}>
      <div ref={containerRef} className="relative">{children}</div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ 
  children, 
  asChild 
}: { 
  children: React.ReactNode
  asChild?: boolean 
}) {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

  const handleClick = () => {
    context.setOpen(!context.open)
  }

  const trigger = asChild && React.isValidElement(children) ? (
    React.cloneElement(children as React.ReactElement<any>, { onClick: handleClick })
  ) : (
    <button onClick={handleClick} type="button">{children}</button>
  )

  return (
    <span
      ref={(el) => { (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = el }}
      className="inline-flex"
    >
      {trigger}
    </span>
  )
}

export function DropdownMenuContent({ 
  children,
  align = "end",
  side = "auto",
  className,
}: { 
  children: React.ReactNode
  align?: "start" | "end"
  side?: "top" | "bottom" | "auto"
  className?: string
}) {
  const context = React.useContext(DropdownContext)
  const contentRef = React.useRef<HTMLDivElement>(null)

  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

  React.useEffect(() => {
    if (!context.open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const container = context.containerRef.current
      const content = contentRef.current
      if (container?.contains(target) || content?.contains(target)) return
      context.setOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [context.open])

  if (!context.open) return null

  const trigger = context.triggerRef.current
  if (!trigger) return null

  const rect = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const openDown = side === "bottom" || (side === "top" ? false : spaceBelow >= MENU_EST_HEIGHT || spaceBelow >= spaceAbove)

  const style: React.CSSProperties = {
    position: "fixed",
    top: openDown ? rect.bottom + 8 : undefined,
    bottom: openDown ? undefined : window.innerHeight - rect.top + 8,
    left: align === "end" ? undefined : rect.left,
    right: align === "end" ? window.innerWidth - rect.right : undefined,
  }

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "py-1 rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.20)] z-[9999] min-w-[140px]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  )

  return createPortal(content, document.body)
}

export function DropdownMenuItem({ 
  children,
  onClick,
  className,
  disabled,
}: { 
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu")

  const handleClick = () => {
    if (disabled) return
    onClick?.()
    context.setOpen(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm text-muted-foreground hover:bg-muted/70 transition-colors outline-none focus:bg-transparent focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  )
}
