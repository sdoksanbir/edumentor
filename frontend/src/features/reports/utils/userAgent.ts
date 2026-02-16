/**
 * Lightweight user agent parser – browser ve OS.
 * Ekstra kütüphane yok.
 */

export type ParsedUserAgent = {
  browser: string
  os: string
  label: string  // "Chrome · macOS"
}

const BROWSERS = [
  { pattern: /Edg\//i, name: "Edge" },
  { pattern: /OPR\//i, name: "Opera" },
  { pattern: /Chrome/i, name: "Chrome" },
  { pattern: /Safari/i, name: "Safari" },
  { pattern: /Firefox/i, name: "Firefox" },
  { pattern: /MSIE|Trident/i, name: "IE" },
]

const OS_PATTERNS = [
  { pattern: /Windows NT 10/i, name: "Windows" },
  { pattern: /Windows NT 6\.[23]/i, name: "Windows" },
  { pattern: /Windows/i, name: "Windows" },
  { pattern: /Mac OS X/i, name: "macOS" },
  { pattern: /Macintosh/i, name: "macOS" },
  { pattern: /Linux/i, name: "Linux" },
  { pattern: /Android/i, name: "Android" },
  { pattern: /iPhone|iPad|iPod/i, name: "iOS" },
]

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  const s = ua ?? ""
  let browser = "Other"
  let os = "Other"

  for (const b of BROWSERS) {
    if (b.pattern.test(s)) {
      browser = b.name
      break
    }
  }

  for (const o of OS_PATTERNS) {
    if (o.pattern.test(s)) {
      os = o.name
      break
    }
  }

  return {
    browser,
    os,
    label: `${browser} · ${os}`,
  }
}
