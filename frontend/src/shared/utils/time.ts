/**
 * Lightweight relative time and timestamp formatting.
 * date-fns yok, basit implementasyon.
 */

export function formatRelativeTime(isoString: string, locale = "tr-TR"): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 5) return "Az önce"
    if (diffSec < 60) return `${diffSec} sn önce`
    if (diffMin < 60) return `${diffMin} dk önce`
    if (diffHour < 24) return `${diffHour} saat önce`
    if (diffDay === 1) return "Dün"
    if (diffDay < 7) return `${diffDay} gün önce`
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} hafta önce`
    return date.toLocaleDateString(locale, { dateStyle: "short" })
  } catch {
    return isoString
  }
}

export function formatFullTimestamp(isoString: string, locale = "tr-TR"): string {
  try {
    const date = new Date(isoString)
    const offset = -date.getTimezoneOffset()
    const offsetHours = Math.floor(Math.abs(offset) / 60)
    const offsetMins = Math.abs(offset) % 60
    const sign = offset >= 0 ? "+" : "-"
    const tz = `UTC${sign}${String(offsetHours).padStart(2, "0")}:${String(offsetMins).padStart(2, "0")}`
    return `${date.toLocaleString(locale, { dateStyle: "short", timeStyle: "medium" })} (${tz})`
  } catch {
    return isoString
  }
}
