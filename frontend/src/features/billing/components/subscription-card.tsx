// src/features/billing/components/subscription-card.tsx
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { CreditCard, Package, Loader2 } from "lucide-react"
import { Button } from "@shared/ui/button"
import { getTeacherSubscription, billingKeys } from "../api/billingApi"
import { ChangePlanModal } from "./change-plan-modal"

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

type SubscriptionCardProps = {
  teacherProfileId: number
}

export function SubscriptionCard({ teacherProfileId }: SubscriptionCardProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: billingKeys.teacherSubscription(teacherProfileId),
    queryFn: () => getTeacherSubscription(teacherProfileId),
    enabled: !!teacherProfileId,
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          Abonelik
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const sub = data?.subscription
  const limit = data?.limit ?? 0
  const used = data?.assigned_students_count ?? 0
  const remaining = data?.remaining_slots ?? 0

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        Abonelik
      </h3>
      {!sub ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Abonelik atanmamış.</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("/panel/billing/subscriptions")}
          >
            Abonelik Ata
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="font-medium">{sub.plan.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Periyot</span>
            <span>
              {sub.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}
              {sub.billing_period === "YEARLY" &&
                parseFloat(sub.plan.yearly_savings ?? "0") > 0 && (
                  <span className="ml-1.5 inline-flex rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Tasarruf
                  </span>
                )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Ücret</span>
            <span>
              {sub.amount ? formatTry(sub.amount) : "—"}{" "}
              {sub.billing_period === "YEARLY" ? "/ yıl" : "/ ay"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kota</span>
            <span>
              {used} / {limit} (Kalan: {remaining})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Durum</span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_COLORS[sub.status] ?? ""
              }`}
            >
              {STATUS_LABELS[sub.status] ?? sub.status}
            </span>
          </div>
          {sub.status === "TRIALING" && sub.trial_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Deneme bitiş</span>
              <span className="text-sm">{formatDate(sub.trial_end)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Yenileme</span>
            <span>
              {formatDate(sub.current_period_end)}
              {(data?.period_days_remaining ?? 0) > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({data?.period_days_remaining} gün kaldı)
                </span>
              )}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 w-full"
            onClick={() => setChangePlanOpen(true)}
          >
            <Package className="mr-2 h-4 w-4" />
            Planı Değiştir
          </Button>
        </div>
      )}

      {sub && (
        <ChangePlanModal
          open={changePlanOpen}
          onClose={() => setChangePlanOpen(false)}
          subscription={{
            id: sub.id,
            plan: {
              id: sub.plan.id,
              name: sub.plan.name,
              student_limit: limit,
              price_monthly: sub.plan.price_monthly,
              price_yearly: sub.plan.price_yearly,
              yearly_savings: sub.plan.yearly_savings,
              yearly_discount_percent: sub.plan.yearly_discount_percent,
            },
            billing_period: sub.billing_period,
            assigned_students_count: used,
          }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: billingKeys.teacherSubscription(teacherProfileId) })
          }}
        />
      )}
    </div>
  )
}
