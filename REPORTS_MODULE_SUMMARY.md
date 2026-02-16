
# Raporlama & Analitik Modülü - Özet

## A) BACKEND (Django / DRF)

### A1) Login Log altyapısı

**Dosya: `backend/accounts/models.py`**
- Yeni model: `AuthEventLog`
  - `id`, `user` (FK, nullable), `event_type` (enum), `created_at`, `ip_address`, `user_agent`, `meta` (JSONField)
  - Indexler: `created_at`, `(user, created_at)`, `(event_type, created_at)`

**Dosya: `backend/accounts/migrations/0010_add_auth_event_log.py`**
- Migration oluşturuldu

**Dosya: `backend/accounts/utils/auth_logging.py`**
- `log_auth_event(request, event_type, user, meta)` yardımcı fonksiyonu

**Dosya: `backend/accounts/admin.py`**
- `AuthEventLogAdmin` eklendi

### A2) Login olduğunda log üret

**Dosya: `backend/accounts/views.py`**
- `TRTokenObtainPairSerializer`: Başarılı login → `LOGIN_SUCCESS`, başarısız → `LOGIN_FAIL` (user=null, meta.email)
- `TRTokenRefreshView`: Refresh token sonrası `REFRESH` log

**Dosya: `backend/accounts/urls.py`**
- `auth/refresh/` → `TRTokenRefreshView`

### A3) Admin Reports endpointleri

**Dosya: `backend/accounts/admin_reports_views.py`**
- Tüm endpointler `IsAdminOnly` permission ile korunuyor

**Dosya: `backend/accounts/admin_urls.py`**
- `/api/admin/reports/teacher-performance/`
- `/api/admin/reports/student-progress/`
- `/api/admin/reports/most-active-teachers/`
- `/api/admin/reports/most-used-courses/`
- `/api/admin/reports/daily-logins/`
- `/api/admin/reports/login-logs/`

### A5) Test

**Dosya: `backend/accounts/tests.py`**
- `test_admin_reports_200`: Admin token ile 200
- `test_teacher_reports_403`: Teacher token ile 403

---

## B) FRONTEND (React / Vite / TS)

### B1) Menü & Route

**Dosya: `frontend/src/app/layout/sidebar/menus/admin.menu.ts`**
- "Raporlar" menü öğesi eklendi (`/panel/reports`)

**Dosya: `frontend/src/app/routes.tsx`**
- `/panel/reports` → `ReportsPage`

### B2–B4) UI & Bileşenler

**Oluşturulan dosyalar:**
- `frontend/src/features/reports/types.ts`
- `frontend/src/features/reports/api/reportsApi.ts`
- `frontend/src/features/reports/components/ReportFilters.tsx`
- `frontend/src/features/reports/components/tables/TeacherPerformanceTable.tsx`
- `frontend/src/features/reports/components/tables/StudentProgressTable.tsx`
- `frontend/src/features/reports/components/tables/LoginLogsTable.tsx`
- `frontend/src/features/reports/components/charts/DailyLoginsChart.tsx`
- `frontend/src/features/reports/components/charts/MostActiveTeachersChart.tsx`
- `frontend/src/features/reports/components/charts/MostUsedCoursesChart.tsx`
- `frontend/src/features/reports/pages/reports-page.tsx`

### B5) Yetki

- `AdminRoute` zaten `/panel` altındaki tüm sayfaları koruyor; Teacher/Student `/panel/reports` erişemez, dashboard'a yönlendirilir.

---

## C) ÖRNEK RESPONSE JSON

### (1) GET /api/admin/reports/teacher-performance/
```json
{
  "results": [
    {
      "teacher_id": 1,
      "teacher_name": "Ahmet Yılmaz",
      "branch": "Matematik",
      "students_count": 15,
      "active_students_count": 14,
      "logins_count": 42,
      "last_login_at": "2026-02-16T10:30:00+00:00",
      "courses_count": 0
    }
  ]
}
```

### (2) GET /api/admin/reports/student-progress/
```json
{
  "results": [
    {
      "student_id": 5,
      "student_name": "Mehmet Kaya",
      "teacher_name": "Ahmet Yılmaz",
      "progress_percent": null,
      "last_activity_at": "2026-02-15T14:20:00+00:00",
      "last_login_at": "2026-02-15T14:20:00+00:00",
      "must_change_password": false
    }
  ]
}
```

### (3) GET /api/admin/reports/most-active-teachers/
```json
{
  "results": [
    {
      "teacher_id": 1,
      "teacher_name": "Ahmet Yılmaz",
      "logins_count": 42,
      "last_login_at": "2026-02-16T10:30:00+00:00"
    }
  ]
}
```

### (4) GET /api/admin/reports/most-used-courses/
```json
{
  "results": [
    {
      "course_id": 3,
      "course_title": "TYT Matematik",
      "usage_count": 25
    }
  ]
}
```

### (5) GET /api/admin/reports/daily-logins/
```json
{
  "results": [
    {
      "date": "2026-02-01",
      "logins": 120,
      "unique_users": 85
    }
  ]
}
```

### (6) GET /api/admin/reports/login-logs/
```json
{
  "items": [
    {
      "id": 1,
      "created_at": "2026-02-16T10:30:00+00:00",
      "event_type": "LOGIN_SUCCESS",
      "user": {
        "id": 1,
        "email": "admin@test.com",
        "name": "Admin User"
      },
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20
}
```

---

## D) TODO LİSTESİ

1. **Progress modeli yok** – `student-progress` raporunda `progress_percent` şu an `null`; ilerleme tablosu eklendiğinde doldurulacak.
2. **Course usage metriği** – `most-used-courses` şu an topic sayısını kullanıyor; `CourseEnrollment` / `CourseProgress` / `CourseView` tabloları eklendiğinde gerçek kullanım metriği kullanılacak.
3. **Course-öğretmen ilişkisi** – `teacher-performance` raporunda `courses_count` şu an 0; öğretmen–kurs ilişkisi tanımlandığında güncellenecek.

---

## E) KURULUM

### Backend
```bash
cd backend
pip install -r requirements.txt  # zaten yüklüyse atla
python manage.py migrate accounts
python manage.py test accounts.tests.AuthEventLogTests
```

### Frontend
- `recharts` ve `@tanstack/react-query` zaten `package.json` içinde.
- Ek paket gerekmez.

### Migration çalıştırma
```bash
cd backend
python manage.py migrate
```
