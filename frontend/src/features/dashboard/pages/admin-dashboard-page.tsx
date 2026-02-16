// src/features/dashboard/pages/admin-dashboard-page.tsx
import { useQuery } from "@tanstack/react-query"
import { Button } from "@shared/ui/button"
import { RefreshCw } from "lucide-react"
import {
  fetchDashboardAnalytics,
  adminAnalyticsKeys,
} from "@features/dashboard/api/adminAnalytics"
import { StatCards } from "@features/dashboard/components/StatCards"
import { MonthlyNewUsersChart } from "@features/dashboard/components/charts/MonthlyNewUsersChart"
import { RoleDistributionChart } from "@features/dashboard/components/charts/RoleDistributionChart"
import { StudentsPerTeacherChart } from "@features/dashboard/components/charts/StudentsPerTeacherChart"
import { WeeklyActiveTrendChart } from "@features/dashboard/components/charts/WeeklyActiveTrendChart"

export function AdminDashboardPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: adminAnalyticsKeys.dashboard(),
    queryFn: fetchDashboardAnalytics,
    staleTime: 60_000, // 1 dakika
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kullanıcılar, roller ve sistem istatistikleri.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Yenile
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-destructive">
            Veriler yüklenirken bir hata oluştu.
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Tekrar Dene
          </Button>
        </div>
      )}

      <StatCards data={data} isLoading={isLoading} />

      {/* 1. satır: Monthly new users + Role distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyNewUsersChart
          data={data?.monthly_new_users ?? []}
          isLoading={isLoading}
        />
        <RoleDistributionChart
          data={data?.role_distribution ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* 2. satır: Students per teacher + Weekly active trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StudentsPerTeacherChart
          data={data?.students_per_teacher ?? []}
          isLoading={isLoading}
        />
        <WeeklyActiveTrendChart
          data={data?.weekly_active_trend ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
