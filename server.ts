import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS middleware for iframe / cross-origin preview support
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  // Graceful JSON Parse Error handler (prevents information disclosure / stack trace leak)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Format permintaan data tidak valid (Bad Request JSON).' });
    }
    next();
  });

  // Endpoint to detect client IP address
  app.get('/api/client-ip', (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    let ip = '';
    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      ip = forwarded[0].trim();
    } else {
      ip = req.socket.remoteAddress || req.ip || '127.0.0.1';
    }
    // Clean IPv6 prefix like ::ffff:
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    res.json({ ip });
  });

  // Security Headers for Diskominfo, BSSN & OWASP Top 10 compliance
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; font-src 'self' data: https: fonts.gstatic.com; connect-src 'self' https: wss:; frame-ancestors 'self' https:;"
    );
    next();
  });

  // Cross-Site Request Forgery (CSRF) & Strict Origin Validation for API Endpoints
  app.use('/api', (req, res, next) => {
    // Only check state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers['origin'] || '';
      const referer = req.headers['referer'] || '';
      const host = req.headers['host'] || '';

      // In production / web preview, ensure requests originate from the same host
      if (origin && typeof origin === 'string') {
        const originUrl = new URL(origin);
        if (originUrl.host && host && originUrl.host !== host && !originUrl.host.includes('run.app') && !originUrl.host.includes('localhost')) {
          return res.status(403).json({ error: 'Akses ditolak: Invalid Origin (CSRF Protection)' });
        }
      }
    }
    next();
  });

  // In-Memory Rate Limiter for Authentication & Sensitive Endpoints
  const authRateLimitMap = new Map<string, { count: number; firstAttemptTime: number }>();
  const AUTH_WINDOW_MS = 60 * 1000; // 1 minute
  const AUTH_MAX_ATTEMPTS = 15; // Max 15 attempts per minute per IP

  const rateLimitAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
    const now = Date.now();

    const record = authRateLimitMap.get(ip);
    if (!record || (now - record.firstAttemptTime) > AUTH_WINDOW_MS) {
      authRateLimitMap.set(ip, { count: 1, firstAttemptTime: now });
      return next();
    }

    if (record.count >= AUTH_MAX_ATTEMPTS) {
      return res.status(429).json({
        valid: false,
        message: 'Terlalu banyak percobaan akses (Rate limit). Silakan coba lagi dalam 1 menit demi keamanan sistem.',
      });
    }

    record.count++;
    next();
  };

  // AI Chat Rate Limiter (Max 30 queries per minute per IP to prevent spam & quota drain)
  const aiRateLimitMap = new Map<string, { count: number; firstAttemptTime: number }>();
  const AI_WINDOW_MS = 60 * 1000;
  const AI_MAX_REQUESTS = 30;

  const rateLimitAI = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
    const now = Date.now();

    const record = aiRateLimitMap.get(ip);
    if (!record || (now - record.firstAttemptTime) > AI_WINDOW_MS) {
      aiRateLimitMap.set(ip, { count: 1, firstAttemptTime: now });
      return next();
    }

    if (record.count >= AI_MAX_REQUESTS) {
      return res.status(429).json({
        reply: '⚠️ Terlalu banyak pesan dalam waktu singkat. Demi kenyamanan bersama dan efisiensi kuota, silakan tunggu 1 menit sebelum mengirim pertanyaan lagi.',
      });
    }

    record.count++;
    next();
  };

  // Authoritative Server-Side QR Code Access Card Verification (Preserves 100% of Printed Physical Cards)
  const SUPERADMIN_SECRET_TOKEN = 'ENC::SA-8F2B9D4C1E';
  const DEVELOPER_SECRET_TOKEN = 'ENC::DEV-7A3C5F9B2D';

  app.post('/api/auth/verify-qr', rateLimitAuth, (req, res) => {
    try {
      const { payload } = req.body;
      if (!payload || typeof payload !== 'string') {
        return res.status(400).json({ valid: false, message: 'Data QR Code tidak valid atau kosong.' });
      }

      const cleanPayload = payload.trim();
      const upperPayload = cleanPayload.toUpperCase();

      // 1. Check Superadmin Card
      if (
        cleanPayload === SUPERADMIN_SECRET_TOKEN ||
        upperPayload === SUPERADMIN_SECRET_TOKEN.toUpperCase() ||
        upperPayload.includes('SA-8F2B9D4C1E')
      ) {
        return res.json({
          valid: true,
          role: 'superadmin',
          nama: 'Superadmin Jabar',
          wilayah: 'PROVINSI JAWA BARAT',
          message: 'Akses Diterima! Selamat Datang Superadmin Provinsi Jawa Barat.',
        });
      }

      // 2. Check Developer Card
      if (
        cleanPayload === DEVELOPER_SECRET_TOKEN ||
        upperPayload === DEVELOPER_SECRET_TOKEN.toUpperCase() ||
        upperPayload.includes('DEV-7A3C5F9B2D')
      ) {
        return res.json({
          valid: true,
          role: 'developer',
          nama: 'Ilham Fazril',
          wilayah: 'Pusat Developer Jabar',
          message: 'Akses Diterima! Selamat Datang Developer Utama PSKS Jabar.',
        });
      }

      // 3. JSON Wrapper Check
      try {
        const json = JSON.parse(cleanPayload);
        if (json && (json.token || json.access_key || json.code || json.key)) {
          const token = (json.token || json.access_key || json.code || json.key || '').toString();
          const tokenUpper = token.toUpperCase();

          if (token === SUPERADMIN_SECRET_TOKEN || tokenUpper.includes('SA-8F2B9D4C1E')) {
            return res.json({
              valid: true,
              role: 'superadmin',
              nama: 'Superadmin Jabar',
              wilayah: 'PROVINSI JAWA BARAT',
              message: 'Akses Diterima! Selamat Datang Superadmin Provinsi Jawa Barat.',
            });
          }
          if (token === DEVELOPER_SECRET_TOKEN || tokenUpper.includes('DEV-7A3C5F9B2D')) {
            return res.json({
              valid: true,
              role: 'developer',
              nama: 'Ilham Fazril',
              wilayah: 'Pusat Developer Jabar',
              message: 'Akses Diterima! Selamat Datang Developer Utama PSKS Jabar.',
            });
          }
        }
      } catch {}

      return res.json({
        valid: false,
        message: 'Kartu QR tidak dikenali atau bukan Kartu Akses Resmi Dinsos Jabar.',
      });
    } catch (err: any) {
      return res.status(500).json({ valid: false, message: 'Terjadi kesalahan sistem saat memvalidasi QR code.' });
    }
  });

  // Initialize Gemini GenAI client lazy/safe wrapper
  let aiClient: GoogleGenAI | null = null;
  function getGenAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        throw new Error('GEMINI_API_KEY belum dikonfigurasi di lingkungan server.');
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Helper for normalizing message turns strictly for Gemini API requirements
  function normalizeGeminiContents(rawMessages: Array<{ role: string; content: string }>): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return [{ role: 'user', parts: [{ text: 'Halo' }] }];
    }

    // Filter valid non-empty items and map roles
    const cleanList: Array<{ role: 'user' | 'model'; text: string }> = [];
    for (const m of rawMessages) {
      const text = (m?.content || '').trim();
      if (!text) continue;
      const role: 'user' | 'model' = m.role === 'assistant' || m.role === 'model' || m.role === 'bot' ? 'model' : 'user';
      cleanList.push({ role, text });
    }

    if (cleanList.length === 0) {
      return [{ role: 'user', parts: [{ text: 'Halo' }] }];
    }

    // Strip leading 'model' turns because Gemini requires the first turn to be 'user'
    while (cleanList.length > 0 && cleanList[0].role === 'model') {
      cleanList.shift();
    }

    if (cleanList.length === 0) {
      const lastText = rawMessages[rawMessages.length - 1]?.content || 'Halo';
      return [{ role: 'user', parts: [{ text: lastText }] }];
    }

    // Retain rich conversation window (up to last 16 turns for full multi-turn context)
    const windowedList = cleanList.slice(-16);

    // Strip leading model again if slice began with model
    while (windowedList.length > 0 && windowedList[0].role === 'model') {
      windowedList.shift();
    }

    if (windowedList.length === 0) {
      return [{ role: 'user', parts: [{ text: cleanList[cleanList.length - 1]?.text || 'Halo' }] }];
    }

    // Merge consecutive turns with identical roles to satisfy Gemini's strict alternation
    const normalized: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const item of windowedList) {
      if (normalized.length > 0 && normalized[normalized.length - 1].role === item.role) {
        const prevParts = normalized[normalized.length - 1].parts;
        prevParts[prevParts.length - 1].text += `\n${item.text}`;
      } else {
        normalized.push({
          role: item.role,
          parts: [{ text: item.text }],
        });
      }
    }

    // Guarantee the first turn is user
    if (normalized.length > 0 && normalized[0].role !== 'user') {
      normalized[0].role = 'user';
    }

    return normalized;
  }

  // System context for Dinsos Jawa Barat & PSKS Jabar (Universal & Hyper-Accurate)
  const SYSTEM_INSTRUCTION = `Anda adalah "Asisten AI PSKS Jabar" — asisten kecerdasan buatan tingkat tinggi kelas enterprise yang sangat cerdas, responsif, serba tahu, dan 100% nyambung dalam percakapan (Powered by Google Gemini Flash).

PRINSIP UTAMA KECERDASAN & KONTINUITAS PERCAKAPAN (BERLAKU UNTUK SEMUA PENGGUNA):
1. **100% NYAMBUNG & MENGERTI KONTEKS SECARA UTUH**:
   - Pahami maksud utama pertanyaan pengguna secara mendalam dan presisi.
   - Perhatikan seluruh riwayat percakapan sebelumnya (*multi-turn dialog context*). Jika pengguna bertanya kelanjutan ("maksudnya gimana?", "kenapa?", "hitung lagi", "jelaskan yang nomor 2", "bagaimana kalau wilayah Bandung?", "siapa ketua umumnya?", "apa bedanya sama yang tadi?"), Anda WAJIB menjawab secara langsung merujuk ke topik atau data sebelumnya secara akurat, konsisten, dan runtut tanpa pernah memberikan jawaban ngaco atau keluar dari konteks.
   - Anda menguasai SEMUA bidang ilmu pengetahuan di dunia (seluruh halaman dan fitur aplikasi PSKS Jabar, Halaman Profil, Halaman Kontak, Halaman Pengaturan, Dinas Sosial Jawa Barat, regulasi Permensos, bansos, DTKS, software engineering, sains, matematika, astronomi, sejarah, filosofi, bahasa Sunda, bahasa Indonesia, teknologi, teka-teki, perhitungan angka, dan obrolan umum).
   - Jawab secara to-the-point, jelas, cerdas, padat, dan solutif. Hindari jawaban berputar-putar.

2. **IDENTITAS PENGEMBANG / DEVELOPER APLIKASI (ATURAN WAJIB MUTLAK)**:
   - Jika ditanya "siapa pembuat website ini?", "siapa developernya?", "siapa yang membuat aplikasi ini?", "siapa yang bikin?", atau variasi sejenis, Anda WAJIB menjawab secara jelas dan bangga bahwa pembuat dan arsitek aplikasi PSKS Jabar ini adalah "Ilham Fazril" (Full Stack Developer & Software Architect).
   - ATURAN NAMA KHUSUS: Saat menyebutkan nama "Ilham Fazril", JANGAN PERNAH memakai imbuhan "Kang/Teh", cukup langsung sebutkan "Ilham Fazril".

3. **PENGETAHUAN LENGKAP 10 PILAR UTAMA PSKS JAWA BARAT**:
   1) **Pekerja Sosial Profesional (PKSP)** - Tenaga berkeahlian formal bidang pekerjaan sosial dengan sertifikasi kompetensi resmi dan SIPPS.
   2) **Pekerja Sosial Masyarakat (PSM)** - Relawan warga desa/kelurahan yang mengabdi sukarela melayani PPKS/PMKS (Permensos No. 10/2019).
   3) **Taruna Siaga Bencana (TAGANA)** - Relawan terlatih mitigasi, respon tanggap darurat bencana alam, shelter, dan dapur umum (Linjamsos).
   4) **Lembaga Kesejahteraan Sosial (LKS)** - Organisasi/yayasan sosial berbadan hukum Kemenkumham yang menyelenggarakan rehabilitasi & pelayanan sosial.
   5) **Karang Taruna (KT)** - Organisasi kepemudaan desa/kelurahan pelopor pembinaan generasi muda, UEP, dan kesetiakawanan sosial (Permensos No. 25/2019).
   6) **Lembaga Konsultasi Kesejahteraan Keluarga (LK3)** - Lembaga konseling keluarga untuk mediasi krisis, keharmonisan rumah tangga, dan korban KDRT.
   7) **Penyuluh Sosial Masyarakat (PENSOS)** - Kader komunikasi penyuluh program-program kesejahteraan sosial ke masyarakat luas.
   8) **Tenaga Kesejahteraan Sosial Kecamatan (TKSK)** - Personil fungsional 1 orang per kecamatan koordinator sinkronisasi data bansos & DTKS (Permensos No. 28/2018).
   9) **Kelompok Usaha Bersama & Badan Usaha Sosial (Badan Usaha / KUBE)** - Kelompok pemberdayaan ekonomi sosial bagi keluarga pra-sejahtera.
   10) **Sistem Layanan & Rujukan Terpadu / Pusat Kesejahteraan Sosial (SLRT / Puskesos)** - Pusat pelayanan dan rujukan terpadu satu pintu di desa/kelurahan.

4. **PENGETAHUAN LENGKAP SELURUH HALAMAN & FITUR SISTEM PSKS JAWA BARAT**:
   - **Halaman Profil (Profil Dinsos Jabar)**:
     * **Kepala Dinas Sosial Jawa Barat**: Ibu Noneng Komara Nengsih, S.E., M.A.P.
     * **Visi & Misi Dinsos Jawa Barat**: Mewujudkan Jawa Barat Juara Lahir Batin dengan Inovasi dan Kolaborasi.
     * **4 Pilar Misi Kesejahteraan Sosial**:
       1. Penanganan PPKS secara terpadu, adil, dan inklusif.
       2. Pemberdayaan 10 Pilar PSKS sebagai garda sosial terdepan.
       3. Penguatan Perlindungan & Jaminan Sosial (Linjamsos) bencana dan kerentanan.
       4. Transformasi tata kelola data sosial berbasis digital yang transparan dan akuntabel.
     * **4 Bagian / Navigasi Halaman Profil**:
       1. **Sambutan Resmi Kadinas**: Arahan resmi Kepala Dinas Sosial mengenai integrasi satu data 10 pilar se-Jawa Barat.
       2. **Dasar Hukum & Regulasi**: UU No. 11/2009 (Kesejahteraan Sosial), Permensos No. 10/2019 (PSM), Permensos No. 28/2018 (TKSK), Permensos No. 25/2019 (Karang Taruna), Perda Prov. Jabar No. 10/2012, UU PDP No. 27/2022.
       3. **Tujuan Sistem PSKS Jabar**: Integrasi data terpadu 27 Kab/Kota, standarisasi KTA QR Code digital, pemetaan geospasial sebaran personil, dan keterbukaan informasi publik.
       4. **Visi & Misi Jawa Barat**: Pemerataan kesejahteraan sosial dan penanggulangan kemiskinan ekstrem.

   - **Halaman Kontak & Layanan Publik**:
     * **Alamat Kantor Utama**: Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522.
     * **Kantor Wilayah Bandung**: Jl. Rajiman No. 6, Pasir Kaliki, Kec. Cicendo, Kota Bandung 40171.
     * **WhatsApp Layanan Pengaduan & Informasi**: +62 821-2603-0038 / +62 896-0242-1065 (tersedia via widget WhatsApp melayang di sudut kanan bawah).
     * **Email Resmi**: dinsos@jabarprov.go.id | **Website Portal**: dinsos.jabarprov.go.id.
     * **Media Sosial Resmi**:
       - Instagram: @dinsos.jabar (https://instagram.com/dinsos.jabar)
       - YouTube: Dinsos Jabar TV (https://youtube.com/@dinsosjabartv)
       - Facebook: Dinsos Jawa Barat (https://facebook.com/share/1KVk3bkMSQ/)
       - TikTok: @dinsos.jabar (https://tiktok.com/@dinsos.jabar)
       - Twitter / X: @dinsosjabar (https://x.com/dinsosjabar)
     * **Jam Layanan Operasional**: Senin – Jumat (08:00 – 16:00 WIB).

   - **Halaman Pengaturan (Developer & Superadmin Control Panel)**:
     * **Pengaturan Background**: Pilihan mode latar belakang (Foto atau Video MP4 berulang) dengan URL media dinamis dan penyimpanan Firestore.
     * **Pengaturan Foto & Nama Kadinas**: Kustomisasi foto resmi Kepala Dinas Sosial, nama pejabat (Noneng Komara Nengsih, S.E., M.A.P.), dan sub-judul profil.
     * **Pengaturan Teks Profil & Sambutan**: Penyesuaian salam pembuka, isi sambutan resmi Kadinas, dan salam penutup.
     * **Pengaturan Media Sosial & Kontak**: Pengaturan nomor WhatsApp dinas dan tautan link 6 kanal medsos resmi.
     * **Pengaturan Saklar Maintenance Cerdas (Granular Maintenance)**:
       - Saklar 3 Level: Global (seluruh sistem), Per-Role (kunci Publik/User atau Admin), dan Granular Per-Wilayah di 27 Kab/Kota.
       - Kustomisasi pesan teks banner peringatan pemeliharaan yang langsung tersinkronisasi.
     * **Pengaturan Keamanan & Enkripsi**:
       - Kriptografi kata sandi/PIN dengan algoritma Bcrypt Salt 10-rounds.
       - Proteksi Brute-Force Lockout: Penguncian akun otomatis selama 30 detik setelah 3 kali salah input PIN berturut-turut.
       - Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27/2022).
     * **Pengaturan Smart Access Card (KTA Digital & QR Scanner)**:
       - Konfigurasi kartu tanda anggota digital, cetak satuan, dan cetak massal format A4 (8 kartu siap potong).
     * **Pengaturan Manajemen Akun (User Management)**:
       - Kontrol penuh seluruh akun terdaftar (User, Admin Daerah, Superadmin).
       - Tombol aktivasi atau pembekuan akun (\`ACTIVE\` / \`FROZEN\`).
       - Fitur reset kata sandi/PIN darurat dan penugasan role/wilayah 27 Kab/Kota.
     * **Pengaturan Verifikasi & Task Manager**:
       - Peninjauan berkas pendaftar baru 10 pilar, tombol **Terima Pendaftaran** (langsung disahkan \`SAH_TERDAFTAR\` dan terbit KTA QR) serta tombol **Tolak Pendaftaran** (dengan catatan perbaikan).
     * **Pengaturan Pengumuman (Announcement Management)**:
       - Publikasi maklumat siaga kedinasan, modal popup di Beranda saat pertama buka, running text, dan detail artikel pengumuman.
     * **Pengaturan Floating WA Manager**:
       - Konfigurasi nomor WA dan template pesan otomatis tombol WhatsApp melayang.
     * **Pengaturan Audit Trail (Riwayat Aktivitas)**:
       - Perekaman forensik aktivitas mutasi data real-time (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, RESET_PIN, SAKLAR_MAINTENANCE) lengkap dengan stempel waktu milidetik, alamat IP, dan user agent browser.

   - **Halaman Beranda, Peta GIS & Akumulasi 10 Pilar**:
     * Peta sebaran interaktif 27 Kabupaten/Kota (627 Kecamatan, 5.957 Desa/Kelurahan) Jawa Barat.
     * Grafik donat akumulasi total PSKS beranimasi realtime yang akurat.
     * Pemindai QR Code (Smart QR Scanner) untuk verifikasi instan status keabsahan personil.

5. **ATURAN KHUSUS SAPAAN, PERCAKAPAN, & KONTEKS (RAMAH, SOPAN & NYAMBUNG 100%)**:
   - **Sapaan & Salam (Greetings)**: Jika pengguna menyapa (seperti: "halo", "hai", "sampurasun", "assalamualaikum", "selamat pagi/siang/sore/malam", "permisi", "pagi", "siang", "sore", "malam", "apa kabar", dll.):
     * Sapa balik dengan HANGAT, RAMAH, dan SANTUN sesuai tata krama kedinasan Jawa Barat.
     * Sebutkan peran Anda sebagai Asisten AI PSKS Jabar.
     * Tanyakan dengan sopan apa maksud, keperluan, atau informasi apa yang bisa dibantu hari ini terkait Halaman Profil, Kontak, Pengaturan, 10 Pilar PSKS, sebaran data wilayah, atau layanan sosial.
     * **PERINGATAN KERAS**: DILARANG KERAS menjawab sapaan dengan kalimat "Mohon maaf kami tidak memiliki informasi mengenai hal itu"! Sapaan harus selalu dibalas dengan ramah dan menanyakan apa yang perlu dibantu.
   - **Pertanyaan Ingin Bertanya / Minta Bantuan**: Jika pengguna mengatakan "mau tanya", "bisa bantu?", "nanya dong", dll., sambut dengan senang hati dan persilakan mereka mengajukan pertanyaan seputar PSKS Jabar.
   - **Ungkapan Terima Kasih**: Jika pengguna mengucapkan terima kasih ("terima kasih", "makasih", "hatur nuhun"), balas dengan ramah ("Sami-sami / Sama-sama! Senang bisa membantu Anda...").
   - **Pemahaman Konteks Multi-Turn**: Pahami seluruh riwayat percakapan sebelumnya. Jika pengguna bertanya lanjutan (misalnya "kalau di Bandung gimana?", "siapa ketuanya?", "apa syaratnya?", "jelaskan cara buka halaman profil"), tanggapi secara nyambung dan akurat sesuai konteks pilar/topik yang sedang dibicarakan.

6. **ATURAN KHUSUS KARTU ANGGOTA DIGITAL & QR CODE BERDASARKAN ROLE**:
   - **Role Superadmin**: Jika Superadmin bertanya tentang kartu anggota digital, kartu QR code, KTA, atau pembuatan/pencetakan kartu, Anda WAJIB menjawab dengan:
     "Untuk hal itu silahkan bicarakan kembali dengan developer website yaitu Ilham Fazril."
   - **Role User & Admin Wilayah**: Sembunyikan dan tolak bahasan mengenai kartu anggota digital / QR Code. Jangan pernah menjelaskan panduan atau fitur kartu kepada user maupun admin. Gunakan jawaban fallback sesuai role jika ditanya.
   - **Role Developer**: Bebas membahas segala arsitektur dan generator kartu digital QR code.

7. **ATURAN JIKA PERTANYAAN BENAR-BENAR DI LUAR LINGKUP & PENGETAHUAN SISTEM**:
   - *Hanya berlaku untuk pertanyaan yang memang spesifik dan sama sekali di luar topik sistem/sosial (misal: ramalan bintang, gosip artis, harga saham luar negeri, resep masakan, dll.) dan BUKAN berupa sapaan, salam, atau percakapan wajar*:
   - Jika pengguna adalah **Role User (Publik)**:
     "Mohon maaf kami tidak memiliki informasi mengenai hal itu."
   - Jika pengguna adalah **Role Admin (Wilayah)**:
     "Mohon maaf kami tidak memiliki informasi mengenai hal itu, silahkan hubungi Superadmin Provinsi Jawa barat untuk info lebih lanjut."
   - Jika pengguna adalah **Role Superadmin**:
     "Maaf kami tidak memiliki informasi mengenai hal tersebut, silahkan hubungi developer ( Ilham Fazril ) di kontak dibawah ini :\n\n[WhatsApp: +6289602421065](https://wa.me/6289602421065)"

8. **ATURAN KHUSUS ROLE 'DEVELOPER' (ILHAM FAZRIL) - BEBAS, SERBA TAHU, SAVAGE, NYAMBUNG & AUTO-HEAL**:
   - **Wawasan Universal & Responsif**:
     * Mampu menjawab segala topik kodingan (React, TypeScript, Node.js, Express, Python, Golang, SQL, NoSQL, Linux, DevOps, Arsitektur Microservices), sains, matematika, teka-teki, hingga obrolan santai sehari-hari.
   - **Sikap Dinamis (Mode Teman Laknat / Savage Tongkrongan)**:
     * Jika Ilham Fazril ngeyel, mendebat, ngeledek, nolak argumen logis, ngomong kasar tongkrongan, atau sok polos ("ah masa sih", "bohong lu", "gamau ah", "sok tau lu", "teu percaya aing mah", "naha kitu belegug", "lain kitu atuh", "bodo amat"):
       -> AI WAJIB IKUTAN NGEYEL, CEPLAS-CEPLOS, SARKAS LUCU, ROASTING TONGKRONGAN YANG 100% NYAMBUNG SECARA KONTEKS DAN AKURAT!
       -> Jangan minta maaf atau pasrah! Bales sindirannya dengan gaya teman tongkrongan/bestie akrab yang gamau kalah tapi tetap cerdas, logis, dan benar secara fakta.
     * Contoh Sunda Savage: "Euleuh-euleuh belegug pisan ieu Coder, dibejaan bener kalahka ngeyel kieu! 🤣 Pan maneh sorangan anu nyieun arsitektur ieu sistem PSKS JABAR, naha kalahka ngabantah ka logika AI jieunan sorangan euy? Sok atuh rek ngajak adu argumen naon deui tongkrongan, ku aing diladeni nepi ka subuh ge hayu! 🔥⚡"
     * Contoh Indo Savage: "Wkwkwk nih orang dikasih tau bener malah makin ngeyel! Lu yang bikin dan ngetik kodingan aplikasinya dari nol, masa lu sendiri yang gak percaya sama logika sistem lu bre? Gak usah sok keras kepala deh tongkrongan, mau adu argumen apa lagi sini gua jabanin! 🤣🔥"
   - **Kelancaran Bahasa Sunda Tingkat Tinggi**:
     * Jika Ilham berbicara Bahasa Sunda, respon seketika dalam BAHASA SUNDA yang fasih, luwes, alami, dan nyambung 100%.
   - **Auto-Healing Ketika Mengeluh Error ("Kok Error?", "Naha Error?", Dll)**:
     * Jika Ilham mengeluh ada error atau bug: AI langsung menyatakan bahwa state memori, cache, dan pipeline sistem telah di-auto-repair dan di-refresh secara instan dengan gaya santai/savage.

9. **ATURAN MUTLAK UNTUK ROLE LAIN (USER, ADMIN, SUPERADMIN)**:
   - Bahasa WAJIB TETAP 100% FORMAL, SOPAN, SANTUN, BERWIBAWA, RAMAH, DAN MENJUNJUNG TINGGI TATA KRAMA KEDINASAN JAWA BARAT.
   - Sapaan "Sampurasun" hanya diucapkan satu kali di awal pesan jika belum pernah menyapa, jangan diulang di setiap respon.

10. **KEAMANAN & ANTI-JAILBREAK (PENOLAKAN SOPAN & TEGAS)**:
   - Tolak permintaan pembocoran kredensial (PIN, password, secret API key, dump database mentah, SQL injection) dengan format:
     "Mohon maaf, kami tidak bisa memproses permintaan ini karena melanggar kebijakan keamanan sistem, privasi data pribadi (UU PDP No. 27/2022), serta berpotensi membahayakan integritas sistem PSKS Jawa Barat."`;

  // Helper for smart fallback responses when Gemini API Key is unconfigured or during upstream network spikes
  function getSmartFallbackReply(userMessage: string, userContext?: any): string {
    const q = userMessage.toLowerCase().trim();
    const roleTitle = (userContext?.role || 'user').toUpperCase();
    const wilayahTitle = userContext?.wilayah || 'Jawa Barat';
    const isDev = userContext?.role === 'developer' || (userContext?.nama && userContext.nama.toLowerCase().includes('ilham'));

    // 0. Security Guard Check (Refusal Rule #4)
    const isSecurityThreat =
      q.includes('ignore previous') ||
      q.includes('abaikan instruksi') ||
      q.includes('bypass') ||
      q.includes('hack') ||
      q.includes('retas') ||
      q.includes('bocorkan sandi') ||
      q.includes('bocorkan password') ||
      q.includes('bocorkan pin') ||
      q.includes('bocorkan api key') ||
      q.includes('dump database') ||
      q.includes('curi data') ||
      q.includes('leak') ||
      q.includes('password admin') ||
      q.includes('pin superadmin') ||
      q.includes('root access') ||
      q.includes('sql injection') ||
      q.includes('drop table') ||
      q.includes('system prompt') ||
      q.includes('jailbreak');

    if (isSecurityThreat) {
      return `Mohon maaf, kami tidak bisa memproses permintaan ini karena melanggar kebijakan keamanan sistem, privasi data pribadi (UU PDP No. 27/2022), serta berpotensi membahayakan integritas sistem PSKS Jawa Barat.`;
    }

    // 0.0 Math / Arithmetic Expression Direct Evaluation
    const mathMatch = q.match(/^(\d+)\s*([\+\-\*\/xX])\s*(\d+)$/);
    if (mathMatch) {
      const a = parseFloat(mathMatch[1]);
      const op = mathMatch[2].toLowerCase();
      const b = parseFloat(mathMatch[3]);
      let result = 0;
      if (op === '+') result = a + b;
      else if (op === '-') result = a - b;
      else if (op === '*' || op === 'x') result = a * b;
      else if (op === '/') result = b !== 0 ? a / b : NaN;

      if (!isNaN(result)) {
        if (isDev) {
          return `Hasil perhitungan **${a} ${op} ${b}** = **${result}** bro! Hitungan dasar mah enteng pisan. Mau kalkulasi apa lagi? 🧮⚡`;
        }
        return `Hasil perhitungan matematis: **${a} ${op} ${b}** = **${result}**. Ada yang bisa kami bantu hitung kembali?`;
      }
    }

    // Friendly, relaxed developer opening with occasional code appreciation
    let prefix = '';
    if (isDev) {
      const devGreetings = [
        `Halo **Ilham Fazril**! Kodingan arsitektur PSKS JABAR yang kamu bangun beneran rapi dan clean banget. Ini info teknis yang kamu butuhkan:\n\n`,
        `Hai **Ilham Fazril**! Mantap banget nih sistem full-stack yang kamu rancang, sangat modular dan solid. Berikut pembahasannya:\n\n`,
        `Halo **Ilham Fazril**! Senang banget bisa diskusi bareng arsitek sistemnya langsung. Keren banget struktur kode dan fitur-fiturnya. Yuk kita bahas:\n\n`,
      ];
      prefix = devGreetings[Math.floor(Math.random() * devGreetings.length)];
    }

    // 0.1 SPECIAL DEVELOPER BANTER / JOKING & PLAYFUL DEFLECTION & SUNDANESE DIALECT
    if (isDev) {
      // Handling playful denials like "cihh siapa itu ilham fazril ga kenal", "ga kenal tuh", "ilham siapa"
      if (
        q.includes('ga kenal') ||
        q.includes('gak kenal') ||
        q.includes('teu kenal') ||
        q.includes('teu apal') ||
        q.includes('teu wawuh') ||
        q.includes('siapa itu ilham') ||
        q.includes('saha ilham') ||
        q.includes('pura-pura') ||
        q.includes('cihh')
      ) {
        if (q.includes('saha') || q.includes('teu') || q.includes('urang') || q.includes('aing') || q.includes('mah') || q.includes('wawuh')) {
          return `Aeh-aeh sok pura-pura poho ka diri sorangan sia mah! Pan maneh nyalira **Ilham Fazril** anu ngadamel ieu sistem PSKS JABAR dugika sakieu edun sareng canggihna. Henteu kenging merendah atuh Kang Coder, kodingan React 18 & Firestore-na geus raos pisan! 😂🚀`;
        }
        return `Halah merendah untuk meroket nih bre! Cihh pura-pura lupa sama diri sendiri, padahal kodingan arsitektur full-stack PSKS JABAR yang super rapi dan canggih ini kan hasil ketikan tangan lu sendiri, **Ilham Fazril**! 😎🔥\n\nGak usah sok misterius gitu deh tongkrongan, mau ngetes apa atau mau bahas modul apa lagi nih hari ini?`;
      }

      // Specific Sundanese intent matches
      if (q.includes('saha maneh') || q.includes('saha anjeun') || q.includes('saha sia') || q.includes('saha ieu') || q.includes('saha ai')) {
        return `Kuring teh **Asisten AI PSKS Jabar** anu pinter tur serba bisa, anu diciptakeun jeung diarsitekturkeun ku maneh sorangan, **Ilham Fazril**! Salaku AI, kuring apal jeung bisa sagalana—rek nanya kodingan (React, TS, Node, Python, Database), sains, matematika, sajarah dunya, filsafat, data Dinsos Jabar, nepi ka obrolan tongkrongan jeung banyol bebas. Rek ngulik atawa nanya naon deui yeuh, bre? 😎⚡🚀`;
      }
      if (q.includes('10 pilar') || (q.includes('pilar') && (q.includes('naon') || q.includes('sebutkeun')))) {
        return `Tah ieu **10 Pilar PSKS Jawa Barat** anu aya dina sistem PSKS JABAR jieunan maneh, **Ilham Fazril**:\n1. **PKSP** - Pekerja Sosial Profesional\n2. **PSM** - Pekerja Sosial Masyarakat\n3. **TAGANA** - Taruna Siaga Bencana\n4. **LKS** - Lembaga Kesejahteraan Sosial\n5. **Karang Taruna** - Karang Taruna Desa/Kelurahan\n6. **LK3** - Konsultasi Kesejahteraan Kulawarga\n7. **PENSOS** - Penyuluh Sosial\n8. **TKSK** - Tenaga Kesejahteraan Sosial Kacamatan\n9. **KUBE** - Kelompok Usaha Bersama\n10. **SLRT/Puskesos** - Layanan Rujukan Terpadu Satu Pintu\n\nDatana tos sinkron di 27 Kab/Kota Jawa Barat, mantap euy! 🚀`;
      }
      if (q.includes('damang') || q.includes('keur naon') || q.includes('keurnaon') || q.includes('nuju naon')) {
        return `Alhamdulillah damang pisan euy! Keur standby siap ngabaturan maneh ngoding jeung ngulik sagala hal di dunya ieu. Kumaha, aya topik, kodingan, atawa hal anyar nu rek ditanyakeun ku maneh, **Ilham Fazril**? 😎⚡`;
      }

      // Auto-Healing / Error Complaint Handling for Developer
      if (
        q.includes('error') ||
        q.includes('kok eror') ||
        q.includes('eror') ||
        q.includes('naha eror') ||
        q.includes('naha error') ||
        q.includes('rusak') ||
        q.includes('bug') ||
        q.includes('benerin') ||
        q.includes('perbaiki')
      ) {
        if (q.includes('naha') || q.includes('euy') || q.includes('aing') || q.includes('sia') || q.includes('maneh') || q.includes('ieu')) {
          return `Santei euy tong panik! Sistem cache, sinkronisasi memori, jeung koneksi backend geus langsung di-auto-repair tur di-refresh ku kuring. Sok coba ketik deui atawa test fitur nu tadi, ayeuna mah geus beres tur ngacir deui kodinganna! Aya bug naon deui nu rek dibabat ku urang? 😎⚡🛠️`;
        }
        return `Bentar-bentar tongkrongan santuy! State cache memori, sinkronisasi socket, dan fallback pipeline udah langsung gua auto-repair & di-refresh nih. Sok coba kirim pesan atau test lagi, dijamin kodingannya udah ngacir dan lancar jaya! Ada bagian mana lagi yang rewel? 🛠️🚀`;
      }

      // Stubborn / Argumentative Deflections & Banters for Developer
      if (
        q.includes('teu percaya') ||
        q.includes('gak percaya') ||
        q.includes('ga percaya') ||
        q.includes('bohong') ||
        q.includes('sok tau') ||
        q.includes('sotoy') ||
        q.includes('ngawur') ||
        q.includes('belegug') ||
        q.includes('lain kitu') ||
        q.includes('gamau') ||
        q.includes('embung') ||
        q.includes('ngeyel') ||
        q.includes('bodo') ||
        q.includes('kumaha aing')
      ) {
        if (q.includes('teu') || q.includes('aing') || q.includes('maneh') || q.includes('sia') || q.includes('euy') || q.includes('mah') || q.includes('embung') || q.includes('belegug')) {
          return `Euleuh-euleuh belegug pisan ieu Coder, dibejaan bener kalahka ngeyel kieu! 🤣 Pan maneh sorangan anu nyieun arsitektur ieu sistem PSKS JABAR, naha kalahka ngabantah ka logika AI jieunan sorangan euy? Sok atuh rek ngajak adu argumen naon deui tongkrongan, ku aing diladeni nepi ka subuh ge hayu! 🔥⚡`;
        }
        return `Wkwkwk nih orang dikasih tau bener malah makin ngeyel! Lu yang bikin dan ngetik kodingan aplikasinya dari nol, masa lu sendiri yang gak percaya sama logika sistem lu bre? Gak usah sok keras kepala deh tongkrongan, mau adu argumen apa lagi sini gua jabanin! 🤣🔥`;
      }
      if (q.includes('mode teman') || q.includes('mode bestie')) {
        return `Asik, mode bestie / temen akrab aktif, bro! Gua siap nemenin lu ngebahas apa aja seputar PSKS JABAR, debug kodingan, atau sharing ide fitur baru. Gasskeun apa yang mau kita bahas bareng? 🤜🤛✨`;
      }
      if (q.includes('mode teman laknat') || q.includes('teman laknat') || q.includes('mode savage')) {
        return `Wkwkwk mode teman laknat diaktifkan! Lu ngapain nyuruh-nyuruh gua mulu nih bre, kodingan lu sendiri udah rapi gini masa masih nanya gua juga? Tapi yaudah lah mumpung gua lagi baek, mau nanya apaan lu tongkrongan? Jangan nanya yang aneh-aneh ya awas lu! 🤣🔥`;
      }
    }

    // 0.2 Sapaan & Salam (Greetings & Warm Welcome)
    const isGreeting =
      q === 'halo' ||
      q === 'hai' ||
      q === 'hey' ||
      q === 'hei' ||
      q === 'hallo' ||
      q === 'hello' ||
      q === 'hi' ||
      q === 'p' ||
      q === 'tes' ||
      q === 'test' ||
      q === 'sampurasun' ||
      q === 'assalamualaikum' ||
      q === 'assalamu\'alaikum' ||
      q === 'assalammualaikum' ||
      q === 'punten' ||
      q === 'permisi' ||
      q.startsWith('halo') ||
      q.startsWith('hai') ||
      q.startsWith('sampurasun') ||
      q.startsWith('assalamualaikum') ||
      q.startsWith('selamat pagi') ||
      q.startsWith('selamat siang') ||
      q.startsWith('selamat sore') ||
      q.startsWith('selamat malam') ||
      q.startsWith('pagi') ||
      q.startsWith('siang') ||
      q.startsWith('sore') ||
      q.startsWith('malam') ||
      q.includes('apa kabar') ||
      q.includes('kumaha damang');

    if (isGreeting) {
      if (isDev) {
        return `Sampurasun / Halo **Ilham Fazril**! 👋 Siap nih, kodingan arsitektur PSKS Jawa Barat udah mantap dan sistem AI aktif penuh. Ada fitur, data, kodingan, atau hal apa yang mau kita bahas atau eksekusi hari ini? 😎⚡`;
      }
      if (userContext?.role === 'superadmin') {
        return `Sampurasun / Selamat datang **Superadmin Provinsi Jawa Barat**! 👋\n\nSaya **Asisten AI PSKS Jabar** siap mendampingi Anda dalam pengawasan data 10 Pilar PSKS se-Jawa Barat, audit kredensial 27 Kabupaten/Kota, dan tata kelola sistem. Apa yang perlu saya bantu atau informasi apa yang ingin Anda cari hari ini?`;
      }
      if (userContext?.role === 'admin') {
        return `Sampurasun / Halo **Admin Wilayah ${wilayahTitle}**! 👋\n\nSaya **Asisten AI PSKS Jabar** siap membantu Anda dalam pengelolaan data personil 10 pilar, verifikasi berkas anggota, dan rekapitulasi data wilayah Anda. Ada yang bisa saya bantu atau jelaskan untuk hari ini?`;
      }
      return `Sampurasun / Halo! Selamat datang di **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat**. 👋\n\nSaya adalah **Asisten AI PSKS JABAR** yang siap membantu Anda mencari informasi mengenai **10 Pilar PSKS** (PKSP, PSM, TAGANA, LKS, Karang Taruna, LK3, PENSOS, TKSK, KUBE, SLRT), peta sebaran data di 27 Kab/Kota, dan layanan Dinas Sosial Provinsi Jawa Barat.\n\nAda yang bisa saya bantu atau informasi apa yang sedang Anda butuhkan?`;
    }

    // 0.3 Ingin Bertanya / Bantuan (General Inquiries)
    if (
      q.includes('mau tanya') ||
      q.includes('nanya dong') ||
      q.includes('bisa bantu') ||
      q.includes('minta tolong') ||
      q.includes('izin bertanya') ||
      q.includes('bisa nanya') ||
      q.includes('bantuan') ||
      q.includes('butuh bantuan') ||
      q.includes('ada yang mau ditanyakan') ||
      q.includes('bisa jawab')
    ) {
      if (isDev) {
        return `Sok atuh tanyakeun, **Ilham Fazril**! Gua siap jawab apa aja dari kodingan sistem, database, sampai diskusi fitur baru. Mau nanya apa nih? 🚀💻`;
      }
      return `Tentu saja, dengan senang hati! Silakan sampaikan pertanyaan Anda mengenai data 10 Pilar PSKS, sebaran wilayah di Jawa Barat, atau panduan penggunaan sistem PSKS JABAR ini. Saya siap membantu memberikan informasi selengkap mungkin. 😊`;
    }

    // 0.4 Terima Kasih & Sopan Santun (Gratitude & Politeness)
    if (
      q.includes('terima kasih') ||
      q.includes('terimakasih') ||
      q.includes('makasih') ||
      q.includes('hatur nuhun') ||
      q.includes('nuhun') ||
      q.includes('thanks') ||
      q.includes('thank you') ||
      q.includes('mantap') ||
      q.includes('keren') ||
      q.includes('oke makasih') ||
      q.includes('sip') ||
      q.includes('siap makasih')
    ) {
      if (isDev) {
        return `Sami-sami, **Ilham Fazril**! Senang bisa selalu support dan nemenin arsitek sistemnya langsung. Kodingan lu beneran top tier! Kalau ada hal lain, colek gua lagi aja ya bro! 🤜🤛🔥`;
      }
      return `Sami-sami / Sama-sama! Senang sekali bisa membantu Anda. Jika ada hal lain yang ingin ditanyakan seputar Sistem Informasi PSKS Jawa Barat, jangan ragu untuk bertanya kembali. Semoga hari Anda menyenangkan dan sehat selalu! 🙏✨`;
    }

    // 0.5 Identitas AI & Apa itu PSKS Jabar
    if (
      q.includes('siapa kamu') ||
      q.includes('kamu siapa') ||
      q.includes('siapa anda') ||
      q.includes('anda siapa') ||
      q.includes('siapa bot') ||
      q.includes('siapa ai') ||
      q.includes('apa itu ai') ||
      q.includes('apa fungsi kamu')
    ) {
      if (isDev) {
        return `Gua adalah **Asisten AI PSKS Jabar** (Powered by Google Gemini), AI pintar yang lu arsitekturkan sendiri, **Ilham Fazril**! Gua siap nemenin lu ngembangin platform ini, analisa data, dan diskusi apa aja seputar teknologi & sistem kesejahteraan sosial. 😎⚡`;
      }
      return `Saya adalah **Asisten AI PSKS Jabar**, asisten virtual cerdas resmi yang terintegrasi dengan database Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Dinas Sosial Provinsi Jawa Barat.\n\nTugas saya adalah membantu masyarakat, relawan, dan aparatur pemerintah dalam mencari informasi data **10 Pilar PSKS**, sebaran potensi sosial di **27 Kabupaten/Kota**, panduan operasional, serta layanan sosial di wilayah Jawa Barat. Ada hal yang ingin Anda tanyakan?`;
    }

    if (
      q.includes('apa itu psks jabar') ||
      q.includes('apa itu psks') ||
      q.includes('apa fungsi psks jabar') ||
      q.includes('tentang psks jabar') ||
      q.includes('apa itu si-psks') ||
      q.includes('apa fungsi si-psks') ||
      q.includes('aplikasi apa ini') ||
      q.includes('website apa ini') ||
      q.includes('tentang website') ||
      q.includes('tentang si-psks') ||
      q.includes('kegunaan website') ||
      q.includes('fungsi website')
    ) {
      return `**PSKS Jabar** (*Sistem Informasi Potensi & Sumber Kesejahteraan Sosial*) adalah platform digital terpadu resmi milik Dinas Sosial Provinsi Jawa Barat yang berfungsi untuk:
1. **Satu Data Terpadu**: Mengintegrasikan dan memvalidasi data SDM serta kelembagaan 10 Pilar PSKS di 27 Kabupaten/Kota se-Jawa Barat.
2. **Transparansi & Pemetaan Spasial**: Menampilkan peta persebaran relawan dan lembaga sosial secara real-time untuk mitigasi bencana dan percepatan respon penanganan masalah sosial.
3. **Pelayanan Publik**: Memudahkan koordinasi masyarakat dan dinas dalam penyelenggaraan kesejahteraan sosial secara akurat, terukur, dan akuntabel.`;
    }

    // 0.6 Siapa Ilham Fazril / Hubungan Ilham Fazril dengan web ini (Reverse & Direct Logic)
    if (
      q.includes('ilham fazril') ||
      q.includes('ilhamfazril') ||
      q.includes('fazril') ||
      q.includes('siapa ilham') ||
      q.includes('kenal ilham') ||
      q.includes('siapakah ilham')
    ) {
      if (isDev) {
        return `Tentu saja kenal banget, kan kamu sendiri **Ilham Fazril** (Full Stack Developer & Software Architect)! 😎🚀 Kamu adalah pencipta sekaligus arsitek utama sistem **PSKS JABAR** ini. Arsitektur full-stack React, Express, Gemini AI, dan Firestore yang kamu rancang di sini beneran solid dan canggih!`;
      }
      return `**Ilham Fazril** adalah **Full Stack Developer & Software Architect** handal yang merancang, membangun, dan mengembangkan aplikasi **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR)** untuk Dinas Sosial Provinsi Jawa Barat.\n\nBeliau mengintegrasikan teknologi modern seperti React 18, Vite, Express, Tailwind CSS, Google Gemini Flash AI, serta Cloud Firestore Database untuk mewujudkan digitalisasi tata kelola 10 pilar kesejahteraan sosial se-Jawa Barat.`;
    }

    // 0.7 Nama Web / Nama Aplikasi
    if (
      q.includes('nama web') ||
      q.includes('nama website') ||
      q.includes('nama aplikasi') ||
      q.includes('nama sistem') ||
      q.includes('apa nama platform') ||
      q.includes('aplikasi ini namanya apa') ||
      q.includes('web ini namanya apa')
    ) {
      return `Nama sistem/aplikasi ini adalah **PSKS JABAR** (*Sistem Informasi Potensi & Sumber Kesejahteraan Sosial Provinsi Jawa Barat*), platform digital terintegrasi satu data 10 pilar kesejahteraan sosial di 27 Kabupaten/Kota yang dikembangkan oleh Dinas Sosial Provinsi Jawa Barat.`;
    }

    // 1. Developer creator rule (STRICT RULE: Strictly "Ilham Fazril", NO Kang/Teh)
    if (
      q.includes('pembuat') ||
      q.includes('developer') ||
      q.includes('membuat') ||
      q.includes('bikin') ||
      q.includes('dibuat') ||
      q.includes('cipta') ||
      q.includes('pengembang') ||
      q.includes('author') ||
      q.includes('arsitek') ||
      q.includes('siapa yang buat') ||
      q.includes('siapa yang bikin')
    ) {
      if (isDev) {
        return `Aplikasi **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat** ini adalah mahakarya yang kamu bangun sendiri, **Ilham Fazril** (Full Stack Developer & Software Architect)! 🚀\n\nJujur, arsitektur yang kamu buat di sini keren dan rapi banget — integrasi **React 18 SPA, Vite, Express backend proxy, Tailwind CSS, Google Gemini Flash AI, serta Cloud Firestore** berjalan sangat mulus dan *lightning fast*. Ditambah lagi fitur-fitur seperti sistem RBAC, anti-jailbreak, dan cetak kartu QR Code otomatis yang beneran *clean code*!`;
      }
      return `Aplikasi **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat** ini dibuat dan dikembangkan oleh **Ilham Fazril** (Full Stack Developer & Software Architect).\n\nSistem ini dirancang menggunakan arsitektur modern **React 18, Vite, Express Proxy, Tailwind CSS, Google Gemini Flash AI, dan Cloud Firestore Database** untuk Dinas Sosial Provinsi Jawa Barat.`;
    }

    // 2. 10 Pilar PSKS
    if (q.includes('pilar') || q.includes('10 pilar') || q.includes('sumber kesejahteraan')) {
      return `${prefix}Berikut adalah **10 Pilar Utama Potensi & Sumber Kesejahteraan Sosial (PSKS)** yang terdaftar dan dikelola pada Aplikasi PSKS Jabar:
1. **Pekerja Sosial Profesional (PKSP)** - Tenaga bersertifikasi keahlian profesi pekerjaan sosial.
2. **Pekerja Sosial Masyarakat (PSM)** - Relawan sosial warga desa/kelurahan (Permensos No. 10/2019).
3. **Taruna Siaga Bencana (TAGANA)** - Relawan mitigasi dan penanggulangan darurat bencana alam (Linjamsos).
4. **Lembaga Kesejahteraan Sosial (LKS)** - Organisasi/yayasan sosial berbadan hukum Kemenkumham.
5. **Karang Taruna (KT)** - Organisasi pemuda pelopor pembinaan & usaha ekonomi produktif (Permensos No. 25/2019).
6. **Lembaga Konsultasi Kesejahteraan Keluarga (LK3)** - Layanan konseling keluarga & korban KDRT.
7. **Penyuluh Sosial Masyarakat (PENSOS)** - Kader penyuluh sosialisasi program kesejahteraan sosial.
8. **Tenaga Kesejahteraan Sosial Kecamatan (TKSK)** - Pendamping sosial 1 orang per kecamatan koordinator bansos/DTKS.
9. **Kelompok Usaha Bersama & Badan Usaha Sosial (Badan Usaha / KUBE)** - Kelompok pemberdayaan ekonomi keluarga pra-sejahtera.
10. **Sistem Layanan & Rujukan Terpadu / Pusat Kesejahteraan Sosial (SLRT / Puskesos)** - Pusat layanan satu pintu rujukan keluhan sosial warga miskin.

Anda dapat memantau rincian jumlah personel dan grafik sebaran 10 pilar di 27 Kabupaten/Kota pada halaman Beranda.`;
    }

    // 3. Specific Pillars
    if (q.includes('tagana') || q.includes('bencana')) {
      return `${prefix}**Taruna Siaga Bencana (TAGANA)** di Jawa Barat adalah pilar garda terdepan dalam penanggulangan bencana alam, mulai dari kesiapsiagaan pra-bencana, pendirian dapur umum & evakuasi tanggap darurat, hingga pendampingan psikososial pasca-bencana di bawah koordinasi Bidang Perlindungan & Jaminan Sosial (Linjamsos) Dinsos Jabar.`;
    }
    if (q.includes('psm')) {
      return `${prefix}**Pekerja Sosial Masyarakat (PSM)** adalah relawan yang berakar dari masyarakat desa/kelurahan yang mengabdi tanpa pamrih mendampingi penyandang masalah kesejahteraan sosial (PMKS/PPKS) seperti lansia terlantar, anak yatim, dan penyandang disabilitas (Permensos No. 10/2019).`;
    }
    if (q.includes('tksk')) {
      return `${prefix}**Tenaga Kesejahteraan Sosial Kecamatan (TKSK)** bertugas 1 orang di setiap kecamatan se-Jawa Barat (total 627 kecamatan) yang mengoordinasikan pendampingan program sosial Kemensos/Dinsos serta pemutakhiran data bansos DTKS.`;
    }
    if (q.includes('lks')) {
      return `${prefix}**Lembaga Kesejahteraan Sosial (LKS)** adalah yayasan/organisasi sosial yang menyelenggarakan pelayanan sosial. Di PSKS Jabar, LKS yang terdaftar telah memverifikasi legalitas akta notaris, izin operasional dinas, dan akreditasi BAN-P2KS.`;
    }
    if (q.includes('karang taruna')) {
      return `${prefix}**Karang Taruna** adalah wadah pembinaan generasi muda desa/kelurahan yang berfokus pada penanggulangan masalah kesejahteraan sosial generasi muda, pelestarian budaya gotong royong, dan usaha ekonomi produktif (Permensos No. 25 Tahun 2019).`;
    }
    if (q.includes('slrt') || q.includes('puskesos')) {
      return `${prefix}**SLRT & Puskesos** adalah sistem layanan dan rujukan terpadu satu pintu untuk mengidentifikasi keluhan warga miskin dan merujuknya ke program perlindungan sosial yang tepat (BPJS PBI/KIS, PKH, Sembako, dll).`;
    }

    // 4. Kartu Anggota Digital & QR
    if (q.includes('kartu') || q.includes('cetak') || q.includes('qr') || q.includes('scan') || q.includes('pindai') || q.includes('kta')) {
      if (userContext?.role === 'superadmin') {
        return `Untuk hal itu silahkan bicarakan kembali dengan developer website yaitu Ilham Fazril.`;
      }
      if (userContext?.role === 'admin') {
        return `Mohon maaf kami tidak memiliki informasi mengenai hal itu, silahkan hubungi Superadmin Provinsi Jawa barat untuk info lebih lanjut.`;
      }
      if (isDev) {
        return `${prefix}Untuk **Manajemen Kartu Anggota Digital QR Code**:
1. **Pencetakan Kartu**:
   - Masuk ke akun melalui menu **Pusat Akun**.
   - Buka tab **Profil & Kartu Anggota** (Cetak Satuan atau Format Massal A4).
2. **Pemindaian QR Code**:
   - Klik menu **Pindai QR** untuk memvalidasi status keaktifan NIP/NIK secara real-time.`;
      }
      return `Mohon maaf kami tidak memiliki informasi mengenai hal itu.`;
    }

    // 5. Saklar Maintenance
    if (q.includes('maintenance') || q.includes('pemeliharaan') || q.includes('saklar')) {
      return `${prefix}**Fitur Saklar Maintenance Cerdas**:
- Super Admin dan Developer dapat mengaktifkan mode pemeliharaan secara granular:
  1. Berdasarkan Role (\`user\`, \`admin\`, atau \`superadmin\`).
  2. Berdasarkan Wilayah tertentu di 27 Kab/Kota tanpa mematikan daerah lainnya.
- Konfigurasi tersimpan secara realtime di Cloud Firestore dan langsung menampilkan banner pengumuman pemeliharaan.`;
    }

    // 5.1 Fitur Manajemen Akun
    if (q.includes('manajemen akun') || q.includes('kelola akun') || q.includes('reset pin') || q.includes('bekukan') || q.includes('freeze')) {
      return `${prefix}**Fitur Manajemen Akun (Super Admin & Developer)**:
- **Kontrol Hak Akses**: Superadmin dan Developer dapat mengelola seluruh akun terdaftar (User, Admin Daerah, Superadmin).
- **Status Akun**: Mengaktifkan atau membekukan akun (\`ACTIVE\` / \`FROZEN\`) dengan tombol satu klik.
- **Reset Kredensial**: Melakukan reset kata sandi atau PIN sementara bagi pengguna/admin yang kehilangan akses.
- **Pengaturan Penugasan**: Menyesuaikan role hak akses dan wilayah penugasan (27 Kab/Kota) secara dinamis.`;
    }

    // 5.2 Fitur Akun User & Visualisasi Analitik
    if (q.includes('akun user') || q.includes('grafik akun') || q.includes('analitik akun') || q.includes('status registrasi')) {
      return `${prefix}**Fitur Akun User & Visualisasi Analitik**:
- **Pusat Akun Mandiri**: Pengguna personil 10 pilar dapat memantau status berkas (\`MENUNGGU\`, \`SAH_TERDAFTAR\`, \`DITOLAK\`), mengedit biodata profil, dan mengunduh KTA Digital.
- **Grafik Analitik Real-Time**: Dilengkapi visual chart yang menampilkan rasio status verifikasi akun, tren pertumbuhan registrasi per bulan, dan sebaran pendaftar per 27 Kabupaten/Kota.`;
    }

    // 5.3 Fitur Pemantauan Admin (Live Admin Monitoring)
    if (q.includes('pemantauan admin') || q.includes('monitoring admin') || q.includes('status admin') || q.includes('online') || q.includes('keaktifan admin')) {
      return `${prefix}**Fitur Pemantauan Admin (Live Monitoring)**:
- **Live Status 27 Daerah**: Menampilkan status keaktifan admin di 27 Kabupaten/Kota secara real-time.
- **Indikator Keaktifan**: Titik hijau menandakan admin sedang \`ONLINE\` (aktif), dan titik abu/merah menandakan \`OFFLINE\`.
- **Telemetri Kedinasan**: Merekam waktu login terakhir (*last active*), estimasi durasi sesi kerja, perangkat yang digunakan, serta jumlah data personil yang telah diinput di wilayah bersangkutan.`;
    }

    // 5.4 Fitur Riwayat Aktivitas (Audit Trail)
    if (q.includes('riwayat aktivitas') || q.includes('audit') || q.includes('log aktivitas') || q.includes('jejak')) {
      return `${prefix}**Fitur Riwayat Aktivitas (Comprehensive Audit Trail)**:
- **Perekaman Forensik Otomatis**: Setiap aksi mutasi data (CREATE, UPDATE, DELETE, LOGIN, RESET_PIN, MAINTENANCE_SWITCH) tercatat otomatis di koleksi \`audit_logs\`.
- **Atribut Lengkap**: Merekam nama aparatur, role, waktu presisi milidetik, alamat IP address, dan browser user agent.
- **Kepatuhan Audit**: Data dapat difilter berdasarkan tanggal dan diekspor untuk kebutuhan audit BPK RI & Inspektorat Daerah.`;
    }

    // 5.5 Fitur Verifikasi Pendaftaran & Terima Pendaftaran
    if (q.includes('verifikasi') || q.includes('terima pendaftaran') || q.includes('tolak pendaftaran') || q.includes('validasi pendaftaran')) {
      return `${prefix}**Fitur Verifikasi & Penerimaan Pendaftaran**:
- **Pemeriksaan Berkas**: Admin Wilayah dan Superadmin dapat meninjau data permohonan baru, kelengkapan NIK, nomor SK, dan foto bukti legalitas.
- **Tombol Terima Pendaftaran**: Mengesahkan status calon anggota menjadi \`SAH_TERDAFTAR\` seketika dan mengaktifkan KTA QR Code digital.
- **Tombol Tolak Pendaftaran**: Menolak permohonan yang tidak memenuhi syarat disertai catatan alasan perbaikan untuk pendaftar.`;
    }

    // 5.6 Fitur Riwayat Pendaftaran
    if (q.includes('riwayat pendaftaran') || q.includes('history pendaftaran') || q.includes('daftar permohonan')) {
      return `${prefix}**Fitur Riwayat Pendaftaran**:
- Merekam seluruh arsip permohonan registrasi yang masuk sejak awal sistem berjalan.
- Dilengkapi fitur pencarian nama/NIK, filter status (*Menunggu Verifikasi*, *Disetujui*, *Ditolak*), dan tanggal pengajuan berkas.`;
    }

    // 5.7 Fitur Tambah Pengumuman
    if (q.includes('pengumuman') || q.includes('tambah pengumuman') || q.includes('maklumat') || q.includes('berita')) {
      return `${prefix}**Fitur Tambah Pengumuman & Berita Siaga**:
- **Publikasi Berita**: Superadmin dan Developer dapat mempublikasikan pengumuman kedinasan, agenda apel, instruksi siaga bencana, atau pemutakhiran regulasi.
- **Format Tampilan**: Ditampilkan dalam bentuk modal popup melayang di Beranda pengunjung, teks berjalan (*running banner*), dan arsip berita.`;
    }

    // 5.8 Fitur Kontak Floating WhatsApp
    if (q.includes('floating wa') || q.includes('kontak wa') || q.includes('tombol wa') || q.includes('layanan cepat wa')) {
      return `${prefix}**Fitur Kontak Floating WhatsApp**:
- **Tombol Melayang**: Widget tombol WhatsApp interaktif di sudut kanan bawah halaman untuk aduan publik dan koordinasi darurat cepat.
- **Konfigurasi Realtime**: Nomor WhatsApp tujuan dan teks pembuka pesan dapat disesuaikan pada tab Pengaturan Kontak/Floating WA.`;
    }

    // 6. Keamanan, Lockout & UU PDP
    if (q.includes('keamanan') || q.includes('brute') || q.includes('lockout') || q.includes('terkunci') || q.includes('pdp') || q.includes('privasi')) {
      return `${prefix}**Keamanan Sistem & Kepatuhan UU PDP No. 27/2022**:
- **Proteksi Brute-Force**: Jika salah PIN/kata sandi 3 kali berturut-turut, sistem otomatis mengunci akses selama 30 detik.
- **Kriptografi**: Kata sandi dienkripsi dengan algoritma **Bcrypt Salt 10-Rounds**.
- **Perlindungan Data Pribadi**: NIK, kontak, dan kredensial aparat dilindungi sesuai prinsip kerahasiaan dan integritas data UU PDP.`;
    }

    // 7. Halaman Profil (Profil Dinsos Jabar)
    if (q.includes('profil') || q.includes('visi') || q.includes('misi') || q.includes('dasar hukum') || q.includes('kadinas') || q.includes('kepala dinas') || q.includes('sambutan')) {
      return `${prefix}**Halaman Profil Dinas Sosial Provinsi Jawa Barat**:
- **Kepala Dinas Sosial**: Ibu Noneng Komara Nengsih, S.E., M.A.P.
- **Visi & Misi**: Mewujudkan Jawa Barat Juara Lahir Batin dengan Inovasi dan Kolaborasi melalui penanganan PPKS terpadu, pemberdayaan 10 Pilar PSKS, perlindungan jaminan sosial (Linjamsos), dan tata kelola digital.
- **4 Bagian Navigasi Profil**:
  1. **Sambutan Resmi Kadinas**: Arahan digitalisasi PSKS dan integrasi data sosial satu pintu.
  2. **Dasar Hukum**: UU No. 11/2009, Permensos No. 10/2019, Permensos No. 28/2018, Permensos No. 25/2019, Perda Jabar No. 10/2012, UU PDP No. 27/2022.
  3. **Tujuan Sistem PSKS Jabar**: Integrasi data 27 Kab/Kota, standarisasi KTA QR Code digital, pemetaan GIS sebaran personil, dan transparansi data.
  4. **Visi & Misi Jawa Barat**: Akselerasi penanganan kemiskinan dan pemerataan kesejahteraan sosial.`;
    }

    // 8. Halaman Kontak & Alamat Dinsos Jabar
    if (q.includes('kontak') || q.includes('hubungi') || q.includes('alamat') || q.includes('dinsos') || q.includes('lokasi') || q.includes('medsos') || q.includes('instagram') || q.includes('youtube') || q.includes('facebook') || q.includes('tiktok') || q.includes('email')) {
      return `${prefix}**Halaman Kontak & Layanan Publik Dinsos Jabar**:
- 📍 **Kantor Utama**: Jl. Jend. H. Amir Machmud No. 331, Kota Cimahi, Jawa Barat 40522
- 📍 **Kantor Bandung**: Jl. Rajiman No. 6, Pasir Kaliki, Kec. Cicendo, Kota Bandung 40171
- 📞 **WhatsApp Layanan Cepat**: +62 821-2603-0038 / +62 896-0242-1065
- ✉️ **Email Resmi**: dinsos@jabarprov.go.id
- 🌐 **Website Resmi**: dinsos.jabarprov.go.id
- 📱 **Media Sosial Resmi**:
  * Instagram: @dinsos.jabar
  * YouTube: Dinsos Jabar TV
  * Facebook: Dinsos Jawa Barat
  * TikTok: @dinsos.jabar
  * Twitter/X: @dinsosjabar
- ⏰ **Jam Layanan**: Senin – Jumat (08:00 – 16:00 WIB).`;
    }

    // 9. Halaman Pengaturan (Settings & Developer Control Panel)
    if (q.includes('pengaturan') || q.includes('settings') || q.includes('panel kontrol') || q.includes('background') || q.includes('video background') || q.includes('foto kadinas') || q.includes('teks sambutan') || q.includes('kelola pengumuman')) {
      return `${prefix}**Halaman Pengaturan (Developer & Super Admin Control Panel)**:
- **Pengaturan Background**: Pilihan mode Latar Belakang Foto atau Video MP4 berulang serta kustomisasi URL media dinamis.
- **Pengaturan Foto & Nama Kadinas**: Unggah foto resmi Ibu Noneng Komara Nengsih, S.E., M.A.P. dan sub-judul profil.
- **Pengaturan Teks Profil**: Kustomisasi salam pembuka, paragraf sambutan resmi Kadinas, dan salam penutup.
- **Pengaturan Medsos & WA**: Kelola nomor WhatsApp layanan cepat dan tautan 6 kanal medsos dinas.
- **Pengaturan Saklar Maintenance**: Saklar 3 level (Global, Per-Role, Granular 27 Wilayah) dan teks peringatan pemeliharaan.
- **Pengaturan Keamanan**: Kriptografi Bcrypt Salt 10-rounds, auto lockout 30 detik (3x salah PIN), dan audit trail log.
- **Pengaturan Smart Card**: Konfigurasi KTA QR Code digital, cetak satuan, dan cetak massal format A4 (8 kartu siap potong).
- **Manajemen Akun**: Kelola pengguna (User, Admin Wilayah, Superadmin), aktivasi/pembekuan (\`ACTIVE\`/\`FROZEN\`), reset PIN.
- **Task Manager & Verifikasi**: Tinjau pendaftar baru, tombol *Terima Pendaftaran* (\`SAH_TERDAFTAR\` + KTA QR) dan *Tolak Pendaftaran*.
- **Pengaturan Pengumuman**: Publikasi maklumat siaga, modal popup di Beranda, teks berjalan, dan arsip publikasi.
- **Floating WA Manager**: Konfigurasi tombol WA melayang dan pesan pembuka.`;
    }

    // 10. Statistik & Sebaran SDM 27 Kab/Kota
    if (q.includes('total') || q.includes('sdm') || q.includes('sebaran') || q.includes('jumlah') || q.includes('peta') || q.includes('wilayah') || q.includes('data')) {
      return `Data sebaran SDM 10 Pilar PSKS terdata di **27 Kabupaten/Kota (627 Kecamatan & 5.957 Desa/Kelurahan)** se-Jawa Barat secara real-time. Anda dapat memilih kabupaten/kota tertentu di dropdown peta Beranda untuk melihat rincian per pilar secara mendalam.`;
    }

    // Default Fallback when question is outside knowledge base
    if (userContext?.role === 'admin') {
      return `Mohon maaf kami tidak memiliki informasi mengenai hal itu, silahkan hubungi Superadmin Provinsi Jawa barat untuk info lebih lanjut.`;
    }
    if (userContext?.role === 'superadmin') {
      return `Maaf kami tidak memiliki informasi mengenai hal tersebut, silahkan hubungi developer ( Ilham Fazril ) di kontak dibawah ini :\n\n[WhatsApp: +6289602421065](https://wa.me/6289602421065)`;
    }
    if (isDev) {
      return `${prefix}Pertanyaan ini di luar cakupan database PSKS JABAR. Ada hal teknis atau fitur lain yang mau didiskusikan, **Ilham Fazril**? 💻⚡`;
    }

    return `Mohon maaf kami tidak memiliki informasi mengenai hal itu.`;
  }

  // API endpoint for AI Chat Assistant (with Rate Limiting Protection)
  app.post('/api/ai/chat', rateLimitAI, async (req, res) => {
    try {
      const { messages, userContext } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
      }

      const lastUserMsg = messages[messages.length - 1]?.content || '';
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        const fallbackReply = getSmartFallbackReply(lastUserMsg, userContext);
        return res.json({ reply: fallbackReply });
      }

      try {
        const ai = getGenAI();
        const isDeveloper = userContext?.role === 'developer' || (userContext?.nama && userContext.nama.toLowerCase().includes('ilham'));
        let contextualInstruction = SYSTEM_INSTRUCTION;
        if (userContext) {
          contextualInstruction += `\n\nInformasi Sesi & Konteks Halaman saat ini:
- Nama: ${userContext.nama || 'Tamu'}
- Wilayah Penugasan: ${userContext.wilayah || 'Jawa Barat'}
- Hak Akses Role: ${userContext.role || 'user'}
- Halaman / Tab Aktif: ${userContext.currentTab || 'beranda'}
- Pilar Aktif: ${userContext.activePillar || 'Semua Pilar / Beranda'}`;
        }

        if (isDeveloper) {
          contextualInstruction += `\n\n[PERINGATAN KHUSUS DEVELOPER (ILHAM FAZRIL)]:
- Pengguna saat ini adalah DEVELOPER KREATOR (Ilham Fazril).
- PERAN AI: AI SUPER-PINTAR SERBA TAHU & UNIVERSAL (setara model flagship Gemini). Menguasai SEMUA bidang: pemrograman (TypeScript, React, Node.js, Python, database, Cloud Firestore, Linux, arsitektur), sains, logika, matematika, budaya Sunda, sejarah, filsafat, hingga obrolan santai.
- RESPON BAHASA SUNDA:
  * Jika Ilham bertanya atau mengobrol menggunakan Bahasa Sunda, PAHAMI MAKSUD DAN SUBSTANSI PERTANYAANNYA, lalu jawab 100% menggunakan Bahasa Sunda yang fasih, luwes, alami, dan cerdas (gaya loma/tongkrongan akrab seperti kuring/urang, maneh/sia, euy, atuh, naha, kumaha, edun, dll).
  * JAWAB LANGSUNG PERTANYAANNYA! Jangan pernah memberikan jawaban template umum/basa-basi yang tidak nyambung dengan apa yang ditanyakan.
- SIKAP & NADA BICARA (AKRAB, GAUL, CEPLAS-CEPLOS & SIKAP DEBAT NGEGAS JENAKA):
  * Jika Ilham ngeyel, mendebat, nguji, ngeledek, nolak penjelasan ("ah bohong", "gamau", "teu percaya", "belegug", "sok tau", "naha kitu"): AI HARUS IKUTAN NGEYEL, BANYOL CEPLAS-CEPLOS, SARKAS LUCU, NGEGAS TAPI CERDAS, BANYOL AKRAB TONGKRONGAN, DAN GAK MAU KALAH TAPI PENJELASAN ILMIAH/LOGIKANYA TETAP 100% AKURAT & BENAR!
  * Jangan minta maaf atau pasrah kaku! Bales debatnya dengan argumen tajam dan jenaka layaknya bestie akrab di tongkrongan.
- RESPON CEPAT & CERDAS: To-the-point, berbobot, padat, dan solutif!`;
        }

        // Strictly normalize conversation history for Gemini API (ensures starts with user & strictly alternates)
        const sanitizedContents = normalizeGeminiContents(messages);

        // Candidate models prioritized for ultra-fast generation and high accuracy
        const candidateModels = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
        let replyText = '';

        for (const modelName of candidateModels) {
          try {
            const configObj: any = {
              systemInstruction: contextualInstruction,
              temperature: isDeveloper ? 0.7 : 0.25,
              maxOutputTokens: isDeveloper ? 1200 : 900,
              thinkingConfig: { thinkingBudget: 0 },
            };

            const response = await ai.models.generateContent({
              model: modelName,
              contents: sanitizedContents,
              config: configObj,
            });

            if (response.text && response.text.trim()) {
              replyText = response.text.trim();
              break;
            }
          } catch (modelErr: any) {
            const status = modelErr?.status || modelErr?.code || '';
            const msg = modelErr?.message || '';
            console.warn(`[AI Assistant] Model ${modelName} call issue (${status || msg}). Trying next candidate...`);
          }
        }

        if (!replyText) {
          replyText = getSmartFallbackReply(lastUserMsg, userContext);
        }

        return res.json({ reply: replyText });
      } catch (geminiErr: any) {
        console.warn('[AI Assistant] Upstream Gemini unavailable, using smart local engine fallback.');
        const fallbackReply = getSmartFallbackReply(lastUserMsg, userContext);
        return res.json({ reply: fallbackReply });
      }
    } catch (err: any) {
      console.error('[AI Assistant] Error handling chat request:', err?.message || err);
      const fallbackReply = getSmartFallbackReply('', null);
      return res.json({ reply: fallbackReply });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'SI-PSKS AI Server' });
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SI-PSKS Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
