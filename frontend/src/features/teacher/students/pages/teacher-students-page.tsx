// src/features/teacher/students/pages/teacher-students-page.tsx
import { useMemo, useState, useEffect } from "react"
import { StudentsStats } from "../components/students-stats"
import { StudentsToolbar, type FilterState } from "../components/students-toolbar"
import { StudentsTable } from "../components/students-table"
import { StudentsSkeleton } from "../components/students-skeleton"
import { EmptyState } from "../components/empty-state"
import { StudentsPagination } from "../components/students-pagination"
import { fetchMyStudents } from "../api"
import { getErrorMessage } from "@shared/lib/toast-messages"
import { toast } from "sonner"
import type { Student } from "../types"

const DEFAULT_FILTERS: FilterState = {
  search: "",
  status: "all",
}

const DEFAULT_PAGE_SIZE = 10

function mapApiToStudent(api: {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  grade?: string
  status?: string
  created_at?: string
}): Student {
  return {
    id: api.id,
    firstName: api.first_name ?? "",
    lastName: api.last_name ?? "",
    email: api.email ?? "",
    phone: api.phone ?? "",
    grade: api.grade ?? "",
    status: (api.status === "PASSIVE" ? "PASSIVE" : "ACTIVE") as Student["status"],
    createdAt: api.created_at,
  }
}

export function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMyStudents({ search: filters.search || undefined })
      .then((data) => {
        if (!cancelled) setStudents(data.map(mapApiToStudent))
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [filters.search])

  const filteredStudents = useMemo(() => {
    if (filters.status === "all") return students
    return students.filter((s) => s.status === filters.status)
  }, [students, filters.status])

  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, page, pageSize])

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    const active = students.filter((s) => s.status === "ACTIVE").length
    const passive = students.filter((s) => s.status === "PASSIVE").length
    const joinedThisMonth = students.filter((s) => {
      if (!s.createdAt) return false
      const d = new Date(s.createdAt)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length
    return {
      total: students.length,
      active,
      passive,
      joinedThisMonth,
    }
  }, [students])

  const hasActiveFilters =
    filters.search.trim() !== "" || filters.status !== "all"

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  if (loading) return <StudentsSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Öğrencilerim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Öğrencilerini yönet, filtrele ve hızlı işlemler yap.
        </p>
      </div>

      <StudentsStats
        total={stats.total}
        active={stats.active}
        passive={stats.passive}
        joinedThisMonth={stats.joinedThisMonth}
        weeklyChange={0}
      />

      <StudentsToolbar
        filters={filters}
        onFiltersChange={(f) => {
          setFilters(f)
          setPage(1)
        }}
      />

      {filteredStudents.length === 0 ? (
        <EmptyState
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <>
          <StudentsTable students={pagedStudents} />
          <StudentsPagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredStudents.length}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  )
}
