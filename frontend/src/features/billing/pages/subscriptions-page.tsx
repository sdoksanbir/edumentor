// src/features/billing/pages/subscriptions-page.tsx
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { CrudModal } from "@features/admin/components/crud-modal"
import { Checkbox } from "@shared/ui/checkbox"
import {
  listPlans,
  listSubscriptions,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription,
  reactivateSubscription,
  billingKeys,
  type SubscriptionApi,
} from "../api/billingApi"
import { ChangePlanModal } from "../components/change-plan-modal"
import { listUsers, type PanelUser } from "@features/admin/api/users-api"
import { isTeacher } from "@shared/lib/role-normalizer"
import { Plus, Loader2, Calendar, RefreshCw, XCircle, RotateCcw, Package } from "lucide-react"
import { confirmAction, limitTooLowAlert } from "@shared/lib/swal"
import {
  getCreateSuccessMessage,
  getErrorMessage,
  getLimitTooLowError,
} from "@shared/lib/toast-messages"

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

function teacherName(sub: SubscriptionApi): string {
  const t = sub.teacher
  return [t.first_name, t.last_name].filter(Boolean).join(" ") || t.email
}

export function SubscriptionsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [applyTrial, setApplyTrial] = useState(false)
  const [trialDaysInput, setTrialDaysInput] = useState<string>("0")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterExpiring, setFilterExpiring] = useState("")
  const [filterBillingPeriod, setFilterBillingPeriod] = useState("")
  const [billingPeriod, setBillingPeriod] = useState<"MONTHLY" | "YEARLY">("MONTHLY")
  const [detailSub, setDetailSub] = useState<SubscriptionApi | null>(null)
  const [extendDays, setExtendDays] = useState("30")
  const [reactivateDays, setReactivateDays] = useState("30")
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false)

  const { data: plans = [] } = useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => listPlans(),
  })

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: billingKeys.subscriptions({
      status: filterStatus,
      expiring_soon: filterExpiring,
      billing_period: filterBillingPeriod,
    }),
    queryFn: () =>
      listSubscriptions({
        status: filterStatus || undefined,
        expiring_soon: filterExpiring || undefined,
        billing_period: filterBillingPeriod || undefined,
      }),
  })

  const { data: usersRes } = useQuery({
    queryKey: ["panel", "users", "TEACHER", teacherSearch],
    queryFn: () =>
      listUsers({ role: "TEACHER", search: teacherSearch || undefined, page_size: 50 }),
    enabled: modalOpen,
  })

  const teachers: PanelUser[] = (usersRes?.results ?? []).filter(
    (u) => isTeacher(u) && u.teacher_profile_id != null
  )

  useEffect(() => {
    if (selectedPlanId) {
      const plan = plans.find((p) => p.id === selectedPlanId)
      const days = plan?.trial_days ?? 0
      setTrialDaysInput(String(days))
      setApplyTrial(days > 0)
    } else {
      setTrialDaysInput("0")
      setApplyTrial(false)
    }
  }, [selectedPlanId, plans])

  const createMut = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      toast.success(getCreateSuccessMessage("abonelik", "Öğretmene atandı"))
      qc.invalidateQueries({ queryKey: billingKeys.all })
      closeModal()
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

  const cancelMut = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (data) => {
      toast.success("Abonelik iptal edildi.")
      qc.invalidateQueries({ queryKey: billingKeys.all })
      setDetailSub((prev) => (prev ? { ...prev, ...data } : null))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const reactivateMut = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      reactivateSubscription(id, days),
    onSuccess: (data) => {
      toast.success("Abonelik yeniden aktifleştirildi.")
      qc.invalidateQueries({ queryKey: billingKeys.all })
      setDetailSub((prev) => (prev ? { ...prev, ...data } : null))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const renewMut = useMutation({
    mutationFn: renewSubscription,
    onSuccess: (data) => {
      toast.success("Abonelik 30 gün uzatıldı.")
      qc.invalidateQueries({ queryKey: billingKeys.all })
      setDetailSub((prev) => (prev ? { ...prev, ...data } : null))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const extendMut = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      updateSubscription(id, { extend_days: days }),
    onSuccess: (data) => {
      toast.success("Abonelik süresi uzatıldı.")
      qc.invalidateQueries({ queryKey: billingKeys.all })
      setDetailSub((prev) => (prev ? { ...prev, ...data } : null))
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

  const undoCancelAtPeriodEndMut = useMutation({
    mutationFn: (id: number) =>
      updateSubscription(id, { cancel_at_period_end: false }),
    onSuccess: (data) => {
      toast.success("Dönem sonu iptali geri alındı.")
      qc.invalidateQueries({ queryKey: billingKeys.all })
      setDetailSub((prev) => (prev ? { ...prev, ...data } : null))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const cancelAtPeriodEndMut = useMutation({
    mutationFn: (id: number) =>
      updateSubscription(id, { cancel_at_period_end: true }),
    onSuccess: (data) => {
      toast.success("Abonelik dönem sonunda iptal edilecek.")
      qc.invalidateQueries({ queryKey: billingKeys.all })
      setDetailSub((prev) => (prev ? { ...prev, ...data } : null))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const closeModal = () => {
    setModalOpen(false)
    setSelectedTeacherId(null)
    setSelectedPlanId(null)
    setApplyTrial(false)
    setTrialDaysInput("0")
    setTeacherSearch("")
    setBillingPeriod("MONTHLY")
  }

  const openChangePlanModal = () => {
    setChangePlanModalOpen(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacherId || !selectedPlanId) {
      toast.error("Öğretmen ve plan seçiniz.")
      return
    }
    const payload: Parameters<typeof createSubscription>[0] = {
      teacher_profile_id: selectedTeacherId,
      plan_id: selectedPlanId,
      billing_period: billingPeriod,
      start_now: true,
    }
    if (applyTrial) {
      const days = Math.min(365, Math.max(0, parseInt(trialDaysInput, 10) || 0))
      payload.trial_days = days
    }
    createMut.mutate(payload)
  }

  const handleCancelImmediate = async () => {
    if (!detailSub) return
    const { isConfirmed } = await confirmAction(
      "Aboneliği hemen iptal etmek istediğinize emin misiniz?",
      "Bu işlem anında uygulanır."
    )
    if (isConfirmed) cancelMut.mutate(detailSub.id)
  }

  const handleCancelAtPeriodEnd = () => {
    if (!detailSub) return
    cancelAtPeriodEndMut.mutate(detailSub.id)
  }

  const handleRenew = () => {
    if (!detailSub) return
    renewMut.mutate(detailSub.id)
  }

  const handleExtend = () => {
    if (!detailSub) return
    const days = parseInt(extendDays, 10) || 30
    extendMut.mutate({ id: detailSub.id, days })
  }

  const handleReactivate = () => {
    if (!detailSub) return
    const days = parseInt(reactivateDays, 10) || 30
    reactivateMut.mutate({ id: detailSub.id, days })
  }

  const handleUndoCancelAtPeriodEnd = () => {
    if (!detailSub) return
    undoCancelAtPeriodEndMut.mutate(detailSub.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abonelikler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Öğretmenlere abonelik atayın ve yönetin.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedTeacherId(null)
            setSelectedPlanId(null)
            setModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Abonelik Ata
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        <Select
          value={filterExpiring}
          onChange={(e) => setFilterExpiring(e.target.value)}
          className="w-48"
        >
          <option value="">Süre Filtresi</option>
          <option value="7">7 gün içinde dolacak</option>
          <option value="14">14 gün içinde dolacak</option>
          <option value="30">30 gün içinde dolacak</option>
        </Select>
        <Select
          value={filterBillingPeriod}
          onChange={(e) => setFilterBillingPeriod(e.target.value)}
          className="w-40"
        >
          <option value="">Tüm Periyotlar</option>
          <option value="MONTHLY">Aylık</option>
          <option value="YEARLY">Yıllık</option>
        </Select>
      </div>

      <Card className="rounded-xl border-border shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <CardHeader>
          <CardTitle>Abonelik Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Abonelik bulunamadı.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium">Öğretmen</th>
                    <th className="pb-3 text-left font-medium">Plan</th>
                    <th className="pb-3 text-center font-medium">Periyot</th>
                    <th className="pb-3 text-right font-medium">Ücret</th>
                    <th className="pb-3 text-center font-medium">Durum</th>
                    <th className="pb-3 text-right font-medium">Yenileme</th>
                    <th className="pb-3 text-right font-medium">Kullanılan</th>
                    <th className="pb-3 text-right font-medium">Kalan</th>
                    <th className="pb-3 text-right font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-border/50">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{teacherName(sub)}</p>
                          <p className="text-xs text-muted-foreground">{sub.teacher.email}</p>
                        </div>
                      </td>
                      <td className="py-3">{sub.plan.name}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            sub.billing_period === "YEARLY"
                              ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                              : "bg-slate-500/20 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {sub.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {sub.amount ? formatTry(sub.amount) : "—"}{" "}
                        {sub.billing_period === "YEARLY" ? "/ yıl" : "/ ay"}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[sub.status] ?? "bg-gray-500/20"
                          }`}
                        >
                          {STATUS_LABELS[sub.status] ?? sub.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">{formatDate(sub.current_period_end)}</td>
                      <td className="py-3 text-right">{sub.assigned_students_count}</td>
                      <td className="py-3 text-right">{sub.remaining_slots}</td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailSub(sub)}
                        >
                          Detay
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <CrudModal
          open={modalOpen}
          title="Yeni Abonelik Ata"
          onClose={closeModal}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Öğretmen *</label>
              <Input
                placeholder="Öğretmen ara..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="mb-2"
              />
              <Select
                value={selectedTeacherId ? String(selectedTeacherId) : ""}
                onChange={(e) =>
                  setSelectedTeacherId(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="w-full"
                disabled={false}
              >
                <option value="">Öğretmen seçin</option>
                {teachers.map((u) => (
                  <option
                    key={u.id}
                    value={String(u.teacher_profile_id!)}
                  >
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email} (
                    {u.email})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Plan *</label>
              <Select
                value={selectedPlanId ? String(selectedPlanId) : ""}
                onChange={(e) =>
                  setSelectedPlanId(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="w-full"
              >
                <option value="">Plan seçin</option>
                {plans.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name} ({p.student_limit} öğrenci)
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Periyot *</label>
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
            <div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="apply-trial"
                  checked={applyTrial}
                  onCheckedChange={(v) => setApplyTrial(!!v)}
                />
                <label htmlFor="apply-trial" className="text-sm font-medium cursor-pointer">
                  Deneme uygula
                </label>
              </div>
              {applyTrial && (
                <div className="mt-2">
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    placeholder="Deneme (gün)"
                    value={trialDaysInput}
                    onChange={(e) => setTrialDaysInput(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={closeModal}>
                İptal
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </div>
          </form>
        </CrudModal>
      )}

      {detailSub && (
        <CrudModal
          open={!!detailSub}
          title={`Abonelik: ${teacherName(detailSub)}`}
          onClose={() => setDetailSub(null)}
        >
          <div className="space-y-4">
            <p>
              <span className="text-muted-foreground">Plan:</span> {detailSub.plan.name}
            </p>
            <p>
              <span className="text-muted-foreground">Periyot:</span>{" "}
              {detailSub.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}
              {detailSub.billing_period === "YEARLY" &&
                parseFloat(detailSub.plan.yearly_savings ?? "0") > 0 && (
                  <span className="ml-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Tasarruf: {formatTry(detailSub.plan.yearly_savings!)}
                  </span>
                )}
            </p>
            <p>
              <span className="text-muted-foreground">Ücret:</span>{" "}
              {detailSub.amount ? formatTry(detailSub.amount) : "—"}{" "}
              {detailSub.billing_period === "YEARLY" ? "/ yıl" : "/ ay"}
            </p>
            <p>
              <span className="text-muted-foreground">Durum:</span>{" "}
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[detailSub.status] ?? ""
                }`}
              >
                {STATUS_LABELS[detailSub.status]}
              </span>
              {detailSub.cancel_at_period_end &&
                (detailSub.status === "ACTIVE" || detailSub.status === "TRIALING") && (
                <span className="ml-2 inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Dönem Sonunda İptal
                </span>
              )}
            </p>
            {detailSub.status === "TRIALING" && detailSub.trial_end && (
              <p>
                <span className="text-muted-foreground">Deneme bitiş:</span>{" "}
                {formatDate(detailSub.trial_end)}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Yenileme:</span>{" "}
              {formatDate(detailSub.current_period_end)}
              {detailSub.period_days_remaining != null && detailSub.period_days_remaining > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({detailSub.period_days_remaining} gün kaldı)
                </span>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Kullanılan:</span>{" "}
              {detailSub.assigned_students_count} / {detailSub.student_limit_snapshot}
            </p>

            {/* ACTIVE/TRIALING: Uzat, Yenile, İptal Et; cancel_at_period_end ise İptali Geri Al */}
            {/* ACTIVE/TRIALING: Planı Değiştir, Uzat, Yenile, İptal */}
            {(detailSub.status === "ACTIVE" || detailSub.status === "TRIALING") && (
              <div className="space-y-2 border-t border-border pt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={openChangePlanModal}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Planı Değiştir
                </Button>
                {detailSub.cancel_at_period_end && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={handleUndoCancelAtPeriodEnd}
                    disabled={undoCancelAtPeriodEndMut.isPending}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    İptali Geri Al
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm">gün uzat</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleExtend}
                    disabled={extendMut.isPending}
                  >
                    <Calendar className="mr-1 h-4 w-4" />
                    Uzat
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRenew}
                    disabled={renewMut.isPending}
                  >
                    <RefreshCw className="mr-1 h-4 w-4" />
                    {detailSub.billing_period === "YEARLY" ? "1 Yıl Yenile" : "30 Gün Yenile"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCancelAtPeriodEnd}
                    disabled={cancelAtPeriodEndMut.isPending || detailSub.cancel_at_period_end}
                  >
                    Dönem Sonunda İptal
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancelImmediate}
                    disabled={cancelMut.isPending}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Hemen İptal Et
                  </Button>
                </div>
              </div>
            )}

            {/* CANCELED/EXPIRED: Reactivate, Planı Değiştir */}
            {(detailSub.status === "CANCELED" || detailSub.status === "EXPIRED") && (
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={reactivateDays}
                    onChange={(e) => setReactivateDays(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm">gün</span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleReactivate}
                    disabled={reactivateMut.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Yeniden Aktifleştir
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={openChangePlanModal}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Planı Değiştir
                </Button>
              </div>
            )}

            <ChangePlanModal
              open={changePlanModalOpen}
              onClose={() => setChangePlanModalOpen(false)}
              subscription={
                detailSub
                  ? {
                      id: detailSub.id,
                      plan: {
                        id: detailSub.plan.id,
                        name: detailSub.plan.name,
                        student_limit: detailSub.student_limit_snapshot,
                        price_monthly: detailSub.plan.price_monthly,
                        price_yearly: detailSub.plan.price_yearly,
                        yearly_savings: detailSub.plan.yearly_savings,
                        yearly_discount_percent: detailSub.plan.yearly_discount_percent,
                      },
                      billing_period: detailSub.billing_period,
                      assigned_students_count: detailSub.assigned_students_count,
                    }
                  : null
              }
              onSuccess={(data) => setDetailSub((prev) => (prev ? { ...prev, ...data } : null))}
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setDetailSub(null)
                navigate(`/panel/users/${detailSub.teacher.user_id}`)
              }}
            >
              Öğretmen Detayına Git
            </Button>
          </div>
        </CrudModal>
      )}
    </div>
  )
}
