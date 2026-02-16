import { Table, TableHead, TableRow, TableCell } from "@shared/ui/table"
import { Badge } from "@shared/ui/badge"
import type { InactiveStudentItem } from "../../types"

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
  data: InactiveStudentItem[]
  isLoading?: boolean
  page: number
  total: number
  pageSize: number
  onPageChange?: (page: number) => void
}

export function InactiveStudentsTable({
  data,
  isLoading,
  page,
  total,
  pageSize,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(total / pageSize) || 1

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
        Pasif öğrenci bulunamadı.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <thead>
          <TableRow>
            <TableHead>Öğrenci</TableHead>
            <TableHead>Öğretmen</TableHead>
            <TableHead>Son Giriş</TableHead>
            <TableHead className="text-right">Kaç Gündür Pasif</TableHead>
            <TableHead>Şifre Değiştir</TableHead>
          </TableRow>
        </thead>
        <tbody>
          {data.map((row) => (
            <TableRow key={row.student_profile_id} className="hover:bg-muted/60 transition-colors">
              <TableCell className="font-medium">{row.student_name}</TableCell>
              <TableCell>{row.teacher_name ?? "—"}</TableCell>
              <TableCell>{formatDate(row.last_login_at)}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("tr-TR").format(row.days_inactive)} gün
              </TableCell>
              <TableCell>
                {row.must_change_password ? (
                  <Badge variant="fail">Evet</Badge>
                ) : (
                  <span className="text-muted-foreground">Hayır</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Toplam {new Intl.NumberFormat("tr-TR").format(total)} kayıt
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Önceki
            </button>
            <span className="flex items-center px-3 py-1 text-sm">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
