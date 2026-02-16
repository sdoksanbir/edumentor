/**
 * Türkçe locale uyumlu ilk harf büyütme.
 * "matematik" => "Matematik", "istanbul" => "İstanbul", "ışık" => "Işık"
 */
export function trCapitalizeFirst(s: string): string {
  const t = s.trim().replace(/\s+/g, " ")
  if (!t) return ""
  const first = t[0]
  const firstUp =
    first === "i"
      ? "İ"
      : first === "ı"
        ? "I"
        : first.toLocaleUpperCase("tr-TR")
  return firstUp + t.slice(1)
}
