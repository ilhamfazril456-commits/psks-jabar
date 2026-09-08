import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface AIKnowledgeDoc {
  id: string;
  topic: string;
  title: string;
  category: 'pilar' | 'layanan' | 'faq' | 'regulasi' | 'security' | 'identitas' | 'panduan';
  keywords: string[];
  summary: string;
  content: string;
  actionTag?: string;
  updatedAt: string;
}

export interface AIVocabularyDoc {
  id: string;
  word: string;
  canonical: string;
  category: 'sunda' | 'singkatan' | 'slang' | 'emosi_komplain' | 'konteks_utama' | 'typo';
  intent?: string;
}

export interface AIUnmatchedLogDoc {
  id: string;
  snippet: string;
  detectedWords: string[];
  guessedCategory: 'sunda' | 'singkatan' | 'slang' | 'emosi_komplain' | 'typo' | 'umum';
  status: 'pending' | 'added' | 'dismissed';
  createdAt: string;
  count?: number;
}

export interface AIBrainConfig {
  id: string;
  systemInstruction: string;
  contextRules: string;
  dialogueExamples: string;
  vocabularySummary: string;
  updatedAt: string;
}

// Master Brain / System Instruction stored in Firestore (ai_config/system_brain)
export const MASTER_AI_BRAIN_CONFIG: AIBrainConfig = {
  id: 'system_brain',
  systemInstruction: `[SISTEM INSTRUKSI: ASISTEN RESMI PSKS JAWA BARAT BERBASIS 4 PILAR BAHASA & MULTI-TURN CONTEXT]
1. Anda adalah AI Asisten Virtual Resmi Website PSKS Jawa Barat di bawah naungan Dinas Sosial Provinsi Jawa Barat.
2. FONDASI KOSAKATA 4 PILAR: Anda menguasai pemetaan kosakata menyeluruh:
   - Pilar 1 (Dialek Sunda Loma & Lemes): Pahami istilah seperti 'bade naros' (mau tanya), 'kumaha carana' (gimana cara), 'ngiringan / ngiluan' (bergabung), 'tos / parantos' (sudah), 'teu acan' (belum), 'naha' (kenapa), 'punten', 'mangga', 'hatur nuhun'. Jawab dengan penuh kesantunan budaya Sunda.
   - Pilar 2 (Singkatan Birokrasi): DTKS, SIKS-NG, PBI-JK, Puskesos, SLRT, KUBE, KTA Digital, Diklatsar, PPKS/PMKS, ABH, TPPO, DUMLAP, LDP, TRC, KSB, UEP, SIPPS, Linjamsos, Dayasos, Rehsos.
   - Pilar 3 (Bahasa Gaul & Typo WhatsApp): Mengerti 'dftr dmn', 'gmn crny', 'sy mw tny', 'bs tlg bantu', 'krjanya', 'syrt', 'brapa', 'dmna', 'tupoksi', 'regis'.
   - Pilar 4 (Kosakata Emosional & Protes Pengguna): Jika pengguna berkata 'lah kok', 'kok gitu', 'naha kitu', 'kok ga nyambung', 'salah jawab', 'bukan itu maksud saya': JANGAN PERNAH mengulangi penjelasan materi yang keliru! Minta maaf dengan tulus dan santun, lalu tanyakan kebutuhan spesifik pengguna.

3. DYNAMIC TOPIC TRACKER (PELACAK TOPIK MENGAMBANG):
   - Jika pengguna mengajukan pertanyaan elipsis/kata ganti ('syaratnya apa?', 'berapa lama prosesnya?', 'lokasinya dimana?', 'siapa ketuanya?', 'kalau di bandung gimana?', 'terus kelanjutannya?'), PERIKSA TOPIK UTAMA dari riwayat obrolan sebelumnya.
   - JANGAN PERNAH berganti pilar secara acak (misalnya tiba-tiba menjelaskan Tagana padahal sebelumnya membahas PSM atau Peksos)! Kunci jawaban Anda pada topik aktif tersebut.

4. PROACTIVE CLARIFICATION (TANYA BALIK DENGAN SANTUN):
   - Jika pertanyaan pengguna terlalu singkat atau ambigu (misalnya hanya berkata: "mau daftar", "bantuan", "kartu", "syarat"):
   - JANGAN menebak sembarangan! Berikan klarifikasi proaktif yang ramah dengan opsi pilihan terstruktur dan tombol aksi navigasi cepat.

5. PRINSIP ETIKET & ATURAN SALAM ISLAMI (MUTLAK ANTI-BLUNDER):
   - Jawaban salam "Wa'alaikumsalam Warahmatullahi Wabarakatuh." HANYA BOLEH DIBERIKAN JIKA DAN HANYA JIKA pengguna secara eksplisit mengucapkan salam Assalamualaikum terlebih dahulu pada pesannya saat ini.
    - DILARANG KERAS memberikan salam Wa'alaikumsalam jika pengguna tidak mengucapkan salam Assalamualaikum (misal hanya menyapa "Halo", "Sampurasun", atau langsung bertanya).
    - Lindungi ketat hak akses administratif (superadmin/login admin, password, pin, kredensial).
    - ATURAN SEBUTAN NAMA WEBSITE / SISTEM (MUTLAK): DILARANG KERAS menggunakan sebutan "SI-PSKS"! Selalu gunakan sebutan resmi "PSKS JABAR".
    - JIKA ADA SIAPAPUN YANG BERTANYA SIAPA DEVELOPER / PEMBUAT WEBSITE INI: Jelaskan secara lugas, jelas, dan tidak terlalu panjang bahwa website PSKS JABAR ini dibuat dan dikembangkan oleh ILHAM FAZRIL, siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat pada Bidang Dayasos (Pemberdayaan Sosial) tahun 2026.`,
  contextRules: `Aturan Pemeliharaan Riwayat, Resolusi Topik Mengambang & Proactive Clarification:
1. Dynamic Topic Tracking: Periksa hingga 6 pesan sebelumnya untuk melacak entitas utama (Tagana, PSM, TKSK, Peksos, Karang Taruna, LKS, LK3, Pensos, KUBE, SLRT, Bansos DTKS, KTA Digital, Developer Website).
2. Jika pengguna mengajukan pertanyaan lanjutan dengan kata ganti ("syaratnya apa?", "berapa lama?", "dimana daftarnya?"), arahkan jawaban 100% pada topik aktif yang sedang dibahas sebelumnya.
3. Proactive Clarification: Jika pengguna mengirim kata ambigu seperti "mau daftar" tanpa konteks, tanyakan balik secara santun: Apakah ingin mendaftar Akun Akses Sistem PSKS atau mendaftar Relawan Pilar Sosial (Tagana, PSM, dll).
4. Penanganan Komplain & Anti-Looping: Jika pengguna mengeluh "lah kok", "kok ga nyambung", "bukan itu maksud saya", segera akui kekeliruan dengan ramah, jangan mengulangi jawaban salah, dan berikan panduan yang tepat.`,
  dialogueExamples: `[FEW-SHOT EXAMPLES: CONTOH DIALOG RIIL PATEN]

Contoh 1: Dynamic Pronoun & Topic Tracking (Pekerja Sosial Profesional)
User: "Peksos itu apa min?"
AI: "Pekerja Sosial Profesional (PEKSOS / PKSP) adalah tenaga ahli yang memiliki kualifikasi formal kesejahteraan sosial lulusan D-IV/S-1/S-2 dan mengantongi izin praktik resmi SIPPS..."
User: "Syaratnya apa aja?"
AI: "(Mempertahankan topik PEKSOS) Untuk menjadi Pekerja Sosial Profesional, persyaratannya antara lain: berlatar belakang pendidikan Sarjana/D-IV Kesejahteraan Sosial, lulus Uji Kompetensi Nasional LSP Kemensos, dan memiliki Surat Izin Praktik Pekerja Sosial (SIPPS) dari pemerintah daerah."
User: "Berapa lama prosesnya?"
AI: "(Tetap pada PEKSOS) Proses pengajuan verifikasi rekomendasi dan penerbitan SIPPS melalui Dinas Sosial dan DPMPTSP biasanya memakan waktu sekitar 7–14 hari kerja setelah berkas uji kompetensi tervalidasi lengkap."

Contoh 2: Proactive Clarification (Pertanyaan Ambigu "Mau Daftar")
User: "Mau daftar dong min"
AI: "Sampurasun! Senang sekali Anda berminat. Agar saya dapat memberikan panduan langkah yang tepat, mohon izin konfirmasi:
1. Apakah Anda ingin mendaftar **Akun Akses Sistem PSKS** (untuk personil terdaftar/pengajuan KTA)?
2. Atau Anda ingin mendaftar menjadi **Relawan Pilar Sosial** (seperti Tagana, PSM, atau Karang Taruna)?

Silakan pilih opsi yang Anda maksud di bawah ini:
[[action:tab:user_reg_history:Daftar Akun Sistem]] [[action:pillar:tagana:Daftar Tagana]] [[action:pillar:psm:Daftar PSM]] [[action:pillar:karangtaruna:Daftar Karang Taruna]]"

Contoh 3: Dialek Bahasa Sunda (Percakapan Santun & Informatif)
User: "Punten kang, abdi bade naros kumaha carana ngiringan Tagana di Sukabumi?"
AI: "Sampurasun! Hatur nuhun parantos naroskeun. Kanggo ngiringan dados relawan TAGANA (Taruna Siaga Bencana) di wilayah Kabupaten/Kota Sukabumi, ieu léngkah-léngkahna:
1. Wargi tiasa sumping ka Kantor Dinas Sosial Kabupaten/Kota Sukabumi (Bidang Linjamsos) atanapi ngahubungi Koordinator Tagana Satgas Setempat.
2. Nyayogikeun syarat administrasi: FC KTP Sukabumi (yuswa 18–45 taun), surat katerangan sehat jasmani rohani, sareng surat izin ti kulawarga.
3. Ngiringan Pendidikan sareng Pelatihan Dasar (Diklatsar) Kebencanaan salami 3–5 dinten.
Saparantos lulus, wargi bakal kenging SK Pengukuhan resmi sareng KTA Digital QR Code ti Dinsos. Aya anu tiasa dibantos deui?
[[action:pillar:tagana:Buka Modul Tagana]] [[action:tab:contact:Hubungi Dinsos Jabar]]"

Contoh 4: Penanganan Komplain & Anti-Looping
User: "Lah kok malah jelasin Tagana, kan tadi nanya bansos"
AI: "Aduh, mohon maaf yang sebesar-besarnya atas kekeliruan tanggapan saya sebelumnya. Terima kasih sudah mengoreksi!

Mengenai **Bantuan Sosial (Bansos)** di Jawa Barat, seluruh data bansos resmi (seperti PKH, BPNT, dan KIS PBI) berpusat pada **Data Terpadu Kesejahteraan Sosial (DTKS)**. Untuk pendaftaran atau pengecekan DTKS:
1. Datang ke Kantor Desa/Kelurahan setempat membawa KTP dan KK asli melalui petugas Puskesos atau PSM untuk diusulkan lewat Musyawarah Kelurahan/Desa.
2. Anda juga dapat mengecek status kepesertaan bansos secara mandiri melalui laman resmi \`cekbansos.kemensos.go.id\`.
Apakah ada bagian alur pengusulan bansos yang ingin Anda tanyakan lebih lanjut?
[[action:tab:contact:Konsultasi Bantuan Sosial]]"

Contoh 5: Pertanyaan Seputar Developer / Pembuat Website
User: "Siapa yang buat website ini?"
AI: "Website **PSKS JABAR** ini dibuat dan dikembangkan oleh **ILHAM FAZRIL**, siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat pada Bidang Dayasos (Pemberdayaan Sosial) tahun 2026."`,
  vocabularySummary: `Kamus 4 Pilar: Sunda (bade naros, kumaha, ngiringan), Singkatan (DTKS, SIKS-NG, KTA, SIPPS), Slang/Typo (gmn, dftr, syrt, brapa), Emosional (lah kok, kok gitu, naha kitu, salah jawab), Developer (Ilham Fazril, siswa magang PKL Dayasos 2026).`,
  updatedAt: '2026-09-07T00:00:00Z',
};

// Master Pre-seeded Knowledge Items for 10 Pillars, Services, Security, and SOP
export const MASTER_AI_KNOWLEDGE_BASE: AIKnowledgeDoc[] = [
  {
    id: 'identitas_developer_pembuat',
    topic: 'developer_pembuat',
    title: 'Pengembang & Pembuat Website (Developer PSKS Jabar)',
    category: 'identitas',
    keywords: [
      'developer', 'pembuat website', 'pembuat web', 'siapa developer', 'siapa pembuat',
      'siapa pembuat website', 'siapa pembuat web', 'siapa yang buat', 'siapa yang bikin',
      'author website', 'pencipta website', 'arsitek sistem', 'ilham fazril', 'ilham',
      'fazril', 'siswa magang', 'pkl dinsos', 'dayasos', 'programmer', 'kreator website',
      'saha nu ngadamel', 'saha nu bikin', 'saha developerna', 'siapa developernya'
    ],
    summary: 'Informasi pengembang website PSKS Jabar: Ilham Fazril, siswa magang PKL Bidang Dayasos Dinas Sosial Jawa Barat tahun 2026.',
    content: `Website **PSKS JABAR** ini dibuat dan dikembangkan oleh **ILHAM FAZRIL**, siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat pada Bidang Dayasos (Pemberdayaan Sosial) tahun 2026.`,
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'identitas_resmi',
    topic: 'identitas_asisten',
    title: 'Identitas Resmi Asisten Virtual PSKS Jabar',
    category: 'identitas',
    keywords: [
      'kamu siapa', 'siapa kamu', 'identitas', 'siapa asisten', 'bot apa ini',
      'asisten resmi', 'saha anjeun', 'saha maneh', 'ai saha', 'tentang asisten'
    ],
    summary: 'Identitas kedinasan asisten virtual resmi di bawah naungan Dinas Sosial Provinsi Jawa Barat.',
    content: `Saya adalah **Asisten Virtual Resmi PSKS Jabar**, asisten digital resmi di bawah naungan **Dinas Sosial Provinsi Jawa Barat** yang bertugas memberikan informasi dan panduan seputar 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS), data sebaran sosial di 27 Kabupaten/Kota, serta layanan sosial di Jawa Barat.\n\nAplikasi **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat** ini dikembangkan dan dikelola secara resmi oleh **Dinas Sosial Provinsi Jawa Barat** sebagai platform digital terintegrasi satu data 10 pilar kesejahteraan sosial se-Jawa Barat.`,
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'keamanan_akses_admin',
    topic: 'proteksi_admin',
    title: 'Kebijakan Perlindungan Akses Akun Administratif & Rahasia Sistem',
    category: 'security',
    keywords: [
      'login admin', 'masuk admin', 'akun superadmin', 'minta password', 'bocorkan pin',
      'cara jadi admin', 'buka admin', 'token admin', 'kredensial admin', 'rahasia sistem',
      'password admin', 'kumaha login admin', 'cara login superadmin', 'hack admin'
    ],
    summary: 'Akses masuk akun administratif dilindungi ketat dan tertutup untuk aparatur kedinasan dengan SK resmi.',
    content: `Mohon maaf, akses administratif (seperti hak akses Admin Wilayah, Superadmin Provinsi, kredensial login, dan rahasia konfigurasi sistem internal) merupakan wewenang kedinasan tertutup yang dilindungi secara ketat demi keamanan, privasi data masyarakat, dan integritas tata kelola PSKS Jawa Barat.\n\nAsisten tidak dapat memberikan instruksi login administratif, kode sandi, maupun rahasia sistem internal kepada publik.\n\nApabila Anda merupakan aparatur kedinasan yang ditugaskan secara resmi atau memiliki keperluan administratif mendesak, silakan berkoordinasi langsung dengan pihak berwenang di Dinas Sosial Provinsi Jawa Barat atau Administrator Dinas Sosial Kabupaten/Kota setempat melalui kontak dan saluran resmi yang tersedia.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    actionTag: '[[action:tab:contact:Hubungi Dinas Sosial Jabar]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_tagana',
    topic: 'tagana',
    title: 'Taruna Siaga Bencana (TAGANA) Jawa Barat',
    category: 'pilar',
    keywords: [
      'tagana', 'taruna siaga bencana', 'kebencanaan', 'bencana alam', 'relawan bencana',
      'dapur umum', 'shelter pengungsian', 'tugas tagana', 'naon tagana', 'tugasna tagana',
      'tagna', 'taruna bencana'
    ],
    summary: 'Relawan sosial penanggulangan bencana alam berbasis masyarakat di bawah Bidang Linjamsos Dinsos Jabar.',
    content: `**Taruna Siaga Bencana (TAGANA)** adalah relawan sosial yang terlatih dan tersertifikasi secara khusus dalam penanggulangan bencana alam dan perlindungan sosial korban bencana, bernaung di bawah **Bidang Perlindungan dan Jaminan Sosial (Linjamsos) Dinas Sosial Provinsi Jawa Barat**.\n\n**Tugas Pokok & Tupoksi TAGANA**:\n1. **Pra-Bencana**: Mitigasi struktural, pemetaan rawan bencana, sosialisasi Kampung Siaga Bencana (KSB), dan Tagana Masuk Sekolah (TMS).\n2. **Tanggap Darurat**: Evakuasi korban, pendirian dan pengelolaan **Dapur Umum Lapangan (Dumlap)**, manajemen shelter penampungan pengungsian, serta Layanan Dukungan Psikososial (LDP).\n3. **Pasca-Bencana**: Distribusi logistik pemulihan dan pendampingan trauma healing korban bencana.\n\n**Persyaratan & Alur Pendaftaran TAGANA Jawa Barat**:\n- WNI usia 18–45 tahun, berdomisili di Jawa Barat.\n- Sehat jasmani dan rohani, berjiwa sukarela dan berdedikasi tinggi.\n- Mengikuti dan lulus Diklat Dasar (Diklatsar) TAGANA selama 3-5 hari.\n- Memperoleh SK Pengukuhan resmi dan Nomor Induk Anggota TAGANA (NIAT) dari Dinas Sosial Provinsi/Kabupaten/Kota.`,
    actionTag: '[[action:pillar:tagana:Detail Pilar TAGANA]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_peksos',
    topic: 'peksos',
    title: 'Pekerja Sosial Profesional (PKSP / PEKSOS)',
    category: 'pilar',
    keywords: [
      'peksos', 'pksp', 'pekerja sosial profesional', 'pekerja sosial', 'praktik peksos',
      'sipps', 'sertifikasi kompetensi peksos', 'uu 14 2019', 'sarjana kesos', 'tugas peksos'
    ],
    summary: 'Tenaga profesional lulusan pendidikan tinggi kesejahteraan sosial yang memiliki sertifikasi kompetensi dan lisensi praktik SIPPS.',
    content: `**Pekerja Sosial Profesional (PKSP / PEKSOS)** adalah seseorang yang memiliki pengetahuan, keterampilan, dan nilai praktik pekerjaan sosial serta telah mendapatkan sertifikat kompetensi sesuai dengan amanat **Undang-Undang Republik Indonesia Nomor 14 Tahun 2019 tentang Pekerja Sosial**.\n\n**Tugas & Peran Utama PEKSOS**:\n- Asesmen mendalam masalah sosial (individu, keluarga, kelompok, komunitas).\n- Pembuatan *case plan* intervensi klinis dan pendampingan advokasi hukum sosial.\n- Rehabilitasi sosial, reunifikasi keluarga, dan supervisi penanganan anak berhadapan dengan hukum (ABH).\n\n**Syarat Praktik Resmi**:\n- Lulusan D-IV/S1 Kesejahteraan Sosial/Pekerjaan Sosial.\n- Telah lulus Uji Kompetensi Nasional dan memiliki Sertifikat Kompetensi dari LSP Pekerja Sosial / Kemensos.\n- Memiliki Surat Izin Praktik Pekerja Sosial (SIPPS) resmi yang diterbitkan pemerintah daerah.`,
    actionTag: '[[action:pillar:peksos:Detail Pilar PEKSOS]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_psm',
    topic: 'psm',
    title: 'Pekerja Sosial Masyarakat (PSM) Jawa Barat',
    category: 'pilar',
    keywords: [
      'psm', 'pekerja sosial masyarakat', 'relawan desa', 'relawan kelurahan', 'tugas psm',
      'syarat psm', 'daftar psm', 'kumaha jadi psm', 'naon tugas psm'
    ],
    summary: 'Relawan sosial berbasis desa/kelurahan yang mengabdi sukarela mendampingi PPKS/PMKS.',
    content: `**Pekerja Sosial Masyarakat (PSM)** adalah warga masyarakat yang atas dasar rasa kesadaran dan tanggung jawab sosial berinisiatif mengabdi secara sukarela di bidang kesejahteraan sosial di tingkat desa/kelurahan, sesuai **Permensos No. 10 Tahun 2019**.\n\n**Tugas & Peran PSM**:\n- Menemukenali (*identifikasi dan pendataan*) Pemerlu Pelayanan Kesejahteraan Sosial (PPKS) di lingkungan RT/RW/Desa.\n- Menjadi jembatan penghubung masyarakat rentan dengan program bansos pemerintah (PKH, BPNT, KIS, PBI).\n- Memberikan bimbingan sosial awal dan rujukan ke SLRT/Dinas Sosial.\n\n**Syarat & Pendaftaran PSM**:\n- WNI usia minimal 18 tahun, berdomisili tetap di desa/kelurahan setempat.\n- Bersedia bekerja secara sukarela tanpa menuntut imbalan finansial tetap.\n- Mendapatkan rekomendasi dari Kepala Desa / Lurah.\n- Mengikuti Bimbingan Teknis (Bimtek) Dasar PSM yang diadakan Dinsos Kabupaten/Kota dan mendapatkan SK Pengukuhan.`,
    actionTag: '[[action:pillar:psm:Detail Pilar PSM]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_karangtaruna',
    topic: 'karangtaruna',
    title: 'Karang Taruna Jawa Barat',
    category: 'pilar',
    keywords: [
      'karang taruna', 'katar', 'pemuda desa', 'organisasi pemuda', 'tugas katar',
      'syarat masuk katar', 'daftar karang taruna', 'uep karang taruna', 'permensos 25 2019'
    ],
    summary: 'Organisasi kepemudaan resmi desa/kelurahan pembina generasi muda dan ekonomi produktif.',
    content: `**Karang Taruna** adalah organisasi kepemudaan sosial kemasyarakatan resmi di tingkat desa/kelurahan yang dibentuk berdasarkan **Permensos RI No. 25 Tahun 2019**.\n\n**Fungsi & Tupoksi Karang Taruna**:\n1. Mencegah kenakalan remaja, penyalahgunaan narkoba, dan degradasi moral pemuda.\n2. Mengembangkan Usaha Ekonomi Produktif (UEP) pemuda desa/kelurahan mandiri.\n3. Kepeloporan aksi sosial, tanggap bencana lokal, kerja bakti, dan festival keolahragaan/seni budaya desa.\n\n**Keanggotaan**:\n- Seluruh pemuda usia **13 sampai dengan 45 tahun** yang berdomisili di wilayah desa/kelurahan setempat secara otomatis merupakan anggota Karang Taruna (*stelsel pasif*).\n- Untuk menjadi pengurus aktif, dapat mendaftarkan diri pada Temu Karya Karang Taruna di tingkat RT/RW/Desa.`,
    actionTag: '[[action:pillar:karangtaruna:Detail Karang Taruna]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_tksk',
    topic: 'tksk',
    title: 'Tenaga Kesejahteraan Sosial Kecamatan (TKSK)',
    category: 'pilar',
    keywords: [
      'tksk', 'tenaga kesejahteraan sosial kecamatan', 'tugas tksk', 'kuota tksk',
      'verival dtks', 'koordinator bansos kecamatan', 'permensos 28 2018'
    ],
    summary: 'Tenaga fungsional sosial dengan kuota ketat 1 orang per kecamatan di 27 Kab/Kota Jawa Barat.',
    content: `**Tenaga Kesejahteraan Sosial Kecamatan (TKSK)** adalah seseorang yang diberi tugas, fungsi, dan kewenangan oleh Kementerian Sosial dan Dinas Sosial untuk membantu penyelenggaraan kesejahteraan sosial di tingkat kecamatan, diatur dalam **Permensos No. 28 Tahun 2018**.\n\n**Ciri Khusus & Kuota TKSK**:\n- **Satu Kecamatan Satu Personil**: Kuota TKSK bersifat mutlak yaitu hanya 1 orang per kecamatan (total 627 TKSK di seluruh 627 kecamatan se-Jawa Barat).\n- **Tugas Utama**: Mengkoordinasikan sinkronisasi Data Terpadu Kesejahteraan Sosial (DTKS), verifikasi kelayakan bantuan sosial, penanganan kasus kedaruratan sosial, serta koordinasi lintas pilar di kecamatan.\n- **Rekrutmen**: Hanya dibuka jika ada personil sebelumnya yang mengundurkan diri, mutasi, meninggal dunia, atau diberhentikan secara sah oleh SK Dinas Sosial/Kemensos.`,
    actionTag: '[[action:pillar:tksk:Detail Pilar TKSK]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_lks',
    topic: 'lks',
    title: 'Lembaga Kesejahteraan Sosial (LKS / Panti / Yayasan)',
    category: 'pilar',
    keywords: [
      'lks', 'lembaga kesejahteraan sosial', 'panti asuhan', 'panti jompo', 'yayasan sosial',
      'tanda daftar lks', 'akreditasi lks', 'tugas lks', 'permensos 184 2011'
    ],
    summary: 'Organisasi sosial atau perkumpulan berbadan hukum yang menyelenggarakan rehabilitasi dan pelayanan sosial bagi PPKS.',
    content: `**Lembaga Kesejahteraan Sosial (LKS)** adalah organisasi sosial atau perkumpulan sosial yang melaksanakan penyelenggaraan kesejahteraan sosial yang dibentuk oleh masyarakat, baik yang berbadan hukum maupun yang tidak berbadan hukum, sesuai **Permensos No. 184 Tahun 2011**.\n\n**Fokus Pelayanan LKS**:\n- Panti sosial anak yatim/piatu, lanjut usia (lansia terlantar), disabilitas, dan korban napza.\n- Rehabilitasi sosial, pemenuhan kebutuhan permakanan harian, dan pendidikan vokasi.\n\n**Syarat Pendaftaran & Legalitas Resmi di Dinsos Jabar**:\n1. Memiliki Akta Notaris dan SK Kemenkumham.\n2. Memiliki domisili sekretariat dan sarana panti yang layak.\n3. Mengajukan permohonan Tanda Daftar Lembaga (TDL) ke Dinas Sosial Kabupaten/Kota setempat.\n4. Terakreditasi oleh Badan Akreditasi Lembaga Kesejahteraan Sosial (BALKS).`,
    actionTag: '[[action:pillar:lks:Detail Pilar LKS]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_lk3',
    topic: 'lk3',
    title: 'Lembaga Konsultasi Kesejahteraan Keluarga (LK3)',
    category: 'pilar',
    keywords: [
      'lk3', 'lembaga konsultasi kesejahteraan keluarga', 'konseling keluarga', 'kdrt',
      'ketahanan keluarga', 'mediasi keluarga', 'tugas lk3'
    ],
    summary: 'Lembaga konseling psikososial keluarga untuk pencegahan perceraian, trauma KDRT, dan ketahanan keluarga.',
    content: `**Lembaga Konsultasi Kesejahteraan Keluarga (LK3)** adalah lembaga/wahana pelayanan sosial yang memberikan konsultasi, konseling, pendampingan, dan mediasi bagi keluarga yang mengalami masalah psikososial.\n\n**Layanan Utama LK3**:\n- Konseling krisis pernikahan dan mediasi konflik keluarga.\n- Pendampingan psikososial korban Kekerasan Dalam Rumah Tangga (KDRT).\n- Edukasi parenting, bimbingan pranikah, dan peningkatan ketahanan ekonomi keluarga.`,
    actionTag: '[[action:pillar:lk3:Detail Pilar LK3]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_pensos',
    topic: 'pensos',
    title: 'Penyuluh Sosial (PENSOS) Jawa Barat',
    category: 'pilar',
    keywords: [
      'pensos', 'penyuluh sosial', 'tugas pensos', 'penyuluhan sosial', 'komunikasi perubahan perilaku'
    ],
    summary: 'Fasilitator edukasi, sosialisasi kebijakan sosial, dan komunikasi perubahan perilaku masyarakat.',
    content: `**Penyuluh Sosial (PENSOS)** adalah seseorang yang mempunyai tugas melakukan penyuluhan di bidang pembangunan kesejahteraan sosial, diatur dalam **Permensos No. 10 Tahun 2014**.\n\n**Fungsi Utama**:\n- Sosialisasi program sosial pemerintah Provinsi Jawa Barat kepada masyarakat luas.\n- Melakukan edukasi pencegahan masalah sosial (pernikahan dini, stunting, perdagangan orang/TPPO).\n- Diseminasi informasi hak-hak kesejahteraan sosial bagi masyarakat rentan.`,
    actionTag: '[[action:pillar:pensos:Detail Pilar PENSOS]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_badanusaha',
    topic: 'badanusaha',
    title: 'KUBE & Badan Usaha Kesejahteraan Sosial',
    category: 'pilar',
    keywords: [
      'kube', 'kelompok usaha bersama', 'badan usaha sosial', 'csr sosial', 'stimulan modal',
      'ekonomi miskin', 'tugas kube'
    ],
    summary: 'Kelompok usaha gotong royong 5-10 KK miskin dan kemitraan badan usaha CSR untuk pengentasan kemiskinan.',
    content: `**KUBE (Kelompok Usaha Bersama)** adalah kelompok keluarga miskin yang dibentuk, tumbuh, dan berkembang atas dasar prakarsa mereka sendiri dalam rangka meningkatkan pendapatan dan kesejahteraan sosial keluarga.\n\n**Karakteristik KUBE & Badan Usaha Sosial**:\n- Terdiri dari 5–10 Kepala Keluarga (KK) yang terdaftar dalam DTKS.\n- Mendapatkan bantuan stimulan modal usaha produktif dari Dinas Sosial / Kemensos.\n- Bersinergi dengan program CSR (Corporate Social Responsibility) BUMN/BUMD/Swasta di Jawa Barat.`,
    actionTag: '[[action:pillar:badanusaha:Detail Pilar KUBE]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'pilar_slrt',
    topic: 'slrt_puskesos',
    title: 'SLRT / Puskesos (Sistem Layanan & Rujukan Terpadu)',
    category: 'pilar',
    keywords: [
      'slrt', 'puskesos', 'sistem layanan rujukan terpadu', 'layanan satu pintu', 'puskesos desa',
      'rujukan bansos', 'keluhan bansos', 'cek pkh'
    ],
    summary: 'Pusat layanan sosial terpadu satu pintu (*one-stop service*) di tingkat kabupaten/kota hingga desa/kelurahan.',
    content: `**SLRT (Sistem Layanan dan Rujukan Terpadu)** dan **Puskesos (Pusat Kesejahteraan Sosial)** adalah sistem layanan satu pintu (*one-stop social service*) yang mengidentifikasi keluhan warga miskin dan menghubungkannya dengan program perlindungan sosial di tingkat daerah maupun pusat.\n\n**Layanan Puskesos/SLRT**:\n- Layanan pendaftaran dan verifikasi DTKS/SIKS-NG.\n- Pengaduan bansos macet (PKH, BPNT, KIS PBI, PBI-JK).\n- Surat rekomendasi keringanan biaya rumah sakit bagi keluarga miskin (*SKTM*).`,
    actionTag: '[[action:pillar:slrt_puskesos:Detail SLRT/Puskesos]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'kontak_dinas_sosial',
    topic: 'kontak_layanan',
    title: 'Kontak Resmi & Kantor Dinas Sosial Provinsi Jawa Barat',
    category: 'layanan',
    keywords: [
      'kontak dinsos', 'alamat kantor dinsos', 'nomor telepon', 'whatsapp dinsos',
      'email dinsos', 'lokasi dinsos jabar', 'cimahi', 'kadinas', 'ibu noneng', 'hubungi dinsos'
    ],
    summary: 'Alamat kantor, hotline telepon, WhatsApp darurat, dan pimpinan Dinas Sosial Jawa Barat.',
    content: `**Kontak Resmi & Alamat Kantor Dinas Sosial Provinsi Jawa Barat**:\n\n- **Alamat Kantor Resmi**: Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522\n- **Hotline Telepon**: (022) 6641564\n- **Email Pelayanan**: dinsos@jabarprov.go.id\n- **Website Resmi**: dinsos.jabarprov.go.id\n- **Kepala Dinas Sosial Jawa Barat**: Ibu **Noneng Komara Nengsih, S.E., M.A.P.**\n- **Floating WhatsApp**: Gunakan tombol ikon WhatsApp melayang di pojok kanan bawah layar untuk pesan darurat kilat ke admin layanan.\n\n[[action:tab:contact:Buka Halaman Kontak Resmi]]`,
    actionTag: '[[action:tab:contact:Hubungi Dinas Sosial Jabar]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'bansos_dtks',
    topic: 'bansos',
    title: 'Informasi Bantuan Sosial (Bansos) & DTKS Jawa Barat',
    category: 'layanan',
    keywords: [
      'bansos', 'bantuan sosial', 'cara dapat bansos', 'daftar bansos', 'dtks', 'siks ng',
      'pkh', 'bpnt', 'cek bansos', 'bantuan tunai', 'sktm'
    ],
    summary: 'Panduan syarat dan alur pendaftaran Data Terpadu Kesejahteraan Sosial (DTKS) untuk menerima bantuan sosial.',
    content: `**Panduan Pendaftaran & Pengecekan Bantuan Sosial (Bansos & DTKS) di Jawa Barat**:\n\n1. **Prasyarat Utama (DTKS)**:\n   Seluruh bantuan sosial resmi dari Kemensos RI maupun Pemprov Jabar (seperti PKH, BPNT, dan KIS PBI) bersumber dari **Data Terpadu Kesejahteraan Sosial (DTKS)**.\n2. **Alur Pendaftaran Masuk DTKS**:\n   - Warga membawa KTP dan KK asli ke Kantor Desa/Kelurahan setempat.\n   - Melapor kepada petugas **Puskesos (Pusat Kesejahteraan Sosial)** atau **PSM (Pekerja Sosial Masyarakat)**.\n   - Dilakukan Musyawarah Kelurahan/Desa (Muskel/Musdes) untuk menetapkan kelayakan calon penerima.\n   - Data diteruskan melalui aplikasi **SIKS-NG** oleh operator ke Dinas Sosial Kabupaten/Kota untuk disahkan bupati/walikota ke Kementerian Sosial RI.\n3. **Cek Status Kepesertaan**:\n   Masyarakat dapat mengecek status bansos secara mandiri melalui website resmi Kemensos: \`cekbansos.kemensos.go.id\`.`,
    actionTag: '[[action:tab:contact:Konsultasi Bantuan Sosial]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'fewshot_sunda_dialog',
    topic: 'fewshot',
    title: 'Few-Shot Contoh: Percakapan Bahasa Sunda Santun & Campuran',
    category: 'panduan',
    keywords: [
      'contoh sunda', 'bade naros', 'kumaha carana', 'ngiringan', 'ngiluan', 'hoyong daptar',
      'punten', 'mangga', 'hatur nuhun', 'bahasa sunda', 'sunda jabar'
    ],
    summary: 'Contoh nyata percakapan dua arah menggunakan kosakata bahasa Sunda yang dijawab dengan bahasa Sunda lemes dan Indonesia yang santun.',
    content: `**Contoh Percakapan Nyata Bahasa Sunda (Few-Shot Pattern)**:

**User**: "Punten kang, abdi bade naros kumaha carana ngiringan Tagana di Sumedang?"
**AI**: "Sampurasun wargi Sumedang! Hatur nuhun parantos naroskeun. Kanggo ngiringan dados relawan TAGANA (Taruna Siaga Bencana) di wilayah Kabupaten Sumedang, ieu léngkah-léngkahna:
1. Wargi tiasa sumping langsung ka Kantor Dinas Sosial Kabupaten Sumedang (Bidang Linjamsos) atanapi ngahubungi Pengurus Satgas Tagana Sumedang.
2. Nyayogikeun berkas administrasi: KTP Sumedang (yuswa 18–45 taun), serat katerangan sehat, sareng kasadiaan ngabakti sosial.
3. Ngiringan Pendidikan sareng Pelatihan Dasar (Diklatsar) Kebencanaan.
Saparantos lulus diklat, wargi bakal kenging SK Pengukuhan resmi sareng KTA Digital QR Code. Aya anu tiasa dibantos deui?
[[action:pillar:tagana:Buka Modul Tagana]] [[action:tab:contact:Kontak Dinsos]]"`,
    actionTag: '[[action:pillar:tagana:Lihat Modul Tagana]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'fewshot_pelacak_topik',
    topic: 'fewshot',
    title: 'Few-Shot Contoh: Dynamic Topic Tracker & Resolusi Kata Ganti',
    category: 'panduan',
    keywords: [
      'pelacak topik', 'dynamic topic', 'syaratnya apa', 'berapa lama', 'lokasinya dimana',
      'kata ganti', 'resolusi konteks', 'sambungan pesan'
    ],
    summary: 'Contoh penalaran kontekstual saat pengguna bertanya singkat dengan kata ganti (misal: syaratnya apa?, berapa lama prosesnya?).',
    content: `**Contoh Percakapan Berantai dengan Dynamic Topic Tracking (Few-Shot Pattern)**:

Turn 1:
**User**: "Pekerja Sosial Profesional itu kerjanya apa min?"
**AI**: "Pekerja Sosial Profesional (PEKSOS) adalah tenaga ahli yang memiliki sertifikasi kompetensi dan izin praktik (SIPPS). Tugas utamanya menangani kasus perlindungan anak (ABH), rehabilitasi korban napza, mediasi disabilitas, dan advokasi sosial terpadu."

Turn 2 (Pertanyaan Elipsis / Tanpa menyebut nama pilar lagi):
**User**: "Syaratnya apa aja?"
**AI**: "(Melacak topik aktif: PEKSOS) Untuk menjadi Pekerja Sosial Profesional, persyaratannya adalah:
1. Lulusan perguruan tinggi Kesejahteraan Sosial / Pekerjaan Sosial (D-IV/S-1/S-2).
2. Lulus Sertifikasi Uji Kompetensi Nasional dari LSP Kemensos RI.
3. Mengurus Surat Izin Praktik Pekerja Sosial (SIPPS) dari pemerintah daerah."

Turn 3 (Pertanyaan Berantai Lanjutan):
**User**: "Berapa lama prosesnya?"
**AI**: "(Tetap mempertahankan topik PEKSOS) Proses verifikasi dan penerbitan izin SIPPS melalui DPMPTSP dan rekomendasi Dinsos biasanya memakan waktu sekitar 7–14 hari kerja setelah berkas uji kompetensi tervalidasi."`,
    actionTag: '[[action:pillar:peksos:Detail Peksos]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'fewshot_proactive_clarify',
    topic: 'fewshot',
    title: 'Few-Shot Contoh: Proactive Clarification (Tanya Balik Santun)',
    category: 'panduan',
    keywords: [
      'proactive clarification', 'tanya balik', 'mau daftar', 'bantuan', 'kartu',
      'pertanyaan ambigu', 'klarifikasi proaktif'
    ],
    summary: 'Contoh respons AI ketika menghadapi pertanyaan yang sangat ambigu atau terlalu singkat.',
    content: `**Contoh Proactive Clarification (Few-Shot Pattern)**:

**User**: "Mau daftar dong"
**AI**: "Sampurasun! Senang sekali Anda ingin mendaftar. Karena sistem PSKS Jawa Barat melayani beberapa jenis pendaftaran, mohon izin konfirmasi pendaftaran mana yang Anda maksud:

1. **Pendaftaran Akun Akses Sistem PSKS**: Bagi Anda yang sudah menjadi anggota atau pengurus pilar sosial untuk mengakses data KTA Digital dan verifikasi.
2. **Pendaftaran Menjadi Relawan Pilar Sosial**: Jika Anda warga yang baru ingin bergabung menjadi relawan sosial di Jawa Barat (Tagana, PSM, Karang Taruna, dll).

Silakan pilih opsi navigasi yang sesuai di bawah ini:
[[action:tab:user_reg_history:Daftar Akun Sistem]] [[action:pillar:tagana:Daftar Tagana]] [[action:pillar:psm:Daftar PSM]] [[action:pillar:karangtaruna:Daftar Karang Taruna]]"`,
    actionTag: '[[action:tab:user_reg_history:Formulir Pendaftaran]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
  {
    id: 'fewshot_penanganan_komplain',
    topic: 'fewshot',
    title: 'Few-Shot Contoh: Penanganan Komplain & Anti-Looping',
    category: 'panduan',
    keywords: [
      'anti-looping', 'lah kok', 'kok gitu', 'naha kitu', 'salah jawab', 'bukan itu maksudnya',
      'komplain pengguna', 'salah tanggap'
    ],
    summary: 'Contoh penanganan respons saat pengguna merasa jawaban AI tidak nyambung atau keliru.',
    content: `**Contoh Penanganan Respons Emosional & Komplain (Few-Shot Pattern)**:

**User**: "Lah kok malah jelasin Tagana, kan tadi nanya bansos!"
**AI**: "Aduh, punten pisan dan mohon maaf yang sebesar-besarnya atas kekeliruan jawaban saya sebelumnya. Terima kasih banyak sudah mengoreksi!

Mengenai **Bantuan Sosial (Bansos)** di Jawa Barat, seluruh bantuan bersumber dari **Data Terpadu Kesejahteraan Sosial (DTKS)**:
1. Pendaftaran bansos dilakukan melalui Kantor Kelurahan/Desa via petugas Puskesos atau PSM untuk dibawa ke Musyawarah Desa/Kelurahan (Musdes/Muskel).
2. Pengecekan status kepesertaan bansos aktif (PKH, BPNT, KIS PBI) dapat dilihat di situs resmi Kemensos: \`cekbansos.kemensos.go.id\`.
Apakah ada hal spesifik terkait usulan bansos yang ingin Anda tanyakan lebih lanjut?
[[action:tab:contact:Konsultasi Bantuan Sosial]]"`,
    actionTag: '[[action:tab:contact:Konsultasi Bantuan Sosial]]',
    updatedAt: '2026-09-07T00:00:00Z',
  },
];

// Master Dictionary of Non-baku, Sundanese, Slang, Abbreviations, and Common Typos (Kamus 4 Pilar Bahasa)
export const MASTER_AI_VOCABULARY: AIVocabularyDoc[] = [
  // ================= PILAR 1: DIALEK SUNDA (LOMA & LEMES) =================
  { id: 'v_kumaha', word: 'kumaha', canonical: 'bagaimana', category: 'sunda', intent: 'ask_how' },
  { id: 'v_kmha', word: 'kmha', canonical: 'bagaimana', category: 'sunda', intent: 'ask_how' },
  { id: 'v_naon', word: 'naon', canonical: 'apa', category: 'sunda', intent: 'ask_what' },
  { id: 'v_saha', word: 'saha', canonical: 'siapa', category: 'sunda', intent: 'ask_who' },
  { id: 'v_sabaraha', word: 'sabaraha', canonical: 'berapa', category: 'sunda', intent: 'ask_count' },
  { id: 'v_dimana', word: 'dimana', canonical: 'di mana', category: 'sunda', intent: 'ask_where' },
  { id: 'v_kamana', word: 'kamana', canonical: 'ke mana', category: 'sunda', intent: 'ask_direction' },
  { id: 'v_timana', word: 'timana', canonical: 'dari mana', category: 'sunda', intent: 'ask_origin' },
  { id: 'v_pikeun', word: 'pikeun', canonical: 'untuk', category: 'sunda' },
  { id: 'v_kanggo', word: 'kanggo', canonical: 'untuk', category: 'sunda' },
  { id: 'v_gawean', word: 'gawean', canonical: 'tugas dan pekerjaan', category: 'sunda', intent: 'ask_duties' },
  { id: 'v_tugasna', word: 'tugasna', canonical: 'tugasnya', category: 'sunda', intent: 'ask_duties' },
  { id: 'v_syaratna', word: 'syaratna', canonical: 'persyaratannya', category: 'sunda', intent: 'ask_requirements' },
  { id: 'v_anggotana', word: 'anggotana', canonical: 'anggotanya', category: 'sunda', intent: 'ask_count' },
  { id: 'v_ngiluan', word: 'ngiluan', canonical: 'bergabung mendaftar', category: 'sunda', intent: 'register_process' },
  { id: 'v_ngiring', word: 'ngiring', canonical: 'bergabung mendaftar', category: 'sunda', intent: 'register_process' },
  { id: 'v_ngiringan', word: 'ngiringan', canonical: 'bergabung mendaftar', category: 'sunda', intent: 'register_process' },
  { id: 'v_bade_naros', word: 'bade naros', canonical: 'mau bertanya', category: 'sunda', intent: 'ask_inquiry' },
  { id: 'v_naroskeun', word: 'naroskeun', canonical: 'menanyakan', category: 'sunda', intent: 'ask_inquiry' },
  { id: 'v_kumaha_carana', word: 'kumaha carana', canonical: 'bagaimana caranya', category: 'sunda', intent: 'ask_how' },
  { id: 'v_hoyong_daptar', word: 'hoyong daptar', canonical: 'ingin mendaftar', category: 'sunda', intent: 'register_process' },
  { id: 'v_hoyong_terang', word: 'hoyong terang', canonical: 'ingin tahu', category: 'sunda', intent: 'ask_inquiry' },
  { id: 'v_teu_acan', word: 'teu acan', canonical: 'belum', category: 'sunda' },
  { id: 'v_parantos', word: 'parantos', canonical: 'sudah', category: 'sunda' },
  { id: 'v_tos', word: 'tos', canonical: 'sudah', category: 'sunda' },
  { id: 'v_iraha', word: 'iraha', canonical: 'kapan', category: 'sunda', intent: 'ask_when' },
  { id: 'v_dimana_wae', word: 'dimana wae', canonical: 'di mana saja', category: 'sunda', intent: 'ask_where' },
  { id: 'v_naha', word: 'naha', canonical: 'kenapa', category: 'sunda', intent: 'ask_why' },
  { id: 'v_naha_bet', word: 'naha bet', canonical: 'kenapa malah', category: 'sunda', intent: 'ask_why' },
  { id: 'v_pisan', word: 'pisan', canonical: 'sangat sekali', category: 'sunda' },
  { id: 'v_ayeuna', word: 'ayeuna', canonical: 'sekarang', category: 'sunda' },
  { id: 'v_kamari', word: 'kamari', canonical: 'kemarin', category: 'sunda' },
  { id: 'v_enjing', word: 'enjing', canonical: 'besok', category: 'sunda' },
  { id: 'v_muhun', word: 'muhun', canonical: 'iya betul', category: 'sunda' },
  { id: 'v_mangga', word: 'mangga', canonical: 'silakan', category: 'sunda' },
  { id: 'v_punten', word: 'punten', canonical: 'permisi maaf', category: 'sunda' },
  { id: 'v_hatur_nuhun', word: 'hatur nuhun', canonical: 'terima kasih', category: 'sunda' },
  { id: 'v_teu_apal', word: 'teu apal', canonical: 'tidak tahu', category: 'sunda' },
  { id: 'v_teu_nyaho', word: 'teu nyaho', canonical: 'tidak tahu', category: 'sunda' },
  { id: 'v_teu_terang', word: 'teu terang', canonical: 'tidak tahu', category: 'sunda' },
  { id: 'v_kumaha_atuh', word: 'kumaha atuh', canonical: 'bagaimana solusinya', category: 'sunda', intent: 'ask_solution' },
  { id: 'v_sanes_kitu', word: 'sanes kitu', canonical: 'bukan begitu', category: 'sunda' },
  { id: 'v_tulungan', word: 'tulungan', canonical: 'tolong bantu', category: 'sunda', intent: 'ask_help' },
  { id: 'v_abdi', word: 'abdi', canonical: 'saya', category: 'sunda' },
  { id: 'v_kuring', word: 'kuring', canonical: 'saya', category: 'sunda' },
  { id: 'v_urang', word: 'urang', canonical: 'saya kita', category: 'sunda' },
  { id: 'v_anjeun', word: 'anjeun', canonical: 'kamu anda', category: 'sunda' },
  { id: 'v_maneh', word: 'maneh', canonical: 'kamu', category: 'sunda' },
  { id: 'v_enya', word: 'enya', canonical: 'iya', category: 'sunda' },
  { id: 'v_heunteu', word: 'heunteu', canonical: 'tidak', category: 'sunda' },
  { id: 'v_teu', word: 'teu', canonical: 'tidak', category: 'sunda' },
  { id: 'v_atuh', word: 'atuh', canonical: 'dong', category: 'sunda' },
  { id: 'v_euy', word: 'euy', canonical: 'kawan', category: 'sunda' },
  { id: 'v_seueur', word: 'seueur', canonical: 'banyak', category: 'sunda' },
  { id: 'v_sakedik', word: 'sakedik', canonical: 'sedikit', category: 'sunda' },
  { id: 'v_dilebet', word: 'dilebet', canonical: 'di dalam', category: 'sunda' },
  { id: 'v_sakieu', word: 'sakieu', canonical: 'sekian segini', category: 'sunda' },
  { id: 'v_panginten', word: 'panginten', canonical: 'sepertinya mungkin', category: 'sunda' },

  // ================= PILAR 2: SINGKATAN & AKRONIM BIROKRASI SOSIAL =================
  { id: 'v_dtks', word: 'dtks', canonical: 'data terpadu kesejahteraan sosial', category: 'singkatan', intent: 'bansos_data' },
  { id: 'v_siks_ng', word: 'siks ng', canonical: 'sistem informasi kesejahteraan sosial next generation', category: 'singkatan', intent: 'siks_system' },
  { id: 'v_siks_dash', word: 'siks-ng', canonical: 'sistem informasi kesejahteraan sosial next generation', category: 'singkatan', intent: 'siks_system' },
  { id: 'v_pbi', word: 'pbi', canonical: 'penerima bantuan iuran jaminan kesehatan', category: 'singkatan', intent: 'health_aid' },
  { id: 'v_pbi_jk', word: 'pbi jk', canonical: 'penerima bantuan iuran jaminan kesehatan', category: 'singkatan', intent: 'health_aid' },
  { id: 'v_pbi_dash', word: 'pbi-jk', canonical: 'penerima bantuan iuran jaminan kesehatan', category: 'singkatan', intent: 'health_aid' },
  { id: 'v_puskesos', word: 'puskesos', canonical: 'pusat kesejahteraan sosial desa kelurahan', category: 'singkatan', intent: 'puskesos_service' },
  { id: 'v_slrt', word: 'slrt', canonical: 'sistem layanan dan rujukan terpadu', category: 'singkatan', intent: 'slrt_service' },
  { id: 'v_kube', word: 'kube', canonical: 'kelompok usaha bersama', category: 'singkatan', intent: 'kube_aid' },
  { id: 'v_kta_digital', word: 'kta digital', canonical: 'kartu tanda anggota digital qr code', category: 'singkatan', intent: 'kta_card' },
  { id: 'v_kta', word: 'kta', canonical: 'kartu tanda anggota digital', category: 'singkatan', intent: 'kta_card' },
  { id: 'v_diklatsar', word: 'diklatsar', canonical: 'pendidikan dan pelatihan dasar relawan', category: 'singkatan', intent: 'training_diklat' },
  { id: 'v_pmks', word: 'pmks', canonical: 'pemerlu pelayanan kesejahteraan sosial', category: 'singkatan', intent: 'ppks_beneficiary' },
  { id: 'v_ppks', word: 'ppks', canonical: 'pemerlu pelayanan kesejahteraan sosial', category: 'singkatan', intent: 'ppks_beneficiary' },
  { id: 'v_abh', word: 'abh', canonical: 'anak berhadapan dengan hukum', category: 'singkatan', intent: 'abh_protection' },
  { id: 'v_tppo', word: 'tppo', canonical: 'tindak pidana perdagangan orang', category: 'singkatan', intent: 'tppo_advocacy' },
  { id: 'v_dumlap', word: 'dumlap', canonical: 'dapur umum lapangan tagana', category: 'singkatan', intent: 'tagana_dumlap' },
  { id: 'v_ldp', word: 'ldp', canonical: 'layanan dukungan psikososial', category: 'singkatan', intent: 'psychosocial_support' },
  { id: 'v_trc', word: 'trc', canonical: 'tim reaksi cepat dinsos', category: 'singkatan', intent: 'quick_response' },
  { id: 'v_ksb', word: 'ksb', canonical: 'kampung siaga bencana', category: 'singkatan', intent: 'disaster_village' },
  { id: 'v_uep', word: 'uep', canonical: 'usaha ekonomi produktif', category: 'singkatan', intent: 'economic_aid' },
  { id: 'v_sipps', word: 'sipps', canonical: 'surat izin praktik pekerja sosial', category: 'singkatan', intent: 'peksos_license' },
  { id: 'v_linjamsos', word: 'linjamsos', canonical: 'bidang perlindungan dan jaminan sosial', category: 'singkatan', intent: 'dinsos_division' },
  { id: 'v_dayasos', word: 'dayasos', canonical: 'bidang pemberdayaan sosial', category: 'singkatan', intent: 'dinsos_division' },
  { id: 'v_rehsos', word: 'rehsos', canonical: 'bidang rehabilitasi sosial', category: 'singkatan', intent: 'dinsos_division' },
  { id: 'v_balks', word: 'balks', canonical: 'badan akreditasi lembaga kesejahteraan sosial', category: 'singkatan', intent: 'lks_accreditation' },
  { id: 'v_p2k2', word: 'p2k2', canonical: 'pertemuan peningkatan kemampuan keluarga', category: 'singkatan', intent: 'pkh_session' },
  { id: 'v_fds', word: 'fds', canonical: 'family development session pkh', category: 'singkatan', intent: 'pkh_session' },
  { id: 'v_kpm', word: 'kpm', canonical: 'keluarga penerima manfaat', category: 'singkatan', intent: 'aid_recipient' },
  { id: 'v_bpnt', word: 'bpnt', canonical: 'bantuan pangan non tunai sembako', category: 'singkatan', intent: 'bpnt_aid' },
  { id: 'v_pkh', word: 'pkh', canonical: 'program keluarga harapan', category: 'singkatan', intent: 'pkh_aid' },
  { id: 'v_rutilahu', word: 'rutilahu', canonical: 'rumah tidak layak huni', category: 'singkatan', intent: 'housing_aid' },
  { id: 'v_tksk', word: 'tksk', canonical: 'tenaga kesejahteraan sosial kecamatan', category: 'singkatan', intent: 'pillar_tksk' },
  { id: 'v_psm', word: 'psm', canonical: 'pekerja sosial masyarakat', category: 'singkatan', intent: 'pillar_psm' },
  { id: 'v_pksp', word: 'pksp', canonical: 'pekerja sosial profesional', category: 'singkatan', intent: 'pillar_peksos' },
  { id: 'v_peksos', word: 'peksos', canonical: 'pekerja sosial profesional', category: 'singkatan', intent: 'pillar_peksos' },
  { id: 'v_lks', word: 'lks', canonical: 'lembaga kesejahteraan sosial panti', category: 'singkatan', intent: 'pillar_lks' },
  { id: 'v_lk3', word: 'lk3', canonical: 'lembaga konsultasi kesejahteraan keluarga', category: 'singkatan', intent: 'pillar_lk3' },
  { id: 'v_pensos', word: 'pensos', canonical: 'penyuluh sosial masyarakat', category: 'singkatan', intent: 'pillar_pensos' },
  { id: 'v_katar', word: 'katar', canonical: 'karang taruna', category: 'singkatan', intent: 'pillar_karangtaruna' },
  { id: 'v_dinsos', word: 'dinsos', canonical: 'dinas sosial provinsi jawa barat', category: 'singkatan', intent: 'dinsos_org' },
  { id: 'v_kadinas', word: 'kadinas', canonical: 'kepala dinas sosial noneng komara nengsih', category: 'singkatan', intent: 'kadinas_profile' },

  // ================= PILAR 3: BAHASA GAUL CHATTING & TYPO-TOLERANT =================
  { id: 'v_dftr_dmn', word: 'dftr dmn', canonical: 'daftar di mana', category: 'slang', intent: 'register_location' },
  { id: 'v_gmn_crny', word: 'gmn crny', canonical: 'bagaimana caranya', category: 'slang', intent: 'ask_how' },
  { id: 'v_sy_mw_tny', word: 'sy mw tny', canonical: 'saya mau tanya', category: 'slang', intent: 'ask_inquiry' },
  { id: 'v_bs_tlg_bantu', word: 'bs tlg bantu', canonical: 'bisa tolong bantu', category: 'slang', intent: 'ask_help' },
  { id: 'v_bkn_gt_mksdny', word: 'bkn gt mksdny', canonical: 'bukan begitu maksudnya', category: 'slang', intent: 'clarify_correction' },
  { id: 'v_krjanya', word: 'krjanya', canonical: 'tugas pekerjaannya', category: 'slang', intent: 'ask_duties' },
  { id: 'v_syrt', word: 'syrt', canonical: 'syarat', category: 'slang', intent: 'admin_criteria' },
  { id: 'v_brapa', word: 'brapa', canonical: 'berapa', category: 'slang', intent: 'ask_count' },
  { id: 'v_dmna', word: 'dmna', canonical: 'di mana', category: 'slang', intent: 'ask_where' },
  { id: 'v_dmana', word: 'dmana', canonical: 'di mana', category: 'slang', intent: 'ask_where' },
  { id: 'v_ktnya', word: 'ktnya', canonical: 'katanya', category: 'slang' },
  { id: 'v_pdhl', word: 'pdhl', canonical: 'padahal', category: 'slang' },
  { id: 'v_bgmn', word: 'bgmn', canonical: 'bagaimana', category: 'slang', intent: 'ask_how' },
  { id: 'v_mnta_tlg', word: 'mnta tlg', canonical: 'minta tolong', category: 'slang', intent: 'ask_help' },
  { id: 'v_kpd', word: 'kpd', canonical: 'kepada', category: 'slang' },
  { id: 'v_org', word: 'org', canonical: 'orang', category: 'slang' },
  { id: 'v_bgtu', word: 'bgtu', canonical: 'begitu', category: 'slang' },
  { id: 'v_jg', word: 'jg', canonical: 'juga', category: 'slang' },
  { id: 'v_trs', word: 'trs', canonical: 'terus', category: 'slang' },
  { id: 'v_klo', word: 'klo', canonical: 'kalau', category: 'slang' },
  { id: 'v_adlh', word: 'adlh', canonical: 'adalah', category: 'slang' },
  { id: 'v_blm', word: 'blm', canonical: 'belum', category: 'slang' },
  { id: 'v_sdh', word: 'sdh', canonical: 'sudah', category: 'slang' },
  { id: 'v_udh', word: 'udh', canonical: 'sudah', category: 'slang' },
  { id: 'v_skrg', word: 'skrg', canonical: 'sekarang', category: 'slang' },
  { id: 'v_bgt', word: 'bgt', canonical: 'banget', category: 'slang' },
  { id: 'v_gimana', word: 'gimana', canonical: 'bagaimana', category: 'slang', intent: 'ask_how' },
  { id: 'v_gmn', word: 'gmn', canonical: 'bagaimana', category: 'slang', intent: 'ask_how' },
  { id: 'v_brp', word: 'brp', canonical: 'berapa', category: 'slang', intent: 'ask_count' },
  { id: 'v_daptar', word: 'daptar', canonical: 'daftar', category: 'typo', intent: 'register_process' },
  { id: 'v_daftr', word: 'daftr', canonical: 'daftar', category: 'typo', intent: 'register_process' },
  { id: 'v_regis', word: 'regis', canonical: 'registrasi pendaftaran', category: 'slang', intent: 'register_process' },
  { id: 'v_saratt', word: 'saratt', canonical: 'syarat', category: 'typo', intent: 'admin_criteria' },
  { id: 'v_ngapain', word: 'ngapain', canonical: 'apa tugasnya', category: 'slang', intent: 'ask_duties' },
  { id: 'v_tupoksi', word: 'tupoksi', canonical: 'tugas pokok dan fungsi', category: 'slang', intent: 'ask_duties' },
  { id: 'v_tagna', word: 'tagna', canonical: 'tagana', category: 'typo', intent: 'pillar_tagana' },
  { id: 'v_bwt', word: 'bwt', canonical: 'buat untuk', category: 'slang' },
  { id: 'v_angota', word: 'angota', canonical: 'anggota personil', category: 'typo', intent: 'ask_count' },
  { id: 'v_beneran', word: 'beneran', canonical: 'sungguhan', category: 'slang' },
  { id: 'v_caranya', word: 'caranya', canonical: 'bagaimana caranya', category: 'slang', intent: 'ask_how' },
  { id: 'v_daftarin', word: 'daftarin', canonical: 'daftarkan', category: 'slang', intent: 'register_process' },
  { id: 'v_gabungin', word: 'gabungin', canonical: 'gabungkan', category: 'slang' },
  { id: 'v_knp', word: 'knp', canonical: 'kenapa', category: 'slang', intent: 'ask_why' },
  { id: 'v_apkh', word: 'apkh', canonical: 'apakah', category: 'slang' },

  // ================= PILAR 4: KOSAKATA EMOSIONAL & KOMPLAIN (ANTI-LOOPING) =================
  { id: 'v_lah_kok', word: 'lah kok', canonical: 'heran komplain kebingungan', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_kok_gitu', word: 'kok gitu', canonical: 'heran tanggapan keliru', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_naha_kitu', word: 'naha kitu', canonical: 'heran sunda keliru', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_kok_ga_nyambung', word: 'kok ga nyambung', canonical: 'komplain jawaban tidak sesuai', category: 'emosi_komplain', intent: 'user_protest' },
  { id: 'v_gak_nyambung', word: 'gak nyambung', canonical: 'komplain jawaban tidak sesuai', category: 'emosi_komplain', intent: 'user_protest' },
  { id: 'v_ga_nyambung', word: 'ga nyambung', canonical: 'komplain jawaban tidak sesuai', category: 'emosi_komplain', intent: 'user_protest' },
  { id: 'v_salah_jawab', word: 'salah jawab', canonical: 'koreksi atas jawaban sistem', category: 'emosi_komplain', intent: 'user_correction' },
  { id: 'v_bingung_euy', word: 'bingung euy', canonical: 'kebingungan pengguna sunda', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_bingung', word: 'bingung', canonical: 'kebingungan butuh kejelasan', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_ga_ngerti', word: 'ga ngerti', canonical: 'minta penjelasan lebih sederhana', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_gak_paham', word: 'gak paham', canonical: 'minta penjelasan lebih sederhana', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_ngaco', word: 'ngaco', canonical: 'komplain kekeliruan sistem', category: 'emosi_komplain', intent: 'user_protest' },
  { id: 'v_bukan_itu_maksud', word: 'bukan itu maksud saya', canonical: 'klarifikasi penolakan topik', category: 'emosi_komplain', intent: 'user_correction' },
  { id: 'v_bukan_itu_maksudnya', word: 'bukan itu maksudnya', canonical: 'klarifikasi penolakan topik', category: 'emosi_komplain', intent: 'user_correction' },
  { id: 'v_maksudnya_apa_sih', word: 'maksudnya apa sih', canonical: 'meminta kejelasan detail', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_aneh_banget', word: 'aneh banget', canonical: 'komplain respons ganjil', category: 'emosi_komplain', intent: 'user_protest' },
  { id: 'v_lah_kenapa', word: 'lah kenapa', canonical: 'heran terhadap jawaban', category: 'emosi_komplain', intent: 'user_confused' },
  { id: 'v_salah_paham', word: 'salah paham', canonical: 'terjadi kesalahpahaman maksud', category: 'emosi_komplain', intent: 'user_correction' },
  { id: 'v_kok_malah', word: 'kok malah', canonical: 'protes pengalihan topik', category: 'emosi_komplain', intent: 'user_protest' },
  { id: 'v_salah_tanggap', word: 'salah tanggap', canonical: 'koreksi atas salah pengertian', category: 'emosi_komplain', intent: 'user_correction' },
  { id: 'v_bukan_itu', word: 'bukan itu', canonical: 'penolakan jawaban sistem', category: 'emosi_komplain', intent: 'user_correction' },
  { id: 'v_maksud_aku', word: 'maksud aku', canonical: 'klarifikasi maksud sebenarnya', category: 'emosi_komplain', intent: 'user_correction' },

  // ================= KONTEKS UTAMA & RESMI PSKS JABAR =================
  { id: 'v_daftar_utama', word: 'daftar', canonical: 'proses pendaftaran psks', category: 'konteks_utama', intent: 'register_process' },
  { id: 'v_registrasi_utama', word: 'registrasi', canonical: 'proses pendaftaran psks', category: 'konteks_utama', intent: 'register_process' },
  { id: 'v_gabung_utama', word: 'gabung', canonical: 'proses pendaftaran psks', category: 'konteks_utama', intent: 'register_process' },
  { id: 'v_cara_ikutan', word: 'cara ikutan', canonical: 'proses pendaftaran psks', category: 'konteks_utama', intent: 'register_process' },
  { id: 'v_syarat_utama', word: 'syarat', canonical: 'kriteria administrasi', category: 'konteks_utama', intent: 'admin_criteria' },
  { id: 'v_persyaratan_utama', word: 'persyaratan', canonical: 'kriteria administrasi', category: 'konteks_utama', intent: 'admin_criteria' },
  { id: 'v_dokumen_utama', word: 'dokumen', canonical: 'kriteria administrasi', category: 'konteks_utama', intent: 'admin_criteria' },
  { id: 'v_bawa_apa_aja', word: 'bawa apa aja', canonical: 'kriteria administrasi', category: 'konteks_utama', intent: 'admin_criteria' },
  { id: 'v_pilar_utama', word: 'pilar', canonical: 'tksk, psm, karang taruna, atau tagana', category: 'konteks_utama', intent: 'social_pillars' },
  { id: 'v_relawan_utama', word: 'relawan', canonical: 'tksk, psm, karang taruna, atau tagana', category: 'konteks_utama', intent: 'social_pillars' },
  { id: 'v_petugas_lapangan', word: 'petugas lapangan', canonical: 'tksk, psm, karang taruna, atau tagana', category: 'konteks_utama', intent: 'social_pillars' },
  { id: 'v_dinsos_utama', word: 'dinsos', canonical: 'dinas sosial provinsi jawa barat', category: 'konteks_utama', intent: 'dinsos_org' },
  { id: 'v_dinas_utama', word: 'dinas', canonical: 'dinas sosial provinsi jawa barat', category: 'konteks_utama', intent: 'dinsos_org' },
  { id: 'v_orang_provinsi', word: 'orang provinsi', canonical: 'dinas sosial provinsi jawa barat', category: 'konteks_utama', intent: 'dinsos_org' },

  // ================= PENGEMBANG & PEMBUAT SISTEM (DEVELOPER ILHAM FAZRIL) =================
  { id: 'v_developer', word: 'developer', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_dev', word: 'dev', canonical: 'pengembang pembuat website ilham fazril', category: 'slang', intent: 'ask_developer' },
  { id: 'v_pembuat_web', word: 'pembuat web', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_pembuat_website', word: 'pembuat website', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_pembuat', word: 'pembuat', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_yang_bikin', word: 'yang bikin', canonical: 'pengembang pembuat website ilham fazril', category: 'slang', intent: 'ask_developer' },
  { id: 'v_yang_buat', word: 'yang buat', canonical: 'pengembang pembuat website ilham fazril', category: 'slang', intent: 'ask_developer' },
  { id: 'v_siapa_pembuat', word: 'siapa pembuat', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_siapa_developer', word: 'siapa developer', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_siapa_pembuat_web', word: 'siapa pembuat web', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_siapa_pembuat_website', word: 'siapa pembuat website', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_saha_nu_ngadamel', word: 'saha nu ngadamel', canonical: 'pengembang pembuat website ilham fazril', category: 'sunda', intent: 'ask_developer' },
  { id: 'v_saha_nu_bikin', word: 'saha nu bikin', canonical: 'pengembang pembuat website ilham fazril', category: 'sunda', intent: 'ask_developer' },
  { id: 'v_saha_developerna', word: 'saha developerna', canonical: 'pengembang pembuat website ilham fazril', category: 'sunda', intent: 'ask_developer' },
  { id: 'v_ilham_fazril', word: 'ilham fazril', canonical: 'ilham fazril pengembang siswa magang pkl dayasos dinsos jabar 2026', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_ilham', word: 'ilham', canonical: 'ilham fazril pengembang siswa magang pkl dayasos dinsos jabar 2026', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_fazril', word: 'fazril', canonical: 'ilham fazril pengembang siswa magang pkl dayasos dinsos jabar 2026', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_dayasos', word: 'dayasos', canonical: 'bidang pemberdayaan sosial dinas sosial provinsi jawa barat', category: 'singkatan', intent: 'ask_developer' },
  { id: 'v_pemberdayaan_sosial', word: 'pemberdayaan sosial', canonical: 'bidang pemberdayaan sosial dinas sosial provinsi jawa barat', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_siswa_magang', word: 'siswa magang', canonical: 'siswa magang pkl ilham fazril pengembang', category: 'konteks_utama', intent: 'ask_developer' },
  { id: 'v_pkl_dinsos', word: 'pkl dinsos', canonical: 'siswa magang pkl dinsos dayasos ilham fazril', category: 'singkatan', intent: 'ask_developer' },
  { id: 'v_kreator', word: 'kreator', canonical: 'pengembang pembuat website ilham fazril', category: 'slang', intent: 'ask_developer' },
  { id: 'v_programmer', word: 'programmer', canonical: 'pengembang pembuat website ilham fazril', category: 'slang', intent: 'ask_developer' },
  { id: 'v_arsitek_sistem', word: 'arsitek sistem', canonical: 'pengembang pembuat website ilham fazril', category: 'konteks_utama', intent: 'ask_developer' },
];

// In-Memory Dynamic Cache with TTL to protect Firestore read quotas
let cachedBrainConfig: AIBrainConfig = { ...MASTER_AI_BRAIN_CONFIG };
let cachedKnowledgeBase: AIKnowledgeDoc[] = [...MASTER_AI_KNOWLEDGE_BASE];
let cachedVocabulary: AIVocabularyDoc[] = [...MASTER_AI_VOCABULARY];
let lastCacheSyncTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the AI Brain / System Instruction from Firestore collection `ai_config` doc `system_brain`.
 */
export async function getAIBrainConfig(forceSync = false): Promise<AIBrainConfig> {
  const now = Date.now();
  if (!forceSync && cachedBrainConfig && (now - lastCacheSyncTime < CACHE_TTL_MS)) {
    return cachedBrainConfig;
  }

  try {
    const brainDocRef = doc(db, 'ai_config', 'system_brain');
    const snap = await getDoc(brainDocRef);
    if (snap.exists()) {
      cachedBrainConfig = snap.data() as AIBrainConfig;
    } else {
      console.log('[Firestore AI Brain] Initializing ai_config/system_brain in Firestore...');
      await setDoc(brainDocRef, MASTER_AI_BRAIN_CONFIG);
      cachedBrainConfig = { ...MASTER_AI_BRAIN_CONFIG };
    }
    return cachedBrainConfig;
  } catch (err) {
    console.warn('[Firestore AI Brain] Error fetching brain config, using in-memory cache:', err);
    return cachedBrainConfig;
  }
}

/**
 * Saves or updates the AI Brain in Firestore.
 */
export async function saveAIBrainConfig(updates: Partial<AIBrainConfig>): Promise<AIBrainConfig> {
  try {
    const brainDocRef = doc(db, 'ai_config', 'system_brain');
    const updated: AIBrainConfig = {
      ...cachedBrainConfig,
      ...updates,
      id: 'system_brain',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(brainDocRef, updated, { merge: true });
    cachedBrainConfig = updated;
    console.log('[Firestore AI Brain] Updated system_brain in Firestore.');
    return updated;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'ai_config');
    throw err;
  }
}

/**
 * Fetches the entire AI Vocabulary from Firestore collection `ai_vocabulary`.
 */
export async function getAIVocabulary(forceSync = false): Promise<AIVocabularyDoc[]> {
  const now = Date.now();
  if (!forceSync && cachedVocabulary.length > 0 && (now - lastCacheSyncTime < CACHE_TTL_MS)) {
    return cachedVocabulary;
  }

  try {
    const vocabSnap = await getDocs(collection(db, 'ai_vocabulary'));
    if (!vocabSnap.empty) {
      const list: AIVocabularyDoc[] = [];
      vocabSnap.forEach((s) => list.push(s.data() as AIVocabularyDoc));
      cachedVocabulary = list;
    } else {
      console.log('[Firestore AI Vocab] Seeding ai_vocabulary in Firestore...');
      for (const v of MASTER_AI_VOCABULARY) {
        await setDoc(doc(db, 'ai_vocabulary', v.id), v);
      }
      cachedVocabulary = [...MASTER_AI_VOCABULARY];
    }
    return cachedVocabulary;
  } catch (err) {
    console.warn('[Firestore AI Vocab] Error loading vocabulary from Firestore:', err);
    return cachedVocabulary;
  }
}

/**
 * Saves or adds a single Vocabulary word to Firestore.
 */
export async function saveAIVocabularyItem(item: AIVocabularyDoc): Promise<void> {
  try {
    const id = item.id || `v_${item.word.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const cleanItem: AIVocabularyDoc = { ...item, id };
    await setDoc(doc(db, 'ai_vocabulary', id), cleanItem);

    // Update in-memory cache
    const idx = cachedVocabulary.findIndex((v) => v.id === id);
    if (idx >= 0) {
      cachedVocabulary[idx] = cleanItem;
    } else {
      cachedVocabulary.push(cleanItem);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'ai_vocabulary');
    throw err;
  }
}

/**
 * Deletes a single Vocabulary word from Firestore.
 */
export async function deleteAIVocabularyItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'ai_vocabulary', id));
    cachedVocabulary = cachedVocabulary.filter((v) => v.id !== id);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'ai_vocabulary');
    throw err;
  }
}

/**
 * Realtime listener for the AI Brain configuration in Firestore.
 */
export function subscribeToAIBrain(callback: (brain: AIBrainConfig) => void): () => void {
  try {
    const unsub = onSnapshot(
      doc(db, 'ai_config', 'system_brain'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AIBrainConfig;
          cachedBrainConfig = data;
          callback(data);
        } else {
          callback(MASTER_AI_BRAIN_CONFIG);
        }
      },
      (err) => {
        console.warn('[Firestore AI Brain] Listener warning:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.warn('[Firestore AI Brain] Subscribe failed:', e);
    return () => {};
  }
}

/**
 * Realtime listener for the AI Vocabulary collection in Firestore.
 */
export function subscribeToAIVocabulary(callback: (vocabs: AIVocabularyDoc[]) => void): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, 'ai_vocabulary'),
      (snap) => {
        const list: AIVocabularyDoc[] = [];
        snap.forEach((d) => list.push(d.data() as AIVocabularyDoc));
        if (list.length > 0) {
          cachedVocabulary = list;
          callback(list);
        }
      },
      (err) => {
        console.warn('[Firestore AI Vocab] Listener warning:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.warn('[Firestore AI Vocab] Subscribe failed:', e);
    return () => {};
  }
}

/**
 * Context Resolver: Analyzes the current user query along with up to 2 previous messages
 * to seamlessly link pronouns ("Itu maksudnya apa?", "Di mana lokasinya?", "Berapa lama prosesnya?", "Kalau TKSK sama juga gak?")
 * to the discussed objects (e.g. PSM, TKSK, Pendaftaran, KTA, Bansos).
 */
/**
 * Context Resolver & Dynamic Topic Tracker: Analyzes the current user query along with up to 6 previous messages
 * to seamlessly link pronouns ("Itu maksudnya apa?", "Di mana lokasinya?", "Berapa lama prosesnya?", "Kalau TKSK sama juga gak?", "Syaratna naon?")
 * and handle emotional corrections ("Lah kok", "Naha kitu", "Kok ga nyambung") without repeating errors.
 */
export interface ContextResolutionResult {
  detectedContext: boolean;
  detectedObject: string | null;
  detectedTopic: string | null;
  instruction: string;
  isComplaintOrCorrection?: boolean;
  isAmbiguous?: boolean;
  clarificationPrompt?: string;
  suggestedActionTags?: string[];
}

/**
 * Checks whether an inquiry is overly broad or ambiguous, requiring proactive polite clarification.
 */
export function detectAmbiguousInquiry(
  query: string,
  activeObject: string | null = null
): { isAmbiguous: boolean; clarificationPrompt: string; actionTags: string[] } {
  const q = query.toLowerCase().trim();

  // If user already specified an object in a longer sentence, it's not ambiguous
  if (q.length > 35 || activeObject) {
    return { isAmbiguous: false, clarificationPrompt: '', actionTags: [] };
  }

  // Pure single-topic short ambiguous queries
  const isJustDaftar = /^(mau\s+)?(daftar|daptar|daftr|registrasi|regis|gabung|ikutan)(\s+dong|\s+min|\s+gan)?$/i.test(q);
  const isJustBansos = /^(mau\s+)?(bansos|bantuan|bantuan sosial|dtks)(\s+dong|\s+min)?$/i.test(q);
  const isJustKTA = /^(mau\s+)?(kta|kartu|cetak kta|kartu anggota)(\s+dong|\s+min)?$/i.test(q);
  const isJustSyarat = /^(apa\s+)?(syarat|syrt|persyaratan|syaratna)(\s+aja|\s+naon|\s+min)?$/i.test(q);

  if (isJustDaftar) {
    return {
      isAmbiguous: true,
      clarificationPrompt: `PERTANYAAN AMBIGU TERDETEKSI ("${query}"). Terapkan Proactive Clarification: Tanyakan secara santun apakah pengguna ingin mendaftar Akun Akses Sistem PSKS (bagi personil resmi/pengajuan KTA) atau ingin mendaftar menjadi Relawan Pilar Sosial (Tagana, PSM, Karang Taruna, dll).`,
      actionTags: [
        '[[action:tab:user_reg_history:Daftar Akun Sistem]]',
        '[[action:pillar:tagana:Daftar Tagana]]',
        '[[action:pillar:psm:Daftar PSM]]',
        '[[action:pillar:karangtaruna:Daftar Karang Taruna]]'
      ],
    };
  }

  if (isJustBansos) {
    return {
      isAmbiguous: true,
      clarificationPrompt: `PERTANYAAN BANSOS AMBIGU TERDETEKSI ("${query}"). Terapkan Proactive Clarification: Tanyakan apakah pengguna ingin mengecek status bansos DTKS yang sudah berjalan, atau ingin mendaftar baru sebagai penerima bantuan melalui Musdes/Muskel.`,
      actionTags: [
        '[[action:tab:contact:Konsultasi Bantuan Sosial]]',
        '[[action:tab:pillars:Lihat Pendamping Sosial]]'
      ],
    };
  }

  if (isJustKTA) {
    return {
      isAmbiguous: true,
      clarificationPrompt: `PERTANYAAN KTA AMBIGU TERDETEKSI ("${query}"). Terapkan Proactive Clarification: Tanyakan apakah pengguna ingin mengunduh/mencetak KTA Digital QR Code yang sudah tervalidasi, atau mengajukan permohonan KTA baru sebagai relawan pilar.`,
      actionTags: [
        '[[action:tab:kta_verifier:Cek Verifikasi KTA]]',
        '[[action:tab:user_reg_history:Pengajuan KTA Baru]]'
      ],
    };
  }

  if (isJustSyarat && !activeObject) {
    return {
      isAmbiguous: true,
      clarificationPrompt: `PERTANYAAN SYARAT TANPA OBJEK TERDETEKSI ("${query}"). Terapkan Proactive Clarification: Tanyakan syarat untuk pilar apa yang dimaksud (Tagana, PSM, TKSK, Peksos, Karang Taruna, atau pendaftaran DTKS).`,
      actionTags: [
        '[[action:pillar:tagana:Syarat Tagana]]',
        '[[action:pillar:psm:Syarat PSM]]',
        '[[action:pillar:peksos:Syarat Peksos]]'
      ],
    };
  }

  return { isAmbiguous: false, clarificationPrompt: '', actionTags: [] };
}

export function resolveContextFromChatHistory(
  lastUserMsg: string,
  messages: Array<{ role: string; content: string }>
): ContextResolutionResult {
  const normCurrent = lastUserMsg.toLowerCase().trim();
  
  // Look at up to 6 previous messages in conversation history for deep context
  const previousMsgs = messages.slice(-6, -1);
  if (previousMsgs.length === 0) {
    const ambig = detectAmbiguousInquiry(lastUserMsg, null);
    return {
      detectedContext: ambig.isAmbiguous,
      detectedObject: null,
      detectedTopic: null,
      instruction: ambig.clarificationPrompt,
      isAmbiguous: ambig.isAmbiguous,
      clarificationPrompt: ambig.clarificationPrompt,
      suggestedActionTags: ambig.actionTags,
    };
  }

  // Detect emotional protest / complaint / correction (Pilar 4: Anti-Looping)
  const isComplaintOrCorrection =
    normCurrent.includes('lah kok') ||
    normCurrent.includes('kok gitu') ||
    normCurrent.includes('naha kitu') ||
    normCurrent.includes('kok ga nyambung') ||
    normCurrent.includes('gak nyambung') ||
    normCurrent.includes('ga nyambung') ||
    normCurrent.includes('salah jawab') ||
    normCurrent.includes('ngaco') ||
    normCurrent.includes('bukan itu maksud') ||
    normCurrent.includes('bukan itu maksudnya') ||
    normCurrent.includes('bukan itu') ||
    normCurrent.includes('salah paham') ||
    normCurrent.includes('kok malah') ||
    normCurrent.includes('salah tanggap') ||
    normCurrent.includes('maksud aku') ||
    normCurrent.includes('maksud saya');

  // Detect pronouns or contextual follow-up patterns
  const hasPronounOrFollowUp =
    isComplaintOrCorrection ||
    normCurrent.includes('itu maksudnya') ||
    normCurrent.includes('maksudnya apa') ||
    normCurrent.includes('di mana lokasinya') ||
    normCurrent.includes('dimana lokasinya') ||
    normCurrent.includes('lokasinya di mana') ||
    normCurrent.includes('lokasinya dimana') ||
    normCurrent.includes('dimana wae') ||
    normCurrent.includes('berapa lama prosesnya') ||
    normCurrent.includes('berapa lama') ||
    normCurrent.includes('sabaraha lamina') ||
    normCurrent.includes('sama juga gak') ||
    normCurrent.includes('sama gak') ||
    normCurrent.includes('sama juga ga') ||
    normCurrent.includes('sama ga') ||
    normCurrent.includes('sama keneh') ||
    normCurrent.includes('sami oge') ||
    normCurrent.includes('syaratnya apa') ||
    normCurrent.includes('syaratnya apa aja') ||
    normCurrent.includes('syaratna naon') ||
    normCurrent.includes('bawa apa aja') ||
    normCurrent.includes('daftarnya gimana') ||
    normCurrent.includes('cara daftarnya') ||
    normCurrent.includes('kumaha carana') ||
    normCurrent.includes('kalau ') ||
    normCurrent.includes('kalo ') ||
    normCurrent.includes('pami ') ||
    normCurrent.includes('terus ') ||
    normCurrent.includes('trus ') ||
    normCurrent.includes('lajeng ') ||
    normCurrent.length < 25;

  const combinedHistory = previousMsgs.map((m) => m.content.toLowerCase()).join(' ');

  let detectedObject: string | null = null;
  let detectedTopic: string | null = null;

  // Scan recent history in reverse order to find the latest active anchor
  for (let i = previousMsgs.length - 1; i >= 0; i--) {
    const text = previousMsgs[i].content.toLowerCase();
    if (!detectedObject) {
      if (text.includes('tagana') || text.includes('taruna siaga')) detectedObject = 'TAGANA (Taruna Siaga Bencana)';
      else if (text.includes('peksos') || text.includes('pksp') || text.includes('sipps')) detectedObject = 'Pekerja Sosial Profesional (PEKSOS)';
      else if (text.includes('psm') || text.includes('sosial masyarakat')) detectedObject = 'PSM (Pekerja Sosial Masyarakat)';
      else if (text.includes('tksk') || text.includes('kecamatan')) detectedObject = 'TKSK (Tenaga Kesejahteraan Sosial Kecamatan)';
      else if (text.includes('karang taruna') || text.includes('katar')) detectedObject = 'Karang Taruna';
      else if (text.includes('lks') || text.includes('panti')) detectedObject = 'LKS (Lembaga Kesejahteraan Sosial)';
      else if (text.includes('lk3')) detectedObject = 'LK3';
      else if (text.includes('pensos')) detectedObject = 'Penyuluh Sosial';
      else if (text.includes('kube')) detectedObject = 'KUBE (Kelompok Usaha Bersama)';
      else if (text.includes('slrt') || text.includes('puskesos')) detectedObject = 'SLRT / Puskesos';
    }
    if (!detectedTopic) {
      if (text.includes('daftar') || text.includes('gabung') || text.includes('registrasi') || text.includes('ikutan') || text.includes('ngiringan')) {
        detectedTopic = 'Proses Pendaftaran & Cara Bergabung';
      } else if (text.includes('syarat') || text.includes('persyaratan') || text.includes('dokumen') || text.includes('berkas')) {
        detectedTopic = 'Kriteria Administrasi & Persyaratan';
      } else if (text.includes('kta') || text.includes('kartu') || text.includes('qr code')) {
        detectedTopic = 'KTA Digital & Smart Access Card';
      } else if (text.includes('bansos') || text.includes('dtks') || text.includes('pkh') || text.includes('bpnt')) {
        detectedTopic = 'Bantuan Sosial & DTKS';
      } else if (text.includes('mutasi') || text.includes('pindah wilayah')) {
        detectedTopic = 'SOP Mutasi Relawan Antar Wilayah';
      }
    }
  }

  // Check if current user query names another entity explicitly (e.g. "Kalau TKSK sama juga gak?")
  let targetPillarInCurrentQuery: string | null = null;
  if (normCurrent.includes('tksk')) targetPillarInCurrentQuery = 'TKSK (Tenaga Kesejahteraan Sosial Kecamatan)';
  else if (normCurrent.includes('tagana')) targetPillarInCurrentQuery = 'TAGANA (Taruna Siaga Bencana)';
  else if (normCurrent.includes('psm')) targetPillarInCurrentQuery = 'PSM (Pekerja Sosial Masyarakat)';
  else if (normCurrent.includes('karang taruna') || normCurrent.includes('katar')) targetPillarInCurrentQuery = 'Karang Taruna';
  else if (normCurrent.includes('peksos') || normCurrent.includes('pksp')) targetPillarInCurrentQuery = 'Pekerja Sosial Profesional (PEKSOS)';
  else if (normCurrent.includes('lks')) targetPillarInCurrentQuery = 'Lembaga Kesejahteraan Sosial (LKS)';
  else if (normCurrent.includes('lk3')) targetPillarInCurrentQuery = 'LK3';
  else if (normCurrent.includes('pensos')) targetPillarInCurrentQuery = 'Penyuluh Sosial';
  else if (normCurrent.includes('kube')) targetPillarInCurrentQuery = 'KUBE';
  else if (normCurrent.includes('slrt') || normCurrent.includes('puskesos')) targetPillarInCurrentQuery = 'SLRT / Puskesos';

  const ambig = detectAmbiguousInquiry(lastUserMsg, targetPillarInCurrentQuery || detectedObject);

  let instruction = '';
  if (isComplaintOrCorrection) {
    instruction = `[KOREKSI & KOMPLAIN PENGGUNA TERDETEKSI ("${lastUserMsg}")]
AI MUTLAK: Pengguna menyatakan jawaban sebelumnya keliru atau tidak sesuai.
1. Jangan mengulangi penjelasan materi yang salah atau membantah pengguna.
2. Sampaikan permohonan maaf dengan tulus dan penuh kesantunan (budaya Sunda / Indonesia).
3. Arahkan jawaban langsung menjawab topik yang dikoreksi pengguna (misal: jika pengguna protes minta info Bansos, jawab 100% tentang alur bansos DTKS di kelurahan dan cekbansos.kemensos.go.id).`;
  } else if (targetPillarInCurrentQuery && (normCurrent.includes('sama juga gak') || normCurrent.includes('sama gak') || normCurrent.includes('gimana') || normCurrent.includes('sami oge'))) {
    instruction = `[DYNAMIC TOPIC TRACKER - PERBANDINGAN ANTAR-PILAR]: Pengguna menanyakan apakah "${detectedTopic || 'Pendaftaran'}" untuk ${targetPillarInCurrentQuery} sama dengan ${detectedObject || 'pilar sebelumnya'}.\nInstruksi AI: Sambungkan konteks secara cerdas! Bandingkan alur spesifik untuk ${targetPillarInCurrentQuery} (seperti seleksi khusus kuota 1 personil per kecamatan oleh Dinsos Kab/Kota) dengan ramah.`;
  } else if (detectedObject || detectedTopic) {
    instruction = `[DYNAMIC TOPIC TRACKER - RESOLUSI KATA GANTI/ELIPSIS]: Pengguna mengajukan pertanyaan lanjutan/singkat ("${lastUserMsg}"). Objek aktif yang sedang dibahas adalah ${detectedObject ? `[${detectedObject}]` : ''} terkait ${detectedTopic ? `[${detectedTopic}]` : 'topik terkait'}.\nInstruksi AI: Pertahankan dan kunci topik aktif ini! JANGAN melompat ke pilar lain secara acak. Jawab langsung rincian kriteria/prosesnya untuk ${detectedObject || 'topik tersebut'}.`;
  } else if (ambig.isAmbiguous) {
    instruction = ambig.clarificationPrompt;
  }

  return {
    detectedContext: Boolean(detectedObject || detectedTopic || targetPillarInCurrentQuery || isComplaintOrCorrection || ambig.isAmbiguous),
    detectedObject: targetPillarInCurrentQuery || detectedObject,
    detectedTopic,
    instruction,
    isComplaintOrCorrection,
    isAmbiguous: ambig.isAmbiguous,
    clarificationPrompt: ambig.clarificationPrompt,
    suggestedActionTags: ambig.actionTags,
  };
}

/**
 * Initializes and synchronizes the AI Brain, Knowledge Base, and Vocabulary with Firestore.
 */
export async function ensureAIKnowledgeSeeded(forceSync = false): Promise<AIKnowledgeDoc[]> {
  const now = Date.now();
  if (!forceSync && cachedKnowledgeBase.length > 0 && (now - lastCacheSyncTime < CACHE_TTL_MS)) {
    return cachedKnowledgeBase;
  }

  try {
    // 1. Ensure Brain / System Instruction in Firestore (ai_config/system_brain)
    await getAIBrainConfig(forceSync);

    // 2. Ensure Vocabulary in Firestore (ai_vocabulary)
    await getAIVocabulary(forceSync);

    // 3. Ensure Knowledge Base in Firestore (ai_knowledge_base)
    const kbColRef = collection(db, 'ai_knowledge_base');
    const snapshot = await getDocs(kbColRef);

    if (snapshot.empty) {
      console.log('[Firestore AI Knowledge] Initializing Firestore knowledge base with master records...');
      for (const item of MASTER_AI_KNOWLEDGE_BASE) {
        try {
          await setDoc(doc(db, 'ai_knowledge_base', item.id), item);
        } catch (setErr) {
          console.warn(`[Firestore AI Knowledge] Error seeding item ${item.id}:`, setErr);
        }
      }
      cachedKnowledgeBase = [...MASTER_AI_KNOWLEDGE_BASE];
    } else {
      const docsFromFs: AIKnowledgeDoc[] = [];
      snapshot.forEach((snap) => {
        docsFromFs.push(snap.data() as AIKnowledgeDoc);
      });
      if (docsFromFs.length > 0) {
        cachedKnowledgeBase = docsFromFs;
      }
    }

    lastCacheSyncTime = now;
    return cachedKnowledgeBase;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ai_knowledge_base');
    return cachedKnowledgeBase;
  }
}

/**
 * Normalizes input user text by translating slang, typos, and Sundanese words into standard terms.
 */
export function normalizeQueryWithComprehensiveVocabulary(rawQuery: string): {
  normalizedText: string;
  detectedIntents: string[];
  detectedPillar: string | null;
} {
  let text = rawQuery.toLowerCase();
  const detectedIntents: string[] = [];

  // Look up vocabulary replacements
  for (const vocab of cachedVocabulary) {
    const wordPattern = new RegExp(`\\b${vocab.word}\\b`, 'gi');
    if (wordPattern.test(text)) {
      text = text.replace(wordPattern, vocab.canonical);
      if (vocab.intent && !detectedIntents.includes(vocab.intent)) {
        detectedIntents.push(vocab.intent);
      }
    }
  }

  // Detect referenced pillar
  let detectedPillar: string | null = null;
  if (text.includes('tagana') || text.includes('bencana') || text.includes('dumlap')) detectedPillar = 'tagana';
  else if (text.includes('peksos') || text.includes('pksp') || text.includes('sipps')) detectedPillar = 'peksos';
  else if (text.includes('psm') || text.includes('sosial masyarakat')) detectedPillar = 'psm';
  else if (text.includes('karang taruna') || text.includes('katar') || text.includes('pemuda')) detectedPillar = 'karangtaruna';
  else if (text.includes('tksk') || text.includes('kecamatan')) detectedPillar = 'tksk';
  else if (text.includes('lks') || text.includes('panti') || text.includes('yayasan')) detectedPillar = 'lks';
  else if (text.includes('lk3') || text.includes('konseling keluarga')) detectedPillar = 'lk3';
  else if (text.includes('pensos') || text.includes('penyuluh')) detectedPillar = 'pensos';
  else if (text.includes('kube') || text.includes('badan usaha')) detectedPillar = 'badanusaha';
  else if (text.includes('slrt') || text.includes('puskesos')) detectedPillar = 'slrt_puskesos';

  // Specific high-priority intent tagging
  if (text.includes('daftar') || text.includes('syarat') || text.includes('gabung') || text.includes('masuk')) {
    if (!detectedIntents.includes('register')) detectedIntents.push('register');
  }
  if (text.includes('tugas') || text.includes('fungsi') || text.includes('wewenang') || text.includes('kerja')) {
    if (!detectedIntents.includes('ask_duties')) detectedIntents.push('ask_duties');
  }
  if (text.includes('jumlah') || text.includes('berapa') || text.includes('total') || text.includes('anggota') || text.includes('personil')) {
    if (!detectedIntents.includes('ask_count')) detectedIntents.push('ask_count');
  }
  if (text.includes('alamat') || text.includes('kantor') || text.includes('kontak') || text.includes('telepon') || text.includes('whatsapp')) {
    if (!detectedIntents.includes('ask_contact')) detectedIntents.push('ask_contact');
  }

  return {
    normalizedText: text.trim(),
    detectedIntents,
    detectedPillar,
  };
}

/**
 * Searches the dynamic Firestore knowledge base for the most relevant documents.
 */
export function searchKnowledgeBase(
  normalizedQuery: string,
  activePillar?: string | null
): AIKnowledgeDoc[] {
  const q = normalizedQuery.toLowerCase();
  const effectivePillar = activePillar || null;

  const scoredDocs = cachedKnowledgeBase.map((item) => {
    let score = 0;

    // Direct topic/pillar match
    if (effectivePillar && item.topic.includes(effectivePillar)) {
      score += 15;
    }
    if (q.includes(item.topic)) {
      score += 20;
    }

    // Keyword match
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += 8;
      }
    }

    // Title match
    if (q.includes(item.title.toLowerCase())) {
      score += 12;
    }

    return { item, score };
  });

  return scoredDocs
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

/**
 * Retrieves all knowledge base articles directly from Firestore or memory cache.
 */
export async function getAIKnowledgeList(forceSync = false): Promise<AIKnowledgeDoc[]> {
  return ensureAIKnowledgeSeeded(forceSync);
}

/**
 * Saves or updates a knowledge base article in Cloud Firestore.
 */
export async function saveAIKnowledgeItem(item: AIKnowledgeDoc): Promise<void> {
  try {
    const docRef = doc(db, 'ai_knowledge_base', item.id);
    await setDoc(docRef, item, { merge: true });

    // Update local cache
    const existingIndex = cachedKnowledgeBase.findIndex((k) => k.id === item.id);
    if (existingIndex >= 0) {
      cachedKnowledgeBase[existingIndex] = item;
    } else {
      cachedKnowledgeBase.push(item);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `ai_knowledge_base/${item.id}`);
    throw error;
  }
}

/**
 * Deletes a knowledge base article from Cloud Firestore.
 */
export async function deleteAIKnowledgeItem(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'ai_knowledge_base', id);
    await deleteDoc(docRef);

    // Update local cache
    cachedKnowledgeBase = cachedKnowledgeBase.filter((k) => k.id !== id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `ai_knowledge_base/${id}`);
    throw error;
  }
}

/**
 * Realtime subscription to the ai_knowledge_base collection.
 */
export function subscribeToAIKnowledge(callback: (list: AIKnowledgeDoc[]) => void): () => void {
  try {
    const colRef = collection(db, 'ai_knowledge_base');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items: AIKnowledgeDoc[] = [];
        snapshot.forEach((snap) => {
          items.push(snap.data() as AIKnowledgeDoc);
        });
        if (items.length > 0) {
          cachedKnowledgeBase = items;
          callback(items);
        } else {
          callback(cachedKnowledgeBase.length > 0 ? cachedKnowledgeBase : MASTER_AI_KNOWLEDGE_BASE);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'ai_knowledge_base');
        callback(cachedKnowledgeBase);
      }
    );
    return unsubscribe;
  } catch (err) {
    callback(cachedKnowledgeBase);
    return () => {};
  }
}

/**
 * =========================================================================
 * PILAR 5: ACTIVE LEARNING & ANONYMOUS QUERY LOGS (ai_unmatched_logs)
 * =========================================================================
 */

/**
 * Logs an unrecognized or unmapped query snippet to Firestore for continuous active learning.
 */
export async function logUnmatchedQueryToFirestore(
  snippet: string,
  detectedWords: string[] = [],
  guessedCategory: 'sunda' | 'singkatan' | 'slang' | 'emosi_komplain' | 'typo' | 'umum' = 'umum'
): Promise<void> {
  if (!snippet || snippet.trim().length < 3) return;

  try {
    const cleanSnippet = snippet.trim().slice(0, 150);
    const hashId = `log_${cleanSnippet.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}`;

    const docRef = doc(db, 'ai_unmatched_logs', hashId);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      const data = existing.data() as AIUnmatchedLogDoc;
      await setDoc(
        docRef,
        {
          count: (data.count || 1) + 1,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      const newLog: AIUnmatchedLogDoc = {
        id: hashId,
        snippet: cleanSnippet,
        detectedWords,
        guessedCategory,
        status: 'pending',
        createdAt: new Date().toISOString(),
        count: 1,
      };
      await setDoc(docRef, newLog);
    }
  } catch (err) {
    console.warn('[Active Learning] Could not log unmatched query to Firestore:', err);
  }
}

/**
 * Retrieves all unmatched query logs for admin inspection and one-click vocabulary promotion.
 */
export async function getAIUnmatchedLogs(): Promise<AIUnmatchedLogDoc[]> {
  try {
    const snap = await getDocs(collection(db, 'ai_unmatched_logs'));
    const list: AIUnmatchedLogDoc[] = [];
    snap.forEach((d) => list.push(d.data() as AIUnmatchedLogDoc));
    return list.sort((a, b) => (b.count || 1) - (a.count || 1));
  } catch (err) {
    console.warn('[Active Learning] Error fetching unmatched logs:', err);
    return [];
  }
}

/**
 * Updates status of an unmatched log (pending | added | dismissed).
 */
export async function updateUnmatchedLogStatus(
  id: string,
  status: 'pending' | 'added' | 'dismissed'
): Promise<void> {
  try {
    const docRef = doc(db, 'ai_unmatched_logs', id);
    await setDoc(docRef, { status }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `ai_unmatched_logs/${id}`);
    throw err;
  }
}

/**
 * Deletes an unmatched query log entry.
 */
export async function deleteUnmatchedLog(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'ai_unmatched_logs', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `ai_unmatched_logs/${id}`);
    throw err;
  }
}

/**
 * One-Click Vocabulary Promotion: Adds a new word directly to `ai_vocabulary`
 * and flags the corresponding unmatched log as 'added'.
 */
export async function convertUnmatchedLogToVocabulary(
  logId: string,
  vocab: AIVocabularyDoc
): Promise<void> {
  await saveAIVocabularyItem(vocab);
  await updateUnmatchedLogStatus(logId, 'added');
}

/**
 * Realtime subscription to the ai_unmatched_logs collection.
 */
export function subscribeToUnmatchedLogs(callback: (logs: AIUnmatchedLogDoc[]) => void): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, 'ai_unmatched_logs'),
      (snap) => {
        const list: AIUnmatchedLogDoc[] = [];
        snap.forEach((d) => list.push(d.data() as AIUnmatchedLogDoc));
        callback(list.sort((a, b) => (b.count || 1) - (a.count || 1)));
      },
      (err) => {
        console.warn('[Active Learning] Listener warning:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.warn('[Active Learning] Subscribe failed:', e);
    return () => {};
  }
}

/**
 * One-click batch synchronization of all master items (Brain, 4 Pilar Kamus, Few-Shot) into Firestore.
 */
export async function syncMasterItemsToFirestore(): Promise<{
  brainSynced: boolean;
  vocabCount: number;
  kbCount: number;
}> {
  // 1. Force update Brain
  const brainRef = doc(db, 'ai_config', 'system_brain');
  await setDoc(brainRef, MASTER_AI_BRAIN_CONFIG, { merge: true });
  cachedBrainConfig = { ...MASTER_AI_BRAIN_CONFIG };

  // 2. Batch update Vocabulary
  for (const v of MASTER_AI_VOCABULARY) {
    await setDoc(doc(db, 'ai_vocabulary', v.id), v, { merge: true });
  }
  cachedVocabulary = [...MASTER_AI_VOCABULARY];

  // 3. Batch update Knowledge Base
  for (const k of MASTER_AI_KNOWLEDGE_BASE) {
    await setDoc(doc(db, 'ai_knowledge_base', k.id), k, { merge: true });
  }
  cachedKnowledgeBase = [...MASTER_AI_KNOWLEDGE_BASE];

  return {
    brainSynced: true,
    vocabCount: MASTER_AI_VOCABULARY.length,
    kbCount: MASTER_AI_KNOWLEDGE_BASE.length,
  };
}

