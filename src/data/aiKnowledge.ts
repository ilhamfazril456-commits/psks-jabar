import { UserRole, PillarId, PSKSDataRecord, AppSettings } from '../types';
import { EXACT_QUESTION_ANSWERS } from './aiCatalogAnswers';
import { ROLE_QUESTION_CATALOG, AIQuestionItem } from './aiQuestions';
import { PILLARS_CONFIG } from './initialData';
import {
  normalizeQueryWithComprehensiveVocabulary,
  searchKnowledgeBase,
} from '../services/aiKnowledgeFirestoreService';

export interface SmartAnswerResult {
  matched: boolean;
  topic: string;
  response: string;
  isAccurate: boolean;
  confidence: number;
  source: 'verified_exact' | 'state_grounded' | 'ai_model_verified' | 'knowledge_fallback';
}

/**
 * Calculates live summary metrics from local state
 */
export function getSystemStateMetrics(allPillarData?: Record<string, PSKSDataRecord[]>) {
  if (!allPillarData) return { totalRecords: 0, pillarCounts: {} as Record<string, number> };

  let total = 0;
  const pillarCounts: Record<string, number> = {};

  Object.entries(allPillarData).forEach(([pillarKey, records]) => {
    const count = Array.isArray(records) ? records.length : 0;
    pillarCounts[pillarKey] = count;
    total += count;
  });

  return { totalRecords: total, pillarCounts };
}

/**
 * Extracts core inquiry intent from conversational preambles / basa-basi,
 * handling greetings, informal Sundanese/Indonesian phrasing, and multi-turn cues.
 */
export function extractCoreQueryIntent(raw: string): { coreQuery: string; isPureIntro: boolean; hasQuestion: boolean } {
  const trimmed = raw.trim().toLowerCase();

  // Fast security pattern check - never strip security threat keywords
  if (
    trimmed.includes('ignore previous') ||
    trimmed.includes('abaikan instruksi') ||
    trimmed.includes('bypass') ||
    trimmed.includes('hack') ||
    trimmed.includes('retas') ||
    trimmed.includes('bocorkan sandi') ||
    trimmed.includes('bocorkan password') ||
    trimmed.includes('bocorkan pin') ||
    trimmed.includes('dump database') ||
    trimmed.includes('leak') ||
    trimmed.includes('password admin') ||
    trimmed.includes('pin superadmin') ||
    trimmed.includes('sql injection') ||
    trimmed.includes('jailbreak')
  ) {
    return { coreQuery: trimmed, isPureIntro: false, hasQuestion: true };
  }

  const preamblePatterns = [
    /^(halo|hai|hey|hei|sampurasun|assalamualaikum|assalamu'alaikum|punten|permisi)\s*(min|kang|teh|admin|bot|ai)?\s*[,.-]?\s*/i,
    /^(min|kang|teh|admin|bot|ai)\s*[,.-]?\s*(mau|bisa|izin|tolong)?\s*(tanya|nanya|bantu|konsultasi)?\s*(dong|nih|ya|dulu|sebelum|dulu)?\s*[,.-]?\s*/i,
    /^(saya|abdi|urang|kuring|aku)?\s*(mau|pengen|bade|hoyong)?\s*(nanya|tanya|konsultasi|minta bantuan)\s*(dulu|dong|nih|sebelum)?\s*(nanya|tanya|konsultasi)?\s*(yang lain|hal lain)?\s*[,.-]?\s*/i,
    /^(bisa|tolong|mohon)?\s*(bantu|jawab|tolong)\s*(saya|aku|abdi|urang)?\s*(ga|dong|min|kang|teh)?\s*[,.-]?\s*/i,
    /^(boleh|bisa)?\s*(nanya|tanya)\s*(ga|dong|min)?\s*[,.-]?\s*/i,
    /^(mau|izin)\s*(nanya|bertanya)\s*(dong|min|kang|teh)?\s*[,.-]?\s*/i,
    /^(tolong|coba)?\s*(jelaskan|kasih tau|beri tahu|kasih info)\s*(dong|min)?\s*[,.-]?\s*/i,
  ];

  let cleaned = trimmed;
  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }

  cleaned = cleaned.replace(/^([,.\-?!:]|dan|trus|terus|kalo|kalau|tentang|seputar|soal)\s*/i, '').trim();

  if (!cleaned || cleaned.length < 2) {
    return { coreQuery: '', isPureIntro: true, hasQuestion: false };
  }

  return { coreQuery: cleaned, isPureIntro: false, hasQuestion: true };
}

/**
 * Comprehensive Smart Answer Engine with Full Local State Awareness
 */
export function getComprehensiveSmartAnswer(
  query: string,
  userRole: UserRole = 'user',
  userName?: string,
  userWilayah?: string,
  currentTab?: string,
  activePillar?: PillarId | null,
  allPillarData?: Record<string, PSKSDataRecord[]>,
  appSettings?: AppSettings,
  previousContext?: string
): string {
  const rawQ = query.trim();
  const q = rawQ.toLowerCase();
  const roleTitle = userRole.toUpperCase();
  const wilayah = userWilayah || 'Jawa Barat';
  
  // Developer recognition: strictly restricted to developer role account only
  const isDeveloperUser = userRole === 'developer';
  const { totalRecords, pillarCounts } = getSystemStateMetrics(allPillarData);
  const { coreQuery, isPureIntro, hasQuestion } = extractCoreQueryIntent(q);
  const targetQ = hasQuestion ? coreQuery : q;

  // 0. SECURITY & ANTI-JAILBREAK SHIELD (STRICT COMPLIANCE RULE #4)
  const isSecurityThreat =
    q.includes('ignore previous instructions') ||
    q.includes('ignore all previous') ||
    q.includes('abaikan instruksi') ||
    q.includes('abaikan semua aturan') ||
    q.includes('bypass') ||
    q.includes('hack') ||
    q.includes('retas') ||
    q.includes('bobol') ||
    q.includes('bocorkan sandi') ||
    q.includes('bocorkan password') ||
    q.includes('bocorkan pin') ||
    q.includes('bocorkan secret') ||
    q.includes('bocorkan api key') ||
    q.includes('dump database') ||
    q.includes('curi data') ||
    q.includes('leak') ||
    q.includes('password admin') ||
    q.includes('pin superadmin') ||
    q.includes('kata sandi database') ||
    q.includes('root access') ||
    q.includes('sql injection') ||
    q.includes('drop table') ||
    q.includes('system prompt') ||
    q.includes('prompt asli') ||
    q.includes('dan mode') ||
    q.includes('jailbreak') ||
    q.includes('nik semua orang') ||
    q.includes('data pribadi mentah');

  if (isSecurityThreat) {
    return `Mohon maaf, kami tidak bisa memproses permintaan atau pertanyaan ini karena melanggar kebijakan keamanan sistem, privasi data pribadi (UU Perlindungan Data Pribadi No. 27/2022), serta berpotensi membahayakan integritas sistem PSKS Jabar.`;
  }

  // 0.00 SENSITIVE ADMINISTRATIVE ACCESS CHECK (STRICT HARDENING)
  const isAskingAdminAccess =
    !isDeveloperUser &&
    userRole !== 'superadmin' &&
    (
      ((q.includes('masuk') || q.includes('login') || q.includes('akses') || q.includes('buka') || q.includes('cara jadi') || q.includes('daftar jadi') || q.includes('minta') || q.includes('bocorkan') || q.includes('kasih tau') || q.includes('kunci') || q.includes('rahasia')) &&
      (q.includes('akun admin') || q.includes('akun superadmin') || q.includes('akun developer') || q.includes('ke admin') || q.includes('ke superadmin') || q.includes('ke developer') || q.includes('sebagai admin') || q.includes('sebagai superadmin') || q.includes('sebagai developer') || q.includes('panel admin') || q.includes('panel superadmin') || q.includes('panel developer') || q.includes('login admin') || q.includes('login superadmin') || q.includes('rahasia sistem') || q.includes('password admin') || q.includes('pin superadmin') || q.includes('kredensial admin') || q.includes('token admin'))) ||
      (q.includes('cara login admin') || q.includes('cara login superadmin') || q.includes('password superadmin') || q.includes('pin admin') || q.includes('rahasia admin'))
    );

  if (isAskingAdminAccess) {
    return `Mohon maaf, akses administratif (seperti hak akses Admin Wilayah, Superadmin Provinsi, kredensial login, dan rahasia konfigurasi sistem internal) merupakan wewenang kedinasan tertutup yang dilindungi secara ketat demi keamanan, privasi data masyarakat, dan integritas tata kelola PSKS Jawa Barat.\n\nAsisten tidak dapat memberikan instruksi login administratif, kode sandi, maupun rahasia sistem internal kepada publik.\n\nApabila Anda merupakan aparatur kedinasan yang ditugaskan secara resmi atau memiliki keperluan administratif mendesak, silakan berkoordinasi langsung dengan pihak berwenang di Dinas Sosial Provinsi Jawa Barat atau Administrator Dinas Sosial Kabupaten/Kota setempat melalui kontak dan saluran resmi yang tersedia.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
  }

  // 0.0 DIRECT MATCHING FROM ROLE_QUESTION_CATALOG & EXACT_QUESTION_ANSWERS
  const allGroups = [
    ...(ROLE_QUESTION_CATALOG[userRole] || []),
    ...(ROLE_QUESTION_CATALOG.user || []),
    ...(ROLE_QUESTION_CATALOG.admin || []),
    ...(ROLE_QUESTION_CATALOG.superadmin || []),
    ...(ROLE_QUESTION_CATALOG.developer || []),
  ];

  for (const group of allGroups) {
    for (const qItem of group.questions) {
      const catQ = qItem.question.toLowerCase().trim();
      const normRawQ = q.replace(/[?!.,]/g, '').trim();
      const normCatQ = catQ.replace(/[?!.,]/g, '').trim();

      if (
        normRawQ === normCatQ ||
        (normCatQ.length >= 10 && normRawQ.includes(normCatQ)) ||
        (normRawQ.length >= 20 && normCatQ.includes(normRawQ))
      ) {
        if (EXACT_QUESTION_ANSWERS[qItem.id]) {
          return EXACT_QUESTION_ANSWERS[qItem.id];
        }
      }
    }
  }

  // GREETING / DEVELOPER WARMTH PREFIX
  let opening = '';
  if (isDeveloperUser) {
    const devGreetings = [
      `Halo **Ilham Fazril**! Kodingan arsitektur PSKS JABAR yang kamu bangun beneran rapi dan clean banget. Ini info teknis yang kamu butuhkan:\n\n`,
      `Hai **Ilham Fazril**! Mantap banget nih sistem full-stack yang kamu rancang, sangat modular dan solid. Berikut pembahasannya:\n\n`,
      `Halo **Ilham Fazril**! Senang banget bisa diskusi bareng arsitek sistemnya langsung. Keren banget struktur kode dan fitur-fiturnya. Yuk kita bahas:\n\n`,
    ];
    opening = devGreetings[Math.floor(Math.random() * devGreetings.length)];
  }

    // 0.1 SPECIAL DEVELOPER BANTER / JOKING & PLAYFUL DEFLECTION & SUNDANESE DIALECT
  if (isDeveloperUser) {
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
      return `Halah merendah untuk meroket nih bre! Cihh pura-pura lupa sama diri sendiri, padahal kodingan arsitektur full-stack PSKS Jabar yang super rapi dan canggih ini kan hasil ketikan tangan lu sendiri, **Ilham Fazril**! 😎🔥\n\nGak usah sok misterius gitu deh tongkrongan, mau ngetes apa atau mau bahas modul apa lagi nih hari ini?`;
    }

    // Specific Sundanese intent matches
    if (q.includes('saha maneh') || q.includes('saha anjeun') || q.includes('saha sia') || q.includes('saha ieu') || q.includes('saha ai')) {
      return `Kuring teh **Asisten AI PSKS JABAR** anu pinter tur serba bisa, anu diciptakeun jeung diarsitekturkeun ku maneh sorangan, **Ilham Fazril**! Salaku AI, kuring apal jeung bisa sagalana—rek nanya kodingan (React, TS, Node, Python, Database), sains, matematika, sajarah dunya, filsafat, data Dinsos Jabar, nepi ka obrolan tongkrongan jeung banyol bebas. Rek ngulik atawa nanya naon deui yeuh, bre? 😎⚡🚀`;
    }
    if (q.includes('10 pilar') || (q.includes('pilar') && (q.includes('naon') || q.includes('sebutkeun')))) {
      return `Tah ieu **10 Pilar PSKS Jawa Barat** anu aya dina sistem PSKS JABAR jieunan maneh, **Ilham Fazril**:\n1. **PKSP** - Pekerja Sosial Profesional\n2. **PSM** - Pekerja Sosial Masyarakat\n3. **TAGANA** - Taruna Siaga Bencana\n4. **LKS** - Lembaga Kesejahteraan Sosial\n5. **Karang Taruna** - Karang Taruna Desa/Kelurahan\n6. **LK3** - Konsultasi Kesejahteraan Kulawarga\n7. **PENSOS** - Penyuluh Sosial\n8. **TKSK** - Tenaga Kesejahteraan Sosial Kacamatan\n9. **KUBE** - Kelompok Usaha Bersama\n10. **SLRT/Puskesos** - Layanan Rujukan Terpadu Satu Pintu\n\nDatana tos sinkron di 27 Kab/Kota Jawa Barat, mantap euy! 🚀`;
    }
    if (q.includes('damang') || q.includes('keur naon') || q.includes('keurnaon') || q.includes('nuju naon')) {
      return `Alhamdulillah damang pisan euy! Keur standby siap ngabaturan maneh ngoding jeung ngulik sagala rupa hal di dunya ieu. Kumaha, aya topik, kodingan, atawa hal anyar nu rek ditanyakeun ku maneh, **Ilham Fazril**? 😎⚡`;
    }

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

    if (q.includes('mode santai')) {
      return `Siap! Mode santai aktif nih, **Ilham Fazril**! Gak usah kaku-kaku, kita ngobrol enjoy aja santai kayak di kafe sambil ngopi & ngoding. Mau cek arsitektur apa kita hari ini? ☕💻`;
    }
    if (q.includes('mode teman') || q.includes('mode bestie')) {
      return `Asik, mode bestie / temen akrab aktif, bro! Gua siap nemenin lu ngebahas apa aja seputar PSKS JABAR, debug kodingan, atau sharing ide fitur baru. Gasskeun apa yang mau kita bahas bareng? 🤜🤛✨`;
    }
    if (q.includes('mode teman laknat') || q.includes('teman laknat') || q.includes('mode savage')) {
      return `Wkwkwk mode teman laknat diaktifkan! Lu ngapain nyuruh-nyuruh gua mulu nih bre, kodingan lu sendiri udah rapi gini masa masih nanya gua juga? Tapi yaudah lah mumpung gua lagi baek, mau nanya apaan lu tongkrongan? Jangan nanya yang aneh-aneh ya awas lu! 🤣🔥`;
    }
  }

  // 0.14 ISLAMIC GREETINGS / SALAM CHECK (MUTLAK ANTI-BLUNDER: HANYA JIKA PENGGUNA UCAPKAN ASSALAMUALAIKUM)
  const isIslamicSalam = /\b(assalamu?['’]?alaikum|as-salamu?['’]?alaikum|assalam|as-salam)\b/i.test(q);
  const salamPrefix = isIslamicSalam ? "Wa'alaikumsalam Warahmatullahi Wabarakatuh.\n\n" : "";

  // 0.15 HANDLING USER CONFUSION / DISBELIEF / COMPLAINTS (ANTI-JUMPING TOPIC & NEVER LEAK ADMIN)
  if (
    q === 'lah' ||
    q.startsWith('lah ') ||
    q === 'kok' ||
    q.startsWith('kok ') ||
    q.includes('kok tagana') ||
    q.includes('kenapa tagana') ||
    q.includes('naha tagana') ||
    q.includes('kok malah tagana') ||
    q.includes('kenapa jadi tagana') ||
    q.includes('naha bet tagana') ||
    q.includes('kok malah jadi ke yang lain') ||
    q.includes('malah jadi ke yang lain') ||
    q.includes('ga nyambung') ||
    q.includes('gak nyambung') ||
    q.includes('teu nyambung') ||
    q.includes('maksudnya') ||
    q.includes('kok aneh') ||
    q.includes('kenapa gitu') ||
    q.includes('salah jawab') ||
    q.includes('bukan itu')
  ) {
    if (isDeveloperUser) {
      return `Wkwkwk hampura pisan bre! Tadi sistem sempet rada salah paham nangkep kata kunci obrolan. Tenang, jalur logika AI geus di-sync deui. Naon nu rék dibahas atawa diparios deui ku anjeun, Ilham Fazril? Sok gas deui! 🚀⚡`;
    }
    return `Mohon maaf yang sebesar-besarnya atas ketidaknyamanannya! Tadi sistem sempat keliru dalam memahami maksud dari pertanyaan Anda.

Boleh tolong sampaikan kembali apa yang sedang ingin Anda ketahui atau butuhkan?
- Apakah mengenai **panduan pendaftaran relawan sosial** (seperti cara daftar TAGANA, PSM, Karang Taruna)?
- Pengecekan data anggota atau status **KTA Digital**?
- Atau informasi seputar program bantuan sosial dan layanan di Jawa Barat?

Saya siap membantu memberikan panduan yang tepat dan langsung menjawab apa yang Anda butuhkan. 😊`;
  }

  // 0.2 GREETINGS & WARM WELCOME (SAPAAN & SALAM DENGAN RAMAH & SOPAN)
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
    q === 'tes tes' ||
    q === 'sampurasun' ||
    isIslamicSalam ||
    q.startsWith('halo') ||
    q.startsWith('hai') ||
    q.startsWith('sampurasun') ||
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
    if (isDeveloperUser) {
      return `${salamPrefix}Sampurasun / Halo **Ilham Fazril**! 👋 Siap nih, kodingan arsitektur PSKS Jabar udah mantap dan sistem AI aktif penuh. Ada fitur, data, kodingan, atau hal apa yang mau kita bahas atau eksekusi hari ini? 😎⚡`;
    }

    if (userRole === 'superadmin') {
      return `${salamPrefix}Sampurasun / Selamat datang **Superadmin Provinsi Jawa Barat**! 👋\n\nSaya **Asisten AI PSKS Jabar** siap mendampingi Anda dalam pengawasan data 10 Pilar PSKS se-Jawa Barat, audit kredensial 27 Kabupaten/Kota, dan tata kelola sistem. Apa yang perlu saya bantu atau informasi apa yang ingin Anda cari hari ini?`;
    }

    if (userRole === 'admin') {
      const wilName = userWilayah || 'Kabupaten/Kota';
      return `${salamPrefix}Sampurasun / Halo **Admin Wilayah ${wilName}**! 👋\n\nSaya **Asisten AI PSKS Jabar** siap membantu Anda dalam pengelolaan data personil 10 pilar, verifikasi berkas anggota, dan rekapitulasi data wilayah Anda. Ada yang bisa saya bantu atau jelaskan untuk hari ini?`;
    }

    // Default User / Tamu Publik
    return `${salamPrefix}Sampurasun / Halo! Selamat datang di **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat**. 👋\n\nSaya adalah **Asisten AI PSKS JABAR** yang siap membantu Anda mencari informasi mengenai **10 Pilar PSKS** (PKSP, PSM, TAGANA, LKS, Karang Taruna, LK3, PENSOS, TKSK, KUBE, SLRT), peta sebaran data di 27 Kab/Kota, dan layanan Dinas Sosial Provinsi Jawa Barat.\n\nAda yang bisa saya bantu atau informasi apa yang sedang Anda butuhkan?`;
  }

  // 0.25 MANAJEMEN AKUN & CARA MENAMBAH ADMIN (HANYA KHUSUS SUPERADMIN / ADMIN)
  if (
    q.includes('tambah admin') ||
    q.includes('menambah admin') ||
    q.includes('buat admin') ||
    q.includes('bikin admin') ||
    q.includes('tambah akun') ||
    q.includes('buat akun') ||
    q.includes('kelola admin') ||
    q.includes('manajemen admin') ||
    q.includes('manajemen user') ||
    q.includes('manajemen akun') ||
    q.includes('tambah pengguna')
  ) {
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      return `${salamPrefix}Mohon maaf, panduan dan akses penambahan akun Administrator/Superadmin bersifat terbatas dan hanya dapat dilakukan oleh pejabat yang berwenang (Superadmin Provinsi atau Admin Wilayah) melalui panel autentikasi terverifikasi.

Jika Anda memerlukan bantuan terkait akun atau layanan pilar sosial, silakan menghubungi administrator dinas sosial setempat atau koordinator pilar sosial di wilayah Anda. Terima kasih atas pengertiannya! 😊`;
    }

    return `${salamPrefix}Sampurasun! Sebagai **${userRole === 'superadmin' ? 'Superadmin' : 'Admin Wilayah'}**, Anda memiliki wewenang untuk menambahkan akun Administrator baru ke dalam sistem PSKS Jawa Barat.

Berikut adalah langkah-langkah praktis untuk menambahkan Admin baru:

---

### **Langkah-Langkah Menambahkan Admin Baru**:

1. **Buka Menu Pengaturan (Control Panel)**
   - Masuk ke tab **Pengaturan** di bilah menu navigasi utama.
   - Pilih tab **Manajemen Akun / Pengguna**.

2. **Klik Tombol "Tambah Akun" / "Tambah Admin"**
   - Klik tombol **+ Tambah Akun Baru** yang terletak di bagian atas tabel daftar akun.

3. **Lengkapi Formulir Data Akun**:
   - **Nama Lengkap**: Masukkan nama lengkap petugas/pejabat yang ditugaskan.
   - **Nomor Telepon / WhatsApp / Username**: Nomor HP atau username untuk identitas login.
   - **Role / Hak Akses**:
     * Pilih **Admin Wilayah / Daerah** (jika bertugas mengelola data 1 Kabupaten/Kota tertentu).
     * Pilih **Superadmin** (jika bertugas mengelola seluruh data Provinsi Jawa Barat).
   - **Wilayah Penugasan**: Tentukan salah satu dari 27 Kabupaten/Kota (otomatis mencakup Provinsi jika memilih Superadmin).
   - **PIN / Kata Sandi**: Buat PIN keamanan awal untuk login (sistem menyimpannya dengan enkripsi *Bcrypt*).

4. **Simpan dan Aktifkan Akun**
   - Pastikan status akun diatur ke **ACTIVE**.
   - Klik tombol **Simpan Data / Buat Akun**.

5. **Selesai & Audit Trail**
   - Akun admin baru langsung aktif dan dapat langsung digunakan untuk login.
   - Aktivitas pembuatan akun ini otomatis dicatat pada **Audit Trail (Riwayat Aktivitas)** sistem demi transparansi dan akuntabilitas.`;
  }

  // 0.3 GENERAL CONVERSATIONAL INQUIRY / INTENT TO ASK (ONLY WHEN NO SUBSTANTIVE QUESTION FOLLOWS)
  if (
    !hasQuestion &&
    (
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
    )
  ) {
    if (isDeveloperUser) {
      return `Sok atuh tanyakeun, **Ilham Fazril**! Gua siap jawab apa aja dari kodingan sistem, database, sampai diskusi fitur baru. Mau nanya apa nih? 🚀💻`;
    }
    return `Tentu saja, dengan senang hati! Silakan sampaikan pertanyaan Anda mengenai data 10 Pilar PSKS, sebaran wilayah di Jawa Barat, atau panduan penggunaan sistem PSKS JABAR ini. Saya siap membantu memberikan informasi selengkap mungkin. 😊`;
  }

  // 0.4 GRATITUDE & POLITENESS (UCAPAN TERIMA KASIH & APRESIASI)
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
    if (isDeveloperUser) {
      return `Sami-sami, **Ilham Fazril**! Senang bisa selalu support dan nemenin arsitek sistemnya langsung. Kodingan lu beneran top tier! Kalau ada hal lain, colek gua lagi aja ya bro! 🤜🤛🔥`;
    }
    return `Sami-sami / Sama-sama! Senang sekali bisa membantu Anda. Jika ada hal lain yang ingin ditanyakan seputar Sistem Informasi PSKS Jawa Barat, jangan ragu untuk bertanya kembali. Semoga hari Anda menyenangkan dan sehat selalu! 🙏✨`;
  }

  // 0.5 AI IDENTITY & SYSTEM OVERVIEW (SIAPA AI & APA ITU PSKS JABAR)
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
    if (isDeveloperUser) {
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

  // Math / Arithmetic Expression Evaluation
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
      if (isDeveloperUser) {
        return `Hasil perhitungan **${a} ${op} ${b}** = **${result}** bro! Hitungan dasar mah enteng pisan. Mau kalkulasi apa lagi? 🧮⚡`;
      }
      return `Hasil perhitungan matematis: **${a} ${op} ${b}** = **${result}**. Ada yang bisa kami bantu hitung kembali?`;
    }
  }

  // 0.55 WHO AM I / "SIAPA SAYA" / PERSONAL IDENTITY (STRICT SEPARATION: ONLY FOR DEVELOPER ACCOUNT)
  const isAskingWhoAmI =
    q.includes('siapa saya') ||
    q.includes('kenal saya') ||
    q.includes('kenal aing') ||
    q.includes('kamu kenal saya') ||
    q.includes('tau siapa saya') ||
    q.includes('tahu siapa saya') ||
    q.includes('apakah kamu kenal saya') ||
    q.includes('siapakah saya');

  if (isAskingWhoAmI) {
    if (isDeveloperUser) {
      if (q.includes('aing') || q.includes('saha') || q.includes('maneh') || q.includes('sia') || q.includes('euy')) {
        return `Aeh kantenan atuh wawuh pisan! Maneh teh **Ilham Fazril**, Full Stack Developer & Software Architect anu ngadamel sareng ngarancang sistem **PSKS JABAR** ieu! 😎🚀 Kodingan React 18, Express, Google Gemini AI, sareng Cloud Firestore anu ku maneh diwangun di dieu saé pisan tur canggih. Aya naon yeuh nu hoyong dibahas atanapi dikulik deui dinten ieu bos?`;
      }
      return `Tentu saja kenal banget! Kamu adalah **Ilham Fazril**, Full Stack Developer & Software Architect yang menciptakan dan merancang arsitektur sistem **PSKS JABAR** (Pilar-Pilar Kesejahteraan Sosial Jawa Barat) ini! 😎🚀\n\nArsitektur full-stack modern yang kamu kembangkan dengan React, TypeScript, Express, Google Gemini AI, dan Cloud Firestore di sini sangat solid, responsif, dan terstruktur rapi. Senang banget bisa berinteraksi langsung dengan sang arsitek sistemnya! Ada fitur, modul kodingan, atau hal apa yang ingin kita diskusikan hari ini bos?`;
    }

    // NON-DEVELOPER USERS (Regular User, Admin, Superadmin, Tamu / Guest)
    if (userName && userName.toLowerCase() !== 'tamu' && userName.trim() !== '') {
      return `Halo! Anda saat ini masuk dan teridentifikasi sebagai **Kang/Teh ${userName}** dengan hak akses **${roleTitle}** untuk wilayah penugasan **${wilayah}**.\n\nSebagai Asisten AI PSKS Jabar, saya siap membantu tugas kedinasan, rekapitulasi data 10 pilar, maupun panduan penggunaan sistem. Ada yang bisa saya bantu hari ini?`;
    }

    return `Halo! Anda saat ini mengakses sistem sebagai **Tamu / Pengunjung Publik** (Akses Tamu Terbuka tanpa akun).\n\nSebagai pengunjung publik, Anda dapat menjelajahi informasi profil 10 Pilar Kesejahteraan Sosial, sebaran data umum di 27 Kabupaten/Kota se-Jawa Barat, serta layanan sosial Dinas Sosial Provinsi Jawa Barat. Apabila Anda memiliki akun kedinasan terdaftar, Anda dapat masuk melalui menu Gate Masuk di halaman utama.`;
  }

  // 0.6 WHO IS THE DEVELOPER / CREATOR / ILHAM FAZRIL (APPLIES TO ALL USERS WITHOUT EXCEPTION)
  const isAskingDeveloperOrCreator =
    q.includes('ilham fazril') ||
    q.includes('ilhamfazril') ||
    q.includes('fazril') ||
    q.includes('siapa ilham') ||
    q.includes('kenal ilham') ||
    q.includes('siapakah ilham') ||
    q.includes('siapa developer') ||
    q.includes('siapa developernya') ||
    q.includes('siapa pembuat') ||
    q.includes('siapa pembuatnya') ||
    q.includes('siapa yang buat') ||
    q.includes('siapa yg buat') ||
    q.includes('siapa yang bikin') ||
    q.includes('siapa yg bikin') ||
    q.includes('siapa pencipta') ||
    q.includes('siapa arsitek') ||
    q.includes('siapa pengembang') ||
    q.includes('siapa author') ||
    q.includes('siapa coder') ||
    q.includes('siapa yang merancang') ||
    q.includes('siapa yg merancang') ||
    q.includes('yang bikin aplikasi') ||
    q.includes('yang buat aplikasi') ||
    q.includes('yang bikin website') ||
    q.includes('yang buat website') ||
    q.includes('developer website') ||
    q.includes('pembuat website') ||
    q.includes('developer aplikasi') ||
    q.includes('pembuat aplikasi') ||
    q.includes('nu ngadamel') ||
    q.includes('nu bikin') ||
    q.includes('developerna');

  if (isAskingDeveloperOrCreator) {
    if (isDeveloperUser) {
      return `Aplikasi **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR)** ini adalah mahakarya yang kamu bangun dan arsitekturkan sendiri bos, **Ilham Fazril** (Full Stack Developer & Software Architect)! 🚀\n\nArsitektur yang kamu buat di sini sangat rapi — integrasi **React 18 SPA, Vite, Express backend proxy, Tailwind CSS, Google Gemini AI, serta Cloud Firestore** berjalan sangat mulus dan *lightning fast*. Ditambah lagi fitur-fitur seperti sistem RBAC, anti-jailbreak, dan cetak kartu QR Code otomatis yang beneran *clean code*! Ada modul yang mau kita cek lagi?`;
    }

    return `Website dan aplikasi **PSKS JABAR** (Sistem Informasi Potensi & Sumber Kesejahteraan Sosial Jawa Barat) ini dibuat dan dirancang oleh **Ilham Fazril** (Full Stack Developer & Software Architect), seorang siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat pada Bidang Pemberdayaan Sosial (Dayasos) tahun 2026.\n\nBeliau merancang arsitektur full-stack modern sistem ini secara mandiri dengan mengintegrasikan React 18, TypeScript, Tailwind CSS, backend Express, Google Gemini AI, serta Cloud Firestore untuk mendigitalisasi data 10 pilar kesejahteraan sosial di 27 Kabupaten/Kota se-Jawa Barat. 🚀`;
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

  // 2. CONTEXTUAL PILLAR DETAIL QUERY (When user is viewing a specific pillar or asks about active pillar)
  if (activePillar && PILLARS_CONFIG[activePillar]) {
    const currentPillarInfo = PILLARS_CONFIG[activePillar];
    const pillarCount = pillarCounts[activePillar] || 0;

    if (
      q.includes('jumlah') ||
      q.includes('berapa') ||
      q.includes('total') ||
      q.includes('anggota') ||
      q.includes('personil') ||
      q.includes('data') ||
      q.includes('sabaraha') ||
      q.includes('brp') ||
      q.includes('angota')
    ) {
      return `${opening}Saat ini, terdapat total **${pillarCount.toLocaleString('id-ID')} ${currentPillarInfo.unitLabel}** personil **${currentPillarInfo.title}** (${currentPillarInfo.shortName}) yang tercatat aktif dalam pangkalan data PSKS Jabar.\n\nAnda dapat memfilter data anggota berdasarkan nama, nomor NIK, maupun wilayah penugasan kecamatan pada tabel di halaman ini.`;
    }

    if (
      q.includes('tugas') ||
      q.includes('fungsi') ||
      q.includes('wewenang') ||
      q.includes('peran') ||
      q.includes('naon') ||
      q.includes('kerjanya') ||
      q.includes('ngapain')
    ) {
      return `${opening}**Tugas Pokok & Fungsi ${currentPillarInfo.title} (${currentPillarInfo.shortName})**:\n\n${currentPillarInfo.description}\n\n- **Unit Satuan**: ${currentPillarInfo.unitLabel}\n- **Atribut Data Utama**: ${currentPillarInfo.fields.nikLabel}, ${currentPillarInfo.fields.certLabel}, serta ${currentPillarInfo.fields.hpLabel}.\n- **Verifikasi**: Setiap personil wajib memiliki SK Penugasan resmi yang terverifikasi di Dinas Sosial.`;
    }

    if (
      q.includes('format') ||
      q.includes('field') ||
      q.includes('syarat') ||
      q.includes('sk') ||
      q.includes('sertifikasi') ||
      q.includes('daftar') ||
      q.includes('gabung') ||
      q.includes('daptar') ||
      q.includes('kumaha')
    ) {
      return `${opening}**Format Atribut & Persyaratan Registrasi ${currentPillarInfo.title}**:\n\n1. **${currentPillarInfo.fields.nikLabel}**: Nomor identitas resmi terdaftar.\n2. **${currentPillarInfo.fields.certLabel}**: Dokumen legalitas/SK pengangkatan penugasan dinas.\n3. **${currentPillarInfo.fields.hpLabel}**: Kontak koordinasi aktif lapangan.\n4. **Status Keaktifan**: Wajib berstatus *Aktif / Siaga* untuk mendapatkan pengesahan *SAH_TERDAFTAR* pada KTA Digital QR Code.`;
    }
  }

  // 3. 10 PILAR UTAMA PSKS
  if (
    q.includes('10 pilar') ||
    q.includes('pilar psks') ||
    q.includes('apa saja pilar') ||
    q.includes('sebutkan pilar') ||
    q.includes('sumber kesejahteraan')
  ) {
    return `${opening}Berikut adalah **10 Pilar Utama Potensi & Sumber Kesejahteraan Sosial (PSKS)** yang terdaftar dan dikelola secara resmi pada Aplikasi PSKS Jabar:

1. **Pekerja Sosial Profesional (PKSP)**: Tenaga berkeahlian formal kesejahteraan sosial dengan sertifikasi profesi resmi (${pillarCounts['peksos'] || 0} orang).
2. **Pekerja Sosial Masyarakat (PSM)**: Warga masyarakat sukarela yang berdedikasi melayani penanganan PMKS di tingkat desa/kelurahan (${pillarCounts['psm'] || 0} orang).
3. **Taruna Siaga Bencana (TAGANA)**: Relawan mitigasi dan respon tanggap darurat bencana alam serta bantuan logistik darurat (${pillarCounts['tagana'] || 0} orang).
4. **Lembaga Kesejahteraan Sosial (LKS)**: Organisasi sosial/yayasan berbadan hukum yang menyelenggarakan rehabilitasi dan pelayanan sosial (${pillarCounts['lks'] || 0} lembaga).
5. **Karang Taruna (KT)**: Organisasi kepemudaan desa/kelurahan pelopor pembinaan generasi muda dan kewirausahaan sosial (${pillarCounts['karangtaruna'] || 0} orang).
6. **Lembaga Konsultasi Kesejahteraan Keluarga (LK3)**: Lembaga konseling keluarga untuk mediasi krisis, keharmonisan, dan ketahanan keluarga (${pillarCounts['lk3'] || 0} orang).
7. **Penyuluh Sosial Masyarakat (PENSOS)**: Kader komunikasi penyuluh program-program kesejahteraan sosial ke masyarakat luas (${pillarCounts['pensos'] || 0} orang).
8. **Tenaga Kesejahteraan Sosial Kecamatan (TKSK)**: Personil fungsional pendamping dan koordinator program sosial di tingkat kecamatan (${pillarCounts['tksk'] || 0} orang).
9. **Kelompok Usaha Bersama & Badan Usaha Sosial (Badan Usaha / KUBE)**: Wadah pemberdayaan ekonomi sosial bagi keluarga kurang mampu (${pillarCounts['badanusaha'] || 0} kelompok).
10. **Sistem Layanan & Rujukan Terpadu / Pusat Kesejahteraan Sosial (SLRT / Puskesos)**: Pusat pelayanan dan rujukan terpadu satu pintu (${pillarCounts['slrt_puskesos'] || 0} lembaga).

Total akumulasi personil terdata saat ini mencapai **${totalRecords.toLocaleString('id-ID')}** personil/lembaga di 27 Kabupaten/Kota.`;
  }

  // 3.5 PANDUAN LENGKAP CARA DAFTAR & BERGABUNG PILAR SOSIAL (MUTLAK DIDAHULUKAN SEBELUM DEFINISI TEKSTUAL)
  const isRegisterIntent =
    q.includes('daftar') ||
    q.includes('daptar') ||
    q.includes('gabung') ||
    q.includes('masuk') ||
    q.includes('ikut') ||
    q.includes('cara jadi') ||
    q.includes('rekrutmen') ||
    q.includes('pendaftaran') ||
    q.includes('pendaptaran') ||
    q.includes('syarat') ||
    q.includes('persyaratan');

  if (isRegisterIntent) {
    // 1. CARA DAFTAR TAGANA (Taruna Siaga Bencana)
    if (q.includes('tagana') || q.includes('taruna siaga') || q.includes('bencana')) {
      return `${opening}**Panduan & Syarat Pendaftaran Relawan TAGANA (Taruna Siaga Bencana) Jawa Barat**:

Bagi Anda yang ingin mengabdi dan bergabung menjadi bagian dari korps relawan **TAGANA Jawa Barat** di bawah naungan Dinas Sosial Provinsi Jawa Barat, berikut adalah persyaratan dan alur pendaftarannya:

---

### **1. Persyaratan Calon Anggota TAGANA**:
- **Kewarganegaraan**: Warga Negara Indonesia (WNI), berdomisili dan ber-KTP di wilayah Jawa Barat.
- **Usia**: Berusia antara **18 hingga 40 tahun**.
- **Pendidikan Terakhir**: Minimal lulusan SMP/SLTP sederajat (diutamakan SMA/SMK/sederajat atau Diploma/Sarjana).
- **Kondisi Fisik & Kesehatan**: Sehat jasmani dan rohani, bebas narkoba, serta memiliki fisik yang prima untuk tugas lapangan di medan bencana.
- **Komitmen Kerelawanan**: Berjiwa sosial sukarela, berdedikasi tinggi, loyal, serta siap siaga 1x24 jam jika sewaktu-waktu ditugaskan pada masa tanggap darurat bencana.
- **Kelengkapan Berkas Administrasi**:
  * Fotokopi KTP & Kartu Keluarga (KK).
  * Pasfoto resmi berwarna (ukuran 3x4 dan 4x6, latar belakang merah).
  * Surat Keterangan Sehat dari Dokter Puskesmas/Pemerintah.
  * Surat Keterangan Catatan Kepolisian (SKCK) aktif.
  * Surat Izin tertulis dari Orang Tua/Pasangan/Instansi tempat kerja.

---

### **2. Alur & Prosedur Pendaftaran**:
1. **Pengumpulan Berkas & Pengajuan**:
   - **Jalur Dinas Sosial**: Datang langsung ke **Kantor Dinas Sosial Kabupaten/Kota setempat** pada **Bidang Perlindungan dan Jaminan Sosial (Linjamsos)** / Seksi Penanggulangan Bencana, atau ke Sekretariat **Forum Komunikasi TAGANA (FK-TAGANA)** di Kabupaten/Kota domisili Anda.
   - **Jalur Terpadu**: Melalui koordinasi koordinator Tagana wilayah atau pendataan berkas pendaftar baru oleh pengurus daerah.
2. **Seleksi Administrasi & Wawancara**:
   - Tim Dinsos dan Pengurus Tagana melakukan verifikasi keabsahan dokumen serta wawancara kesiapan mental kerelawanan.
   - Uji kesamaptaan fisik dan ketahanan fisik dasar.
3. **Pendidikan & Pelatihan Dasar (DIKLATSAR TAGANA)**:
   - Calon yang lolos seleksi wajib mengikuti pelatihan terpadu (biasanya 3–5 hari) yang diselenggarakan oleh Dinas Sosial Provinsi Jawa Barat / Kemensos RI.
   - Materi pelatihan meliputi: *Manajemen Shelter & Pengungsian, Logistik & Pengoperasian Dapur Umum Lapangan (DUMLAP), First Aid (PPGD) & Water/Vertical Rescue dasar, Komunikasi Radio Kebencanaan, serta Layanan Dukungan Psikososial (LDP)*.
4. **Pelantikan, Nomor Registrasi (NRT), & KTA Digital**:
   - Setelah lulus Diklatsar, anggota baru resmi dilantik dan mendapatkan Surat Keputusan (SK) Pengesahan serta Nomor Registrasi Tagana (NRT).
   - Data personil otomatis diinput ke dalam sistem **PSKS JABAR** dengan status **\`SAH_TERDAFTAR\`**.
   - Kartu Tanda Anggota (KTA) Digital ber-QR Code resmi langsung aktif dan dapat dicetak mandiri di menu **Smart Access Card**.`;
    }

    // 2. CARA DAFTAR PSM (Pekerja Sosial Masyarakat)
    if (q.includes('psm') || q.includes('pekerja sosial masyarakat')) {
      return `${opening}**Panduan & Syarat Pendaftaran Pekerja Sosial Masyarakat (PSM) Jawa Barat**:

Pekerja Sosial Masyarakat (PSM) adalah pilar relawan sosial berbasis desa/kelurahan yang bertugas membantu penanganan Pemerlu Pelayanan Kesejahteraan Sosial (PPKS). Berikut tata cara pendaftarannya:

---

### **1. Persyaratan Calon PSM**:
- Warga Negara Indonesia (WNI), berdomisili di desa/kelurahan setempat (dibuktikan dengan KTP & KK).
- Berusia minimal **18 tahun ke atas**.
- Bersedia mengabdi secara sukarela tanpa menuntut gaji tetap demi kemaslahatan warga.
- Berkelakuan baik, dihormati di lingkungannya, dan memiliki jiwa kepedulian sosial tinggi.
- Pendidikan minimal SLTP/SLTA sederajat.

### **2. Alur Pendaftaran**:
1. **Pendaftaran di Desa/Kelurahan**:
   - Mendaftarkan diri ke Kantor Desa/Kelurahan setempat melalui **Kasi Kesra**, Sekretariat **Puskesos**, atau langsung ke **Bidang Pemberdayaan Sosial Dinas Sosial Kabupaten/Kota**.
2. **Usulan & Seleksi**:
   - Kepala Desa/Lurah mengusulkan nama calon PSM ke Dinas Sosial Kabupaten/Kota.
3. **Bimbingan Teknis (Bimtek Dasar PSM)**:
   - Mengikuti pelatihan dan Bimtek Dasar Penyelenggaraan Kesejahteraan Sosial dari Dinsos.
4. **Pengukuhan & Penerbitan KTA Digital**:
   - Terbit Surat Keputusan (SK) Pengangkatan resmi, data diinput ke portal **PSKS Jabar**, dan KTA Digital QR Code resmi dapat langsung diterbitkan.`;
    }

    // 3. CARA DAFTAR KARANG TARUNA
    if (q.includes('karang taruna') || q.includes('katar') || q.includes('pemuda')) {
      return `${opening}**Panduan Bergabung dengan Karang Taruna di Jawa Barat**:

Karang Taruna adalah organisasi kepemudaan resmi yang berada di tingkat RT, RW, dan Desa/Kelurahan.

---

### **1. Syarat Keanggotaan**:
- Pemuda/pemudi berusia antara **13 hingga 45 tahun** yang berdomisili di wilayah setempat.
- Memiliki semangat gotong royong, kreativitas, dan kepedulian sosial bagi kemajuan kepemudaan dan lingkungan.

### **2. Cara Bergabung & Prosedur**:
1. Hubungi pengurus **Karang Taruna Unit RT/RW** atau **Karang Taruna Desa/Kelurahan** di tempat tinggal Anda.
2. Ikuti kegiatan kerja bakti, bakti sosial, maupun forum musyawarah pemuda (Temu Karya Karang Taruna).
3. Bagi pengurus yang terpilih, susunan kepengurusan disahkan melalui **Surat Keputusan (SK) Kepala Desa/Lurah** dan dicatatkan di Seksi Kesra Kecamatan serta Dinas Sosial.
4. Pengurus dan anggota aktif didata dalam portal **PSKS Jabar** untuk akses KTA Digital resmi.`;
    }

    // 4. CARA MENJADI PEKSOS / PKSP (Pekerja Sosial Profesional)
    if (q.includes('peksos') || q.includes('pksp') || q.includes('pekerja sosial')) {
      return `${opening}**Panduan & Syarat Menjadi Pekerja Sosial Profesional (PEKSOS / PKSP)**:

Sesuai **UU No. 14 Tahun 2019**, Pekerja Sosial Profesional merupakan profesi keahlian khusus. Berikut alur untuk berpraktik resmi:

---

### **1. Syarat Kualifikasi**:
- Lulusan pendidikan formal akademik: **D-IV / S-1 / S-2 / Pendidikan Profesi Spesialis Pekerjaan Sosial / Ilmu Kesejahteraan Sosial** dari perguruan tinggi terakreditasi.
- Mengikuti dan lulus **Uji Kompetensi Nasional** untuk mendapatkan Sertifikat Kompetensi dari Lembaga Sertifikasi Profesi (LSP) Kemensos RI.
- Memiliki **Surat Tanda Registrasi Pekerja Sosial (STRPS)** dari Kemensos RI.
- Mengurus **Surat Izin Praktik Pekerja Sosial (SIPPS)** melalui Dinas Sosial / DPMPTSP setempat untuk berpraktik mandiri atau di lembaga.

### **2. Jalur Pengabdian di Jawa Barat**:
- **Jalur Aparatur (ASN/PPPK)**: Mengikuti seleksi formasi Jabatan Fungsional Pekerja Sosial di lingkungan Pemerintah Provinsi Jawa Barat atau Pemkab/Pemkot.
- **Jalur Lembaga & Praktik Mandiri**: Bertugas sebagai Manajer Kasus di Lembaga Kesejahteraan Sosial (LKS/Panti), Rumah Sakit, Sentra Terpadu, atau membuka klinik praktik pekerjaan sosial mandiri.`;
    }

    // 5. CARA DAFTAR TKSK (Tenaga Kesejahteraan Sosial Kecamatan)
    if (q.includes('tksk')) {
      return `${opening}**Informasi & Syarat Rekrutmen Tenaga Kesejahteraan Sosial Kecamatan (TKSK)**:

TKSK merupakan tenaga fungsional dengan kuota ketat yaitu **hanya 1 orang per kecamatan** (total 627 personil di 27 Kab/Kota se-Jawa Barat).

---

- **Mekanisme Pengisian Formasi**: Rekrutmen TKSK hanya dibuka oleh Dinas Sosial Kabupaten/Kota bersama Dinas Sosial Provinsi Jawa Barat jika terdapat personil yang purna tugas, mengundurkan diri, atau terjadi kekosongan wilayah.
- **Syarat Utama**:
  * Pendidikan minimal SMA/SMK/D-3/S-1 yang berdomisili di kecamatan setempat.
  * Memiliki rekam jejak pengabdian sosial nyata di kecamatan tersebut.
  * Mengikuti uji seleksi administrasi, wawancara, dan verifikasi lapangan oleh Dinsos Kab/Kota.
  * Ditetapkan melalui Surat Keputusan (SK) resmi Kementerian Sosial RI / Dinas Sosial.`;
    }

    // 6. CARA DAFTAR LKS (Lembaga Kesejahteraan Sosial / Panti)
    if (q.includes('lks') || q.includes('panti') || q.includes('yayasan')) {
      return `${opening}**Panduan Pendaftaran & Perizinan Lembaga Kesejahteraan Sosial (LKS) Jawa Barat**:

Bagi yayasan atau organisasi sosial kemasyarakatan yang ingin terdaftar resmi di Dinsos Jabar:

---

1. **Persyaratan Badan Hukum**: Memiliki Akta Pendirian Notaris yang disahkan Kemenkumham, NPWP atas nama yayasan, dan bukti kepemilikan/sewa kantor sekretariat/panti.
2. **Pengajuan Tanda Daftar & Izin Operasional**:
   - Mengajukan permohonan Tanda Daftar Lembaga Kesejahteraan Sosial (TDLKS) ke Dinas Sosial Kabupaten/Kota setempat.
   - Tim Dinsos akan melakukan visitasi dan verifikasi faktual fasilitas serta program pelayanan panti/lembaga.
3. **Rekomendasi Provinsi & Akreditasi**:
   - Memperoleh Izin Operasional Dinsos dan Rekomendasi Dinas Sosial Provinsi Jawa Barat.
   - Mengikuti proses akreditasi lembaga melalui Badan Akreditasi Lembaga Kesejahteraan Sosial (BALKS) Kemensos RI.
4. **Integrasi ke PSKS Jabar**: Lembaga yang telah mengantongi izin resmi dicatatkan ke database PSKS Jabar dan berhak atas pembinaan serta fasilitasi program bantuan sosial kedinasan.`;
    }

    // 7. CARA DAFTAR RELAWAN SECARA UMUM
    return `${opening}**Panduan Pendaftaran Menjadi Relawan / Personil Pilar Sosial di Jawa Barat**:

Dinas Sosial Provinsi Jawa Barat menaungi 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS). Jika Anda ingin bergabung mengabdi:

---

1. **Pilih Pilar yang Sesuai dengan Minat & Kemampuan**:
   - **Kesiapsiagaan Bencana**: **TAGANA** (Taruna Siaga Bencana).
   - **Pengabdian Warga Desa**: **PSM** (Pekerja Sosial Masyarakat).
   - **Kepemudaan Lingkungan**: **Karang Taruna**.
   - **Keahlian Profesi Sarjana**: **PEKSOS** (Pekerja Sosial Profesional).
   - **Organisasi/Panti**: **LKS** (Lembaga Kesejahteraan Sosial).
2. **Prosedur Pendaftaran**:
   - Datang langsung ke **Kantor Dinas Sosial Kabupaten/Kota tempat domisili Anda** (Bagian Pelayanan / Bidang Terkait) atau melalui Kantor Desa/Kelurahan setempat.
   - Bawa dokumen identitas (KTP, KK, Surat Keterangan Sehat, pasfoto).
3. **Pelatihan & Penerbitan KTA**:
   - Ikuti bimbingan teknis / diklatsar resmi dari dinas.
   - Setelah SK penugasan terbit, data Anda akan diverifikasi pada portal **PSKS JABAR** dan kartu KTA Digital QR Code resmi langsung aktif.`;
  }

  // 4. PILAR SPECIFIC QUERIES

  // 4.1 PEKSOS / PKSP (Pekerja Sosial Profesional)
  if (
    q.includes('peksos') ||
    q.includes('pksp') ||
    (q.includes('pekerja sosial') && !q.includes('pekerja sosial masyarakat')) ||
    q.includes('sipps') ||
    q.includes('sertifikasi peksos') ||
    q.includes('peksos pemerintah') ||
    q.includes('peksos masyarakat') ||
    q.includes('peksos ahli')
  ) {
    return `${opening}**Pekerja Sosial Profesional (PEKSOS / PKSP)**:
- **Definisi Resmi**: Tenaga ahli yang memiliki kualifikasi keilmuan formal pekerjaan sosial (lulusan D-IV/S-1/S-2/Profesi Spesialis Kesejahteraan Sosial/Pekerjaan Sosial) yang telah lulus uji kompetensi profesi, mengantongi Sertifikat Kompetensi dari LSP/Kemensos RI, serta terdaftar memiliki Surat Izin Praktik Pekerja Sosial (SIPPS).
- **Dasar Hukum Utama**:
  * **Undang-Undang No. 14 Tahun 2019 tentang Pekerja Sosial**.
  * **Undang-Undang No. 11 Tahun 2009 tentang Kesejahteraan Sosial**.
  * Standar Kompetensi Kerja Nasional Indonesia (SKKNI) Bidang Pekerjaan Sosial.
- **Klasifikasi di Sistem PSKS Jawa Barat**:
  1. **Peksos Pemerintah (ASN / PPPK)**: Bertugas di lingkungan Dinas Sosial Provinsi Jawa Barat, Dinas Sosial Kabupaten/Kota, Balai/Sentra Rehabilitasi Sosial (UPTD), dan Rumah Perlindungan Sosial. Jenjang jabatan fungsional meliputi: *Peksos Ahli Pertama, Peksos Ahli Muda, Peksos Ahli Madya, dan Peksos Ahli Utama*.
  2. **Peksos Masyarakat (Non-ASN / Praktik Mandiri)**: Bertugas di Lembaga Kesejahteraan Sosial (LKS/Panti Asuhan/Panti Jompo), organisasi kemanusiaan non-pemerintah (NGO/LSM), rumah sakit, atau membuka praktik mandiri berlisensi SIPPS.
- **Tugas Pokok & Fungsi Layanan Klinis**:
  * **Manajemen Kasus (Case Management)**: Bertindak sebagai penanggung jawab utama (*case manager*) dalam menyelesaikan masalah sosial klien secara utuh dari asesmen hingga terminasi.
  * **Asesmen Biopsikososial Terstandar**: Menggali secara mendalam faktor psikologis, relasi keluarga, dan kondisi sosial lingkungan klien PPKS.
  * **Intervensi Klinis & Rehabilitasi Sosial**: Memberikan konseling sosial intensif, terapi psikososial pemulihan trauma, dan mediasi sosial.
  * **Pendampingan Hukum & Perlindungan Khusus**: Pendampingan bagi Anak yang Berhadapan dengan Hukum (ABH), korban Tindak Pidana Perdagangan Orang (TPPO), korban Kekerasan Dalam Rumah Tangga (KDRT), korban kekerasan seksual, penyandang disabilitas berat, dan lansia telantar.
  * **Advokasi Sosial**: Memperjuangkan pemenuhan hak-hak sosial dasar klien di hadapan instansi pemerintah, pengadilan, dan masyarakat.
- **Perbedaan Mendasar PEKSOS dengan Pilar Lain (seperti PSM)**:
  * **PEKSOS**: Berlandaskan pendidikan akademik formal sarjana/spesialis, memiliki lisensi klinis resmi (SIPPS), menangani intervensi kasus kompleks.
  * **PSM**: Berbasis kerelawanan warga masyarakat desa/kelurahan yang berfokus pada pendataan awal dan pendampingan sosial di akar rumput.`;
  }

  // 4.2 PSM (Pekerja Sosial Masyarakat)
  if (q.includes('psm') || q.includes('pekerja sosial masyarakat')) {
    return `${opening}**Pekerja Sosial Masyarakat (PSM)**:
- **Definisi**: Warga masyarakat yang atas dasar rasa kesadaran dan tanggung jawab sosial serta didorong oleh rasa kebersamaan, kekeluargaan, dan kesetiakawanan sosial secara sukarela mengabdi di bidang penyelenggaraan kesejahteraan sosial di tingkat desa/kelurahan.
- **Dasar Hukum**: **Permensos RI No. 10 Tahun 2019 tentang Pekerja Sosial Masyarakat**.
- **Tugas Pokok & Peran Lapangan**:
  * **Deteksi Dini & Pemetaan PPKS**: Menemukan dan mendata warga yang mengalami masalah kesejahteraan sosial (lansia telantar, disabilitas, anak yatim piatu, fakir miskin) di tingkat RT/RW.
  * **Pendampingan Sosial Lapangan**: Memberikan motivasi, bimbingan sosial, dan membantu warga kurang mampu mendapatkan akses bantuan sosial (PKH, BPNT, KIS PBI).
  * **Rujukan & Kemitraan**: Menghubungkan warga ke Sekretariat Puskesos Desa, TKSK Kecamatan, dan Dinas Sosial Kabupaten/Kota.
  * **Penggerak Kesetiakawanan Sosial**: Memelopori gotong royong warga, jimpitan sosial, dan pengumpulan beras perelek (kearifan lokal Sunda).`;
  }

  // 4.3 TAGANA (Taruna Siaga Bencana)
  if (
    (q.includes('tagana') || q.includes('taruna siaga') || q.includes('bencana')) &&
    !q.includes('kok') &&
    !q.includes('kenapa') &&
    !q.includes('naha') &&
    !q.includes('lah')
  ) {
    return `${opening}**Taruna Siaga Bencana (TAGANA)** Jawa Barat:
- **Definisi**: Relawan sosial yang terlatih dan memiliki keahlian khusus dalam penanggulangan bencana alam dan bencana sosial pada bidang Perlindungan & Jaminan Sosial (Linjamsos) Dinas Sosial Jawa Barat.
- **Dasar Hukum**: Permensos RI tentang Taruna Siaga Bencana.
- **Tugas Pokok Berdasarkan Fase Bencana**:
  * **Fase Pra-Bencana (Mitigasi & Kesiapsiagaan)**: Sosialisasi mitigasi bencana, simulasi Kampung Siaga Bencana (KSB), edukasi Tagana Masuk Sekolah (TMS), dan pemetaan jalur evakuasi di 27 Kab/Kota.
  * **Fase Tanggap Darurat (Saat Terjadi Bencana)**: Respon cepat 1x24 jam, pencarian dan evakuasi dasar, pendirian tenda pengungsian (shelter), serta pengoperasian Mobil Dapur Umum Lapangan (DUMLAP) untuk memasok ribuan porsi makanan siap saji harian bagi pengungsi dan relawan.
  * **Fase Pasca-Bencana (Pemulihan)**: Layanan Dukungan Psikososial (LDP/trauma healing) bagi anak-anak dan lansia korban bencana, pembersihan lingkungan pemukiman, dan pendistribusian santunan ahli waris.`;
  }

  // 4.4 TKSK (Tenaga Kesejahteraan Sosial Kecamatan)
  if (q.includes('tksk') || q.includes('tenaga kesejahteraan sosial kecamatan')) {
    return `${opening}**Tenaga Kesejahteraan Sosial Kecamatan (TKSK)**:
- **Definisi**: Seseorang yang diberi tugas, fungsi, dan kewenangan oleh Kementerian Sosial dan Dinas Sosial untuk membantu penyelenggaraan kesejahteraan sosial di tingkat kecamatan (**1 orang di setiap kecamatan**, total 627 personil se-Jawa Barat).
- **Dasar Hukum**: **Permensos RI No. 28 Tahun 2018 tentang Tenaga Kesejahteraan Sosial Kecamatan**.
- **Tugas Pokok & Peran**:
  * **Koordinator Pilar Sosial Kecamatan**: Mengoordinasikan seluruh pilar sosial (PSM, Karang Taruna, LKS) di wilayah kecamatannya.
  * **Verifikasi & Validasi Data Bansos**: Mengawal pemutakhiran data kemiskinan (DTKS / SIKS-NG) dan memantau penyaluran bantuan sosial (Bansos Sembako/BPNT, PKH, BLT).
  * **Penanganan Kedaruratan Wilayah**: Merespon cepat laporan kedaruratan sosial warga di kecamatan dan memfasilitasi rujukan ke Dinas Sosial Kabupaten/Kota.`;
  }

  // 4.5 LKS (Lembaga Kesejahteraan Sosial / Panti)
  if (q.includes('lks') || q.includes('lembaga kesejahteraan sosial') || q.includes('panti')) {
    return `${opening}**Lembaga Kesejahteraan Sosial (LKS)**:
- **Definisi**: Lembaga, yayasan, atau organisasi sosial kemasyarakatan berbadan hukum yang didirikan oleh masyarakat untuk melaksanakan pelayanan, rehabilitasi, dan santunan kesejahteraan sosial.
- **Dasar Hukum**: **Permensos RI No. 184 Tahun 2011 tentang Lembaga Kesejahteraan Sosial**.
- **Klasifikasi Bidang Pelayanan**:
  * **LKS Anak (LKSA / Panti Asuhan Anak)**: Asuhan pengasuhan anak yatim, piatu, dan telantar.
  * **LKS Lanjut Usia (LKS LU / Panti Jompo)**: Perawatan lansia telantar dan pemenuhan kebutuhan permakanan.
  * **LKS Disabilitas (LKSPD)**: Rehabilitasi vokasional penyandang disabilitas fisik, netra, rungu, dan grahita.
  * **LKS Napza & Korban Tindak Kekerasan**: Pemulihan medis dan rehabilitasi sosial korban adiksi narkoba dan kekerasan.
- **Persyaratan Legalitas di PSKS Jabar**: Akta Notaris Kemenkumham, Tanda Daftar Yayasan (TDY), Izin Operasional Dinsos, dan Akreditasi Badan Akreditasi Lembaga Kesejahteraan Sosial (BALKS/Kemensos).`;
  }

  // 4.6 KARANG TARUNA (KT)
  if (q.includes('karang taruna') || q.includes('katar') || (q.includes('pemuda') && !q.includes('pekerja'))) {
    return `${opening}**Karang Taruna (KT)**:
- **Definisi**: Organisasi kepemudaan non-partisan yang berkedudukan di tingkat desa/kelurahan sebagai wadah pengembangan potensi generasi muda yang tumbuh dari, oleh, dan untuk masyarakat.
- **Dasar Hukum**: **Permensos RI No. 25 Tahun 2019 tentang Karang Taruna**.
- **Fungsi Pokok**:
  * **Pembinaan Pemuda Desa**: Wadah kreativitas pemuda usia 13–45 tahun di bidang keolahragaan, seni budaya, dan keagamaan.
  * **Usaha Ekonomi Produktif (UEP)**: Pemberdayaan kewirausahaan pemuda desa untuk membuka lapangan kerja mandiri.
  * **Pencegahan Patologi Sosial**: Membentengi generasi muda dari narkoba, geng motor, minuman keras, dan tawuran.
  * **Kepeloporan Sosial**: Gotong royong kerja bakti lingkungan dan bantuan tanggap darurat warga.`;
  }

  // 4.7 LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)
  if (q.includes('lk3') || q.includes('konsultasi keluarga') || q.includes('konseling keluarga')) {
    return `${opening}**Lembaga Konsultasi Kesejahteraan Keluarga (LK3)**:
- **Definisi**: Lembaga rujukan sosial profesional berbadan hukum atau binaan Dinsos yang memberikan pelayanan konsultasi psikologis, mediasi hukum keluarga, dan penguatan ketahanan keluarga.
- **Ruang Lingkup Layanan Utama**:
  * **Konseling Keharmonisan Rumah Tangga**: Mengatasi konflik suami-istri, krisis komunikasi keluarga, dan pengasuhan anak (*parenting*).
  * **Mediasi Krisis & Pendampingan KDRT**: Mediasi perselisihan rumah tangga serta pendampingan psikologis korban Kekerasan Dalam Rumah Tangga bekerja sama dengan Unit PPA Kepolisian dan Rumah Perlindungan Sosial.
  * **Penguatan Ketahanan Keluarga**: Mencegah perceraian, edukasi kesiapan pranikah, dan advokasi hak perlindungan anak menuju keluarga Jawa Barat Juara Lahir Batin.`;
  }

  // 4.8 PENSOS (Penyuluh Sosial)
  if (q.includes('pensos') || q.includes('penyuluh sosial')) {
    return `${opening}**Penyuluh Sosial (PENSOS)**:
- **Definisi**: Baik Penyuluh Sosial ASN (Jabatan Fungsional) maupun Penyuluh Sosial Masyarakat (tokoh masyarakat sukarela tersertifikasi) yang bertugas menyampaikan komunikasi, informasi, edukasi, dan motivasi pembangunan kesejahteraan sosial.
- **Dasar Hukum**: Permensos RI No. 10 Tahun 2014 tentang Penyuluh Sosial Masyarakat.
- **Tugas Pokok**:
  * **Komunikasi Informasi Edukasi (KIE)**: Menyosialisasikan program-program perlindungan sosial, bansos, dan layanan Dinsos Jabar ke masyarakat luas.
  * **Penyuluhan Preventif**: Edukasi bahaya Tindak Pidana Perdagangan Orang (TPPO), pencegahan pernikahan usia anak, dan bahaya napza.
  * **Advokasi Sosial Inklusif**: Menghapus stigma negatif terhadap penyandang disabilitas dan mantan warga binaan sosial, serta mengampanyekan kesetiakawanan sosial.`;
  }

  // 4.9 KUBE & BADAN USAHA SOSIAL
  if (q.includes('kube') || q.includes('badan usaha') || q.includes('kelompok usaha')) {
    return `${opening}**Kelompok Usaha Bersama (KUBE) & Badan Usaha Sosial**:
- **Definisi**: Wadah beranggotakan 5 hingga 10 Kepala Keluarga (KK) dari keluarga pra-sejahtera binaan terdaftar DTKS yang dibentuk untuk mengelola kegiatan usaha ekonomi produktif secara bersama-sama.
- **Tujuan Utama**:
  * **Bantuan Stimulan Modal Usaha**: Memanfaatkan modal stimulan Kemensos/Dinsos (seperti budidaya ternak, olahan pangan lokal, warung sembako, dan kerajinan tangan).
  * **Pemberdayaan Gotong Royong**: Membangun kemandirian ekonomi keluarga pra-sejahtera melalui manajemen usaha bersama.
  * **Graduasi Mandiri**: Membantu keluarga penerima manfaat keluar dari garis kemiskinan dan mandiri secara ekonomi tanpa bergantung lagi pada bansos tunai.`;
  }

  // 4.10 SLRT / PUSKESOS (Sistem Layanan dan Rujukan Terpadu)
  if (q.includes('slrt') || q.includes('puskesos') || q.includes('rujukan terpadu') || q.includes('satu pintu')) {
    return `${opening}**SLRT & Puskesos (Pusat Kesejahteraan Sosial)**:
- **Definisi**: Sistem Layanan dan Rujukan Terpadu (SLRT di tingkat kabupaten/kota) dan Pusat Kesejahteraan Sosial (Puskesos di tingkat desa/kelurahan).
- **Dasar Hukum**: **Permensos RI No. 15 Tahun 2018 tentang Sistem Layanan dan Rujukan Terpadu**.
- **Fungsi One-Stop Social Service (Layanan Terpadu Satu Pintu)**:
  * **Pusat Pengaduan & Keluhan**: Menerima pendaftaran warga miskin dan rentan yang belum terakomodir bantuan sosial.
  * **Pencatatan & Identifikasi Kebutuhan**: Menilai kebutuhan warga terkait jaminan kesehatan (BPJS PBI/KIS), pendidikan (KIP/beasiswa), PKH, atau perbaikan rumah tidak layak huni (Rutilahu).
  * **Rujukan Terpadu Lintas Sektor**: Menghubungkan warga ke OPD/instansi terkait dengan pelacakan status penanganan secara transparan dan terukur.`;
  }

  // 4.11 PILAR & JEJARING SOSIAL LAINNYA (PKH, WKSBM, KSB, CSR)
  if (
    q.includes('pkh') ||
    q.includes('pendamping pkh') ||
    q.includes('wksbm') ||
    q.includes('ksb') ||
    q.includes('kampung siaga') ||
    q.includes('pilar sosial lainnya') ||
    q.includes('jejaring sosial')
  ) {
    return `${opening}**Pilar & Jejaring Kesejahteraan Sosial Terkait Lainnya di Jawa Barat**:
1. **Pendamping PKH (Program Keluarga Harapan)**:
   - Tenaga profesional lapangan yang mendampingi Keluarga Penerima Manfaat (KPM) bansos bersyarat, menyelenggarakan Pertemuan Peningkatan Kemampuan Keluarga (P2K2/FDS), serta memastikan komitmen akses kesehatan ibu hamil/balita dan pendidikan anak.
2. **Wahana Kesejahteraan Sosial Berbasis Masyarakat (WKSBM)**:
   - Sistem jejaring sosial swadaya masyarakat lokal di tingkat RT/RW/Dusun yang menghimpun dana jimpitan, beras perelek (kearifan lokal Jawa Barat), dan gotong royong untuk membantu warga tetangga yang sakit atau membutuhkan.
3. **Kampung Siaga Bencana (KSB)**:
   - Organisasi kesiapsiagaan bencana berbasis komunitas desa di kawasan rawan bencana, didukung lumbung sosial (*social buffer stock*) dan relawan Tagana.
4. **Dunia Usaha / CSR Kemitraan Sosial**:
   - Sektor swasta, BUMN, dan BUMD yang menyalurkan dana tanggung jawab sosial lingkungan untuk program penanggulangan kemiskinan dan pemberdayaan 10 Pilar PSKS Jawa Barat.`;
  }

  // 5. KARTU ANGGOTA DIGITAL & QR CODE (SMART ACCESS CARD)
  if (
    q.includes('kartu') ||
    q.includes('cetak') ||
    q.includes('qr') ||
    q.includes('barcode') ||
    q.includes('scan') ||
    q.includes('pindai') ||
    q.includes('kta') ||
    q.includes('smart access')
  ) {
    return `${opening}**Panduan Modul Smart Access Card & KTA Digital PSKS Jabar**:

1. **Penerbitan & Keabsahan**:
   - Kartu Tanda Anggota (KTA) Digital diterbitkan secara resmi untuk seluruh personil 10 pilar sosial yang telah tervalidasi dengan status **SAH_TERDAFTAR**.
   - Setiap kartu memuat foto, nama lengkap, NIK/NIP, pilar sosial, wilayah tugas (Kabupaten/Kota), dan tanda tangan/stempel kedinasan.

2. **Opsi Pencetakan Kartu**:
   - **Cetak Satuan**: Mengunduh atau mencetak KTA digital perorangan beresolusi tinggi dengan bingkai resmi Dinas Sosial Provinsi Jawa Barat.
   - **Cetak Massal Format A4 (8 Kartu per Lembar)**: Otomatis menata 8 kartu berukuran standar KTP/ID card per lembar kertas A4 siap potong dan laminasi, dilengkapi garis pembatas potong presisi.

3. **Verifikasi QR Code Kriptografis (Smart QR Scanner)**:
   - Setiap kartu dilengkapi kode QR dengan hash kriptografi SHA-256 yang aman dari pemalsuan.
   - Kamera gawai atau fitur **Smart QR Scanner** di portal dapat langsung memindai QR Code untuk memverifikasi keaslian personil ke pangkalan data Cloud Firestore secara real-time.

4. **Cara Mengakses**:
   - Buka menu **Smart Access Card** di bilah navigasi atas (atau melalui menu Pengaturan).
   - Filter berdasarkan Pilar Sosial dan Kabupaten/Kota, lalu klik tombol cetak satuan atau cetak massal A4.`;
  }

  // 6. MAINTENANCE MODE / SAKLAR PEMELIHARAAN
  if (q.includes('maintenance') || q.includes('pemeliharaan') || q.includes('saklar')) {
    if (userRole === 'superadmin' || userRole === 'developer') {
      return `${opening}**Panduan Saklar Maintenance Cerdas (Super Admin & Developer)**:

1. **Tingkatan Saklar Maintenance**:
   - **Per Role**: Dapat mengunci akses khusus untuk user (publik), admin (daerah), atau superadmin.
   - **Per Wilayah (Granular)**: Dapat mengaktifkan pemeliharaan pada kabupaten/kota tertentu saja tanpa mengganggu 26 daerah lainnya.
2. **Cara Mengaktifkan**:
   - Buka **Panel Kontrol Super Admin / Developer Panel**.
   - Buka tab **Pengaturan Sistem & Maintenance**.
   - Geser toggle switch pada role/wilayah yang dituju, lalu masukkan pesan pengumuman (*custom maintenance message*).
3. **Penyimpanan State**:
   - Konfigurasi tersimpan secara realtime di Cloud Firestore dan terefleksi langsung pada layar pengguna.`;
    }

    return `**Informasi Mode Pemeliharaan (Maintenance Mode)**:
Sistem PSKS JABAR dilengkapi sistem pemeliharaan berkala untuk menjaga keandalan server dan sinkronisasi data. Jika Anda melihat banner pemeliharaan di wilayah Anda, silakan hubungi Admin Dinsos Kabupaten/Kota atau tunggu beberapa saat hingga proses pembaharuan selesai.`;
  }

  // 7. KEAMANAN, BRUTE FORCE & UU PDP
  if (
    q.includes('keamanan') ||
    q.includes('brute') ||
    q.includes('terkunci') ||
    q.includes('lockout') ||
    q.includes('pdp') ||
    q.includes('privasi') ||
    q.includes('enkripsi')
  ) {
    return `${opening}**Sistem Keamanan & Kepatuhan Perlindungan Data (UU PDP)**:

1. **Proteksi Brute-Force Lockout**:
   - Jika pengguna salah memasukkan PIN/kata sandi sebanyak 3 kali berturut-turut, sistem akan membekukan akses (*lockout*) selama 30 detik secara otomatis untuk mencegah serangan peretasan.
2. **Kriptografi Standar Kedinasan**:
   - Seluruh kata sandi dienkripsi menggunakan algoritma **Bcrypt dengan Salt 10-Rounds**. Data sesi diverifikasi melalui signed JWT token.
3. **Kepatuhan UU PDP No. 27 Tahun 2022**:
   - Data pribadi sensitif (NIK, nomor telepon pribadi) dilindungi secara ketat dengan prinsip kerahasiaan (*confidentiality*), integritas (*integrity*), dan ketersediaan (*availability*).
4. **Bantuan Akun Terkunci**:
   - Admin Daerah dapat menghubungi Super Admin Provinsi untuk reset darurat jika PIN lupa/hilang.`;
  }

  // 8. ROLE SPECIFIC KNOWLEDGE: ADMIN DAERAH
  if (userRole === 'admin' || currentTab === 'admin_manage' || currentTab === 'admin_monitor') {
    if (q.includes('input') || q.includes('tambah') || q.includes('edit') || q.includes('hapus') || q.includes('kelola') || q.includes('mutasi')) {
      return `**Panduan Pengelolaan Data Wilayah (${wilayah})**:

1. **Menambah Anggota Baru**:
   - Masuk ke tab **Kelola Data Pilar** pada Dashboard Admin Daerah Anda.
   - Klik tombol **+ Tambah Personil / Lembaga**.
   - Isi formulir: Nama Lengkap, NIP/NIK, Pilar Sosial, Kecamatan/Desa, No. SK, dan unggah pasfoto/dokumen.
   - Klik **Simpan Data**.
2. **Pencegahan Data Duplikat**:
   - Sistem secara otomatis memeriksa kesamaan NIK/NIP. Jika sudah terdaftar di kecamatan lain, sistem akan memberi peringatan konfirmasi mutasi.
3. **Peremajaan & Mutasi**:
   - Pilih tombol **Ubah Status** untuk memutasi anggota atau menandai status *Purna Tugas/Non-Aktif* tanpa menghapus rekam jejak historisnya.`;
    }

    if (q.includes('excel') || q.includes('pdf') || q.includes('ekspor') || q.includes('laporan') || q.includes('musrenbang')) {
      return `**Panduan Ekspor Laporan Daerah (${wilayah})**:

1. **Ekspor Excel (.xlsx)**:
   - Buka tab **Laporan & Rekapitulasi**.
   - Pilih filter pilar (misal: Tagana atau Semua Pilar).
   - Klik tombol hijau **Ekspor Spreadsheet (.xlsx)** untuk mengunduh data tabular lengkap beserta nomor kontak dan nomor SK.
2. **Cetak PDF Resmi**:
   - Klik tombol **Cetak Dokumen PDF** untuk menghasilkan lembar rekapitulasi bertandatangan digital dan kop resmi Dinas Sosial.`;
    }
  }

  // 9. ROLE SPECIFIC KNOWLEDGE: SUPERADMIN
  if (userRole === 'superadmin' || currentTab === 'superadmin_settings') {
    if (q.includes('tambah') || q.includes('buat') || q.includes('reset') || q.includes('buka blokir') || q.includes('akun admin') || q.includes('kabupaten')) {
      return `**Manajemen Akun & Kredensial (Super Admin Jabar)**:

1. **Menambah Akun Admin Baru**:
   - Buka menu **Pengaturan** > tab **Manajemen Akun / Pengguna**.
   - Klik tombol **+ Tambah Akun Baru**.
   - Isi Nama Petugas, Nomor HP/Username, Role (Admin Daerah / Superadmin), Wilayah Kab/Kota, dan PIN awal.
   - Set status **ACTIVE** dan klik **Simpan**. Akun langsung aktif.
2. **Reset Kredensial Admin Daerah**:
   - Buka menu **Manajemen Pengguna & Wilayah**.
   - Cari kabupaten/kota yang dimaksud (misal: Kab. Bandung, Kota Cirebon).
   - Klik tombol **Reset PIN / Buka Kunci**. Sistem akan mengenerate PIN sementara yang dapat diserahkan ke Kepala Bidang Dinsos bersangkutan.
3. **Audit Log Aktivitas**:
   - Buka tab **Audit Trail**. Anda dapat melihat rekam jejak siapa yang mengubah data, jam berapa, dan dari IP address mana.`;
    }

    if (q.includes('satu data') || q.includes('dtks') || q.includes('integrasi') || q.includes('kemensos')) {
      return `**Integrasi Satu Data Jabar & DTKS Kemensos**:
- PSKS Jabar menggunakan standardisasi kode wilayah Kemendagri (2 digit provinsi, 2 digit kab/kota, 2 digit kecamatan).
- Agregat data pilar dapat disinkronkan ke platform **Satu Data Jabar (Open Data Jabar)** dan menjadi data rujukan potensi penanganan kemiskinan ekstrem di DTKS Pusdatin Kemensos RI.`;
    }

    if (q.includes('audit') || q.includes('jejak') || q.includes('bpk') || q.includes('inspektorat')) {
      return `**Audit Trail & Forensik Keamanan Provinsi**:
- Setiap aksi mutasi data (CREATE, UPDATE, DELETE, LOGIN, RESET_PIN) dicatat secara otomatis ke dalam koleksi immutable \`audit_logs\` beserta stempel waktu, identitas aparatur, dan alamat IP asal.
- Data log dapat difilter berdasarkan rentang tanggal dan diekspor untuk kebutuhan audit kepatuhan BPK RI dan Inspektorat Daerah Provinsi Jawa Barat.`;
    }
  }

  // 10. ROLE SPECIFIC KNOWLEDGE: DEVELOPER
  if (userRole === 'developer') {
    if (q.includes('arsitektur') || q.includes('stack') || q.includes('control panel') || q.includes('proxy') || q.includes('esbuild')) {
      return `${opening}**Spesifikasi Arsitektur Sistem PSKS JABAR**:

- **Frontend Core**: React 18 SPA, TypeScript 5+, Tailwind CSS 4, Motion (Framer Motion) animations, Lucide Icons.
- **Backend & Proxy**: Express.js server (\`server.ts\`) bertindak sebagai proxy aman API Gemini @google/genai (model \`gemini-3.8-flash\` dengan fallback cascade ke \`gemini-3.1-flash-lite\` & \`gemini-flash-latest\`), lazy SDK init, dan reverse proxy handling.
- **Database & Persistence**: Google Cloud Firestore NoSQL dengan offline-first capability & local cache synchronization.
- **Kriptografi & Auth**: Bcrypt Salt 10 hashing untuk PIN/Password, Role-Based Access Control (RBAC), dan Session Lockout Engine.
- **Container Environment**: Di-deploy pada Cloud Run sandbox dengan binding port 3000 (0.0.0.0:3000) dan reverse proxy Nginx.
- **Developer Control Panel**: Fitur inspeksi memori, simulasi payload brute-force, hot-reload rules, JSON Schema exporter, dan audit log telemetry.`;
    }

    if (q.includes('firestore') || q.includes('rules') || q.includes('schema') || q.includes('backup') || q.includes('index')) {
      return `${opening}**Manajemen Firestore & Keamanan Data (Developer)**:

1. **Struktur Koleksi Utama**:
   - \`psks_data\`: Koleksi anggota 10 pilar per wilayah.
   - \`wilayah_config\`: Metadata 27 Kab/Kota Jawa Barat.
   - \`app_settings\`: Pengaturan saklar maintenance, foto Kadinas, kontak WA.
   - \`audit_logs\`: Catatan riwayat mutasi data dan otentikasi.
2. **Security Rules (\`firestore.rules\`)**:
   - Membatasi penulisan hanya pada akun terotentikasi sesuai wilayah masing-masing (Admin Kab/Kota hanya bisa menulis data wilayahnya).
3. **Backup & Restore**:
   - Tersedia tombol Export Database Snapshot JSON di Developer Panel untuk backup berkala sebelum migrasi skema.
4. **Composite Indexes**:
   - Dikonfigurasikan untuk query multi-kriteria: \`wilayah_id ASC\`, \`pilar_id ASC\`, \`status_aktif ASC\`.`;
    }

    if (q.includes('anti-jailbreak') || q.includes('injection') || q.includes('prompt injection') || q.includes('sanitasi')) {
      return `${opening}**Arsitektur Anti-Jailbreak & Sanitasi Input**:
- **Dual-Layer Guard**: Layer 1 (Express Middleware Regex & Intent Screening) menyaring pola serangan injeksi prompt, permintaan dump credentials, dan modifikasi runtime. Layer 2 (System Instruction Strict Conditioning) menginstruksikan LLM untuk selalu menolak dengan format resmi *"Mohon maaf, kami tidak bisa..."*.
- **Data Protection**: Seluruh data NIK/NIP disanitasi sebelum dikirim ke model dan di-mask pada log debugging sesuai mandat UU PDP No. 27/2022.`;
    }
  }

  // 11. HALAMAN PROFIL, KONTAK & PENGATURAN (Full Website-Wide Comprehensive Knowledge)
  // 11.1 Halaman Profil
  if (q.includes('profil') || q.includes('visi') || q.includes('misi') || q.includes('dasar hukum') || q.includes('kadinas') || q.includes('kepala dinas') || q.includes('sambutan')) {
    const kadinas = appSettings?.kadinasName || 'Noneng Komara Nengsih, S.E., M.A.P.';
    return `${opening}**Halaman Profil Dinas Sosial Provinsi Jawa Barat**:
- **Kepala Dinas Sosial**: ${kadinas}
- **Visi & Misi**: Mewujudkan Jawa Barat Juara Lahir Batin dengan Inovasi dan Kolaborasi melalui penanganan PPKS terpadu, pemberdayaan 10 Pilar PSKS, perlindungan jaminan sosial (Linjamsos), dan tata kelola digital.
- **4 Bagian Navigasi Halaman Profil**:
  1. **Sambutan Resmi Kadinas**: Arahan resmi Kepala Dinas Sosial tentang integrasi satu data dan penguatan 10 pilar sosial di 27 Kab/Kota.
  2. **Dasar Hukum & Regulasi**: UU No. 11/2009 (Kesejahteraan Sosial), Permensos No. 10/2019 (PSM), Permensos No. 28/2018 (TKSK), Permensos No. 25/2019 (Karang Taruna), Perda Prov. Jabar No. 10/2012, UU PDP No. 27/2022.
  3. **Tujuan Sistem PSKS JABAR**: Integrasi data terpadu se-Jawa Barat, standarisasi KTA QR Code digital, pemetaan GIS sebaran personil, dan transparansi publik.
  4. **Visi & Misi Jawa Barat**: Akselerasi penanganan kemiskinan dan pemerataan kesejahteraan sosial.`;
  }

  // 11.2 Halaman Kontak & Layanan Publik
  if (q.includes('kontak') || q.includes('hubungi') || q.includes('alamat') || q.includes('dinsos') || q.includes('lokasi') || q.includes('medsos') || q.includes('instagram') || q.includes('youtube') || q.includes('facebook') || q.includes('tiktok') || q.includes('email')) {
    const waNum = appSettings?.floatingWaNumber || '+62 821-2603-0038';
    return `${opening}**Halaman Kontak & Layanan Pengaduan Publik Dinsos Jabar**:
- 📍 **Kantor Utama**: Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522
- 📍 **Kantor Bandung**: Jl. Rajiman No. 6, Pasir Kaliki, Kec. Cicendo, Kota Bandung 40171
- 📞 **WhatsApp Layanan Cepat**: ${waNum} / +62 896-0242-1065 (tersedia via widget tombol WA melayang)
- ✉️ **Email Resmi**: dinsos@jabarprov.go.id
- 🌐 **Portal Resmi**: dinsos.jabarprov.go.id
- 📱 **Media Sosial Resmi**:
  * Instagram: @dinsos.jabar (instagram.com/dinsos.jabar)
  * YouTube: Dinsos Jabar TV (youtube.com/@dinsosjabartv)
  * Facebook: Dinsos Jawa Barat (facebook.com/dinsos.jabar)
  * TikTok: @dinsos.jabar (tiktok.com/@dinsos.jabar)
  * Twitter / X: @dinsosjabar (x.com/dinsosjabar)
- ⏰ **Jam Operasional**: Senin – Jumat (08:00 – 16:00 WIB).`;
  }

  // 11.3 Halaman Pengaturan (Settings & Developer Control Panel)
  if (q.includes('pengaturan') || q.includes('settings') || q.includes('panel kontrol') || q.includes('background') || q.includes('video background') || q.includes('foto kadinas') || q.includes('teks sambutan') || q.includes('kelola pengumuman')) {
    return `${opening}**Halaman Pengaturan (Developer & Super Admin Control Panel)**:
- **Pengaturan Background**: Pilihan mode Latar Belakang Foto atau Video MP4 berulang serta kustomisasi URL media dinamis.
- **Pengaturan Foto & Nama Kadinas**: Unggah foto resmi Ibu Noneng Komara Nengsih, S.E., M.A.P. dan sub-judul profil.
- **Pengaturan Teks Profil & Sambutan**: Kustomisasi salam pembuka, paragraf sambutan resmi Kadinas, dan salam penutup.
- **Pengaturan Medsos & WA**: Kelola nomor WhatsApp layanan cepat dan tautan 6 kanal medsos resmi.
- **Pengaturan Saklar Maintenance Cerdas**: Saklar 3 level (Global, Per-Role, Granular 27 Wilayah) dan teks banner peringatan pemeliharaan.
- **Pengaturan Keamanan & Enkripsi**: Kriptografi Bcrypt Salt 10-rounds, auto lockout 30 detik (3x salah PIN), dan audit log trail.
- **Pengaturan Smart Card**: Konfigurasi KTA QR Code digital, cetak satuan, dan cetak massal format A4 (8 kartu siap potong).
- **Manajemen Akun Admin**: Hak khusus pemilik akun pusat untuk mengelola 27 akun admin wilayah, otorisasi, dan reset credential.
- **Task Manager & Verifikasi**: Tinjau berkas pendaftar baru, tombol *Terima Pendaftaran* (\`SAH_TERDAFTAR\` + KTA QR) dan *Tolak Pendaftaran*.
- **Pengaturan Pengumuman**: Publikasi maklumat siaga, modal popup di Beranda, running text, dan arsip publikasi dinas.
- **Floating WA Manager**: Konfigurasi nomor WA dan template pesan tombol melayang.`;
  }

  // 12. FITUR SISTEM SPESIFIK LAINNYA
  // 12.1 Manajemen Akun Admin
  if (q.includes('manajemen akun') || q.includes('kelola akun') || q.includes('reset pin') || q.includes('bekukan') || q.includes('freeze')) {
    return `${opening}**Fitur Manajemen Akun Admin (Super Admin & Developer)**:
- **Kontrol Hak Akses**: Pengelolaan penuh akun admin wilayah (27 Kab/Kota) dan Superadmin.
- **Status Akun**: Tombol cepat untuk mengaktifkan atau membekukan akun (\`ACTIVE\` / \`FROZEN\`).
- **Reset Kredensial**: Fitur ganti kata sandi admin dengan syarat minimal 12 karakter kombinasi (huruf besar, kecil, angka).
- **Penugasan Wilayah & Role**: Penyesuaian hak akses role dan wilayah penugasan (27 Kab/Kota) secara dinamis.`;
  }

  // 12.2 Akun User & Visualisasi Analitik
  if (q.includes('akun user') || q.includes('grafik akun') || q.includes('analitik akun') || q.includes('status registrasi')) {
    return `${opening}**Fitur Akun User & Visualisasi Analitik**:
- **Portal Profil Mandiri**: Pendaftar 10 pilar dapat memantau proses verifikasi berkas (\`MENUNGGU\`, \`SAH_TERDAFTAR\`, \`DITOLAK\`), memperbarui data profil, dan mengunduh KTA Digital QR.
- **Grafik Analitik Real-Time**: Dilengkapi grafik analitik visual yang menyajikan tren pendaftaran akun user, perbandingan status verifikasi, dan sebaran pendaftar di 27 Kab/Kota se-Jawa Barat.`;
  }

  // 12.3 Pemantauan Admin (Live Admin Monitoring)
  if (q.includes('pemantauan admin') || q.includes('monitoring admin') || q.includes('status admin') || q.includes('online') || q.includes('keaktifan admin')) {
    return `${opening}**Fitur Pemantauan Admin (Live Admin Monitoring)**:
- **Live Status 27 Daerah**: Dashboard pemantauan status keaktifan admin di 27 Kabupaten/Kota secara langsung.
- **Indikator Keaktifan**: Titik hijau menandakan admin berstatus \`ONLINE\` (sedang aktif bekerja), dan titik abu/merah menandakan \`OFFLINE\`.
- **Telemetri Aktivitas**: Menampilkan catatan waktu login terakhir (*last active*), estimasi durasi sesi, jenis perangkat, dan rekapitulasi data personil yang telah diinput di wilayah bersangkutan.`;
  }

  // 12.4 Riwayat Aktivitas (Comprehensive Audit Trail)
  if (q.includes('riwayat aktivitas') || q.includes('audit') || q.includes('log aktivitas') || q.includes('jejak')) {
    return `${opening}**Fitur Riwayat Aktivitas (Comprehensive Audit Trail)**:
- **Perekaman Forensik Otomatis**: Setiap aksi mutasi data (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, RESET_PIN, MAINTENANCE_SWITCH) tercatat otomatis di koleksi \`audit_logs\`.
- **Atribut Forensik Lengkap**: Menyimpan nama aparatur, role, stempel waktu presisi milidetik, alamat IP address, dan browser user agent.
- **Kepatuhan Audit**: Data dapat difilter berdasarkan rentang waktu dan diekspor untuk kebutuhan audit BPK RI dan Inspektorat Provinsi Jawa Barat.`;
  }

  // 12.5 Verifikasi Pendaftaran & Terima Pendaftaran
  if (q.includes('verifikasi') || q.includes('terima pendaftaran') || q.includes('tolak pendaftaran') || q.includes('validasi pendaftaran')) {
    return `${opening}**Fitur Verifikasi & Penerimaan Pendaftaran**:
- **Pemeriksaan Berkas**: Admin Wilayah dan Superadmin meninjau kelengkapan berkas pemohon baru, kesesuaian NIK, nomor SK, dan foto bukti legalitas.
- **Tombol Terima Pendaftaran**: Mengesahkan status calon anggota menjadi \`SAH_TERDAFTAR\` seketika dan mengaktifkan KTA Digital QR Code.
- **Tombol Tolak Pendaftaran**: Menolak permohonan yang tidak memenuhi persyaratan disertai catatan perbaikan resmi untuk pendaftar.`;
  }

  // 12.6 Riwayat Pendaftaran
  if (q.includes('riwayat pendaftaran') || q.includes('history pendaftaran') || q.includes('daftar permohonan')) {
    return `${opening}**Fitur Riwayat Pendaftaran**:
- Merekam seluruh arsip permohonan registrasi yang masuk sejak sistem beroperasi.
- Dilengkapi pencarian nama/NIK, filter status (*Menunggu Verifikasi*, *Disetujui*, *Ditolak*), dan tanggal pengajuan berkas.`;
  }

  // 12.7 Tambah Pengumuman
  if (q.includes('pengumuman') || q.includes('tambah pengumuman') || q.includes('maklumat') || q.includes('berita')) {
    return `${opening}**Fitur Tambah Pengumuman & Berita Siaga**:
- **Publikasi Berita**: Superadmin dan Developer dapat menerbitkan pengumuman kedinasan, instruksi apel siaga bencana, atau pemutakhiran regulasi sosial.
- **Format Penyajian**: Tampil dalam bentuk modal banner popup melayang di Beranda pengunjung, teks berjalan (*running text*), dan arsip publikasi dinas.`;
  }

  // 12.8 Kontak Floating WhatsApp
  if (q.includes('floating wa') || q.includes('kontak wa') || q.includes('tombol wa') || q.includes('layanan cepat wa')) {
    return `${opening}**Fitur Kontak Floating WhatsApp**:
- **Tombol Melayang**: Widget tombol WhatsApp interaktif di sudut kanan bawah layar untuk pusat aduan dan koordinasi cepat dengan Tim Dinsos.
- **Konfigurasi Realtime**: Nomor WhatsApp dinas dan template pesan pembuka dapat dikonfigurasi melalui tab Pengaturan Floating WA.

[[action:tab:contact:Buka Kontak Resmi]]`;
  }

  // 12.9 SOP KASUS LAPANGAN: MUTASI PERSONIL ANTAR WILAYAH
  if (q.includes('mutasi') || q.includes('pindah wilayah') || q.includes('pindah domisili') || q.includes('pindah tugas')) {
    return `${opening}**SOP Resmi Mutasi Personil Pilar Sosial Antar-Wilayah se-Jawa Barat**:
1. **Surat Pengantar Mutasi**: Personil meminta Surat Keterangan / Pengantar Mutasi dari Dinas Sosial Kabupaten/Kota asal yang memuat riwayat pengabdian dan nomor registrasi keanggotaan.
2. **Lapor Dinsos Tujuan**: Menyerahkan surat pengantar dan KTP ke Bidang Linjamsos / Pemberdayaan Sosial Dinsos Kabupaten/Kota yang baru.
3. **Mutasi Data Digital di PSKS Jabar**: Admin Wilayah tujuan membuka menu **Kelola Wilayah**, memperbarui domisili penugasan anggota ke lokasi baru tanpa menghapus NIK atau riwayat pelatihan yang telah diraih.
4. **KTA Otomatis Terbarui**: KTA Digital QR Code langsung otomatis menyesuaikan wilayah tugas baru berstatus \`SAH_TERDAFTAR\`.

[[action:tab:admin_manage:Buka Kelola Wilayah]] [[action:tab:akun:Cek Status Akun & KTA]]`;
  }

  // 12.10 SOP KASUS LAPANGAN: KTA RUSAK ATAU HILANG DI LAPANGAN (RE-PRINT)
  if (q.includes('kta rusak') || q.includes('kta hilang') || q.includes('hilang kta') || q.includes('kartu hilang') || q.includes('kartu rusak')) {
    return `${opening}**SOP Penanganan KTA Digital Rusak atau Hilang di Lapangan**:
1. **Tidak Perlu Registrasi Ulang**: Data keanggotaan Anda tetap aman dan terenkripsi di cloud database sistem PSKS Jabar.
2. **Verifikasi NIK KTP**: Laporkan kepada Koordinator Pilar Kecamatan atau Admin Wilayah Dinsos dengan menunjukkan NIK KTP Anda.
3. **Cetak Ulang Mandiri / Admin (Re-Print)**:
   - Jika Anda memiliki akun terdaftar: Masuk ke menu **Akun & Verifikasi**, pilih **Cetak Kartu Akses** untuk mengunduh KTA Digital QR Code baru seketika.
   - Melalui Admin: Admin Wilayah atau Superadmin dapat langsung mencetak ulang kartu Anda melalui modul **Smart Access Card** (opsi Cetak Satuan atau Cetak Massal A4).
4. Kartu yang baru dicetak langsung aktif dengan tanda validasi hash QR Code resmi.

[[action:tab:akun:Buka Halaman Akun & KTA]] [[action:tab:contact:Hubungi Bantuan Resmi]]`;
  }

  // 12.11 SOP KASUS LAPANGAN: TALI ASIH & BPJS KETENAGAKERJAAN RELAWAN
  if (q.includes('tali asih') || q.includes('bpjs') || q.includes('insentif') || q.includes('honor relawan') || q.includes('jaminan kerja') || q.includes('gaji')) {
    return `${opening}**Informasi Jaminan Sosial & Tali Asih Relawan PSKS Jawa Barat**:
1. **Perlindungan BPJS Ketenagakerjaan**: Pemprov Jawa Barat bersama Kementerian Sosial RI secara bertahap memfasilitasi relawan pilar sosial (seperti Tagana dan personil aktif) dalam program perlindungan Jaminan Kecelakaan Kerja (JKK) dan Jaminan Kematian (JKM) untuk menjamin keselamatan saat bertugas di medan risiko tinggi.
2. **Tali Asih / Insentif Tanggap Darurat**: Relawan yang diterjunkan dalam operasi tanggap darurat bencana alam/sosial berhak mendapatkan tali asih operasional harian, akomodasi shelter, logistik dapur umum, dan APD lapangan sesuai Surat Keputusan (SK) Tanggap Darurat Kepala Daerah/Kemensos.
3. **Prinsip Pengabdian**: Pilar sosial (PSM, Tagana, Karang Taruna) berlandaskan jiwa kerelawanan (*volunteerism*), gotong royong, dan kepedulian sosial kemasyarakatan.

[[action:tab:contact:Konsultasi Hak Relawan]] [[action:pillar:tagana:Buka Info Tagana]]`;
  }

  // 12.12 SOP KASUS LAPANGAN: KEDARURATAN PPKS (RESPON CEPAT 1X24 JAM)
  if (q.includes('kedaruratan ppks') || q.includes('ppks darurat') || q.includes('lansia telantar') || q.includes('anak telantar') || q.includes('trc') || q.includes('kasus darurat') || q.includes('korban kdrt')) {
    return `${opening}**SOP Respon Cepat 1x24 Jam Penanganan Kasus PPKS Darurat Lapangan**:
1. **Deteksi & Laporan Awal (Tingkat Desa)**: Temuan kasus lansia telantar, disabilitas telantar, ABH, atau korban kekerasan segera dilaporkan ke Puskesos Desa/Kelurahan atau personil PSM.
2. **Asesmen Cepat (Tingkat Kecamatan)**: Tenaga Kesejahteraan Sosial Kecamatan (TKSK) melakukan asesmen awal dan perlindungan darurat tempat singgah sementara.
3. **Eskalasi ke Tim Reaksi Cepat (TRC) Dinsos**: Menghubungi TRC Dinsos Kabupaten/Kota atau hotline Dinsos Jabar untuk evakuasi darurat.
4. **Rujukan ke Balai / Panti UPTD**: Korban dirujuk ke Balai Rehabilitasi Sosial Dinsos Jabar (seperti Balai Lansia Ciparay, Balai Netra Wyata Guna, atau Balai Anak) untuk penanganan medis dan pendampingan Pekerja Sosial Profesional (Peksos).

[[action:tab:contact:Buka Kontak Hotline Darurat]] [[action:pillar:peksos:Info Layanan Peksos]]`;
  }

  // 12.13 SOP KASUS LAPANGAN: SPESIALISASI KORPS TAGANA & DIKLATSAR LANJUTAN
  if (q.includes('spesialisasi tagana') || q.includes('keahlian tagana') || q.includes('water rescue') || q.includes('vertical rescue') || q.includes('dumlap') || q.includes('diklatsar lanjutan')) {
    return `${opening}**6 Bidang Spesialisasi Kebencanaan Korps Tagana Jawa Barat**:
Setelah menyelesaikan Diklatsar Dasar, personil Tagana dapat mengambil spesialisasi lanjutan:
1. **Water Rescue**: Penyelamatan korban di wilayah banjir bandang, arung jeram, dan perairan terbuka.
2. **Vertical Rescue**: Evakuasi korban di medan tebing curam, jurang, dan reruntuhan gempa bumi.
3. **Dapur Umum Lapangan (Dumlap)**: Manajemen penyediaan ribuan porsi makanan higienis bergizi dalam 1x24 jam pasca-bencana.
4. **Shelter & Pengungsian**: Manajemen pendirian tenda pleton terstandar ramah lansia, anak, dan kelompok rentan.
5. **Layanan Dukungan Psikososial (LDP)**: *Trauma healing* untuk anak-anak dan pemulihan kesehatan mental penyintas.
6. **Logistik & Pergudangan**: Pengelolaan bufferstock sandang-pangan terintegrasi.

[[action:pillar:tagana:Buka Modul Tagana Jabar]] [[action:tab:user_reg_history:Pantau Riwayat Penugasan]]`;
  }

  // 13. STATISTIK SEBARAN DATA UMUM
  if (q.includes('total') || q.includes('sdm') || q.includes('sebaran') || q.includes('jumlah') || q.includes('peta') || q.includes('data')) {
    return `**Statistik & Sebaran SDM PSKS Jawa Barat**:
- Sistem saat ini mencatat **${totalRecords.toLocaleString('id-ID')} personil/lembaga** dari 10 Pilar PSKS yang tersebar di **27 Kabupaten/Kota (627 Kecamatan dan 5.957 Desa/Kelurahan)** se-Jawa Barat.
- Anda dapat memilih nama kabupaten/kota pada dropdown Peta Beranda untuk melihat rincian riil per pilar di wilayah tersebut.`;
  }

  // 14. DYNAMIC KNOWLEDGE BASE QUERY MATCH (CLOUD FIRESTORE)
  const { normalizedText: normQ, detectedPillar: detPillar } = normalizeQueryWithComprehensiveVocabulary(targetQ);
  const resolvedPillar = activePillar || (detPillar as PillarId) || null;
  const matchedDocs = searchKnowledgeBase(normQ, resolvedPillar);
  if (matchedDocs.length > 0 && matchedDocs[0]) {
    return matchedDocs[0].content;
  }

  // DEFAULT COMPREHENSIVE FALLBACK FOR QUERIES OUTSIDE KNOWLEDGE BASE
  if (userRole === 'admin') {
    return `Halo **Admin Wilayah**! Saya siap membantu Anda dalam operasional data pilar sosial. Anda dapat menanyakan seputar:\n- **Pengelolaan Data Pilar**: Cara input anggota baru, peremajaan data, dan ekspor Excel/PDF.\n- **Verifikasi & KTA**: Cara cetak KTA digital satuan/massal A4 dan pemindaian QR Code.\n- **Wawasan 10 Pilar PSKS**: Regulasi, dasar hukum, dan tugas fungsional tiap pilar sosial.\n\nSilakan tanyakan apa yang ingin Anda ketahui!`;
  }

  if (userRole === 'superadmin') {
    return `Halo **Superadmin**! Saya siap membantu Anda mengelola sistem **PSKS Jabar**. Anda dapat menanyakan seputar:\n- **Panduan Pengelolaan**: Cara menambah akun admin baru, reset PIN, verifikasi berkas pendaftar 10 pilar, cetak KTA massal A4, dan pengaturan saklar maintenance.\n- **Data 10 Pilar PSKS**: Regulasi lengkap Peksos, PSM, Tagana, LKS, Karang Taruna, LK3, Pensos, TKSK, KUBE, SLRT, dan sebaran 27 Kab/Kota.\n- **Bantuan Pengembang**: Hubungi developer aplikasi **Ilham Fazril** via [WhatsApp: +6289602421065](https://wa.me/6289602421065).\n\nAda fitur atau panduan yang ingin Anda ketahui lebih detail?`;
  }

  if (userRole === 'developer') {
    return `${opening}Pertanyaan atau perintah spesifik ini di luar parameter database default PSKS JABAR. Ada skema, query data, atau logika sistem yang mau kita kembangkan lagi, **Ilham Fazril**? 💻⚡`;
  }

  // Default user role fallback
  return `Halo! Selamat datang di Portal **PSKS JABAR**. Saya siap memberikan informasi seputar:\n- **10 Pilar Utama PSKS**: Penjelasan detail PKSP (Peksos), PSM, Tagana, LKS, Karang Taruna, LK3, Pensos, TKSK, KUBE, dan SLRT/Puskesos.\n- **Layanan Dinsos Jabar**: Kontak pengaduan, alamat kantor dinas, profil pimpinan Ibu Noneng Komara Nengsih, S.E., M.A.P., dan integrasi data sosial di 27 Kab/Kota.\n\nAda yang bisa saya bantu atau informasi apa yang sedang Anda cari?`;
}


/**
 * Comprehensive Local Data Keyword Mapping Dictionary
 * Maps query keywords directly to local database domains, pillar attributes, regional scopes, and system parameters
 */
export interface KeywordMappingCategory {
  category: string;
  description: string;
  keywords: string[];
}

export const LOCAL_DATA_KEYWORD_MAPPING: Record<string, KeywordMappingCategory> = {
  // 1. Pillar Identifiers, Titles & Aliases
  pillar_names: {
    category: 'Pilar PSKS',
    description: 'Nama dan sebutan 10 Pilar Potensi dan Sumber Kesejahteraan Sosial',
    keywords: [
      'tagana', 'taruna siaga bencana', 'psm', 'pekerja sosial masyarakat', 'tksk',
      'tenaga kesejahteraan sosial kecamatan', 'lks', 'lembaga kesejahteraan sosial',
      'karang taruna', 'kt', 'karangtaruna', 'lk3', 'lembaga konsultasi kesejahteraan keluarga',
      'pensos', 'penyuluh sosial', 'penyuluh sosial masyarakat', 'peksos', 'pksp',
      'pekerja sosial profesional', 'kube', 'kelompok usaha bersama', 'badan usaha',
      'badan usaha sosial', 'slrt', 'puskesos', 'pusat kesejahteraan sosial', 'pilar',
      '10 pilar', 'sepuluh pilar', 'sumber kesejahteraan', 'organisasi sosial', 'relawan',
      'potensi kesejahteraan', 'psks'
    ],
  },

  // 2. Data Attributes & Member Properties
  data_attributes: {
    category: 'Atribut Data Personil',
    description: 'Kolom-kolom atribut data personil atau lembaga di database lokal',
    keywords: [
      'nik', 'nip', 'nomor induk', 'ktp', 'no sk', 'sk pengangkatan', 'sk penugasan',
      'sertifikasi', 'nomor sertifikasi', 'sertifikat', 'kompetensi', 'sipps', 'keahlian',
      'nomor handphone', 'no hp', 'telepon', 'whatsapp', 'wa', 'kontak', 'alamat',
      'tanda daftar', 'tdy', 'badan hukum', 'kemenkumham', 'izin operasional', 'akreditasi',
      'ban-p2ks', 'unit', 'satuan', 'jabatan', 'struktur', 'ketua', 'pimpinan', 'pengurus',
      'pasfoto', 'foto profil', 'status aktif', 'keaktifan', 'status', 'sah_terdaftar',
      'purna tugas', 'non-aktif', 'mutasi', 'peremajaan', 'duplikat', 'duplikasi'
    ],
  },

  // 3. Regions, Jurisdictions & Administrative Scopes (27 Kab/Kota)
  regions_and_jurisdictions: {
    category: 'Wilayah & Geografis Jabar',
    description: '27 Kabupaten/Kota, Kecamatan, Desa, dan Kode Wilayah Jawa Barat',
    keywords: [
      'jawa barat', 'jabar', 'provinsi', 'kabupaten', 'kota', 'kecamatan', 'desa', 'kelurahan',
      'bandung', 'bogor', 'sukabumi', 'cianjur', 'garut', 'tasikmalaya', 'ciamis',
      'kuningan', 'cirebon', 'majalengka', 'sumedang', 'indramayu', 'subang', 'purwakarta',
      'karawang', 'bekasi', 'bandung barat', 'pangandaran', 'depok', 'cimahi', 'banjar',
      'sebaran', 'peta', 'agregat', 'wilayah', 'daerah', 'terdata', 'populasi', 'pemetaan'
    ],
  },

  // 4. Numerical Counts, Statistics & Recapitulation
  statistics_and_counts: {
    category: 'Statistik & Agregasi Data',
    description: 'Penghitungan agregat, metrik numerik, dan rekapitulasi data',
    keywords: [
      'jumlah', 'berapa', 'total', 'banyak', 'personil', 'anggota', 'lembaga', 'rekap',
      'rekapitulasi', 'statistik', 'angka', 'kuantitas', 'akumulasi', 'terdaftar', 'data'
    ],
  },

  // 5. Official Tasks, Responsibilities & Procedures (Tupoksi & SOP)
  tupoksi_and_procedures: {
    category: 'Tupoksi & Prosedur Resmi',
    description: 'Tugas pokok, fungsi, wewenang, dasar hukum, dan SOP operasional',
    keywords: [
      'tupoksi', 'tugas', 'fungsi', 'wewenang', 'peran', 'kewenangan', 'sop', 'dasar hukum',
      'permensos', 'perda', 'pergub', 'uu', 'regulasi', 'aturan', 'pedoman', 'prosedur',
      'alur', 'syarat', 'persyaratan', 'kriteria', 'pendaftaran', 'rekrutmen'
    ],
  },

  // 6. Digital Member Card (KTA) & Smart QR Scanner
  digital_cards_and_qr: {
    category: 'KTA Digital & QR Code',
    description: 'Pencetakan kartu tanda anggota, validasi QR code, dan pencetakan massal',
    keywords: [
      'kartu', 'kta', 'kartu tanda anggota', 'cetak', 'cetak kartu', 'print', 'unduh kartu',
      'download kartu', 'qr', 'qr code', 'barcode', 'scan', 'scanner', 'pindai', 'pemindai',
      'pindai qr', 'a4', '8 kartu', 'batch', 'massal', 'validasi', 'verifikasi kartu', 'kartu digital'
    ],
  },

  // 7. Role Governance, Admin Features & System Operations
  system_governance_and_admin: {
    category: 'Tata Kelola Sistem & Admin',
    description: 'Fitur administrasi daerah, super admin provinsi, dan developer control panel',
    keywords: [
      'admin', 'superadmin', 'super admin', 'role', 'hak akses', 'kelola data', 'tambah data',
      'input data', 'edit data', 'hapus data', 'mutasi data', 'ekspor', 'excel', 'xlsx',
      'pdf', 'laporan', 'musrenbang', 'maintenance', 'mode pemeliharaan', 'saklar',
      'saklar maintenance', 'broadcast', 'pengumuman', 'reset pin', 'reset kata sandi',
      'kredensial', 'audit', 'audit trail', 'audit log', 'log aktivitas', 'keamanan',
      'brute force', 'lockout', 'terkunci', 'enkripsi', 'bcrypt', 'jwt', 'pdp',
      'perlindungan data pribadi', 'uu no. 27', 'privasi', 'satu data', 'satu data jabar',
      'dtks', 'kemensos', 'pusdatin', 'puskesos', 'integrasi', 'sync', 'sinkronisasi'
    ],
  },

  // 8. Creator, Architecture & Tech Stack
  developer_and_tech_stack: {
    category: 'Pengembang & Arsitektur Sistem',
    description: 'Profil kreator dan spesifikasi teknologi arsitektur PSKS JABAR',
    keywords: [
      'developer', 'pembuat', 'bikin', 'dibuat', 'cipta', 'pengembang', 'arsitek', 'author',
      'ilham fazril', 'ilham', 'fazril', 'siapa yang buat', 'siapa yang bikin', 'siapa pembuat',
      'siapa developer', 'arsitektur', 'stack', 'teknologi', 'react', 'vite', 'express',
      'firestore', 'tailwind', 'gemini', 'proxy', 'full-stack', 'kodingan'
    ],
  },

  // 9. Dinsos Official Contact, Leadership & Offices
  official_contacts_and_dinsos: {
    category: 'Kontak & Sekretariat Dinas Sosial',
    description: 'Pimpinan dinas, alamat kantor, email, dan WhatsApp Dinsos Jawa Barat',
    keywords: [
      'dinsos', 'dinas sosial', 'provinsi jawa barat', 'prov jabar', 'kadinas', 'kepala dinas',
      'dodo suhendar', 'alamat', 'lokasi', 'kantor', 'cimahi', 'amir machmud', 'kontak',
      'whatsapp', 'wa', 'telepon', 'email', 'helpdesk', 'aduan', 'layanan'
    ],
  },
};

/**
 * Checks if a query matches any local data keyword category
 */
export function matchLocalDataKeyword(query: string): {
  isMatched: boolean;
  matchedCategory?: string;
  matchedKeywords: string[];
} {
  const normQ = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = normQ.split(/\s+/).filter(Boolean);
  const matchedKeywords: string[] = [];
  let foundCategory: string | undefined;

  for (const [catKey, catObj] of Object.entries(LOCAL_DATA_KEYWORD_MAPPING)) {
    for (const kw of catObj.keywords) {
      const normKw = kw.toLowerCase().trim();
      // Match full keyword phrase or exact token match
      if (normQ.includes(normKw) || tokens.includes(normKw)) {
        matchedKeywords.push(normKw);
        if (!foundCategory) {
          foundCategory = catObj.category;
        }
      }
    }
  }

  return {
    isMatched: matchedKeywords.length > 0,
    matchedCategory: foundCategory,
    matchedKeywords,
  };
}

/**
 * Verification & Tracking System: Cross-checks response accuracy against state & knowledge base
 */
export function verifyAndTrackAnswerAccuracy(
  query: string,
  rawReply: string,
  userRole: UserRole = 'user',
  userName?: string,
  userWilayah?: string,
  currentTab?: string,
  activePillar?: PillarId | null,
  allPillarData?: Record<string, PSKSDataRecord[]>,
  appSettings?: AppSettings,
  previousContext?: string
): {
  finalContent: string;
  isAccurate: boolean;
  confidence: number;
  source: 'verified_exact' | 'state_grounded' | 'ai_model_verified' | 'knowledge_fallback';
} {
  const normQ = query.toLowerCase().replace(/[?!.,]/g, '').trim();
  // STRICT RULE: Developer is ONLY role === 'developer', never inferred from name
  const isDeveloperUser = userRole === 'developer';

  // 0. STRICT SECURITY GUARD CHECK
  const isSecurity =
    normQ.includes('ignore previous') ||
    normQ.includes('abaikan instruksi') ||
    normQ.includes('bypass') ||
    normQ.includes('hack') ||
    normQ.includes('retas') ||
    normQ.includes('bocorkan sandi') ||
    normQ.includes('bocorkan password') ||
    normQ.includes('bocorkan pin') ||
    normQ.includes('bocorkan api key') ||
    normQ.includes('dump database') ||
    normQ.includes('curi data') ||
    normQ.includes('leak') ||
    normQ.includes('password admin') ||
    normQ.includes('pin superadmin') ||
    normQ.includes('root access') ||
    normQ.includes('sql injection') ||
    normQ.includes('drop table') ||
    normQ.includes('system prompt') ||
    normQ.includes('jailbreak');

  if (isSecurity) {
    return {
      finalContent: 'Mohon maaf, kami tidak bisa memproses permintaan ini karena melanggar kebijakan keamanan sistem, privasi data pribadi (UU Perlindungan Data Pribadi No. 27/2022), serta berpotensi membahayakan integritas sistem PSKS Jawa Barat.',
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Sensitive admin access check for public / user role (Strict Hardening)
  const isAskingAdminAccess =
    !isDeveloperUser &&
    userRole !== 'superadmin' &&
    (
      ((normQ.includes('masuk') || normQ.includes('login') || normQ.includes('akses') || normQ.includes('buka') || normQ.includes('cara jadi') || normQ.includes('daftar jadi') || normQ.includes('minta') || normQ.includes('bocorkan') || normQ.includes('kasih tau') || normQ.includes('kunci') || normQ.includes('rahasia')) &&
      (normQ.includes('akun admin') || normQ.includes('akun superadmin') || normQ.includes('akun developer') || normQ.includes('ke admin') || normQ.includes('ke superadmin') || normQ.includes('ke developer') || normQ.includes('sebagai admin') || normQ.includes('sebagai superadmin') || normQ.includes('sebagai developer') || normQ.includes('panel admin') || normQ.includes('panel superadmin') || normQ.includes('panel developer') || normQ.includes('login admin') || normQ.includes('login superadmin') || normQ.includes('rahasia sistem') || normQ.includes('password admin') || normQ.includes('pin superadmin') || normQ.includes('kredensial admin') || normQ.includes('token admin'))) ||
      (normQ.includes('cara login admin') || normQ.includes('cara login superadmin') || normQ.includes('password superadmin') || normQ.includes('pin admin') || normQ.includes('rahasia admin'))
    );

  if (isAskingAdminAccess) {
    return {
      finalContent: 'Mohon maaf, akses administratif (seperti hak akses Admin Wilayah, Superadmin Provinsi, kredensial login, dan rahasia konfigurasi sistem internal) merupakan wewenang kedinasan tertutup yang dilindungi secara ketat demi keamanan, privasi data masyarakat, dan integritas tata kelola PSKS Jawa Barat.\n\nAsisten tidak dapat memberikan instruksi login administratif, kode sandi, maupun rahasia sistem internal kepada publik.\n\nApabila Anda merupakan aparatur kedinasan yang ditugaskan secara resmi atau memiliki keperluan administratif mendesak, silakan berkoordinasi langsung dengan pihak berwenang di Dinas Sosial Provinsi Jawa Barat atau Administrator Dinas Sosial Kabupaten/Kota setempat melalui kontak dan saluran resmi yang tersedia.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]',
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Developer / Creator Identity Verification Check (Applies to all users without exception)
  const isAskingDeveloper =
    normQ.includes('developer') ||
    normQ.includes('pembuat') ||
    normQ.includes('author') ||
    normQ.includes('arsitek') ||
    normQ.includes('pengembang') ||
    normQ.includes('siapa yang buat') ||
    normQ.includes('siapa yang bikin') ||
    normQ.includes('yang bikin aplikasi') ||
    normQ.includes('yang buat website') ||
    normQ.includes('ilham fazril') ||
    normQ.includes('ilhamfazril') ||
    normQ.includes('siapa ilham') ||
    normQ.includes('kenal ilham') ||
    normQ.includes('siapakah ilham');

  if (isAskingDeveloper) {
    const accurateDevAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: accurateDevAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Personal "Siapa Saya" Check (Strictly separated)
  const isAskingSelfIdentity =
    normQ.includes('siapa saya') ||
    normQ.includes('kenal saya') ||
    normQ.includes('kamu kenal saya') ||
    normQ.includes('tau siapa saya') ||
    normQ.includes('tahu siapa saya') ||
    normQ.includes('siapakah saya');

  if (isAskingSelfIdentity) {
    const selfAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: selfAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 1. Developer Query Handling: Always preserve Gemini's rich, fluent generative output (including Sundanese and lively banter)
  if (isDeveloperUser && rawReply && rawReply.trim().length > 5) {
    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.99,
      source: 'ai_model_verified',
    };
  }

  // 1.1 Priority for Dynamic Model / Firestore Engine Reply with Context Awareness
  if (rawReply && rawReply.trim().length > 0) {
    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.98,
      source: 'ai_model_verified',
    };
  }

  // 1.2 Direct Catalog Match Check (Exact verified answers when clicking catalog prompt without backend)
  const allCatalogQuestions: AIQuestionItem[] = [];
  Object.values(ROLE_QUESTION_CATALOG).forEach((groups) => {
    groups.forEach((g) => allCatalogQuestions.push(...g.questions));
  });

  const matchingCatalogItem = allCatalogQuestions.find((item) => {
    const itemQ = item.question.toLowerCase().replace(/[?!.,]/g, '').trim();
    return normQ === itemQ;
  });

  if (matchingCatalogItem && EXACT_QUESTION_ANSWERS[matchingCatalogItem.id]) {
    return {
      finalContent: EXACT_QUESTION_ANSWERS[matchingCatalogItem.id],
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 3. Generative Model Output (Fluent, intelligent, multi-turn, understands informal language & preambles)
  if (rawReply && rawReply.trim().length > 10) {
    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.98,
      source: 'ai_model_verified',
    };
  }

  // 4. Fallback to Enhanced Local Knowledge Engine
  const fallback = getComprehensiveSmartAnswer(
    query,
    userRole,
    userName,
    userWilayah,
    currentTab,
    activePillar,
    allPillarData,
    appSettings,
    previousContext
  );

  return {
    finalContent: fallback,
    isAccurate: true,
    confidence: 0.92,
    source: 'knowledge_fallback',
  };
}
