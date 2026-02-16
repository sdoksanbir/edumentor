export type SiteSettings = {
  id: number
  site_name: string
  tagline: string
  support_email: string
  support_phone: string
  address: string
  timezone: string
  locale: string
  logo_url: string | null
  logo_dark_url: string | null
  favicon_url: string | null
  maintenance_enabled: boolean
  maintenance_message: string
  maintenance_allowed_ips: string
  smtp_enabled: boolean
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_use_tls: boolean
  smtp_from_email: string
  force_strong_passwords: boolean
  force_must_change_password_on_admin_reset: boolean
  session_notice_enabled: boolean
  analytics_tracking_id: string
  sentry_dsn: string
  updated_at: string
  updated_by: number | null
}

export type SiteSettingsPatchPayload = Partial<{
  site_name: string
  tagline: string
  support_email: string
  support_phone: string
  address: string
  timezone: string
  locale: string
  maintenance_enabled: boolean
  maintenance_message: string
  maintenance_allowed_ips: string
  smtp_enabled: boolean
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_use_tls: boolean
  smtp_from_email: string
  force_strong_passwords: boolean
  force_must_change_password_on_admin_reset: boolean
  session_notice_enabled: boolean
  analytics_tracking_id: string
  sentry_dsn: string
}>

export type BrandAssetField = "logo" | "logo_dark" | "favicon"
