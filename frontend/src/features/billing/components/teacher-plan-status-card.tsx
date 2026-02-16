// src/features/billing/components/teacher-plan-status-card.tsx
import { useQuery } from "@tanstack/react-query"
import { CreditCard, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import { getMySubscription, billingKeys } from "../api/billingApi"

const STATUS_LABELS: Record<string, string> = {
  TRIALING: "Deneme",
  ACTIVE: "Aktif",
  EXPIRED: "Süresi Dolmuş",
  CANCELED: "İptal",
}

const STATUS_COLORS: Record<string, string> = {
  TRIALING: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  ACTIVE: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  EXPIRED: "bg-gray-500/20 text-gray-500 dark:text-gray-400",
  CANCELED: "bg-red-500/20 text-red-600 dark:text-red-400",
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTry(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(n)
}

export function TeacherPlanStatusCard() {
  const { data, isLoading } = useQuery({
    queryKey: billingKeys.mySubscription(),
    queryFn: () => getMySubscription(),
  })

  if (isLoading) return null

  const sub = data?.subscription
  const isInactive =
    !sub || sub.status === "CANCELED" || sub.status === "EXPIRED"

  return (
    <Card className="rounded-xl border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Plan Durumu
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isInactive ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Paketiniz aktif değil
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {data?.message ??
                    "Yöneticinizle iletişime geçerek aboneliğinizi yenilemenizi önerebiliriz."}
                </p>
              </div>
            </div>
          </div>
        ) : sub ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{sub.plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Periyot</span>
              <span>
                {sub.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}
                {sub.billing_period === "YEARLY" &&
                  parseFloat(sub.plan.yearly_savings ?? "0") > 0 && (
                    <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Tasarruf
                    </span>
                  )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ücret</span>
              <span>
                {sub.amount ? formatTry(sub.amount) : "—"}{" "}
                {sub.billing_period === "YEARLY" ? "/ yıl" : "/ ay"}
              </span>
            </div>
            {sub.status === "TRIALING" && sub.trial_end && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deneme bitiş</span>
                <span>{formatDate(sub.trial_end)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum</span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[sub.status] ?? ""
                }`}
              >
                {STATUS_LABELS[sub.status]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kota</span>
              <span>
                {data?.assigned_students_count ?? 0} / {sub.student_limit_snapshot} (Kalan:{" "}
                {data?.remaining_slots ?? 0})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yenileme</span>
              <span>
                {formatDate(sub.current_period_end)}
                {(data?.period_days_remaining ?? 0) > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({data?.period_days_remaining} gün kaldı)
                  </span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aboneliğiniz bulunmuyor. Yöneticinizle iletişime geçin.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
