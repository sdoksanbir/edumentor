# Kurulum Kılavuzu – Windows

Bu dosya, **Windows** ortamında projenin kurulumunu adım adım açıklar.

## Gereksinimler

- **Windows 10/11**
- **Python 3.10+** ([python.org](https://www.python.org/downloads/))
- **Node.js 18+** ([nodejs.org](https://nodejs.org/))
- **Git** ([git-scm.com](https://git-scm.com/))

Python kurulumunda **"Add Python to PATH"** seçeneğini işaretleyin.

---

## 1. Projeyi İndirin

```powershell
git clone https://github.com/sdoksanbir/edumentor.git
cd edumentor
```

---

## 2. Backend Kurulumu (Django)

### 2.1. Sanal Ortam Oluşturma

```powershell
cd backend
python -m venv .venv
```

### 2.2. Sanal Ortamı Etkinleştirme

```powershell
.\.venv\Scripts\Activate.ps1
```

> **Not:** `Activate.ps1` çalışmazsa:
> - **Yöntem 1:** `cmd` kullanın: `call .venv\Scripts\activate.bat`
> - **Yöntem 2:** PowerShell için:  
>   `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### 2.3. Paketleri Yükleme

```powershell
pip install -r requirements.txt
```

### 2.4. Veritabanı Migrasyonları

```powershell
python manage.py migrate
```

### 2.5. Geliştirme Sunucusunu Başlatma

```powershell
python manage.py runserver
```

Backend çalışıyor: **http://127.0.0.1:8000**

---

## 3. Frontend Kurulumu (React)

**Yeni bir PowerShell/CMD penceresi** açın.

### 3.1. Proje Köküne Gidin

```powershell
cd C:\Users\KULLANICI\edumentor
```

*(Kendi proje klasör yolunuzu yazın.)*

### 3.2. Frontend Klasörüne Geçin

```powershell
cd frontend
```

### 3.3. Bağımlılıkları Yükleyin

```powershell
npm install
```

> **Not:** `npm` yerine `yarn` veya `pnpm` kullanabilirsiniz:
> - `yarn install`
> - `pnpm install`

### 3.4. Geliştirme Sunucusunu Başlatın

```powershell
npm run dev
```

Frontend çalışıyor: **http://localhost:5173**

---

## 4. Admin Hesabı Oluşturma (Opsiyonel)

Django admin paneline giriş için süper kullanıcı oluşturun:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py createsuperuser
```

E-posta ve şifre belirledikten sonra **http://127.0.0.1:8000/admin/** adresinden giriş yapabilirsiniz.

---

## 5. Özet Komutlar

| İşlem            | Komut                                                         |
|------------------|---------------------------------------------------------------|
| Backend başlat   | `cd backend` → `.\.venv\Scripts\Activate.ps1` → `python manage.py runserver` |
| Frontend başlat  | `cd frontend` → `npm run dev`                                 |
| Migrasyon        | `cd backend` → `python manage.py migrate`                    |
| Süper kullanıcı  | `cd backend` → `python manage.py createsuperuser`            |

---

## Sorun Giderme

### PowerShell `Activate.ps1` hatası

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### `pip` bulunamıyor

```powershell
python -m pip install -r requirements.txt
```

### `npm` bulunamıyor

Node.js’in kurulu olduğundan emin olun ve terminali yeniden açın.

### CORS hatası

Backend `config/settings.py` içinde `CORS_ALLOWED_ORIGINS` listesine `http://localhost:5173` eklidir. Eğer farklı bir port kullanıyorsanız, bu listeye ekleyin.
