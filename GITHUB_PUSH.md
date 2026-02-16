# GitHub'a Push Etme

Commit atıldı. GitHub'a göndermek için:

## 1. GitHub'da yeni repo oluştur

- https://github.com/new adresine git
- Repo adı: `EDUMENTOR` (veya istediğin isim)
- Public/Private seç
- **"Add a README" ekleme** – zaten projede var

## 2. Remote ekle ve push et

```bash
cd /Users/serkandoksanbir/Documents/PROGRAMLAMA/EDUMENTOR

# GitHub kullanıcı adın ve repo adını aşağıda değiştir
git remote add origin https://github.com/KULLANICI_ADIN/EDUMENTOR.git

git branch -M main
git push -u origin main
```

`KULLANICI_ADIN` yerine kendi GitHub kullanıcı adını yaz.

## SSH kullanıyorsan

```bash
git remote add origin git@github.com:KULLANICI_ADIN/EDUMENTOR.git
git push -u origin main
```

---

**Son commit mesajı:**
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
