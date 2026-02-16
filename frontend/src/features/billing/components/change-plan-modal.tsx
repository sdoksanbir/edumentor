// src/features/billing/components/change-plan-modal.tsx
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CrudModal } from "@features/admin/components/crud-modal"
import { Button } from "@shared/ui/button"
import { Select } from "@shared/ui/select"
import { Checkbox } from "@shared/ui/checkbox"
import { Loader2, AlertTriangle } from "lucide-react"
import { changeSubscriptionPlan, listPlans, billingKeys } from "../api/billingApi"
import { confirmAction, limitTooLowAlert } from "@shared/lib/swal"
import { getLimitTooLowError, getErrorMessage } from "@shared/lib/toast-messages"

function formatTry(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(n)
}

type SubscriptionForChangePlan = {
  id: number
  plan: {
    id: number
    name: string
    student_limit: number
    price_monthly?: string
    price_yearly?: string
    yearly_savings?: string
    yearly_discount_percent?: string
  }
  billing_period?: "MONTHLY" | "YEARLY"
  assigned_students_count: number
}

type ChangePlanModalProps = {
  open: boolean
  onClose: () => void
  subscription: SubscriptionForChangePlan | null
  onSuccess?: (updated: unknown) => void
}

export function ChangePlanModal({
  open,
  onClose,
  subscription,
  onSuccess,
}: ChangePlanModalProps) {
  const qc = useQueryClient()
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"MONTHLY" | "YEARLY">("MONTHLY")
  const [keepPeriod, setKeepPeriod] = useState(true)

  const { data: plans = [] } = useQuery({
    queryKey: billingKeys.plans({ is_active: "true" }),
    queryFn: () => listPlans({ is_active: "true" }),
    enabled: open,
  })

  useEffect(() => {
    if (subscription) {
      setSelectedPlanId(subscription.plan.id)
      setBillingPeriod(subscription.billing_period ?? "MONTHLY")
    }
  }, [subscription?.id, subscription?.billing_period])

  const changeMut = useMutation({
    mutationFn: (vars: {
      id: number
      planId: number
      billingPeriod: "MONTHLY" | "YEARLY"
      keepPeriod: boolean
    }) =>
      changeSubscriptionPlan(vars.id, {
        plan_id: vars.planId,
        billing_period: vars.billingPeriod,
        effective: "IMMEDIATE",
        keep_period: vars.keepPeriod,
      }),
    onSuccess: (data) => {
      toast.success("Plan güncellendi.")
      qc.invalidateQueries({ queryKey: billingKeys.all })
      onSuccess?.(data)
      onClose()
    },
    onError: (e) => {
      const limitErr = getLimitTooLowError(e)
      if (limitErr.isLimitTooLow) {
        limitTooLowAlert({
          current: limitErr.current ?? 0,
          limit: limitErr.limit ?? 0,
        })
      } else {
        toast.error(getErrorMessage(e))
      }
    },
  })

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const currentStudents = subscription?.assigned_students_count ?? 0
  const newLimit = selectedPlan?.student_limit ?? 0
  const isDowngradeBlocked = currentStudents > newLimit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscription || !selectedPlanId) return
    if (isDowngradeBlocked) {
      limitTooLowAlert({ current: currentStudents, limit: newLimit })
      return
    }
    const { isConfirmed } = await confirmAction(
      "Plan değiştirilsin mi?",
      "Bu işlem öğretmenin kotasını ve abonelik planını günceller."
    )
    if (!isConfirmed) return
    changeMut.mutate({
      id: subscription.id,
      planId: selectedPlanId,
      billingPeriod,
      keepPeriod,
    })
  }

  if (!subscription) return null

  return (
    <CrudModal open={open} title="Planı Değiştir" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Mevcut plan</p>
          <p className="font-medium">
            {subscription.plan.name} ({subscription.plan.student_limit} öğrenci)
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Yeni plan *</label>
          <Select
            value={selectedPlanId ? String(selectedPlanId) : ""}
            onChange={(e) =>
              setSelectedPlanId(e.target.value ? parseInt(e.target.value, 10) : null)
            }
            className="w-full"
          >
            <option value="">Plan seçin</option>
            {plans.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name} ({p.student_limit} öğrenci)
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Periyot</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={billingPeriod === "MONTHLY" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingPeriod("MONTHLY")}
            >
              Aylık
            </Button>
            <Button
              type="button"
              variant={billingPeriod === "YEARLY" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingPeriod("YEARLY")}
            >
              Yıllık
              {selectedPlanId && (() => {
                const p = plans.find((x) => x.id === selectedPlanId)
                if (!p || parseFloat(p.yearly_savings ?? "0") <= 0) return null
                return (
                  <span className="ml-1 rounded bg-emerald-500/30 px-1.5 py-0.5 text-xs">
                    Daha avantajlı
                  </span>
                )
              })()}
            </Button>
          </div>
          {selectedPlanId && (
            <p className="mt-2 text-sm text-muted-foreground">
              {billingPeriod === "MONTHLY"
                ? (() => {
                    const p = plans.find((x) => x.id === selectedPlanId)
                    return p ? `${formatTry(p.price_monthly)} / ay` : ""
                  })()
                : (() => {
                    const p = plans.find((x) => x.id === selectedPlanId)
                    if (!p) return ""
                    const savings = parseFloat(p.yearly_savings ?? "0")
                    return savings > 0
                      ? `${formatTry(p.price_yearly)} / yıl — Tasarruf ${formatTry(p.yearly_savings)} (%${p.yearly_discount_percent ?? "0"})`
                      : `${formatTry(p.price_yearly)} / yıl`
                  })()}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Mevcut öğrenci:</span>{" "}
            <strong>{currentStudents}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Yeni limit:</span>{" "}
            <strong>{newLimit}</strong>
          </p>
          {isDowngradeBlocked && (
            <div className="mt-2 flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">Uygulanamaz. Önce öğrenci sayısını azaltın.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="keep-period"
            checked={keepPeriod}
            onCheckedChange={(v) => setKeepPeriod(!!v)}
          />
          <label htmlFor="keep-period" className="text-sm cursor-pointer">
            Dönem bitişini koru
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="submit"
            disabled={changeMut.isPending || isDowngradeBlocked || !selectedPlanId}
          >
            {changeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Uygula
          </Button>
        </div>
      </form>
    </CrudModal>
  )
}
