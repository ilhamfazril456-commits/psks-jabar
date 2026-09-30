import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Settings2,
  Table,
  Sparkles,
  Loader2,
  FileCheck,
  Info,
  Check,
  HelpCircle,
  Eye
} from 'lucide-react';
import { PillarId, PSKSDataRecord, UserSession } from '../../types';
import { JABAR_REGIONS } from '../../data/initialData';

interface PillarExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillarId: PillarId;
  pillar: any;
  session: UserSession;
  onBatchImport: (records: Omit<PSKSDataRecord, 'id'>[]) => Promise<number>;
}

export interface TargetFieldDef {
  key: string;
  label: string; // HARUS PERSIS SESUAI DENGAN JUDUL HEADER TABEL DI PILARTABLE
  required: boolean;
  hint?: string;
  synonyms: string[];
}

// STRUKTUR JUDUL KOLOM SESUAI PERSIS DENGAN HEADER TABEL MASING-MASING PILAR
export const PILLAR_FIELD_DEFINITIONS: Record<PillarId, TargetFieldDef[]> = {
  peksos: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Wilayah Kabupaten/Kota di Jawa Barat',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah', 'kabupaten domisili', 'wilayah tugas'],
    },
    {
      key: 'nama',
      label: 'Nama',
      required: true,
      hint: 'Nama lengkap tenaga Peksos',
      synonyms: ['nama', 'nama lengkap', 'nama_lengkap', 'namalengkap', 'nama peksos', 'name', 'full name'],
    },
    {
      key: 'nik',
      label: 'NIK',
      required: true,
      hint: 'Nomor Induk Kependudukan 16 digit',
      synonyms: ['nik', 'no ktp', 'no. ktp', 'nomor ktp', 'no_ktp', 'nik ktp', 'nomor induk kependudukan'],
    },
    {
      key: 'jenisKelamin',
      label: 'Jenis Kelamin',
      required: false,
      hint: 'Laki-laki atau Perempuan',
      synonyms: ['jenis kelamin', 'jk', 'gender', 'kelamin', 'sex', 'l/p', 'l / p'],
    },
    {
      key: 'pendidikan',
      label: 'Pendidikan',
      required: false,
      hint: 'Pendidikan terakhir (D4/S1 Kesejahteraan Sosial, dll)',
      synonyms: ['pendidikan', 'pendidikan terakhir', 'lulusan', 'tingkat pendidikan', 'ijazah'],
    },
    {
      key: 'noTglSertifikasi',
      label: 'Nomor dan tanggal sertifikasi',
      required: false,
      hint: 'Nomor & tanggal surat sertifikasi',
      synonyms: ['nomor dan tanggal sertifikasi', 'no dan tgl sertifikasi', 'no tgl sertifikasi', 'no sertifikasi', 'sertifikasi', 'nomor sertifikat'],
    },
    {
      key: 'sertifikasiKompetensi',
      label: 'Sertifikasi Kompetensi',
      required: false,
      hint: 'Contoh: Pekerja Sosial Generalis / Spesialis',
      synonyms: ['sertifikasi kompetensi', 'kompetensi', 'bidang kompetensi', 'klasifikasi kompetensi'],
    },
    {
      key: 'jenjangJabatan',
      label: 'Jenjang Jabatan',
      required: false,
      hint: 'Contoh: Peksos Ahli Pertama / Muda / Madya',
      synonyms: ['jenjang jabatan', 'jenjang', 'jabatan', 'tingkat jabatan', 'grade'],
    },
    {
      key: 'tempatBertugas',
      label: 'Tempat Bertugas',
      required: false,
      hint: 'Wilayah atau unit lokasi bertugas',
      synonyms: ['tempat bertugas', 'tempat tugas', 'lokasi tugas', 'lokasi', 'kecamatan tugas'],
    },
    {
      key: 'instansiBertugas',
      label: 'Instansi/tempat bertugas',
      required: false,
      hint: 'Nama dinas / instansi penugasan',
      synonyms: ['instansi/tempat bertugas', 'instansi bertugas', 'instansi', 'unit kerja', 'kantor', 'lembaga'],
    },
    {
      key: 'statusPeksos',
      label: 'Status Peksos (Pemerintah/Masyarakat)',
      required: false,
      hint: 'Pemerintah atau Masyarakat',
      synonyms: ['status peksos', 'status peksos (pemerintah/masyarakat)', 'kategori peksos', 'jenis peksos'],
    },
    {
      key: 'jenjangJabatanPemerintah',
      label: 'Jenjang Jabatan (jika Pemerintah)',
      required: false,
      hint: 'Jenjang jabatan khusus ASN/Pemerintah',
      synonyms: ['jenjang jabatan (jika pemerintah)', 'jabatan asn', 'jabatan fungsional'],
    },
    {
      key: 'hp',
      label: 'Nomor HP',
      required: false,
      hint: 'Nomor HP / WhatsApp aktif',
      synonyms: ['nomor hp', 'no hp', 'no. hp', 'nohp', 'telepon', 'telp', 'no whatsapp', 'whatsapp', 'wa', 'kontak'],
    },
    {
      key: 'email',
      label: 'Email',
      required: false,
      hint: 'Alamat email aktif',
      synonyms: ['email', 'surel', 'alamat email', 'e-mail'],
    },
    {
      key: 'statusKeaktifan',
      label: 'Status keaktifan',
      required: false,
      hint: 'Aktif / Tidak Aktif',
      synonyms: ['status keaktifan', 'status', 'keaktifan', 'status aktif'],
    },
    {
      key: 'nomorKontak',
      label: 'Nomor kontak',
      required: false,
      hint: 'Kontak telepon instansi / alternatif',
      synonyms: ['nomor kontak', 'kontak kantor', 'no telp kantor', 'kontak darurat'],
    },
  ],

  psm: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota domisili tugas PSM',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'nama',
      label: 'Nama',
      required: true,
      hint: 'Nama Lengkap Tenaga PSM',
      synonyms: ['nama', 'nama lengkap', 'nama psm', 'nama anggota', 'name'],
    },
    {
      key: 'kelDesa',
      label: 'Desa/Kelurahan',
      required: false,
      hint: 'Desa atau Kelurahan penugasan',
      synonyms: ['desa/kelurahan', 'desa', 'kelurahan', 'kel/desa', 'kel', 'desakelurahan'],
    },
    {
      key: 'kec',
      label: 'Kecamatan',
      required: false,
      hint: 'Kecamatan penugasan PSM',
      synonyms: ['kecamatan', 'kec', 'kec.', 'wilayah kecamatan'],
    },
    {
      key: 'masaBakti',
      label: 'Masa Bakti',
      required: false,
      hint: 'Periode masa bakti (contoh: 2024 - 2029)',
      synonyms: ['masa bakti', 'periode', 'masa tugas', 'tahun bakti', 'masa kerja'],
    },
    {
      key: 'noSk',
      label: 'Nomor SK',
      required: false,
      hint: 'Nomor Surat Keputusan pengangkatan',
      synonyms: ['nomor sk', 'no sk', 'no. sk', 'nosk', 'sk pengangkatan', 'no surat keputusan'],
    },
    {
      key: 'hp',
      label: 'Nomor HP',
      required: false,
      hint: 'Nomor handphone / WhatsApp',
      synonyms: ['nomor hp', 'no hp', 'no. hp', 'nohp', 'telepon', 'whatsapp', 'wa', 'kontak'],
    },
    {
      key: 'statusAktif',
      label: 'Status aktif',
      required: false,
      hint: 'Aktif atau Tidak Aktif',
      synonyms: ['status aktif', 'status', 'keaktifan', 'status_aktif'],
    },
  ],

  tagana: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota domisili Tagana',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'nama',
      label: 'Nama',
      required: true,
      hint: 'Nama Lengkap Anggota Tagana',
      synonyms: ['nama', 'nama lengkap', 'nama tagana', 'nama anggota', 'name'],
    },
    {
      key: 'nomorInduk',
      label: 'Nomor Induk',
      required: true,
      hint: 'Nomor Induk Anggota Tagana (NIA / NIK)',
      synonyms: ['nomor induk', 'no induk', 'nia', 'nomor induk anggota', 'no induk anggota', 'nik', 'no reg'],
    },
    {
      key: 'sertifikat',
      label: 'Sertifikat',
      required: false,
      hint: 'Sertifikat keahlian / pelatihan kebencanaan',
      synonyms: ['sertifikat', 'sertifikasi', 'no sertifikat', 'sertifikat diklat', 'diklat'],
    },
    {
      key: 'keahlian',
      label: 'Keahlian',
      required: false,
      hint: 'Contoh: Water Rescue, Dapur Umum, Logistik, dll',
      synonyms: ['keahlian', 'spesialisasi', 'bidang keahlian', 'keterampilan', 'skill'],
    },
    {
      key: 'pelatihan',
      label: 'Pelatihan',
      required: false,
      hint: 'Pelatihan SAR / Kebencanaan yang pernah diikuti',
      synonyms: ['pelatihan', 'diklat', 'training', 'kursus', 'bimbingan teknis', 'bimtek'],
    },
    {
      key: 'statusAktif',
      label: 'Status Aktif',
      required: false,
      hint: 'Aktif / Siaga',
      synonyms: ['status aktif', 'status', 'keaktifan'],
    },
  ],

  lks: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota domisili LKS',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'namaLks',
      label: 'Nama LKS',
      required: true,
      hint: 'Nama Yayasan / Lembaga Kesejahteraan Sosial',
      synonyms: ['nama lks', 'nama yayasan', 'nama lembaga', 'nama organisasi', 'nama'],
    },
    {
      key: 'bidangPelayanan',
      label: 'Bidang pelayanan',
      required: false,
      hint: 'Contoh: Anak, Lansia, Disabilitas, Napza, dll',
      synonyms: ['bidang pelayanan', 'bidang', 'jenis pelayanan', 'fokus layanan', 'program'],
    },
    {
      key: 'ketua',
      label: 'Ketua',
      required: false,
      hint: 'Nama Pimpinan / Ketua Yayasan LKS',
      synonyms: ['ketua', 'nama ketua', 'pimpinan', 'ketua yayasan', 'penanggung jawab', 'direktur'],
    },
    {
      key: 'alamat',
      label: 'Alamat',
      required: false,
      hint: 'Alamat lengkap sekretariat LKS',
      synonyms: ['alamat', 'alamat sekretariat', 'alamat kantor', 'domisili', 'lokasi yayasan'],
    },
    {
      key: 'nomorTandaDaftar',
      label: 'Nomor Tanda Daftar',
      required: false,
      hint: 'Nomor Tanda Daftar Dinas Sosial / Kemenkumham',
      synonyms: ['nomor tanda daftar', 'no tanda daftar', 'tanda daftar', 'nomor registrasi', 'no izin operasional', 'ahu'],
    },
    {
      key: 'masaBerlaku',
      label: 'Masa Berlaku',
      required: false,
      hint: 'Masa berlaku izin operasional (contoh: 2024 - 2029)',
      synonyms: ['masa berlaku', 'berlaku sampai', 'masa izin', 'periode berlaku'],
    },
  ],

  karangtaruna: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota Karang Taruna berada',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'namaKarangTaruna',
      label: 'Nama Karang Taruna',
      required: true,
      hint: 'Contoh: Karang Taruna Bina Remaja, Karya Muda, dll',
      synonyms: ['nama karang taruna', 'nama', 'karang taruna', 'nama unit'],
    },
    {
      key: 'kelDesa',
      label: 'Desa/Kelurahan',
      required: false,
      hint: 'Desa atau Kelurahan domisili',
      synonyms: ['desa/kelurahan', 'desa', 'kelurahan', 'kel/desa', 'kel'],
    },
    {
      key: 'kec',
      label: 'Kecamatan',
      required: false,
      hint: 'Kecamatan Karang Taruna',
      synonyms: ['kecamatan', 'kec', 'kec.'],
    },
    {
      key: 'ketua',
      label: 'Ketua',
      required: false,
      hint: 'Nama Ketua Karang Taruna',
      synonyms: ['ketua', 'nama ketua', 'ketua karang taruna', 'pimpinan'],
    },
    {
      key: 'noSk',
      label: 'Nomor SK',
      required: false,
      hint: 'Nomor SK Kepala Desa / Lurah / Camat',
      synonyms: ['nomor sk', 'no sk', 'no. sk', 'nosk', 'sk pengesahan'],
    },
    {
      key: 'tahunBerdiri',
      label: 'Tahun Berdiri',
      required: false,
      hint: 'Tahun didirikannya Karang Taruna',
      synonyms: ['tahun berdiri', 'tahun pembentukan', 'tahun', 'berdiri sejak'],
    },
  ],

  lk3: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota domisili LK3',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'namaLk3',
      label: 'Nama LK3',
      required: true,
      hint: 'Nama Lembaga Konsultasi Kesejahteraan Keluarga',
      synonyms: ['nama lk3', 'nama lembaga', 'nama', 'nama organisasi'],
    },
    {
      key: 'ketua',
      label: 'Ketua',
      required: false,
      hint: 'Nama Ketua / Pimpinan LK3',
      synonyms: ['ketua', 'nama ketua', 'pimpinan', 'direktur'],
    },
    {
      key: 'alamat',
      label: 'Alamat',
      required: false,
      hint: 'Alamat kantor / sekretariat layanan',
      synonyms: ['alamat', 'alamat kantor', 'lokasi', 'sekretariat'],
    },
    {
      key: 'kontak',
      label: 'Kontak',
      required: false,
      hint: 'Nomor telepon / WhatsApp layanan konseling',
      synonyms: ['kontak', 'nomor kontak', 'no hp', 'telepon', 'whatsapp', 'wa', 'hotline'],
    },
    {
      key: 'jenisLayanan',
      label: 'Jenis layanan',
      required: false,
      hint: 'Contoh: Konseling Keluarga, Mediasi, Pendampingan Psikososial',
      synonyms: ['jenis layanan', 'layanan', 'bidang layanan', 'jenis konseling'],
    },
    {
      key: 'statusAktif',
      label: 'Status aktif',
      required: false,
      hint: 'Aktif atau Tidak Aktif',
      synonyms: ['status aktif', 'status', 'keaktifan'],
    },
  ],

  pensos: [
    {
      key: 'wilayahKerja',
      label: 'Wilayah kerja',
      required: true,
      hint: 'Wilayah Kabupaten/Kota atau Provinsi Jawa Barat',
      synonyms: ['wilayah kerja', 'wilayah', 'kabupaten', 'kota', 'kab/kota', 'wilayah tugas', 'daerah kerja'],
    },
    {
      key: 'nama',
      label: 'Nama',
      required: true,
      hint: 'Nama Penyuluh Sosial',
      synonyms: ['nama', 'nama penyuluh', 'nama lengkap', 'name'],
    },
    {
      key: 'instansi',
      label: 'Instansi',
      required: false,
      hint: 'Instansi / Dinas Sosial tempat bertugas',
      synonyms: ['instansi', 'unit kerja', 'kantor', 'dinas', 'lembaga'],
    },
    {
      key: 'jabatan',
      label: 'Jabatan',
      required: false,
      hint: 'Contoh: Penyuluh Sosial Ahli Pertama / Terampil',
      synonyms: ['jabatan', 'fungsional', 'jenjang jabatan', 'posisi'],
    },
    {
      key: 'sertifikasi',
      label: 'Sertifikasi',
      required: false,
      hint: 'Nomor / Nama Sertifikat Diklat Penyuluh',
      synonyms: ['sertifikasi', 'sertifikat', 'no sertifikat', 'diklat fungsional'],
    },
  ],

  tksk: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota penugasan TKSK',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'nama',
      label: 'Nama',
      required: true,
      hint: 'Nama Tenaga Kesejahteraan Sosial Kecamatan',
      synonyms: ['nama', 'nama tksk', 'nama lengkap', 'name'],
    },
    {
      key: 'kec',
      label: 'Kecamatan',
      required: false,
      hint: 'Kecamatan wilayah tugas TKSK',
      synonyms: ['kecamatan', 'kecamatan penugasan', 'kec', 'kec.', 'wilayah tugas'],
    },
    {
      key: 'skPengangkatan',
      label: 'SK Pengangkatan',
      required: false,
      hint: 'Nomor SK Pengangkatan dari Kemensos / Dinsos',
      synonyms: ['sk pengangkatan', 'nomor sk', 'no sk', 'no. sk', 'sk tugas', 'surat keputusan'],
    },
    {
      key: 'pendidikan',
      label: 'Pendidikan',
      required: false,
      hint: 'Pendidikan terakhir',
      synonyms: ['pendidikan', 'pendidikan terakhir', 'ijazah', 'lulusan'],
    },
    {
      key: 'hp',
      label: 'Nomor HP',
      required: false,
      hint: 'Nomor WhatsApp / HP aktif',
      synonyms: ['nomor hp', 'no hp', 'no. hp', 'nohp', 'telepon', 'whatsapp', 'wa', 'kontak'],
    },
    {
      key: 'masaTugas',
      label: 'Masa tugas',
      required: false,
      hint: 'Periode penugasan (contoh: 2024 - 2029)',
      synonyms: ['masa tugas', 'masa bakti', 'periode tugas', 'tahun tugas'],
    },
  ],

  badanusaha: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota domisili badan usaha / KUBE',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'namaBadanUsaha',
      label: 'Nama Badan Usaha',
      required: true,
      hint: 'Nama Perusahaan / KUBE / Badan Usaha CSR',
      synonyms: ['nama badan usaha', 'nama perusahaan', 'nama usaha', 'nama kube', 'nama mitra', 'nama'],
    },
    {
      key: 'jenisUsaha',
      label: 'Jenis usaha',
      required: false,
      hint: 'Contoh: Perbankan, Manufaktur, Pertanian, Perdagangan',
      synonyms: ['jenis usaha', 'sektor usaha', 'bidang usaha', 'kategori usaha'],
    },
    {
      key: 'bentukCsr',
      label: 'Bentuk CSR',
      required: false,
      hint: 'Contoh: Hibah modal, alat disabilitas, renovasi rutilahu',
      synonyms: ['bentuk csr', 'program csr', 'bantuan csr', 'bantuan'],
    },
    {
      key: 'bidangBantuan',
      label: 'Bidang bantuan',
      required: false,
      hint: 'Contoh: Perlindungan Sosial, Pemberdayaan Ekonomi',
      synonyms: ['bidang bantuan', 'fokus bantuan', 'sasaran bantuan'],
    },
    {
      key: 'kontak',
      label: 'Kontak',
      required: false,
      hint: 'Nomor telepon / kontak PIC perusahaan',
      synonyms: ['kontak', 'kontak pic', 'no hp', 'telepon', 'email pic', 'pic'],
    },
  ],

  slrt_puskesos: [
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota',
      required: true,
      hint: 'Kabupaten/Kota sekretariat SLRT/Puskesos',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah'],
    },
    {
      key: 'namaSlrt',
      label: 'Nama SLRT',
      required: true,
      hint: 'Nama Sekretariat SLRT atau Puskesos Desa',
      synonyms: ['nama slrt', 'nama puskesos', 'nama slrt/puskesos', 'nama sekretariat', 'nama'],
    },
    {
      key: 'kelDesa',
      label: 'Desa/Kelurahan',
      required: false,
      hint: 'Desa / Kelurahan lokasi Puskesos',
      synonyms: ['desa/kelurahan', 'desa', 'kelurahan', 'kel/desa', 'kel'],
    },
    {
      key: 'kec',
      label: 'Kecamatan',
      required: false,
      hint: 'Kecamatan lokasi Puskesos',
      synonyms: ['kecamatan', 'kec', 'kec.'],
    },
    {
      key: 'tahunBerdiri',
      label: 'Tahun Berdiri',
      required: false,
      hint: 'Tahun peresmian / pembentukan SLRT',
      synonyms: ['tahun berdiri', 'tahun pembentukan', 'tahun', 'berdiri sejak'],
    },
    {
      key: 'operator',
      label: 'Operator Puskesos',
      required: false,
      hint: 'Nama penanggung jawab / operator aplikasi',
      synonyms: ['operator puskesos', 'operator', 'nama operator', 'petugas', 'pengelola'],
    },
    {
      key: 'statusAktif',
      label: 'Status Aktif',
      required: false,
      hint: 'Aktif atau Tidak Aktif',
      synonyms: ['status aktif', 'status', 'keaktifan'],
    },
  ],
};

// Normalisasi nama wilayah resmi Jawa Barat
function normalizeJabarRegion(val: any, defaultWilayah: string): string {
  if (!val || typeof val !== 'string') return defaultWilayah;
  const raw = val.trim().toLowerCase();
  if (!raw) return defaultWilayah;

  for (const reg of JABAR_REGIONS) {
    if (reg.toLowerCase() === raw) return reg;
  }

  if (raw.includes('cimahi')) return 'Kota Cimahi';
  if (raw.includes('depok')) return 'Kota Depok';
  if (raw.includes('banjar')) return 'Kota Banjar';
  if (raw.includes('sukabumi')) return raw.includes('kota') ? 'Kota Sukabumi' : 'Kab. Sukabumi';
  if (raw.includes('cirebon')) return raw.includes('kota') ? 'Kota Cirebon' : 'Kab. Cirebon';
  if (raw.includes('bekasi')) return raw.includes('kota') ? 'Kota Bekasi' : 'Kab. Bekasi';
  if (raw.includes('tasik')) return raw.includes('kota') ? 'Kota Tasikmalaya' : 'Kab. Tasikmalaya';
  if (raw.includes('bandung barat') || raw.includes('kbb')) return 'Kab. Bandung Barat';
  if (raw.includes('bandung')) return raw.includes('kota') ? 'Kota Bandung' : 'Kab. Bandung';
  if (raw.includes('bogor')) return raw.includes('kota') ? 'Kota Bogor' : 'Kab. Bogor';
  if (raw.includes('cianjur')) return 'Kab. Cianjur';
  if (raw.includes('garut')) return 'Kab. Garut';
  if (raw.includes('ciamis')) return 'Kab. Ciamis';
  if (raw.includes('kuningan')) return 'Kab. Kuningan';
  if (raw.includes('majalengka')) return 'Kab. Majalengka';
  if (raw.includes('sumedang')) return 'Kab. Sumedang';
  if (raw.includes('indramayu')) return 'Kab. Indramayu';
  if (raw.includes('subang')) return 'Kab. Subang';
  if (raw.includes('purwakarta')) return 'Kab. Purwakarta';
  if (raw.includes('karawang')) return 'Kab. Karawang';
  if (raw.includes('pangandaran')) return 'Kab. Pangandaran';
  if (raw.includes('prov') || raw.includes('jabar') || raw.includes('jawa barat')) return 'Prov. Jabar';

  return defaultWilayah;
}

// Membersihkan NIK dari notasi scientific (misal: 3.27301E+15)
function sanitizeNIK(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    return BigInt(Math.floor(val)).toString();
  }
  const str = String(val).trim();
  if (str.toUpperCase().includes('E+')) {
    const num = Number(str);
    if (!isNaN(num)) {
      return BigInt(Math.floor(num)).toString();
    }
  }
  return str.replace(/\D/g, '');
}

// Membersihkan nomor telepon
function sanitizePhone(val: any): string {
  if (!val) return '';
  let str = String(val).trim();
  if (str.startsWith('62')) {
    str = '0' + str.slice(2);
  } else if (str.startsWith('+62')) {
    str = '0' + str.slice(3);
  }
  return str.replace(/[^0-9+\s-]/g, '');
}

// Membersihkan jenis kelamin
function sanitizeGender(val: any): string {
  if (!val) return '';
  const s = String(val).trim().toUpperCase();
  if (s === 'L' || s === 'LAKI' || s === 'LAKI-LAKI' || s === 'PRIA' || s === 'MALE' || s === 'M') {
    return 'Laki-laki';
  }
  if (s === 'P' || s === 'PEREMPUAN' || s === 'WANITA' || s === 'FEMALE' || s === 'F') {
    return 'Perempuan';
  }
  return String(val).trim();
}

export const PillarExcelImportModal: React.FC<PillarExcelImportModalProps> = ({
  isOpen,
  onClose,
  pillarId,
  pillar,
  session,
  onBatchImport,
}) => {
  // Step state: 1 = Upload, 2 = Mapping, 3 = Preview & Import, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  // Seluruh baris mentah dari sheet (2D array)
  const [rawSheetRows, setRawSheetRows] = useState<any[][]>([]);
  
  // Indeks baris header tabel (0 = Baris 1, 1 = Baris 2, dst)
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);

  // Kolom header Excel yang terbaca
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  
  // Baris data (di bawah header)
  const [dataRows, setDataRows] = useState<any[][]>([]);

  // Pemetaan kolom: TargetFieldKey -> Nama Kolom Excel
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResultCount, setImportResultCount] = useState<number>(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target fields SPESIFIK & SESUAI PERSIS dengan tabel pilar yang sedang dibuka
  const targetFields = useMemo(() => {
    return PILLAR_FIELD_DEFINITIONS[pillarId] || PILLAR_FIELD_DEFINITIONS.peksos;
  }, [pillarId]);

  // Cuplikan contoh isi nyata untuk setiap kolom di Excel (sampel 3 data pertama)
  const columnSampleValues = useMemo(() => {
    const samples: Record<string, string[]> = {};
    if (!excelHeaders.length || !dataRows.length) return samples;

    excelHeaders.forEach((header, colIdx) => {
      const items: string[] = [];
      for (let r = 0; r < Math.min(dataRows.length, 30); r++) {
        const val = dataRows[r]?.[colIdx];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          const str = String(val).trim();
          if (!items.includes(str)) {
            items.push(str);
            if (items.length >= 3) break;
          }
        }
      }
      samples[header] = items;
    });

    return samples;
  }, [excelHeaders, dataRows]);

  // Reset state saat modal ditutup
  const handleClose = () => {
    if (isProcessing) return;
    setStep(1);
    setFile(null);
    setRawWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawSheetRows([]);
    setHeaderRowIndex(0);
    setExcelHeaders([]);
    setDataRows([]);
    setColumnMapping({});
    setParseError(null);
    setImportProgress(null);
    onClose();
  };

  // Baca file Excel
  const processExcelFile = async (selectedFile: File) => {
    setParseError(null);
    setIsProcessing(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
      }

      setRawWorkbook(workbook);
      setSheetNames(workbook.SheetNames);
      const firstSheet = workbook.SheetNames[0];
      setSelectedSheet(firstSheet);
      setFile(selectedFile);

      // Parse baris mentah
      const sheet = workbook.Sheets[firstSheet];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!jsonData || jsonData.length === 0) {
        throw new Error(`Lembar kerja "${firstSheet}" kosong.`);
      }

      setRawSheetRows(jsonData);

      // Otomatis cari baris yang paling mungkin merupakan baris header tabel (bukan kop judul)
      let detectedHeaderIdx = 0;
      let maxCols = 0;
      for (let i = 0; i < Math.min(jsonData.length, 12); i++) {
        const row = jsonData[i] || [];
        const nonEmptyCount = row.filter((c) => c !== null && String(c).trim() !== '').length;
        // Baris header biasanya memiliki banyak kolom terisi
        if (nonEmptyCount > maxCols && nonEmptyCount >= 2) {
          maxCols = nonEmptyCount;
          detectedHeaderIdx = i;
        }
      }

      setHeaderRowIndex(detectedHeaderIdx);
      applyHeaderIndex(jsonData, detectedHeaderIdx);
      setStep(2);
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setParseError(err?.message || 'Gagal membaca isi file Excel. Pastikan format file valid (.xlsx, .xls, atau .csv).');
    } finally {
      setIsProcessing(false);
    }
  };

  // Terapkan indeks baris header tabel
  const applyHeaderIndex = (sheetData: any[][], hIdx: number) => {
    const rawHeaderRow = sheetData[hIdx] || [];
    const headers = rawHeaderRow.map((h, idx) => {
      const text = String(h || '').trim();
      return text ? text : `Kolom_${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? Math.floor(idx / 26) : ''}`;
    });

    // Baris data adalah baris setelah header
    const rows = sheetData
      .slice(hIdx + 1)
      .filter((row) => row && row.some((cell) => cell !== null && String(cell).trim() !== ''));

    setExcelHeaders(headers);
    setDataRows(rows);

    // Auto-detect pemetaan kolom berdasarkan nama tabel pilar saat ini
    const initialMapping: Record<string, string> = {};
    targetFields.forEach((target) => {
      let bestMatch = '';
      for (const header of headers) {
        const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
        const targetClean = target.label.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

        // 1. Cek kecocokan langsung dengan judul kolom tabel
        if (cleanHeader === targetClean || cleanHeader.includes(targetClean) || targetClean.includes(cleanHeader)) {
          bestMatch = header;
          break;
        }

        // 2. Cek kamus sinonim
        if (target.synonyms.some((syn) => cleanHeader === syn || cleanHeader.includes(syn) || syn.includes(cleanHeader))) {
          bestMatch = header;
          break;
        }
      }
      initialMapping[target.key] = bestMatch;
    });

    setColumnMapping(initialMapping);
  };

  // Ganti baris header oleh user jika file memiliki KOP bertingkat
  const handleHeaderRowChange = (newIdx: number) => {
    setHeaderRowIndex(newIdx);
    applyHeaderIndex(rawSheetRows, newIdx);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      processExcelFile(f);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      processExcelFile(f);
    }
  };

  // Ubah pemetaan kolom
  const handleMappingChange = (targetKey: string, excelHeader: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [targetKey]: excelHeader,
    }));
  };

  // Susun data terpetakan
  const mappedRecords = useMemo(() => {
    if (!dataRows.length || !excelHeaders.length) return [];

    const defaultWilayah = session.wilayah && session.wilayah !== 'Semua Wilayah' ? session.wilayah : 'Kota Bandung';
    const baseTimestamp = Date.now();

    return dataRows.map((row, index) => {
      const getVal = (targetKey: string): any => {
        const headerName = columnMapping[targetKey];
        if (!headerName) return '';
        const colIdx = excelHeaders.indexOf(headerName);
        if (colIdx === -1) return '';
        return row[colIdx] ?? '';
      };

      const record: any = {
        pillarId,
        status: 'Aktif',
        orderIndex: index,
        createdAt: baseTimestamp + index,
      };

      // Isi semua field yang dipetakan sesuai pilar
      targetFields.forEach((field) => {
        const rawVal = getVal(field.key);
        if (field.key === 'nik' || field.key === 'nomorInduk') {
          record[field.key] = sanitizeNIK(rawVal) || `${Date.now()}${String(index).padStart(4, '0')}`;
        } else if (field.key === 'wilayah' || field.key === 'wilayahKerja') {
          record[field.key] = normalizeJabarRegion(rawVal, defaultWilayah);
        } else if (field.key === 'hp' || field.key === 'nomorKontak' || field.key === 'kontak') {
          record[field.key] = sanitizePhone(rawVal) || '-';
        } else if (field.key === 'jenisKelamin') {
          record[field.key] = sanitizeGender(rawVal) || 'Laki-laki';
        } else if (field.key === 'nomorTandaDaftar' || field.key === 'sertifikasi') {
          const str = String(rawVal || '').trim();
          record[field.key] = str === 'CERT-2026' ? '' : str;
        } else {
          record[field.key] = String(rawVal || '').trim();
        }
      });

      // Jika pilar LKS dan nomor tanda daftar kosong, jangan isi CERT-2026 (biarkan kosong murni)
      if (pillarId === 'lks') {
        if (!record.nomorTandaDaftar || record.nomorTandaDaftar === 'CERT-2026') {
          record.nomorTandaDaftar = '';
        }
        if (record.sertifikasi === 'CERT-2026') {
          record.sertifikasi = '';
        }
      }

      // Sinkronisasi alias untuk tabel
      if (record.namaLks) record.nama = record.namaLks;
      if (record.namaKarangTaruna) record.nama = record.namaKarangTaruna;
      if (record.namaLk3) record.nama = record.namaLk3;
      if (record.namaBadanUsaha) record.nama = record.namaBadanUsaha;
      if (record.namaSlrt) record.nama = record.namaSlrt;

      if (!record.nama) {
        record.nama = `Anggota Terimport #${index + 1}`;
      }

      // Default jika wilayah tidak terpetakan
      if (!record.wilayah) {
        record.wilayah = defaultWilayah;
      }

      return record as Omit<PSKSDataRecord, 'id'>;
    });
  }, [dataRows, excelHeaders, columnMapping, pillarId, targetFields, session.wilayah]);

  // Eksekusi Import Massal ke Database
  const handleExecuteImport = async () => {
    if (!mappedRecords.length) return;
    setIsProcessing(true);
    setImportProgress({ current: 0, total: mappedRecords.length });

    try {
      const count = await onBatchImport(mappedRecords);
      setImportResultCount(count);
      setStep(4); // Sukses
    } catch (err: any) {
      console.error('Import failed:', err);
      setParseError(err?.message || 'Terjadi kesalahan saat menyimpan data import ke database.');
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-600/40 flex flex-col max-h-[92dvh] sm:max-h-[88vh] h-[92dvh] sm:h-auto overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white p-4 sm:p-5 border-b-4 border-[#d4af37] flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Superadmin &amp; Developer
                </span>
                <span className="text-xs text-emerald-200 font-bold truncate">
                  Pilar {pillar.title} ({pillar.shortName})
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide truncate text-white">
                Import Data Tabel {pillar.shortName} dari File Excel (.xlsx)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="text-white/80 hover:text-white p-2 rounded-xl cursor-pointer hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indikator Langkah */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 text-xs font-bold text-slate-600 overflow-x-auto">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-emerald-700 font-black' : step > 1 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-emerald-700 text-white' : step > 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'}`}>
              1
            </span>
            <span>1. Unggah File Excel</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-emerald-700 font-black' : step > 2 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-emerald-700 text-white' : step > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'}`}>
              2
            </span>
            <span>2. Cocokkan Kolom Tabel {pillar.shortName}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-700 font-black' : step > 3 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-700 text-white' : step > 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'}`}>
              3
            </span>
            <span>3. Pratinjau Tabel &amp; Simpan</span>
          </div>
        </div>

        {/* Pesan Error Global jika ada */}
        {parseError && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{parseError}</span>
            <button
              type="button"
              onClick={() => setParseError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Konten Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 overscroll-contain">
          {/* ========================================================================= */}
          {/* STEP 1: UNGGAH FILE EXCEL */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-emerald-900">
                    File Lengkap Langsung Masuk Tanpa Perlu Diedit:
                  </h4>
                  <p className="text-emerald-800 leading-relaxed">
                    Anda <strong>TIDAK PERLU merapikan atau memotong kolom</strong> di file Excel Anda. Sistem akan menampilkan seluruh judul kolom tabel <strong>Pilar {pillar.shortName}</strong> secara berurutan, dan Anda cukup memilih kolom Excel mana yang sesuai.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-3 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-100/70 scale-[0.99]'
                    : 'border-emerald-300 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-500'
                }`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="w-10 h-10 text-emerald-700 animate-spin" />
                    <span className="text-sm font-black text-slate-800">
                      Membaca &amp; Menganalisis File Excel Anda...
                    </span>
                    <span className="text-xs text-slate-500">
                      Mengekstrak baris judul tabel dan contoh isi data
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-md">
                      <UploadCloud className="w-8 h-8 text-emerald-700" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-black text-slate-900">
                        Klik untuk Memilih File Excel (.xlsx / .csv), atau Seret File ke sini
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        File akan dibaca langsung di browser Anda dengan aman dan cepat
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-900 mt-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Struktur Kolom Sesuai Tabel {pillar.shortName}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PEMETAAN KOLOM (COLUMN MAPPING) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Info File & Pengaturan Baris Header jika ada KOP */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">File Terpilih:</span>
                    <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      {file?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-500 font-medium block">Total Baris Terdeteksi:</span>
                      <span className="font-mono font-black text-emerald-800 text-sm">
                        {dataRows.length} Baris Data
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kontrol Penentu Baris Header jika ada KOP surat di Excel */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Baris Judul Tabel di File Excel Anda berada pada:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={headerRowIndex}
                      onChange={(e) => handleHeaderRowChange(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      {rawSheetRows.slice(0, 10).map((row, idx) => {
                        const preview = row.filter((c) => c !== null && String(c).trim() !== '').slice(0, 3).join(', ');
                        return (
                          <option key={idx} value={idx}>
                            Baris ke-{idx + 1} {preview ? `(${preview.slice(0, 30)}...)` : '(Kosong)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Panduan Pemetaan yang Jelas */}
              <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-black text-amber-900 block">
                    Cara Mencocokkan Kolom (Sangat Mudah):
                  </span>
                  <p className="text-amber-900/90 leading-relaxed">
                    Sisi kiri adalah <strong>Judul Kolom di Tabel {pillar.shortName}</strong>. Di sebelah kanan, pilih <strong>Nama Kolom dari File Excel Anda</strong>. Di bawah setiap pilihan, Anda bisa melihat <strong>contoh data asli</strong> yang ada di file Excel Anda agar tidak salah pilih!
                  </p>
                </div>
              </div>

              {/* Daftar Pemetaan Kolom */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-gradient-to-r from-[#043e2e] to-[#064e3b] px-4 py-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Struktur Kolom Tabel {pillar.title} ({pillar.shortName})
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-200 font-medium">
                    {targetFields.length} Kolom Tabel Tersedia
                  </span>
                </div>

                <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-3">
                  {targetFields.map((field, idx) => {
                    const selectedHeader = columnMapping[field.key] || '';
                    const isMatched = !!selectedHeader;
                    const samples = selectedHeader ? columnSampleValues[selectedHeader] || [] : [];

                    return (
                      <div
                        key={field.key}
                        className={`p-3 rounded-xl border transition-all ${
                          isMatched
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : field.required
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-slate-50/50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Sisi Kiri: Judul Kolom Tabel Website */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900">
                                {field.label}
                              </span>
                              {field.required && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-300 shrink-0">
                                  Wajib
                                </span>
                              )}
                            </div>
                            {field.hint && (
                              <p className="text-[11px] text-slate-500 mt-0.5 ml-7">{field.hint}</p>
                            )}
                          </div>

                          {/* Sisi Kanan: Pilihan Kolom dari Excel Anda */}
                          <div className="w-full sm:w-80 shrink-0 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                              <span>Pilih Kolom dari File Excel:</span>
                            </div>
                            <select
                              value={selectedHeader}
                              onChange={(e) => handleMappingChange(field.key, e.target.value)}
                              className={`w-full text-xs font-bold p-2.5 rounded-xl border transition-all focus:outline-none ${
                                isMatched
                                  ? 'bg-white border-emerald-500 text-emerald-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs'
                                  : field.required
                                  ? 'bg-white border-amber-400 text-amber-950 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              <option value="">-- [ Lewati / Abaikan Kolom Ini ] --</option>
                              {excelHeaders.map((header) => (
                                <option key={header} value={header}>
                                  📄 {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* FITUR PENJELAS: Contoh Data Asli dari Excel Anda */}
                        {isMatched && (
                          <div className="mt-2 pt-2 border-t border-emerald-200/60 ml-0 sm:ml-7 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="font-bold text-emerald-800 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Contoh Data di Excel Anda:
                            </span>
                            {samples.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {samples.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-950 font-mono text-[10px] font-semibold truncate max-w-[200px]"
                                    title={s}
                                  >
                                    "{s}"
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">(Kolom ini kosong di baris-baris awal)</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PRATINJAU TABEL PERSIS SEPERTI TABEL PILAR (LIVE PREVIEW) */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-emerald-800 font-bold block">
                    Kesiapan Import Data:
                  </span>
                  <p className="text-emerald-950 font-black text-sm">
                    Sebanyak <strong>{mappedRecords.length} baris data anggota</strong> siap dimasukkan ke dalam Tabel <strong>{pillar.shortName}</strong> secara realtime ke database.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Struktur Sesuai Tabel Resmi</span>
                </div>
              </div>

              {/* Tabel Pratinjau dengan Kolom Persis Seperti PilarTable */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-[#0f2b5c] px-4 py-2.5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Pratinjau Tampilan Tabel {pillar.shortName} (5 Baris Pertama)
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-300 font-bold">
                    Menampilkan 5 dari {mappedRecords.length} Data
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#143b7d] text-white sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 font-bold text-center border-r border-blue-900/60 w-10">No</th>
                        {targetFields.map((f) => (
                          <th
                            key={f.key}
                            className="py-2.5 px-3 font-bold whitespace-nowrap border-r border-blue-900/60 text-xs"
                          >
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {mappedRecords.slice(0, 5).map((rec: any, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-slate-500 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          {targetFields.map((f) => (
                            <td
                              key={f.key}
                              className="py-2.5 px-3 text-slate-800 border-r border-slate-100 whitespace-nowrap"
                            >
                              {f.key === 'wilayah' || f.key === 'wilayahKerja' ? (
                                <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {rec[f.key] || '-'}
                                </span>
                              ) : f.key === 'nama' || f.key === 'namaLks' || f.key === 'namaKarangTaruna' || f.key === 'namaLk3' || f.key === 'namaBadanUsaha' || f.key === 'namaSlrt' ? (
                                <span className="font-extrabold text-[#0f2b5c]">
                                  {rec[f.key] || '-'}
                                </span>
                              ) : f.key === 'nik' || f.key === 'nomorInduk' ? (
                                <span className="font-mono text-slate-700">
                                  {rec[f.key] || '-'}
                                </span>
                              ) : (
                                <span>{rec[f.key] || '-'}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isProcessing && importProgress && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                      Sedang menyimpan massal ke Database Firestore...
                    </span>
                    <span>
                      {importProgress.current} / {importProgress.total} Data
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUKSES IMPORT */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-lg border border-emerald-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Import Data Excel Berhasil!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Sebanyak <strong>{importResultCount} data anggota</strong> berhasil dimasukkan dan disinkronkan secara realtime ke database Firestore untuk Tabel <strong>{pillar.shortName}</strong>.
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  Selesai &amp; Lihat Tabel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 4 && (
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 z-20 shadow-xs">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40 flex items-center gap-1.5"
                >
                  <span>Pilih File Excel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!columnMapping['nama'] && !columnMapping['namaLks'] && !columnMapping['namaKarangTaruna'] && !columnMapping['namaLk3'] && !columnMapping['namaBadanUsaha'] && !columnMapping['namaSlrt']}
                  className="px-6 py-2.5 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Lanjut ke Pratinjau Tabel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing || mappedRecords.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#043e2e] to-[#065e44] hover:from-[#032f23] hover:to-[#043e2e] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Sedang Mengimport...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>Mulai Simpan {mappedRecords.length} Data ke Database</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
