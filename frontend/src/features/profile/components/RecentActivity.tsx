import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableHead, TableRow, TableCell } from "@shared/ui/table"
import { Badge } from "@shared/ui/badge"
import { Tooltip } from "@shared/ui/tooltip"
import { Button } from "@shared/ui/button"
import { profileApi } from "../api/profileApi"
import type { AuthEventItem } from "../types"
import { formatRelativeTime, formatFullTimestamp } from "@shared/utils/time"
import { getIpInfo } from "@features/reports/utils/ipInfo"
import { parseUserAgent } from "@features/reports/utils/userAgent"
import { RefreshCw, Chrome, Globe, Monitor } from "lucide-react"

const EVENT_BADGES: Record<string, { label: string; variant: "success" | "fail" | "info" | "muted" }> = {
  LOGIN_SUCCESS: { label: "Başarılı Giriş", variant: "success" },
  LOGIN_FAIL: { label: "Başarısız Giriş", variant: "fail" },
  REFRESH: { label: "Token Yenileme", variant: "info" },
  LOGOUT: { label: "Çıkış", variant: "muted" },
}

const DAYS_OPTIONS = [
  { days: 7, label: "Son 7 gün" },
  { days: 30, label: "Son 30 gün" },
  { days: 90, label: "Son 90 gün" },
] as const

function BrowserIcon({ browser }: { browser: string }) {
  const cn = "h-4 w-4 flex-shrink-0 text-muted-foreground"
  if (browser === "Chrome") return <Chrome className={cn} />
  if (browser === "Firefox" || browser === "Safari" || browser === "Edge" || browser === "Opera")
    return <Globe className={cn} />
  if (browser === "IE") return <Monitor className={cn} />
  return <Globe className={cn} />
}

export function RecentActivity() {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["profile", "events", days, page, pageSize],
    queryFn: () => profileApi.getEvents({ days, page, page_size: pageSize }),
  })

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const totalPages = data ? Math.ceil(data.total / pageSize) || 1 : 1

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold">Son Aktiviteler</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {DAYS_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => {
                setDays(opt.days)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === opt.days
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Bu dönemde aktivite kaydı bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <thead>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Olay</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Tarayıcı / OS</TableHead>
              </TableRow>
            </thead>
            <tbody>
              {data.items.map((row: AuthEventItem) => {
                const badge = EVENT_BADGES[row.event_type] ?? { label: row.event_type, variant: "muted" as const }
                const ipInfo = getIpInfo(row.ip_address, row.meta as { x_forwarded_for?: string })
                const ua = parseUserAgent(row.user_agent)
                return (
                  <TableRow key={row.id} className="hover:bg-muted/60 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <Tooltip content={row.created_at ? formatFullTimestamp(row.created_at) : ""}>
                        <span className="cursor-default">{row.created_at ? formatRelativeTime(row.created_at) : "—"}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.ip_address ? (
                        <Tooltip
                          content={
                            <div className="space-y-0.5">
                              <div>{ipInfo?.label ?? row.ip_address}</div>
                              {ipInfo?.proxyHint && (
                                <div className="text-amber-600 dark:text-amber-400">{ipInfo.proxyHint}</div>
                              )}
                            </div>
                          }
                        >
                          <span className="inline-flex cursor-default items-center">{row.ip_address}</span>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {row.user_agent ? (
                        <Tooltip content={row.user_agent}>
                          <div className="flex max-w-[180px] items-center gap-2 truncate">
                            <BrowserIcon browser={ua.browser} />
                            <span className="truncate text-sm">{ua.label}</span>
                          </div>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </tbody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Toplam {new Intl.NumberFormat("tr-TR").format(data.total)} kayıt
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Önceki
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
