# Kurulum Kılavuzu – macOS

Bu dosya, **macOS** ortamında projenin kurulumunu adım adım açıklar.

## Gereksinimler

- **macOS** 11+
- **Python 3.10+** (Homebrew ile: `brew install python@3.11`)
- **Node.js 18+** (Homebrew ile: `brew install node`)
- **Git** (genelde Xcode ile gelir)

---

## 1. Projeyi İndirin

```bash
git clone https://github.com/sdoksanbir/edumentor.git
cd edumentor
```

---

## 2. Backend Kurulumu (Django)

### 2.1. Sanal Ortam Oluşturma

```bash
cd backend
python3 -m venv .venv
```

### 2.2. Sanal Ortamı Etkinleştirme

```bash
source .venv/bin/activate
```

### 2.3. Paketleri Yükleme

```bash
pip install -r requirements.txt
```

### 2.4. Veritabanı Migrasyonları

```bash
python manage.py migrate
```

### 2.5. Geliştirme Sunucusunu Başlatma

```bash
python manage.py runserver
```

Backend çalışıyor: **http://127.0.0.1:8000**

---

## 3. Frontend Kurulumu (React)

**Yeni bir Terminal penceresi** açın.

### 3.1. Proje Klasörüne Gidin

```bash
cd ~/edumentor
```

*(Kendi proje yolunuza göre değiştirin.)*

### 3.2. Frontend Klasörüne Geçin

```bash
cd frontend
```

### 3.3. Bağımlılıkları Yükleyin

```bash
npm install
```

> **Not:** `npm` yerine `yarn` veya `pnpm` kullanabilirsiniz:
> - `yarn install`
> - `pnpm install`

### 3.4. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Frontend çalışıyor: **http://localhost:5173**

---

## 4. Admin Hesabı Oluşturma (Opsiyonel)

Django admin paneline giriş için süper kullanıcı oluşturun:

```bash
cd backend
source .venv/bin/activate
python manage.py createsuperuser
```

E-posta ve şifre belirledikten sonra **http://127.0.0.1:8000/admin/** adresinden giriş yapabilirsiniz.

---

## 5. Özet Komutlar

| İşlem            | Komut                                                         |
|------------------|---------------------------------------------------------------|
| Backend başlat   | `cd backend` → `source .venv/bin/activate` → `python manage.py runserver` |
| Frontend başlat  | `cd frontend` → `npm run dev`                                 |
| Migrasyon        | `cd backend` → `python manage.py migrate`                     |
| Süper kullanıcı  | `cd backend` → `python manage.py createsuperuser`             |

---

## Sorun Giderme

### `python3` veya `pip` bulunamıyor

Homebrew ile Python kurun:

```bash
brew install python@3.11
```

PATH'e ekleyin (örneğin `~/.zshrc` veya `~/.bash_profile`):

```bash
export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"
```

### `npm` bulunamıyor

```bash
brew install node
```

### CORS hatası

Backend `config/settings.py` içinde `CORS_ALLOWED_ORIGINS` listesine `http://localhost:5173` eklidir. Farklı port kullanıyorsanız bu listeye ekleyin.

### M1/M2/M3 Mac’te uyumluluk sorunu

Python ve Node.js’i ARM uyumlu sürümlerle (Homebrew varsayılanı) kullanın:

```bash
arch -arm64 brew install python@3.11 node
```
