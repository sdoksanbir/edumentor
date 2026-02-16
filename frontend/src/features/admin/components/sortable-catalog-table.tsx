// src/features/admin/components/sortable-catalog-table.tsx
import { useState, useMemo, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Input } from "@shared/ui/input"
import { Checkbox } from "@shared/ui/checkbox"
import type { Column } from "@shared/ui/data-table"
import { GripVertical } from "lucide-react"
import { cn } from "@shared/utils/cn"

function toStr(v: unknown) {
  if (v == null) return ""
  return String(v).toLowerCase()
}

/** Badge/status/tag columns get fixed width; text columns get flex */
function getColumnWidth<T>(col: Column<T>): string {
  if (col.key === "is_active") return "140px"
  if (col.key === "kind") return "100px"
  return "minmax(0, 1fr)"
}

function buildGridTemplate<T>(
  columns: Column<T>[],
  hasSelection: boolean
): string {
  const colWidths = columns.map(getColumnWidth)
  const checkbox = hasSelection ? "40px " : ""
  return `${checkbox}40px ${colWidths.join(" ")} 280px`
}

function getAlignClass(align: "left" | "center" | "right" | undefined): string {
  switch (align) {
    case "center":
      return "flex items-center justify-center"
    case "right":
      return "flex items-center justify-end"
    default:
      return "flex items-center justify-start"
  }
}

type SortableCatalogTableProps<T extends { id: number }> = {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  emptyText?: string
  onReorder: (ids: number[]) => void
  renderActions: (row: T) => React.ReactNode
  /** Increment to force reset rows from data (e.g. on reorder error) */
  resetTrigger?: number
  /** Disable drag while reorder mutation is pending */
  isReorderPending?: boolean
  /** Selection: when provided, checkbox column is shown */
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

function SortableRow<T extends { id: number }>({
  row,
  columns,
  gridTemplate,
  renderActions,
  selectedIds,
  onToggleRow,
}: {
  row: T
  columns: Column<T>[]
  gridTemplate: string
  renderActions: (row: T) => React.ReactNode
  selectedIds?: Set<string>
  onToggleRow?: (id: string, checked: boolean) => void
}) {
  const id = row.id.toString()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    gridTemplateColumns: gridTemplate,
    willChange: isDragging ? "transform" : undefined,
  }

  return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "grid w-full min-w-[640px] border-b border-border last:border-0 hover:bg-muted/50 text-sm text-foreground [&>div]:min-w-0",
          isDragging && "z-10 bg-muted/50 shadow-sm rounded-md opacity-90"
        )}
      >
      {selectedIds !== undefined && onToggleRow && (
        <div
          className="flex items-center justify-center px-4 py-3 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(id)}
              onCheckedChange={(checked) => onToggleRow(id, checked)}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-center px-4 py-3 shrink-0">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="touch-none cursor-grab active:cursor-grabbing rounded p-1 -m-1 hover:bg-muted/80 shrink-0"
          {...attributes}
          {...listeners}
          aria-label="Sırala"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      {columns.map((c) => {
        const align = c.align ?? (c.key === "is_active" ? "center" : "left")
        const isText = align === "left" && c.key !== "is_active"
        return (
          <div
            key={c.key}
            className={cn(
              "px-4 py-3 overflow-hidden min-w-0",
              getAlignClass(align),
              isText && "truncate [&>*]:min-w-0 [&>*]:truncate",
              c.className
            )}
          >
            {c.accessor(row)}
          </div>
        )
      })}
      <div className="flex items-center justify-center gap-2 px-4 py-3 shrink-0 whitespace-nowrap">
        {renderActions(row)}
      </div>
    </div>
  )
}

export function SortableCatalogTable<T extends { id: number }>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Ara…",
  emptyText = "Kayıt yok.",
  onReorder,
  renderActions,
  resetTrigger = 0,
  isReorderPending = false,
  selectedIds,
  onSelectionChange,
}: SortableCatalogTableProps<T>) {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<T[]>(data)
  const hasSelection = selectedIds !== undefined && onSelectionChange !== undefined

  useEffect(() => {
    setRows(data)
  }, [data, resetTrigger])

  useEffect(() => {
    if (hasSelection) onSelectionChange(new Set())
  }, [query])

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return rows
    const q = query.trim().toLowerCase()
    return rows.filter((row) =>
      columns.some((col) => {
        const val =
          col.filterValue?.(row) ??
          toStr(typeof col.accessor(row) === "string" ? col.accessor(row) : col.sortValue?.(row))
        return toStr(val).includes(q)
      })
    )
  }, [rows, columns, query, searchable])

  const gridTemplate = useMemo(
    () => buildGridTemplate(columns, hasSelection),
    [columns, hasSelection]
  )

  const toggleRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds!)
    if (checked) next.add(id)
    else next.delete(id)
    onSelectionChange!(next)
  }

  const toggleAll = () => {
    const visibleIds = filtered.map((r) => r.id.toString())
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds!.has(id))
    if (allSelected) {
      const next = new Set(selectedIds!)
      visibleIds.forEach((id) => next.delete(id))
      onSelectionChange!(next)
    } else {
      const next = new Set(selectedIds!)
      visibleIds.forEach((id) => next.add(id))
      onSelectionChange!(next)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    if (isReorderPending) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filtered.findIndex((r) => r.id.toString() === active.id)
    const newIndex = filtered.findIndex((r) => r.id.toString() === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedFiltered = arrayMove(filtered, oldIndex, newIndex)
    let newRows: T[]
    if (filtered.length === rows.length) {
      newRows = reorderedFiltered
    } else {
      const firstIdx = rows.findIndex((r) => r.id === filtered[0].id)
      newRows = [
        ...rows.slice(0, firstIdx),
        ...reorderedFiltered,
        ...rows.slice(firstIdx + filtered.length),
      ]
    }
    setRows(newRows)
    onReorder(newRows.map((r) => r.id))
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <Input
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {filtered.length} kayıt
            {isReorderPending ? " (kaydediliyor…)" : ""}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="w-full min-w-0 overflow-x-auto">
          {/* Header row - same gridTemplate as body rows */}
          <div
            className="grid w-full min-w-[640px] border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground [&>div]:min-w-0"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {hasSelection && (
              <div className="flex items-center justify-center px-4 py-3 shrink-0">
                <Checkbox
                  checked={
                    filtered.length > 0 &&
                    filtered.every((r) => selectedIds!.has(r.id.toString()))
                  }
                  indeterminate={
                    filtered.some((r) => selectedIds!.has(r.id.toString())) &&
                    !filtered.every((r) => selectedIds!.has(r.id.toString()))
                  }
                  onCheckedChange={toggleAll}
                  aria-label="Tümünü seç"
                />
              </div>
            )}
            <div className="flex items-center justify-center px-4 py-3 shrink-0" />
            {columns.map((c) => {
              const align = c.align ?? (c.key === "is_active" ? "center" : "left")
              return (
                <div
                  key={c.key}
                  className={cn(
                    "flex items-center px-4 py-3 overflow-hidden min-w-0 truncate",
                    getAlignClass(align),
                    c.headerClassName
                  )}
                >
                  {c.header}
                </div>
              )
            })}
            <div className="flex items-center justify-center px-4 py-3 shrink-0 whitespace-nowrap">
              İşlem
            </div>
          </div>
          {/* Body */}
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filtered.map((r) => r.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                {filtered.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    columns={columns}
                    gridTemplate={gridTemplate}
                    renderActions={renderActions}
                    selectedIds={selectedIds}
                    onToggleRow={toggleRow}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  )
}
