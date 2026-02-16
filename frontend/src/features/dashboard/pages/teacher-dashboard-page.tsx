// src/features/dashboard/pages/teacher-dashboard-page.tsx
import { TeacherPlanStatusCard } from "@features/billing/components/teacher-plan-status-card"

export function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Öğretmen Paneli</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Koçluk sisteminize hoş geldiniz.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TeacherPlanStatusCard />
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            <p className="text-lg">Hoş geldin.</p>
            <p className="mt-2 text-sm">Bu sayfa geliştirme aşamasında.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
