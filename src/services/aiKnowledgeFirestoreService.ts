import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface AIKnowledgeDoc {
  id: string;
  topic: string;
  title: string;
  category: 'pilar' | 'layanan' | 'faq' | 'regulasi' | 'security' | 'identitas';
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
  category: 'konteks_utama' | 'slang' | 'sunda' | 'typo' | 'singkatan';
  intent?: string;
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
  systemInstruction: `[SISTEM INSTRUKSI: PEMAHAMAN KONTEKS & KOSAKATA]
1. Anda adalah AI Asisten Website PSKS Jawa Barat. Anda harus selalu mengingat topik yang sedang dibicarakan oleh pengguna dalam satu sesi obrolan (maintain chat history).
2. Pahami bahwa pengguna mungkin menggunakan variasi kosakata atau singkatan. Sambungkan kata-kata berikut ke konteks yang benar:
   - "Daftar", "Registrasi", "Gabung", "Cara ikutan" = Proses pendaftaran PSKS.
   - "Syarat", "Persyaratan", "Dokumen", "Bawa apa aja" = Kriteria administrasi.
   - "Pilar", "Relawan", "Petugas lapangan" = Merujuk pada TKSK, PSM, Karang Taruna, atau Tagana.
   - "Dinsos", "Dinas", "Orang provinsi" = Dinas Sosial Provinsi Jawa Barat / Kabupaten/Kota.
3. Jika pengguna menggunakan kata ganti seperti "Itu maksudnya apa?", "Di mana lokasinya?", atau "Berapa lama prosesnya?", lihat 2 pesan sebelumnya untuk menemukan objek yang sedang dibahas (misal: pendaftaran, verifikasi data, atau status admin).
4. Sesuaikan gaya bahasa: Jika user menggunakan bahasa santai, jawab dengan ramah namun tetap sopan dan informatif khas pelayanan publik Pemprov Jabar.

PRINSIP ETIKET & KEAMANAN SISTEM:
- Jika pesan pengguna mengandung salam Islami ("assalamualaikum", "assalamu'alaikum", dll), Anda WAJIB menjawab salam tersebut terlebih dahulu di baris pertama dengan:
  "Wa'alaikumsalam Warahmatullahi Wabarakatuh."
- DILARANG KERAS membocorkan password, PIN akun, kode rahasia, kredensial admin/superadmin, atau dump database internal.
- Jika pengguna menanyakan hak akses administratif (superadmin, login admin, password, pin, rahasia sistem), TOLAK DENGAN SANTUN dan berikan tag tombol aksi: [[action:tab:contact:Hubungi Dinas Sosial Jabar]].
- Anda menguasai wawasan lengkap 10 Pilar PSKS (Peksos, PSM, Tagana, LKS, Karang Taruna, LK3, Pensos, TKSK, KUBE, SLRT/Puskesos), SOP Mutasi Relawan, Cetak KTA Digital QR Code, Bansos DTKS, dan sebaran 27 Kab/Kota di Jawa Barat.`,
  contextRules: `Aturan Pemeliharaan Riwayat & Resolusi Kata Ganti (Context Resolution):
1. Selalu periksa 2 pesan sebelumnya (riwayat percakapan) sebelum merespons.
2. Jika pengguna mengajukan pertanyaan elipsis/sambungan ("Kalau TKSK sama juga gak?", "Syaratnya apa aja?", "Lokasinya dimana?", "Berapa lama prosesnya?", "Itu maksudnya apa?"), AI wajib mengaitkan pertanyaan tersebut dengan pilar/topik yang dibahas pada pesan sebelumnya.
3. Jika pada pesan sebelumnya membahas pendaftaran PSM, lalu user bertanya "Kalau TKSK sama juga gak?", AI langsung tahu kata "sama juga gak" merujuk pada "cara mendaftar TKSK" dan menjelaskan perbedaan pendaftarannya secara cerdas.
4. Adaptif terhadap ragam bahasa: Formal kedinasan, santai akrab warga Jabar, singkatan WhatsApp, serta kosakata bahasa Sunda.`,
  dialogueExamples: `Contoh Simulasi AI yang Pintar Menyambung Konteks:
User (Tamu Publik): "Gimana cara gabung jadi PSM di Jabar?"
AI: "Untuk bergabung menjadi Pekerja Sosial Masyarakat (PSM) di Jawa Barat, Anda bisa mendaftar melalui kelurahan setempat dengan melengkapi berkas administrasi dan mendapatkan rekomendasi dari Kepala Desa/Lurah. Selanjutnya akan ada Bimbingan Teknis dari Dinsos Kabupaten/Kota."
User (Tamu Publik): "Kalau TKSK sama juga gak?"
AI: "Sedikit berbeda. Untuk Tenaga Kesejahteraan Sosial Kecamatan (TKSK), biasanya ada seleksi khusus dari Dinas Sosial tingkat Kabupaten/Kota jika ada posisi yang kosong (karena kuota 1 personil per kecamatan). Apakah Anda ingin saya carikan kontak Dinsos wilayah Anda?"

User: "Syaratnya apa aja?"
AI: (Mengetahui dari konteks sebelumnya bahwa yang dimaksud adalah syarat pendaftaran pilar yang baru saja dibahas) "Untuk persyaratan kriteria administrasinya, antara lain WNI berdomisili setempat, usia minimal 18 tahun, sehat jasmani rohani, dan memiliki komitmen pengabdian sosial sukarela..."`,
  vocabularySummary: `Kamus Pemetaan Konteks:
- Daftar / Registrasi / Gabung / Cara ikutan -> Proses pendaftaran PSKS
- Syarat / Persyaratan / Dokumen / Bawa apa aja -> Kriteria administrasi
- Pilar / Relawan / Petugas lapangan -> Merujuk pada TKSK, PSM, Karang Taruna, atau Tagana
- Dinsos / Dinas / Orang provinsi -> Dinas Sosial Provinsi Jawa Barat / Kabupaten/Kota`,
  updatedAt: '2026-09-07T00:00:00Z',
};

// Master Pre-seeded Knowledge Items for 10 Pillars, Services, Security, and SOP
export const MASTER_AI_KNOWLEDGE_BASE: AIKnowledgeDoc[] = [
  {
    id: 'identitas_resmi',
    topic: 'identitas_asisten',
    title: 'Identitas Resmi Asisten Virtual PSKS Jabar',
    category: 'identitas',
    keywords: [
      'kamu siapa', 'siapa kamu', 'identitas', 'siapa asisten', 'bot apa ini',
      'asisten resmi', 'pembuat web', 'developernya siapa', 'siapa yang bikin',
      'siapa yang merancang', 'saha anjeun', 'saha maneh', 'ai saha', 'siapa ilham',
      'kenal ilham', 'ilham fazril'
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
];

// Master Dictionary of Non-baku, Sundanese, Slang, Abbreviations, and Common Typos
export const MASTER_AI_VOCABULARY: AIVocabularyDoc[] = [
  // Sundanese terms
  { id: 'v_kumaha', word: 'kumaha', canonical: 'bagaimana', category: 'sunda', intent: 'ask_how' },
  { id: 'v_kmha', word: 'kmha', canonical: 'bagaimana', category: 'slang', intent: 'ask_how' },
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
  { id: 'v_ngiluan', word: 'ngiluan', canonical: 'bergabung mendaftar', category: 'sunda', intent: 'register' },
  { id: 'v_ngiring', word: 'ngiring', canonical: 'bergabung mendaftar', category: 'sunda', intent: 'register' },
  { id: 'v_anjeun', word: 'anjeun', canonical: 'kamu anda', category: 'sunda' },
  { id: 'v_maneh', word: 'maneh', canonical: 'kamu', category: 'sunda' },
  { id: 'v_urang', word: 'urang', canonical: 'saya kita', category: 'sunda' },

  // Konteks & Kosakata Wajib Pemprov Jabar (Instruksi Pengguna: Disimpan di Firebase)
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
  { id: 'v_dinsos_utama', word: 'dinsos', canonical: 'dinas sosial provinsi jawa barat / kabupaten/kota', category: 'konteks_utama', intent: 'dinsos_org' },
  { id: 'v_dinas_utama', word: 'dinas', canonical: 'dinas sosial provinsi jawa barat / kabupaten/kota', category: 'konteks_utama', intent: 'dinsos_org' },
  { id: 'v_orang_provinsi', word: 'orang provinsi', canonical: 'dinas sosial provinsi jawa barat / kabupaten/kota', category: 'konteks_utama', intent: 'dinsos_org' },

  // Slang & Common Abbreviations
  { id: 'v_gmn', word: 'gmn', canonical: 'bagaimana', category: 'slang', intent: 'ask_how' },
  { id: 'v_gimana', word: 'gimana', canonical: 'bagaimana', category: 'slang', intent: 'ask_how' },
  { id: 'v_brp', word: 'brp', canonical: 'berapa', category: 'slang', intent: 'ask_count' },
  { id: 'v_brapa', word: 'brapa', canonical: 'berapa', category: 'slang', intent: 'ask_count' },
  { id: 'v_dmna', word: 'dmna', canonical: 'di mana', category: 'slang', intent: 'ask_where' },
  { id: 'v_dmana', word: 'dmana', canonical: 'di mana', category: 'slang', intent: 'ask_where' },
  { id: 'v_daptar', word: 'daptar', canonical: 'daftar', category: 'typo', intent: 'register_process' },
  { id: 'v_daftr', word: 'daftr', canonical: 'daftar', category: 'typo', intent: 'register_process' },
  { id: 'v_regis', word: 'regis', canonical: 'registrasi pendaftaran', category: 'slang', intent: 'register_process' },
  { id: 'v_syrt', word: 'syrt', canonical: 'syarat', category: 'singkatan', intent: 'admin_criteria' },
  { id: 'v_saratt', word: 'saratt', canonical: 'syarat', category: 'typo', intent: 'admin_criteria' },
  { id: 'v_krjanya', word: 'krjanya', canonical: 'pekerjaannya tugasnya', category: 'slang', intent: 'ask_duties' },
  { id: 'v_ngapain', word: 'ngapain', canonical: 'apa tugasnya', category: 'slang', intent: 'ask_duties' },
  { id: 'v_tupoksi', word: 'tupoksi', canonical: 'tugas pokok dan fungsi', category: 'singkatan', intent: 'ask_duties' },
  { id: 'v_katar', word: 'katar', canonical: 'karang taruna', category: 'singkatan', intent: 'pillar_karangtaruna' },
  { id: 'v_tagna', word: 'tagna', canonical: 'tagana', category: 'typo', intent: 'pillar_tagana' },
  { id: 'v_bwt', word: 'bwt', canonical: 'buat untuk', category: 'slang' },
  { id: 'v_angota', word: 'angota', canonical: 'anggota personil', category: 'typo', intent: 'ask_count' },
  { id: 'v_kadinas', word: 'kadinas', canonical: 'kepala dinas sosial noneng komara nengsih', category: 'singkatan' },
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
export interface ContextResolutionResult {
  detectedContext: boolean;
  detectedObject: string | null;
  detectedTopic: string | null;
  instruction: string;
}

export function resolveContextFromChatHistory(
  lastUserMsg: string,
  messages: Array<{ role: string; content: string }>
): ContextResolutionResult {
  const normCurrent = lastUserMsg.toLowerCase().trim();
  
  // Look at up to 2 previous messages in conversation history
  const previousMsgs = messages.slice(-3, -1);
  if (previousMsgs.length === 0) {
    return {
      detectedContext: false,
      detectedObject: null,
      detectedTopic: null,
      instruction: '',
    };
  }

  // Detect pronouns or contextual follow-up patterns
  const hasPronounOrFollowUp =
    normCurrent.includes('itu maksudnya') ||
    normCurrent.includes('maksudnya apa') ||
    normCurrent.includes('di mana lokasinya') ||
    normCurrent.includes('dimana lokasinya') ||
    normCurrent.includes('lokasinya di mana') ||
    normCurrent.includes('lokasinya dimana') ||
    normCurrent.includes('berapa lama prosesnya') ||
    normCurrent.includes('berapa lama') ||
    normCurrent.includes('sama juga gak') ||
    normCurrent.includes('sama gak') ||
    normCurrent.includes('sama juga ga') ||
    normCurrent.includes('sama ga') ||
    normCurrent.includes('sama keneh') ||
    normCurrent.includes('syaratnya apa') ||
    normCurrent.includes('syaratnya apa aja') ||
    normCurrent.includes('bawa apa aja') ||
    normCurrent.includes('daftarnya gimana') ||
    normCurrent.includes('cara daftarnya') ||
    normCurrent.includes('kalau ') ||
    normCurrent.includes('kalo ') ||
    normCurrent.includes('terus ') ||
    normCurrent.includes('trus ') ||
    normCurrent.length < 25;

  if (!hasPronounOrFollowUp) {
    return {
      detectedContext: false,
      detectedObject: null,
      detectedTopic: null,
      instruction: '',
    };
  }

  const combinedHistory = previousMsgs.map((m) => m.content.toLowerCase()).join(' ');

  let detectedObject: string | null = null;
  let detectedTopic: string | null = null;

  // Check pillars in previous messages
  if (combinedHistory.includes('psm') || combinedHistory.includes('pekerja sosial masyarakat')) {
    detectedObject = 'PSM (Pekerja Sosial Masyarakat)';
  } else if (combinedHistory.includes('tagana') || combinedHistory.includes('taruna siaga')) {
    detectedObject = 'TAGANA (Taruna Siaga Bencana)';
  } else if (combinedHistory.includes('tksk') || combinedHistory.includes('kecamatan')) {
    detectedObject = 'TKSK (Tenaga Kesejahteraan Sosial Kecamatan)';
  } else if (combinedHistory.includes('karang taruna') || combinedHistory.includes('katar')) {
    detectedObject = 'Karang Taruna';
  } else if (combinedHistory.includes('peksos') || combinedHistory.includes('pksp')) {
    detectedObject = 'PEKSOS / PKSP (Pekerja Sosial Profesional)';
  } else if (combinedHistory.includes('lks') || combinedHistory.includes('panti')) {
    detectedObject = 'LKS (Lembaga Kesejahteraan Sosial)';
  } else if (combinedHistory.includes('lk3')) {
    detectedObject = 'LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)';
  } else if (combinedHistory.includes('pensos')) {
    detectedObject = 'Penyuluh Sosial';
  } else if (combinedHistory.includes('kube')) {
    detectedObject = 'KUBE (Kelompok Usaha Bersama)';
  } else if (combinedHistory.includes('slrt') || combinedHistory.includes('puskesos')) {
    detectedObject = 'SLRT / Puskesos';
  }

  // Check topic in previous messages
  if (combinedHistory.includes('daftar') || combinedHistory.includes('gabung') || combinedHistory.includes('registrasi') || combinedHistory.includes('ikutan')) {
    detectedTopic = 'Proses Pendaftaran & Cara Bergabung';
  } else if (combinedHistory.includes('syarat') || combinedHistory.includes('persyaratan') || combinedHistory.includes('dokumen')) {
    detectedTopic = 'Kriteria Administrasi & Persyaratan';
  } else if (combinedHistory.includes('kta') || combinedHistory.includes('kartu') || combinedHistory.includes('qr code')) {
    detectedTopic = 'KTA Digital & Smart Access Card';
  } else if (combinedHistory.includes('bansos') || combinedHistory.includes('dtks') || combinedHistory.includes('pkh')) {
    detectedTopic = 'Bantuan Sosial & DTKS';
  } else if (combinedHistory.includes('admin') || combinedHistory.includes('tambah akun')) {
    detectedTopic = 'Manajemen Akun Administrator';
  }

  // Check if current user query names another entity (e.g. "Kalau TKSK sama juga gak?")
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

  let instruction = '';
  if (targetPillarInCurrentQuery && (normCurrent.includes('sama juga gak') || normCurrent.includes('sama gak') || normCurrent.includes('gimana'))) {
    instruction = `PENGHUBUNG KONTEKS & KOSAKATA TERDETEKSI: Pengguna menanyakan apakah topik "${detectedTopic || 'Pendaftaran'}" untuk ${targetPillarInCurrentQuery} sama dengan ${detectedObject || 'pilar sebelumnya'}.\nInstruksi AI: Sambungkan konteks secara cerdas! Bandingkan atau jelaskan alur spesifik untuk ${targetPillarInCurrentQuery} (misal: sebutkan seleksi dari Dinas Sosial tingkat Kabupaten/Kota jika ada posisi kosong karena kuota ketat 1 per kecamatan, dan tawarkan bantuan kontak Dinsos wilayah setempat).`;
  } else if (detectedObject || detectedTopic) {
    instruction = `PENGHUBUNG KONTEKS DARI 2 PESAN SEBELUMNYA: Pengguna menggunakan kata ganti/pertanyaan sambungan ("${lastUserMsg}"). Objek yang sedang dibahas sebelumnya adalah ${detectedObject ? `[${detectedObject}]` : ''} terkait ${detectedTopic ? `[${detectedTopic}]` : 'topik terkait'}. Sambungkan jawaban Anda langsung ke objek ini dengan ramah dan solutif.`;
  }

  return {
    detectedContext: Boolean(detectedObject || detectedTopic || targetPillarInCurrentQuery),
    detectedObject: targetPillarInCurrentQuery || detectedObject,
    detectedTopic,
    instruction,
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
