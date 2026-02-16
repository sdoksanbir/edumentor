// src/features/admin/components/crud-modal.tsx
import { useEffect } from "react"
import { Button } from "@shared/ui/button"
import { cn } from "@shared/utils/cn"

type CrudModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function CrudModal({ open, title, onClose, children }: CrudModalProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        onKeyDown={() => {}}
        role="button"
        tabIndex={0}
        aria-label="Kapat"
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl",
          "p-6 max-h-[85vh] overflow-y-auto"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crud-modal-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="crud-modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
