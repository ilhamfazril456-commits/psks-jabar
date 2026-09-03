import { UserRole } from '../types';

export const EXACT_QUESTION_ANSWERS: Record<string, string> = {
  // === USER QUESTIONS ===
  'u-1': `Aplikasi **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat** ini dibuat dan diarsiteki oleh **Ilham Fazril** (Full Stack Developer & Software Architect).\n\nAplikasi ini dibangun menggunakan arsitektur modern **React 18 SPA, Vite, Express Proxy, Tailwind CSS, Google Gemini Flash AI, serta Cloud Firestore Database** untuk mendukung digitalisasi tata kelola 10 pilar kesejahteraan sosial Dinas Sosial Provinsi Jawa Barat.`,

  'u-2': `**Fungsi & Tujuan Utama Website PSKS Jabar**:
1. **Pusat Satu Data PSKS**: Mengintegrasikan data personil dan kelembagaan 10 pilar kesejahteraan sosial di 27 Kabupaten/Kota secara akurat dan real-time.
2. **Pelayanan Publik & Transparansi**: Memudahkan masyarakat memantau potensi sosial, peta sebaran relawan, dan kontak rujukan sosial di wilayahnya.
3. **Pemberdayaan & Mitigasi Sosial**: Mendukung koordinasi penyelenggaraan kesejahteraan sosial secara digital dan terpusat.
4. **Percepatan Penanganan Masalah Sosial**: Menghubungkan relawan TAGANA, TKSK, PSM, LKS, Karang Taruna, dan pilar lainnya dengan Dinas Sosial Prov. Jabar.`,

  'u-3': `**Cara Masyarakat Mengakses Data Potensi Kesejahteraan Sosial**:
1. **Melalui Peta Spasial Beranda**: Pilih menu Beranda, gunakan dropdown 27 Kabupaten/Kota atau klik langsung pada peta interaktif Jawa Barat untuk melihat sebaran relawan dan lembaga sosial.
2. **Katalog 10 Pilar**: Buka menu Pilar Sosial untuk membaca profil tugas, fungsi, dasar hukum, dan keaktifan masing-masing pilar.
3. **Pencarian Cepat**: Gunakan kolom filter pencarian berdasarkan pilar atau nama kecamatan untuk menemukan informasi data personil publik secara presisi.`,

  'u-4': `**Cara Mendaftar Akun User / Relawan Baru di PSKS JABAR**:
1. Klik tombol **Pusat Akun / Masuk** di navigasi atas.
2. Pilih tab **Daftar Akun Baru**.
3. Masukkan identitas lengkap (Nama Lengkap, NIK 16 Digit, Email, Nomor WhatsApp, Wilayah Kabupaten/Kota, dan PIN 6 Digit).
4. Klik **Daftar Sekarang**. Setelah pop up berhasil muncul, klik **Masuk Ke Akun** untuk diarahkan ke halaman login.
5. Akun Anda akan masuk ke proses verifikasi oleh Admin Daerah/Superadmin untuk mendapatkan status **SAH_TERDAFTAR**.`,

  'u-5': `**Biaya Layanan Informasi Publik di PSKS JABAR**:
- Seluruh layanan di dalam aplikasi PSKS Jabar, termasuk pencarian data, pemantauan sebaran relawan, dan konsultasi informasi adalah **100% GRATIS (Tanpa Dipungut Biaya Apapun)**.
- Layanan ini merupakan fasilitas pelayanan publik resmi dari Pemerintah Provinsi Jawa Barat melalui Dinas Sosial.`,

  'u-6': `**Kontak Bantuan Cepat & Floating WhatsApp Dinsos Jabar**:
- **Tombol WhatsApp Melayang**: Klik ikon WhatsApp melayang di pojok kanan bawah layar untuk langsung terhubung dengan admin layanan Dinsos Jabar.
- **Alamat Kantor Resmi**: Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522
- **Telepon Hotline**: (022) 6641564
- **Email Resmi**: dinsos@jabarprov.go.id
- **Website Portal**: dinsos.jabarprov.go.id`,

  'u-7': `**Kebijakan Privasi & Perlindungan Data Pribadi (UU PDP No. 27/2022)**:
1. **Perlindungan NIK & Data Sensitif**: Data NIK/NIP dan nomor kontak pribadi aparatur dilindungi melalui enkripsi sistem dan disamarkan (*masked*) pada tampilan publik.
2. **Enkripsi Kredensial**: Seluruh sandi dan PIN akun diamankan menggunakan algoritma hashing **Bcrypt Salt 10-Rounds**.
3. **Hak Akses Berjenjang (RBAC)**: Hanya petugas berwenang dengan mandat SK resmi yang dapat mengakses data administratif lengkap di wilayah tugasnya.`,

  'u-8': `**Cara Melihat Pengumuman & Berita Terbaru Dinsos Jabar**:
1. **Popup Pengumuman Siaga (Floating Modal)**: Setiap ada pengumuman darurat, sistem akan otomatis menampilkan popup siaga di layar Beranda.
2. **Menu Pengumuman**: Klik menu Pengumuman di navigasi untuk membaca arsip rilis resmi, panduan teknis, dan edaran Kepala Dinas Sosial Provinsi Jawa Barat.
3. **Teks Berjalan Beranda**: Pengumuman penting juga disematkan pada baris pengumuman atas.`,

  'u-9': `**10 Pilar Utama Potensi & Sumber Kesejahteraan Sosial (PSKS) Jawa Barat**:
1. **PKSP (Pekerja Sosial Profesional)**: Tenaga berkeahlian formal berlisensi sertifikasi profesi resmi.
2. **PSM (Pekerja Sosial Masyarakat)**: Relawan sosial berbasis desa/kelurahan (Permensos No. 10/2019).
3. **TAGANA (Taruna Siaga Bencana)**: Relawan tanggap darurat bencana alam, posko, dan dapur umum (Linjamsos).
4. **LKS (Lembaga Kesejahteraan Sosial)**: Yayasan/organisasi rehabilitasi dan pelayanan sosial berbadan hukum.
5. **Karang Taruna (KT)**: Organisasi kepemudaan desa pelopor pembinaan generasi muda & UEP (Permensos No. 25/2019).
6. **LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)**: Layanan konseling keluarga, mediasi krisis, dan ketahanan keluarga.
7. **PENSOS (Penyuluh Sosial Masyarakat)**: Kader komunikasi penyuluhan program-program sosial Dinsos.
8. **TKSK (Tenaga Kesejahteraan Sosial Kecamatan)**: Pendamping fungsional 1 orang per kecamatan koordinator DTKS & bansos.
9. **KUBE & Badan Usaha Sosial**: Usaha ekonomi gotong royong pemberdayaan keluarga miskin.
10. **SLRT / Puskesos**: Pusat layanan rujukan terpadu satu pintu untuk keluhan warga miskin.`,

  'u-10': `**Tugas, Peran & Fungsi Pekerja Sosial Masyarakat (PSM)**:
- **Definisi**: Warga masyarakat yang atas dasar rasa kesadaran dan tanggung jawab sosial berinisiatif mengabdi di bidang kesejahteraan sosial di tingkat desa/kelurahan.
- **Tugas Pokok**:
  1. Melakukan pendataan awal Pemerlu Pelayanan Kesejahteraan Sosial (PPKS/PMKS).
  2. Memberikan pendampingan sosial bagi lansia terlantar, anak yatim piatu, dan penyandang disabilitas.
  3. Menjadi penghubung warga kurang mampu ke Dinas Sosial dan Puskesos setempat.
- **Landasan Hukum**: Permensos RI No. 10 Tahun 2019.`,

  'u-11': `**Peran & Kesiapsiagaan TAGANA di Jawa Barat**:
- **Pra-Bencana**: Melakukan sosialisasi Kampung Siaga Bencana (KSB), edukasi mitigasi di sekolah (Tagana Masuk Sekolah), dan pemetaan jalur evakuasi rawan bencana di Jabar.
- **Saat Bencana**: Mengoperasikan Mobil Dapur Umum Lapangan (Dumlap), mendirikan tenda pengungsian, pencarian/evakuasi dasar, dan pendataan korban.
- **Pasca-Bencana**: Layanan Dukungan Psikososial (LDP) bagi anak/keluarga korban bencana dan distribusi logistik lanjutan. Terkoordinasi langsung di bawah Bidang Linjamsos Dinsos Jawa Barat.`,

  'u-12': `**Lembaga Kesejahteraan Sosial (LKS) & Syarat Pendaftaran**:
- **Definisi**: Organisasi sosial atau perkumpulan sosial yang berbadan hukum yang melaksanakan penyelenggaraan kesejahteraan sosial.
- **Syarat Registrasi di PSKS JABAR**:
  1. Akta Notaris pendirian berbadan hukum Kemenkumham RI.
  2. Tanda Daftar Yayasan (TDY) / Izin Operasional dari Dinas Sosial.
  3. Memiliki susunan pengurus aktif, alamat sekretariat yang jelas, dan data warga binaan yang terdaftar.`,

  'u-13': `**Peran Strategis Karang Taruna dalam Pemberdayaan Pemuda**:
- **Fungsi Utama**: Wadah pengembangan generasi muda non-partisan di tingkat desa/kelurahan yang bergerak di bidang pencegahan masalah sosial, olahraga, seni budaya, dan penumbuhan Usaha Ekonomi Produktif (UEP).
- **Landasan Hukum**: Permensos RI No. 25 Tahun 2019.`,

  'u-14': `**Layanan Lembaga Konsultasi Kesejahteraan Keluarga (LK3)**:
1. **Konseling Psikososial**: Konsultasi masalah keharmonisan keluarga, pengasuhan anak, dan relasi pasutri.
2. **Mediasi Krisis & KDRT**: Pendampingan dan mediasi bagi korban kekerasan dalam rumah tangga bekerja sama dengan unit PPA.
3. **Penguatan Ketahanan Keluarga**: Edukasi ketahanan ekonomi dan sosial keluarga menuju keluarga sejahtera.`,

  'u-15': `**Perbedaan Utama TKSK vs PSM**:
- **TKSK (Tenaga Kesejahteraan Sosial Kecamatan)**: Bertugas 1 (satu) orang di setiap kecamatan sebagai koordinator fungsional program Kemensos/Dinsos, verifikator DTKS, dan pendamping program sembako/bansos.
- **PSM (Pekerja Sosial Masyarakat)**: Relawan sosial yang berbasis di tiap desa/kelurahan, bertugas langsung melakukan penjangkauan harian kepada warga binaan.`,

  'u-16': `**Fungsi SLRT / Puskesos**:
- **Puskesos (Pusat Kesejahteraan Sosial)** di desa/kelurahan dan **SLRT (Sistem Layanan dan Rujukan Terpadu)** di kabupaten/kota bertindak sebagai layanan satu pintu (*one-stop social service*).
- Menampung keluhan masyarakat miskin mengenai kepesertaan bansos (KIS/PBI, KIP, PKH, BPNT) dan memberikan rujukan instan ke dinas terkait.`,

  'u-17': `**KUBE (Kelompok Usaha Bersama) & Badan Usaha Sosial**:
- **KUBE**: Wadah beranggotakan 5–10 Kepala Keluarga miskin binaan Dinsos yang diberikan stimulus modal usaha produktif bersama (misal: ternak, olahan pangan, kerajinan) agar berdaya dan mandiri keluar dari kemiskinan.`,

  'u-18': `**Peran Penyuluh Sosial Masyarakat (PENSOS)**:
- Tokoh masyarakat yang bertugas menyampaikan informasi kebijakan, penyuluhan pencegahan masalah sosial (seperti bahaya narkoba, penelantaran anak, kenakalan remaja), serta advokasi program Dinsos Jawa Barat secara persuasif.`,

  'u-19': `**Pekerja Sosial Profesional (PKSP) & Standar Sertifikasinya**:
- Seseorang yang memiliki keilmuan formal pekerjaan sosial (lulusan D-IV/S1 Kesejahteraan Sosial) dan telah memiliki Sertifikasi Kompetensi Resmi dari Lembaga Sertifikasi Profesi (LSP) serta Surat Izin Praktik Pekerja Sosial (SIPPS) dari Kemensos RI.`,

  'u-20': `**Total Sebaran SDM PSKS Jawa Barat**:
- Sistem PSKS JABAR mengelola puluhan ribu personil dan kelembagaan 10 Pilar yang terdistribusi merata di **27 Kabupaten/Kota, 627 Kecamatan, dan 5.957 Desa/Kelurahan** di seluruh Jawa Barat. Anda dapat mengecek angka rincian per daerah melalui grafik Beranda.`,

  'u-21': `**Cara Membaca Peta Interaktif di Beranda**:
1. Warna wilayah pada peta menunjukkan konsentrasi personil pilar sosial.
2. Klik nama kabupaten/kota untuk membuka popup ringkasan total personil per pilar (Tagana, TKSK, PSM, LKS, dll.).
3. Gunakan filter pilar di atas peta untuk menyorot sebaran satu pilar spesifik.`,

  'u-22': `**Kabupaten/Kota dengan Relawan Tagana Terbanyak**:
- Wilayah dengan personil Tagana tinggi umumnya berada pada daerah dengan indeks risiko bencana alam tinggi (kabupaten pesisir dan pegunungan), seperti Kab. Sukabumi, Kab. Cianjur, Kab. Garut, Kab. Bandung, dan Kab. Tasikmalaya.`,

  'u-23': `**Cakupan Wilayah Jawa Barat di PSKS JABAR**:
- Mencakup **27 Kabupaten/Kota** (18 Kabupaten dan 9 Kota), membawahi **627 Kecamatan** dan **5.957 Desa/Kelurahan** yang telah terstandarisasi kode wilayah Kemendagri.`,

  // === ADMIN QUESTIONS ===
  'a-1': `**SOP Penambahan Personil / Lembaga Pilar Baru (Admin Daerah)**:
1. Buka tab **Kelola Data Pilar** pada Dashboard Admin Daerah Anda.
2. Klik tombol **+ Tambah Personil / Lembaga**.
3. Isi data wajib: Nama Lengkap, NIK/NIP, Pilar Sosial, Kecamatan/Desa, No. SK Penugasan, dan upload pasfoto/dokumen SK.
4. Klik **Simpan Data**. Data seketika tersinkronisasi ke server provinsi dan kartu digital QR langsung siap diterbitkan.`,

  'a-2': `**Cara Memutasi Personil Antar Kecamatan di Daerah Anda**:
1. Pada tabel data pilar, cari nama personil yang akan dimutasi.
2. Klik tombol **Edit / Ubah**.
3. Ubah dropdown Kecamatan dan Desa tujuan penugasan yang baru.
4. Perbarui Nomor SK Mutasi, lalu klik **Simpan Perubahan**. Sistem secara otomatis memperbarui metadata wilayah pada QR Code personil tersebut.`,

  'a-3': `**Pencegahan Duplikasi NIK/NIP oleh Sistem**:
- Saat Admin mengetikkan NIK (16 digit), sistem secara otomatis melakukan query validasi ke koleksi database.
- Jika NIK sudah terdaftar di pilar lain atau daerah lain, form akan memunculkan peringatan merah dan menolak penyimpanan ganda.`,

  'a-4': `**Cara Menonaktifkan Personil Purna Tugas / Wafat**:
1. Buka data personil yang bersangkutan.
2. Ubah status keaktifan dari **Aktif** menjadi **Purna Tugas / Non-Aktif / Wafat**.
3. Isi catatan alasan penonaktifan dan unggah surat keterangan bila ada.
4. Klik Simpan. QR Code personil tersebut otomatis berstatus *TIDAK AKTIF* jika dipindai.`,

  'a-5': `**Bukti Legalitas Wajib Registrasi LKS**:
1. Akta Notaris Pendirian & SK Kemenkumham RI.
2. Izin Operasional / Tanda Daftar Yayasan (TDY) dari Dinas Sosial.
3. Nomor Pokok Wajib Pajak (NPWP) Lembaga.
4. Struktur Pengurus dan Laporan Kegiatan Tahunan.`,

  'a-6': `**Cara Memperbarui SK Penugasan Berkala**:
1. Buka menu Kelola Data Pilar dan pilih filter pilar terkait (misal: TKSK atau PSM).
2. Klik aksi **Perbarui SK**. Masukkan Nomor SK baru dan tanggal masa berlaku SK.
3. Unggah file scan SK berformat PDF/JPG.
4. Simpan, status masa aktif anggota akan diperpanjang secara otomatis di sistem.`,

  'a-7': `**Cara Filtering Data Presisi Berdasarkan Kecamatan/Kelurahan**:
- Gunakan dropdown **Filter Kecamatan** di atas tabel.
- Anda juga dapat menggabungkan filter status keaktifan (Aktif, Menunggu SK, Purna Tugas) dan mengetikkan nama di kotak pencarian instan.`,

  'a-verif-1': `**Alur Verifikasi Berkas Pendaftaran Calon Anggota (Admin Daerah)**:
1. Masuk ke menu **Task Manager / Verifikasi Pendaftaran**.
2. Lihat daftar pendaftaran masuk dari masyarakat/relawan di wilayah Anda.
3. Klik tombol **Periksa Berkas / Detail** untuk memeriksa kecocokan NIK, pasfoto, dan kelengkapan dokumen pendukung.
4. Tentukan keputusan: **Terima Pendaftaran** atau **Tolak Pendaftaran** disertai catatan resmi.`,

  'a-verif-2': `**Fitur Terima Pendaftaran (Approve) di Task Manager**:
- Saat tombol **Terima Pendaftaran** diklik:
  1. Status pendaftar berubah menjadi **Disetujui (SAH_TERDAFTAR)**.
  2. Data otomatis masuk ke database pilar resmi wilayah Anda.
  3. KTA Digital & QR Code anggota langsung diterbitkan dan aktif.
  4. Pengguna menerima konfirmasi status bahwa pendaftarannya telah disetujui.`,

  'a-verif-3': `**Cara Melihat Riwayat Pendaftaran Calon Relawan**:
1. Buka tab **Riwayat Pendaftaran**.
2. Anda dapat melihat seluruh arsip pendaftaran yang telah diverifikasi (Disetujui, Ditolak, Menunggu).
3. Filter berdasarkan tanggal pengajuan atau nama calon relawan untuk mempermudah audit verifikasi.`,

  'a-verif-4': `**Syarat Minimal Keabsahan Dokumen SK Penugasan**:
- Dokumen SK wajib mencantumkan: Nomor SK resmi, tanggal penetapan, nama pejabat penandatangan (Kepala Dinas/Camat/Kades), stempel dinas basah atau TTE (Tanda Tangan Elektronik) tersertifikasi BSrE.`,

  'a-8': `**Cara Ekspor Rekapitulasi Data ke Format Excel (.xlsx)**:
1. Buka tabel data pilar di Dashboard Admin Wilayah.
2. Atur filter wilayah/pilar yang ingin diekspor (atau pilih Semua Data).
3. Klik tombol **Ekspor Excel (.xlsx)** di pojok kanan atas tabel.
4. File spreadsheet resmi dengan format terstandarisasi Dinsos Jabar akan langsung terunduh ke komputer Anda.`,

  'a-9': `**Cara Mencetak Lembar Rekapitulasi PDF Resmi Berkop Dinas**:
1. Klik tombol **Cetak Rekap PDF**.
2. Pilih format layout (Portrait / Landscape) dan sertakan opsi tanda tangan elektronik.
3. Klik tombol Cetak / Simpan PDF. Dokumen siap digunakan untuk bahan pelaporan dinas.`,

  'a-10': `**Analisis Rasio Relawan Sosial per 1.000 Penduduk**:
- Sistem menyediakan indikator rasio kecukupan personil: idealnya minimal 1 PSM per 100 KK pra-sejahtera dan 1 TKSK per kecamatan.
- Data ini membantu Admin memetakan kecamatan mana yang kekurangan tenaga pendamping sosial.`,

  'a-11': `**Penyusunan Data Statistik untuk Musrenbang Daerah**:
- Ekspor ringkasan agregat per pilar dan grafik sebaran per kecamatan dari dashboard untuk lampiran dokumen usulan anggaran kesejahteraan sosial pada Musrenbang Kab/Kota.`,

  'a-17': `**Cara Mengganti PIN Wilayah & Kata Sandi Admin Daerah**:
1. Masuk ke **Pusat Akun** -> tab **Keamanan Akun**.
2. Masukkan PIN Lama Anda.
3. Masukkan PIN Baru 6 digit (hindari kombinasi mudah seperti tanggal lahir/angka berurutan).
4. Klik **Simpan PIN Baru**. Sistem mengenkripsi PIN baru dengan algoritma **Bcrypt Salt 10-Rounds**.`,

  'a-18': `**Penanganan Akun Terkunci Akibat Brute-Force Lockout**:
- Jika salah memasukkan PIN 3 kali berturut-turut, sistem otomatis mengunci akun selama 30 detik.
- Tunggu hingga hitung mundur penguncian selesai. Jika Anda lupa PIN secara permanen, hubungi **Superadmin Provinsi Jawa Barat** untuk permintaan reset PIN resmi.`,

  'a-act-log': `**Cara Melihat Riwayat Aktivitas (Activity Log) Wilayah**:
1. Buka menu **Riwayat Aktivitas / Audit Trail**.
2. Sistem mencatat setiap aksi mutasi: penambahan personil, perubahan data, ekspor Excel, dan riwayat login.
3. Log dilengkapi dengan waktu presisi (timestamp), user ID pelaksana, dan alamat IP.`,

  'a-20': `**Kepatuhan Pengelolaan Data Terhadap UU PDP No. 27/2022**:
- Jangan membagikan tangkapan layar data NIK mentah ke grup publik.
- Pastikan hanya aparatur ber-SK yang mengoperasikan akun Admin Daerah.
- Selalu klik **Keluar (Logout)** setelah selesai menggunakan sistem pada perangkat bersama.`,

  // === SUPERADMIN QUESTIONS ===
  'sa-1': `**Dashboard Agregat 10 Pilar Se-27 Kabupaten/Kota**:
- Superadmin memiliki akses layar pemantauan provinsi terpadu:
  1. Grafik donat akumulasi total PSKS se-Jawa Barat.
  2. Peta sebaran spasial 27 Kab/Kota dengan indikator densitas pilar.
  3. Matriks perbandingan rasio relawan antar wilayah secara real-time.`,

  'sa-mon-admin': `**Fitur Pemantauan Admin (Live Status 27 Kab/Kota)**:
- **Fungsi**: Memantau keaktifan admin dinas sosial di 27 Kabupaten/Kota secara real-time.
- **Indikator Visual**:
  - **Dot Hijau (ONLINE)**: Admin sedang aktif membuka sistem saat ini.
  - **Dot Merah/Abu (OFFLINE)**: Admin sedang tidak aktif, dilengkapi keterangan waktu login terakhir dan durasi sesi.
- **Statistik Wilayah**: Menampilkan total data yang telah diinput dan diverifikasi oleh masing-masing admin daerah.`,

  'sa-3': `**Deteksi Wilayah Surplus & Defisit Relawan**:
- Di dashboard Superadmin, buka modul Analisis Spasial.
- Sistem memberikan tanda warna merah pada kabupaten/kota yang rasio relawan Tagana/TKSK-nya di bawah batas standar mitigasi bencana provinsi.`,

  'sa-4': `**Penyusunan Laporan Tahunan Eksekutif untuk Kepala Dinas**:
- Gunakan fitur **Laporan Eksekutif Tahunan** di menu Laporan Provinsi.
- Sistem secara otomatis mengompilasi statistik 10 pilar, peta sebaran, evaluasi kinerja admin 27 kab/kota, dan rekap bantuan sosial ke dalam dokumen laporan siap cetak.`,

  'sa-user-mgmt': `**Fitur Manajemen Akun Admin (Superadmin & Developer)**:
- **Kontrol Akun Terpadu**:
  1. **Status Akun**: Mengubah status akun antara **ACTIVE** (aktif) dan **FROZEN** (dibekukan).
  2. **Reset Kredensial**: Mengubah kata sandi akun admin daerah dengan standar minimal 12 karakter kombinasi.
  3. **Manajemen Hak Akses**: Mengatur role (Admin Wilayah, Superadmin) dan penugasan 27 Kab/Kota.
  4. **Pencabutan Akun**: Menghapus akun admin yang purna tugas.`,

  'sa-user-analytics': `**Grafik Analitik Akun User (User Account Analytics Chart)**:
- Menampilkan visualisasi data pertumbuhan akun pengguna terdaftar:
  1. **Grafik Pertumbuhan Registrasi**: Tren pendaftaran akun baru per periode waktu.
  2. **Distribusi Status Akun**: Rasio akun berstatus Sah Terdaftar vs Menunggu Verifikasi vs Dibekukan.
  3. **Sebaran Pengguna Per Wilayah**: Pemetaan jumlah pengguna aktif di 27 Kabupaten/Kota.`,

  'sa-5': `**SOP Reset Kata Sandi Admin Daerah**:
1. Buka menu **Manajemen Akun Admin / Pengaturan Superadmin**.
2. Cari nama Kabupaten/Kota admin yang meminta reset.
3. Klik tombol **Edit / Ubah Sandi**. Masukkan kata sandi baru (min 12 karakter kombinasi huruf besar, kecil, angka) dan simpan.
4. Kirimkan kredensial secara aman melalui jalur komunikasi resmi kedinasan.`,

  'sa-6': `**Cara Membuka Blokir Akun Daerah Terbekukan (Unfreeze)**:
1. Pada tabel akun di **Manajemen Akun Admin**, cari akun yang berstatus **FROZEN**.
2. Klik tombol **Buka Blokir (Unfreeze / Aktifkan)**.
3. Status akun seketika kembali **ACTIVE** dan admin wilayah dapat kembali login.`,

  'sa-ann-add': `**Fitur Tambah Pengumuman & Broadcast Darurat**:
1. Masuk ke menu **Kelola Pengumuman**.
2. Klik **+ Tambah Pengumuman Baru**.
3. Isi Judul, Kategori (Penting, Info, Darurat, Sosialisasi), Isi Berita, dan unggah Foto Banner.
4. Pilih opsi penayangan:
   - **Tampilkan Pop-up Beranda (Floating Modal)**: Otomatis muncul di layar utama pengunjung.
   - **Tampilkan di Baris Berjalan**: Muncul di banner running text.
5. Klik **Terbitkan Pengumuman**. Pengumuman langsung live secara realtime.`,

  'sa-wa-float': `**Pengaturan Kontak Floating WhatsApp (Floating WA Manager)**:
1. Buka menu **Pengaturan Floating WA**.
2. Masukkan nomor WhatsApp resmi layanan Dinsos Jabar (misal: \`+6289602421065\`).
3. Tulis pesan template pembuka (contoh: *"Halo Admin Dinsos Jabar, saya ingin bertanya seputar..."*).
4. Klik **Simpan Pengaturan**. Tombol WhatsApp melayang di seluruh website langsung terhubung ke nomor tersebut.`,

  'sa-ann-manage': `**Manajemen & Visibilitas Pengumuman**:
- Superadmin dapat mengedit isi pengumuman, mengubah prioritas (Pin to Top), mengarsipkan pengumuman kedaluwarsa, atau menghapus pengumuman sewaktu-waktu.`,

  'sa-9': `**Cara Mengaktifkan Maintenance Khusus Role User (Publik)**:
1. Buka menu **Saklar Maintenance**.
2. Pada panel **Mode Pemeliharaan Per Role**, aktifkan saklar untuk role **User / Tamu Publik**.
3. Biarkan saklar Admin dan Superadmin tetap menyala (Aktif).
4. Hasil: Pengunjung publik akan melihat layar pemeliharaan, sementara aparatur Admin Daerah tetap dapat bekerja normal.`,

  'sa-10': `**Cara Mengaktifkan Maintenance Granular Per Wilayah (27 Kab/Kota)**:
1. Di menu Saklar Maintenance, buka tab **Granular Wilayah 27 Kab/Kota**.
2. Pilih kabupaten/kota target (misal: *Kabupaten Bandung Barat*).
3. Nyalakan saklar pemeliharaan daerah tersebut.
4. Wilayah lain se-Jawa Barat tetap beroperasi 100% normal tanpa terganggu.`,

  'sa-11': `**Kustomisasi Pesan Banner Maintenance Darurat**:
1. Pada menu Saklar Maintenance, isi kolom **Pesan Kustom Pemeliharaan**.
2. Tulis estimasi waktu selesai (misal: *"Pemeliharaan server data center pukul 01.00 - 03.00 WIB"*).
3. Klik **Simpan Pesan**. Layar maintenance seketika menampilkan pengumuman tersebut.`,

  'sa-12': `**Cara Membaca Log Riwayat Aktivitas (Audit Trail)**:
- Log mencatat setiap aksi secara presisi:
  - **Aksi**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, RESET_PIN, MAINTENANCE_TOGGLE.
  - **Pelaksana**: Nama operator, role, dan wilayah penugasan.
  - **Identitas Teknis**: Alamat IP, browser/user agent, dan timestamp milidetik.
- Membantu melacak akuntabilitas jika terjadi kesalahan input atau investigasi data.`,

  'sa-14b': `**Ekspor Log Audit Trail untuk BPK / Inspektorat**:
- Klik tombol **Ekspor Log Audit (.CSV / .XLSX)** di halaman Riwayat Aktivitas.
- File log terenkripsi siap dilampirkan sebagai bukti kepatuhan audit sistem informasi pemerintahan (SPBE).`,

  'sa-15': `**Integrasi Satu Data Jabar & DTKS Kemensos RI**:
- Data PSKS JABAR telah distandarisasi menggunakan kode referensi wilayah Kemendagri dan format data Satu Data Indonesia (SDI), siap disinkronisasikan secara API ke portal Open Data Jabar dan server DTKS Kemensos RI.`,

  // === DEVELOPER QUESTIONS ===
  'd-1': `**Arsitektur Teknis Full-Stack PSKS JABAR**:
- **Frontend**: React 18 SPA + Vite bundler + Tailwind CSS v4 + Motion animations + Lucide React.
- **Backend**: Node.js + Express proxy server + Google Gen AI SDK (@google/genai).
- **Database**: Cloud Firestore NoSQL Database dengan security rules granular.
- **Kompilasi & Build**: esbuild CJS bundle (\`dist/server.cjs\`) yang siap jalan di Cloud Run container port 3000.`,

  'd-2': `**Modul Developer Control Panel (Ilham Fazril)**:
- Panel eksklusif developer mencakup:
  1. **Telemetri Sistem**: Status memory heap, uptime server, latency Firestore, dan status socket.
  2. **Security Simulator**: Pengujian brute-force lockout, rate limit test, dan sandbox payload JSON.
  3. **Database Inspector**: Raw collection snapshot viewer, backup/export JSON, dan schema validator.
  4. **AI Debugger**: Token counter, latency benchmark Gemini Flash, dan log dialog real-time.`,

  'd-3': `**Alur Autentikasi JWT & Enkripsi Bcrypt**:
- PIN/Password disimpan dalam bentuk hash irreversible menggunakan **Bcrypt dengan Salt Work Factor 10**.
- Sesi login diverifikasi menggunakan state aman dengan timestamp expiry dan proteksi lockout otomatis jika terjadi kesalahan berturut-turut.`,

  'd-4': `**Mekanisme Server Proxy Gemini 3.7 Flash AI**:
- Frontend mengirim payload percakapan ke endpoint \`/api/ai/chat\` di Express server.
- Server menyuntikkan \`SYSTEM_INSTRUCTION\` resmi, konteks sesi (Role, Wilayah, Pilar Aktif), lalu memanggil Google GenAI SDK di sisi server.
- Kunci \`GEMINI_API_KEY\` tersimpan aman di server-side dan tidak pernah terekspos ke browser klien.`,

  'd-5': `**Simulasi Brute-Force Lockout & Pengujian Keamanan**:
- Di Developer Control Panel, gunakan tab **Security Stress Test**.
- Klik tombol *Simulate Failed Logins (3x)* untuk memicu trigger penguncian 30 detik dan memverifikasi aktivasi counter proteksi keamanan.`,

  'd-5b': `**State Management & Optimasi Re-Render Tabel**:
- Menggunakan local React memoization (\`useMemo\`, \`useCallback\`), debounced search inputs, dan virtualized pagination rendering untuk memastikan 100% mulus, licin, dan anti-lag meskipun mengelola ribuan record personil.`,

  'd-6': `**Skema Koleksi NoSQL Cloud Firestore**:
- \`psks_personil\`: Dokumen anggota 10 pilar (NIK, Nama, Pilar, Wilayah, SK, Status).
- \`accounts\`: Kredensial dan profil hak akses (Role, Wilayah, HashPIN, Status [ACTIVE/FROZEN]).
- \`announcements\`: Data pengumuman siaga, floating banner, foto, dan kategori.
- \`system_config\`: Konfigurasi saklar maintenance (global, per-role, per-wilayah), kontak floating WA, dan tema.
- \`activity_logs\`: Audit trail seluruh mutasi data dengan timestamp dan metadata.`,

  'd-7': `**Aturan Keamanan (Firestore Security Rules)**:
- Menerapkan aturan read/write berbasis role:
  - Role \`superadmin\` & \`developer\`: Hak penuh baca/tulis seluruh koleksi.
  - Role \`admin\`: Hak tulis terbatas pada dokumen yang memiliki \`wilayah == request.auth.wilayah\`.
  - Role \`user\`: Hak baca publik untuk data terverifikasi dan hak tulis pengajuan pendaftaran baru.`,

  'd-8': `**Backup & Restore Schema JSON**:
- Developer dapat mengekspor seluruh koleksi database ke dalam format \`backup-psks-snapshot.json\` sekali klik pada Developer Panel dan merestore data cadangan secara instan.`,

  'd-9': `**Strategi Caching Client-Side & Optimasi Query**:
- Menggunakan Firestore SDK offline cache (IndexedDB) dan state in-memory cache untuk meminimalkan tagihan read/write operations dan mempercepat loading UI.`,

  'd-15': `**Proteksi XSS, CSRF & Sanitasi Input**:
- Semua input teks difilter dan disanitasi menggunakan DOMPurify / encoding HTML.
- Header HTTP diamankan dengan proteksi CORS terisolasi dan validasi tipe skema runtime.`,

  'd-16': `**Kriptografi & Masking NIK Sesuai UU PDP No. 27/2022**:
- Data NIK pada tabel publik disamarkan (contoh: \`3204************\`).
- Hanya akun admin resmi yang berwenang yang dapat melihat detail lengkap dengan jejak audit log.`,

  'd-17': `**Verifikasi CI/CD & Build Pipeline**:
- Build pipeline menjalankan \`npm run build\` yang mencakup \`vite build\` untuk frontend dist dan \`esbuild\` untuk bundling backend \`dist/server.cjs\` dengan opsi \`--bundle --platform=node --format=cjs --packages=external\`.`,

  'd-18': `**Arsitektur Failover Multi-Model Gemini**:
- Cascade fallback: \`gemini-3.7-flash\` -> \`gemini-2.5-flash\` -> \`gemini-2.5-flash-lite\` -> Mesin AI Cerdas Lokal Terintegrasi. Menjamin AI 100% selalu online dan merespon instan tanpa pernah error.`,

  'd-19': `**Sistem Anti-Jailbreak & Sanitasi Prompt AI**:
- Sistem dilengkapi filter pencegah manipulasi prompt, penolakan permintaan bocor kode rahasia, serta proteksi identitas developer resmi (**Ilham Fazril**).`,
};
