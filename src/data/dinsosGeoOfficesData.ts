export interface DinsosGeoOffice {
  id: string;
  kabKota: string;
  isProvinsi?: boolean;
  type: 'Provinsi' | 'Kabupaten' | 'Kota';
  namaDinas: string;
  alamat: string;
  telepon: string;
  email?: string;
  lat: number;
  lng: number;
  wilayahRayon: 'Bandung Raya' | 'Bodebek' | 'Ciayumajakuning' | 'Priangan Timur' | 'Purwasukasi' | 'Sukabumi & Cianjur';
  googleMapsUrl: string;
}

export const DINSOS_GEO_OFFICES: DinsosGeoOffice[] = [
  // 1. KANTOR DINAS SOSIAL PROVINSI JAWA BARAT (PUSAT)
  // OSM Way ID: 380750494 (Gedung Dinas Sosial Provinsi Jawa Barat, Jl. Jend. H. Amir Machmud No. 331)
  {
    id: 'provinsi_jabar',
    kabKota: 'Provinsi Jawa Barat',
    isProvinsi: true,
    type: 'Provinsi',
    namaDinas: 'Dinas Sosial Provinsi Jawa Barat (Kantor Pusat)',
    alamat: 'Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522',
    telepon: '(022) 6641564 / Hotline WA: +62 821-2603-0038',
    email: 'dinsos@jabarprov.go.id',
    lat: -6.88631,
    lng: 107.55378,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.88631,107.55378',
  },

  // 2. KABUPATEN BANDUNG
  // Komplek Pemkab Bandung, Jl. Raya Soreang Km. 17 (Gedung Dinsos samping Kantor Bupati)
  {
    id: 'kab_bandung',
    kabKota: 'Kabupaten Bandung',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Bandung',
    alamat: 'Komplek Pemkab Bandung, Jl. Raya Soreang Km. 17, Pamekaran, Kec. Soreang, Kabupaten Bandung, Jawa Barat 40912',
    telepon: '(022) 5891159',
    lat: -7.02115,
    lng: 107.52637,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-7.02115,107.52637',
  },

  // 3. KABUPATEN BANDUNG BARAT
  // Komplek Perkantoran Pemkab Bandung Barat Gedung D, Ngamprah
  {
    id: 'kab_bandung_barat',
    kabKota: 'Kabupaten Bandung Barat',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Bandung Barat',
    alamat: 'Komplek Perkantoran Pemkab Bandung Barat, Gedung D, Jl. Raya Padalarang - Cisarua Km. 2, Mekarsari, Kec. Ngamprah, Kabupaten Bandung Barat 40552',
    telepon: '(022) 82783015',
    lat: -6.84112,
    lng: 107.51258,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.84112,107.51258',
  },

  // 4. KOTA BANDUNG
  // Jl. Babakan Karet (Belakang Rusunawa Rancacili), Derwati, Rancasari
  {
    id: 'kota_bandung',
    kabKota: 'Kota Bandung',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Bandung',
    alamat: 'Jl. Babakan Karet (Belakang Rusunawa Rancacili), Kel. Derwati, Kec. Rancasari, Kota Bandung, Jawa Barat 40292',
    telepon: '(022) 2013139 / (022) 7562095',
    lat: -6.96025,
    lng: 107.68250,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.96025,107.68250',
  },

  // 5. KOTA CIMAHI
  // Gedung B Lt. 2, Kompleks Pemkot Cimahi, Jl. Rd. Demang Hardjakusumah Blok Jati No. 1
  {
    id: 'kota_cimahi',
    kabKota: 'Kota Cimahi',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Cimahi',
    alamat: 'Gedung B Lantai 2, Kompleks Perkantoran Pemkot Cimahi, Jl. Rd. Demang Hardjakusumah Blok Jati No. 1, Kel. Cibabat, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40513',
    telepon: '(022) 6654274',
    lat: -6.86835,
    lng: 107.55392,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.86835,107.55392',
  },

  // 6. KABUPATEN BOGOR
  // OSM Node: 6723944689 (DINAS SOSIAL KABUPATEN BOGOR, Jl. Bersih, Tengah, Cibinong)
  {
    id: 'kab_bogor',
    kabKota: 'Kabupaten Bogor',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Bogor',
    alamat: 'Jl. Bersih No. 1, Komplek Perkantoran Pemda Cibinong, Kel. Tengah, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16914',
    telepon: '(021) 87902288',
    lat: -6.47515,
    lng: 106.82420,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.47515,106.82420',
  },

  // 7. KOTA BOGOR
  // OSM Way: 201098304 (Dinas Sosial Kota Bogor, Jl. Merdeka No. 142)
  {
    id: 'kota_bogor',
    kabKota: 'Kota Bogor',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Bogor',
    alamat: 'Jl. Merdeka No. 142, RT.03/RW.05, Kel. Ciwaringin, Kec. Bogor Tengah, Kota Bogor, Jawa Barat 16125',
    telepon: '(0251) 8332315',
    lat: -6.58508,
    lng: 106.78804,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.58508,106.78804',
  },

  // 8. KOTA DEPOK
  // OSM Balaikota Depok / Gedung Dibaleka II, Jl. Margonda Raya No. 54
  {
    id: 'kota_depok',
    kabKota: 'Kota Depok',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Depok',
    alamat: 'Gedung Dibaleka II Lantai 6, Kompleks Balaikota Depok, Jl. Margonda Raya No. 54, Kel. Depok, Kec. Pancoran Mas, Kota Depok, Jawa Barat 16431',
    telepon: '(021) 29402280',
    lat: -6.39422,
    lng: 106.82180,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.39422,106.82180',
  },

  // 9. KABUPATEN BEKASI
  // OSM Komplek Perkantoran Pemkab Bekasi Blok B1, Cikarang Pusat
  {
    id: 'kab_bekasi',
    kabKota: 'Kabupaten Bekasi',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Bekasi',
    alamat: 'Kompleks Perkantoran Pemkab Bekasi, Blok B1 Lt. 2, Desa Sukamahi, Kec. Cikarang Pusat, Kabupaten Bekasi, Jawa Barat 17530',
    telepon: '(021) 89970135',
    lat: -6.36450,
    lng: 107.17231,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.36450,107.17231',
  },

  // 10. KOTA BEKASI
  // OSM Way: 504486974 (Dinas Sosial Kota Bekasi, Jl. Ir. H. Juanda No. 100 / Gang Durian II)
  {
    id: 'kota_bekasi',
    kabKota: 'Kota Bekasi',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Bekasi',
    alamat: 'Jl. Ir. H. Juanda No. 100, Kel. Margahayu, Kec. Bekasi Timur, Kota Bekasi, Jawa Barat 17113',
    telepon: '(021) 88349600',
    lat: -6.24454,
    lng: 107.00606,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.24454,107.00606',
  },

  // 11. KABUPATEN KARAWANG
  // OSM Way: 317572113 (Dinas Sosial Kab. Karawang, Jl. Husni Hamid No. 3)
  {
    id: 'kab_karawang',
    kabKota: 'Kabupaten Karawang',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Karawang',
    alamat: 'Jl. Husni Hamid No. 3, Kel. Nagasari, Kec. Karawang Barat, Kabupaten Karawang, Jawa Barat 41312',
    telepon: '(0267) 402917',
    lat: -6.30307,
    lng: 107.30186,
    wilayahRayon: 'Purwasukasi',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.30307,107.30186',
  },

  // 12. KABUPATEN PURWAKARTA
  // Dinas Sosial P3A Purwakarta, Jl. Taman Pahlawan No. 9, Purwamekar
  {
    id: 'kab_purwakarta',
    kabKota: 'Kabupaten Purwakarta',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial, P3A Kabupaten Purwakarta',
    alamat: 'Jl. Taman Pahlawan No. 9, Kel. Purwamekar, Kec. Purwakarta, Kabupaten Purwakarta, Jawa Barat 41119',
    telepon: '0877-2444-7749',
    lat: -6.53618,
    lng: 107.43855,
    wilayahRayon: 'Purwasukasi',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.53618,107.43855',
  },

  // 13. KABUPATEN SUBANG
  // OSM Way: 472432181 (Dinas Sosial Kab. Subang, Jl. D.I. Panjaitan No. 31)
  {
    id: 'kab_subang',
    kabKota: 'Kabupaten Subang',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Subang',
    alamat: 'Jl. D.I. Panjaitan No. 31, Kel. Soklat, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    telepon: '(0260) 411425',
    lat: -6.57007,
    lng: 107.76764,
    wilayahRayon: 'Purwasukasi',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.57007,107.76764',
  },

  // 14. KABUPATEN SUKABUMI
  // Kompleks GOR / Gelanggang Pemuda Cisaat, Jl. Veteran No. 1
  {
    id: 'kab_sukabumi',
    kabKota: 'Kabupaten Sukabumi',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Sukabumi',
    alamat: 'Kompleks Gelanggang Pemuda Cisaat, Jl. Veteran No. 1, Kel. Sukamanah, Kec. Cisaat, Kabupaten Sukabumi, Jawa Barat 43152',
    telepon: '(0266) 245996',
    lat: -6.90771,
    lng: 106.89547,
    wilayahRayon: 'Sukabumi & Cianjur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.90771,106.89547',
  },

  // 15. KOTA SUKABUMI
  // Dinas Sosial Kota Sukabumi, Jl. Ciaul Pasir No. 126, Subangjaya, Cikole
  {
    id: 'kota_sukabumi',
    kabKota: 'Kota Sukabumi',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Sukabumi',
    alamat: 'Jl. Ciaul Pasir No. 126, Kel. Subangjaya, Kec. Cikole, Kota Sukabumi, Jawa Barat 43116',
    telepon: '(0266) 245223',
    lat: -6.91375,
    lng: 106.94469,
    wilayahRayon: 'Sukabumi & Cianjur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.91375,106.94469',
  },

  // 16. KABUPATEN CIANJUR
  // Jl. Raya Bandung No. 6, Bojong, Karangtengah, Cianjur
  {
    id: 'kab_cianjur',
    kabKota: 'Kabupaten Cianjur',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Cianjur',
    alamat: 'Jl. Raya Bandung No. 6, Kel. Bojong, Kec. Karangtengah, Kabupaten Cianjur, Jawa Barat 43281',
    telepon: '(0263) 262464',
    lat: -6.80296,
    lng: 107.17144,
    wilayahRayon: 'Sukabumi & Cianjur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.80296,107.17144',
  },

  // 17. KABUPATEN GARUT
  // OSM Node: 5678511131 (Dinas Sosial Kabupaten Garut, Jl. Patriot No. 14, Sukagalih)
  {
    id: 'kab_garut',
    kabKota: 'Kabupaten Garut',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Garut',
    alamat: 'Jl. Patriot No. 14, Kel. Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151',
    telepon: '(0262) 233157',
    lat: -7.20096,
    lng: 107.88593,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-7.20096,107.88593',
  },

  // 18. KABUPATEN TASIKMALAYA
  // Kompleks Pemkab Tasikmalaya, Jl. Sukapura, Bojongkoneng, Singaparna
  {
    id: 'kab_tasikmalaya',
    kabKota: 'Kabupaten Tasikmalaya',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial, PPKB P3A Kabupaten Tasikmalaya',
    alamat: 'Kompleks Pemkab Tasikmalaya, Jl. Sukapura, Bojongkoneng, Kec. Singaparna, Kabupaten Tasikmalaya, Jawa Barat 46415',
    telepon: '(0265) 333156',
    lat: -7.35895,
    lng: 108.11001,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-7.35895,108.11001',
  },

  // 19. KOTA TASIKMALAYA
  // Kompleks Bale Kota Tasikmalaya, Jl. Letnan Harun No. 1, Bungursari
  {
    id: 'kota_tasikmalaya',
    kabKota: 'Kota Tasikmalaya',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Tasikmalaya',
    alamat: 'Bale Kota Tasikmalaya, Jl. Letnan Harun No. 1, Kel. Sukamulya, Kec. Bungursari, Kota Tasikmalaya, Jawa Barat 46134',
    telepon: '(0265) 7523616',
    lat: -7.30811,
    lng: 108.19546,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-7.30811,108.19546',
  },

  // 20. KABUPATEN CIAMIS
  // OSM Way: 354712271 (Jl. Tentara Pelajar No. 24, Ciamis)
  {
    id: 'kab_ciamis',
    kabKota: 'Kabupaten Ciamis',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Ciamis',
    alamat: 'Jl. Tentara Pelajar No. 24, Kel. Ciamis, Kec. Ciamis, Kabupaten Ciamis, Jawa Barat 46211',
    telepon: '(0265) 771038',
    lat: -7.32904,
    lng: 108.35179,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-7.32904,108.35179',
  },

  // 21. KOTA BANJAR
  // OSM Way: Dinas Sosial dan P2A Kota Banjar, Jl. Gerilya No. 19, Mekarsari
  {
    id: 'kota_banjar',
    kabKota: 'Kota Banjar',
    type: 'Kota',
    namaDinas: 'Dinas Sosial P3A Kota Banjar',
    alamat: 'Jl. Gerilya No. 19, Kel. Mekarsari, Kec. Banjar, Kota Banjar, Jawa Barat 46321',
    telepon: '(0265) 744318',
    lat: -7.37676,
    lng: 108.51890,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-7.37676,108.51890',
  },

  // 22. KABUPATEN PANGANDARAN
  // OSM Way: 706855577 (Dinas Sosial dan Pemberdayaan Masyarakat Desa Kab. Pangandaran)
  {
    id: 'kab_pangandaran',
    kabKota: 'Kabupaten Pangandaran',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial PMD Kabupaten Pangandaran',
    alamat: 'Jl. Raya Cijulang - Parigi, Desa Karangbenda, Kec. Parigi, Kabupaten Pangandaran, Jawa Barat 46393',
    telepon: '(0265) 639145',
    lat: -7.70291,
    lng: 108.49537,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-7.70291,108.49537',
  },

  // 23. KABUPATEN SUMEDANG
  // Jl. Mayor Abdurahman No. 200, Kotakaler, Sumedang Utara
  {
    id: 'kab_sumedang',
    kabKota: 'Kabupaten Sumedang',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Sumedang',
    alamat: 'Jl. Mayor Abdurahman No. 200, Kel. Kotakaler, Kec. Sumedang Utara, Kabupaten Sumedang, Jawa Barat 45322',
    telepon: '(0261) 201248',
    lat: -6.83579,
    lng: 107.92840,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.83579,107.92840',
  },

  // 24. KABUPATEN INDRAMAYU
  // Jl. Pabean Udik No. 268, Pabeanudik, Indramayu
  {
    id: 'kab_indramayu',
    kabKota: 'Kabupaten Indramayu',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Indramayu',
    alamat: 'Jl. Pabean Udik No. 268, Kel. Pabean Udik, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45219',
    telepon: '(0234) 271019',
    lat: -6.31610,
    lng: 108.32764,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.31610,108.32764',
  },

  // 25. KABUPATEN CIREBON
  // OSM Way: 222075248 (Jl. Sunan Drajat No. 16, Sumber, Cirebon)
  {
    id: 'kab_cirebon',
    kabKota: 'Kabupaten Cirebon',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Cirebon',
    alamat: 'Jl. Sunan Drajat No. 16, Kel. Sumber, Kec. Sumber, Kabupaten Cirebon, Jawa Barat 45611',
    telepon: '(0231) 321151',
    lat: -6.76163,
    lng: 108.47692,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.76163,108.47692',
  },

  // 26. KOTA CIREBON
  // OSM Way: 1426554214 (Dinas Sosial Kota Cirebon, Komplek Stadion Bima, Sunyaragi, Kesambi)
  {
    id: 'kota_cirebon',
    kabKota: 'Kota Cirebon',
    type: 'Kota',
    namaDinas: 'Dinas Sosial P3A Kota Cirebon',
    alamat: 'Jl. Brigjen Dharsono No. 5, Kel. Sunyaragi, Kec. Kesambi, Kota Cirebon, Jawa Barat 45132',
    telepon: '(0231) 486867',
    lat: -6.72936,
    lng: 108.53815,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.72936,108.53815',
  },

  // 27. KABUPATEN MAJALENGKA
  // Jl. Raya KH. Abdul Halim No. 498, Tonjong / Cigasong, Majalengka
  {
    id: 'kab_majalengka',
    kabKota: 'Kabupaten Majalengka',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Majalengka',
    alamat: 'Jl. Raya KH. Abdul Halim No. 498, Kel. Tonjong / Cigasong, Kec. Cigasong, Kabupaten Majalengka, Jawa Barat 45476',
    telepon: '(0233) 281033',
    lat: -6.83234,
    lng: 108.24614,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.83234,108.24614',
  },

  // 28. KABUPATEN KUNINGAN
  // OSM Way: 533768484 (Jl. Pramuka KM 6, Purwawinangun, Kuningan)
  {
    id: 'kab_kuningan',
    kabKota: 'Kabupaten Kuningan',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Kuningan',
    alamat: 'Jl. Pramuka KM 6, Kel. Purwawinangun, Kec. Kuningan, Kabupaten Kuningan, Jawa Barat 45512',
    telepon: '(0232) 871661',
    lat: -6.97429,
    lng: 108.48186,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.97429,108.48186',
  },
];
