import { useState, useCallback } from "react"
import { Table, TableHead, TableRow, TableCell } from "@shared/ui/table"
import { Badge } from "@shared/ui/badge"
import { Tooltip } from "@shared/ui/tooltip"
import { Chrome, Globe, Monitor, Copy, Check } from "lucide-react"
import type { LoginLogItem } from "../../types"
import { formatRelativeTime, formatFullTimestamp } from "@shared/utils/time"
import { getIpInfo } from "../../utils/ipInfo"
import { parseUserAgent } from "../../utils/userAgent"

const EVENT_BADGES: Record<string, { label: string; variant: "success" | "fail" | "info" | "muted" }> = {
  LOGIN_SUCCESS: { label: "SUCCESS", variant: "success" },
  LOGIN_FAIL: { label: "FAIL", variant: "fail" },
  REFRESH: { label: "REFRESH", variant: "info" },
  LOGOUT: { label: "LOGOUT", variant: "muted" },
}

function BrowserIcon({ browser }: { browser: string }) {
  const cn = "h-4 w-4 flex-shrink-0 text-muted-foreground"
  if (browser === "Chrome") return <Chrome className={cn} />
  if (browser === "Firefox" || browser === "Safari" || browser === "Edge" || browser === "Opera")
    return <Globe className={cn} />
  if (browser === "IE") return <Monitor className={cn} />
  return <Globe className={cn} />
}

function CopyButton({
  value,
  onCopied,
}: {
  value: string
  onCopied?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }, [value, onCopied])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 inline-flex rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      title={copied ? "Kopyalandı" : "Kopyala"}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

type Props = {
  data: LoginLogItem[]
  isLoading?: boolean
  page: number
  total: number
  pageSize: number
  onPageChange?: (page: number) => void
}

export function LoginLogsTable({
  data,
  isLoading,
  page,
  total,
  pageSize,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(total / pageSize) || 1

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Log kaydı bulunamadı.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <thead>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Olay</TableHead>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Tarayıcı / OS</TableHead>
          </TableRow>
        </thead>
        <tbody>
          {data.map((row) => {
            const badge = EVENT_BADGES[row.event_type] ?? { label: row.event_type, variant: "muted" as const }
            const ipInfo = getIpInfo(row.ip_address, row.meta as { x_forwarded_for?: string })
            const ua = parseUserAgent(row.user_agent)

            const userDisplay = row.user
              ? `${row.user.name || row.user.email} (${row.user.email})`
              : (row.meta as { email?: string })?.email
                ? `— (${(row.meta as { email?: string }).email})`
                : "—"

            const copyValue = row.user?.email ?? (row.meta as { email?: string })?.email ?? row.user?.id?.toString() ?? ""

            return (
              <TableRow key={row.id} className="hover:bg-muted/60 transition-colors">
                <TableCell className="whitespace-nowrap">
                  <Tooltip content={formatFullTimestamp(row.created_at)}>
                    <span className="cursor-default">{formatRelativeTime(row.created_at)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      {row.event_type === "LOGIN_SUCCESS"
                        ? "Başarılı Giriş"
                        : row.event_type === "LOGIN_FAIL"
                          ? "Başarısız Giriş"
                          : row.event_type === "LOGOUT"
                            ? "Çıkış"
                            : "Token Yenileme"}
                    </span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center">
                    {userDisplay}
                    {copyValue && (
                      <CopyButton value={copyValue} />
                    )}
                  </span>
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
                      <span className="inline-flex cursor-default items-center">
                        {row.ip_address}
                        <CopyButton value={row.ip_address} />
                      </span>
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
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Toplam {new Intl.NumberFormat("tr-TR").format(total)} kayıt
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Önceki
            </button>
            <span className="flex items-center px-3 py-1 text-sm">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
