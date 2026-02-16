// src/features/teacher/students/components/students-table.tsx
import { useNavigate } from "react-router-dom"
import { Button } from "@shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@shared/ui/dropdown"
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
} from "@shared/ui/table"
import { cn } from "@shared/utils/cn"
import { MoreHorizontal, User } from "lucide-react"
import { toast } from "sonner"
import type { Student } from "../types"
import { formatDateTR, getInitials, fullName } from "../utils"

export type StudentsTableProps = {
  students: Student[]
}

export function StudentsTable({ students }: StudentsTableProps) {
  const navigate = useNavigate()

  const handleViewProfile = (s: Student) => {
    navigate(`/teacher/students/${s.id}`)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Sınıf</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </thead>
          <tbody>
            {students.map((s) => (
              <TableRow key={s.id} className="transition-colors hover:bg-muted/50">
                <TableCell className="py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {getInitials(s)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-foreground">{fullName(s)}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.email}</TableCell>
                <TableCell className="text-muted-foreground">{s.phone}</TableCell>
                <TableCell className="text-muted-foreground">{s.grade}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      s.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.status === "ACTIVE" ? "Aktif" : "Pasif"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.createdAt ? formatDateTR(s.createdAt) : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label="İşlemler"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[180px]">
                      <DropdownMenuItem onClick={() => handleViewProfile(s)}>
                        <User className="h-4 w-4" />
                        Profili Gör
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Yakında")}>
                        Mesaj Gönder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
