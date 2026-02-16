import * as React from "react"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Table, TableCell, TableHead, TableRow } from "@shared/ui/table"

type SortDir = "asc" | "desc"

export type Column<T> = {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  /** sorting için string/number döndür */
  sortValue?: (row: T) => string | number
  /** filter için string döndür (yoksa accessor text’e çevrilir) */
  filterValue?: (row: T) => string
  /** Hücre hizalaması: left, center, right */
  align?: "left" | "center" | "right"
  className?: string
  headerClassName?: string
}

type DataTableProps<T> = {
  title?: string
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  emptyText?: string
}

function toStr(v: unknown) {
  if (v == null) return ""
  return String(v).toLowerCase()
}

export function DataTable<T>({
  title,
  data,
  columns,
  pageSize = 8,
  searchable = true,
  searchPlaceholder = "Search…",
  emptyText = "No results.",
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>("asc")
  const [page, setPage] = React.useState(1)

  // Query değişince 1. sayfaya dön
  React.useEffect(() => {
    setPage(1)
  }, [query])

  const filtered = React.useMemo(() => {
    if (!searchable || !query.trim()) return data
    const q = query.trim().toLowerCase()

    return data.filter((row) => {
      return columns.some((col) => {
        const val =
          col.filterValue?.(row) ??
          toStr(typeof col.accessor(row) === "string" ? col.accessor(row) : col.sortValue?.(row))
        return toStr(val).includes(q)
      })
    })
  }, [data, columns, query, searchable])

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return filtered

    const dir = sortDir === "asc" ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [filtered, columns, sortKey, sortDir])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageData = React.useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, safePage, pageSize])

  function toggleSort(nextKey: string) {
    if (sortKey !== nextKey) {
      setSortKey(nextKey)
      setSortDir("asc")
      return
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
  }

  return (
    <div className="space-y-3">
      {title ? <div className="text-sm font-medium">{title}</div> : null}

      {searchable ? (
        <div className="flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <Input
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {total} row{total === 1 ? "" : "s"}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <thead>
            <tr>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.headerClassName}>
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-2 hover:underline"
                      title="Sort"
                    >
                      {c.header}
                      {sortKey === c.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {emptyText}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.accessor(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {safePage} / {totalPages}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
