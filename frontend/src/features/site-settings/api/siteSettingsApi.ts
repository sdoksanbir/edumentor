import { apiClient } from "@shared/api/client"
import type { SiteSettings, SiteSettingsPatchPayload, BrandAssetField } from "../types"

export const siteSettingsKeys = {
  all: ["admin", "site-settings"] as const,
  detail: () => [...siteSettingsKeys.all, "detail"] as const,
}

/** GET site settings (id=1 singleton) */
export async function getSiteSettings(): Promise<SiteSettings> {
  const res = await apiClient.get<SiteSettings>("/admin/settings/site/")
  return res.data
}

/** PATCH site settings */
export async function patchSiteSettings(
  payload: SiteSettingsPatchPayload
): Promise<SiteSettings> {
  const res = await apiClient.patch<SiteSettings>("/admin/settings/site/", payload)
  return res.data
}

/** Upload brand asset (logo, logo_dark, favicon) */
export async function uploadBrandAsset(
  field: BrandAssetField,
  file: File
): Promise<SiteSettings> {
  const formData = new FormData()
  formData.append(field, file)
  const res = await apiClient.post<SiteSettings>(
    "/admin/settings/site/upload/",
    formData
  )
  return res.data
}

/** Send test email */
export async function sendTestEmail(to_email: string): Promise<{ success: boolean }> {
  const res = await apiClient.post<{ success: boolean; message?: string }>(
    "/admin/settings/site/test-email/",
    { to_email }
  )
  return res.data
}
