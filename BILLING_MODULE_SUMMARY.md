# Abonelik (Billing) Modülü - Özet

## A) BACKEND (Django / DRF)

### A1) Yeni App: billing

**Modeller (`backend/billing/models.py`):**
- **Plan**: code, name, student_limit, price_monthly, price_yearly, currency, is_active, features
- **Subscription**: teacher (OneToOne), plan, status (TRIALING/ACTIVE/EXPIRED/CANCELED), current_period_start/end, trial_end, student_limit_snapshot
- **SubscriptionEvent**: subscription, event_type, payload (audit log)

**Migrations:**
- `billing/migrations/0001_initial.py` – tablolar
- `billing/migrations/0002_seed_default_plans.py` – STARTER_10, PRO_20, PREMIUM_30 seed

**Management Command:**
- `python manage.py expire_subscriptions` – süresi dolan abonelikleri EXPIRED yapar (günlük cron)

### A2) API Endpoints

**Admin-only (`/api/admin/billing/`):**
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/plans/` | Plan listesi (search, is_active) |
| POST | `/plans/` | Plan oluştur |
| GET | `/plans/<id>/` | Plan detay |
| PATCH | `/plans/<id>/` | Plan güncelle |
| DELETE | `/plans/<id>/` | Plan pasif yap (soft) |
| GET | `/subscriptions/` | Abonelik listesi (status, plan, teacher, expiring_soon) |
| POST | `/subscriptions/` | Abonelik ata (UPSERT: mevcut varsa güncelle) |
| GET | `/subscriptions/<id>/` | Abonelik detay |
| PATCH | `/subscriptions/<id>/` | Plan değiştir, süre uzat, cancel_at_period_end |
| POST | `/subscriptions/<id>/cancel/` | Hemen iptal |
| POST | `/subscriptions/<id>/reactivate/` | Yeniden aktifleştir (body: extend_days) |
| POST | `/subscriptions/<id>/renew/` | 30 gün yenile |
| GET | `/teachers/<teacher_profile_id>/subscription/` | Öğretmen abonelik bilgisi |

**Teacher self (`/api/billing/`):**
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/me/subscription/` | Kendi aboneliği + kullanım |

### A3) Kota Kontrolü

- `TeacherAssignStudentsView` içinde `_check_teacher_quota` ile kontrol
- Abonelik yoksa veya limit doluysa 400:
  - `NO_SUBSCRIPTION`: Öğretmenin aktif aboneliği yok
  - `STUDENT_LIMIT_REACHED`: limit, current ile birlikte

---

## B) FRONTEND (React / Vite / TS)

### B1) Routes & Menü

- **Menü:** Abonelikler → Plan Yönetimi (`/panel/billing/plans`), Abonelikler (`/panel/billing/subscriptions`)
- **Routes:** `/panel/billing/plans`, `/panel/billing/subscriptions`

### B2) Dosya Listesi

```
frontend/src/features/billing/
├── api/
│   └── billingApi.ts
├── components/
│   └── subscription-card.tsx
├── pages/
│   ├── plans-page.tsx
│   └── subscriptions-page.tsx
└── types.ts
```

### B3) Özellikler

- **PlansPage:** Tablo, CRUD modal, aktif/pasif filtre
- **SubscriptionsPage:** Filtreler, tablo, "Yeni Abonelik Ata" modal, detay drawer (uzat, yenile, iptal)
- **SubscriptionCard:** Öğretmen detay sayfasında abonelik kartı
- **Öğrenci Atama:** Kota banner, remaining=0 iken buton disable + tooltip, STUDENT_LIMIT_REACHED SweetAlert

---

## C) Kurulum

### Backend

```bash
cd backend
# venv aktif et
pip install -r requirements.txt  # gerekirse
python manage.py migrate billing
python manage.py expire_subscriptions  # cron için
```

### Frontend

Ek paket yok. `sweetalert2` zaten mevcut.

---

## D) Örnek JSON Response

### GET /api/admin/billing/plans/

```json
[
  {
    "id": 1,
    "code": "STARTER_10",
    "name": "Starter",
    "student_limit": 10,
    "price_monthly": "299.00",
    "price_yearly": "2990.00",
    "currency": "TRY",
    "is_active": true
  }
]
```

### GET /api/admin/billing/teachers/1/subscription/

```json
{
  "subscription": {
    "id": 1,
    "plan": { "id": 1, "code": "STARTER_10", "name": "Starter", "student_limit": 10 },
    "status": "ACTIVE",
    "current_period_end": "2026-03-18T12:00:00Z"
  },
  "assigned_students_count": 7,
  "remaining_slots": 3,
  "limit": 10
}
```

### 400 STUDENT_LIMIT_REACHED

```json
{
  "code": "STUDENT_LIMIT_REACHED",
  "message": "Öğrenci kotanız doldu. Paketinizi yükseltin.",
  "limit": 10,
  "current": 10
}
```

---

## E) Test Senaryoları

1. Seed planlar: `python manage.py migrate` sonrası 3 plan oluşmalı
2. Admin plan CRUD: Plan oluştur/düzenle
3. Abonelik ata: Öğretmene plan ata, trial_days opsiyonel
4. Teacher subscription: Teacher login ile `/api/billing/me/subscription/` doğru dönmeli
5. Kota: Limit=10 iken 11. öğrenci atanınca 400 + SweetAlert
6. Expire: `expire_subscriptions` komutu süresi dolanları EXPIRED yapmalı
