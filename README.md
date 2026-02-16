# Edumath – Premium React Admin Template

Eğitim yönetim sistemi. Django REST API backend + React (Vite) frontend ile geliştirilmiş bir admin panel uygulamasıdır.

## 📋 Özellikler

- **Kullanıcı Yönetimi**: Admin, Öğretmen, Öğrenci, Veli rolleri
- **Katalog Yönetimi**: Sınıf düzeyleri, dersler, üniteler, konular
- **Öğretmen–Öğrenci Ataması**: Öğretmenlere öğrenci atama/düzenleme
- **JWT Kimlik Doğrulama**: Oturum ve token tabanlı giriş
- **Responsive Arayüz**: Tailwind CSS ile modern arayüz

## 🛠 Teknolojiler

| Katman   | Teknoloji                         |
|----------|-----------------------------------|
| Backend  | Django 6, Django REST Framework   |
| Auth     | JWT (SimpleJWT)                   |
| Frontend | React 19, Vite 7, TypeScript      |
| Stil     | Tailwind CSS                      |
| Veritabanı | SQLite (geliştirme) / PostgreSQL |

## 📁 Proje Yapısı

```
premium-react-admin/
├── backend/          # Django REST API
│   ├── accounts/     # Kullanıcı, kimlik doğrulama, panel
│   ├── catalog/     # Sınıf düzeyi, ders, ünite, konu
│   ├── config/      # Django ayarları
│   └── requirements.txt
├── frontend/         # React SPA
│   ├── src/
│   │   ├── app/     # Route, layout, provider
│   │   ├── features/ # Sayfa ve modüller
│   │   └── shared/  # UI, API, utils
│   └── package.json
├── README.md
├── INSTALL-WINDOWS.md
└── INSTALL-MACOS.md
```

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Python** 3.10+
- **Node.js** 18+
- **npm** veya **yarn**

### Kurulum

Detaylı kurulum için işletim sisteminize uygun dosyayı kullanın:

- **Windows**: [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md)
- **macOS**: [INSTALL-MACOS.md](INSTALL-MACOS.md)

### Kısa Özet

```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 2. Frontend (yeni terminal)
cd frontend
npm install
npm run dev
```

- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5173

## ⚙️ Ortam Değişkenleri

| Değişken            | Açıklama                | Varsayılan          |
|---------------------|-------------------------|---------------------|
| `VITE_API_BASE_URL` | Backend API adresi      | `http://127.0.0.1:8000` |
| `DJANGO_SECRET_KEY` | Django secret key       | (settings.py içinde) |

`.env` dosyası frontend klasöründe kullanılabilir.

## 📤 GitHub

Proje deposu: **[https://github.com/sdoksanbir/edumentor](https://github.com/sdoksanbir/edumentor)**

Mevcut projeyi GitHub'a göndermek için:

1. Git kullanıcı bilgilerinizi ayarlayın (henüz yapmadıysanız):

   ```bash
   git config --global user.email "sizin@email.com"
   git config --global user.name "Adınız Soyadınız"
   ```

2. Commit edin ve gönderin:

   ```bash
   git add .
   git commit -m "Initial commit: Edumath React Admin"
   git branch -M main
   git remote add origin https://github.com/sdoksanbir/edumentor.git
   git push -u origin main
   ```

## 📄 Lisans

Bu proje özel lisans altındadır.
