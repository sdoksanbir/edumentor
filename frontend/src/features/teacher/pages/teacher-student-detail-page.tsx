import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, Phone, Mail, User, Users, AlertCircle } from "lucide-react"
import { getStudent, listLessonsByStudent, getLesson, teacherKeys } from "../api/teacher-api"
import type { Lesson, LessonStatus } from "../types"
import { Button } from "@shared/ui/button"
import { SectionCard } from "../components/section-card"
import { LessonDetailModal } from "../components/lesson-detail-modal"
import { cn } from "@shared/utils/cn"

const STATUS_LABELS: Record<LessonStatus, string> = {
  DONE: "Yapılan",
  MISSED: "Yapılmayan",
  POSTPONED: "Ertelenen",
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export function TeacherStudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedLessonId, setSelectedLessonId] = useState<Lesson["id"] | null>(null)

  const studentQuery = useQuery({
    queryKey: teacherKeys.student(id ?? ""),
    queryFn: () => getStudent(id!),
    enabled: !!id,
  })

  const lessonsQuery = useQuery({
    queryKey: teacherKeys.lessons(id ?? ""),
    queryFn: () => listLessonsByStudent(id!),
    enabled: !!id,
  })

  const lessonQuery = useQuery({
    queryKey: selectedLessonId ? teacherKeys.lesson(selectedLessonId) : [...teacherKeys.all, "lesson", "none"] as const,
    queryFn: () => getLesson(selectedLessonId!),
    enabled: !!selectedLessonId,
  })

  const student = studentQuery.data ?? null
  const lessons = lessonsQuery.data ?? []
  const selectedLesson = lessonQuery.data ?? null

  const isLoading = studentQuery.isLoading || lessonsQuery.isLoading
  const isError = studentQuery.isError || lessonsQuery.isError
  const notFound = !studentQuery.isLoading && !student

  const lessonsByStatus = useMemo(() => {
    const by: Record<LessonStatus, Lesson[]> = { DONE: [], MISSED: [], POSTPONED: [] }
    lessons.forEach((l) => by[l.status].push(l))
    Object.values(by).forEach((arr) => arr.sort((a, b) => b.dateISO.localeCompare(a.dateISO)))
    return by
  }, [lessons])

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || notFound) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/students")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-8">
          <AlertCircle className="h-12 w-12 text-destructive/80" />
          <p className="text-center text-sm text-destructive">
            {isError ? "Veriler yüklenirken bir hata oluştu." : "Öğrenci bulunamadı."}
          </p>
        </div>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/students")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{student.fullName}</h1>
          {student.grade && (
            <p className="mt-0.5 text-sm text-muted-foreground">Sınıf {student.grade}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <User className="h-4 w-4" />
            Öğrenci
          </h3>
          <p className="font-medium">{student.fullName}</p>
          {student.grade && <p className="text-sm text-muted-foreground">Sınıf {student.grade}</p>}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-4 w-4" />
            Veli(ler)
          </h3>
          {student.guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground">Veli bilgisi yok.</p>
          ) : (
            <ul className="space-y-3">
              {student.guardians.map((g) => (
                <li key={g.id} className="text-sm">
                  <p className="font-medium">{g.fullName}</p>
                  {g.phone && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{g.phone}</span>
                    </p>
                  )}
                  {g.email && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{g.email}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {(["DONE", "MISSED", "POSTPONED"] as const).map((status) => {
          const items = lessonsByStatus[status]
          return (
            <SectionCard
              key={status}
              title={STATUS_LABELS[status]}
              count={items.length}
              isEmpty={items.length === 0}
              emptyMessage={`${STATUS_LABELS[status]} ders yok.`}
            >
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((lesson) => {
                    const isClickable = status === "DONE"
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => isClickable && setSelectedLessonId(lesson.id)}
                        className={cn(
                          "rounded-lg border border-border/60 bg-muted/20 p-4 transition-colors",
                          isClickable && "cursor-pointer hover:border-primary/30 hover:bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-sm font-medium">{formatDate(lesson.dateISO)}</span>
                          {status === "DONE" && lesson.topic && (
                            <span className="min-w-0 truncate text-right text-sm text-muted-foreground">
                              {lesson.topic}
                            </span>
                          )}
                        </div>
                        {status !== "DONE" && lesson.topic && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">{lesson.topic}</p>
                        )}
                        {isClickable && (
                          <p className="mt-1 text-xs text-primary">Detay için tıklayın</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>
          )
        })}
      </div>

      <LessonDetailModal
        lesson={selectedLesson}
        isLoading={!!selectedLessonId && lessonQuery.isLoading}
        onClose={() => setSelectedLessonId(null)}
      />
    </div>
  )
}
