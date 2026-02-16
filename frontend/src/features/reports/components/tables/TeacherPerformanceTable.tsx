import { Table, TableHead, TableRow, TableCell } from "@shared/ui/table"
import type { TeacherPerformanceItem } from "../../types"

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
  data: TeacherPerformanceItem[]
  isLoading?: boolean
}

export function TeacherPerformanceTable({ data, isLoading }: Props) {
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
          <TableHead>Öğretmen</TableHead>
          <TableHead>Branş</TableHead>
          <TableHead className="text-right">Öğrenci</TableHead>
          <TableHead className="text-right">Şifre Değiştir</TableHead>
          <TableHead className="text-right">Giriş Sayısı</TableHead>
          <TableHead>Son Giriş</TableHead>
        </TableRow>
      </thead>
      <tbody>
        {data.map((row) => (
          <TableRow key={row.teacher_profile_id}>
            <TableCell className="font-medium">{row.teacher_name}</TableCell>
            <TableCell>{row.branch_label ?? "—"}</TableCell>
            <TableCell className="text-right">
              {new Intl.NumberFormat("tr-TR").format(row.students_count)}
            </TableCell>
            <TableCell className="text-right">
              {new Intl.NumberFormat("tr-TR").format(row.must_change_password_count)}
            </TableCell>
            <TableCell className="text-right">
              {new Intl.NumberFormat("tr-TR").format(row.logins_count)}
            </TableCell>
            <TableCell>{formatDate(row.last_login_at)}</TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  )
}
