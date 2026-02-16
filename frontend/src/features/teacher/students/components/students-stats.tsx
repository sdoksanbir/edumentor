// src/features/teacher/students/components/students-stats.tsx
import { Card, CardContent } from "@shared/ui/card"
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
} from "lucide-react"

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: number
  hint?: string
  badge?: string
}

function StatCard({ icon, label, value, hint, badge }: StatCardProps) {
  return (
    <Card className="rounded-xl border-border shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          {badge && (
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}

export type StudentsStatsProps = {
  total: number
  active: number
  passive: number
  joinedThisMonth: number
  weeklyChange?: number
}

export function StudentsStats({
  total,
  active,
  passive,
  joinedThisMonth,
  weeklyChange = 3,
}: StudentsStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Toplam Öğrenci"
        value={total}
        hint="Tüm kayıtlı öğrenciler"
        badge={weeklyChange > 0 ? `+${weeklyChange} bu hafta` : undefined}
      />
      <StatCard
        icon={<UserCheck className="h-5 w-5" />}
        label="Aktif Öğrenci"
        value={active}
        hint="Aktif durumda olanlar"
      />
      <StatCard
        icon={<UserX className="h-5 w-5" />}
        label="Pasif Öğrenci"
        value={passive}
        hint="Pasif durumda olanlar"
      />
      <StatCard
        icon={<UserPlus className="h-5 w-5" />}
        label="Bu Ay Katılanlar"
        value={joinedThisMonth}
        hint="Bu ay kayıt olanlar"
      />
    </div>
  )
}
