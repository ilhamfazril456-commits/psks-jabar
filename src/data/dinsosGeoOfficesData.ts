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
  googlePlaceQuery: string;
}

export const DINSOS_GEO_OFFICES: DinsosGeoOffice[] = [
  // 1. KANTOR DINAS SOSIAL PROVINSI JAWA BARAT
  {
    id: 'provinsi_jabar',
    kabKota: 'Provinsi Jawa Barat',
    isProvinsi: true,
    type: 'Provinsi',
    namaDinas: 'Dinas Sosial Provinsi Jawa Barat',
    alamat: 'Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522',
    telepon: '(022) 6641564 / Hotline WA: +62 821-2603-0038',
    email: 'dinsos@jabarprov.go.id',
    lat: -6.88648,
    lng: 107.55395,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Provinsi+Jawa+Barat+Cimahi',
    googlePlaceQuery: 'Dinas Sosial Provinsi Jawa Barat Cimahi',
  },

  // 2. KABUPATEN BANDUNG
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
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Bandung+Soreang',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Bandung Soreang',
  },

  // 3. KABUPATEN BANDUNG BARAT
  {
    id: 'kab_bandung_barat',
    kabKota: 'Kabupaten Bandung Barat',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Bandung Barat',
    alamat: 'Komplek Perkantoran Pemkab Bandung Barat, Gedung D, Jl. Raya Padalarang - Cisarua Km. 2, Mekarsari, Kec. Ngamprah, Kabupaten Bandung Barat 40552',
    telepon: '(022) 82783015',
    lat: -6.84238,
    lng: 107.50993,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Bandung+Barat+Ngamprah',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Bandung Barat Ngamprah',
  },

  // 4. KOTA BANDUNG
  {
    id: 'kota_bandung',
    kabKota: 'Kota Bandung',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Bandung',
    alamat: 'Jl. Babakan Karet (Belakang Rusunawa Rancacili), Kel. Derwati, Kec. Rancasari, Kota Bandung, Jawa Barat 40292',
    telepon: '(022) 2013139 / (022) 7562095',
    lat: -6.96149,
    lng: 107.68037,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Bandung+Babakan+Karet',
    googlePlaceQuery: 'Dinas Sosial Kota Bandung Babakan Karet',
  },

  // 5. KOTA CIMAHI
  {
    id: 'kota_cimahi',
    kabKota: 'Kota Cimahi',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Cimahi',
    alamat: 'Gedung B Lantai 2, Kompleks Perkantoran Pemkot Cimahi, Jl. Rd. Demang Hardjakusumah Blok Jati No. 1, Kel. Cibabat, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40513',
    telepon: '(022) 6654274',
    lat: -6.87047,
    lng: 107.55461,
    wilayahRayon: 'Bandung Raya',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Cimahi+Demang+Hardjakusumah',
    googlePlaceQuery: 'Dinas Sosial Kota Cimahi Demang Hardjakusumah',
  },

  // 6. KABUPATEN BOGOR
  {
    id: 'kab_bogor',
    kabKota: 'Kabupaten Bogor',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Bogor',
    alamat: 'Jl. Bersih No. 1, Komplek Perkantoran Pemda Cibinong, Kel. Tengah, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16914',
    telepon: '(021) 87902288',
    lat: -6.47554,
    lng: 106.82420,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Bogor+Cibinong',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Bogor Cibinong',
  },

  // 7. KOTA BOGOR
  {
    id: 'kota_bogor',
    kabKota: 'Kota Bogor',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Bogor',
    alamat: 'Jl. Merdeka No. 142, RT.03/RW.05, Kel. Ciwaringin, Kec. Bogor Tengah, Kota Bogor, Jawa Barat 16125',
    telepon: '(0251) 8332315',
    lat: -6.58508,
    lng: 106.78807,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Bogor+Jl+Merdeka',
    googlePlaceQuery: 'Dinas Sosial Kota Bogor Jl Merdeka',
  },

  // 8. KOTA DEPOK
  {
    id: 'kota_depok',
    kabKota: 'Kota Depok',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Depok',
    alamat: 'Gedung Dibaleka II Lantai 6, Kompleks Balaikota Depok, Jl. Margonda Raya No. 54, Kel. Depok, Kec. Pancoran Mas, Kota Depok, Jawa Barat 16431',
    telepon: '(021) 7752055',
    lat: -6.39499,
    lng: 106.82089,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Depok+Dibaleka',
    googlePlaceQuery: 'Dinas Sosial Kota Depok Dibaleka',
  },

  // 9. KABUPATEN BEKASI
  {
    id: 'kab_bekasi',
    kabKota: 'Kabupaten Bekasi',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Bekasi',
    alamat: 'Kompleks Perkantoran Pemkab Bekasi, Blok B1 Lt. 2, Desa Sukamahi, Kec. Cikarang Pusat, Kabupaten Bekasi, Jawa Barat 17530',
    telepon: '(021) 89970117',
    lat: -6.36503,
    lng: 107.17443,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Bekasi+Cikarang+Pusat',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Bekasi Cikarang Pusat',
  },

  // 10. KOTA BEKASI
  {
    id: 'kota_bekasi',
    kabKota: 'Kota Bekasi',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Bekasi',
    alamat: 'Jl. Ir. H. Juanda No. 100, Kel. Margahayu, Kec. Bekasi Timur, Kota Bekasi, Jawa Barat 17113',
    telepon: '(021) 8800984',
    lat: -6.24452,
    lng: 107.00603,
    wilayahRayon: 'Bodebek',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Bekasi+Jl+Juanda',
    googlePlaceQuery: 'Dinas Sosial Kota Bekasi Jl Juanda',
  },

  // 11. KABUPATEN KARAWANG
  {
    id: 'kab_karawang',
    kabKota: 'Kabupaten Karawang',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Karawang',
    alamat: 'Jl. Husni Hamid No. 3, Kel. Nagasari, Kec. Karawang Barat, Kabupaten Karawang, Jawa Barat 41312',
    telepon: '(0267) 402917',
    lat: -6.30233,
    lng: 107.30265,
    wilayahRayon: 'Purwasukasi',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Karawang+Husni+Hamid',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Karawang Husni Hamid',
  },

  // 12. KABUPATEN PURWAKARTA
  {
    id: 'kab_purwakarta',
    kabKota: 'Kabupaten Purwakarta',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial, P3A Kabupaten Purwakarta',
    alamat: 'Jl. Taman Pahlawan No. 9, Kel. Purwamekar, Kec. Purwakarta, Kabupaten Purwakarta, Jawa Barat 41119',
    telepon: '0877-2444-7749',
    lat: -6.53701,
    lng: 107.43981,
    wilayahRayon: 'Purwasukasi',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Purwakarta+Taman+Pahlawan',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Purwakarta Taman Pahlawan',
  },

  // 13. KABUPATEN SUBANG
  {
    id: 'kab_subang',
    kabKota: 'Kabupaten Subang',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Subang',
    alamat: 'Jl. D.I. Panjaitan No. 31, Kel. Soklat, Kec. Subang, Kabupaten Subang, Jawa Barat 41211',
    telepon: '(0260) 411425',
    lat: -6.56450,
    lng: 107.76779,
    wilayahRayon: 'Purwasukasi',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Subang+DI+Panjaitan',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Subang DI Panjaitan',
  },

  // 14. KABUPATEN SUKABUMI
  {
    id: 'kab_sukabumi',
    kabKota: 'Kabupaten Sukabumi',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Sukabumi',
    alamat: 'Kompleks Gelanggang Pemuda Cisaat, Jl. Veteran No. 1, Kel. Sukamanah, Kec. Cisaat, Kabupaten Sukabumi, Jawa Barat 43152',
    telepon: '(0266) 245996',
    lat: -6.90862,
    lng: 106.89565,
    wilayahRayon: 'Sukabumi & Cianjur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Sukabumi+Cisaat',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Sukabumi Cisaat',
  },

  // 15. KOTA SUKABUMI
  {
    id: 'kota_sukabumi',
    kabKota: 'Kota Sukabumi',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Sukabumi',
    alamat: 'Jl. Ciaul Pasir No. 126, Kel. Subangjaya, Kec. Cikole, Kota Sukabumi, Jawa Barat 43116',
    telepon: '(0266) 245223',
    lat: -6.91114,
    lng: 106.94554,
    wilayahRayon: 'Sukabumi & Cianjur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Sukabumi+Ciaul+Pasir',
    googlePlaceQuery: 'Dinas Sosial Kota Sukabumi Ciaul Pasir',
  },

  // 16. KABUPATEN CIANJUR
  {
    id: 'kab_cianjur',
    kabKota: 'Kabupaten Cianjur',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Cianjur',
    alamat: 'Jl. Raya Bandung No. 6, Kel. Bojong, Kec. Karangtengah, Kabupaten Cianjur, Jawa Barat 43281',
    telepon: '(0263) 261622',
    lat: -6.80184,
    lng: 107.17553,
    wilayahRayon: 'Sukabumi & Cianjur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Cianjur+Karangtengah',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Cianjur Karangtengah',
  },

  // 17. KABUPATEN GARUT
  {
    id: 'kab_garut',
    kabKota: 'Kabupaten Garut',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Garut',
    alamat: 'Jl. Patriot No. 14, Kel. Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151',
    telepon: '(0262) 233157',
    lat: -7.19809,
    lng: 107.88342,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Garut+Patriot',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Garut Patriot',
  },

  // 18. KABUPATEN TASIKMALAYA
  {
    id: 'kab_tasikmalaya',
    kabKota: 'Kabupaten Tasikmalaya',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial, PPKB P3A Kabupaten Tasikmalaya',
    alamat: 'Kompleks Pemkab Tasikmalaya, Jl. Sukapura, Bojongkoneng, Kec. Singaparna, Kabupaten Tasikmalaya, Jawa Barat 46415',
    telepon: '(0265) 333156',
    lat: -7.36178,
    lng: 108.11236,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Tasikmalaya+Singaparna',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Tasikmalaya Singaparna',
  },

  // 19. KOTA TASIKMALAYA
  {
    id: 'kota_tasikmalaya',
    kabKota: 'Kota Tasikmalaya',
    type: 'Kota',
    namaDinas: 'Dinas Sosial Kota Tasikmalaya',
    alamat: 'Bale Kota Tasikmalaya, Jl. Letnan Harun No. 1, Kel. Sukamulya, Kec. Bungursari, Kota Tasikmalaya, Jawa Barat 46134',
    telepon: '(0265) 7523616',
    lat: -7.30750,
    lng: 108.20206,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Tasikmalaya+Letnan+Harun',
    googlePlaceQuery: 'Dinas Sosial Kota Tasikmalaya Letnan Harun',
  },

  // 20. KABUPATEN CIAMIS
  {
    id: 'kab_ciamis',
    kabKota: 'Kabupaten Ciamis',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Ciamis',
    alamat: 'Jl. Tentara Pelajar No. 24, Kel. Ciamis, Kec. Ciamis, Kabupaten Ciamis, Jawa Barat 46211',
    telepon: '(0265) 771038',
    lat: -7.32860,
    lng: 108.35137,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Ciamis+Tentara+Pelajar',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Ciamis Tentara Pelajar',
  },

  // 21. KOTA BANJAR
  {
    id: 'kota_banjar',
    kabKota: 'Kota Banjar',
    type: 'Kota',
    namaDinas: 'Dinas Sosial P3A Kota Banjar',
    alamat: 'Jl. Gerilya No. 19, Kel. Mekarsari, Kec. Banjar, Kota Banjar, Jawa Barat 46321',
    telepon: '(0265) 744318',
    lat: -7.37656,
    lng: 108.51898,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Banjar+Gerilya',
    googlePlaceQuery: 'Dinas Sosial Kota Banjar Gerilya',
  },

  // 22. KABUPATEN PANGANDARAN
  {
    id: 'kab_pangandaran',
    kabKota: 'Kabupaten Pangandaran',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial PMD Kabupaten Pangandaran',
    alamat: 'Jl. Raya Cijulang - Parigi, Desa Karangbenda, Kec. Parigi, Kabupaten Pangandaran, Jawa Barat 46393',
    telepon: '(0265) 639145',
    lat: -7.69112,
    lng: 108.51157,
    wilayahRayon: 'Priangan Timur',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+PMD+Kabupaten+Pangandaran+Parigi',
    googlePlaceQuery: 'Dinas Sosial PMD Kabupaten Pangandaran Parigi',
  },

  // 23. KABUPATEN SUMEDANG
  {
    id: 'kab_sumedang',
    kabKota: 'Kabupaten Sumedang',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Sumedang',
    alamat: 'Jl. Mayor Abdurahman No. 200, Kel. Kotakaler, Kec. Sumedang Utara, Kabupaten Sumedang, Jawa Barat 45322',
    telepon: '(0261) 201248',
    lat: -6.83741,
    lng: 107.92915,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Sumedang+Mayor+Abdurahman',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Sumedang Mayor Abdurahman',
  },

  // 24. KABUPATEN INDRAMAYU
  {
    id: 'kab_indramayu',
    kabKota: 'Kabupaten Indramayu',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Indramayu',
    alamat: 'Jl. Pabean Udik No. 268, Kel. Pabean Udik, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45219',
    telepon: '(0234) 271019',
    lat: -6.31866,
    lng: 108.32713,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Indramayu+Pabean+Udik',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Indramayu Pabean Udik',
  },

  // 25. KABUPATEN CIREBON
  {
    id: 'kab_cirebon',
    kabKota: 'Kabupaten Cirebon',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Cirebon',
    alamat: 'Jl. Sunan Drajat No. 16, Kel. Sumber, Kec. Sumber, Kabupaten Cirebon, Jawa Barat 45611',
    telepon: '(0231) 321151',
    lat: -6.76073,
    lng: 108.47773,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Cirebon+Sumber',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Cirebon Sumber',
  },

  // 26. KOTA CIREBON
  {
    id: 'kota_cirebon',
    kabKota: 'Kota Cirebon',
    type: 'Kota',
    namaDinas: 'Dinas Sosial P3A Kota Cirebon',
    alamat: 'Jl. Brigjen Dharsono No. 5, Kel. Sunyaragi, Kec. Kesambi, Kota Cirebon, Jawa Barat 45132',
    telepon: '(0231) 486867',
    lat: -6.73017,
    lng: 108.53738,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kota+Cirebon',
    googlePlaceQuery: 'Dinas Sosial Kota Cirebon',
  },

  // 27. KABUPATEN MAJALENGKA
  {
    id: 'kab_majalengka',
    kabKota: 'Kabupaten Majalengka',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Majalengka',
    alamat: 'Jl. Raya KH. Abdul Halim No. 498, Kel. Tonjong / Cigasong, Kec. Cigasong, Kabupaten Majalengka, Jawa Barat 45476',
    telepon: '(0233) 281033',
    lat: -6.83508,
    lng: 108.24688,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Majalengka+KH+Abdul+Halim',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Majalengka KH Abdul Halim',
  },

  // 28. KABUPATEN KUNINGAN
  {
    id: 'kab_kuningan',
    kabKota: 'Kabupaten Kuningan',
    type: 'Kabupaten',
    namaDinas: 'Dinas Sosial Kabupaten Kuningan',
    alamat: 'Jl. Raya Kuningan - Cirebon, Kel. Kasturi, Kec. Kramatmulya, Kabupaten Kuningan, Jawa Barat 45521',
    telepon: '(0232) 871661',
    lat: -6.95044,
    lng: 108.48847,
    wilayahRayon: 'Ciayumajakuning',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dinas+Sosial+Kabupaten+Kuningan+Kramatmulya',
    googlePlaceQuery: 'Dinas Sosial Kabupaten Kuningan Kramatmulya',
  },
];
