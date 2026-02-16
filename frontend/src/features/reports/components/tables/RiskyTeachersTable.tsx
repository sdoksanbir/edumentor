import { useState } from "react"
import { Table, TableHead, TableRow, TableCell } from "@shared/ui/table"
import { Badge } from "@shared/ui/badge"
import { Button } from "@shared/ui/button"
import { X } from "lucide-react"
import type { RiskyTeacherItem } from "../../types"
import { fetchInactiveStudents } from "../../api/reportsApi"
import type { InactiveStudentItem } from "../../types"

function riskScoreVariant(score: number): "success" | "muted" | "fail" {
  if (score < 40) return "success"
  if (score < 70) return "muted"
  return "fail"
}

function riskScoreLabel(score: number): string {
  if (score < 40) return "Düşük"
  if (score < 70) return "Orta"
  return "Yüksek"
}

type Props = {
  data: RiskyTeacherItem[]
  isLoading?: boolean
  dateFrom?: string
  dateTo?: string
}

export function RiskyTeachersTable({ data, isLoading }: Props) {
  const [selectedTeacher, setSelectedTeacher] = useState<RiskyTeacherItem | null>(null)
  const [students, setStudents] = useState<InactiveStudentItem[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  const openDrawer = async (row: RiskyTeacherItem) => {
    setSelectedTeacher(row)
    setStudentsLoading(true)
    try {
      const res = await fetchInactiveStudents({
        teacher_profile_id: row.teacher_profile_id,
        days: 14,
        page_size: 100,
      })
      setStudents(res.items)
    } catch {
      setStudents([])
    } finally {
      setStudentsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Riskli öğretmen bulunamadı.
      </div>
    )
  }

  return (
    <>
      <Table>
        <thead>
          <TableRow>
            <TableHead>Öğretmen</TableHead>
            <TableHead>Branş</TableHead>
            <TableHead className="text-right">Öğrenci</TableHead>
            <TableHead className="text-right">Pasif Oran</TableHead>
            <TableHead className="text-right">Şifre Değiştir Oran</TableHead>
            <TableHead className="text-right">Öğr. Giriş (14g)</TableHead>
            <TableHead>Risk Skoru</TableHead>
          </TableRow>
        </thead>
        <tbody>
          {data.map((row) => (
            <TableRow
              key={row.teacher_profile_id}
              className="cursor-pointer hover:bg-muted/60 transition-colors"
              onClick={() => openDrawer(row)}
            >
              <TableCell className="font-medium">{row.teacher_name}</TableCell>
              <TableCell>{row.branch_label ?? "—"}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("tr-TR").format(row.students_count)}
              </TableCell>
              <TableCell className="text-right">
                {row.students_count > 0
                  ? `%${(row.inactive_students_ratio * 100).toFixed(0)}`
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.students_count > 0
                  ? `%${(row.must_change_password_ratio * 100).toFixed(0)}`
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("tr-TR").format(row.teacher_logins_last_14_days)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 min-w-[80px] max-w-[120px] rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.risk_score >= 70
                          ? "bg-rose-500"
                          : row.risk_score >= 40
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${row.risk_score}%` }}
                    />
                  </div>
                  <Badge variant={riskScoreVariant(row.risk_score)}>
                    {row.risk_score.toFixed(0)} · {riskScoreLabel(row.risk_score)}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Drawer/Modal */}
      {selectedTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedTeacher(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-semibold">
                {selectedTeacher.teacher_name} — Pasif Öğrenciler (14 gün)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTeacher(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-4">
              {studentsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">
                  Bu öğretmene ait pasif öğrenci bulunamadı.
                </p>
              ) : (
                <div className="space-y-2">
                  {students.map((s) => (
                    <div
                      key={s.student_profile_id}
                      className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">{s.student_name}</span>
                        {s.must_change_password && (
                          <Badge variant="fail" className="ml-2">
                            Şifre değiştir
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {s.days_inactive} gündür pasif
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
