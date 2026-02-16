# Site Ayarları Modülü - Özet

## A) BACKEND (Django / DRF)

### A1) Model: SiteSettings (singleton)

**Dosya: `backend/site_settings/models.py`**

- `id` (pk, her zaman 1)
- Genel: site_name, tagline, support_email, support_phone, address, timezone, locale
- Branding: logo, logo_dark, favicon (ImageField, upload_to="branding/")
- Maintenance: maintenance_enabled, maintenance_message, maintenance_allowed_ips
- SMTP: smtp_enabled, smtp_host, smtp_port, smtp_username, smtp_password, smtp_use_tls, smtp_from_email
- Security: force_strong_passwords, force_must_change_password_on_admin_reset, session_notice_enabled
- Integrations: analytics_tracking_id, sentry_dsn
- Audit: updated_at, updated_by (FK User)

**Migration:** `0002_create_singleton.py` ile id=1 singleton oluşturulur.

### A2) Permission

- `IsAdminOnly`: `user.role == "ADMIN"` veya `is_staff` veya `is_superuser`

### A3) API Endpoints

| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/admin/settings/site/` | id=1 ayarlarını döndür |
| PATCH | `/api/admin/settings/site/` | Ayarları güncelle |
| POST | `/api/admin/settings/site/upload/` | logo / logo_dark / favicon upload |
| POST | `/api/admin/settings/site/test-email/` | Test mail gönder |

#### Örnekler

**GET /api/admin/settings/site/**
```json
{
  "id": 1,
  "site_name": "EDUMENTOR",
  "tagline": "",
  "support_email": "",
  "logo_url": "http://127.0.0.1:8000/media/branding/logo.png",
  "maintenance_enabled": false,
  "smtp_enabled": false,
  ...
}
```

**PATCH /api/admin/settings/site/**
```json
{
  "site_name": "EDUMENTOR Pro",
  "maintenance_enabled": true
}
```

**POST /api/admin/settings/site/upload/**
```
Content-Type: multipart/form-data
Body: logo=<file> | logo_dark=<file> | favicon=<file>
```

**POST /api/admin/settings/site/test-email/**
```json
{
  "to_email": "test@example.com"
}
```
- 200: `{ "success": true }`
- 400: `{ "success": false, "message": "..." }`

### A4) Maintenance Middleware

**Dosya: `backend/site_settings/middleware.py`**

- `maintenance_enabled=true` ise tüm isteklere 503 döner
- Bypass: `/api/auth/login/`, `/api/admin/settings/`, `/admin/`, `/api/health/`, `/media/`, `/static/`
- `maintenance_allowed_ips` içindeki IP'ler bypass edilir
- Response: `{ "detail": "<maintenance_message>", "code": "MAINTENANCE" }`

### A5) Güvenlik Notu (SMTP Password)

- Serializer GET'te `smtp_password` döndürmez
- PATCH'te `smtp_password` gelirse güncellenir; gelmezse mevcut değer korunur

---

## B) FRONTEND (React / Vite / TS)

### B1) Route & Menu

- **Route:** `/panel/settings/site` → `SiteSettingsPage`
- **Menu:** Admin sidebar → "Ayarlar" → "Site Ayarları"
- **Guard:** `AdminRoute` (sadece ADMIN erişebilir)

### B2) Dosya Yapısı

```
frontend/src/
├── features/site-settings/
│   ├── api/siteSettingsApi.ts
│   ├── types.ts
│   ├── components/site-settings-skeleton.tsx
│   └── pages/site-settings-page.tsx
├── shared/ui/
│   ├── tabs/           (yeni)
│   └── label/          (yeni)
```

### B3) Sekmeler

1. **Genel** – site_name, tagline, support_email, support_phone, address, timezone, locale
2. **Marka** – Logo (açık), Logo (koyu), Favicon upload + önizleme
3. **Bakım Modu** – maintenance_enabled, maintenance_message, maintenance_allowed_ips
4. **E-posta** – SMTP ayarları + Test Mail Gönder
5. **Güvenlik** – force_strong_passwords, force_must_change_password_on_admin_reset, session_notice_enabled
6. **Entegrasyonlar** – analytics_tracking_id, sentry_dsn

### B4) UX

- Skeleton loading
- Error state + "Tekrar Dene"
- Kaydet / Geri Al (dirty state)
- Toast: kayıt, hata, test mail
- SMTP şifre: göster/gizle, "Güncellemek için yeni şifre girin"

---

## C) TEST ADIMLARI

1. Admin ile giriş yap → `/panel/settings/site` açılmalı
2. Teacher ile giriş yap → `/panel/settings/site` → 403 / yönlendirme
3. Genel ayar kaydet → GET ile güncellenmiş mi kontrol et
4. Logo upload → Response'ta logo URL dönüyor mu? UI önizlemesi güncelleniyor mu?
5. Bakım modu aç → Public endpoint 503 dönüyor mu?
6. SMTP test: `smtp_enabled=false` → 400, `smtp_enabled=true` → Mail gönderiliyor mu?

---

## D) DEĞİŞEN DOSYALAR LİSTESİ

### Backend (Yeni)
- `backend/site_settings/` (yeni app)
  - `models.py`
  - `serializers.py`
  - `views.py`
  - `urls.py`
  - `middleware.py`
  - `migrations/0001_initial_site_settings.py`
  - `migrations/0002_create_singleton.py`

### Backend (Güncellenen)
- `backend/config/settings.py` – INSTALLED_APPS, MIDDLEWARE
- `backend/config/urls.py` – site_settings url’i

### Frontend (Yeni)
- `frontend/src/features/site-settings/types.ts`
- `frontend/src/features/site-settings/api/siteSettingsApi.ts`
- `frontend/src/features/site-settings/components/site-settings-skeleton.tsx`
- `frontend/src/features/site-settings/pages/site-settings-page.tsx`
- `frontend/src/shared/ui/tabs/tabs.tsx`
- `frontend/src/shared/ui/tabs/index.ts`
- `frontend/src/shared/ui/label/label.tsx`
- `frontend/src/shared/ui/label/index.ts`

### Frontend (Güncellenen)
- `frontend/src/app/routes.tsx` – route eklendi
- `frontend/src/app/layout/sidebar/menus/admin.menu.ts` – "Ayarlar" menüsü eklendi
