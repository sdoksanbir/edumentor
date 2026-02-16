// src/features/dashboard/components/StatCards.tsx
import {
  Users,
  GraduationCap,
  UserCheck,
  Percent,
  UserPlus,
  KeyRound,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@shared/ui/card"

const iconVariants = {
  blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  purple: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  emerald:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  orange:
    "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  rose: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
}

type MetricsKey =
  | "total_users"
  | "active_teachers"
  | "active_students"
  | "assigned_student_ratio"
  | "new_users_last_7_days"
  | "must_change_password_count"

const cardsConfig: {
  key: MetricsKey
  label: string
  icon: React.ElementType
  variant: keyof typeof iconVariants
  format: (v: number) => string
}[] = [
  {
    key: "total_users",
    label: "Toplam Kullanıcı",
    icon: Users,
    variant: "blue",
    format: (v) => new Intl.NumberFormat("tr-TR").format(v),
  },
  {
    key: "active_teachers",
    label: "Aktif Öğretmen",
    icon: GraduationCap,
    variant: "purple",
    format: (v) => new Intl.NumberFormat("tr-TR").format(v),
  },
  {
    key: "active_students",
    label: "Aktif Öğrenci",
    icon: UserCheck,
    variant: "emerald",
    format: (v) => new Intl.NumberFormat("tr-TR").format(v),
  },
  {
    key: "assigned_student_ratio",
    label: "Atanmış Öğrenci Oranı",
    icon: Percent,
    variant: "orange",
    format: (v) => `${v}%`,
  },
  {
    key: "new_users_last_7_days",
    label: "Son 7 Gün Kayıt",
    icon: UserPlus,
    variant: "amber",
    format: (v) => new Intl.NumberFormat("tr-TR").format(v),
  },
  {
    key: "must_change_password_count",
    label: "Şifre Değiştirmeli",
    icon: KeyRound,
    variant: "rose",
    format: (v) => new Intl.NumberFormat("tr-TR").format(v),
  },
]

export function StatCards({
  data,
  isLoading,
}: {
  data: import("../api/adminAnalytics").DashboardAnalytics | undefined
  isLoading: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cardsConfig.map(({ key, label, icon: Icon, variant, format }) => {
        const value = data ? data[key] : 0
        const displayValue = typeof value === "number" ? format(value) : "—"

        return (
          <Card
            key={key}
            className="overflow-hidden transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
                <div
                  className={`rounded-lg p-2 border ${iconVariants[variant]}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-semibold tracking-tight">
                  {displayValue}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
