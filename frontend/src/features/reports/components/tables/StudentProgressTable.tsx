import { Table, TableHead, TableRow, TableCell } from "@shared/ui/table"
import type { StudentProgressItem } from "../../types"

function formatDate(s: string | null) {
  if (!s) return "—"
  try {
    return new Date(s).toLocaleDateString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
    })
  } catch {
    return s
  }
}

type Props = {
  data: StudentProgressItem[]
  isLoading?: boolean
}

export function StudentProgressTable({ data, isLoading }: Props) {
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
        Veri bulunamadı.
      </div>
    )
  }

  return (
    <Table>
      <thead>
        <TableRow>
          <TableHead>Öğrenci</TableHead>
          <TableHead>Öğretmen</TableHead>
          <TableHead>Sınıf</TableHead>
          <TableHead>Hedef Sınav</TableHead>
          <TableHead className="text-right">İlerleme</TableHead>
          <TableHead>Son Giriş</TableHead>
          <TableHead>Şifre Değiştir</TableHead>
        </TableRow>
      </thead>
      <tbody>
        {data.map((row) => (
          <TableRow key={row.student_profile_id}>
            <TableCell className="font-medium">{row.student_name}</TableCell>
            <TableCell>{row.teacher_name ?? "—"}</TableCell>
            <TableCell>{row.grade_label ?? "—"}</TableCell>
            <TableCell>{row.target_exam_label ?? "—"}</TableCell>
            <TableCell className="text-right">
              {row.progress_percent != null
                ? `${new Intl.NumberFormat("tr-TR").format(row.progress_percent)}%`
                : "—"}
            </TableCell>
            <TableCell>{formatDate(row.last_login_at)}</TableCell>
            <TableCell>
              {row.must_change_password ? (
                <span className="text-amber-600 dark:text-amber-400">Evet</span>
              ) : (
                "Hayır"
              )}
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  )
}
