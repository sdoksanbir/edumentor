# GitHub'a Push Etme

Remote zaten ekli: `https://github.com/sdoksanbir/edumentor`

## Kimlik doğrulama gerekli

GitHub artık şifre ile push kabul etmiyor. Aşağıdaki yöntemlerden birini kullan:

### 1. Personal Access Token (PAT)

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token" ile token oluştur (repo yetkisi ver)
3. Push yaparken şifre yerine bu token'ı kullan:

```bash
cd /Users/serkandoksanbir/Documents/PROGRAMLAMA/EDUMENTOR
git push -u origin main
# Username: sdoksanbir
# Password: (token'ı yapıştır)
```

### 2. SSH (önerilen)

SSH anahtarın varsa:

```bash
git remote set-url origin git@github.com:sdoksanbir/edumentor.git
git push -u origin main
```

### 3. GitHub CLI

```bash
brew install gh
gh auth login
git push -u origin main
```

## Türkçe karakter ayarları

Projeye `.gitattributes` eklendi (UTF-8, eol=lf). Türkçe karakter sorunu olmamalı.

---

**Commit mesajları:**
```
feat: Admin analytics dashboard (backend + frontend)

Backend:
- GET /api/admin/analytics/dashboard/ endpoint (ADMIN only)
- Metrikler: total_users, active_teachers, active_students, assigned_student_ratio,
  new_users_last_7_days, must_change_password_count
- Grafik verileri: monthly_new_users, role_distribution, students_per_teacher,
  weekly_active_trend (fallback: yeni kayıt sayısı)
- requirements.txt: mevcut (yeni paket eklenmedi)

Frontend:
- package.json, package-lock.json: recharts eklendi
- StatCards, MonthlyNewUsersChart, RoleDistributionChart, StudentsPerTeacherChart,
  WeeklyActiveTrendChart (recharts)
- AdminRoute: TEACHER/STUDENT kendi dashboardlarına yönlendirme
- Button: size=icon desteği
```
