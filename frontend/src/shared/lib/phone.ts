/**
 * Sadece rakamları döndürür.
 */
export function digitsOnly(s: string): string {
  return (s ?? "").replace(/\D/g, "")
}

export type ValidateTrGsmResult =
  | { ok: true }
  | { ok: false; code: "NOT_TR_GSM" }
  | { ok: false; code: "INCOMPLETE" }

/**
 * TR GSM formatı (05XXXXXXXXX, 11 hane) validasyonu.
 * - 11 hane değilse => INCOMPLETE
 * - 05 ile başlamıyorsa => NOT_TR_GSM
 */
export function validateTrGsmPhone(masked: string): ValidateTrGsmResult {
  const d = digitsOnly(masked ?? "")
  if (d.length === 0) return { ok: true }
  let digits = d
  if (digits.length === 12 && digits.startsWith("90")) digits = "0" + digits.slice(2)
  if (digits.length !== 11) return { ok: false, code: "INCOMPLETE" }
  if (digits[0] !== "0" || digits[1] !== "5") return { ok: false, code: "NOT_TR_GSM" }
  return { ok: true }
}

/**
 * Telefon validasyonu: hata varsa mesaj döner, yoksa null.
 * - 5 ile başlamıyorsa: "Geçerli bir telefon numarası giriniz"
 * - Eksik rakam varsa: "Hatalı ya da eksik numara girdiniz"
 */
export function getTrPhoneValidationError(phone: string): string | null {
  if (!phone || typeof phone !== "string") return null
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 0) return null
  let d = digits
  if (d.length === 12 && d.startsWith("90")) d = d.slice(2)
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1)
  else if (d.length !== 10) return "Hatalı ya da eksik numara girdiniz"
  if (d[0] !== "5") return "Geçerli bir telefon numarası giriniz"
  return null
}

/**
 * Türkiye telefon numarasını 0(5xx) xxx xx xx formatına normalize eder.
 * Submit öncesi frontend'de kullanılır (backend zaten normalize ediyor).
 */
export function normalizeTrPhone(s: string): string {
  if (!s || typeof s !== "string") return ""
  const digits = s.replace(/\D/g, "")
  if (digits.length === 0) return ""
  let d = digits
  if (d.length === 12 && d.startsWith("90")) d = d.slice(2)
  if (d.length === 10 && !d.startsWith("0")) d = "0" + d
  if (d.length !== 11) return s
  return `0(${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`
}
