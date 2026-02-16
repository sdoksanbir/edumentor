// src/features/admin/pages/lesson-categories-page.tsx
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
  listLessonCategories,
  listGradeLevels,
  createLessonCategory,
  updateLessonCategory,
  deleteLessonCategory,
  reorderLessonCategories,
  bulkCreateLessonCategories,
  bulkDeleteLessonCategories,
  catalogKeys,
  type LessonCategory,
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

export function LessonCategoriesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [editing, setEditing] = useState<LessonCategory | null>(null)
  const [filterGradeLevelId, setFilterGradeLevelId] = useState<number | "">("")
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkNames, setBulkNames] = useState("")
  const [bulkSkipExisting, setBulkSkipExisting] = useState(true)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const listKey = catalogKeys.lessonCategories(filterGradeLevelId || null, undefined)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filterGradeLevelId])

  const { data: gradeLevels = [] } = useQuery({
    queryKey: catalogKeys.gradeLevels(),
    queryFn: () => listGradeLevels(),
  })

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: listKey,
    queryFn: () =>
      listLessonCategories(
        filterGradeLevelId as number,
        undefined
      ),
    enabled: !!filterGradeLevelId,
  })

  const toggleMut = useMutation({
    mutationFn: ({
      id,
      is_active,
    }: { id: number; is_active: boolean; name?: string }) =>
      updateLessonCategory(id, { is_active }),
    onMutate: async (vars) => {
      setTogglingId(vars.id)
      await qc.cancelQueries({ queryKey: listKey })
      const prev = qc.getQueryData<LessonCategory[]>(listKey)
      qc.setQueryData<LessonCategory[]>(listKey, (old) =>
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
        toast.success(getToggleSuccessMessage("ders", vars.name, vars.is_active))
      }
    },
    onSettled: () => {
      setTogglingId(null)
      qc.invalidateQueries({ queryKey: catalogKeys.lessonCategoriesAll() })
    },
  })

  const columns: Column<LessonCategory>[] = useMemo(
    () => [
      {
        key: "grade_level_name",
        header: "Sınıf",
        align: "left",
        accessor: (r) => (
          <span className="text-muted-foreground truncate">{r.grade_level_name ?? "—"}</span>
        ),
        sortValue: (r) => r.grade_level_name ?? "",
        filterValue: (r) => r.grade_level_name ?? "",
      },
      {
        key: "name",
        header: "Ders adı",
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
    mutationFn: createLessonCategory,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.lessonCategoriesAll() })
      setModalOpen(false)
      resetForm()
      toast.success(getCreateSuccessMessage("ders", data.name))
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
      data: Parameters<typeof updateLessonCategory>[1]
    }) => updateLessonCategory(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.lessonCategoriesAll() })
      setModalOpen(false)
      resetForm()
      toast.success(getUpdateSuccessMessage("ders", data.name))
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
    mutationFn: deleteLessonCategory,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: catalogKeys.lessonCategoriesAll() }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: bulkDeleteLessonCategories,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: catalogKeys.lessonCategoriesAll() })
      setSelectedIds(new Set())
      toast.success(getBulkDeleteSuccessMessage("", res.deleted_count))
    },
    onError: () => toast.error(getBulkDeleteErrorMessage()),
  })

  const reorderMut = useMutation({
    mutationFn: reorderLessonCategories,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: catalogKeys.lessonCategoriesAll() }),
  })

  const bulkMut = useMutation({
    mutationFn: bulkCreateLessonCategories,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.lessonCategoriesAll() })
      setBulkModalOpen(false)
      setBulkNames("")
      setBulkError(null)
      toast.success(
        getBulkCreateSuccessMessage("ders", data.created_count, data.skipped_count)
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
    setName("")
    setIsActive(true)
    setError(null)
  }

  function openCreate() {
    if (!filterGradeLevelId) return
    resetForm()
    setModalOpen(true)
  }

  function openEdit(row: LessonCategory) {
    setEditing(row)
    setFilterGradeLevelId(row.grade_level)
    setName(row.name)
    setIsActive(row.is_active)
    setModalOpen(true)
    setError(null)
  }

  function openBulk() {
    if (!filterGradeLevelId) return
    setBulkModalOpen(true)
    setBulkNames("")
    setBulkError(null)
    setBulkSkipExisting(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const glId = filterGradeLevelId
    if (!glId) return
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        data: { grade_level: glId, name, is_active: isActive },
      })
    } else {
      createMut.mutate({ grade_level: glId, name, is_active: isActive })
    }
  }

  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBulkError(null)
    if (!filterGradeLevelId) return
    const names = bulkNames
      .split("\n")
      .map((s) => trCapitalizeFirst(s.trim()))
      .filter(Boolean)
    if (names.length === 0) {
      setBulkError("En az bir ders adı girin.")
      return
    }
    bulkMut.mutate({
      grade_level: filterGradeLevelId,
      names,
      is_active: true,
      skip_existing: bulkSkipExisting,
    })
  }

  const canAdd = !!filterGradeLevelId
  const selectedGradeName =
    gradeLevels.find((g) => g.id === filterGradeLevelId)?.name ?? ""

  if (isLoading && !filterGradeLevelId) {
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
          <h1 className="text-2xl font-semibold">Dersler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Müfredat dersleri – sınıf düzeyine göre (Matematik 9. sınıf, Matematik
            KPSS vb.)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openBulk} disabled={!canAdd}>
            <ListPlus className="mr-2 h-4 w-4" />
            Toplu Ders Ekle
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
            <CardTitle>Ders Listesi</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
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
              <label className="mb-1 block text-sm font-medium">
                Sınıf düzeyi (zorunlu)
              </label>
              <Select
                className="min-w-[200px]"
                value={filterGradeLevelId}
                onChange={(e) =>
                  setFilterGradeLevelId(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
              >
                <option value="">Sınıf seçin…</option>
                {gradeLevels.map((gl) => (
                  <option key={gl.id} value={gl.id}>
                    {gl.name}
                  </option>
                ))}
              </Select>
            </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filterGradeLevelId ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Sınıf düzeyi seçerek dersleri listeleyebilirsiniz.
            </div>
          ) : (
            <SortableCatalogTable<LessonCategory>
              data={items}
              columns={columns}
              searchPlaceholder="Ders ara…"
              emptyText="Bu sınıf düzeyinde henüz ders yok."
              onReorder={(ids) => reorderMut.mutate(ids)}
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
                      "Ders silinsin mi?",
                      "Bu işlem geri alınamaz."
                    )
                    if (!result.isConfirmed) return
                    deleteMut.mutate(row.id, {
                      onSuccess: () =>
                        toast.success(getDeleteSuccessMessage("ders", row.name)),
                    })
                  }}
                >
                  Sil
                </Button>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Tekli Ekle Modal */}
      <CrudModal
        open={modalOpen}
        title={editing ? "Ders Düzenle" : "Yeni Ders"}
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
          {filterGradeLevelId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Sınıf düzeyi
              </label>
              <p className="text-sm font-medium">{selectedGradeName}</p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Ders adı</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(trCapitalizeFirst(e.target.value))}
              placeholder="Örn: Matematik"
              required
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm">Aktif</span>
          </label>
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

      {/* Toplu Ekle Modal */}
      <CrudModal
        open={bulkModalOpen}
        title="Toplu Ders Ekle"
        onClose={() => {
          setBulkModalOpen(false)
          setBulkNames("")
          setBulkError(null)
        }}
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          {bulkError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {bulkError}
            </div>
          )}
          {filterGradeLevelId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Sınıf düzeyi
              </label>
              <p className="text-sm font-medium">{selectedGradeName}</p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Ders adları (her satırda bir ad)
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
              placeholder={'Matematik\nTürkçe\nFizik\nKimya'}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={bulkSkipExisting} onCheckedChange={setBulkSkipExisting} />
            <span className="text-sm">Mevcutları atla (skip)</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBulkModalOpen(false)}
            >
              İptal
            </Button>
            <Button type="submit" loading={bulkMut.isPending}>
              Kaydet
            </Button>
          </div>
        </form>
      </CrudModal>
    </div>
  )
}
