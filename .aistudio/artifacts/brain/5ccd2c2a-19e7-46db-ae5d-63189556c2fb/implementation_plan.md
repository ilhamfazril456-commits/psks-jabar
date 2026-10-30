# Rencana & Dokumentasi Implementasi: 4 Fitur Penyempurnaan Sistem SIM-PSKS

Dokumen ini mencatat penyelesaian dan implementasi tuntas atas 4 kebutuhan utama pengguna:

---

### 1. Tombol Hijau "Masuk ke Akun" Tanpa Password (Hanya Username)
* **Tujuan**: Saat calon pengguna baru disetujui (diverifikasi) atau saat membuka form login dari tiket pendaftaran, kata sandi tidak boleh diisi secara otomatis demi privasi dan keamanan.
* **Implementasi**:
  - Di `src/components/SmartGateModal.tsx`, pada saat proses submit pendaftaran akun (`handleRegisterSubmit`), input password login dibersihkan (`setPasswordInput('')`).
  - Pada tombol hijau **"Masuk Ke Akun"** (`view === 'register_status'`), fungsi klik hanya mengisi username (`setUsernameInput(uname)`) dan memastikan input kata sandi tetap kosong (`setPasswordInput('')`).
  - Pengguna diwajibkan mengetikkan kata sandinya sendiri secara sadar di form login manual.

---

### 2. Sinkronisasi Realtime Tanpa Di-refresh (Status Verifikasi & Reset Password)
* **Tujuan**: Mengeliminasi kebutuhan reload/refresh halaman saat Superadmin menyetujui akun baru atau menyetujui pengajuan reset password.
* **Akar Masalah Sebelumnya**:
  - Sebelumnya terdapat selektor `isPrivilegedAdmin` di `App.tsx` yang membatasi subscription Firestore `admin_accounts` hanya untuk admin/superadmin/developer yang sudah login.
  - Akibatnya, calon user yang sedang menunggu di modal `register_status` atau `forgot_password_status` tidak menerima pembaruan snapshot Firestore secara realtime.
* **Implementasi**:
  - Pembatasan privilege pada listener `admin_accounts` di `App.tsx` telah diselaraskan sehingga seluruh klien (termasuk tamu yang memantau tiket atau user terdaftar) menerima aliran snapshot Firestore secara langsung tanpa jeda.
  - Saat Superadmin menekan tombol **"Terima"** atau **"Setujui Reset"**, data akun di Firestore terbarui seketika dan dalam hitungan milidetik status tampilan di sisi user langsung berubah menjadi **Terverifikasi (Akun Aktif)** atau **Sandi Sementara Diterbitkan**.

---

### 3. Sub Menu "Ubah Kata Sandi" Khusus User Terdaftar & Admin Wilayah
* **Tujuan**: Memberikan fasilitas mandiri bagi akun peran `user` (anggota pilar sosial terdaftar) dan `admin` (pejabat dinas sosial 27 kab/kota) untuk memperbarui kata sandi akunnya sendiri.
* **Implementasi**:
  - **Di `src/components/Navbar.tsx`**: Ditambahkan item sub menu navigasi **"Ubah Kata Sandi"** (`id: 'ubah_password_user_admin'`) di menu dropdown **Pusat Akun** yang khusus muncul saat sesi aktif berstatus `SAH_TERDAFTAR` dan perannya adalah `user` atau `admin`. Klik sub menu ini langsung mengarahkan dan melakukan *smooth scroll* ke kartu `#ubah-password-section`.
  - **Di `src/components/AccountPage.tsx`**:
    - Disediakan kartu elegan bertema Emerald/Teal berlabel **"Ubah Kata Sandi Akun"** dengan indikator *Tersambung Realtime Database*.
    - Form mencakup: Kata Sandi Saat Ini (dengan verifikasi kecocokan terhadap database), Kata Sandi Baru (minimal 6 karakter), dan Konfirmasi Kata Sandi Baru lengkap dengan tombol *toggle* tampilkan/sembunyikan sandi (ikon mata).
    - Validasi ketat diterapkan (sandi baru tidak boleh sama dengan sandi lama, konfirmasi harus cocok, sandi lama harus valid).
    - Perubahan langsung membuat hash baru (Bcrypt) dan tersimpan ke Firestore `admin_accounts` serta sinkron ke state lokal.

---

### 4. Celah Keamanan Single Session Kick (Auto Kick Sesi Lama Universal)
* **Tujuan**: Memastikan integritas keamanan single-session: saat sebuah akun diloginkan di perangkat/sesi lain, sesi lama pada akun tersebut wajib otomatis ditendang (*force logout*) seketika.
* **Akar Masalah Sebelumnya**:
  - Pengecekan sesi sebelumnya memiliki pengecualian `session.role !== 'developer'`, pembatasan `isDifferentDevice`, dan percabangan `else if (remoteLoginTime <= loginTime)` yang justru menimpa token sesi baru dengan token sesi lama.
* **Implementasi**:
  - Di `src/App.tsx`, logika deteksi konflik sesi disempurnakan menjadi aturan universal yang berlaku untuk **SEMUA ROLE TANPA TERKECUALI** (`user`, `admin`, `superadmin`, `developer`).
  - Setiap kali proses login terjadi di mana pun, token sesi unik baru (`sessionToken`) diterbitkan dan disimpan ke dokumen akun di Firestore.
  - Sesi aktif yang sedang berjalan terus memantau `matched.sessionToken`. Jika token di database berbeda dengan `localToken` sesi lokal (`matched.sessionToken !== localToken`), sesi lama langsung memunculkan `MultipleSessionWarningModal` dan melakukan *force logout*.
  - Sesi baru di perangkat kedua tetap berjalan normal dan aman tanpa risiko tertimpa kembali oleh sesi lama.


---

### 5. Penguatan Keamanan Komprehensif Kategori A (Zero-Trust & Hardening)
* **Tujuan**: Menutup seluruh celah keamanan teknis di level sistem, server backend, dan database tanpa mengubah atau membatalkan kartu fisik Smart Card NFC/QR yang telah dicetak.
* **Implementasi**:
  1. **Zero-Trust 2FA pada Kartu Smart Card Fisik Permanen**:
     - Token permanen yang tercetak di kartu fisik (`ENC::SA-8F2B9D4C1E` untuk Superadmin & `ENC::DEV-7A3C5F9B2D` untuk Developer) **tetap dipertahankan 100%**.
     - Server `/api/auth/verify-qr` kini tidak lagi langsung menerbitkan tiket sesi login saat QR dipindai. Sebagai gantinya, server memvalidasi keaslian kartu dan menerbitkan `challengeToken` sementara (berlaku 2 menit).
     - Antarmuka otomatis meminta verifikasi PIN 6-digit rahasia (`AuthorityPinVerificationModal`). Sesi login hanya diterbitkan setelah PIN dan `challengeToken` berhasil diverifikasi bersama di server (`/api/auth/verify-pin`).
  2. **Isolasi PIN Server-Authoritative**:
     - `superadminPin` dan `developerPin` tidak lagi diungkap secara bebas ke publik melalui dokumen Firestore `app_settings`.
     - Ditambahkan endpoint khusus `/api/auth/update-pin` yang dilindungi otorisasi HMAC Bearer token.
     - Perbandingan PIN offline pada sisi klien dihapus total (Zero-Trust).
  3. **Eliminasi Total Plaintext Password (`passwordPolos`)**:
     - Menghapus pembacaan dan penyimpanan `passwordPolos` di seluruh modul (`SmartGateModal`, `UserManagementPage`, `AccountPage`, `AdminMonitoringPage`, `firestoreDataService`, dan `App.tsx`).
     - Seluruh verifikasi sandi kini mutlak menggunakan algoritma kriptografi Bcrypt `passwordHash`.
  4. **Proteksi Otoritas Asisten AI (`/api/ai/chat`)**:
     - Server memverifikasi keabsahan sesi melalui HMAC session token (`Authorization: Bearer <token>`), bukan lagi mempercayai `userContext.role` dari JSON body mentah.
  5. **Hardening Firestore Rules**:
     - Menambahkan aturan proteksi pada `app_settings` untuk memblokir penulisan atau injeksi `superadminPin` dan `developerPin` dari sisi klien.
     - Aturan telah berhasil dideploy langsung via RPC `DeployRules`.
  6. **Hardening Reverse Proxy & Anti-Bot**:
     - Dikonfigurasi `app.set('trust proxy', 1);` untuk pendeteksian IP yang akurat di balik proxy/CDN.
     - Bypass token statis (`manual_turnstile_`) telah dihapus dan digantikan validasi waktu kedaluwarsa token anti-bot dinamis.
