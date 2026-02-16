// src/features/admin/pages/subjects-page.tsx
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import type { Column } from "@shared/ui/data-table"
import { Switch } from "@shared/ui/switch"
import { SortableCatalogTable } from "../components/sortable-catalog-table"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { CrudModal } from "../components/crud-modal"
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
  bulkDeleteSubjects,
  catalogKeys,
  type Subject,
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

export function SubjectsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [label, setLabel] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const listKey = catalogKeys.subjects()

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: listKey,
    queryFn: () => listSubjects(),
  })

  const toggleMut = useMutation({
    mutationFn: ({
      id,
      is_active,
    }: { id: number; is_active: boolean; label?: string }) =>
      updateSubject(id, { is_active }),
    onMutate: async (vars) => {
      setTogglingId(vars.id)
      await qc.cancelQueries({ queryKey: listKey })
      const prev = qc.getQueryData<Subject[]>(listKey)
      qc.setQueryData<Subject[]>(listKey, (old) =>
        old ? old.map((r) => (r.id === vars.id ? { ...r, is_active: vars.is_active } : r)) : []
      )
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev)
      toast.error(getErrorMessage(err))
    },
    onSuccess: (_data, vars) => {
      if (vars.label != null) {
        toast.success(
          getToggleSuccessMessage("branş", vars.label, vars.is_active)
        )
      }
    },
    onSettled: () => {
      setTogglingId(null)
      qc.invalidateQueries({ queryKey: catalogKeys.subjects() })
    },
  })

  const columns: Column<Subject>[] = useMemo(
    () => [
      {
        key: "label",
        header: "Ad",
        align: "left",
        accessor: (r) => <span className="font-medium truncate">{r.label}</span>,
        sortValue: (r) => r.label,
        filterValue: (r) => `${r.label} ${r.code}`,
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
        key: "is_active",
        header: "Durum",
        align: "center",
        accessor: (r) => (
          <Switch
            checked={r.is_active}
            disabled={toggleMut.isPending && togglingId === r.id}
            onCheckedChange={(checked) =>
              toggleMut.mutate({ id: r.id, is_active: checked, label: r.label })
            }
          />
        ),
        sortValue: (r) => (r.is_active ? 1 : 0),
      },
    ],
    [togglingId, toggleMut.isPending, toggleMut.mutate]
  )

  const createMut = useMutation({
    mutationFn: createSubject,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.subjects() })
      setModalOpen(false)
      resetForm()
      toast.success(getCreateSuccessMessage("branş", data.label))
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
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateSubject>[1] }) =>
      updateSubject(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: catalogKeys.subjects() })
      setModalOpen(false)
      resetForm()
      toast.success(getUpdateSuccessMessage("branş", data.label))
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
    mutationFn: deleteSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.subjects() }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: bulkDeleteSubjects,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: catalogKeys.subjects() })
      setSelectedIds(new Set())
      toast.success(getBulkDeleteSuccessMessage("", res.deleted_count))
    },
    onError: () => toast.error(getBulkDeleteErrorMessage()),
  })

  const reorderMut = useMutation({
    mutationFn: reorderSubjects,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.subjects() }),
  })

  function resetForm() {
    setEditing(null)
    setLabel("")
    setError(null)
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(row: Subject) {
    setEditing(row)
    setLabel(row.label)
    setModalOpen(true)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (editing) {
      updateMut.mutate({ id: editing.id, data: { label } })
    } else {
      createMut.mutate({ label })
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
        <p className="text-center text-sm text-destructive">Veriler yüklenirken hata oluştu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Branşlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Öğretmen branşları. Kod otomatik üretilir.
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
            <CardTitle>Branş Listesi</CardTitle>
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
        <CardContent>
          <SortableCatalogTable<Subject>
            data={items}
            columns={columns}
            searchPlaceholder="Branş ara…"
            emptyText="Henüz branş eklenmemiş."
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
                      "Branş silinsin mi?",
                      "Bu işlem geri alınamaz."
                    )
                    if (!result.isConfirmed) return
                    deleteMut.mutate(row.id, {
                      onSuccess: () =>
                        toast.success(getDeleteSuccessMessage("branş", row.label)),
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
        title={editing ? "Branş Düzenle" : "Yeni Branş"}
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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={(e) => setLabel(trCapitalizeFirst(e.target.value))}
              placeholder="Örn: Matematik"
              required
            />
          </div>
          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium">Kod (otomatik)</label>
              <Input value={editing.code} disabled readOnly className="bg-muted" />
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
