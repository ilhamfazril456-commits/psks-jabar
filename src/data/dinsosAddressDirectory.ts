import { KAB_KOTA_ONLY } from './initialData';

export interface DinsosOfficeAddress {
  id: string;
  kabKota: string;
  isProvinsi?: boolean;
  aliases: string[];
  namaDinas: string;
  alamat: string;
  telepon?: string;
  email?: string;
}

export interface DinsosAddressQueryResult {
  isAddressQuery: boolean;
  matchedOffice?: DinsosOfficeAddress;
  matchedOffices?: DinsosOfficeAddress[];
  isSpecificRegion: boolean;
  needsClarification: boolean;
  isFallback?: boolean;
  suggestedRegion?: string;
  replyText: string;
}

export const DINSOS_ADDRESS_DIRECTORY: DinsosOfficeAddress[] = [
  // PROVINSI JAWA BARAT
  {
    id: 'provinsi_jabar',
    kabKota: 'Provinsi Jawa Barat',
    isProvinsi: true,
    aliases: ['provinsi', 'jabar', 'prov jabar', 'provinsi jawa barat', 'kantor utama', 'kantor pusat'],
    namaDinas: 'Dinas Sosial Provinsi Jawa Barat (Kantor Pusat)',
    alamat: 'Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522',
    telepon: '(022) 6641564 / Hotline WA: +62 821-2603-0038',
    email: 'dinsos@jabarprov.go.id',
  },

  // 27 KABUPATEN / KOTA SE-JAWA BARAT
  {
    id: 'kab_bandung',
    kabKota: 'Kabupaten Bandung',
    aliases: ['kabupaten bandung', 'kab bandung', 'soreang', 'dinsos kab bandung'],
    namaDinas: 'Dinas Sosial Kabupaten Bandung',
    alamat: 'Jl. Raya Soreang Km. 17, Pamekaran, Kec. Soreang, Kabupaten Bandung, Jawa Barat 40911',
    telepon: '(022) 5891159',
  },
  {
    id: 'kab_bandung_barat',
    kabKota: 'Kabupaten Bandung Barat',
    aliases: ['kabupaten bandung barat', 'kab bandung barat', 'kbb', 'ngamprah', 'padalarang', 'dinsos kbb'],
    namaDinas: 'Dinas Sosial Kabupaten Bandung Barat',
    alamat: 'Kompleks Perkantoran Pemkab Bandung Barat, Gedung D, Jl. Raya Padalarang - Cisarua Km. 2, Mekarsari, Kec. Ngamprah, Kabupaten Bandung Barat 40552',
    telepon: '(022) 82783015',
  },
  {
    id: 'kab_bekasi',
    kabKota: 'Kabupaten Bekasi',
    aliases: ['kabupaten bekasi', 'kab bekasi', 'cikarang', 'dinsos kab bekasi'],
    namaDinas: 'Dinas Sosial Kabupaten Bekasi',
    alamat: 'Kompleks Perkantoran Pemkab Bekasi, Blok B1 Lt. 2, Desa Sukamahi, Kec. Cikarang Pusat, Kabupaten Bekasi, Jawa Barat 17530',
    telepon: '(021) 89970135',
  },
  {
    id: 'kab_bogor',
    kabKota: 'Kabupaten Bogor',
    aliases: ['kabupaten bogor', 'kab bogor', 'cibinong', 'dinsos kab bogor'],
    namaDinas: 'Dinas Sosial Kabupaten Bogor',
    alamat: 'Jl. Bersih No. 1, Komplek Perkantoran Pemda Cibinong, Tengah, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16914',
    telepon: '(021) 8753177',
  },
  {
    id: 'kab_ciamis',
    kabKota: 'Kabupaten Ciamis',
    aliases: ['kabupaten ciamis', 'kab ciamis', 'ciamis', 'dinsos ciamis'],
    namaDinas: 'Dinas Sosial Kabupaten Ciamis',
    alamat: 'Jl. Tentara Pelajar No. 16, Ciamis, Kec. Ciamis, Kabupaten Ciamis, Jawa Barat 46211',
    telepon: '(0265) 771038',
  },
  {
    id: 'kab_cianjur',
    kabKota: 'Kabupaten Cianjur',
    aliases: ['kabupaten cianjur', 'kab cianjur', 'cianjur', 'dinsos cianjur'],
    namaDinas: 'Dinas Sosial Kabupaten Cianjur',
    alamat: 'Jl. Raya Bandung Km. 3, Bojong, Kec. Karangtengah, Kabupaten Cianjur, Jawa Barat 43281',
    telepon: '(0263) 261453',
  },
  {
    id: 'kab_cirebon',
    kabKota: 'Kabupaten Cirebon',
    aliases: ['kabupaten cirebon', 'kab cirebon', 'sumber cirebon', 'dinsos kab cirebon'],
    namaDinas: 'Dinas Sosial Kabupaten Cirebon',
    alamat: 'Jl. Sunan Drajat No. 11, Sumber, Kec. Sumber, Kabupaten Cirebon, Jawa Barat 45611',
    telepon: '(0231) 321151',
  },
  {
    id: 'kab_garut',
    kabKota: 'Kabupaten Garut',
    aliases: ['kabupaten garut', 'kab garut', 'garut', 'dinsos garut'],
    namaDinas: 'Dinas Sosial Kabupaten Garut',
    alamat: 'Jl. Patriot No. 14, Kel. Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151',
    telepon: '(0262) 233157',
  },
  {
    id: 'kab_indramayu',
    kabKota: 'Kabupaten Indramayu',
    aliases: ['kabupaten indramayu', 'kab indramayu', 'indramayu', 'dinsos indramayu'],
    namaDinas: 'Dinas Sosial Kabupaten Indramayu',
    alamat: 'Jl. Pabean Udik No. 268, Kel. Pabean Udik, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45219',
    telepon: '(0234) 271019',
  },
  {
    id: 'kab_karawang',
    kabKota: 'Kabupaten Karawang',
    aliases: ['kabupaten karawang', 'kab karawang', 'karawang', 'dinsos karawang'],
    namaDinas: 'Dinas Sosial Kabupaten Karawang',
    alamat: 'Jl. Husni Hamid No. 3, Kel. Nagasari, Kec. Karawang Barat, Kabupaten Karawang, Jawa Barat 41312',
    telepon: '(0267) 402917',
  },
  {
    id: 'kab_kuningan',
    kabKota: 'Kabupaten Kuningan',
    aliases: ['kabupaten kuningan', 'kab kuningan', 'kuningan', 'kasturi', 'kramatmulya', 'dinsos kuningan'],
    namaDinas: 'Dinas Sosial Kabupaten Kuningan',
    alamat: 'Jl. Raya Kuningan - Cirebon, Kel. Kasturi, Kec. Kramatmulya, Kabupaten Kuningan, Jawa Barat 45521',
    telepon: '(0232) 871661',
  },
  {
    id: 'kab_majalengka',
    kabKota: 'Kabupaten Majalengka',
    aliases: ['kabupaten majalengka', 'kab majalengka', 'majalengka', 'dinsos majalengka'],
    namaDinas: 'Dinas Sosial Kabupaten Majalengka',
    alamat: 'Jl. Raya KH. Abdul Halim No. 498, Kel. Tonjong / Cigasong, Kec. Cigasong, Kabupaten Majalengka, Jawa Barat 45476',
    telepon: '(0233) 281033',
  },
  {
    id: 'kab_pangandaran',
    kabKota: 'Kabupaten Pangandaran',
    aliases: ['kabupaten pangandaran', 'kab pangandaran', 'pangandaran', 'parigi', 'dinsos pangandaran'],
    namaDinas: 'Dinas Sosial, Pemberdayaan Masyarakat dan Desa Kabupaten Pangandaran',
    alamat: 'Jl. Raya Merdeka No. 12, Karangbenda, Kec. Parigi, Kabupaten Pangandaran, Jawa Barat 46393',
    telepon: '(0265) 639145',
  },
  {
    id: 'kab_purwakarta',
    kabKota: 'Kabupaten Purwakarta',
    aliases: ['kabupaten purwakarta', 'kab purwakarta', 'purwakarta', 'dinsos purwakarta'],
    namaDinas: 'Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Purwakarta',
    alamat: 'Jl. Taman Makam Pahlawan No. 9, Purwamekar, Kec. Purwakarta, Kabupaten Purwakarta, Jawa Barat 41119',
    telepon: '(0264) 200234',
  },
  {
    id: 'kab_subang',
    kabKota: 'Kabupaten Subang',
    aliases: ['kabupaten subang', 'kab subang', 'subang', 'dinsos subang'],
    namaDinas: 'Dinas Sosial Kabupaten Subang',
    alamat: 'Jl. D.I. Panjaitan No. 31, Kel. Soklat, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    telepon: '(0260) 411425',
  },
  {
    id: 'kab_sukabumi',
    kabKota: 'Kabupaten Sukabumi',
    aliases: ['kabupaten sukabumi', 'kab sukabumi', 'cisaat', 'palabuhanratu', 'pelabuhanratu', 'dinsos kab sukabumi', 'dinsos kabupaten sukabumi'],
    namaDinas: 'Dinas Sosial Kabupaten Sukabumi',
    alamat: 'Kompleks Gelanggang Pemuda Cisaat, Jl. Veteran No. 1, Sukamanah, Kec. Cisaat, Kabupaten Sukabumi, Jawa Barat 43152',
    telepon: '(0266) 245996',
  },
  {
    id: 'kab_sumedang',
    kabKota: 'Kabupaten Sumedang',
    aliases: ['kabupaten sumedang', 'kab sumedang', 'sumedang', 'dinsos sumedang', 'kantor sumedang', 'dinas sosial sumedang'],
    namaDinas: 'Dinas Sosial Kabupaten Sumedang',
    alamat: 'Jl. Mayor Abdurahman No. 200, Kel. Kotakaler, Kec. Sumedang Utara, Kabupaten Sumedang, Jawa Barat 45322',
    telepon: '(0261) 201248',
  },
  {
    id: 'kab_tasikmalaya',
    kabKota: 'Kabupaten Tasikmalaya',
    aliases: ['kabupaten tasikmalaya', 'kab tasikmalaya', 'singaparna', 'dinsos kab tasikmalaya', 'kab tasik', 'dinsos kab tasik'],
    namaDinas: 'Dinas Sosial, Pengendalian Penduduk, Keluarga Berencana, Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Tasikmalaya',
    alamat: 'Kompleks Pemkab Tasikmalaya, Jl. Sukapura, Bojongkoneng, Kec. Singaparna, Kabupaten Tasikmalaya, Jawa Barat 46415',
    telepon: '(0265) 333156',
  },
  {
    id: 'kota_bandung',
    kabKota: 'Kota Bandung',
    aliases: ['kota bandung', 'dinsos kota bandung', 'bandung kota', 'gedebage', 'rancasari', 'derwati'],
    namaDinas: 'Dinas Sosial Kota Bandung',
    alamat: 'Jl. Babakan Karet (Belakang Rusunawa Rancacili), Kel. Derwati, Kec. Rancasari, Kota Bandung, Jawa Barat 40292',
    telepon: '(022) 2013139 / (022) 7562095',
  },
  {
    id: 'kota_banjar',
    kabKota: 'Kota Banjar',
    aliases: ['kota banjar', 'banjar', 'banjar patroman', 'mekarsari', 'dinsos banjar', 'dinsos kota banjar'],
    namaDinas: 'Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak Kota Banjar',
    alamat: 'Jl. Gerilya No. 19, Kel. Mekarsari, Kec. Banjar, Kota Banjar, Jawa Barat 46321',
    telepon: '(0265) 744318',
  },
  {
    id: 'kota_bekasi',
    kabKota: 'Kota Bekasi',
    aliases: ['kota bekasi', 'dinsos kota bekasi', 'bekasi kota', 'juanda bekasi'],
    namaDinas: 'Dinas Sosial Kota Bekasi',
    alamat: 'Jl. Ir. H. Juanda No. 100, Margahayu, Kec. Bekasi Timur, Kota Bekasi, Jawa Barat 17113',
    telepon: '(021) 8802956',
  },
  {
    id: 'kota_bogor',
    kabKota: 'Kota Bogor',
    aliases: ['kota bogor', 'dinsos kota bogor', 'bogor kota', 'ciwaringin'],
    namaDinas: 'Dinas Sosial Kota Bogor',
    alamat: 'Jl. Merdeka No. 142, Ciwaringin, Kec. Bogor Tengah, Kota Bogor, Jawa Barat 16124',
    telepon: '(0251) 8321075',
  },
  {
    id: 'kota_cimahi',
    kabKota: 'Kota Cimahi',
    aliases: ['kota cimahi', 'cmi', 'cimahi kota', 'dinsos kota cimahi', 'dinsos cimahi', 'cimahi'],
    namaDinas: 'Dinas Sosial Kota Cimahi',
    alamat: 'Gedung B Lantai 2, Kompleks Perkantoran Pemkot Cimahi, Jl. Rd. Demang Hardjakusumah No. 1, Cihanjuang, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40513',
    telepon: '(022) 6654274',
  },
  {
    id: 'kota_cirebon',
    kabKota: 'Kota Cirebon',
    aliases: ['kota cirebon', 'dinsos kota cirebon', 'cirebon kota', 'kesambi'],
    namaDinas: 'Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak Kota Cirebon',
    alamat: 'Jl. Brigjen Dharsono No. 05, Sunyaragi, Kec. Kesambi, Kota Cirebon, Jawa Barat 45132',
    telepon: '(0231) 486867',
  },
  {
    id: 'kota_depok',
    kabKota: 'Kota Depok',
    aliases: ['kota depok', 'depok', 'dinsos depok', 'dinsos kota depok', 'margonda'],
    namaDinas: 'Dinas Sosial Kota Depok',
    alamat: 'Gedung Dibaleka II Lantai 6, Kompleks Balaikota Depok, Jl. Margonda Raya No. 54, Kel. Depok, Kec. Pancoran Mas, Kota Depok, Jawa Barat 16431',
    telepon: '(021) 29402280',
  },
  {
    id: 'kota_sukabumi',
    kabKota: 'Kota Sukabumi',
    aliases: ['kota sukabumi', 'dinsos kota sukabumi', 'sukabumi kota', 'cikole', 'ciaul', 'ciaul pasir'],
    namaDinas: 'Dinas Sosial Kota Sukabumi',
    alamat: 'Jl. Ciaul Pasir No. 126, Kel. Subangjaya, Kec. Cikole, Kota Sukabumi, Jawa Barat 43116',
    telepon: '(0266) 245223',
  },
  {
    id: 'kota_tasikmalaya',
    kabKota: 'Kota Tasikmalaya',
    aliases: ['kota tasikmalaya', 'dinsos kota tasikmalaya', 'tasikmalaya kota', 'bungursari', 'kota tasik', 'dinsos kota tasik'],
    namaDinas: 'Dinas Sosial Kota Tasikmalaya',
    alamat: 'Jl. Ir. H. Juanda No. 195, Sukamulya, Kec. Bungursari, Kota Tasikmalaya, Jawa Barat 46151',
    telepon: '(0265) 345091',
  },
];

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Finds the closest Kab/Kota name from KAB_KOTA_ONLY using fuzzy string distance and smart regional heuristics
 */
export function findClosestKabKota(input: string, list: string[] = KAB_KOTA_ONLY): string {
  const cleanInput = input
    .toLowerCase()
    .replace(/[?!.,;:_()\-]/g, ' ')
    .replace(/^(kabupaten|kab\.|kab|kota)\s+/i, '')
    .trim();

  const wantsKota = /\bkota\b/i.test(input);
  const wantsKab = /\b(kabupaten|kab\.|kab)\b/i.test(input);

  // Direct manual overrides for neighboring areas or common subdistricts
  const manualOverrides: Record<string, string> = {
    cilacap: 'Kab. Pangandaran',
    brebes: 'Kab. Cirebon',
    tegal: 'Kab. Cirebon',
    banten: 'Kab. Sukabumi',
    lebak: 'Kab. Bogor',
    jakarta: 'Kota Bekasi',
    tangerang: 'Kota Depok',
    lembang: 'Kab. Bandung Barat',
    cibadak: 'Kab. Sukabumi',
    pelabuhanratu: 'Kab. Sukabumi',
    palabuhanratu: 'Kab. Sukabumi',
    sumber: 'Kab. Cirebon',
    soreang: 'Kab. Bandung',
    ngamprah: 'Kab. Bandung Barat',
    cikarang: 'Kab. Bekasi',
    cibinong: 'Kab. Bogor',
    singaparna: 'Kab. Tasikmalaya',
    ciaul: 'Kota Sukabumi',
    cikole: 'Kota Sukabumi',
    ciwaringin: 'Kota Bogor',
  };

  if (manualOverrides[cleanInput]) {
    return manualOverrides[cleanInput];
  }

  // Filter list by kota / kab preference if user explicitly specified it
  let candidateList = list;
  if (wantsKota && !wantsKab) {
    const kotaOnly = list.filter((i) => i.startsWith('Kota '));
    if (kotaOnly.length > 0) candidateList = kotaOnly;
  } else if (wantsKab && !wantsKota) {
    const kabOnly = list.filter((i) => i.startsWith('Kab. '));
    if (kabOnly.length > 0) candidateList = kabOnly;
  }

  let bestMatch = candidateList[0] || list[0];
  let minScore = Infinity;

  for (const item of candidateList) {
    const rawClean = item.toLowerCase().replace(/^(kab\.|kota)\s+/i, '').trim();
    if (rawClean === cleanInput) return item;
    if (rawClean.includes(cleanInput) || cleanInput.includes(rawClean)) {
      return item;
    }
    const dist = levenshteinDistance(cleanInput, rawClean);
    const score = dist / Math.max(cleanInput.length, rawClean.length);
    if (score < minScore) {
      minScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * Extracts candidate region from query by stripping common location/address inquiry stop words
 */
export function extractCandidateRegion(query: string): string {
  const norm = query
    .toLowerCase()
    .replace(/[?!.,;:_()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If user explicitly asks about sini or provinsi, do not treat as a foreign candidate region
  if (
    norm.includes('kantor sini') ||
    norm.includes('lokasi sini') ||
    norm.includes('alamat sini') ||
    norm.includes('di sini') ||
    norm.includes('disini') ||
    norm.includes('provinsi') ||
    norm.includes('jabar') ||
    norm.includes('jawa barat') ||
    norm.includes('kantor utama') ||
    norm.includes('kantor pusat')
  ) {
    return '';
  }

  const stopWords = new Set([
    'alamat', 'lokasi', 'kantor', 'kantornya', 'posko', 'poskonya',
    'tempat', 'tempatnya', 'dinsos', 'dinas', 'sosial',
    'dimana', 'dmana', 'dmn', 'mana', 'dimanakah',
    'di', 'ke', 'dari', 'pada', 'untuk',
    'wilayah', 'daerah', 'area',
    'kabupaten', 'kab', 'kota', 'kotamadya',
    'ada', 'adakah', 'apa', 'apakah',
    'tolong', 'mohon', 'bisa', 'dong', 'ya', 'sih', 'kah',
    'tanya', 'mau', 'ingin', 'minta', 'kasih', 'tahu', 'tau', 'beritahu', 'berikan', 'sebutkan',
    'saya', 'kami', 'info', 'informasi', 'detail',
    'no', 'nomor', 'telp', 'telepon', 'hp', 'whatsapp', 'wa', 'kontak', 'hubungi', 'sekitar'
  ]);

  const words = norm.split(' ').filter((w) => w && !stopWords.has(w));
  return words.join(' ').trim();
}

/**
 * Validates whether a candidate region exists in KAB_KOTA_ONLY.
 * If not found, returns fallback suggestion with closest match.
 */
export function validateRegionInKabKota(
  candidate: string,
  list: string[] = KAB_KOTA_ONLY
): {
  found: boolean;
  matchedName?: string;
  suggestedName: string;
} {
  const clean = candidate.toLowerCase().trim();

  // Check aliases from directory first
  for (const office of DINSOS_ADDRESS_DIRECTORY) {
    if (office.isProvinsi) continue;
    for (const alias of office.aliases) {
      if (alias === clean || clean === alias) {
        const corresponding =
          list.find((k) =>
            k.toLowerCase().includes(office.kabKota.toLowerCase().replace(/^(kabupaten|kota)\s+/i, ''))
          ) || office.kabKota;
        return { found: true, matchedName: corresponding, suggestedName: corresponding };
      }
    }
  }

  // Exact or root match against KAB_KOTA_ONLY
  for (const item of list) {
    const root = item.toLowerCase().replace(/^(kab\.|kota)\s+/i, '').trim();
    const itemNorm = item.toLowerCase();
    if (
      clean === root ||
      clean === itemNorm ||
      clean === 'kabupaten ' + root ||
      clean === 'kab ' + root ||
      clean === 'kota ' + root
    ) {
      return { found: true, matchedName: item, suggestedName: item };
    }
  }

  const suggested = findClosestKabKota(candidate, list);
  return {
    found: false,
    suggestedName: suggested,
  };
}

/**
 * Normalizes query string and resolves Dinsos office address.
 * Follows the 3 conditions strictly:
 * 1. Specific region mentioned (including dual regions like Sukabumi, Bogor, etc.) -> Returns exact address immediately.
 * 2. "Sini" / Local context mentioned -> Resolves to userWilayah if set.
 * 3. General / floating question without region -> Asks interactive clarification.
 * 4. Fallback system: If specific region inquired is NOT in KAB_KOTA_ONLY -> Asks:
 *    "Lokasi kantor mana ya lebih tepatnya? Apakah yang dimaksud adalah alamat kantor wilayah [Nama Wilayah]?"
 */
export function resolveDinsosAddressQuery(
  query: string,
  userWilayah?: string,
  previousAssistantMessage?: string
): DinsosAddressQueryResult {
  const norm = query
    .toLowerCase()
    .replace(/[?!.,;:_()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Quick exclusion: conversational fillers, gratitude, greetings, or explicit negations
  // MUST NEVER be intercepted as address queries!
  const isConversationalOrGratitude =
    /\b(makasih|makasi|terima kasih|hatur nuhun|nuhun|thx|thanks|tq|syukron|matur nuwun)\b/i.test(norm) ||
    /\b(bukan|salah|bukan lokasi|bukan tempat|bukan kantor|nggak|enggak|tidak|gamau|ga mau)\b/i.test(norm) ||
    /\b(oke|siap|baik|paham|ngerti|mantap|keren|bagus|sipp?|yoi|yup|halo|hai|pagi|siang|sore|malam|sampurasun)\b/i.test(norm);

  // Check if previous assistant message was a fallback question:
  // "Lokasi kantor mana ya lebih tepatnya? Apakah yang dimaksud adalah alamat kantor wilayah [Nama Wilayah]?"
  const prevFallbackMatch = previousAssistantMessage?.match(
    /Apakah yang dimaksud adalah alamat kantor wilayah ([^?]+)\?/i
  );
  if (prevFallbackMatch) {
    // If user expresses negation or says "bukan / salah / makasih", CANCEL the fallback immediately!
    const isNegation = /\b(bukan|salah|bukan itu|bukan lokasi|nggak|enggak|tidak|bukan wilayah|makasih|makasi|nuhun)\b/i.test(norm);
    if (isNegation) {
      return {
        isAddressQuery: false,
        isSpecificRegion: false,
        needsClarification: false,
        replyText: '',
      };
    }

    const isAffirmative =
      (/\b(iya|ya|betul|benar|tepat|maksud saya|maksudnya|yang itu|setuju|hooh)\b/i.test(norm) &&
        !/\b(makasih|makasi|terima kasih|bukan|salah)\b/i.test(norm)) ||
      norm.toLowerCase().includes(prevFallbackMatch[1].trim().toLowerCase());

    if (isAffirmative) {
      const suggestedTarget = prevFallbackMatch[1].trim();
      // Recurse to resolve the confirmed region
      return resolveDinsosAddressQuery(`alamat kantor ${suggestedTarget}`, userWilayah);
    }
  }

  // If query is conversational, gratitude, or negation, immediately exit
  if (isConversationalOrGratitude) {
    return {
      isAddressQuery: false,
      isSpecificRegion: false,
      needsClarification: false,
      replyText: '',
    };
  }

  // Daftar nama daerah Jawa Barat yang berdiri sendiri
  const allKnownRegions = [
    'sukabumi', 'bogor', 'cirebon', 'bekasi', 'tasikmalaya', 'tasik',
    'bandung', 'sumedang', 'garut', 'ciamis', 'cianjur', 'indramayu',
    'karawang', 'kuningan', 'majalengka', 'pangandaran', 'parigi',
    'purwakarta', 'subang', 'banjar', 'cimahi', 'depok', 'jabar', 'jawa barat',
    'soreang', 'cikarang', 'cibinong', 'sumber', 'singaparna', 'kbb', 'ngamprah',
    'cisaat', 'palabuhanratu', 'cikole'
  ];

  const mentionsAnyRegion = allKnownRegions.some((r) => {
    const reg = new RegExp(`\\b${r}\\b`, 'i');
    return reg.test(norm);
  });

  const isAskingLocationOrAddress =
    norm.includes('alamat') ||
    norm.includes('lokasi kantor') ||
    norm.includes('lokasi dinsos') ||
    norm.includes('kantor dinsos') ||
    norm.includes('kantor dinas') ||
    norm.includes('posko dinsos') ||
    norm.includes('dimana kantor') ||
    norm.includes('di mana kantor') ||
    norm.includes('dmana kantor') ||
    norm.includes('dmn kantor') ||
    norm.includes('alamat kantor') ||
    norm.includes('kantornya dimana') ||
    norm.includes('kantornya di mana') ||
    norm.includes('no telp dinsos') ||
    norm.includes('telepon dinsos') ||
    norm.includes('kontak dinsos') ||
    norm.includes('kontak dinas') ||
    ((norm.includes('kantor') || norm.includes('alamat')) && mentionsAnyRegion);

  if (!isAskingLocationOrAddress) {
    return {
      isAddressQuery: false,
      isSpecificRegion: false,
      needsClarification: false,
      replyText: '',
    };
  }

  // Check if user refers to "sini" / "di sini" / "daerah sini"
  const isAskingSini =
    norm.includes('kantor sini') ||
    norm.includes('lokasi sini') ||
    norm.includes('alamat sini') ||
    norm.includes('di sini') ||
    norm.includes('disini');

  // 1. Check if user explicitly asked for provincial / utama / pusat
  const isAskingProvinsiExplicit =
    (norm.includes('provinsi') && !norm.includes('kabupaten')) ||
    norm.includes('jabar') ||
    norm.includes('jawa barat') ||
    norm.includes('kantor utama') ||
    norm.includes('kantor pusat') ||
    norm.includes('prov jabar');

  // =========================================================================
  // DUAL REGION HANDLING (Sukabumi, Bogor, Cirebon, Bekasi, Tasikmalaya, Bandung)
  // When user asks "sukabumi", provide BOTH Kabupaten & Kota Sukabumi immediately!
  // =========================================================================

  // A. SUKABUMI
  if (/\bsukabumi\b/i.test(norm)) {
    const isExplicitKab = /\b(kabupaten|kab)\b/i.test(norm) || norm.includes('cisaat') || norm.includes('palabuhanratu') || norm.includes('pelabuhanratu');
    const isExplicitKota = /\bkota\b/i.test(norm) || norm.includes('cikole') || norm.includes('ciaul');

    const kabOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kab_sukabumi')!;
    const kotaOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kota_sukabumi')!;

    if (isExplicitKab && !isExplicitKota) {
      return {
        isAddressQuery: true,
        matchedOffice: kabOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kabupaten Sukabumi**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Sukabumi\n• 📌 **Alamat Kantor**: ${kabOffice.alamat}\n• 📞 **Telepon**: ${kabOffice.telepon}\n\nAda informasi terkait layanan sosial atau pilar PSKS di wilayah **Kabupaten Sukabumi** yang ingin Anda ketahui lebih lanjut? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isExplicitKota && !isExplicitKab) {
      return {
        isAddressQuery: true,
        matchedOffice: kotaOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kota Sukabumi**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kota Sukabumi\n• 📌 **Alamat Kantor**: ${kotaOffice.alamat}\n• 📞 **Telepon**: ${kotaOffice.telepon}\n\nAda informasi terkait layanan sosial atau pilar PSKS di wilayah **Kota Sukabumi** yang ingin Anda ketahui lebih lanjut? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    // Default ketika menyebut "Sukabumi": Berikan KEDUA alamat (Kabupaten & Kota) secara lengkap tanpa bertanya ulang!
    return {
      isAddressQuery: true,
      matchedOffice: kabOffice,
      matchedOffices: [kabOffice, kotaOffice],
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Kantor Dinas Sosial di Wilayah Sukabumi**:\n\nDi wilayah **Sukabumi**, terdapat 2 instansi Dinas Sosial sesuai wilayah administrasi pemerintahan (Kabupaten dan Kota):\n\n1️⃣ **Dinas Sosial Kabupaten Sukabumi**:\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Sukabumi\n• 📌 **Alamat Kantor**: Kompleks Gelanggang Pemuda Cisaat, Jl. Veteran No. 1, Sukamanah, Kec. Cisaat, Kabupaten Sukabumi, Jawa Barat 43152\n• 📞 **Telepon**: (0266) 222146\n\n2️⃣ **Dinas Sosial Kota Sukabumi**:\n• 🏢 **Nama Instansi**: Dinas Sosial Kota Sukabumi\n• 📌 **Alamat Kantor**: Jl. Ciaul Pasir No. 42, Cisarua, Kec. Cikole, Kota Sukabumi, Jawa Barat 43115\n• 📞 **Telepon**: (0266) 221980\n\nSilakan kunjungi kantor yang sesuai dengan wilayah domisili atau koordinasi Anda (Kabupaten Sukabumi di Cisaat atau Kota Sukabumi di Ciaul/Cikole). Ada hal terkait layanan sosial di Sukabumi yang bisa saya bantu? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // B. BOGOR
  if (/\bbogor\b/i.test(norm)) {
    const isExplicitKab = /\b(kabupaten|kab)\b/i.test(norm) || norm.includes('cibinong');
    const isExplicitKota = /\bkota\b/i.test(norm) || norm.includes('ciwaringin') || norm.includes('merdeka');

    const kabOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kab_bogor')!;
    const kotaOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kota_bogor')!;

    if (isExplicitKab && !isExplicitKota) {
      return {
        isAddressQuery: true,
        matchedOffice: kabOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kabupaten Bogor**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Bogor\n• 📌 **Alamat Kantor**: ${kabOffice.alamat}\n• 📞 **Telepon**: ${kabOffice.telepon}\n\nAda informasi terkait layanan sosial di **Kabupaten Bogor** yang ingin Anda tanyakan? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isExplicitKota && !isExplicitKab) {
      return {
        isAddressQuery: true,
        matchedOffice: kotaOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kota Bogor**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kota Bogor\n• 📌 **Alamat Kantor**: ${kotaOffice.alamat}\n• 📞 **Telepon**: ${kotaOffice.telepon}\n\nAda informasi terkait layanan sosial di **Kota Bogor** yang ingin Anda tanyakan? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    return {
      isAddressQuery: true,
      matchedOffice: kotaOffice,
      matchedOffices: [kabOffice, kotaOffice],
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Kantor Dinas Sosial di Wilayah Bogor**:\n\nDi wilayah **Bogor**, terdapat 2 instansi Dinas Sosial:\n\n1️⃣ **Dinas Sosial Kabupaten Bogor**:\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Bogor\n• 📌 **Alamat Kantor**: Jl. Bersih No. 1, Komplek Perkantoran Pemda Cibinong, Kec. Cibinong, Kabupaten Bogor 16914\n• 📞 **Telepon**: (021) 8753177\n\n2️⃣ **Dinas Sosial Kota Bogor**:\n• 🏢 **Nama Instansi**: Dinas Sosial Kota Bogor\n• 📌 **Alamat Kantor**: Jl. Merdeka No. 142, Ciwaringin, Kec. Bogor Tengah, Kota Bogor 16124\n• 📞 **Telepon**: (0251) 8321075\n\nSilakan kunjungi kantor yang sesuai dengan wilayah administrasi domisili Anda. Ada hal lain yang bisa saya bantu? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // C. CIREBON
  if (/\bcirebon\b/i.test(norm)) {
    const isExplicitKab = /\b(kabupaten|kab)\b/i.test(norm) || norm.includes('sumber');
    const isExplicitKota = /\bkota\b/i.test(norm) || norm.includes('kesambi') || norm.includes('dharsono');

    const kabOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kab_cirebon')!;
    const kotaOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kota_cirebon')!;

    if (isExplicitKab && !isExplicitKota) {
      return {
        isAddressQuery: true,
        matchedOffice: kabOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kabupaten Cirebon**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Cirebon\n• 📌 **Alamat Kantor**: ${kabOffice.alamat}\n• 📞 **Telepon**: ${kabOffice.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isExplicitKota && !isExplicitKab) {
      return {
        isAddressQuery: true,
        matchedOffice: kotaOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kota Cirebon**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak Kota Cirebon\n• 📌 **Alamat Kantor**: ${kotaOffice.alamat}\n• 📞 **Telepon**: ${kotaOffice.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    return {
      isAddressQuery: true,
      matchedOffice: kabOffice,
      matchedOffices: [kabOffice, kotaOffice],
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Kantor Dinas Sosial di Wilayah Cirebon**:\n\n1️⃣ **Dinas Sosial Kabupaten Cirebon**:\n• 📌 **Alamat**: Jl. Sunan Drajat No. 11, Sumber, Kec. Sumber, Kabupaten Cirebon 45611\n• 📞 **Telepon**: (0231) 321151\n\n2️⃣ **Dinas Sosial Kota Cirebon**:\n• 📌 **Alamat**: Jl. Brigjen Dharsono No. 05, Sunyaragi, Kec. Kesambi, Kota Cirebon 45132\n• 📞 **Telepon**: (0231) 487261\n\nSilakan kunjungi kantor yang sesuai dengan wilayah domisili Anda! 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // D. BEKASI
  if (/\bbekasi\b/i.test(norm)) {
    const isExplicitKab = /\b(kabupaten|kab)\b/i.test(norm) || norm.includes('cikarang');
    const isExplicitKota = /\bkota\b/i.test(norm) || norm.includes('juanda');

    const kabOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kab_bekasi')!;
    const kotaOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kota_bekasi')!;

    if (isExplicitKab && !isExplicitKota) {
      return {
        isAddressQuery: true,
        matchedOffice: kabOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kabupaten Bekasi**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Bekasi\n• 📌 **Alamat Kantor**: ${kabOffice.alamat}\n• 📞 **Telepon**: ${kabOffice.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isExplicitKota && !isExplicitKab) {
      return {
        isAddressQuery: true,
        matchedOffice: kotaOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kota Bekasi**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kota Bekasi\n• 📌 **Alamat Kantor**: ${kotaOffice.alamat}\n• 📞 **Telepon**: ${kotaOffice.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    return {
      isAddressQuery: true,
      matchedOffice: kotaOffice,
      matchedOffices: [kabOffice, kotaOffice],
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Kantor Dinas Sosial di Wilayah Bekasi**:\n\n1️⃣ **Dinas Sosial Kabupaten Bekasi**:\n• 📌 **Alamat**: Kompleks Perkantoran Pemkab Bekasi, Blok B1 Lt. 2, Desa Sukamahi, Kec. Cikarang Pusat, Kabupaten Bekasi 17530\n• 📞 **Telepon**: (021) 89970135\n\n2️⃣ **Dinas Sosial Kota Bekasi**:\n• 📌 **Alamat**: Jl. Ir. H. Juanda No. 100, Margahayu, Kec. Bekasi Timur, Kota Bekasi 17113\n• 📞 **Telepon**: (021) 8802956\n\nSilakan kunjungi kantor yang sesuai dengan wilayah domisili Anda! 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // E. TASIKMALAYA / TASIK
  if (/\b(tasikmalaya|tasik)\b/i.test(norm)) {
    const isExplicitKab = /\b(kabupaten|kab)\b/i.test(norm) || norm.includes('singaparna');
    const isExplicitKota = /\bkota\b/i.test(norm) || norm.includes('bungursari');

    const kabOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kab_tasikmalaya')!;
    const kotaOffice = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kota_tasikmalaya')!;

    if (isExplicitKab && !isExplicitKota) {
      return {
        isAddressQuery: true,
        matchedOffice: kabOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kabupaten Tasikmalaya**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Tasikmalaya\n• 📌 **Alamat Kantor**: ${kabOffice.alamat}\n• 📞 **Telepon**: ${kabOffice.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isExplicitKota && !isExplicitKab) {
      return {
        isAddressQuery: true,
        matchedOffice: kotaOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kota Tasikmalaya**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kota Tasikmalaya\n• 📌 **Alamat Kantor**: ${kotaOffice.alamat}\n• 📞 **Telepon**: ${kotaOffice.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    return {
      isAddressQuery: true,
      matchedOffice: kabOffice,
      matchedOffices: [kabOffice, kotaOffice],
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Kantor Dinas Sosial di Wilayah Tasikmalaya**:\n\n1️⃣ **Dinas Sosial Kabupaten Tasikmalaya**:\n• 📌 **Alamat**: Jl. Pemuda No. 1, Bojongkoneng, Kec. Singaparna, Kabupaten Tasikmalaya 46415\n• 📞 **Telepon**: (0265) 545233\n\n2️⃣ **Dinas Sosial Kota Tasikmalaya**:\n• 📌 **Alamat**: Jl. Ir. H. Juanda No. 195, Sukamulya, Kec. Bungursari, Kota Tasikmalaya 46151\n• 📞 **Telepon**: (0265) 345091\n\nSilakan kunjungi kantor yang sesuai dengan wilayah domisili Anda! 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // F. BANDUNG (Kota Bandung, Kab. Bandung, KBB, & Provinsi)
  if (/\bbandung\b/i.test(norm)) {
    const isBarat = norm.includes('barat') || norm.includes('kbb') || norm.includes('ngamprah') || norm.includes('padalarang');
    const isKab = (norm.includes('kabupaten') || norm.includes('kab ') || norm.includes('soreang')) && !isBarat;
    const isKota = norm.includes('kota') || norm.includes('gedebage');
    const isProv = norm.includes('provinsi') || norm.includes('prov') || norm.includes('rajiman') || norm.includes('amir machmud') || norm.includes('utama');

    if (isBarat) {
      const kbb = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kab_bandung_barat')!;
      return {
        isAddressQuery: true,
        matchedOffice: kbb,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kabupaten Bandung Barat (KBB)**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Bandung Barat\n• 📌 **Alamat Kantor**: ${kbb.alamat}\n• 📞 **Telepon**: ${kbb.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isKab) {
      const kab = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kab_bandung')!;
      return {
        isAddressQuery: true,
        matchedOffice: kab,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kabupaten Bandung**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kabupaten Bandung\n• 📌 **Alamat Kantor**: ${kab.alamat}\n• 📞 **Telepon**: ${kab.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isKota) {
      const kota = DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kota_bandung')!;
      return {
        isAddressQuery: true,
        matchedOffice: kota,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial Kota Bandung**:\n\n• 🏢 **Nama Instansi**: Dinas Sosial Kota Bandung\n• 📌 **Alamat Kantor**: ${kota.alamat}\n• 📞 **Telepon**: ${kota.telepon}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    if (isProv) {
      const prov = DINSOS_ADDRESS_DIRECTORY[0];
      return {
        isAddressQuery: true,
        matchedOffice: prov,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Resmi Dinas Sosial Provinsi Jawa Barat**:\n\n${prov.alamat}\n• 📞 **Telepon**: ${prov.telepon}\n• ✉️ **Email**: ${prov.email}\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
      };
    }

    // Default ketika menyebut "Bandung": Jelaskan secara lengkap
    return {
      isAddressQuery: true,
      matchedOffice: DINSOS_ADDRESS_DIRECTORY.find((o) => o.id === 'kota_bandung'),
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Kantor Dinas Sosial di Wilayah Bandung Raya**:\n\n1️⃣ **Dinas Sosial Kota Bandung**:\n• 📌 **Alamat**: Jl. Babakan Karet No. 7, Rancabalong, Kec. Gedebage, Kota Bandung 40294\n• 📞 **Telepon**: (022) 7562095\n\n2️⃣ **Dinas Sosial Kabupaten Bandung**:\n• 📌 **Alamat**: Jl. Raya Soreang Km. 17, Soreang, Kabupaten Bandung 40911\n• 📞 **Telepon**: (022) 5891159\n\n3️⃣ **Dinas Sosial Kabupaten Bandung Barat (KBB)**:\n• 📌 **Alamat**: Kompleks Pemkab Bandung Barat Gedung D, Jl. Raya Padalarang - Cisarua Km. 2, Ngamprah 40552\n• 📞 **Telepon**: (022) 82783015\n\n4️⃣ **Dinas Sosial Provinsi Jawa Barat**:\n• 📌 **Kantor Utama**: Jl. Jend. H. Amir Machmud No. 331, Kota Cimahi\n• 📌 **Kantor Wilayah Bandung**: Jl. Rajiman No. 6, Cicendo, Kota Bandung 40171\n• 📞 **Hotline**: +62 821-2603-0038\n\nSilakan kunjungi kantor yang sesuai dengan wilayah yang Anda tuju! 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // =========================================================================
  // SINGLE REGION MATCHING
  // =========================================================================
  let foundOffice: DinsosOfficeAddress | undefined;

  for (const office of DINSOS_ADDRESS_DIRECTORY) {
    if (office.isProvinsi) continue;
    for (const alias of office.aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(norm)) {
        foundOffice = office;
        break;
      }
    }
    if (foundOffice) break;
  }

  if (foundOffice) {
    const phoneLine = foundOffice.telepon ? `\n• 📞 **Telepon**: ${foundOffice.telepon}` : '';
    const emailLine = foundOffice.email ? `\n• ✉️ **Email**: ${foundOffice.email}` : '';

    return {
      isAddressQuery: true,
      matchedOffice: foundOffice,
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Kantor ${foundOffice.namaDinas}**:\n\n• 🏢 **Nama Instansi**: ${foundOffice.namaDinas}\n• 📌 **Alamat Kantor**: ${foundOffice.alamat}${phoneLine}${emailLine}\n\nAda informasi terkait layanan sosial atau pilar PSKS di wilayah **${foundOffice.kabKota}** yang ingin Anda ketahui lebih lanjut? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // User bertanya "di sini" / "sini" dan memiliki wilayah akun
  if (isAskingSini && userWilayah && userWilayah !== 'Jawa Barat' && userWilayah !== 'Semua Wilayah') {
    const userWilayahLower = userWilayah.toLowerCase();
    const localOffice = DINSOS_ADDRESS_DIRECTORY.find((o) =>
      o.aliases.some((a) => userWilayahLower.includes(a)) || userWilayahLower.includes(o.kabKota.toLowerCase())
    );

    if (localOffice) {
      const phoneLine = localOffice.telepon ? `\n• 📞 **Telepon**: ${localOffice.telepon}` : '';
      return {
        isAddressQuery: true,
        matchedOffice: localOffice,
        isSpecificRegion: true,
        needsClarification: false,
        replyText: `📍 **Alamat Kantor Dinas Sosial di Wilayah Anda (${localOffice.kabKota})**:\n\nSesuai dengan wilayah penugasan akun Anda di **${localOffice.kabKota}**, berikut alamat kantor dinas sosial setempat:\n• 🏢 **Nama Instansi**: ${localOffice.namaDinas}\n• 📌 **Alamat Kantor**: ${localOffice.alamat}${phoneLine}\n\nSilakan kunjungi kantor tersebut untuk koordinasi kedinasan langsung di wilayah Anda. Ada hal lain yang bisa saya bantu? 😊`,
      };
    }
  }

  // User bertanya provinsi secara eksplisit
  if (isAskingProvinsiExplicit) {
    const provOffice = DINSOS_ADDRESS_DIRECTORY[0];
    return {
      isAddressQuery: true,
      matchedOffice: provOffice,
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Resmi Dinas Sosial Provinsi Jawa Barat**:\n\n${provOffice.alamat}\n• 📞 **Hotline Telepon**: ${provOffice.telepon}\n• ✉️ **Email Pelayanan**: ${provOffice.email}\n• 🌐 **Portal Resmi**: dinsos.jabarprov.go.id\n• ⏰ **Jam Layanan**: Senin – Jumat (08:00 – 16:00 WIB)\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // 4. FALLBACK SYSTEM: Validasi jika user bertanya wilayah spesifik tapi tidak ditemukan di KAB_KOTA_ONLY
  const extractedCandidate = extractCandidateRegion(query);
  if (extractedCandidate && extractedCandidate.length > 0) {
    const validation = validateRegionInKabKota(extractedCandidate, KAB_KOTA_ONLY);
    if (!validation.found) {
      return {
        isAddressQuery: true,
        matchedOffice: undefined,
        isSpecificRegion: false,
        needsClarification: true,
        isFallback: true,
        suggestedRegion: validation.suggestedName,
        replyText: `Lokasi kantor mana ya lebih tepatnya? Apakah yang dimaksud adalah alamat kantor wilayah ${validation.suggestedName}?`,
      };
    } else if (validation.matchedName) {
      const directOffice = DINSOS_ADDRESS_DIRECTORY.find((o) =>
        o.kabKota.toLowerCase().includes(validation.matchedName!.toLowerCase().replace(/^(kab\.|kota)\s+/i, ''))
      );
      if (directOffice) {
        const phoneLine = directOffice.telepon ? `\n• 📞 **Telepon**: ${directOffice.telepon}` : '';
        const emailLine = directOffice.email ? `\n• ✉️ **Email**: ${directOffice.email}` : '';
        return {
          isAddressQuery: true,
          matchedOffice: directOffice,
          isSpecificRegion: true,
          needsClarification: false,
          replyText: `📍 **Alamat Kantor ${directOffice.namaDinas}**:\n\n• 🏢 **Nama Instansi**: ${directOffice.namaDinas}\n• 📌 **Alamat Kantor**: ${directOffice.alamat}${phoneLine}${emailLine}\n\nAda informasi terkait layanan sosial atau pilar PSKS di wilayah **${directOffice.kabKota}** yang ingin Anda ketahui lebih lanjut? 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
        };
      }
    }
  }

  // Condition 3: Pertanyaan Mengambang Tanpa Menyebut Wilayah Sama Sekali
  // (Contoh: "dimana lokasi kantor?", "alamat dinas sosial dimana?")
  return {
    isAddressQuery: true,
    matchedOffice: undefined,
    isSpecificRegion: false,
    needsClarification: true,
    replyText: `Lokasi kantor Dinas Sosial wilayah mana ya yang Anda maksud lebih tepatnya? 😊\n\nDi Jawa Barat, setiap kabupaten/kota memiliki kantor Dinas Sosial masing-masing. Sebagai contoh:\n• Kantor **Dinsos Kabupaten Sumedang**: Jl. Mayor Abdurahman No. 125, Sumedang Utara\n• Kantor **Dinsos Kota Bogor**: Jl. Merdeka No. 142, Ciwaringin, Bogor Tengah\n• Kantor **Dinsos Sukabumi**: Cisaat (Kabupaten) & Cikole (Kota)\n• Kantor **Dinsos Kabupaten Bandung**: Jl. Raya Soreang Km. 17, Soreang\n• **Kantor Utama Dinsos Provinsi Jawa Barat**: Jl. Jend. H. Amir Machmud No. 331, Kota Cimahi\n\nSilakan sebutkan nama kabupaten/kota yang Anda tuju di 27 Kab/Kota se-Jawa Barat, saya siap memberikan alamat lengkap dan kontaknya!`,
  };
}
