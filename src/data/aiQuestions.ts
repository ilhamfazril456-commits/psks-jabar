import { UserRole } from '../types';

export interface AIQuestionItem {
  id: string;
  category: string;
  question: string;
  hint?: string;
  role: UserRole;
  answerSummary?: string;
}

export interface AICategoryGroup {
  category: string;
  iconName: string;
  description: string;
  questions: AIQuestionItem[];
}

export const ROLE_QUESTION_CATALOG: Record<UserRole, AICategoryGroup[]> = {
  user: [
    {
      category: '🌟 Panduan & Pengenalan Website',
      iconName: 'Sparkles',
      description: 'Fungsi utama, navigasi, dan layanan publik di website PSKS Jabar.',
      questions: [
        {
          id: 'u-2',
          category: 'Panduan Umum',
          role: 'user',
          question: 'Apa fungsi dan tujuan utama dari website PSKS Jabar?',
          hint: 'Tujuan & Manfaat Sistem',
        },
        {
          id: 'u-3',
          category: 'Panduan Umum',
          role: 'user',
          question: 'Bagaimana cara masyarakat mengakses data potensi kesejahteraan sosial?',
          hint: 'Akses Informasi Publik',
        },
        {
          id: 'u-4',
          category: 'Panduan Umum',
          role: 'user',
          question: 'Bagaimana cara mendaftar akun user atau relawan baru di PSKS JABAR?',
          hint: 'Prosedur Registrasi Akun',
        },
        {
          id: 'u-5',
          category: 'Panduan Umum',
          role: 'user',
          question: 'Apakah penggunaan layanan informasi publik di PSKS JABAR ini gratis?',
          hint: 'Layanan Publik (100% Gratis)',
        },
        {
          id: 'u-6',
          category: 'Panduan Umum',
          role: 'user',
          question: 'Bagaimana cara menghubungi layanan bantuan cepat atau kontak WhatsApp Dinsos Jabar?',
          hint: 'Kontak Floating WhatsApp',
        },
        {
          id: 'u-7',
          category: 'Panduan Umum',
          role: 'user',
          question: 'Bagaimana kebijakan privasi dan perlindungan data pribadi (UU PDP) di website ini?',
          hint: 'Keamanan Data UU No. 27/2022',
        },
        {
          id: 'u-8',
          category: 'Panduan Umum',
          role: 'user',
          question: 'Bagaimana cara melihat pengumuman dan berita terbaru dari Dinas Sosial Jawa Barat?',
          hint: 'Fitur Pengumuman & Berita',
        },
      ],
    },
    {
      category: '🏛️ 10 Pilar PSKS Jawa Barat',
      iconName: 'Building2',
      description: 'Penjelasan lengkap tugas, fungsi, dan peran ke-10 pilar sosial.',
      questions: [
        {
          id: 'u-9',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Sebutkan 10 Pilar Utama PSKS yang terdaftar di PSKS Jabar!',
          hint: '10 Pilar Resmi',
        },
        {
          id: 'u-10',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa tugas, peran, dan fungsi Pekerja Sosial Masyarakat (PSM)?',
          hint: 'Pilar PSM Desa/Kelurahan',
        },
        {
          id: 'u-11',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Bagaimana peran dan kesiapsiagaan TAGANA dalam mitigasi bencana di Jawa Barat?',
          hint: 'Pilar Taruna Siaga Bencana',
        },
        {
          id: 'u-12',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa itu Lembaga Kesejahteraan Sosial (LKS) dan apa syarat pendaftarannya?',
          hint: 'Pilar Yayasan/LKS',
        },
        {
          id: 'u-13',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa peran strategis Karang Taruna dalam pemberdayaan pemuda desa/kelurahan?',
          hint: 'Pilar Karang Taruna',
        },
        {
          id: 'u-14',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Layanan apa saja yang disediakan oleh LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)?',
          hint: 'Pilar LK3 Konseling',
        },
        {
          id: 'u-15',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa perbedaan tugas antara Tenaga Kesejahteraan Sosial Kecamatan (TKSK) dan PSM?',
          hint: 'Perbedaan TKSK vs PSM',
        },
        {
          id: 'u-16',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa fungsi SLRT / Puskesos dalam menangani rujukan kemiskinan warga?',
          hint: 'Pusat Kesejahteraan Sosial',
        },
        {
          id: 'u-17',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa yang dimaksud dengan KUBE dan Badan Usaha Sosial di Dinsos Jabar?',
          hint: 'Kelompok Usaha Bersama',
        },
        {
          id: 'u-18',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa peran Penyuluh Sosial Masyarakat (PENSOS) dalam advokasi program sosial?',
          hint: 'Pilar Penyuluh Sosial',
        },
        {
          id: 'u-19',
          category: '10 Pilar PSKS',
          role: 'user',
          question: 'Apa itu Pekerja Sosial Profesional (PKSP) dan bagaimana standar sertifikasinya?',
          hint: 'Pilar PKSP Profesional',
        },
      ],
    },
    {
      category: '🗺️ Peta Wilayah & Statistik Jawa Barat',
      iconName: 'MapPin',
      description: 'Sebaran personil pilar sosial di 27 Kabupaten/Kota dan 627 Kecamatan.',
      questions: [
        {
          id: 'u-20',
          category: 'Peta & Statistik',
          role: 'user',
          question: 'Berapa total sebaran personil pilar sosial di 27 Kabupaten/Kota Jawa Barat?',
          hint: 'Total Statistik SDM',
        },
        {
          id: 'u-21',
          category: 'Peta & Statistik',
          role: 'user',
          question: 'Bagaimana cara membaca peta interaktif sebaran wilayah di halaman Beranda?',
          hint: 'Navigasi Peta Interaktif',
        },
        {
          id: 'u-22',
          category: 'Peta & Statistik',
          role: 'user',
          question: 'Kabupaten/Kota mana saja yang memiliki jumlah relawan Tagana terbanyak?',
          hint: 'Sebaran Tagana Daerah',
        },
        {
          id: 'u-23',
          category: 'Peta & Statistik',
          role: 'user',
          question: 'Berapa jumlah total kecamatan dan desa/kelurahan yang terlayani di Jawa Barat?',
          hint: 'Cakupan Wilayah Jabar',
        },
      ],
    },
  ],

  admin: [
    {
      category: '📋 Manajemen Data Pilar & Wilayah',
      iconName: 'Users',
      description: 'Tata kelola entri data anggota, validasi NIK/NIP, dan mutasi daerah.',
      questions: [
        {
          id: 'a-1',
          category: 'Manajemen Data',
          role: 'admin',
          question: 'Bagaimana SOP penambahan personil/lembaga pilar sosial baru di wilayah saya?',
          hint: 'Input Anggota Baru',
        },
        {
          id: 'a-2',
          category: 'Manajemen Data',
          role: 'admin',
          question: 'Bagaimana cara memutasi personil yang pindah tugas antar kecamatan di daerah saya?',
          hint: 'Mutasi Antar Kecamatan',
        },
        {
          id: 'a-3',
          category: 'Manajemen Data',
          role: 'admin',
          question: 'Bagaimana sistem mendeteksi dan mencegah duplikasi data NIK/NIP saat penginputan?',
          hint: 'Pencegahan Data Ganda',
        },
        {
          id: 'a-4',
          category: 'Manajemen Data',
          role: 'admin',
          question: 'Bagaimana cara menonaktifkan personil pilar sosial yang telah purna tugas atau wafat?',
          hint: 'Deaktivasi & Purna Tugas',
        },
        {
          id: 'a-5',
          category: 'Manajemen Data',
          role: 'admin',
          question: 'Dokumen dan bukti legalitas apa saja yang wajib diunggah untuk registrasi LKS?',
          hint: 'Legalitas Yayasan LKS',
        },
        {
          id: 'a-6',
          category: 'Manajemen Data',
          role: 'admin',
          question: 'Bagaimana cara memperbarui Surat Keputusan (SK) penugasan berkala anggota pilar?',
          hint: 'Perpanjangan SK Penugasan',
        },
        {
          id: 'a-7',
          category: 'Manajemen Data',
          role: 'admin',
          question: 'Bagaimana cara melakukan filtering data pilar berdasarkan kelurahan atau status keaktifan?',
          hint: 'Filter Data Presisi',
        },
      ],
    },
    {
      category: '✅ Verifikasi & Riwayat Pendaftaran',
      iconName: 'CheckCircle2',
      description: 'Verifikasi berkas calon anggota, terima pendaftaran, dan riwayat Task Manager.',
      questions: [
        {
          id: 'a-verif-1',
          category: 'Verifikasi Pendaftaran',
          role: 'admin',
          question: 'Bagaimana alur verifikasi berkas pendaftaran calon anggota baru di wilayah saya?',
          hint: 'Alur Verifikasi Masuk',
        },
        {
          id: 'a-verif-2',
          category: 'Verifikasi Pendaftaran',
          role: 'admin',
          question: 'Bagaimana cara menerima (approve) atau menolak pendaftaran di Task Manager Wilayah?',
          hint: 'Fitur Terima Pendaftaran',
        },
        {
          id: 'a-verif-3',
          category: 'Verifikasi Pendaftaran',
          role: 'admin',
          question: 'Bagaimana cara melihat riwayat pendaftaran dan tracking status calon relawan?',
          hint: 'Riwayat Pendaftaran',
        },
        {
          id: 'a-verif-4',
          category: 'Verifikasi Pendaftaran',
          role: 'admin',
          question: 'Apa syarat minimal keabsahan dokumen SK penugasan agar pendaftaran dapat disetujui?',
          hint: 'Syarat SK Penugasan',
        },
      ],
    },
    {
      category: '📊 Laporan, Rekapitulasi & Ekspor Dokumen',
      iconName: 'FileSpreadsheet',
      description: 'Pembuatan laporan resmi daerah, ekspor Excel (.xlsx), dan cetak dokumen PDF.',
      questions: [
        {
          id: 'a-8',
          category: 'Laporan & Ekspor',
          role: 'admin',
          question: 'Bagaimana cara mengekspor rekapitulasi data pilar ke format Excel (.xlsx) resmi?',
          hint: 'Ekspor Spreadsheet XLSX',
        },
        {
          id: 'a-9',
          category: 'Laporan & Ekspor',
          role: 'admin',
          question: 'Bagaimana cara mencetak lembar rekapitulasi bertandatangan digital dalam format PDF?',
          hint: 'Cetak Laporan PDF',
        },
        {
          id: 'a-10',
          category: 'Laporan & Ekspor',
          role: 'admin',
          question: 'Bagaimana cara menganalisis rasio kebutuhan relawan sosial per 1.000 penduduk di wilayah saya?',
          hint: 'Analisis Rasio Relawan',
        },
        {
          id: 'a-11',
          category: 'Laporan & Ekspor',
          role: 'admin',
          question: 'Bagaimana menyusun data statistik pilar untuk bahan Musrenbang Kabupaten/Kota?',
          hint: 'Data Dukung Musrenbang',
        },
      ],
    },
    {
      category: '🔒 Keamanan & Riwayat Aktivitas Daerah',
      iconName: 'ShieldAlert',
      description: 'Manajemen kredensial, log audit aktivitas daerah, dan pencegahan lockout.',
      questions: [
        {
          id: 'a-17',
          category: 'Keamanan Daerah',
          role: 'admin',
          question: 'Bagaimana cara mengganti PIN Wilayah dan kata sandi akun Admin Daerah secara aman?',
          hint: 'Ganti Kata Sandi / PIN',
        },
        {
          id: 'a-18',
          category: 'Keamanan Daerah',
          role: 'admin',
          question: 'Apa yang harus dilakukan jika akun Admin Daerah terkunci akibat sistem Brute-Force lockout?',
          hint: 'Penanganan Akun Terkunci',
        },
        {
          id: 'a-act-log',
          category: 'Keamanan Daerah',
          role: 'admin',
          question: 'Bagaimana cara melihat riwayat aktivitas (Activity Log) mutasi data di wilayah saya?',
          hint: 'Log Riwayat Aktivitas',
        },
        {
          id: 'a-20',
          category: 'Keamanan Daerah',
          role: 'admin',
          question: 'Bagaimana memastikan kepatuhan pengelolaan data anggota di daerah terhadap UU PDP No. 27/2022?',
          hint: 'Kepatuhan UU PDP',
        },
      ],
    },
  ],

  superadmin: [
    {
      category: '👑 Pengawasan Provinsi & Pemantauan Admin',
      iconName: 'Crown',
      description: 'Pemantauan live status admin daerah 27 kab/kota, agregat se-Jabar, dan laporan provinsi.',
      questions: [
        {
          id: 'sa-1',
          category: 'Pengawasan Provinsi',
          role: 'superadmin',
          question: 'Bagaimana cara memantau total agregat 10 Pilar se-27 Kabupaten/Kota secara real-time?',
          hint: 'Dashboard Agregat Jabar',
        },
        {
          id: 'sa-mon-admin',
          category: 'Pengawasan Provinsi',
          role: 'superadmin',
          question: 'Bagaimana cara kerja fitur Pemantauan Admin (Live status online/offline 27 Kab/Kota)?',
          hint: 'Pemantauan Admin Daerah',
        },
        {
          id: 'sa-3',
          category: 'Pengawasan Provinsi',
          role: 'superadmin',
          question: 'Bagaimana cara mendeteksi wilayah yang mengalami kekurangan atau surplus relawan Tagana/TKSK?',
          hint: 'Peta Ketimpangan Relawan',
        },
        {
          id: 'sa-4',
          category: 'Pengawasan Provinsi',
          role: 'superadmin',
          question: 'Bagaimana menyusun laporan komprehensif tahunan potensi kesejahteraan sosial untuk Kepala Dinas?',
          hint: 'Laporan Eksekutif Kadinas',
        },
      ],
    },
    {
      category: '👥 Manajemen Akun User & Admin Daerah',
      iconName: 'UserCheck',
      description: 'Manajemen akun user, aktivasi/freeze akun, reset PIN darurat, dan analitik pengguna.',
      questions: [
        {
          id: 'sa-user-mgmt',
          category: 'Manajemen Akun Admin',
          role: 'superadmin',
          question: 'Bagaimana cara kerja Fitur Manajemen Akun Admin (mengubah status ACTIVE/FROZEN dan kelola admin daerah)?',
          hint: 'Manajemen Akun Admin Terpadu',
        },
        {
          id: 'sa-user-analytics',
          category: 'Manajemen Akun',
          role: 'superadmin',
          question: 'Bagaimana cara membaca grafik analisis akun user (User Account Analytics Chart)?',
          hint: 'Visualisasi Analitik User',
        },
        {
          id: 'sa-5',
          category: 'Manajemen Akun',
          role: 'superadmin',
          question: 'Bagaimana SOP mereset PIN / kata sandi Admin Daerah yang lupa kredensial login?',
          hint: 'Reset Kredensial Daerah',
        },
        {
          id: 'sa-6',
          category: 'Manajemen Akun',
          role: 'superadmin',
          question: 'Bagaimana cara membuka blokir akun daerah yang terbekukan akibat Brute-Force lockout?',
          hint: 'Buka Blokir Akun',
        },
      ],
    },
    {
      category: '📢 Pengumuman & Kontak Floating WhatsApp',
      iconName: 'Megaphone',
      description: 'Penambahan pengumuman darurat, popup floating banner, dan konfigurasi kontak WA.',
      questions: [
        {
          id: 'sa-ann-add',
          category: 'Pengumuman & Kontak WA',
          role: 'superadmin',
          question: 'Bagaimana cara menambah pengumuman baru, broadcast alert, atau floating popup di Beranda?',
          hint: 'Fitur Tambah Pengumuman',
        },
        {
          id: 'sa-wa-float',
          category: 'Pengumuman & Kontak WA',
          role: 'superadmin',
          question: 'Bagaimana cara mengonfigurasi nomor kontak WhatsApp melayang (Floating WA Manager)?',
          hint: 'Pengaturan Kontak Floating WA',
        },
        {
          id: 'sa-ann-manage',
          category: 'Pengumuman & Kontak WA',
          role: 'superadmin',
          question: 'Bagaimana cara mengedit, menghapus, atau mengatur visibilitas pengumuman Dinsos Jabar?',
          hint: 'Manajemen Pengumuman',
        },
      ],
    },
    {
      category: '⚙️ Saklar Maintenance Cerdas & Kesiapan Sistem',
      iconName: 'ToggleRight',
      description: 'Pengendalian saklar pemeliharaan per-role, per-wilayah granular, dan pesan darurat.',
      questions: [
        {
          id: 'sa-9',
          category: 'Saklar Maintenance',
          role: 'superadmin',
          question: 'Bagaimana cara mengaktifkan Mode Maintenance khusus untuk role Publik (User) tanpa mematikan akses Admin?',
          hint: 'Maintenance Per Role',
        },
        {
          id: 'sa-10',
          category: 'Saklar Maintenance',
          role: 'superadmin',
          question: 'Bagaimana cara mengaktifkan Mode Maintenance granular hanya untuk satu Kabupaten/Kota tertentu?',
          hint: 'Maintenance Per Wilayah',
        },
        {
          id: 'sa-11',
          category: 'Saklar Maintenance',
          role: 'superadmin',
          question: 'Bagaimana cara menulis dan memperbarui pesan pengumuman pemeliharaan darurat di layar pengguna?',
          hint: 'Custom Banner Maintenance',
        },
      ],
    },
    {
      category: '🔍 Riwayat Aktivitas (Audit Trail) & Keamanan',
      iconName: 'ShieldAlert',
      description: 'Pemeriksaan riwayat perubahan data, jejak digital aparat, IP address, dan forensik.',
      questions: [
        {
          id: 'sa-12',
          category: 'Audit Trail & Keamanan',
          role: 'superadmin',
          question: 'Bagaimana cara membaca log Riwayat Aktivitas (Audit Trail) untuk melacak perubahan data?',
          hint: 'Pelacakan Jejak Digital',
        },
        {
          id: 'sa-14b',
          category: 'Audit Trail & Keamanan',
          role: 'superadmin',
          question: 'Bagaimana cara mengekspor log riwayat aktivitas untuk bahan audit BPK / Inspektorat Daerah?',
          hint: 'Ekspor Log Audit BPK',
        },
        {
          id: 'sa-15',
          category: 'Audit Trail & Keamanan',
          role: 'superadmin',
          question: 'Bagaimana integrasi data PSKS JABAR dengan platform Satu Data Jawa Barat dan DTKS Kemensos?',
          hint: 'Satu Data & DTKS',
        },
      ],
    },
  ],

  developer: [
    {
      category: '💻 Arsitektur Full-Stack & Developer Control Panel',
      iconName: 'Terminal',
      description: 'Struktur React 18, Vite, Express Proxy, Tailwind CSS 4, dan modul Developer Panel.',
      questions: [
        {
          id: 'd-1',
          category: 'Arsitektur & Panel',
          role: 'developer',
          question: 'Bagaimana arsitektur teknis PSKS Jabar (Frontend React 18, Vite, Express, Tailwind)?',
          hint: 'Arsitektur Full-Stack',
        },
        {
          id: 'd-2',
          category: 'Arsitektur & Panel',
          role: 'developer',
          question: 'Fitur dan modul apa saja yang tersedia di dalam Developer Control Panel?',
          hint: 'Modul Developer Control',
        },
        {
          id: 'd-3',
          category: 'Arsitektur & Panel',
          role: 'developer',
          question: 'Bagaimana alur autentikasi token JWT dan enkripsi sandi dengan Bcrypt Salt 10?',
          hint: 'Kriptografi & Token JWT',
        },
        {
          id: 'd-4',
          category: 'Arsitektur & Panel',
          role: 'developer',
          question: 'Bagaimana mekanisme server proxy Gemini 3.7 Flash AI pada backend Express?',
          hint: 'Arsitektur Gemini Proxy',
        },
        {
          id: 'd-5',
          category: 'Arsitektur & Panel',
          role: 'developer',
          question: 'Bagaimana cara menjalankan pengujian simulasi Brute-Force lockout dan IP freezing?',
          hint: 'Simulasi Serangan Siber',
        },
        {
          id: 'd-5b',
          category: 'Arsitektur & Panel',
          role: 'developer',
          question: 'Bagaimana implementasi State Management dan optimasi re-render pada tabel ribuan personil?',
          hint: 'Optimasi Re-render React',
        },
      ],
    },
    {
      category: '🔥 Database Firestore, Schema & Caching Engine',
      iconName: 'Database',
      description: 'Skema koleksi NoSQL, Security Rules, backup JSON, dan efisiensi query.',
      questions: [
        {
          id: 'd-6',
          category: 'Database & Caching',
          role: 'developer',
          question: 'Bagaimana struktur schema NoSQL database Firestore untuk koleksi pilar, akun, dan pengumuman?',
          hint: 'Skema Firestore NoSQL',
        },
        {
          id: 'd-7',
          category: 'Database & Caching',
          role: 'developer',
          question: 'Bagaimana aturan keamanan (Firestore Security Rules) yang diterapkan pada database?',
          hint: 'Firestore Security Rules',
        },
        {
          id: 'd-8',
          category: 'Database & Caching',
          role: 'developer',
          question: 'Bagaimana cara melakukan backup data schema ke JSON dan melakukan restore cadangan?',
          hint: 'Backup & Restore JSON',
        },
        {
          id: 'd-9',
          category: 'Database & Caching',
          role: 'developer',
          question: 'Bagaimana strategi caching client-side untuk meminimalkan beban query Firebase Firestore?',
          hint: 'Optimasi Read/Write Cache',
        },
      ],
    },
    {
      category: '🛡️ Keamanan Siber, Anti-Jailbreak, UU PDP & CI/CD',
      iconName: 'ShieldCheck',
      description: 'Proteksi XSS/CSRF, sanitasi input, tsc check, anti-jailbreak, dan streaming fallback.',
      questions: [
        {
          id: 'd-15',
          category: 'Keamanan & Kualitas',
          role: 'developer',
          question: 'Bagaimana implementasi proteksi XSS, CSRF, dan sanitasi input pada endpoint API?',
          hint: 'Sanitasi & Proteksi Web',
        },
        {
          id: 'd-16',
          category: 'Keamanan & Kualitas',
          role: 'developer',
          question: 'Bagaimana penerapan enkripsi data identitas pribadi (NIK/NIP) sesuai UU PDP No. 27/2022?',
          hint: 'Kriptografi Data NIK/NIP',
        },
        {
          id: 'd-17',
          category: 'Keamanan & Kualitas',
          role: 'developer',
          question: 'Bagaimana cara memverifikasi kesehatan kode dengan npm run build dan tsc --noEmit?',
          hint: 'Verifikasi CI/Build',
        },
        {
          id: 'd-18',
          category: 'Keamanan & Kualitas',
          role: 'developer',
          question: 'Bagaimana arsitektur failover multi-model Gemini (3.7-flash -> 2.5-flash -> 2.5-flash-lite) saat terjadi throttling?',
          hint: 'Multi-Model Fallback Cascade',
        },
        {
          id: 'd-19',
          category: 'Keamanan & Kualitas',
          role: 'developer',
          question: 'Bagaimana sistem AI dirancang kebal terhadap prompt injection, jailbreak, dan social engineering?',
          hint: 'Sistem Anti-Jailbreak AI',
        },
      ],
    },
  ],
};
