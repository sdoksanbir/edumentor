import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Download } from "lucide-react"
import type { DateRangePreset } from "../types"

type ReportFiltersProps = {
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  preset: DateRangePreset
  onPresetChange: (v: DateRangePreset) => void
  search?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  onExportCsv?: () => void
  exportLoading?: boolean
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: "7", label: "Son 7 gün" },
  { value: "30", label: "Son 30 gün" },
  { value: "90", label: "Son 90 gün" },
  { value: "custom", label: "Özel" },
]

export function ReportFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  preset,
  onPresetChange,
  search = "",
  onSearchChange,
  searchPlaceholder = "Ara...",
  showSearch = false,
  onExportCsv,
  exportLoading = false,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        {presets.map((p) => (
          <Button
            key={p.value}
            variant={preset === p.value ? "primary" : "secondary"}
            size="sm"
            onClick={() => onPresetChange(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-[140px]"
          />
        </div>
      )}
      {showSearch && onSearchChange && (
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-[200px]"
        />
      )}
      {onExportCsv && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onExportCsv}
          disabled={exportLoading}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV İndir
        </Button>
      )}
    </div>
  )
}
