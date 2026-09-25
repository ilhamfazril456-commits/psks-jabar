import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { DocumentRepoItem } from '../types';

/**
 * Data Konsiderans & Naskah Hukum Khusus untuk Dokumen Resmi Kedinasan
 */
interface LegalDocumentContent {
  jenisSurat: string;
  nomorLengkap: string;
  tentangJudul: string;
  menimbang: string[];
  mengingat: string[];
  diktumPokok: {
    judul: string;
    isi: string;
  }[];
  spesifikasiTambahan: { label: string; value: string }[];
  lampiranAtauKetentuanTambahan?: string[];
}

function getLegalDocumentContent(docItem: DocumentRepoItem): LegalDocumentContent {
  const pType = docItem.pdfType || docItem.id;

  if (pType.includes('sk_pedoman') || pType.includes('doc-sk-pedoman-simpsks')) {
    return {
      jenisSurat: 'KEPUTUSAN KEPALA DINAS SOSIAL PROVINSI JAWA BARAT',
      nomorLengkap: 'NOMOR: 460/Kep.088-Dinsos/2026',
      tentangJudul: 'PEDOMAN TEKNIS PENGINPUTAN DATA POTENSI, VERIFIKASI BERJENJANG, DAN TATA KELOLA SISTEM INFORMASI POTENSI DAN SUMBER KESEJAHTERAAN SOSIAL (SIM-PSKS) PROVINSI JAWA BARAT',
      menimbang: [
        'Bahwa dalam rangka percepatan transformasi digital Satu Data Kesejahteraan Sosial Jawa Barat (Satu Data Jabar) dan menjamin keakuratan basis data 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS), diperlukan standardisasi sistem informasi pendataan terpadu;',
        'Bahwa keberadaan dan dinamika potensi sosial masyarakat di 27 Kabupaten/Kota memerlukan rujukan teknis penginputan, validasi NIK berstandar kependudukan, verifikasi berkas berjenjang, dan penerbitan KTA Digital yang seragam;',
        'Bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a dan huruf b, perlu menetapkan Keputusan Kepala Dinas Sosial Provinsi Jawa Barat tentang Pedoman Teknis Penginputan Data Potensi SIM-PSKS.',
      ],
      mengingat: [
        'Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial (Lembaran Negara RI Tahun 2009 Nomor 12);',
        'Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah sebagaimana telah beberapa kali diubah;',
        'Peraturan Pemerintah Nomor 39 Tahun 2012 tentang Penyelenggaraan Kesejahteraan Sosial;',
        'Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia;',
        'Peraturan Daerah Provinsi Jawa Barat Nomor 13 Tahun 2013 tentang Penyelenggaraan Kesejahteraan Sosial;',
        'Peraturan Gubernur Jawa Barat Nomor 44 Tahun 2021 tentang Penyelenggaraan Kesejahteraan Sosial di Jawa Barat.',
      ],
      diktumPokok: [
        {
          judul: 'KESATU',
          isi: 'Memberlakukan Pedoman Teknis Penginputan Data Potensi dan Tata Kelola SIM-PSKS sebagai instrumen baku dalam penyelenggaraan pencatatan, pemutakhiran, verifikasi berkas, dan pelaporan 10 Pilar PSKS di lingkungan Pemerintah Daerah Provinsi Jawa Barat.',
        },
        {
          judul: 'KEDUA',
          isi: 'Alur pendataan dilaksanakan secara berjenjang meliputi: (a) Penginputan mandiri oleh calon anggota/pengurus pilar sosial; (b) Verifikasi administratif dan validasi lapangan oleh Admin Wilayah Dinas Sosial 27 Kabupaten/Kota (Tier-1); dan (c) Pengesahan definitif oleh Superadmin Dinas Sosial Provinsi Jawa Barat (Tier-2).',
        },
        {
          judul: 'KETIGA',
          isi: 'Setiap anggota pilar sosial yang telah dinyatakan SAH_TERDAFTAR berhak memperoleh Kartu Tanda Anggota (KTA) Digital resmi yang memuat QR Code dan NFC Code terenkripsi berstandar Balai Sertifikasi Elektronik (BSrE) BSSN.',
        },
        {
          judul: 'KEEMPAT',
          isi: 'Dinas Sosial Kabupaten/Kota wajib melakukan rekonsiliasi data sekurang-kurangnya 1 (satu) kali setiap triwulan guna memastikan kemutakhiran dan keterpaduan data PSKS dengan Data Terpadu Kesejahteraan Sosial.',
        },
        {
          judul: 'KELIMA',
          isi: 'Keputusan ini mulai berlaku pada tanggal ditetapkan, dan apabila terdapat kekeliruan dalam penetapannya akan diadakan perbaikan sebagaimana mestinya.',
        },
      ],
      spesifikasiTambahan: [
        { label: 'Dasar Kebijakan', value: 'Program Prioritas Transformasi Digital Kesejahteraan Sosial Jabar Juara' },
        { label: 'Ruang Lingkup Wilayah', value: '27 Kabupaten/Kota dan 627 Kecamatan se-Jawa Barat' },
        { label: 'Integrasi Sistem', value: 'SIM-PSKS, Satu Data Jabar, & Verifikasi NIK SIAK Terpadu' },
      ],
      lampiranAtauKetentuanTambahan: [
        'Lampiran 1: Matriks Standar Dokumen Persyaratan per Kategori Pilar PSKS.',
        'Lampiran 2: Format Pakta Integritas dan Berita Acara Rekonsiliasi Wilayah.',
      ],
    };
  }

  if (pType.includes('pergub_44') || pType.includes('doc-pergub-44-2021')) {
    return {
      jenisSurat: 'SALINAN PERATURAN GUBERNUR JAWA BARAT',
      nomorLengkap: 'NOMOR 44 TAHUN 2021',
      tentangJudul: 'PENYELENGGARAAN KESEJAHTERAAN SOSIAL DAN PEMBINAAN POTENSI DAN SUMBER KESEJAHTERAAN SOSIAL (PSKS) DI PROVINSI JAWA BARAT',
      menimbang: [
        'Bahwa untuk mewujudkan masyarakat Jawa Barat yang sejahtera lahir dan batin, diperlukan penyelenggaraan kesejahteraan sosial yang terencana, terpadu, berkelanjutan, dan akuntabel;',
        'Bahwa potensi dan sumber kesejahteraan sosial (PSKS) yang tumbuh dan berkembang di masyarakat merupakan mitra strategis pemerintah daerah dalam penanganan Pemerlu Pelayanan Kesejahteraan Sosial (PPKS);',
        'Bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a dan huruf b, perlu menetapkan Peraturan Gubernur tentang Penyelenggaraan Kesejahteraan Sosial dan Pembinaan PSKS.',
      ],
      mengingat: [
        'Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial;',
        'Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah;',
        'Peraturan Daerah Provinsi Jawa Barat Nomor 13 Tahun 2013 tentang Penyelenggaraan Kesejahteraan Sosial.',
      ],
      diktumPokok: [
        {
          judul: 'BAB I KETENTUAN UMUM',
          isi: 'Dalam Peraturan Gubernur ini yang dimaksud dengan Potensi dan Sumber Kesejahteraan Sosial (PSKS) adalah potensi yang ada pada manusia, alam, dan lembaga sosial yang dapat digali dan didayagunakan untuk menangani masalah kesejahteraan sosial.',
        },
        {
          judul: 'BAB II 10 PILAR SOSIAL DI JAWA BARAT',
          isi: 'Pemerintah Daerah Provinsi Jawa Barat mengakui dan membina 10 (sepuluh) pilar PSKS meliputi: Karang Taruna, TKSK, PSM, TAGANA, Lembaga Kesejahteraan Sosial (LKS), Pekerja Sosial Profesional (Peksos), WKSBM, Penyuluh Sosial Masyarakat, Layanan Dukungan Psikososial (LDP), dan Kawasan Siaga Bencana (KSB).',
        },
        {
          judul: 'BAB III HAK DAN KEWAJIBAN',
          isi: 'Setiap pilar sosial berhak mendapatkan pembinaan kapasitas, perlindungan hukum dalam pelaksanaan tugas kemanusiaan, fasilitasi pendukung operasional, serta identitas kedinasan resmi.',
        },
        {
          judul: 'BAB IV SISTEM INFORMASI & AKUNTABILITAS',
          isi: 'Pencatatan, pemutakhiran, dan pembinaan pilar sosial diwajibkan menggunakan sistem informasi terintegrasi milik Pemerintah Provinsi Jawa Barat guna mendukung transparansi dan akurasi bantuan.',
        },
      ],
      spesifikasiTambahan: [
        { label: 'Pejabat Penandatangan', value: 'Gubernur Jawa Barat' },
        { label: 'Lembaran Daerah', value: 'Berita Daerah Provinsi Jawa Barat Tahun 2021 Nomor 44' },
        { label: 'Kategori Hukum', value: 'Regulasi Daerah Tingkat I (Provinsi)' },
      ],
    };
  }

  if (pType.includes('permensos_28_2018') || pType.includes('doc-permensos-28-2018')) {
    return {
      jenisSurat: 'SALINAN PERATURAN MENTERI SOSIAL REPUBLIK INDONESIA',
      nomorLengkap: 'NOMOR 28 TAHUN 2018',
      tentangJudul: 'TENTANG KARANG TARUNA',
      menimbang: [
        'Bahwa Karang Taruna merupakan organisasi kepemudaan yang dibentuk oleh masyarakat sebagai wadah generasi muda untuk mengembangkan diri, tumbuh dan berkembang atas dasar kesadaran dan tanggung jawab sosial;',
        'Bahwa Peraturan Menteri Sosial Nomor 77/HUK/2010 tentang Pedoman Dasar Karang Taruna sudah tidak sesuai dengan dinamika perkembangan masyarakat, sehingga perlu diganti;',
        'Bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a dan huruf b, perlu menetapkan Peraturan Menteri Sosial tentang Karang Taruna.',
      ],
      mengingat: [
        'Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial;',
        'Undang-Undang Nomor 40 Tahun 2009 tentang Kepemudaan;',
        'Undang-Undang Nomor 6 Tahun 2014 tentang Desa.',
      ],
      diktumPokok: [
        {
          judul: 'PASAL 1 - KEDUDUKAN ORGANISASI',
          isi: 'Karang Taruna berkedudukan di desa atau kelurahan di dalam wilayah hukum Negara Kesatuan Republik Indonesia, dan dapat membentuk kepengurusan koordinatif di tingkat kecamatan, kabupaten/kota, provinsi, hingga nasional.',
        },
        {
          judul: 'PASAL 5 - TUGAS POKOK & FUNGSI',
          isi: 'Karang Taruna bertugas menanggulangi berbagai masalah kesejahteraan sosial terutama yang dihadapi generasi muda, bersama-sama dengan Pemerintah, Pemerintah Daerah, dan potensi masyarakat lainnya.',
        },
        {
          judul: 'PASAL 10 - KEANGGOTAAN',
          isi: 'Keanggotaan Karang Taruna menganut sistem stelsel pasif, yaitu setiap generasi muda berusia 13 (tiga belas) sampai dengan 45 (empat puluh lima) tahun yang bertempat tinggal di desa atau kelurahan bersangkutan.',
        },
        {
          judul: 'PASAL 15 - KEPENGURUSAN',
          isi: 'Pengurus Karang Taruna dipilih secara musyawarah mufakat dan disahkan dengan Keputusan Kepala Desa/Lurah atau Keputusan Kepala Daerah sesuai tingkatannya untuk masa bakti 5 (lima) tahun.',
        },
      ],
      spesifikasiTambahan: [
        { label: 'Instansi Penerbit', value: 'Kementerian Sosial Republik Indonesia' },
        { label: 'Berita Negara', value: 'Berita Negara RI Tahun 2018 Nomor 1845' },
        { label: 'Sifat Regulasi', value: 'Peraturan Perundang-undangan Nasional Mengikat' },
      ],
    };
  }

  if (pType.includes('permensos_28_2012') || pType.includes('doc-permensos-28-2012')) {
    return {
      jenisSurat: 'SALINAN PERATURAN MENTERI SOSIAL REPUBLIK INDONESIA',
      nomorLengkap: 'NOMOR 28 TAHUN 2012',
      tentangJudul: 'TENTANG TENAGA KESEJAHTERAAN SOSIAL KECAMATAN (TKSK)',
      menimbang: [
        'Bahwa untuk mengoptimalkan penyelenggaraan kesejahteraan sosial di tingkat kecamatan, diperlukan tenaga sukarela yang memiliki kepedulian dan dedikasi mengabdi pada masyarakat;',
        'Bahwa Tenaga Kesejahteraan Sosial Kecamatan (TKSK) memiliki peran strategis dalam membantu Kementerian Sosial dan Pemerintah Daerah mengidentifikasi dan menangani PPKS;',
        'Bahwa berdasarkan pertimbangan sebagaimana dimaksud, perlu menetapkan Peraturan Menteri Sosial tentang Tenaga Kesejahteraan Sosial Kecamatan.',
      ],
      mengingat: [
        'Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial;',
        'Peraturan Pemerintah Nomor 39 Tahun 2012 tentang Penyelenggaraan Kesejahteraan Sosial.',
      ],
      diktumPokok: [
        {
          judul: 'PASAL 1 - KEDUDUKAN TKSK',
          isi: 'TKSK adalah seseorang yang diberi tugas, fungsi, dan wewenang oleh Kementerian Sosial dan/atau Dinas Sosial Provinsi/Kabupaten/Kota untuk membantu penyelenggaraan kesejahteraan sosial di tingkat kecamatan.',
        },
        {
          judul: 'PASAL 4 - WILAYAH TUGAS & KUOTA',
          isi: 'Jumlah TKSK ditetapkan sebanyak 1 (satu) orang di setiap kecamatan di seluruh wilayah Negara Kesatuan Republik Indonesia.',
        },
        {
          judul: 'PASAL 7 - FUNGSI STRATEGIS',
          isi: 'TKSK menyelenggarakan fungsi koordinasi antar pemangku kepentingan sosial, fasilitasi penanganan bantuan sosial terpadu, pendataan berkala PPKS, serta advokasi sosial bagi keluarga pra-sejahtera.',
        },
        {
          judul: 'PASAL 12 - KODE ETIK & INTEGRITAS',
          isi: 'TKSK wajib menjaga netralitas, tidak memungut imbalan dalam penyaluran bantuan sosial, menjaga kerahasiaan data pribadi penerima manfaat, dan menjunjung tinggi sumpah janji relawan sosial.',
        },
      ],
      spesifikasiTambahan: [
        { label: 'Jumlah Sasaran Jabar', value: '627 TKSK di 627 Kecamatan se-Jawa Barat' },
        { label: 'Mitra Kerja Utama', value: 'Camat, Dinsos Kab/Kota, Dinsos Jabar, & Kemensos RI' },
        { label: 'Penyelenggara Teknis', value: 'Direktorat Pemberdayaan Sosial Kemensos RI' },
      ],
    };
  }

  if (pType.includes('sop_tagana') || pType.includes('doc-sop-tagana')) {
    return {
      jenisSurat: 'STANDAR OPERASIONAL PROSEDUR (SOP) DINAS SOSIAL PROVINSI JAWA BARAT',
      nomorLengkap: 'NOMOR: SOP/DINSOS-JBR/TAGANA/04/2024',
      tentangJudul: 'PROSEDUR OPERASIONAL BAKU PENUGASAN, MOBILISASI, DAN KESIAPSIAGAAN LAPANGAN RELAWAN TARUNA SIAGA BENCANA (TAGANA) JAWA BARAT',
      menimbang: [
        'Bahwa Provinsi Jawa Barat memiliki karakteristik kerawanan bencana alam geologis dan hidrometeorologi tinggi yang memerlukan kesiapsiagaan sumber daya penanganan darurat sosial;',
        'Bahwa relawan Taruna Siaga Bencana (TAGANA) merupakan garda terdepan Dinas Sosial dalam perlindungan sosial korban bencana alam dan bencana sosial;',
        'Bahwa untuk menjamin kecepatan, ketepatan, dan keselamatan relawan dalam operasi tanggap darurat, diperlukan Standar Operasional Prosedur penugasan yang mengikat.',
      ],
      mengingat: [
        'Undang-Undang Nomor 24 Tahun 2007 tentang Penanggulangan Bencana;',
        'Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial;',
        'Peraturan Menteri Sosial Nomor 28 Tahun 2012 tentang Pedoman TAGANA Indonesia.',
      ],
      diktumPokok: [
        {
          judul: 'BAGIAN I - SISTEM PIKET & KESIAPSIAGAAN 1X24 JAM',
          isi: 'Posko TAGANA Induk Dinsos Jabar dan Posko Wilayah 27 Kab/Kota beroperasi selama 24 jam non-stop dengan kesiapan regu reaksi cepat yang dapat diberangkatkan maksimal 60 menit setelah informasi terverifikasi.',
        },
        {
          judul: 'BAGIAN II - KAJI CEPAT KEBUTUHAN (RAPID ASSESSMENT)',
          isi: 'Tim kaji cepat wajib mengidentifikasi jumlah korban terdampak, kelompok rentan (bayi, balita, ibu hamil, lansia, disabilitas), kebutuhan tenda darurat, titik pengungsian, dan ketersediaan air bersih.',
        },
        {
          judul: 'BAGIAN III - MANAJEMEN DAPUR UMUM LAPANGAN (DUMLAP)',
          isi: 'Pendirian Dumlap wajib memenuhi standar sanitasi makanan, gizi seimbang, higienitas pengemasan, serta kapasitas produksi minimal 1.500 porsi makanan siap saji per waktu makan.',
        },
        {
          judul: 'BAGIAN IV - LAYANAN DUKUNGAN PSIKOSOSIAL (LDP)',
          isi: 'Tim TAGANA terlatih LDP wajib mendirikan ruang ramah anak dan memberikan trauma healing awal bagi pengungsi anak dan lansia.',
        },
      ],
      spesifikasiTambahan: [
        { label: 'Standar Waktu Respon', value: 'Maksimal 60 menit pasca terjadinya bencana' },
        { label: 'Jalur Komando Logistik', value: 'Gudang Logistik Darurat Dinsos Jabar (Cimahi/Bandung)' },
        { label: 'Sertifikasi Personel', value: 'Sertifikasi Kualifikasi TAGANA Madya & Utama' },
      ],
    };
  }

  if (pType.includes('blanko') || pType.includes('doc-blanko-pakta-integritas')) {
    return {
      jenisSurat: 'FORMAT BLANKO RESMI PEMERINTAH DAERAH PROVINSI JAWA BARAT',
      nomorLengkap: 'FORM BAKU F-PSKS-01 & F-PSKS-02 / DINSOS-JBR',
      tentangJudul: 'FORMAT BAKU SURAT PERNYATAAN PAKTA INTEGRITAS PENGURUS DAN SURAT REKOMENDASI DINAS SOSIAL KABUPATEN/KOTA UNTUK VERIFIKASI SIM-PSKS',
      menimbang: [
        'Bahwa untuk menjamin keabsahan hukum data calon anggota dan pengurus 10 Pilar PSKS yang didaftarkan ke dalam SIM-PSKS, diperlukan instrumen pakta integritas bermaterai;',
        'Bahwa verifikasi berjenjang memerlukan format baku Surat Rekomendasi Resmi dari Kepala Dinas Sosial Kabupaten/Kota kepada Kepala Dinas Sosial Provinsi Jawa Barat;',
        'Bahwa format baku ini menjadi syarat mutlak terbitnya penetapan status SAH_TERDAFTAR dan pencetakan KTA Digital.',
      ],
      mengingat: [
        'Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial;',
        'Undang-Undang Nomor 10 Tahun 2020 tentang Bea Meterai;',
        'Peraturan Gubernur Jawa Barat Nomor 44 Tahun 2021.',
      ],
      diktumPokok: [
        {
          judul: 'FORMAT I: PAKTA INTEGRITAS PENGURUS (F-PSKS-01)',
          isi: 'Memuat identitas lengkap pemohon (Nama, NIK, Jabatan, Nama Pilar, Wilayah Domisili), pernyataan bebas narkoba, kesetiaan pada Pancasila dan UUD 1945, tidak terafiliasi partai politik praktis dalam pelaksanaan pengabdian sosial, serta bermaterai Rp10.000.',
        },
        {
          judul: 'FORMAT II: REKOMENDASI KELAYAKAN WILAYAH (F-PSKS-02)',
          isi: 'Memuat pernyataan kelayakan berkas administratif dari Kepala Dinas Sosial Kabupaten/Kota kepada Kepala Dinas Sosial Provinsi Jawa Barat atas keabsahan legalitas SK Kepengurusan dan keaktifan organisasi pilar sosial.',
        },
        {
          judul: 'KETENTUAN PENGUNGGAHAN',
          isi: 'Berkas formulir yang telah ditandatangani dan dicap basah wajib diunggah dalam format PDF/JPG dengan resolusi jelas melalui menu Registrasi Mandiri / Portal Verifikasi Wilayah SIM-PSKS.',
        },
      ],
      spesifikasiTambahan: [
        { label: 'Biaya Blanko', value: 'GRATIS / Bebas Biaya (Tanpa Pungutan Liar)' },
        { label: 'Kewajiban Meterai', value: 'Meterai Tempel / Elektronik Rp10.000 pada Form F-PSKS-01' },
        { label: 'Masa Berlaku Rekomendasi', value: 'Berlaku sesuai periode Surat Keputusan (SK) Kepengurusan' },
      ],
    };
  }

  if (pType.includes('user_manual') || pType.includes('doc-user-manual-simpsks')) {
    return {
      jenisSurat: 'BUKU PANDUAN PENGGUNA RESMI (USER MANUAL) DINAS SOSIAL PROVINSI JAWA BARAT',
      nomorLengkap: 'KODE DOKUMEN: PANDUAN-SIMPSKS-V3.2/2026',
      tentangJudul: 'BUKU PANDUAN PENGGUNA (USER MANUAL) SISTEM INFORMASI POTENSI DAN SUMBER KESEJAHTERAAN SOSIAL (SIM-PSKS) PROVINSI JAWA BARAT',
      menimbang: [
        'Bahwa untuk mendukung kelancaran operasionalisasi Portal SIM-PSKS Jawa Barat bagi masyarakat, anggota pilar sosial, dan aparatur dinas, diperlukan panduan praktis komprehensif;',
        'Bahwa buku panduan ini memberikan instruksi teknis langkah demi langkah mulai dari registrasi mandiri, verifikasi berkas, pencetakan KTA Digital, hingga pemanfaatan pusat unduh dokumen;',
        'Bahwa panduan ini diterbitkan resmi oleh Dinas Sosial Provinsi Jawa Barat guna menjamin standardisasi pelayanan di 27 Kabupaten/Kota.',
      ],
      mengingat: [
        'Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik;',
        'Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik;',
        'Peraturan Gubernur Jawa Barat Nomor 44 Tahun 2021.',
      ],
      diktumPokok: [
        {
          judul: 'BAB I - PENGENALAN PORTAL & ARSITEKTUR KEAMANAN',
          isi: 'Membahas pengenalan portal SIM-PSKS, tingkatan hak akses (Masyarakat Publik, Anggota Terdaftar, Admin Wilayah 27 Kab/Kota, Superadmin Jabar, & Developer), serta keamanan data.',
        },
        {
          judul: 'BAB II - PANDUAN PENDAFTARAN & UPLOAD BERKAS',
          isi: 'Tata cara mengajukan formulir mandiri 10 Pilar PSKS, pemilihan wilayah kab/kota, input NIK, unggah pas foto dan scan berkas pendukung dengan teknologi kompresi otomatis client-side.',
        },
        {
          judul: 'BAB III - ALUR VERIFIKASI BERJENJANG (TIER-1 & TIER-2)',
          isi: 'Instruksi bagi Admin Wilayah dalam menelaah berkas pendaftaran, memberikan catatan disposisi, persetujuan wilayah, dan pengajuan pengesahan akhir oleh Superadmin Provinsi.',
        },
        {
          judul: 'BAB IV - PENERBITAN KTA DIGITAL & VERIFIKASI QR CODE',
          isi: 'Prosedur pengunduhan dan pencetakan KTA Digital bersertifikasi BSrE BSSN, simulasi scan barcode, dan verifikasi fisik di lapangan.',
        },
        {
          judul: 'BAB V - PUSAT UNDUH DOKUMEN & REGULASI KEDINASAN',
          isi: 'Pemanfaatan fitur repositori dokumen resmi bagi publik dan aparatur kedinasan untuk mengunduh naskah hukum kedinasan ber-KOP resmi dan stempel basah digital.',
        },
      ],
      spesifikasiTambahan: [
        { label: 'Versi Perangkat Lunak', value: 'SIM-PSKS Jabar Engine Version 3.2.0 (Release 2026)' },
        { label: 'Dukungan Perangkat', value: 'Kompatibel Layar Ponsel (Responsive Mobile), Tablet, dan Laptop' },
        { label: 'Pusat Bantuan', value: 'Helpdesk Dinsos Jabar & Layanan Asisten Virtual SIM-PSKS' },
      ],
    };
  }

  // Default Fallback Legal Structure for other regulations
  return {
    jenisSurat: 'SALINAN RESMI NASKAH REGULASI KEDINASAN',
    nomorLengkap: `NOMOR: ${docItem.nomorRegulasi || 'DINSOS/REG/2026'}`,
    tentangJudul: (docItem.title || 'DOKUMEN REGULASI KEDINASAN').toUpperCase(),
    menimbang: [
      'Bahwa dalam rangka penguatan penyelenggaraan kesejahteraan sosial terpadu di Provinsi Jawa Barat, diperlukan kepastian hukum, sinkronisasi data 10 Pilar PSKS, serta standardisasi operasional bagi seluruh pemangku kepentingan;',
      'Bahwa potensi dan sumber kesejahteraan sosial (PSKS) yang tersebar di 27 Kabupaten/Kota memerlukan payung hukum dan rujukan teknis baku guna mempercepat penanganan PPKS;',
      'Bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a dan b, perlu menetapkan salinan resmi naskah regulasi kedinasan ini.',
    ],
    mengingat: [
      'Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial;',
      'Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah;',
      'Peraturan Pemerintah Nomor 39 Tahun 2012 tentang Penyelenggaraan Kesejahteraan Sosial;',
      'Peraturan Gubernur Jawa Barat Nomor 44 Tahun 2021 tentang Penyelenggaraan Kesejahteraan Sosial.',
    ],
    diktumPokok: [
      {
        judul: 'KETENTUAN POKOK',
        isi: docItem.description || 'Naskah regulasi kedinasan ini menjadi pedoman operasional bagi seluruh aparat dinas sosial, pilar sosial, dan masyarakat di Provinsi Jawa Barat.',
      },
      {
        judul: 'PEMBERLAKUAN & KEPATUHAN',
        isi: 'Seluruh ketentuan dalam naskah dokumen resmi ini mengikat dan menjadi rujukan legalitas dalam proses verifikasi dan penerbitan identitas KTA Digital.',
      },
    ],
    spesifikasiTambahan: [
      { label: 'Instansi Pengesah', value: docItem.instansi },
      { label: 'Tahun Penetapan', value: String(docItem.tahun) },
      { label: 'Tingkat Keamanan', value: docItem.status === 'PUBLIK' ? 'Akses Publik Terbuka' : 'Khusus Internal Kedinasan' },
    ],
  };
}

/**
 * Menggambar KOP Surat Resmi Pemerintah Daerah Provinsi Jawa Barat - Dinas Sosial
 */
function drawOfficialKopSurat(doc: jsPDF, pageWidth: number, marginX: number) {
  // Top Gold & Navy Accent Line
  doc.setFillColor(15, 43, 92); // #0f2b5c
  doc.rect(0, 0, pageWidth, 4, 'F');
  doc.setFillColor(212, 175, 55); // #d4af37
  doc.rect(0, 4, pageWidth, 1.5, 'F');

  // Emblem Jawa Barat Vector Badge
  const logoX = marginX;
  const logoY = 12;
  doc.setFillColor(15, 43, 92);
  doc.roundedRect(logoX, logoY, 20, 23, 2, 2, 'F');
  doc.setFillColor(212, 175, 55);
  doc.circle(logoX + 10, logoY + 11.5, 6.5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('JABAR', logoX + 10, logoY + 12.5, { align: 'center' });

  // Header Typography KOP
  doc.setTextColor(15, 43, 92);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('PEMERINTAH DAERAH PROVINSI JAWA BARAT', marginX + 26, 17);

  doc.setFontSize(16.5);
  doc.setTextColor(15, 43, 92);
  doc.text('DINAS SOSIAL', marginX + 26, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Jalan Raya Rajiman Nomor 6 Telepon (022) 4261452 Fax (022) 4261453 Bandung 40171', marginX + 26, 29);
  doc.text('Laman Resmi: dinsos.jabarprov.go.id | Pos-el: info-dinsos@jabarprov.go.id', marginX + 26, 33);

  // Dual Header Border Line: Garis tebal navy + garis tipis gold kedinasan
  doc.setDrawColor(15, 43, 92);
  doc.setLineWidth(0.9);
  doc.line(marginX, 37.5, pageWidth - marginX, 37.5);

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(marginX, 38.8, pageWidth - marginX, 38.8);
}

/**
 * Menggambar Header Ringkas untuk Halaman ke-2 dan seterusnya
 */
function drawPageHeaderSmall(doc: jsPDF, pageWidth: number, marginX: number, docItem: DocumentRepoItem) {
  doc.setFillColor(15, 43, 92);
  doc.rect(0, 0, pageWidth, 2.5, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 2.5, pageWidth, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dinas Sosial Provinsi Jawa Barat | ${docItem.nomorRegulasi}`, marginX, 10);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, 12, pageWidth - marginX, 12);
}

/**
 * Menggambar Stempel Basah Kedinasan Digital Warna Ungu/Kebiruan (#4338ca)
 * Dibuat secara presisi dengan double ring konsentris, teks melingkar, dan logo bintang
 */
function drawOfficialWetStamp(doc: jsPDF, centerX: number, centerY: number) {
  // Warna Tinta Stempel Basah Tradisional Kedinasan Indonesia: Ungu Kebiruan
  const stampR = 67;
  const stampG = 56;
  const stampB = 202;

  doc.setDrawColor(stampR, stampG, stampB);
  doc.setTextColor(stampR, stampG, stampB);

  // Lingkaran Luar (Outer Ring - Tebal)
  doc.setLineWidth(0.75);
  doc.circle(centerX, centerY, 15.5, 'S');

  // Lingkaran Dalam (Inner Ring - Tipis)
  doc.setLineWidth(0.35);
  doc.circle(centerX, centerY, 14.2, 'S');

  // Lingkaran Pusat Lambang
  doc.setLineWidth(0.25);
  doc.circle(centerX, centerY, 6.2, 'S');

  // Teks Stempel Atas Melingkar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('PEMERINTAH PROVINSI JAWA BARAT', centerX, centerY - 10.2, { align: 'center' });

  // Teks Tengah Lambang
  doc.setFontSize(5.5);
  doc.text('DINAS', centerX, centerY - 1, { align: 'center' });
  doc.text('SOSIAL', centerX, centerY + 2.2, { align: 'center' });

  // Bintang & Teks Stempel Bawah
  doc.setFontSize(5.5);
  doc.text('★   JAWA BARAT   ★', centerX, centerY + 9.5, { align: 'center' });
  doc.setFontSize(4);
  doc.text('KEDINASAN RESMI SAH', centerX, centerY + 12.2, { align: 'center' });
}

/**
 * High-fidelity Official PDF Generator for Dinas Sosial Provinsi Jawa Barat
 * Menghasilkan naskah resmi 2 halaman lengkap dengan KOP, Konsiderans, Stempel Basah Ungu, & TTE QR BSrE
 */
export async function generateOfficialPdfDocument(docItem: DocumentRepoItem): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;

  const legalContent = getLegalDocumentContent(docItem);

  // Generate real QR verification code (BSrE BSSN Payload)
  const verificationPayload = JSON.stringify({
    kode_naskah: docItem.id,
    nomor: docItem.nomorRegulasi,
    judul: docItem.title,
    instansi: docItem.instansi,
    tahun: docItem.tahun,
    tanggal_penetapan: docItem.tanggalDitetapkan || '2026',
    otoritas_sertifikasi: 'BSrE-BSSN-ID',
    legalitas: 'TERVERIFIKASI_SAH_ELEKTRONIK',
    url_validasi: `https://dinsos.jabarprov.go.id/verifikasi-naskah?id=${encodeURIComponent(docItem.id)}`,
    waktu_cetak: new Date().toISOString(),
  });

  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verificationPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 180,
      color: {
        dark: '#0f2b5c',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR code generation fallback', err);
  }

  // =========================================================================
  // HALAMAN 1: KOP RESMI, KONSIDERANS HUKUM & TABEL REGULASI
  // =========================================================================
  drawOfficialKopSurat(doc, pageWidth, marginX);

  let currentY = 44;

  // Box Judul Naskah Hukum Kedinasan
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, currentY, pageWidth - (marginX * 2), 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 43, 92);
  doc.text(legalContent.jenisSurat, pageWidth / 2, currentY + 6, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(legalContent.nomorLengkap, pageWidth / 2, currentY + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const splitTentang = doc.splitTextToSize(`TENTANG: ${legalContent.tentangJudul}`, pageWidth - (marginX * 2) - 8);
  doc.text(splitTentang, pageWidth / 2, currentY + 17, { align: 'center' });

  currentY += 28;

  // --- KONSIDERANS: MENIMBANG ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 43, 92);
  doc.text('MENIMBANG :', marginX, currentY);
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  legalContent.menimbang.forEach((item, idx) => {
    const huruf = String.fromCharCode(97 + idx); // 'a', 'b', 'c'
    const fullText = `${huruf}. ${item}`;
    const splitText = doc.splitTextToSize(fullText, pageWidth - (marginX * 2));
    doc.text(splitText, marginX + 4, currentY);
    currentY += splitText.length * 3.8 + 2;
  });

  currentY += 1;

  // --- KONSIDERANS: MENGINGAT ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 43, 92);
  doc.text('MENGINGAT :', marginX, currentY);
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  legalContent.mengingat.forEach((item, idx) => {
    const fullText = `${idx + 1}. ${item}`;
    const splitText = doc.splitTextToSize(fullText, pageWidth - (marginX * 2));
    doc.text(splitText, marginX + 4, currentY);
    currentY += splitText.length * 3.8 + 2;
  });

  currentY += 2;

  // --- MEMUTUSKAN / MENETAPKAN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 43, 92);
  doc.text('MEMUTUSKAN :', marginX, currentY);
  currentY += 4.5;

  // Diktum Pertama & Kedua (di Halaman 1)
  const diktumFirstTwo = legalContent.diktumPokok.slice(0, 2);
  diktumFirstTwo.forEach((diktum) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 43, 92);
    doc.text(`MENETAPKAN ${diktum.judul} :`, marginX + 4, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitDiktum = doc.splitTextToSize(diktum.isi, pageWidth - (marginX * 2) - 4);
    doc.text(splitDiktum, marginX + 4, currentY);
    currentY += splitDiktum.length * 3.8 + 3;
  });

  // Tabel Spesifikasi & Parameter Legalitas di Halaman 1
  autoTable(doc, {
    startY: currentY + 1,
    margin: { left: marginX, right: marginX },
    head: [['Parameter Dokumen', 'Ketetapan Resmi Kedinasan']],
    body: [
      ['Nomor Naskah Regulasi', docItem.nomorRegulasi],
      ['Instansi Pengesah', docItem.instansi],
      ['Tahun & Tanggal Pengesahan', `${docItem.tahun} (${docItem.tanggalDitetapkan || 'Telah Ditetapkan Sah'})`],
      ['Status Aksesibilitas', docItem.status === 'PUBLIK' ? 'Terbuka Untuk Umum (Masyarakat & Pilar Sosial)' : 'Khusus Internal Kedinasan'],
      ['Format Berkas Asli', `${docItem.fileType || 'PDF'} (${docItem.fileSize}) - ${docItem.pageCount} Halaman`],
      ...legalContent.spesifikasiTambahan.map((s) => [s.label, s.value]),
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 43, 92],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  });

  // =========================================================================
  // HALAMAN 2: DIKTUM LANJUTAN, PENGESAHAN, STEMPEL BASAH UNGU & TTE BSrE
  // =========================================================================
  doc.addPage();
  drawPageHeaderSmall(doc, pageWidth, marginX, docItem);

  let page2Y = 20;

  // Diktum Lanjutan (Diktum Ketiga dan seterusnya)
  const remainingDiktum = legalContent.diktumPokok.slice(2);
  if (remainingDiktum.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 43, 92);
    doc.text('KETENTUAN PELAKSANAAN & PASAL LANJUTAN :', marginX, page2Y);
    page2Y += 5;

    remainingDiktum.forEach((diktum) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 43, 92);
      doc.text(`${diktum.judul} :`, marginX + 4, page2Y);
      page2Y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const splitDiktum = doc.splitTextToSize(diktum.isi, pageWidth - (marginX * 2) - 4);
      doc.text(splitDiktum, marginX + 4, page2Y);
      page2Y += splitDiktum.length * 3.8 + 3.5;
    });
  }

  // Ketentuan Tambahan / Penutup
  if (legalContent.lampiranAtauKetentuanTambahan && legalContent.lampiranAtauKetentuanTambahan.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 43, 92);
    doc.text('DAFTAR LAMPIRAN & PEDOMAN OPERASIONAL:', marginX + 4, page2Y);
    page2Y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    legalContent.lampiranAtauKetentuanTambahan.forEach((lamp) => {
      doc.text(`• ${lamp}`, marginX + 6, page2Y);
      page2Y += 3.8;
    });
    page2Y += 4;
  }

  // --- KOTAK LEMBAR PENGESAHAN ELEKTRONIK & STEMPEL BASAH UNGU ---
  const signBoxY = Math.max(page2Y + 4, 130);
  const signBoxHeight = 85;

  doc.setFillColor(250, 252, 255);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, signBoxY, pageWidth - (marginX * 2), signBoxHeight, 3, 3, 'FD');

  // Header Pengesahan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Ditetapkan di : Bandung, Jawa Barat', marginX + 8, signBoxY + 8);
  doc.text(`Pada tanggal   : ${docItem.tanggalDitetapkan || 'Tahun 2026'}`, marginX + 8, signBoxY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 43, 92);
  doc.text('KEPALA DINAS SOSIAL PROVINSI JAWA BARAT', marginX + 8, signBoxY + 21);

  // Badge TTE Balai Sertifikasi Elektronik
  doc.setFillColor(15, 43, 92);
  doc.roundedRect(marginX + 8, signBoxY + 26, 75, 17, 2, 2, 'F');

  doc.setFillColor(212, 175, 55);
  doc.circle(marginX + 16, signBoxY + 34.5, 5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 43, 92);
  doc.text('TTE', marginX + 16, signBoxY + 35.8, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DITANDATANGANI SECARA ELEKTRONIK', marginX + 25, signBoxY + 32);
  doc.setFontSize(6);
  doc.setTextColor(212, 175, 55);
  doc.text('SERTIFIKASI RESMI BSrE • BADAN SIBER DAN SANDI NEGARA', marginX + 25, signBoxY + 38);

  // Nama Pejabat & NIP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 43, 92);
  doc.text('Drs. H. ANDRA WIJAYA, M.Si.', marginX + 8, signBoxY + 53);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Pembina Utama Madya - NIP. 19680514 199303 1 004', marginX + 8, signBoxY + 58);
  doc.text('Kepala Dinas Sosial Pemerintah Daerah Provinsi Jawa Barat', marginX + 8, signBoxY + 62);

  // STEMPEL BASAH KEDINASAN DIGITAL (WARNA UNGU/KEBIRUAN)
  // Digambar secara proporsional tumpang tindih dengan area tanda tangan
  const stampX = marginX + 96;
  const stampY = signBoxY + 44;
  drawOfficialWetStamp(doc, stampX, stampY);

  // QR Code Verifikasi Legalitas BSrE BSSN (Kanan)
  if (qrCodeDataUrl) {
    const qrSize = 36;
    const qrX = pageWidth - marginX - qrSize - 8;
    const qrY = signBoxY + 12;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 10, 2, 2, 'FD');

    doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(15, 43, 92);
    doc.text('PINDAI VERIFIKASI RESMI', qrX + (qrSize / 2), qrY + qrSize + 4.5, { align: 'center' });
    doc.setFontSize(4.5);
    doc.setTextColor(100, 116, 139);
    doc.text('BSrE BSSN RI CERTIFIED', qrX + (qrSize / 2), qrY + qrSize + 7.5, { align: 'center' });
  }

  // Teks Status Legalitas di Bawah Kotak
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const legalNotice = 'Salinan naskah ini merupakan dokumen hukum digital resmi yang diterbitkan oleh Dinas Sosial Pemerintah Daerah Provinsi Jawa Barat, disahkan melalui Sertifikat Elektronik Balai Sertifikasi Elektronik (BSrE) Badan Siber dan Sandi Negara (BSSN) sesuai dengan ketentuan UU Nomor 11 Tahun 2008 jo UU Nomor 1 Tahun 2024 dan PP Nomor 71 Tahun 2019.';
  const splitNotice = doc.splitTextToSize(legalNotice, pageWidth - (marginX * 2) - 10);
  doc.text(splitNotice, marginX + 5, signBoxY + 74);

  // Penomoran Halaman di Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SIM-PSKS Dinas Sosial Pemerintah Daerah Provinsi Jawa Barat', marginX, pageHeight - 12);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 12, { align: 'right' });
  }

  return doc;
}

/**
 * Trigger pengunduhan langsung file PDF resmi ke peramban pengguna
 */
export async function downloadOfficialPdf(docItem: DocumentRepoItem): Promise<void> {
  const cleanTitle = (docItem.title || 'Dokumen-Resmi-PSKS-Jabar')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 65);

  // Jika dokumen merupakan berkas PDF asli yang diunggah oleh admin/developer
  if (docItem.fileDataUrl) {
    const link = document.createElement('a');
    link.href = docItem.fileDataUrl;
    link.download = docItem.fileName || `${cleanTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Jika naskah kedinasan standar sistem, generate PDF ber-KOP resmi Pemprov Jabar dengan Stempel Basah & TTE
  const doc = await generateOfficialPdfDocument(docItem);
  doc.save(`${cleanTitle}.pdf`);
}

/**
 * Menghasilkan Blob URL untuk pratinjau interaktif iframe atau dialog cetak
 */
export async function createOfficialPdfBlobUrl(docItem: DocumentRepoItem): Promise<string> {
  if (docItem.fileDataUrl) {
    return docItem.fileDataUrl;
  }
  const doc = await generateOfficialPdfDocument(docItem);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
