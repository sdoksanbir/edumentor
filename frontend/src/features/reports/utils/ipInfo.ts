/**
 * IP adresi sınıflandırması (frontend, basit regex/startsWith).
 * Tooltip için etiket üretir.
 */

export type IpInfo = {
  label: string
  proxyHint?: string
}

export function getIpInfo(ip: string | null, meta?: { x_forwarded_for?: string } | null): IpInfo | null {
  if (!ip || !ip.trim()) return null

  let label: string
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.")) {
    label = "Yerel"
  } else if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.") || /^172\.(2[0-9]|3[01])\./.test(ip)) {
    label = "Özel Ağ"
  } else if (ip.includes(":")) {
    label = "IPv6"
  } else {
    label = "Genel IP"
  }

  const proxyHint = meta?.x_forwarded_for ? "Proxy olabilir" : undefined

  return { label: `${label} (${ip})`, proxyHint }
}
