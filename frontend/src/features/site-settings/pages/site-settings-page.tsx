import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Settings,
  Image as ImageIcon,
  Wrench,
  Mail,
  Shield,
  Plug,
  Check,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Switch } from "@shared/ui/switch"
import { Label } from "@shared/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/ui/tabs"
import { Badge } from "@shared/ui/badge"
import {
  getSiteSettings,
  patchSiteSettings,
  uploadBrandAsset,
  sendTestEmail,
  siteSettingsKeys,
} from "../api/siteSettingsApi"
import type { SiteSettings, SiteSettingsPatchPayload } from "../types"
import { SiteSettingsSkeleton } from "../components/site-settings-skeleton"
import { getErrorMessage } from "@shared/lib/toast-messages"
import { cn } from "@shared/utils/cn"

const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/svg+xml"

function toPatchPayload(s: SiteSettings): SiteSettingsPatchPayload {
  return {
    site_name: s.site_name,
    tagline: s.tagline,
    support_email: s.support_email,
    support_phone: s.support_phone,
    address: s.address,
    timezone: s.timezone,
    locale: s.locale,
    maintenance_enabled: s.maintenance_enabled,
    maintenance_message: s.maintenance_message,
    maintenance_allowed_ips: s.maintenance_allowed_ips,
    smtp_enabled: s.smtp_enabled,
    smtp_host: s.smtp_host,
    smtp_port: s.smtp_port,
    smtp_username: s.smtp_username,
    smtp_use_tls: s.smtp_use_tls,
    smtp_from_email: s.smtp_from_email,
    force_strong_passwords: s.force_strong_passwords,
    force_must_change_password_on_admin_reset: s.force_must_change_password_on_admin_reset,
    session_notice_enabled: s.session_notice_enabled,
    analytics_tracking_id: s.analytics_tracking_id,
    sentry_dsn: s.sentry_dsn,
  }
}

function isEqual(a: SiteSettingsPatchPayload, b: SiteSettingsPatchPayload): boolean {
  const keys = new Set([
    ...Object.keys(a || {}),
    ...Object.keys(b || {}),
  ]) as Set<keyof SiteSettingsPatchPayload>
  for (const k of keys) {
    if (k === "smtp_password") continue // not in payload from API
    const va = (a as Record<string, unknown>)?.[k]
    const vb = (b as Record<string, unknown>)?.[k]
    if (va !== vb) return false
  }
  return true
}

export function SiteSettingsPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState("general")
  const [form, setForm] = useState<SiteSettingsPatchPayload>({})
  const [smtpPassword, setSmtpPassword] = useState("")
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [testEmailTo, setTestEmailTo] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: original, isLoading, isError, refetch } = useQuery({
    queryKey: siteSettingsKeys.detail(),
    queryFn: getSiteSettings,
  })

  useEffect(() => {
    if (original) {
      setForm(toPatchPayload(original))
    }
  }, [original])

  const patchMut = useMutation({
    mutationFn: patchSiteSettings,
    onSuccess: (data) => {
      qc.setQueryData(siteSettingsKeys.detail(), data)
      setForm(toPatchPayload(data))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      toast.success("Ayarlar kaydedildi.")
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const dirty =
    original &&
    (!isEqual(form, toPatchPayload(original)) || smtpPassword.length > 0)
  const handleSave = useCallback(() => {
    const payload: SiteSettingsPatchPayload = { ...form }
    if (smtpPassword) payload.smtp_password = smtpPassword
    patchMut.mutate(payload)
    setSmtpPassword("")
  }, [form, smtpPassword, patchMut])

  const handleRevert = useCallback(() => {
    if (original) {
      setForm(toPatchPayload(original))
      setSmtpPassword("")
      toast.info("Değişiklikler geri alındı.")
    }
  }, [original])

  const updateForm = useCallback((updates: Partial<SiteSettingsPatchPayload>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleUpload = useCallback(
    async (field: "logo" | "logo_dark" | "favicon", file: File) => {
      setUploadingField(field)
      try {
        const updated = await uploadBrandAsset(field, file)
        qc.setQueryData(siteSettingsKeys.detail(), updated)
        toast.success("Görsel yüklendi.")
      } catch (e) {
        toast.error(getErrorMessage(e))
      } finally {
        setUploadingField(null)
      }
    },
    [qc]
  )

  const handleTestEmail = useCallback(async () => {
    if (!testEmailTo.trim()) {
      toast.error("Geçerli bir e-posta adresi girin.")
      return
    }
    setSendingTest(true)
    try {
      const res = await sendTestEmail(testEmailTo.trim())
      if (res.success) {
        toast.success("Test e-postası gönderildi.")
        setTestEmailTo("")
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      const msg = err?.response?.data?.message ?? getErrorMessage(e)
      toast.error(msg)
    } finally {
      setSendingTest(false)
    }
  }, [testEmailTo])

  if (isLoading) return <SiteSettingsSkeleton />
  if (isError || !original) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">Ayarlar yüklenemedi.</p>
          <Button variant="secondary" onClick={() => refetch()}>
          Tekrar Dene
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-7 w-7" />
            Site Ayarları
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Marka, bakım modu, SMTP ve güvenlik ayarlarını yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge variant="muted" className="gap-1">
              <Check className="h-3 w-3" />
              Güncellendi
            </Badge>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRevert}
            disabled={!dirty || patchMut.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Geri Al
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || patchMut.isPending}
          >
            {patchMut.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4 mr-2" />
            ) : null}
            Kaydet
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 border-b border-border rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="general">
            Genel
          </TabsTrigger>
          <TabsTrigger value="branding">Marka</TabsTrigger>
          <TabsTrigger value="maintenance">Bakım Modu</TabsTrigger>
          <TabsTrigger value="smtp">E-posta</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
          <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
        </TabsList>

        {/* Genel */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Genel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Adı</Label>
                  <Input
                    id="site_name"
                    value={form.site_name ?? ""}
                    onChange={(e) => updateForm({ site_name: e.target.value })}
                    placeholder="EDUMENTOR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Slogan</Label>
                  <Input
                    id="tagline"
                    value={form.tagline ?? ""}
                    onChange={(e) => updateForm({ tagline: e.target.value })}
                    placeholder="Örn. Öğrenmeyi Kolaylaştırıyoruz"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support_email">Destek E-postası</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={form.support_email ?? ""}
                    onChange={(e) => updateForm({ support_email: e.target.value })}
                    placeholder="destek@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_phone">Destek Telefonu</Label>
                  <Input
                    id="support_phone"
                    value={form.support_phone ?? ""}
                    onChange={(e) => updateForm({ support_phone: e.target.value })}
                    placeholder="+90 555 123 4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <textarea
                  id="address"
                  className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={form.address ?? ""}
                  onChange={(e) => updateForm({ address: e.target.value })}
                  placeholder="Firma adresi"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Saat Dilimi</Label>
                  <Input
                    id="timezone"
                    value={form.timezone ?? ""}
                    onChange={(e) => updateForm({ timezone: e.target.value })}
                    placeholder="Europe/Istanbul"
                  />
                  <p className="text-xs text-muted-foreground">Örn. Europe/Istanbul, UTC</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Yerel Ayar</Label>
                  <Input
                    id="locale"
                    value={form.locale ?? ""}
                    onChange={(e) => updateForm({ locale: e.target.value })}
                    placeholder="tr-TR"
                  />
                  <p className="text-xs text-muted-foreground">Örn. tr-TR, en-US</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marka */}
        <TabsContent value="branding" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo & Favicon
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Logo ve favicon görsellerini yükleyin. Her biri ayrı ayrı güncellenir.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-3">
                <BrandUploadSlot
                  label="Logo (Açık Tema)"
                  field="logo"
                  imageUrl={original.logo_url}
                  onUpload={handleUpload}
                  uploading={uploadingField === "logo"}
                  accept={ACCEPT_IMAGES}
                />
                <BrandUploadSlot
                  label="Logo (Koyu Tema)"
                  field="logo_dark"
                  imageUrl={original.logo_dark_url}
                  onUpload={handleUpload}
                  uploading={uploadingField === "logo_dark"}
                  accept={ACCEPT_IMAGES}
                />
                <BrandUploadSlot
                  label="Favicon"
                  field="favicon"
                  imageUrl={original.favicon_url}
                  onUpload={handleUpload}
                  uploading={uploadingField === "favicon"}
                  accept={ACCEPT_IMAGES}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bakım Modu */}
        <TabsContent value="maintenance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Bakım Modu
              </CardTitle>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mt-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Bakım modu açıldığında kullanıcılar 503 hatası görecek. Admin girişi ve ayarlar sayfası erişilebilir kalır.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Bakım Modunu Etkinleştir</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Siteyi ziyaretçilere kapatır.
                  </p>
                </div>
                <Switch
                  checked={form.maintenance_enabled ?? false}
                  onCheckedChange={(v) => updateForm({ maintenance_enabled: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance_message">Bakım Mesajı</Label>
                <textarea
                  id="maintenance_message"
                  className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={form.maintenance_message ?? ""}
                  onChange={(e) => updateForm({ maintenance_message: e.target.value })}
                  placeholder="Sistem bakımda. Lütfen daha sonra tekrar deneyin."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance_allowed_ips">İzin Verilen IP'ler (satır başına)</Label>
                <textarea
                  id="maintenance_allowed_ips"
                  className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-sm"
                  value={form.maintenance_allowed_ips ?? ""}
                  onChange={(e) => updateForm({ maintenance_allowed_ips: e.target.value })}
                  placeholder={'192.168.1.1\n10.0.0.1'}
                />
                <p className="text-xs text-muted-foreground">
                  Bu IP'ler bakım modunda da siteye erişebilir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-posta (SMTP)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>SMTP Etkin</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Özelleştirilmiş SMTP ile e-posta gönder.
                  </p>
                </div>
                <Switch
                  checked={form.smtp_enabled ?? false}
                  onCheckedChange={(v) => updateForm({ smtp_enabled: v })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={form.smtp_host ?? ""}
                    onChange={(e) => updateForm({ smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    disabled={!form.smtp_enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    min={1}
                    max={65535}
                    value={form.smtp_port ?? 587}
                    onChange={(e) =>
                      updateForm({ smtp_port: e.target.value ? parseInt(e.target.value, 10) : 587 })
                    }
                    disabled={!form.smtp_enabled}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Kullanıcı Adı</Label>
                  <Input
                    id="smtp_username"
                    value={form.smtp_username ?? ""}
                    onChange={(e) => updateForm({ smtp_username: e.target.value })}
                    placeholder="user@example.com"
                    disabled={!form.smtp_enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="smtp_password"
                      type={showSmtpPassword ? "text" : "password"}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="Güncellemek için yeni şifre girin"
                      disabled={!form.smtp_enabled}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      tabIndex={-1}
                    >
                      {showSmtpPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Backend şifreyi döndürmez. Değiştirmek için buraya yazın.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_from_email">Gönderen E-posta</Label>
                <Input
                  id="smtp_from_email"
                  type="email"
                  value={form.smtp_from_email ?? ""}
                  onChange={(e) => updateForm({ smtp_from_email: e.target.value })}
                  placeholder="noreply@example.com"
                  disabled={!form.smtp_enabled}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.smtp_use_tls ?? true}
                  onCheckedChange={(v) => updateForm({ smtp_use_tls: v })}
                  disabled={!form.smtp_enabled}
                />
                <Label>TLS Kullan</Label>
              </div>

              {/* Test Mail */}
              <div className="mt-6 rounded-lg border border-border p-4">
                <Label className="text-base">Test Mail Gönder</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  SMTP ayarlarınızı test edin.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    type="email"
                    placeholder="E-posta adresi"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    className="max-w-xs"
                    disabled={!form.smtp_enabled || sendingTest}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleTestEmail}
                    disabled={!form.smtp_enabled || sendingTest}
                  >
                    {sendingTest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Gönder"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Güvenlik */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Güvenlik & Oturum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Güçlü Şifre Zorunluluğu</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kullanıcıların karmaşık şifre oluşturmasını zorunlu kılar.
                  </p>
                </div>
                <Switch
                  checked={form.force_strong_passwords ?? true}
                  onCheckedChange={(v) => updateForm({ force_strong_passwords: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Admin Şifre Sıfırlamada Zorunlu Değişiklik</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Admin tarafından şifre sıfırlanan kullanıcı ilk girişte şifre değiştirmek zorunda.
                  </p>
                </div>
                <Switch
                  checked={form.force_must_change_password_on_admin_reset ?? true}
                  onCheckedChange={(v) =>
                    updateForm({ force_must_change_password_on_admin_reset: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Oturum Bildirimi</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Oturum süresi ve güvenlik bildirimleri (placeholder).
                  </p>
                </div>
                <Switch
                  checked={form.session_notice_enabled ?? true}
                  onCheckedChange={(v) => updateForm({ session_notice_enabled: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entegrasyonlar */}
        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Entegrasyonlar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Analytics ve hata izleme servisleri.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analytics_tracking_id">Analytics Tracking ID</Label>
                <Input
                  id="analytics_tracking_id"
                  value={form.analytics_tracking_id ?? ""}
                  onChange={(e) => updateForm({ analytics_tracking_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sentry_dsn">Sentry DSN</Label>
                <Input
                  id="sentry_dsn"
                  type="password"
                  value={form.sentry_dsn ?? ""}
                  onChange={(e) => updateForm({ sentry_dsn: e.target.value })}
                  placeholder="https://xxx@xxx.ingest.sentry.io/xxx"
                />
                <p className="text-xs text-muted-foreground">
                  Hata izleme için Sentry DSN (güvenli saklanır).
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Bu entegrasyonlar şu an placeholder olarak saklanır. İleride frontend ve backend'de kullanılacak.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BrandUploadSlot({
  label,
  field,
  imageUrl,
  onUpload,
  uploading,
  accept,
}: {
  label: string
  field: "logo" | "logo_dark" | "favicon"
  imageUrl: string | null
  onUpload: (f: "logo" | "logo_dark" | "favicon", file: File) => void
  uploading: boolean
  accept: string
}) {
  const inputId = `upload-${field}`
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed min-h-[140px] overflow-hidden",
          "border-border hover:border-primary/50 transition-colors",
          uploading && "opacity-60"
        )}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(field, f)
            e.target.value = ""
          }}
          disabled={uploading}
        />
        {uploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="max-h-32 max-w-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
            <span className="text-sm">Yükle</span>
          </div>
        )}
      </div>
    </div>
  )
}
