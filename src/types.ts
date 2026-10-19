export type UserRole = 'user' | 'admin' | 'superadmin' | 'developer';

export interface UserSession {
  role: UserRole;
  nama: string;
  wilayah: string;
  statusActive: 'SAH_TERDAFTAR' | 'GUEST';
  username?: string;
  userId?: string;
  isDeveloper?: boolean;
  sessionToken?: string;
  loginTimestamp?: number;
  deviceId?: string;
  nik?: string;
  noHp?: string;
  kecamatan?: string;
  pilarId?: string;
}

export interface SocialLinks {
  whatsapp: string;
  instagram: string;
  youtube: string;
  facebook: string;
  tiktok: string;
  email: string;
  x: string;
}

export interface AnnouncementConfig {
  id?: string;
  active: boolean;
  title: string;
  subtitle: string;
  photoUrl: string;
  photoStorageSizeKb?: number;
  actionType: 'content' | 'url';
  content: string;
  linkUrl: string;
  publishedAt: string;
  publishedBy: string;
  updatedAt?: number;
  targetUserWilayah: Record<string, boolean>;
  targetAdminWilayah: Record<string, boolean>;
  targetSuperadmin?: boolean;
  targetDeveloper?: boolean;
  displayDurationSeconds?: number; // 10, 15, 20, 25, 30 seconds
  frameColor?: string; // e.g. '#ffffff', '#043e2e', etc.
  frameBorderColor?: string; // e.g. '#e2e8f0', '#d4af37', etc.
  frameTheme?: 'white' | 'emerald' | 'gold' | 'dark' | 'navy' | 'cream' | 'custom' | string;
}

export interface AppSettings {
  logoUrl?: string;
  bgMode?: 'photo' | 'video';
  bgVideoUrl: string;
  bgPhotoUrl?: string;
  kadinasPhotoUrl: string;
  floatingWaNumber: string;
  floatingWaRegionNumbers?: Record<string, string>;
  floatingWaSuperadminNumber?: string;
  floatingWaDeveloperNumber?: string;
  socialLinks: SocialLinks;
  maintenanceUser: boolean;
  maintenanceAdmin: boolean;
  maintenanceSuperadmin: boolean;
  maintenanceMsgUser: string;
  maintenanceMsgAdmin: string;
  maintenanceMsgSuperadmin: string;
  maintenanceUserWilayah?: Record<string, boolean>;
  maintenanceAdminWilayah?: Record<string, boolean>;
  announcement?: AnnouncementConfig;
  kadinasName?: string;
  profileSubtitle?: string;
  profileGreeting?: string;
  profileBody?: string;
  profileClosing?: string;
  superadminPin?: string;
  developerPin?: string;
  pinSecurityUpdatedAt?: number;
}

export type PillarId =
  | 'peksos'
  | 'psm'
  | 'tagana'
  | 'lks'
  | 'karangtaruna'
  | 'lk3'
  | 'pensos'
  | 'tksk'
  | 'badanusaha'
  | 'slrt_puskesos';

export interface PillarInfo {
  id: PillarId;
  title: string;
  shortName: string;
  subtitle: string;
  icon: string;
  unitLabel: string;
  color: string;
  description: string;
  fields: {
    nikLabel: string;
    certLabel: string;
    hpLabel: string;
  };
}

export interface PSKSDataRecord {
  id: string;
  pillarId?: string;
  wilayah: string; // Kabupaten/Kota / Wilayah Kerja
  kec: string; // Kecamatan
  nama: string; // Nama Orang / Nama Lembaga / Organisasi
  nik: string; // NIK / Nomor Induk / Nomor Tanda Daftar
  sertifikasi: string; // Sertifikat / SK / Bidang / Bentuk
  hp: string; // No HP / Ketua / Operator / Kontak
  lembaga?: 'Lembaga Pemerintah' | 'Swasta' | 'Pemerintah' | 'Masyarakat' | string;
  status: 'Aktif' | 'Siaga' | 'Tidak Aktif' | 'Terdaftar' | string;
  
  // Specific & Shared Pillar Fields
  kelDesa?: string; // Desa / Kelurahan
  jenisWilayah?: 'Desa' | 'Kelurahan' | string; // Khusus SLRT: Desa atau Kelurahan
  alamat?: string; // Alamat Lengkap
  jenisKelamin?: 'Laki-laki' | 'Perempuan' | string;
  predikatTerakhir?: string;
  noTglSertifikatKompetensi?: string;
  noTglSertifikasi?: string;
  sertifikasiKompetensi?: string;
  pendidikan?: string;
  jenjangJabatan?: string;
  instansiBertugas?: string;
  statusPeksos?: 'Pemerintah' | 'Masyarakat' | string;
  jenjangJabatanPemerintah?: string;
  tempatBertugas?: string;
  statusKeaktifan?: 'Aktif' | 'Tidak Aktif' | 'Siaga' | string;
  email?: string;
  nomorKontak?: string;
  bimtekDiikuti?: string;

  // New specific Pillar fields
  masaBakti?: string; // PSM: Masa Bakti
  noSk?: string; // PSM, Karang Taruna: Nomor SK
  statusAktif?: string; // PSM, Tagana, LK3, SLRT PUSKESOS: Status aktif
  nomorInduk?: string; // Tagana: Nomor Induk Anggota
  sertifikat?: string; // Tagana, Pensos: Sertifikat / Sertifikasi
  keahlian?: string; // Tagana: Keahlian Khusus (Water Rescue, Vertical, Logistik, dll)
  pelatihan?: string; // Tagana: Pelatihan (Latsardik, Manajemen Bencana, dll)
  namaLks?: string; // LKS: Nama LKS
  bidangPelayanan?: string; // LKS: Bidang pelayanan (Anak, Lansia, Disabilitas, Napza, dll)
  ketua?: string; // LKS, Karang Taruna, LK3: Nama Ketua
  nomorTandaDaftar?: string; // LKS: Nomor Tanda Daftar (TD-LKS)
  masaBerlaku?: string; // LKS: Masa Berlaku Tanda Daftar
  masaBerlakuSk?: string; // Masa Berlaku
  noSkKeanggotaan?: string; // SK
  namaKarangTaruna?: string; // Karang Taruna: Nama Karang Taruna
  tahunBerdiri?: string; // Karang Taruna, SLRT Puskesos: Tahun Berdiri
  namaLk3?: string; // LK3: Nama LK3
  kontak?: string; // LK3, Badan Usaha: Kontak / Telepon
  jenisLayanan?: string; // LK3: Jenis Layanan Konsultasi
  instansi?: string; // Pensos: Instansi Pembina / Dinas
  jabatan?: string; // Pensos: Jabatan Fungsional Penyuluh
  wilayahKerja?: string; // Pensos: Wilayah Kerja Penyuluhan
  skPengangkatan?: string; // TKSK: SK Pengangkatan Mensos / Kadinsos
  masaTugas?: string; // TKSK: Masa Tugas Aktif
  namaBadanUsaha?: string; // Badan Usaha: Nama Perusahaan / Badan Usaha
  jenisUsaha?: string; // Badan Usaha: Jenis Usaha (Manufaktur, Jasa, Perbankan, BUMN, dll)
  bentukCsr?: string; // Badan Usaha: Bentuk Program CSR
  bidangBantuan?: string; // Badan Usaha: Bidang Bantuan Sosial
  namaSlrt?: string; // SLRT PUSKESOS: Nama SLRT / Sekretariat Puskesos
  operator?: string; // SLRT PUSKESOS: Nama Operator Puskesos

  // Berkas Foto Pendukung
  berkasFotoUrl?: string;
  berkasFotoNama?: string;
  berkasFotoSize?: number;
  berkasFotoSizeKb?: number;
  berkasFotoOriginalSizeKb?: number;

  // Metadata urutan dan waktu
  orderIndex?: number;
  createdAt?: number;
}

export interface AdminAccount {
  id: string;
  username: string;
  namaAdmin: string;
  wilayahTugas: string;
  role: 'user' | 'admin' | 'superadmin' | 'developer';
  passwordPolos?: string;
  passwordHash?: string;
  terakhirLogin?: string;
  sessionToken?: string;
  loginTimestamp?: number;
  isOnline?: boolean;
  isScreenActive?: boolean;
  statusKoneksi?: 'ONLINE' | 'OFFLINE' | 'IDLE';
  statusLayar?: 'AKTIF_LAYAR' | 'LATAR_BELAKANG' | 'AFK_IDLE' | 'OFFLINE';
  lastActive?: string;
  lastHeartbeat?: string;
  lastUpdatedTimestamp?: number;
  isFrozen?: boolean;
  statusAkun?: 'AKTIF' | 'DIBEKUKAN';
  isGuest?: boolean;
  isDeveloper?: boolean;
  statusActive?: 'SAH_TERDAFTAR' | 'GUEST' | string;
  statusVerval?: 'MENUNGGU_VERIFIKASI' | 'DISETUJUI' | 'DITOLAK';
  alasanPenolakan?: string;
  catatanVerval?: string;
  vervalAt?: number;
  vervalBy?: string;
  waktuPendaftaran?: string;
  tanggalPendaftaranFormatted?: string;
  noRegistrasi?: string;
  registeredIp?: string;
  deviceId?: string;
  lastLoginDeviceId?: string;
  nik?: string;
  noWhatsapp?: string;
  resetTicket?: ResetPasswordTicket;
}

export interface ResetPasswordTicket {
  status: 'MENUNGGU_RESET' | 'DISETUJUI' | 'DITOLAK';
  requestedAt: number;
  nik: string;
  noWhatsapp: string;
  temporaryPassword?: string;
  resetAt?: number;
  resetBy?: string;
}

export interface AdminMessage {
  id: string;
  senderName: string;
  senderRole: 'superadmin' | 'developer';
  targetWilayah: string; // 'Kota Cimahi', 'Semua Wilayah', etc.
  subject: string;
  content: string;
  timestamp: string;
  createdAt: number;
  isRead: boolean;
}

export interface TaskItem {
  id: string; // e.g. 'task-1724250000000'
  title: string;
  description: string;
  targetWilayah: string; // 'Semua Wilayah' or specific 27 Kab/Kota e.g. 'Kota Bandung'
  pillarId?: PillarId | 'all' | string;
  priority: 'TINGGI' | 'SEDANG' | 'NORMAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedBy: string; // e.g. 'Superadmin Jabar'
  assignedTo?: string; // Target Admin Wilayah
  createdAt: string; // ISO string
  createdAtFormatted: string;
  deadline?: string; // Tanggal batas waktu
  progressPercent?: number; // 0 to 100
  progressNotes?: string; // Catatan tindak lanjut dari Admin Wilayah
  updatedAt?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string; // ISO string or formatted string
  createdAt: number; // epoch ms for sorting & 30-day purge
  actorName: string; // nama admin / superadmin
  actorRole: 'admin' | 'superadmin' | 'user' | 'developer';
  actorWilayah: string; // wilayah dinas
  category?: 'PSKS' | 'ADMIN_ACCOUNT' | 'SYSTEM' | 'TASK' | string; // Kategori Utama: Data PSKS, Akun Admin, Sistem, atau Manajemen Tugas
  actionType: 'SET' | 'DELETE' | 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'CLEAR' | string;
  targetCollection: 'psks_records' | 'admin_accounts' | 'app_settings' | 'admin_messages' | 'registration_submissions' | 'task_items' | string;
  targetId: string;
  targetName?: string; // Nama anggota PSKS atau nama admin
  targetPillar?: string; // e.g. PEKSOS, TKSK, PSM, KARANG TARUNA, dll.
  targetWilayah?: string; // Wilayah objek yang dimodifikasi
  details: string; // Narasi deskripsi manusiawi yang detail, simpel, dan mudah dipahami
}

export interface PillarRegistrationSubmission {
  id: string; // e.g. 'sub-peksos-1724250000000'
  pillarId: PillarId;
  wilayah: string; // Kabupaten/Kota
  kec: string; // Kecamatan
  nama: string; // Nama pemohon / pendaftar
  nik: string; // NIK pemohon
  hp: string; // Nomor kontak / HP
  submittedByUserId?: string;
  submittedByName: string; // Nama user yang login
  submittedByUsername?: string; // Username user
  submittedByRole: string; // 'user'
  submittedAt: number | string; // epoch ms or ISO string
  submittedAtFormatted: string; // e.g. '21 Agustus 2026, 14:30 WIB'
  status:
    | 'PENDING'
    | 'MENUNGGU_VERIFIKASI_WILAYAH'
    | 'DISETUJUI_WILAYAH'
    | 'MENUNGGU_PENGESAHAN_PROVINSI'
    | 'SAH_TERDAFTAR'
    | 'APPROVED'
    | 'DITOLAK_WILAYAH'
    | 'DITOLAK_PROVINSI'
    | 'REJECTED'
    | string;
  recordData: Omit<PSKSDataRecord, 'id'>;
  // Foto Berkas Pendukung (Kompresi Client-side Canvas Ultra Hemat Memori)
  berkasFotoUrl?: string; // Data URL Base64 hasil kompresi (< 100KB)
  berkasFotoNama?: string; // Nama file dokumen asli
  berkasFotoSizeKb?: number; // Ukuran hasil kompresi (KB)
  berkasFotoOriginalSizeKb?: number; // Ukuran asli sebelum kompresi (KB)
  // Approval Tier 1: Admin Wilayah
  regionalApprovedBy?: string;
  regionalApprovedAt?: string | number;
  regionalNotes?: string;
  verifiedWilayahAt?: string | number | null;
  verifiedWilayahAtFormatted?: string | null;
  verifiedWilayahBy?: string | null;
  catatanWilayah?: string | null;
  // Approval Tier 2: Superadmin Jabar
  superadminApprovedBy?: string;
  superadminApprovedAt?: string | number;
  superadminNotes?: string;
  approvedProvinsiAt?: string | number | null;
  approvedProvinsiAtFormatted?: string | null;
  catatanProvinsi?: string | null;
  // General Legacy / Compatibility Fields
  adminNotes?: string;
  reviewNotes?: string;
  rejectedReason?: string;
  reviewedBy?: string;
  reviewedAt?: string | number;
  processedBy?: string; // Nama admin/superadmin yang memproses
  processedAt?: number;
  processedAtFormatted?: string;
}

export interface PortalFaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'pilar_psks' | 'pendaftaran' | 'akun_keamanan' | 'bantuan_kontak' | string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type DocumentCategory = 
  | 'regulasi_kemensos' 
  | 'pergub_jabar' 
  | 'sop_juknis' 
  | 'format_blanko' 
  | 'panduan_sistem';

export interface DocumentRepoItem {
  id: string;
  title: string;
  category: DocumentCategory;
  nomorRegulasi: string;
  tahun: number | string;
  tanggalDitetapkan?: string;
  instansi: string;
  description: string;
  fileSize: string;
  pageCount: number;
  status: 'PUBLIK' | 'INTERNAL_ADMIN';
  downloadCount: number;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  pdfType?: string;
  externalDownloadUrl?: string;
  fileType?: 'PDF' | 'DOCX' | 'XLSX';
  fileName?: string;
  fileDataUrl?: string;
}

