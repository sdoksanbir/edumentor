// src/features/teacher/components/lesson-detail-modal.tsx
import { useEffect } from "react"
import type { Lesson } from "../types"
import { Button } from "@shared/ui/button"
import { cn } from "@shared/utils/cn"
import { Loader2 } from "lucide-react"

type LessonDetailModalProps = {
  lesson: Lesson | null
  isLoading?: boolean
  onClose: () => void
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function LessonDetailModal({ lesson, isLoading, onClose }: LessonDetailModalProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [onClose])

  const isOpen = !!lesson || !!isLoading
  if (!isOpen) return null

  const tabs = lesson
    ? [
        { key: "topic" as const, label: "Konu", value: lesson.topic || "—" },
        { key: "homework" as const, label: "Ödev", value: lesson.homework || "—" },
        { key: "notes" as const, label: "Ders Notu", value: lesson.notes || "—" },
      ]
    : []

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
          "relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl",
          "p-6 max-h-[85vh] overflow-y-auto"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-modal-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="lesson-modal-title" className="text-lg font-semibold">
            {lesson ? `Ders Detayı — ${formatDate(lesson.dateISO)}` : "Ders Detayı"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[120px] items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {tabs.map(({ key, label, value }) => (
              <div key={key} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </h4>
                <p className="whitespace-pre-wrap text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
