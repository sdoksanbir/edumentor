# Karar Verilebilir Metrikler — Özet

## 1) Login Logları Premium UX

### Eklenen Dosyalar
- `frontend/src/shared/utils/time.ts` — formatRelativeTime, formatFullTimestamp
- `frontend/src/shared/ui/tooltip/tooltip.tsx` — Tooltip bileşeni
- `frontend/src/shared/ui/badge/badge.tsx` — Badge bileşeni
- `frontend/src/features/reports/utils/ipInfo.ts` — IP sınıflandırması
- `frontend/src/features/reports/utils/userAgent.ts` — User agent parser

### Değişen Dosyalar
- `frontend/src/features/reports/components/tables/LoginLogsTable.tsx` — Premium UX
- `frontend/src/features/reports/pages/reports-page.tsx` — Canlı toggle, Switch
- `backend/accounts/utils/auth_logging.py` — meta.x_forwarded_for ekleme

### Özellikler
- Event badge: SUCCESS (yeşil), FAIL (kırmızı), REFRESH (mavi), LOGOUT (gri)
- IP tooltip: Yerel / Özel Ağ / Genel IP / IPv6 + "Proxy olabilir"
- User Agent: Browser/OS ikon + kısa label, tooltip’te tam UA
- Relative time: "5 dk önce" + tooltip’te tam timestamp
- Canlı toggle: 30 sn otomatik refetch
- Satır hover, IP/email kopyala butonu

---

## 2) Backend Endpointleri

| Endpoint | Dosya |
|----------|-------|
| `GET /api/admin/reports/risky-teachers/` | `backend/accounts/admin_reports_views.py` |
| `GET /api/admin/reports/inactive-students/` | `backend/accounts/admin_reports_views.py` |

### URL Wiring
- `backend/accounts/admin_urls.py` — path eklemeleri

---

## 3) Frontend Uyarılar Tabı

### Eklenen Dosyalar
- `frontend/src/features/reports/components/tables/RiskyTeachersTable.tsx`
- `frontend/src/features/reports/components/tables/InactiveStudentsTable.tsx`

### Değişen Dosyalar
- `frontend/src/features/reports/pages/reports-page.tsx` — Uyarılar tabı
- `frontend/src/features/reports/api/reportsApi.ts` — fetchRiskyTeachers, fetchInactiveStudents
- `frontend/src/features/reports/types.ts` — RiskyTeacherItem, InactiveStudentItem

### Özellikler
- **Riskli Öğretmenler**: Tablo + risk skoru progress bar + satıra tıklayınca pasif öğrenci drawer
- **Pasif Öğrenciler**: Tablo, gün seçici (7/14/30), öğretmen filtresi
- Risk renkleri: 0–39 düşük, 40–69 orta, 70–100 yüksek

---

## 4) Metrik Gerçek / Proxy Notları

| Metrik | Kaynak | Açıklama |
|--------|--------|----------|
| **Risk Skoru** | Gerçek | AuthEventLog (LOGIN_SUCCESS), must_change_password, StudentProfile ilişkisi |
| **Pasif öğrenci** | Gerçek | AuthEventLog son LOGIN_SUCCESS tarihi |
| **Pasif oran** | Gerçek | Pasif öğrenci / toplam öğrenci |
| **Şifre değiştir oranı** | Gerçek | User.must_change_password |
| **Öğretmen 14 gün giriş** | Gerçek | AuthEventLog LOGIN_SUCCESS sayısı |
| **Kurs kullanımı (önceki)** | Proxy | topics_count, related_teachers_count — gerçek kullanım için enrollment/progress tablosu gerekir |
