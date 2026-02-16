// src/features/admin/pages/units-page.tsx
import { useState, useEffect, useMemo } from "react"
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
  listUnits,
  listGradeLevels,
  listLessonCategories,
  createUnit,
  updateUnit,
  deleteUnit,
  reorderUnits,
  bulkCreateTopics,
  bulkCreateUnits,
  bulkDeleteUnits,
  catalogKeys,
  type Unit,
} from "../api/admin-api"
import { Loader2, AlertCircle, Plus, ListPlus, Trash2 } from "lucide-react"
import { confirmDelete, confirmBulkDelete } from "@shared/lib/swal"
import {
  getCreateSuccessMessage,
  getUpdateSuccessMessage,
  getToggleSuccessMessage,
  getDeleteSuccessMessage,
  getBulkCreateSuccessMessage,
  getBulkDeleteSuccessMessage,
  getBulkDeleteErrorMessage,
  getErrorMessage,
} from "@shared/lib/toast-messages"
import { trCapitalizeFirst } from "@shared/lib/strings"

export function UnitsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [lessonCategoryId, setLessonCategoryId] = useState<number | "">("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkUnit, setBulkUnit] = useState<Unit | null>(null)
  const [bulkNames, setBulkNames] = useState("")
  const [bulkError, setBulkError] = useState<string | null>(null)

  const [bulkUnitModalOpen, setBulkUnitModalOpen] = useState(false)
  const [bulkUnitLessonCategoryId, setBulkUnitLessonCategoryId] = useState<number | "">("")
  const [bulkUnitNames, setBulkUnitNames] = useState("")
  const [bulkUnitSkipExisting, setBulkUnitSkipExisting] = useState(true)
  const [bulkUnitError, setBulkUnitError] = useState<string | null>(null)

  const [filterGradeLevelId, setFilterGradeLevelId] = useState<number | "">("")
  const [filterLcId, setFilterLcId] = useState<number | "">("")
  const [reorderResetTrigger, setReorderResetTrigger] = useState(0)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const listKey = catalogKeys.units(filterLcId || undefined)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filterGradeLevelId, filterLcId])

  const { data: gradeLevels = [] } = useQuery({
    queryKey: catalogKeys.gradeLevels(),
    queryFn: () => listGradeLevels(),
  })

  const { data: lessonCategories = [] } = useQuery({
    queryKey: catalogKeys.lessonCategories(filterGradeLevelId || null),
    queryFn: () => listLessonCategories(filterGradeLevelId as number),
    enabled: !!filterGradeLevelId,
  })

  // Grade değişince ders seçimini sıfırla
  useEffect(() => {
    setFilterLcId("")
  }, [filterGradeLevelId])

  const { data: items = [], isLoading, isError, refetch: refetchUnits } = useQuery({
    queryKey: listKey,
    queryFn: () => listUnits(filterLcId || undefined),
    enabled: !!filterLcId,
  })

  const toggleMut = useMutation({
    mutationFn: ({
      id,
      is_active,
    }: { id: number; is_active: boolean; name?: string }) =>
      updateUnit(id, { is_active }),
    onMutate: async (vars) => {
      setTogglingId(vars.id)
      await qc.cancelQueries({ queryKey: listKey })
      const prev = qc.getQueryData<Unit[]>(listKey)
      qc.setQueryData<Unit[]>(listKey, (old) =>
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
        toast.success(getToggleSuccessMessage("ünite", vars.name, vars.is_active))
      }
    },
    onSettled: () => {
      setTogglingId(null)
      qc.invalidateQueries({ queryKey: catalogKeys.unitsAll() })
    },
  })

  const columns: Column<Unit>[] = useMemo(
    () => [
      {
        key: "lesson_category_name",
        header: "Ders",
        align: "left",
        accessor: (r) => (
          <span className="text-muted-foreground truncate">{r.lesson_category_name ?? "—"}</span>
        ),
        sortValue: (r) => r.lesson_category_name ?? "",
        filterValue: (r) => r.lesson_category_name ?? "",
      },
      {
        key: "name",
        header: "Ünite adı",
        align: "left",
        accessor: (r) => <span className="font-medium truncate">{r.name}</span>,
        sortValue: (r) => r.name,
        filterValue: (r) => r.name,
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
    [togglingId, toggleMut.isPending, toggleMut.mutate]
  )

  const createMut = useMutation({
    mutationFn: createUnit,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.unitsAll() })
      refetchUnits()
      setModalOpen(false)
      resetForm()
      toast.success(getCreateSuccessMessage("ünite", data.name))
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
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateUnit>[1] }) =>
      updateUnit(id, data),
    onSuccess: (data, variables) => {
      const prevLcId = editing?.lesson_category
      const nextLcId = variables.data.lesson_category
      if (prevLcId)
        qc.invalidateQueries({ queryKey: catalogKeys.units(prevLcId) })
      if (nextLcId && nextLcId !== prevLcId)
        qc.invalidateQueries({ queryKey: catalogKeys.units(nextLcId) })
      qc.invalidateQueries({ queryKey: catalogKeys.unitsAll() })
      refetchUnits()
      setModalOpen(false)
      resetForm()
      toast.success(getUpdateSuccessMessage("ünite", data.name))
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
    mutationFn: deleteUnit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.unitsAll() })
      refetchUnits()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: bulkDeleteUnits,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: catalogKeys.unitsAll() })
      refetchUnits()
      setSelectedIds(new Set())
      toast.success(getBulkDeleteSuccessMessage("", res.deleted_count))
    },
    onError: () => toast.error(getBulkDeleteErrorMessage()),
  })

  const [reorderError, setReorderError] = useState<string | null>(null)
  const reorderMut = useMutation({
    mutationFn: ({ lcId, ids }: { lcId: number; ids: number[] }) =>
      reorderUnits(lcId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.unitsAll() })
      refetchUnits()
      setReorderError(null)
    },
    onError: (e) => {
      setReorderResetTrigger((t) => t + 1)
      setReorderError(getErrorMessage(e))
    },
  })

  const bulkUnitMut = useMutation({
    mutationFn: bulkCreateUnits,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.unitsAll() })
      refetchUnits()
      setBulkUnitModalOpen(false)
      setBulkUnitLessonCategoryId("")
      setBulkUnitNames("")
      toast.success(
        getBulkCreateSuccessMessage("ünite", data.created_count, data.skipped_count)
      )
    },
    onError: (e) => {
      const msg = getErrorMessage(e)
      setBulkUnitError(msg)
      toast.error(msg)
    },
  })

  const bulkMut = useMutation({
    mutationFn: bulkCreateTopics,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.topicsAll() })
      setBulkModalOpen(false)
      setBulkUnit(null)
      setBulkNames("")
      toast.success(
        getBulkCreateSuccessMessage("konu", data.created, 0)
      )
    },
    onError: (e) => {
      const msg = getErrorMessage(e)
      setBulkModalOpen(false)
      setBulkError(msg)
      toast.error(msg)
    },
  })

  function resetForm() {
    setEditing(null)
    setLessonCategoryId("")
    setName("")
    setError(null)
  }

  function openCreate() {
    resetForm()
    if (filterLcId) setLessonCategoryId(filterLcId)
    setModalOpen(true)
  }

  const canAdd = !!filterGradeLevelId && !!filterLcId

  function openEdit(row: Unit) {
    setEditing(row)
    setLessonCategoryId(row.lesson_category)
    setName(row.name)
    setModalOpen(true)
    setError(null)
  }

  function openBulk(unit: Unit) {
    setBulkUnit(unit)
    setBulkNames("")
    setBulkError(null)
    setBulkModalOpen(true)
  }

  function openBulkUnit() {
    if (!filterLcId) return
    setBulkUnitModalOpen(true)
    setBulkUnitLessonCategoryId(filterLcId)
    setBulkUnitNames("")
    setBulkUnitError(null)
    setBulkUnitSkipExisting(true)
  }

  function handleBulkUnitSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBulkUnitError(null)
    const lcId = bulkUnitLessonCategoryId === "" ? undefined : Number(bulkUnitLessonCategoryId)
    if (!lcId) {
      setBulkUnitError("Ders seçimi zorunludur.")
      return
    }
    const names = bulkUnitNames
      .split("\n")
      .map((s) => trCapitalizeFirst(s.trim()))
      .filter(Boolean)
    if (names.length === 0) {
      setBulkUnitError("En az bir ünite adı girin.")
      return
    }
    bulkUnitMut.mutate({
      lesson_category: lcId,
      names,
      is_active: true,
      skip_existing: bulkUnitSkipExisting,
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const lcId = lessonCategoryId === "" ? undefined : Number(lessonCategoryId)
    if (!lcId) {
      setError("Ders seçimi zorunludur")
      return
    }
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        data: { lesson_category: lcId, name },
      })
    } else {
      createMut.mutate({
        lesson_category: lcId,
        name,
      })
    }
  }

  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bulkUnit) return
    setBulkError(null)
    const names = bulkNames
      .split("\n")
      .map((s) => trCapitalizeFirst(s.trim()))
      .filter(Boolean)
    if (names.length === 0) {
      setBulkError("En az bir konu adı girin.")
      return
    }
    bulkMut.mutate({
      lesson_category: bulkUnit.lesson_category,
      unit: bulkUnit.id,
      names,
    })
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
        <p className="text-center text-sm text-destructive">Veriler yüklenirken hata oluştu.</p>
      </div>
    )
  }

  const displayItems = items
  const canReorder = !!filterGradeLevelId && filterLcId && displayItems.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Üniteler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ders altındaki üniteler. Sıralamak için önce ders seçin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openBulkUnit} disabled={!canAdd}>
            <ListPlus className="mr-2 h-4 w-4" />
            Toplu Ünite Ekle
          </Button>
          <Button onClick={openCreate} disabled={!canAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Ekle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Ünite Listesi</CardTitle>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
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
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium">Sınıf düzeyi</label>
              <Select
                className="min-w-[180px]"
                value={filterGradeLevelId}
                onChange={(e) =>
                  setFilterGradeLevelId(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">Seçin…</option>
                {gradeLevels.map((gl) => (
                  <option key={gl.id} value={gl.id}>
                    {gl.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ders</label>
              <Select
                className="min-w-[180px]"
                value={filterLcId}
                onChange={(e) =>
                  setFilterLcId(e.target.value === "" ? "" : Number(e.target.value))
                }
                disabled={!filterGradeLevelId}
              >
                <option value="">Seçin…</option>
                {lessonCategories.map((lc) => (
                  <option key={lc.id} value={lc.id}>
                    {lc.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {reorderError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Sıralama kaydedilemedi: {reorderError}
            </div>
          )}
          {filterLcId ? (
          canReorder ? (
            <SortableCatalogTable<Unit>
              data={displayItems}
              columns={columns}
              searchPlaceholder="Ünite ara…"
              emptyText="Henüz ünite eklenmemiş veya ders seçin."
              onReorder={(ids) => reorderMut.mutate({ lcId: Number(filterLcId), ids })}
              resetTrigger={reorderResetTrigger}
              isReorderPending={reorderMut.isPending}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              renderActions={(row) => (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openBulk(row)}
                    title="Toplu Konu Ekle"
                  >
                    <ListPlus className="mr-1 h-4 w-4" />
                    Toplu Konu
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      const result = await confirmDelete(
                        "Ünite silinsin mi?",
                        "Bu işlem geri alınamaz."
                      )
                      if (!result.isConfirmed) return
                      deleteMut.mutate(row.id, {
                        onSuccess: () =>
                          toast.success(getDeleteSuccessMessage("ünite", row.name)),
                      })
                    }}
                  >
                    Sil
                  </Button>
                </div>
              )}
            />
          ) : (
            <div className="rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="w-10 px-4 py-3">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={
                                displayItems.length > 0 &&
                                displayItems.every((r) =>
                                  selectedIds.has(String(r.id))
                                )
                              }
                              indeterminate={
                                displayItems.some((r) =>
                                  selectedIds.has(String(r.id))
                                ) &&
                                !(
                                  displayItems.length > 0 &&
                                  displayItems.every((r) =>
                                    selectedIds.has(String(r.id))
                                  )
                                )
                              }
                              onCheckedChange={() => {
                                const allSelected =
                                  displayItems.length > 0 &&
                                  displayItems.every((r) =>
                                    selectedIds.has(String(r.id))
                                  )
                                if (allSelected) {
                                  const next = new Set(selectedIds)
                                  displayItems.forEach((r) =>
                                    next.delete(String(r.id))
                                  )
                                  setSelectedIds(next)
                                } else {
                                  const next = new Set(selectedIds)
                                  displayItems.forEach((r) =>
                                    next.add(String(r.id))
                                  )
                                  setSelectedIds(next)
                                }
                              }}
                              aria-label="Tümünü seç"
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Ders</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Ünite</th>
                        <th className="min-w-[140px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Durum</th>
                        <th className="min-w-[280px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">İşlem</th>
                      </tr>
                    </thead>
                  <tbody>
                    {displayItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          {filterLcId ? "Bu derste ünite yok." : "Sıralama için ders seçin."}
                        </td>
                      </tr>
                    ) : (
                      displayItems.map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 text-sm text-foreground">
                          <td className="w-10 px-4 py-3">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={selectedIds.has(String(row.id))}
                                onCheckedChange={(checked) => {
                                  const next = new Set(selectedIds)
                                  if (checked) next.add(String(row.id))
                                  else next.delete(String(row.id))
                                  setSelectedIds(next)
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">
                            {row.lesson_category_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-left text-sm font-medium text-foreground">{row.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <Switch
                                checked={row.is_active}
                                disabled={toggleMut.isPending && togglingId === row.id}
                                onCheckedChange={(checked) =>
                                  toggleMut.mutate({ id: row.id, is_active: checked, name: row.name })
                                }
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openBulk(row)}
                              >
                                <ListPlus className="mr-1 h-4 w-4" />
                                Toplu Konu
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
                                Düzenle
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  const result = await confirmDelete(
                                    "Ünite silinsin mi?",
                                    "Bu işlem geri alınamaz."
                                  )
                                  if (!result.isConfirmed) return
                                    deleteMut.mutate(row.id, {
                                      onSuccess: () =>
                                        toast.success(getDeleteSuccessMessage("ünite", row.name)),
                                    })
                                }}
                              >
                                Sil
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
          ) : (
            <div className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground">
              Listeleme için ders seçin.
            </div>
          )}
        </CardContent>
      </Card>

      <CrudModal
        open={modalOpen}
        title={editing ? "Ünite Düzenle" : "Yeni Ünite"}
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
            <label className="mb-1 block text-sm font-medium">Ders</label>
            <Select
              value={lessonCategoryId}
              onChange={(e) =>
                setLessonCategoryId(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            >
              <option value="">Seçin…</option>
              {lessonCategories.map((lc) => (
                <option key={lc.id} value={lc.id}>
                  {lc.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ünite adı</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(trCapitalizeFirst(e.target.value))}
              placeholder="Örn: Problemler"
              required
            />
          </div>
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

      <CrudModal
        open={bulkUnitModalOpen}
        title="Toplu Ünite Ekle"
        onClose={() => {
          setBulkUnitModalOpen(false)
          setBulkUnitLessonCategoryId("")
          setBulkUnitNames("")
          setBulkUnitError(null)
        }}
      >
        <form onSubmit={handleBulkUnitSubmit} className="space-y-4">
          {bulkUnitError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {bulkUnitError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Ders</label>
            <Select
              value={bulkUnitLessonCategoryId}
              onChange={(e) =>
                setBulkUnitLessonCategoryId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              required
              disabled={!filterGradeLevelId}
            >
              <option value="">Seçin…</option>
              {lessonCategories.map((lc) => (
                <option key={lc.id} value={lc.id}>
                  {lc.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Ünite adları (her satır bir ünite)
            </label>
            <textarea
              className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={bulkUnitNames}
              onChange={(e) => setBulkUnitNames(e.target.value)}
              placeholder={"Problemler\nOlasılık\nTrigonometri"}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={bulkUnitSkipExisting}
              onCheckedChange={(c) => setBulkUnitSkipExisting(!!c)}
            />
            <span className="text-sm">Mevcut ünite adlarını atla</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setBulkUnitModalOpen(false)
                setBulkUnitLessonCategoryId("")
                setBulkUnitNames("")
              }}
            >
              İptal
            </Button>
            <Button type="submit" loading={bulkUnitMut.isPending}>
              Kaydet
            </Button>
          </div>
        </form>
      </CrudModal>

      <CrudModal
        open={bulkModalOpen}
        title={bulkUnit ? `Toplu Konu Ekle — ${bulkUnit.name}` : "Toplu Konu Ekle"}
        onClose={() => {
          setBulkModalOpen(false)
          setBulkUnit(null)
          setBulkNames("")
          setBulkError(null)
        }}
      >
        {bulkUnit && (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            {bulkError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {bulkError}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Konu adları (her satır bir konu)
              </label>
              <textarea
                className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder={"Yaş Problemleri\nİşçi Problemleri\nHareket Problemleri"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setBulkModalOpen(false)
                  setBulkUnit(null)
                  setBulkNames("")
                }}
              >
                Kapat
              </Button>
              <Button type="submit" loading={bulkMut.isPending}>
                Kaydet
              </Button>
            </div>
          </form>
        )}
      </CrudModal>
    </div>
  )
}
