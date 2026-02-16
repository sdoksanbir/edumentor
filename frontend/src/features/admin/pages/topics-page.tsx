// src/features/admin/pages/topics-page.tsx
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
  listTopics,
  listUnits,
  listGradeLevels,
  listLessonCategories,
  createTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
  bulkCreateTopics,
  bulkDeleteTopics,
  catalogKeys,
  type Topic,
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

export function TopicsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [lessonCategoryId, setLessonCategoryId] = useState<number | "">("")
  const [unitId, setUnitId] = useState<number | "">("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [filterGradeLevelId, setFilterGradeLevelId] = useState<number | "">("")
  const [filterLcId, setFilterLcId] = useState<number | "">("")
  const [filterUnitId, setFilterUnitId] = useState<number | "">("")
  const [filterUnitNull, setFilterUnitNull] = useState(false)
  const [reorderResetTrigger, setReorderResetTrigger] = useState(0)

  const [bulkTopicModalOpen, setBulkTopicModalOpen] = useState(false)
  const [bulkTopicLessonCategoryId, setBulkTopicLessonCategoryId] = useState<number | "">("")
  const [bulkTopicUnitId, setBulkTopicUnitId] = useState<number | "">("")
  const [bulkTopicNames, setBulkTopicNames] = useState("")
  const [bulkTopicError, setBulkTopicError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filterGradeLevelId, filterLcId, filterUnitId, filterUnitNull])

  const { data: gradeLevels = [] } = useQuery({
    queryKey: catalogKeys.gradeLevels(),
    queryFn: () => listGradeLevels(),
  })

  const { data: lessonCategories = [] } = useQuery({
    queryKey: catalogKeys.lessonCategories(filterGradeLevelId || null),
    queryFn: () => listLessonCategories(filterGradeLevelId as number),
    enabled: !!filterGradeLevelId,
  })

  const { data: units = [] } = useQuery({
    queryKey: catalogKeys.units(filterLcId || undefined),
    queryFn: () => listUnits(filterLcId || undefined),
    enabled: !!filterLcId,
  })

  const { data: formUnits = [] } = useQuery({
    queryKey: catalogKeys.units(lessonCategoryId || undefined),
    queryFn: () => listUnits(lessonCategoryId || undefined),
    enabled: !!lessonCategoryId && modalOpen,
  })

  const { data: bulkTopicUnits = [] } = useQuery({
    queryKey: catalogKeys.units(bulkTopicLessonCategoryId || undefined),
    queryFn: () => listUnits(bulkTopicLessonCategoryId || undefined),
    enabled: !!bulkTopicLessonCategoryId && bulkTopicModalOpen,
  })

  const currentScopeUnitId = filterUnitNull
    ? null
    : filterUnitId
      ? Number(filterUnitId)
      : undefined
  const topicsQueryKey = catalogKeys.topics(
    currentScopeUnitId,
    filterLcId ? Number(filterLcId) : undefined
  )

  const { data: items = [], isLoading, isError, refetch: refetchTopics } = useQuery({
    queryKey: topicsQueryKey,
    queryFn: () =>
      listTopics({
        lesson_category_id: filterLcId || undefined,
        unit_id: filterUnitNull ? undefined : filterUnitId || undefined,
        unit__isnull: filterUnitNull,
      }),
    enabled: !!filterLcId,
  })

  const toggleMut = useMutation({
    mutationFn: ({
      id,
      is_active,
    }: { id: number; is_active: boolean; name?: string }) =>
      updateTopic(id, { is_active }),
    onMutate: async (vars) => {
      setTogglingId(vars.id)
      await qc.cancelQueries({ queryKey: topicsQueryKey })
      const prev = qc.getQueryData<Topic[]>(topicsQueryKey)
      qc.setQueryData<Topic[]>(topicsQueryKey, (old) =>
        old ? old.map((r) => (r.id === vars.id ? { ...r, is_active: vars.is_active } : r)) : []
      )
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(topicsQueryKey, ctx.prev)
      toast.error(getErrorMessage(err))
    },
    onSuccess: (_data, vars) => {
      if (vars.name != null) {
        toast.success(getToggleSuccessMessage("konu", vars.name, vars.is_active))
      }
    },
    onSettled: () => {
      setTogglingId(null)
      qc.invalidateQueries({ queryKey: catalogKeys.topicsAll() })
    },
  })

  const columns: Column<Topic>[] = useMemo(
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
        key: "unit_name",
        header: "Ünite",
        align: "left",
        accessor: (r) => (
          <span className="text-muted-foreground truncate">{r.unit_name ?? "— (ünitesiz)"}</span>
        ),
        sortValue: (r) => r.unit_name ?? "",
        filterValue: (r) => r.unit_name ?? "",
      },
      {
        key: "name",
        header: "Konu adı",
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
    mutationFn: createTopic,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.topicsAll() })
      refetchTopics()
      setModalOpen(false)
      resetForm()
      toast.success(getCreateSuccessMessage("konu", data.name))
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
      data: Parameters<typeof updateTopic>[1]
      prevScope?: { lcId: number; unitId: number | null }
    }) => updateTopic(id, data),
    onSuccess: (data, variables) => {
      const prevScope =
        "prevScope" in variables
          ? (variables as { prevScope: { lcId: number; unitId: number | null } })
              .prevScope
          : { lcId: editing!.lesson_category, unitId: editing!.unit ?? null }
      const nextScope = {
        lcId: data.lesson_category,
        unitId: data.unit ?? null,
      }
      const currentScope = {
        lcId: Number(filterLcId),
        unitId: currentScopeUnitId ?? null,
      }
      const keysToInvalidate = [
        catalogKeys.topics(prevScope.unitId, prevScope.lcId),
        catalogKeys.topics(nextScope.unitId, nextScope.lcId),
        catalogKeys.topics(currentScope.unitId, currentScope.lcId),
      ]
      keysToInvalidate.forEach((key) =>
        qc.invalidateQueries({ queryKey: key })
      )
      qc.refetchQueries({ queryKey: topicsQueryKey })
      setModalOpen(false)
      resetForm()
      toast.success(getUpdateSuccessMessage("konu", data.name))
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
    mutationFn: deleteTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.topicsAll() })
      refetchTopics()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkTopicMut = useMutation({
    mutationFn: bulkCreateTopics,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.topicsAll() })
      refetchTopics()
      setBulkTopicModalOpen(false)
      setBulkTopicLessonCategoryId("")
      setBulkTopicUnitId("")
      setBulkTopicNames("")
      toast.success(getBulkCreateSuccessMessage("konu", data.created, 0))
    },
    onError: (e) => {
      const msg = getErrorMessage(e)
      setBulkTopicError(msg)
      toast.error(msg)
    },
  })

  const bulkDeleteMut = useMutation({
    mutationFn: bulkDeleteTopics,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: catalogKeys.topicsAll() })
      refetchTopics()
      setSelectedIds(new Set())
      toast.success(getBulkDeleteSuccessMessage("", res.deleted_count))
    },
    onError: () => toast.error(getBulkDeleteErrorMessage()),
  })

  const [reorderError, setReorderError] = useState<string | null>(null)
  const reorderMut = useMutation({
    mutationFn: ({
      lcId,
      unitId,
      ids,
    }: {
      lcId: number
      unitId: number | null
      ids: number[]
    }) => reorderTopics(lcId, unitId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.topicsAll() })
      refetchTopics()
      setReorderError(null)
    },
    onError: (e) => {
      setReorderResetTrigger((t) => t + 1)
      setReorderError(getErrorMessage(e))
    },
  })

  function resetForm() {
    setEditing(null)
    setLessonCategoryId("")
    setUnitId("")
    setName("")
    setError(null)
  }

  function openCreate() {
    resetForm()
    if (filterLcId) setLessonCategoryId(filterLcId)
    if (filterUnitId && !filterUnitNull) setUnitId(filterUnitId)
    setModalOpen(true)
  }

  function openBulkTopic() {
    if (!filterLcId) return
    setBulkTopicModalOpen(true)
    setBulkTopicLessonCategoryId(filterLcId)
    setBulkTopicUnitId(filterUnitId && !filterUnitNull ? filterUnitId : "")
    setBulkTopicNames("")
    setBulkTopicError(null)
  }

  function handleBulkTopicSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBulkTopicError(null)
    const lcId = bulkTopicLessonCategoryId === "" ? undefined : Number(bulkTopicLessonCategoryId)
    if (!lcId) {
      setBulkTopicError("Ders seçimi zorunludur.")
      return
    }
    const names = bulkTopicNames
      .split("\n")
      .map((s) => trCapitalizeFirst(s.trim()))
      .filter(Boolean)
    if (names.length === 0) {
      setBulkTopicError("En az bir konu adı girin.")
      return
    }
    const uId = bulkTopicUnitId === "" ? null : Number(bulkTopicUnitId)
    bulkTopicMut.mutate({
      lesson_category: lcId,
      unit: uId ?? undefined,
      names,
    })
  }

  function openEdit(row: Topic) {
    setEditing(row)
    setLessonCategoryId(row.lesson_category)
    setUnitId(row.unit ?? "")
    setName(row.name)
    setModalOpen(true)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const lcId = lessonCategoryId === "" ? undefined : Number(lessonCategoryId)
    if (!lcId) {
      setError("Ders seçimi zorunludur")
      return
    }
    const uId = unitId === "" ? null : Number(unitId)
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        data: { lesson_category: lcId, unit: uId, name },
        prevScope: {
          lcId: editing.lesson_category,
          unitId: editing.unit ?? null,
        },
      })
    } else {
      createMut.mutate({
        lesson_category: lcId,
        unit: uId ?? undefined,
        name,
      })
    }
  }

  const scopeUnitId = filterUnitNull ? null : filterUnitId ? Number(filterUnitId) : null
  const canReorder =
    !!filterLcId &&
    items.length > 0 &&
    (!!filterUnitId || filterUnitNull)

  if (isLoading && filterLcId) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Konular</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ünite altında veya ünitesiz konular. Listeleme için ders seçin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openBulkTopic} disabled={!filterLcId}>
            <ListPlus className="mr-2 h-4 w-4" />
            Toplu Konu Ekle
          </Button>
          <Button onClick={openCreate} disabled={!filterLcId}>
            <Plus className="mr-2 h-4 w-4" />
            Ekle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Konu Listesi</CardTitle>
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
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Sınıf düzeyi</label>
              <Select
                className="min-w-[180px]"
                value={filterGradeLevelId}
                onChange={(e) => {
                  const v = e.target.value === "" ? "" : Number(e.target.value)
                  setFilterGradeLevelId(v)
                  if (!v) {
                    setFilterLcId("")
                    setFilterUnitId("")
                  }
                }}
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
              <label className="mb-1 block text-sm font-medium">Ders (zorunlu)</label>
              <Select
                className="min-w-[180px]"
                value={filterLcId}
                onChange={(e) => {
                  const v = e.target.value === "" ? "" : Number(e.target.value)
                  setFilterLcId(v)
                  if (!v) setFilterUnitId("")
                }}
                disabled={!filterGradeLevelId}
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
            {filterLcId && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Ünite (opsiyonel)</label>
                  <Select
                    className="min-w-[180px]"
                    value={filterUnitId}
                    onChange={(e) => {
                      const v = e.target.value
                      setFilterUnitId(v === "" ? "" : Number(v))
                      if (v) setFilterUnitNull(false)
                    }}
                    disabled={filterUnitNull}
                  >
                    <option value="">Tümü</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <label className="flex items-end gap-2 pb-2 cursor-pointer">
                  <Checkbox
                    checked={filterUnitNull}
                    onCheckedChange={(checked) => {
                      setFilterUnitNull(checked)
                      if (checked) setFilterUnitId("")
                    }}
                  />
                  <span className="text-sm">Ünitesiz</span>
                </label>
              </>
            )}
          </div>

          {reorderError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Sıralama kaydedilemedi: {reorderError}
            </div>
          )}
          {filterLcId ? (
            canReorder ? (
              <SortableCatalogTable<Topic>
                data={items}
                columns={columns}
                searchPlaceholder="Konu ara…"
                emptyText={
                  filterUnitNull
                    ? "Ünitesiz konu yok."
                    : filterUnitId
                      ? "Bu ünitede konu yok."
                      : "Bu derste konu yok."
                }
                onReorder={(ids) =>
                  reorderMut.mutate({
                    lcId: Number(filterLcId),
                    unitId: scopeUnitId,
                    ids,
                  })
                }
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
                          "Konu silinsin mi?",
                          "Bu işlem geri alınamaz."
                        )
                        if (!result.isConfirmed) return
                        deleteMut.mutate(row.id, {
                          onSuccess: () =>
                            toast.success(getDeleteSuccessMessage("konu", row.name)),
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
                                items.length > 0 &&
                                items.every((r) => selectedIds.has(String(r.id)))
                              }
                              indeterminate={
                                items.some((r) =>
                                  selectedIds.has(String(r.id))
                                ) &&
                                !(
                                  items.length > 0 &&
                                  items.every((r) =>
                                    selectedIds.has(String(r.id))
                                  )
                                )
                              }
                              onCheckedChange={() => {
                                const allSelected =
                                  items.length > 0 &&
                                  items.every((r) =>
                                    selectedIds.has(String(r.id))
                                  )
                                if (allSelected) {
                                  const next = new Set(selectedIds)
                                  items.forEach((r) => next.delete(String(r.id)))
                                  setSelectedIds(next)
                                } else {
                                  const next = new Set(selectedIds)
                                  items.forEach((r) => next.add(String(r.id)))
                                  setSelectedIds(next)
                                }
                              }}
                              aria-label="Tümünü seç"
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ders</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ünite</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Konu</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Durum</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Konu bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        items.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-border last:border-0 hover:bg-muted/50 text-sm text-foreground"
                          >
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
                            <td className="px-4 py-3 text-left text-muted-foreground">
                              {row.lesson_category_name ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-left text-muted-foreground">
                              {row.unit_name ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-left font-medium">{row.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center">
                                <Switch
                                  checked={row.is_active}
                                  disabled={toggleMut.isPending && togglingId === row.id}
                                  onCheckedChange={(checked) =>
                                    toggleMut.mutate({
                                      id: row.id,
                                      is_active: checked,
                                      name: row.name,
                                    })
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openEdit(row)}
                                >
                                  Düzenle
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    const result = await confirmDelete(
                                      "Konu silinsin mi?",
                                      "Bu işlem geri alınamaz."
                                    )
                                    if (!result.isConfirmed) return
                                    deleteMut.mutate(row.id, {
                                      onSuccess: () =>
                                        toast.success(getDeleteSuccessMessage("konu", row.name)),
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
        title={editing ? "Konu Düzenle" : "Yeni Konu"}
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
            <label className="mb-1 block text-sm font-medium">Ünite (opsiyonel, boş = ünitesiz)</label>
            <Select
              value={unitId}
              onChange={(e) =>
                setUnitId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">Ünitesiz</option>
              {formUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Konu adı</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(trCapitalizeFirst(e.target.value))}
              placeholder="Örn: Yaş Problemleri"
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
        open={bulkTopicModalOpen}
        title="Toplu Konu Ekle"
        onClose={() => {
          setBulkTopicModalOpen(false)
          setBulkTopicLessonCategoryId("")
          setBulkTopicUnitId("")
          setBulkTopicNames("")
          setBulkTopicError(null)
        }}
      >
        <form onSubmit={handleBulkTopicSubmit} className="space-y-4">
          {bulkTopicError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {bulkTopicError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Ders</label>
            <Select
              value={bulkTopicLessonCategoryId}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Number(e.target.value)
                setBulkTopicLessonCategoryId(v)
                setBulkTopicUnitId("")
              }}
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
            <label className="mb-1 block text-sm font-medium">Ünite (opsiyonel, boş = ünitesiz)</label>
            <Select
              value={bulkTopicUnitId}
              onChange={(e) =>
                setBulkTopicUnitId(e.target.value === "" ? "" : Number(e.target.value))
              }
              disabled={!bulkTopicLessonCategoryId}
            >
              <option value="">Ünitesiz</option>
              {bulkTopicUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Konu adları (her satır bir konu)
            </label>
            <textarea
              className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={bulkTopicNames}
              onChange={(e) => setBulkTopicNames(e.target.value)}
              placeholder={"Yaş Problemleri\nİşçi Problemleri\nHareket Problemleri"}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setBulkTopicModalOpen(false)
                setBulkTopicLessonCategoryId("")
                setBulkTopicUnitId("")
                setBulkTopicNames("")
              }}
            >
              İptal
            </Button>
            <Button type="submit" loading={bulkTopicMut.isPending}>
              Kaydet
            </Button>
          </div>
        </form>
      </CrudModal>
    </div>
  )
}
