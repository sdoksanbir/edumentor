/**
 * Tutarlı, kullanıcı dostu Türkçe toast mesajları için helper'lar.
 */

export function getCreateSuccessMessage(entityLabel: string, name: string): string {
  return `"${name}" ${entityLabel} başarıyla oluşturuldu.`
}

export function getUpdateSuccessMessage(entityLabel: string, name: string): string {
  return `"${name}" ${entityLabel} güncellendi.`
}

export function getToggleSuccessMessage(
  entityLabel: string,
  name: string,
  isActive: boolean
): string {
  if (isActive) {
    return `"${name}" ${entityLabel} aktif hale getirildi.`
  }
  return `"${name}" ${entityLabel} pasif duruma alındı.`
}

export function getDeleteSuccessMessage(entityLabel: string, name: string): string {
  return `"${name}" ${entityLabel} silindi.`
}

export function getBulkCreateSuccessMessage(
  entityLabel: string,
  createdCount: number,
  skippedCount: number
): string {
  if (skippedCount > 0) {
    return `${createdCount} ${entityLabel} eklendi, ${skippedCount} ${entityLabel} zaten mevcut olduğu için atlandı.`
  }
  return `${createdCount} ${entityLabel} başarıyla eklendi.`
}

export function getBulkDeleteSuccessMessage(
  _entityLabel: string,
  deletedCount: number
): string {
  return `${deletedCount} kayıt silindi.`
}

export function getBulkDeletePartialMessage(
  deletedCount: number,
  failedCount: number
): string {
  return `${deletedCount} kayıt silindi, ${failedCount} kayıt silinemedi.`
}

export function getBulkDeleteErrorMessage(): string {
  return "Silme işlemi başarısız oldu. Lütfen tekrar deneyin."
}

const GENERIC_ERROR_MESSAGE = "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin."

function extractErrorFromApi(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: unknown } }).response
    const data = res?.data
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>
      if ("detail" in d) {
        const detail = d.detail
        if (typeof detail === "string") return detail
        if (Array.isArray(detail) && detail.length > 0 && typeof detail[0] === "string")
          return detail[0]
      }
      if ("message" in d && typeof d.message === "string") return d.message
      const first = Object.values(d)[0]
      if (Array.isArray(first)) return (first as string[])[0] ?? GENERIC_ERROR_MESSAGE
      if (typeof first === "string") return first
    }
    if (typeof data === "string" && data.trim().length > 0) return data
  }
  if (err instanceof Error && err.message) return err.message
  return GENERIC_ERROR_MESSAGE
}

/** Billing hatası - STUDENT_LIMIT_REACHED veya NO_SUBSCRIPTION */
export function getStudentLimitError(err: unknown): {
  isLimitReached: boolean
  isNoSubscription: boolean
  limit?: number
  current?: number
  message?: string
} {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: unknown } }).response
    const data = res?.data
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>
      if (d.code === "STUDENT_LIMIT_REACHED") {
        return {
          isLimitReached: true,
          isNoSubscription: false,
          limit: typeof d.limit === "number" ? d.limit : undefined,
          current: typeof d.current === "number" ? d.current : undefined,
          message: typeof d.message === "string" ? d.message : undefined,
        }
      }
      if (d.code === "NO_SUBSCRIPTION") {
        return {
          isLimitReached: false,
          isNoSubscription: true,
          message: typeof d.message === "string" ? d.message : undefined,
        }
      }
    }
  }
  return { isLimitReached: false, isNoSubscription: false }
}

/** LIMIT_TOO_LOW hatası - plan düşürülemez */
export function getLimitTooLowError(err: unknown): {
  isLimitTooLow: boolean
  current?: number
  limit?: number
} {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: unknown } }).response
    const data = res?.data
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>
      if (d.code === "LIMIT_TOO_LOW") {
        return {
          isLimitTooLow: true,
          current: typeof d.current === "number" ? d.current : undefined,
          limit: typeof d.limit === "number" ? d.limit : undefined,
        }
      }
    }
  }
  return { isLimitTooLow: false }
}

/**
 * API hatalarını parse edip kullanıcıya gösterilecek mesaja çevirir.
 * Backend validation hatası varsa onu, yoksa genel hata mesajını döndürür.
 */
export function getErrorMessage(err: unknown): string {
  const msg = extractErrorFromApi(err)
  return typeof msg === "string" && msg.trim().length > 0 ? msg : GENERIC_ERROR_MESSAGE
}
