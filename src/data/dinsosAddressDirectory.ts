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

export const DINSOS_ADDRESS_DIRECTORY: DinsosOfficeAddress[] = [
  // PROVINSI JAWA BARAT
  {
    id: 'provinsi_jabar',
    kabKota: 'Provinsi Jawa Barat',
    isProvinsi: true,
    aliases: ['provinsi', 'jabar', 'prov jabar', 'provinsi jawa barat', 'kantor utama', 'kantor pusat'],
    namaDinas: 'Dinas Sosial Provinsi Jawa Barat (Kantor Utama & Perwakilan Bandung)',
    alamat: '• 📍 **Kantor Utama**: Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522\n• 📍 **Kantor Bandung**: Jl. Rajiman No. 6, Pasir Kaliki, Kec. Cicendo, Kota Bandung 40171',
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
    alamat: 'Jl. Veteran No. 7, Pakuwon, Kec. Garut Kota, Kabupaten Garut, Jawa Barat 44111',
    telepon: '(0262) 233157',
  },
  {
    id: 'kab_indramayu',
    kabKota: 'Kabupaten Indramayu',
    aliases: ['kabupaten indramayu', 'kab indramayu', 'indramayu', 'dinsos indramayu'],
    namaDinas: 'Dinas Sosial Kabupaten Indramayu',
    alamat: 'Jl. RA Kartini No. 2, Margadadi, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45212',
    telepon: '(0234) 272044',
  },
  {
    id: 'kab_karawang',
    kabKota: 'Kabupaten Karawang',
    aliases: ['kabupaten karawang', 'kab karawang', 'karawang', 'dinsos karawang'],
    namaDinas: 'Dinas Sosial Kabupaten Karawang',
    alamat: 'Jl. Husni Hamid No. 1, Nagasari, Kec. Karawang Barat, Kabupaten Karawang, Jawa Barat 41312',
    telepon: '(0267) 402245',
  },
  {
    id: 'kab_kuningan',
    kabKota: 'Kabupaten Kuningan',
    aliases: ['kabupaten kuningan', 'kab kuningan', 'kuningan', 'dinsos kuningan'],
    namaDinas: 'Dinas Sosial Kabupaten Kuningan',
    alamat: 'Jl. Cirendang No. 17, Cirendang, Kec. Kuningan, Kabupaten Kuningan, Jawa Barat 45518',
    telepon: '(0232) 871142',
  },
  {
    id: 'kab_majalengka',
    kabKota: 'Kabupaten Majalengka',
    aliases: ['kabupaten majalengka', 'kab majalengka', 'majalengka', 'dinsos majalengka'],
    namaDinas: 'Dinas Sosial Kabupaten Majalengka',
    alamat: 'Jl. K.H. Abdul Halim No. 493, Tonjong, Kec. Majalengka, Kabupaten Majalengka, Jawa Barat 45414',
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
    alamat: 'Jl. Mayjen Sutoyo No. 22, Karanganyar, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    telepon: '(0260) 411326',
  },
  {
    id: 'kab_sukabumi',
    kabKota: 'Kabupaten Sukabumi',
    aliases: ['kabupaten sukabumi', 'kab sukabumi', 'cisaat', 'palabuhanratu', 'dinsos kab sukabumi'],
    namaDinas: 'Dinas Sosial Kabupaten Sukabumi',
    alamat: 'Kompleks Gelanggang Pemuda Cisaat, Jl. Veteran No. 1, Sukamanah, Kec. Cisaat, Kabupaten Sukabumi, Jawa Barat 43152',
    telepon: '(0266) 222146',
  },
  {
    id: 'kab_sumedang',
    kabKota: 'Kabupaten Sumedang',
    aliases: ['kabupaten sumedang', 'kab sumedang', 'sumedang', 'dinsos sumedang', 'kantor sumedang', 'dinas sosial sumedang'],
    namaDinas: 'Dinas Sosial Kabupaten Sumedang',
    alamat: 'Jl. Mayor Abdurahman No. 125, Kotakaler, Kec. Sumedang Utara, Kabupaten Sumedang, Jawa Barat 45322',
    telepon: '(0261) 201248',
  },
  {
    id: 'kab_tasikmalaya',
    kabKota: 'Kabupaten Tasikmalaya',
    aliases: ['kabupaten tasikmalaya', 'kab tasikmalaya', 'singaparna', 'dinsos kab tasikmalaya'],
    namaDinas: 'Dinas Sosial, Pengendalian Penduduk, Keluarga Berencana, Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Tasikmalaya',
    alamat: 'Jl. Pemuda No. 1, Bojongkoneng, Kec. Singaparna, Kabupaten Tasikmalaya, Jawa Barat 46415',
    telepon: '(0265) 545233',
  },
  {
    id: 'kota_bandung',
    kabKota: 'Kota Bandung',
    aliases: ['kota bandung', 'dinsos kota bandung', 'bandung kota', 'gedebage'],
    namaDinas: 'Dinas Sosial Kota Bandung',
    alamat: 'Jl. Babakan Karet No. 7, Rancabalong, Kec. Gedebage, Kota Bandung, Jawa Barat 40294',
    telepon: '(022) 7562095',
  },
  {
    id: 'kota_banjar',
    kabKota: 'Kota Banjar',
    aliases: ['kota banjar', 'banjar', 'banjar patroman', 'purwaharja', 'dinsos banjar', 'dinsos kota banjar'],
    namaDinas: 'Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak Kota Banjar',
    alamat: 'Komplek Perkantoran Purwaharja, Jl. Purnawarman No. 4, Purwaharja, Kec. Purwaharja, Kota Banjar, Jawa Barat 46332',
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
    aliases: ['kota cimahi', 'cmi', 'cimahi kota', 'dinsos kota cimahi', 'dinsos cimahi'],
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
    telepon: '(0231) 487261',
  },
  {
    id: 'kota_depok',
    kabKota: 'Kota Depok',
    aliases: ['kota depok', 'depok', 'dinsos depok', 'dinsos kota depok', 'margonda'],
    namaDinas: 'Dinas Sosial Kota Depok',
    alamat: 'Gedung Dibaleka II Lantai 4 & 5, Kompleks Balaikota Depok, Jl. Margonda Raya No. 54, Depok, Kec. Pancoran Mas, Kota Depok, Jawa Barat 16431',
    telepon: '(021) 7773610',
  },
  {
    id: 'kota_sukabumi',
    kabKota: 'Kota Sukabumi',
    aliases: ['kota sukabumi', 'dinsos kota sukabumi', 'sukabumi kota', 'cikole'],
    namaDinas: 'Dinas Sosial Kota Sukabumi',
    alamat: 'Jl. Ciaul Pasir No. 42, Cisarua, Kec. Cikole, Kota Sukabumi, Jawa Barat 43115',
    telepon: '(0266) 221980',
  },
  {
    id: 'kota_tasikmalaya',
    kabKota: 'Kota Tasikmalaya',
    aliases: ['kota tasikmalaya', 'dinsos kota tasikmalaya', 'tasikmalaya kota', 'bungursari'],
    namaDinas: 'Dinas Sosial Kota Tasikmalaya',
    alamat: 'Jl. Ir. H. Juanda No. 195, Sukamulya, Kec. Bungursari, Kota Tasikmalaya, Jawa Barat 46151',
    telepon: '(0265) 345091',
  },
];

/**
 * Normalizes query string and resolves Dinsos office address.
 * Follows the 3 conditions strictly:
 * 1. Specific region mentioned -> Returns ONLY that region's address.
 * 2. "Sini" / Local context mentioned -> Resolves to userWilayah if set.
 * 3. General / floating question without region -> Asks interactive clarification.
 */
export function resolveDinsosAddressQuery(
  query: string,
  userWilayah?: string
): {
  isAddressQuery: boolean;
  matchedOffice?: DinsosOfficeAddress;
  isSpecificRegion: boolean;
  needsClarification: boolean;
  replyText: string;
} {
  const norm = query
    .toLowerCase()
    .replace(/[?!.,;:_()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isAskingLocationOrAddress =
    norm.includes('alamat') ||
    norm.includes('lokasi') ||
    norm.includes('kantor') ||
    norm.includes('tempat') ||
    norm.includes('posko') ||
    norm.includes('dimana') ||
    norm.includes('di mana') ||
    norm.includes('dmana') ||
    norm.includes('dmn') ||
    norm.includes('kantornya');

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
    norm.includes('provinsi') ||
    norm.includes('jabar') ||
    norm.includes('jawa barat') ||
    norm.includes('kantor utama') ||
    norm.includes('kantor pusat') ||
    norm.includes('prov');

  // Check for specific Kab/Kota (exclude generic 'provinsi_jabar' first)
  let foundOffice: DinsosOfficeAddress | undefined;

  // Search through all 27 Kab/Kota
  for (const office of DINSOS_ADDRESS_DIRECTORY) {
    if (office.isProvinsi) continue;
    for (const alias of office.aliases) {
      // Word boundary or inclusion check
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(norm) || norm.includes(alias)) {
        foundOffice = office;
        break;
      }
    }
    if (foundOffice) break;
  }

  // If specific Kab/Kota found:
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

  // If user asked "di sini" / "sini" and user has an assigned wilayah
  if (isAskingSini && userWilayah && userWilayah !== 'Jawa Barat' && userWilayah !== 'Semua Wilayah') {
    const userWilayahLower = userWilayah.toLowerCase();
    const localOffice = DINSOS_ADDRESS_DIRECTORY.find((o) =>
      o.aliases.some((a) => userWilayahLower.includes(a))
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

  // If user explicitly asks for provinsi / jabar / kantor utama
  if (isAskingProvinsiExplicit && !foundOffice) {
    const provOffice = DINSOS_ADDRESS_DIRECTORY[0];
    return {
      isAddressQuery: true,
      matchedOffice: provOffice,
      isSpecificRegion: true,
      needsClarification: false,
      replyText: `📍 **Alamat Resmi Dinas Sosial Provinsi Jawa Barat**:\n\n${provOffice.alamat}\n• 📞 **Hotline Telepon**: ${provOffice.telepon}\n• ✉️ **Email Pelayanan**: ${provOffice.email}\n• 🌐 **Portal Resmi**: dinsos.jabarprov.go.id\n• ⏰ **Jam Layanan**: Senin – Jumat (08:00 – 16:00 WIB)\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`,
    };
  }

  // Condition C: Floating / Generic Question without specific region
  // AI clarifies interactively and gives representative examples!
  return {
    isAddressQuery: true,
    matchedOffice: undefined,
    isSpecificRegion: false,
    needsClarification: true,
    replyText: `Lokasi kantor Dinas Sosial wilayah mana ya yang Anda maksud lebih tepatnya? 😊\n\nDi Jawa Barat, setiap kabupaten/kota memiliki kantor Dinas Sosial masing-masing. Sebagai contoh:\n• Kantor **Dinsos Kabupaten Sumedang**: Jl. Mayor Abdurahman No. 125, Sumedang Utara\n• Kantor **Dinsos Kota Bogor**: Jl. Merdeka No. 142, Ciwaringin, Bogor Tengah\n• Kantor **Dinsos Kabupaten Bandung**: Jl. Raya Soreang Km. 17, Soreang\n• **Kantor Utama Dinsos Provinsi Jawa Barat**: Jl. Jend. H. Amir Machmud No. 331, Kota Cimahi\n\nSilakan sebutkan kabupaten/kota yang Anda tuju di 27 Kab/Kota se-Jawa Barat, saya siap memberikan alamat lengkap dan kontaknya!`,
  };
}
