import { useEffect, useMemo, useState } from "react"
import { Button } from "@shared/ui/button"
import { Select } from "@shared/ui/select"
import { useAuth } from "@app/providers/auth-provider"
import { STUDENT_PROFILE_KEY } from "@app/constants/storage-keys"
import { apiClient } from "@shared/api/client"

type Grade = { id: number; code: string; label: string; order: number; is_active: boolean }
type ExamType = { id: number; code: string; label: string; order: number; is_active: boolean }

export function StudentProfileSetupPage() {
  const { user } = useAuth()

  const [grades, setGrades] = useState<Grade[]>([])
  const [examTypes, setExamTypes] = useState<ExamType[]>([])

  const [gradeId, setGradeId] = useState<string>("")
  const [examTypeId, setExamTypeId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [gRes, eRes] = await Promise.all([
          apiClient.get("/catalog/grades/"),
          apiClient.get("/catalog/exam-types/"),
        ])

        if (!alive) return
        setGrades((gRes.data ?? []).filter((x: Grade) => x.is_active))
        setExamTypes((eRes.data ?? []).filter((x: ExamType) => x.is_active))
      } catch {
        if (!alive) return
        setError("Veri yüklenemedi.")
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const canSubmit = useMemo(() => {
    return Boolean(gradeId) && Boolean(examTypeId) && !loading
  }, [gradeId, examTypeId, loading])

  const handleComplete = () => {
    // ✅ şimdilik frontend gate için localStorage
    localStorage.setItem(STUDENT_PROFILE_KEY, "1")

    // ✅ ileride burada backend'e POST edeceğiz:
    // POST /api/student/profile/  { grade_id, exam_type_id }

    window.location.href = "/student/dashboard"
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Öğrenci Profili</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devam etmek için profilini tamamlamalısın.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Giriş yapan: {user?.email}</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        {loading && (
          <div className="text-sm text-muted-foreground">Katalog verileri yükleniyor...</div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {error}
          </div>
        )}

        {/* Sınıf */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sınıf</label>
          <Select
            className="h-10 border-border"
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            disabled={loading}
          >
            <option value="">Seçiniz</option>
            {grades.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Hedef sınav */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Hedef Sınav</label>
          <Select
            className="h-10 border-border"
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
            disabled={loading}
          >
            <option value="">Seçiniz</option>
            {examTypes.map((x) => (
              <option key={x.id} value={String(x.id)}>
                {x.label}
              </option>
            ))}
          </Select>
        </div>

        <Button className="w-full" disabled={!canSubmit} onClick={handleComplete}>
          Profili Tamamla
        </Button>
      </div>
    </div>
  )
}
