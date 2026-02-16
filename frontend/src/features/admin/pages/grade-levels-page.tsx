// src/features/admin/pages/grade-levels-page.tsx
import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import type { Column } from "@shared/ui/data-table"
import { Switch } from "@shared/ui/switch"
import { SortableCatalogTable } from "../components/sortable-catalog-table"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Select } from "@shared/ui/select"
import { CrudModal } from "../components/crud-modal"
import { Checkbox } from "@shared/ui/checkbox"
import {
  listGradeLevels,
  createGradeLevel,
  updateGradeLevel,
  deleteGradeLevel,
  reorderGradeLevels,
  bulkDeleteGradeLevels,
  catalogKeys,
  type GradeLevel,
} from "../api/admin-api"
import { Loader2, AlertCircle, Plus, Trash2 } from "lucide-react"
import { confirmDelete, confirmBulkDelete } from "@shared/lib/swal"
import {
  getCreateSuccessMessage,
  getUpdateSuccessMessage,
  getToggleSuccessMessage,
  getDeleteSuccessMessage,
  getBulkDeleteSuccessMessage,
  getBulkDeleteErrorMessage,
  getErrorMessage,
} from "@shared/lib/toast-messages"
import { trCapitalizeFirst } from "@shared/lib/strings"

const KIND_LABELS: Record<string, string> = {
  CLASS: "Sınıf",
  EXAM: "Sınav",
  OTHER: "Diğer",
}

const gradeLevelsListKey = (kind?: string) => catalogKeys.gradeLevels(kind || undefined)

export function GradeLevelsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GradeLevel | null>(null)
  const [name, setName] = useState("")
  const [kind, setKind] = useState<"CLASS" | "EXAM" | "OTHER">("CLASS")
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterKind, setFilterKind] = useState<string>("")
  const [reorderResetTrigger, setReorderResetTrigger] = useState(0)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const listKey = gradeLevelsListKey(filterKind || undefined)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filterKind])

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: listKey,
    queryFn: () =>
      listGradeLevels({
        kind: (filterKind as "CLASS" | "EXAM" | "OTHER") || undefined,
      }),
  })

  const toggleMut = useMutation({
    mutationFn: ({
      id,
      is_active,
    }: { id: number; is_active: boolean; name?: string }) =>
      updateGradeLevel(id, { is_active }),
    onMutate: async (vars) => {
      setTogglingId(vars.id)
      await qc.cancelQueries({ queryKey: listKey })
      const prev = qc.getQueryData<GradeLevel[]>(listKey)
      qc.setQueryData<GradeLevel[]>(listKey, (old) =>
        old ? old.map((r) => (r.id === vars.id ? { ...r, is_active: vars.is_active } : r)) : []
      )
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev)
      toast.error(getErrorMessage(err))
    },
    onSuccess: (_data, vars) => {
      if (vars.name != null) {
        toast.success(
          getToggleSuccessMessage("sınıf düzeyi", vars.name, vars.is_active)
        )
      }
    },
    onSettled: () => {
      setTogglingId(null)
      qc.invalidateQueries({ queryKey: catalogKeys.gradeLevels() })
    },
  })

  const columns: Column<GradeLevel>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Ad",
        align: "left",
        accessor: (r) => <span className="font-medium truncate">{r.name}</span>,
        sortValue: (r) => r.name,
        filterValue: (r) => r.name,
      },
      {
        key: "code",
        header: "Kod",
        align: "left",
        accessor: (r) => (
          <span className="text-muted-foreground font-mono text-xs truncate">{r.code}</span>
        ),
        sortValue: (r) => r.code,
        filterValue: (r) => r.code,
      },
      {
        key: "kind",
        header: "Tür",
        align: "center",
        accessor: (r) => (
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-xs ${
              r.kind === "CLASS"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : r.kind === "EXAM"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {KIND_LABELS[r.kind] ?? r.kind}
          </span>
        ),
        sortValue: (r) => r.kind,
      },
      {
        key: "is_active",
        header: "Durum",
        align: "center",
        accessor: (r) => (
          <Switch
            checked={r.is_active}
            disabled={toggleMut.isPending && togglingId === r.id}
            onCheckedChange={(checked) =>
                toggleMut.mutate({ id: r.id, is_active: checked, name: r.name })
              }
          />
        ),
        sortValue: (r) => (r.is_active ? 1 : 0),
      },
    ],
    [toggleMut.isPending, toggleMut.mutate, togglingId]
  )

  const createMut = useMutation({
    mutationFn: createGradeLevel,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.gradeLevels() })
      setModalOpen(false)
      resetForm()
      toast.success(getCreateSuccessMessage("sınıf düzeyi", data.name))
    },
    onError: (e) => {
      const msg = getErrorMessage(e)
      setModalOpen(false)
      resetForm()
      setError(msg)
      toast.error(msg)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Parameters<typeof updateGradeLevel>[1]
    }) => updateGradeLevel(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.gradeLevels() })
      setModalOpen(false)
      resetForm()
      toast.success(getUpdateSuccessMessage("sınıf düzeyi", data.name))
    },
    onError: (e) => {
      const msg = getErrorMessage(e)
      setModalOpen(false)
      resetForm()
      setError(msg)
      toast.error(msg)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteGradeLevel,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.gradeLevels() }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const reorderMut = useMutation({
    mutationFn: reorderGradeLevels,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.gradeLevels() }),
    onError: (e) => {
      setReorderResetTrigger((t) => t + 1)
      setReorderError(getErrorMessage(e))
    },
  })

  const bulkDeleteMut = useMutation({
    mutationFn: bulkDeleteGradeLevels,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: catalogKeys.gradeLevels() })
      setSelectedIds(new Set())
      toast.success(getBulkDeleteSuccessMessage("", res.deleted_count))
    },
    onError: () => {
      toast.error(getBulkDeleteErrorMessage())
    },
  })

  function resetForm() {
    setEditing(null)
    setName("")
    setKind("CLASS")
    setIsActive(true)
    setError(null)
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(row: GradeLevel) {
    setEditing(row)
    setName(row.name)
    setKind(row.kind)
    setIsActive(row.is_active)
    setModalOpen(true)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        data: { name, kind, is_active: isActive },
      })
    } else {
      createMut.mutate({ name, kind, is_active: isActive })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-8">
        <AlertCircle className="h-12 w-12 text-destructive/80" />
        <p className="text-center text-sm text-destructive">
          Veriler yüklenirken hata oluştu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sınıf Düzeyleri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sınıf seviyeleri ve sınav türleri (1. Sınıf, LGS, YKS, TYT vb.)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Sınıf Düzeyi Listesi</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} seçili
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={bulkDeleteMut.isPending}
                    onClick={async () => {
                      const result = await confirmBulkDelete(selectedIds.size)
                      if (!result.isConfirmed) return
                      bulkDeleteMut.mutate(Array.from(selectedIds).map(Number))
                    }}
                  >
                    {bulkDeleteMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Seçilenleri Sil
                  </Button>
                </>
              )}
              <div>
                <label className="mb-1 mr-2 text-sm font-medium">Tür:</label>
                <Select
                className="rounded-md"
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value)}
              >
                <option value="">Tümü</option>
                <option value="CLASS">Sınıf</option>
                <option value="EXAM">Sınav</option>
                <option value="OTHER">Diğer</option>
              </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reorderError && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Sıralama kaydedilemedi: {reorderError}
            </div>
          )}
          <SortableCatalogTable<GradeLevel>
            data={items}
            columns={columns}
            searchPlaceholder="Ad veya kod ara…"
            emptyText="Henüz sınıf düzeyi eklenmemiş."
            onReorder={(ids) => reorderMut.mutate(ids)}
            resetTrigger={reorderResetTrigger}
            isReorderPending={reorderMut.isPending}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            renderActions={(row) => (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
                  Düzenle
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    const result = await confirmDelete(
                      "Sınıf düzeyi silinsin mi?",
                      "Bu işlem geri alınamaz."
                    )
                    if (!result.isConfirmed) return
                    deleteMut.mutate(row.id, {
                      onSuccess: () =>
                        toast.success(getDeleteSuccessMessage("sınıf düzeyi", row.name)),
                    })
                  }}
                >
                  Sil
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <CrudModal
        open={modalOpen}
        title={editing ? "Sınıf Düzeyi Düzenle" : "Yeni Sınıf Düzeyi"}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Ad</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(trCapitalizeFirst(e.target.value))}
              placeholder="Örn: 1. Sınıf, LGS, YKS"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tür</label>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as "CLASS" | "EXAM" | "OTHER")}
            >
              <option value="CLASS">Sınıf</option>
              <option value="EXAM">Sınav</option>
              <option value="OTHER">Diğer</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm">Aktif</span>
          </label>
          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Kod (otomatik)
              </label>
              <p className="font-mono text-sm text-muted-foreground">{editing.code}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button
              type="submit"
              loading={createMut.isPending || updateMut.isPending}
            >
              {editing ? "Kaydet" : "Ekle"}
            </Button>
          </div>
        </form>
      </CrudModal>
    </div>
  )
}
