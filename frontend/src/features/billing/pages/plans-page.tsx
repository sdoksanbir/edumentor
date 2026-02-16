// src/features/billing/pages/plans-page.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Switch } from "@shared/ui/switch"
import { CrudModal } from "@features/admin/components/crud-modal"
import {
  listPlans,
  createPlan,
  updatePlan,
  billingKeys,
  type PlanApi,
} from "../api/billingApi"
import { Plus, Pencil, Loader2 } from "lucide-react"
import { confirmDelete } from "@shared/lib/swal"
import {
  getCreateSuccessMessage,
  getUpdateSuccessMessage,
  getToggleSuccessMessage,
  getErrorMessage,
} from "@shared/lib/toast-messages"

function formatTry(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(n)
}

export function PlansPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PlanApi | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [studentLimit, setStudentLimit] = useState(10)
  const [priceMonthly, setPriceMonthly] = useState("0")
  const [priceYearly, setPriceYearly] = useState("0")
  const [currency, setCurrency] = useState("TRY")
  const [trialDays, setTrialDays] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [filterActive, setFilterActive] = useState<string>("")

  const { data: plans = [], isLoading } = useQuery({
    queryKey: billingKeys.plans({ is_active: filterActive }),
    queryFn: () => listPlans({ is_active: filterActive }),
  })

  const createMut = useMutation({
    mutationFn: createPlan,
    onSuccess: (data) => {
      toast.success(getCreateSuccessMessage("plan", data.name))
      qc.invalidateQueries({ queryKey: billingKeys.all })
      closeModal()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updatePlan>[1] }) =>
      updatePlan(id, data),
    onSuccess: (data) => {
      toast.success(getUpdateSuccessMessage("plan", data.name))
      qc.invalidateQueries({ queryKey: billingKeys.all })
      closeModal()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: number) => updatePlan(id, { is_active: false }),
    onSuccess: (data) => {
      toast.success(getToggleSuccessMessage("plan", data.name, false))
      qc.invalidateQueries({ queryKey: billingKeys.all })
      closeModal()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setCode("")
    setName("")
    setStudentLimit(10)
    setPriceMonthly("0")
    setPriceYearly("0")
    setCurrency("TRY")
    setTrialDays(0)
    setIsActive(true)
  }

  const openCreate = () => {
    setEditing(null)
    setCode("")
    setName("")
    setStudentLimit(10)
    setPriceMonthly("299")
    setPriceYearly("2990")
    setCurrency("TRY")
    setTrialDays(0)
    setIsActive(true)
    setModalOpen(true)
  }

  const openEdit = (p: PlanApi) => {
    setEditing(p)
    setCode(p.code)
    setName(p.name)
    setStudentLimit(p.student_limit)
    setPriceMonthly(p.price_monthly)
    setPriceYearly(p.price_yearly)
    setCurrency(p.currency)
    setTrialDays(p.trial_days ?? 0)
    setIsActive(p.is_active)
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pm = parseFloat(priceMonthly) || 0
    const py = parseFloat(priceYearly) || 0
    if (pm < 0 || py < 0) {
      toast.error("Fiyatlar 0'dan küçük olamaz.")
      return
    }
    if (studentLimit < 1) {
      toast.error("Öğrenci limiti en az 1 olmalıdır.")
      return
    }
    const td = trialDays
    if (td < 0 || td > 365) {
      toast.error("Deneme süresi 0-365 gün arasında olmalıdır.")
      return
    }
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        data: {
          code,
          name,
          student_limit: studentLimit,
          price_monthly: pm,
          price_yearly: py,
          currency: currency,
          is_active: isActive,
          trial_days: td,
        },
      })
    } else {
      createMut.mutate({
        code,
        name,
        student_limit: studentLimit,
        price_monthly: pm,
        price_yearly: py,
        currency: currency,
        is_active: isActive,
        trial_days: td,
      })
    }
  }

  const handleDeactivate = async () => {
    if (!editing) return
    const { isConfirmed } = await confirmDelete(
      `"${editing.name}" planı pasif duruma alınsın mı?`,
      "Plan silinmez, sadece is_active=false yapılır."
    )
    if (isConfirmed) deactivateMut.mutate(editing.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan Yönetimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Abonelik planlarını oluşturun ve düzenleyin.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Plan
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterActive === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterActive("")}
        >
          Tümü
        </Button>
        <Button
          variant={filterActive === "true" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterActive("true")}
        >
          Aktif
        </Button>
        <Button
          variant={filterActive === "false" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterActive("false")}
        >
          Pasif
        </Button>
      </div>

      <Card className="rounded-xl border-border shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <CardHeader>
          <CardTitle>Planlar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Henüz plan yok. Yeni plan ekleyin.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium">Ad</th>
                    <th className="pb-3 text-left font-medium">Kod</th>
                    <th className="pb-3 text-right font-medium">Öğrenci Kotası</th>
                    <th className="pb-3 text-right font-medium">Aylık</th>
                    <th className="pb-3 text-right font-medium">Yıllık</th>
                    <th className="pb-3 text-center font-medium">Deneme</th>
                    <th className="pb-3 text-left font-medium">Tasarruf</th>
                    <th className="pb-3 text-center font-medium">Durum</th>
                    <th className="pb-3 text-right font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{p.code}</td>
                      <td className="py-3 text-right">{p.student_limit}</td>
                      <td className="py-3 text-right">{formatTry(p.price_monthly)}</td>
                      <td className="py-3 text-right">{formatTry(p.price_yearly)}</td>
                      <td className="py-3 text-center">
                        {p.trial_days && p.trial_days > 0 ? (
                          <span className="text-sm">{p.trial_days} gün</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        {parseFloat(p.yearly_savings ?? "0") > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Yıllık tasarruf: {formatTry(p.yearly_savings)} (%{p.yearly_discount_percent ?? "0"})
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.is_active
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-500/20 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {p.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
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
        <CrudModal open={modalOpen} title={editing ? "Plan Düzenle" : "Yeni Plan"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Kod *</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="STARTER_10"
                required
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ad *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Starter"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Öğrenci Kotası *</label>
              <Input
                type="number"
                min={1}
                value={studentLimit}
                onChange={(e) => setStudentLimit(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Yıllık ücret daha uygun olabilir. Yıllık fiyat genellikle aylık x 12&#39;den daha düşüktür.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Aylık Fiyat (₺/ay)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Yıllık Fiyat (₺/yıl)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Para Birimi</label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="TRY"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Deneme Süresi (gün)</label>
              <Input
                type="number"
                min={0}
                max={365}
                value={trialDays}
                onChange={(e) => setTrialDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                0 girerseniz deneme uygulanmaz.
              </p>
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm">Aktif</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              {editing && editing.is_active && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeactivate}
                  disabled={deactivateMut.isPending}
                >
                  Pasif Yap
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={closeModal}>
                İptal
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
              >
                {(createMut.isPending || updateMut.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </form>
        </CrudModal>
      )}
    </div>
  )
}
