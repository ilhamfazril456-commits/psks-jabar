# Rencana Implementasi: Autentikasi Kata Sandi Dinamis & Tunggal Tanpa Sandi Ganda

Rencana ini menetapkan arsitektur baru di mana Database Supabase (`admin_accounts`) menjadi satu-satunya sumber kebenaran (*Single Source of Truth*). Seluruh logika toleransi kata sandi lama/ganda dan nilai statis di tabel dihapus tuntas, sehingga setiap kali pengguna mengubah kata sandi, kata sandi baru langsung aktif dan kata sandi lama langsung musnah seketika.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi pengguna pada sesi tanya jawab:
> - **Autentikasi Murni Dinamis**: Sistem HANYA mencocokkan input kata sandi dengan hash Bcrypt terkini di Supabase. Tidak ada lagi toleransi kata sandi lama, variasi huruf, atau fallback kodingan (`||`).
> - **Penghapusan Sandi Lama Seketika**: Saat kata sandi diubah di antarmuka, Supabase langsung diperbarui dengan hash baru, cache lokal `localStorage` langsung diselaraskan, dan seluruh teks statis sandi lama di tabel admin dibersihkan.
> - **Integritas QR & NFC**: Autentikasi jalur fisik kartu QR Code dan Token NFC (`DEV-7A3C5F9B2D` dan `SA-8F2B9D4C1E`) tetap 100% aktif dan berjalan independen.

---

### 1. Overview & Core Concept

- **Tujuan Utama**: Menghilangkan sepenuhnya bug "kata sandi ganda" (*dual password*) dan bug "kata sandi kembali ke yang lama".
- **Akar Masalah yang Dihilangkan**:
  1. Adanya baris pengecekan tambahan `if (pClean === 'Super12345jabar' || pClean === 'super12345jabar')` di `server.ts`, `SmartGateModal.tsx`, dan `AccountPage.tsx` yang membuat kata sandi lama tetap bisa dipakai meskipun pengguna sudah menggantinya dengan kata sandi baru.
  2. Adanya teks *ternary* statis di tabel `AdminManagementPage.tsx` (`item.role === 'superadmin' ? 'super12345jabar' : ...`) yang menampilkan teks sandi lama di mata pengguna meskipun database sudah diperbarui.
  3. Adanya penimpaan data bawaan `DEFAULT_ADMIN_ACCOUNTS` di `App.tsx` saat memuat akun.

---

### 2. User Experience & Visual Design

- **Alur Perubahan Sandi Baru**:
  1. Pengguna membuka modal *Edit Kredensial Akun*.
  2. Pengguna memasukkan Username baru dan Password baru (min. 12 karakter).
  3. Sistem membuat hash Bcrypt baru dari kata sandi tersebut.
  4. Sistem menyimpan ke Supabase `admin_accounts` dan `localStorage`.
  5. Kolom tabel kata sandi langsung memperbarui teks sandi baru secara riil (bukan teks bawaan lama).
  6. Pengguna keluar (*logout*) dan mencoba masuk (*login*) dengan kata sandi baru -> **BERHASIL**.
  7. Pengguna mencoba masuk dengan kata sandi lama -> **DITOLAK SEKETIKA (401 Unauthorized)**.

- **Diagram Arsitektur Alur Autentikasi Tunggal**:
```
┌────────────────────────────────────────────────────────┐
│            Input Login (Username & Password)           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│          Query ke Supabase `admin_accounts`            │
│               WHERE username = :inputU                 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│      Verifikasi Bcrypt Hash MURNI Tunggal             │
│      isValid = compare(inputPassword, row.passwordHash)│
│                                                        │
│  [DILARANG ADA LOGIKA '||' ATAU FALLBACK KATA SANDI]   │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        (Cocok / True)             (Tidak Cocok / False)
               │                          │
               ▼                          ▼
┌───────────────────────────┐    ┌───────────────────────┐
│ Token Sesi Resmi Diterbitkan│    │ 401 Unauthorized:     │
│ Hak Akses Sesuai DB       │    │ Akses Ditolak         │
└───────────────────────────┘    └───────────────────────┘
```

---

### 3. Key Technical Decisions & Changes

1. **Pembersihan Total di `server.ts`**:
   - Menghapus semua percabangan `if (pClean === 'Super12345jabar' || pClean === 'super12345jabar')` dan `if (pClean === 'IlhamSangDeveloper' || ...)`.
   - Logika murni: `const isValid = comparePassword(pClean, matchedAccount.passwordHash);`. Jika salah, tolak 401.

2. **Pembersihan Total di `SmartGateModal.tsx` & `AccountPage.tsx`**:
   - Menghapus semua percabangan serupa di sisi klien.
   - Sisi klien mengirim kredensial ke `/api/auth/login`. Jika *offline*, hanya mengecek `comparePassword(pInput, matchedAccount.passwordHash)`.

3. **Pembersihan di `AdminManagementPage.tsx`**:
   - Menghapus teks bawaan statis di kolom tabel:
     Mengganti `(item.role === 'developer' ? 'IlhamSangDeveloper' : item.role === 'superadmin' ? 'super12345jabar' : ...)` menjadi murni membaca `item.passwordPolos || 'Tersimpan (Terenkripsi Bcrypt)'`.
   - Saat tombol *Simpan Perubahan* ditekan, `passwordPolos` dan `passwordHash` langsung disimpan ke Supabase dan cache lokal tanpa ada teks lama yang tertinggal.

4. **Pembersihan di `App.tsx`**:
   - Memastikan `App.tsx` tidak menimpa kata sandi akun yang ada di Supabase dengan kata sandi bawaan lama `DEFAULT_ADMIN_ACCOUNTS`.

---

### 4. Verification & Testing Steps

1. **Uji Edit Sandi Superadmin**:
   - Ubah sandi Superadmin menjadi sandi baru yang ditentukan pengguna.
   - Periksa tabel: teks sandi baru yang tampil.
   - Coba login dengan sandi baru -> Harus Berhasil.
   - Coba login dengan sandi lama (`super12345jabar` / `Super12345jabar`) -> Harus Ditolak 401.
2. **Uji Edit Sandi Developer**:
   - Ubah sandi Developer menjadi sandi baru.
   - Coba login dengan sandi baru -> Harus Berhasil.
   - Coba login dengan sandi lama -> Harus Ditolak 401.
3. **Uji QR Code & NFC**:
   - Pindai kartu QR Code atau token NFC -> Harus tetap berhasil masuk dengan role sah.
