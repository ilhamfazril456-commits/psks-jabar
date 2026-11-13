# PSKS & KEPAHLAWANAN — Dinas Sosial Provinsi Jawa Barat

Sistem Pemantauan Terintegrasi dan Pengelolaan Data **10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS)** serta **Gerbang Kepahlawanan** untuk Pemerintah Provinsi Jawa Barat (27 Kabupaten/Kota).

---

## Daftar Isi
1. [Arsitektur & Tech Stack](#arsitektur--tech-stack)
2. [Persyaratan Sistem (VPS)](#persyaratan-sistem-vps)
3. [Cara Instalasi & Deploy di VPS Server (Ubuntu)](#cara-instalasi--deploy-di-vps-server-ubuntu)
4. [Konfigurasi Environment Variables (`.env`)](#konfigurasi-environment-variables-env)
5. [Menjalankan di Background dengan PM2](#menjalankan-di-background-dengan-pm2)
6. [Konfigurasi Nginx Reverse Proxy & SSL HTTPS](#konfigurasi-nginx-reverse-proxy--ssl-https)
7. [Verifikasi & Maintenance](#verifikasi--maintenance)

---

## Arsitektur & Tech Stack

Aplikasi ini dibangun menggunakan arsitektur **Full-Stack TypeScript** di mana satu server Express melayani API backend sekaligus bundel SPA React di lingkungan produksi pada port **`3000`**.

### 1. Frontend
- **Framework**: React 19 + TypeScript (`~5.8`)
- **Build Tool**: Vite 6 (`@vitejs/plugin-react`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Ikon & Animasi**: `lucide-react`, `motion`
- **Visualisasi Data & Peta**:
  - **Recharts 3** (grafik statistik batang, donat, dan tren)
  - **Leaflet 1.9** (peta sebaran interaktif 27 Kabupaten/Kota Jawa Barat)
- **Ekspor, Impor & Kartu Digital**:
  - **SheetJS (`xlsx`)** untuk import/export Excel massal
  - **jsPDF** & **jspdf-autotable** untuk cetak laporan resmi PDF
  - **QRCode**, **jsQR**, & **html5-qrcode** untuk kartu pintar dan pemindaian QR

### 2. Backend & Server
- **Runtime**: Node.js (disarankan v20 LTS atau v22 LTS)
- **Web Framework**: Express 4 (`server.ts`)
- **Bundler Server Produksi**: `esbuild` (mengkompilasi `server.ts` ke `dist/server.cjs`)
- **Dev Runner**: `tsx` (menjalankan Express + Vite middleware pada mode development)

### 3. Basis Data & Sinkronisasi Realtime
- **Supabase (`@supabase/supabase-js`)**: Basis data relasional/JSON utama beserta kanal realtime (`supabase_schema.sql`).
- **Firebase Firestore (`firebase` v12)**: Basis data cadangan & sinkronisasi dengan validasi keamanan ketat (`firestore.rules`).

### 4. Keamanan & Integrasi AI
- **Autentikasi & Kriptografi**: `bcryptjs` (hashing kata sandi & PIN otoritas dengan riwayat anti-pemakaian ulang), `crypto-js` (enkripsi AES-256 untuk data sensitif/PII), serta token sesi bertanda tangan HMAC-SHA256.
- **Proteksi Web**: Header keamanan OWASP (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`), rate limiter endpoint login/PIN, dan dukungan verifikasi **Cloudflare Turnstile**.
- **AI Server-Side**: `@google/genai` (dipanggil melalui route `/api/*` di sisi server menggunakan `GEMINI_API_KEY`).

---

## Persyaratan Sistem (VPS)

Spesifikasi minimal yang direkomendasikan untuk VPS produksi:
- **OS**: Ubuntu 22.04 LTS atau Ubuntu 24.04 LTS (64-bit)
- **CPU / RAM**: Minimal 1 vCPU & 2 GB RAM (disarankan 2 vCPU / 4 GB RAM untuk build Vite & proses server lancar)
- **Storage**: Minimal 20 GB SSD
- **Perangkat Lunak**:
  - Node.js `v20.x` atau `v22.x` LTS
  - `npm` (bawaan Node.js)
  - `git`
  - `pm2` (Process Manager)
  - `nginx` (Reverse Proxy)
  - `certbot` (SSL HTTPS gratis Let's Encrypt, jika menggunakan domain)

---

## Cara Instalasi & Deploy di VPS Server (Ubuntu)

### Langkah 1: Update Server & Instal Node.js LTS
Masuk ke VPS via SSH, lalu perbarui paket dan instal Node.js 22 LTS:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx ufw

# Instal Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi
node -v
npm -v
```

### Langkah 2: Clone Source Code & Instal Dependensi
Letakkan proyek di direktori `/var/www/psks-jabar` (atau direktori pilihan Anda):

```bash
sudo mkdir -p /var/www/psks-jabar
sudo chown -R $USER:$USER /var/www/psks-jabar

git clone <URL_REPOSITORY_ANDA> /var/www/psks-jabar
cd /var/www/psks-jabar

# Instal seluruh dependensi runtime & build
npm ci
```

*(Jika muncul error memori saat `npm ci` atau `npm run build` pada VPS RAM 1 GB, tambahkan swap 2 GB terlebih dahulu.)*

### Langkah 3: Siapkan Database (Supabase & Firebase)
1. **Supabase**:
   - Buka dashboard proyek Supabase Anda -> menu **SQL Editor**.
   - Jalankan seluruh isi file `supabase_schema.sql` untuk membuat tabel-tabel (`psks_records`, `dev_accounts`, `superadmin_accounts`, `admin_accounts`, `user_accounts`, `app_settings`, `pahlawan_nasional`, `system_logs`, dan lainnya).
2. **Firebase Firestore**:
   - Pastikan file `firebase-applet-config.json` sesuai dengan proyek Firebase Anda.
   - Pastikan aturan keamanan pada `firestore.rules` sudah diterapkan/di-*deploy* pada proyek Firebase terkait.

---

## Konfigurasi Environment Variables (`.env`)

Buat file `.env` di root direktori proyek (`/var/www/psks-jabar/.env`) dengan mengacu pada `.env.example`:

```bash
cp .env.example .env
nano .env
```

Isi dengan konfigurasi produksi Anda (ganti seluruh nilai placeholder di bawah ini):

```env
# Mode Produksi (Wajib agar Express menyajikan bundel statis dist/)
NODE_ENV=production

# URL publik domain / server aplikasi
APP_URL="https://domain-anda.go.id"

# Kunci API Gemini (Sisi Server)
GEMINI_API_KEY="MASUKKAN_GEMINI_API_KEY_ANDA"

# Rahasia penandatangan token sesi HMAC (Gunakan string acak panjang minimal 32 karakter)
SESSION_SECRET="GANTI_DENGAN_KUNCI_ACAK_SUPER_AMAN_MIN_32_KARAKTER"

# Konfigurasi Supabase (Frontend & Server)
VITE_SUPABASE_URL="https://PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="MASUKKAN_SUPABASE_ANON_KEY"
SUPABASE_URL="https://PROJECT_ID.supabase.co"
SUPABASE_PUBLISHABLE_KEY="MASUKKAN_SUPABASE_ANON_OR_PUBLISHABLE_KEY"

# PIN Otoritas Bawaan Awal (Dapat diubah dari UI Manajemen setelah aktif)
SUPERADMIN_PIN="123456"
DEVELOPER_PIN="992211"

# Opsional: Cloudflare Turnstile Secret untuk verifikasi captcha login
CLOUDFLARE_TURNSTILE_SECRET="MASUKKAN_TURNSTILE_SECRET_KEY"
```

Setelah `.env` tersimpan, lakukan pemeriksaan tipe dan build aplikasi produksi:

```bash
# Cek error TypeScript
npm run lint

# Build frontend (dist/) dan bundle backend (dist/server.cjs)
npm run build
```

---

## Menjalankan di Background dengan PM2

Gunakan **PM2** agar server Node.js tetap berjalan meskipun SSH ditutup dan otomatis menyala kembali saat VPS di-restart:

```bash
# Instal PM2 secara global
sudo npm install -g pm2

# Jalankan server dalam mode produksi (menggunakan dist/server.cjs)
cd /var/www/psks-jabar
NODE_ENV=production pm2 start dist/server.cjs --name psks-jabar --update-env

# Simpan daftar proses PM2 dan aktifkan autostart saat boot
pm2 save
pm2 startup
```

> Jalankan perintah `sudo env PATH=...` yang dicetak oleh `pm2 startup` di terminal untuk mengaktifkan systemd unit PM2.

Perintah PM2 yang berguna sehari-hari:
- `pm2 status` — Melihat status server
- `pm2 logs psks-jabar` — Melihat log aplikasi secara realtime
- `pm2 restart psks-jabar --update-env` — Memulai ulang server setelah pembaruan `.env` atau kode

---

## Konfigurasi Nginx Reverse Proxy & SSL HTTPS

Server aplikasi berjalan pada `0.0.0.0:3000`. Pasang **Nginx** di depannya untuk menangani domain, kompresi, batas ukuran unggahan (foto Pahlawan / impor Excel), dan HTTPS.

1. Buat file konfigurasi Nginx `/etc/nginx/sites-available/psks-jabar`:

```nginx
server {
    listen 80;
    server_name domain-anda.go.id www.domain-anda.go.id;

    # Batas ukuran request untuk upload foto terkompresi & file Excel massal
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

2. Aktifkan konfigurasi & muat ulang Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/psks-jabar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

3. Buka port Firewall UFW (SSH, HTTP, HTTPS):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

4. Pasang sertifikat **SSL HTTPS** gratis dengan Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.go.id -d www.domain-anda.go.id
```

---

## Verifikasi & Maintenance

### Verifikasi Layanan Berjalan
Cek endpoint kesehatan server langsung dari VPS:

```bash
curl http://127.0.0.1:3000/api/health
```

Jika berhasil, server akan merespons:
```json
{"status":"ok","service":"PSKS Jabar AI Server"}
```

### Alur Update Aplikasi di VPS
Setiap kali ada pembaruan kode di repositori:

```bash
cd /var/www/psks-jabar
git pull origin main
npm ci
npm run lint
npm run build
pm2 restart psks-jabar --update-env
```
