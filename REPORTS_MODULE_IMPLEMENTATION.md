# Raporlar & Analitik Modülü - Uygulama Özeti

## C) ÇIKTI

### Backend'de Değişen Dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `backend/accounts/views.py` | LOGIN_FAIL meta'da email/username fallback; `LogoutView` eklendi (LOGOUT event log) |
| `backend/accounts/urls.py` | `auth/logout/` endpoint eklendi; `LogoutView` import |
| `backend/accounts/admin_reports_views.py` | Tüm 6 report endpoint güncellendi: teacher-performance (teacher_profile_id, must_change_password_count), student-progress (grade_label, target_exam_label, teacher_profile_id filtresi), most-active-teachers (teacher_profile_id), most-used-courses (course_label, subject_label, topics_count, related_teachers_count, is_proxy_metric), daily-logins, login-logs (meta, meta__email search); ISO date parse; örnek response docstring'ler |
| `backend/accounts/tests.py` | `test_admin_all_reports_200` eklendi (tüm endpointler için smoke test) |

### Frontend'de Değişen Dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `frontend/src/features/auth/pages/api/auth-api.ts` | `logout()` artık POST /auth/logout/ çağırıyor |
| `frontend/src/app/providers/auth-provider.tsx` | `logout` fonksiyonu backend logout endpoint'ini çağırıyor |
| `frontend/src/features/reports/types.ts` | Yeni API response alanlarına göre güncellendi |
| `frontend/src/features/reports/api/reportsApi.ts` | `teacher_profile_id` parametresi eklendi |
| `frontend/src/features/reports/components/tables/TeacherPerformanceTable.tsx` | branch_label, must_change_password_count, teacher_profile_id |
| `frontend/src/features/reports/components/tables/StudentProgressTable.tsx` | grade_label, target_exam_label, student_profile_id; Son Aktivite kaldırıldı |
| `frontend/src/features/reports/components/tables/LoginLogsTable.tsx` | LOGIN_FAIL için meta.email gösterimi |
| `frontend/src/features/reports/components/charts/MostUsedCoursesChart.tsx` | course_label, topics_count, subject_label; proxy metrik etiketi |
| `frontend/src/features/reports/pages/reports-page.tsx` | Başlık "Raporlar & Analitik"; öğretmen filtresi (student-progress); CSV filename formatı; teacher_profile_id |

### Frontend'de Eklenen Dosyalar

- *(Yeni dosya yok - mevcut yapı kullanıldı)*

### npm / pip Komutları

```bash
# Backend (venv aktif)
pip install -r backend/requirements.txt
cd backend && python manage.py test accounts.tests

# Frontend
npm install
npm run build
```

### Proxy / TODO Notları

- **Kurs Kullanımı (most-used-courses)**: Gerçek kullanım metriği için `enrollment` / `progress` tablosu gerekir. Şu an proxy metrik kullanılıyor:
  - `topics_count`: Course başına Topic sayısı (içerik miktarı)
  - `related_teachers_count`: Course.subject_id ile eşleşen TeacherProfile.branch_id sayısı
  - `is_proxy_metric: true` sabit

- **Öğrenci İlerlemesi (student-progress)**: `progress_percent` şimdilik `null`; enrollment/progress tablosu eklendiğinde doldurulacak.

- **SQLite + meta__email__icontains**: PostgreSQL'de çalışır. SQLite JSONField ile sorun olursa ayrı koşul eklenebilir.
