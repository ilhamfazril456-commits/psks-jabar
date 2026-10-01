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
  Eye,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PillarId, PSKSDataRecord, UserSession } from '../../types';
import { JABAR_REGIONS, KAB_KOTA_ONLY } from '../../data/initialData';

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
      synonyms: [
        'nama lks', 'nama yayasan', 'nama lembaga', 'nama organisasi', 'nama',
        'nama panti', 'nama panti asuhan', 'panti', 'yayasan', 'lembaga',
        'organisasi', 'nama lksa', 'lksa', 'lks', 'nama orsos', 'orsos',
        'nama satuan', 'satuan sosial', 'nama yayasan/panti', 'nama panti/yayasan',
        'nama lembaga kesejahteraan sosial', 'lembaga kesejahteraan sosial',
        'nama organisasi sosial', 'nama yayasan sosial', 'nama lembaga sosial'
      ],
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
      synonyms: [
        'alamat', 'alamat sekretariat', 'alamat kantor', 'domisili', 'lokasi yayasan',
        'lokasi', 'tempat kedudukan', 'alamat panti', 'alamat lembaga'
      ],
    },
    {
      key: 'nomorTandaDaftar',
      label: 'Nomor Tanda Daftar',
      required: false,
      hint: 'Nomor Tanda Daftar Dinas Sosial / Kemenkumham',
      synonyms: [
        'nomor tanda daftar', 'no tanda daftar', 'no. tanda daftar', 'tanda daftar',
        'nomor registrasi', 'no registrasi', 'no. registrasi',
        'nomor izin operasional', 'no izin operasional', 'no. izin operasional', 'izin operasional',
        'no izin', 'nomor izin', 'no. izin', 'izin',
        'nomor sk', 'no sk', 'no. sk', 'sk dinas', 'surat keputusan',
        'ahu', 'kemenkumham', 'nomor badan hukum', 'badan hukum',
        'nomor td', 'no td', 'no. td', 'td lks', 'td-lks', 'stdb', 'tanda daftar lks'
      ],
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
// Normalisasi nama wilayah resmi Jawa Barat
function normalizeJabarRegion(val: any, defaultWilayah: string = '', contextSheets?: string[]): string {
  if (!val || typeof val !== 'string') return defaultWilayah;
  const raw = val.trim().toLowerCase();
  if (!raw) return defaultWilayah;

  // Header atau nama provinsi umum - jangan anggap sebagai nama kabupaten/kota!
  if (
    raw === 'provinsi jawa barat' ||
    raw === 'jawa barat' ||
    raw === 'jabar' ||
    raw.includes('pemerintah daerah') ||
    raw.includes('dinas sosial')
  ) {
    return defaultWilayah;
  }

  // Bersihkan tanda baca dan rapikan spasi: "kab. bekasi" -> "kab bekasi", "kab_bekasi" -> "kab bekasi"
  const clean = raw.replace(/[._\-–—]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. BEKASI (Prioritas tinggi agar Kota vs Kab tidak pernah tertukar atau bocor)
  if (
    clean.includes('kota bekasi') ||
    clean.includes('bekasi kota') ||
    clean.includes('kodya bekasi') ||
    clean.includes('kotamadya bekasi') ||
    clean === 'kota bks' ||
    clean === 'bks kota' ||
    clean === 'kt bekasi' ||
    clean === 'kot bekasi' ||
    clean === 'kt bks' ||
    // Kecamatan resmi Kota Bekasi
    clean.includes('bekasi timur') ||
    clean.includes('bekasi barat') ||
    clean.includes('bekasi selatan') ||
    clean.includes('bekasi utara') ||
    clean.includes('rawalumbu') ||
    clean.includes('medan satria') ||
    clean.includes('bantargebang') ||
    clean.includes('bantar gebang') ||
    clean.includes('pondok gede') ||
    clean.includes('jatisampurna') ||
    clean.includes('jati sampurna') ||
    clean.includes('jatiasih') ||
    clean.includes('jati asih') ||
    clean.includes('pondok melati') ||
    clean.includes('mustikajaya') ||
    clean.includes('mustika jaya')
  ) {
    return 'Kota Bekasi';
  }

  if (
    clean.includes('kab bekasi') ||
    clean.includes('kabupaten bekasi') ||
    clean.includes('bekasi kab') ||
    clean.includes('bekasi kabupaten') ||
    clean === 'kab bks' ||
    clean === 'bks kab' ||
    clean === 'kbp bekasi' ||
    clean === 'kb bekasi' ||
    // Kecamatan resmi Kabupaten Bekasi
    clean.includes('cikarang') ||
    clean.includes('tambun') ||
    clean.includes('cibitung') ||
    clean.includes('babelan') ||
    clean.includes('tarumajaya') ||
    clean.includes('sukatani') ||
    clean.includes('sukakarya') ||
    clean.includes('sukawangi') ||
    clean.includes('kedungwaringin') ||
    clean.includes('karangbahagia') ||
    clean.includes('pebayuran') ||
    clean.includes('cabangbungin') ||
    clean.includes('muaragembong') ||
    clean.includes('setu bekasi') ||
    clean.includes('serang baru') ||
    clean.includes('bojongmangu')
  ) {
    return 'Kab. Bekasi';
  }

  // 2. BANDUNG (Bandung Barat vs Kota Bandung vs Kab Bandung)
  if (
    clean.includes('bandung barat') ||
    clean.includes('barat bandung') ||
    clean === 'kbb' ||
    clean === 'kab kbb' ||
    clean.includes('ngamprah') ||
    clean.includes('padalarang') ||
    clean.includes('lembang') ||
    clean.includes('parongpong') ||
    clean.includes('cililin') ||
    clean.includes('batujajar') ||
    clean.includes('cipatat') ||
    clean.includes('cihampelas') ||
    clean.includes('sindangkerta') ||
    clean.includes('gununghalu')
  ) {
    return 'Kab. Bandung Barat';
  }

  if (
    clean.includes('kota bandung') ||
    clean.includes('bandung kota') ||
    clean.includes('kotamadya bandung') ||
    clean === 'kota bdg' ||
    clean === 'bdg kota' ||
    clean === 'kt bandung' ||
    clean === 'kot bandung' ||
    clean.includes('coblong') ||
    clean.includes('dago') ||
    clean.includes('antapani') ||
    clean.includes('arcamanik') ||
    clean.includes('buahbatu') ||
    clean.includes('lengkong') ||
    clean.includes('cicendo') ||
    clean.includes('kiaracondong') ||
    clean.includes('ujungberung') ||
    clean.includes('cibeunying')
  ) {
    return 'Kota Bandung';
  }

  if (
    clean.includes('kab bandung') ||
    clean.includes('kabupaten bandung') ||
    clean.includes('bandung kab') ||
    clean.includes('bandung kabupaten') ||
    clean === 'kab bdg' ||
    clean === 'bdg kab' ||
    clean.includes('soreang') ||
    clean.includes('baleendah') ||
    clean.includes('dayeuhkolot') ||
    clean.includes('banjaran') ||
    clean.includes('majalaya') ||
    clean.includes('ciwidey') ||
    clean.includes('pangalengan') ||
    clean.includes('rancaekek') ||
    clean.includes('cileunyi') ||
    clean.includes('ciparay')
  ) {
    return 'Kab. Bandung';
  }

  // 3. BOGOR (Kota Bogor vs Kab Bogor)
  if (
    clean.includes('kota bogor') ||
    clean.includes('bogor kota') ||
    clean === 'kota bgr' ||
    clean === 'bgr kota' ||
    clean === 'kt bogor' ||
    clean === 'kot bogor' ||
    clean.includes('tanah sareal') ||
    clean.includes('bogor timur') ||
    clean.includes('bogor barat') ||
    clean.includes('bogor selatan') ||
    clean.includes('bogor utara') ||
    clean.includes('bogor tengah')
  ) {
    return 'Kota Bogor';
  }

  if (
    clean.includes('kab bogor') ||
    clean.includes('kabupaten bogor') ||
    clean.includes('bogor kab') ||
    clean.includes('bogor kabupaten') ||
    clean === 'kab bgr' ||
    clean === 'bgr kab' ||
    clean.includes('cibinong') ||
    clean.includes('cileungsi') ||
    clean.includes('gunung putri') ||
    clean.includes('bojong gede') ||
    clean.includes('parung') ||
    clean.includes('citeureup') ||
    clean.includes('sukaraja') ||
    clean.includes('ciawi bogor') ||
    clean.includes('megamendung') ||
    clean.includes('jasinga') ||
    clean.includes('leuwiliang')
  ) {
    return 'Kab. Bogor';
  }

  // 4. CIREBON (Kota Cirebon vs Kab Cirebon)
  if (
    clean.includes('kota cirebon') ||
    clean.includes('cirebon kota') ||
    clean === 'kota crb' ||
    clean === 'crb kota' ||
    clean === 'kt cirebon' ||
    clean === 'kot cirebon' ||
    clean.includes('kejaksan') ||
    clean.includes('kesambi') ||
    clean.includes('harjamukti') ||
    clean.includes('lemahwungkuk') ||
    clean.includes('pekalipan')
  ) {
    return 'Kota Cirebon';
  }

  if (
    clean.includes('kab cirebon') ||
    clean.includes('kabupaten cirebon') ||
    clean.includes('cirebon kab') ||
    clean.includes('cirebon kabupaten') ||
    clean === 'kab crb' ||
    clean === 'crb kab' ||
    clean.includes('sumber cirebon') ||
    clean.includes('palimanan') ||
    clean.includes('arjawinangun') ||
    clean.includes('weru')
  ) {
    return 'Kab. Cirebon';
  }

  // 5. SUKABUMI (Kota Sukabumi vs Kab Sukabumi)
  if (
    clean.includes('kota sukabumi') ||
    clean.includes('sukabumi kota') ||
    clean === 'kota smi' ||
    clean === 'smi kota' ||
    clean === 'kt sukabumi' ||
    clean === 'kot sukabumi' ||
    clean.includes('cikole') ||
    clean.includes('citamiang') ||
    clean.includes('warudoyong') ||
    clean.includes('gunungpuyuh')
  ) {
    return 'Kota Sukabumi';
  }

  if (
    clean.includes('kab sukabumi') ||
    clean.includes('kabupaten sukabumi') ||
    clean.includes('sukabumi kab') ||
    clean.includes('sukabumi kabupaten') ||
    clean === 'kab smi' ||
    clean === 'smi kab' ||
    clean.includes('palabuhanratu') ||
    clean.includes('pelabuhan ratu') ||
    clean.includes('cibadak') ||
    clean.includes('cisaat') ||
    clean.includes('cicurug') ||
    clean.includes('parungkuda') ||
    clean.includes('surade')
  ) {
    return 'Kab. Sukabumi';
  }

  // 6. TASIKMALAYA (Kota Tasikmalaya vs Kab Tasikmalaya)
  if (
    clean.includes('kota tasikmalaya') ||
    clean.includes('tasikmalaya kota') ||
    clean.includes('kota tasik') ||
    clean.includes('tasik kota') ||
    clean === 'kota tsm' ||
    clean === 'tsm kota' ||
    clean === 'kt tasik' ||
    clean.includes('cihideung') ||
    clean.includes('cipedes') ||
    clean.includes('tawang') ||
    clean.includes('indihiang') ||
    clean.includes('kawalu') ||
    clean.includes('mangkubumi')
  ) {
    return 'Kota Tasikmalaya';
  }

  if (
    clean.includes('kab tasikmalaya') ||
    clean.includes('kabupaten tasikmalaya') ||
    clean.includes('tasikmalaya kab') ||
    clean.includes('tasikmalaya kabupaten') ||
    clean.includes('kab tasik') ||
    clean.includes('tasik kab') ||
    clean === 'kab tsm' ||
    clean === 'tsm kab' ||
    clean.includes('singaparna') ||
    clean.includes('karangnunggal')
  ) {
    return 'Kab. Tasikmalaya';
  }

  // 7. KOTA MANDIRI (tanpa pasangan kabupaten)
  if (clean.includes('cimahi')) return 'Kota Cimahi';
  if (clean.includes('depok') || clean.includes('sawangan') || clean.includes('cinere') || clean.includes('cimanggis')) return 'Kota Depok';
  if (clean.includes('banjar')) return 'Kota Banjar';

  // 8. KABUPATEN MANDIRI (tanpa pasangan kota)
  if (clean.includes('cianjur')) return 'Kab. Cianjur';
  if (clean.includes('garut')) return 'Kab. Garut';
  if (clean.includes('ciamis')) return 'Kab. Ciamis';
  if (clean.includes('kuningan')) return 'Kab. Kuningan';
  if (clean.includes('majalengka')) return 'Kab. Majalengka';
  if (clean.includes('sumedang') || clean.includes('jatinangor')) return 'Kab. Sumedang';
  if (clean.includes('indramayu') || clean.includes('jatibarang')) return 'Kab. Indramayu';
  if (clean.includes('subang') || clean.includes('pamanukan')) return 'Kab. Subang';
  if (clean.includes('purwakarta')) return 'Kab. Purwakarta';
  if (clean.includes('karawang') || clean.includes('cikampek') || clean.includes('klari')) return 'Kab. Karawang';
  if (clean.includes('pangandaran')) return 'Kab. Pangandaran';

  // 9. Konteks Sheet Names Cerdas jika teks hanya kata tunggal "bekasi", "bandung", "bogor", dll
  if (clean === 'bekasi' || clean === 'bks') {
    if (contextSheets && contextSheets.length > 0) {
      const hasKab = contextSheets.some((s) => s.toLowerCase().includes('kab'));
      const hasKota = contextSheets.some((s) => s.toLowerCase().includes('kota'));
      if (hasKab && !hasKota) return 'Kab. Bekasi';
      if (hasKota && !hasKab) return 'Kota Bekasi';
    }
    // Jika defaultWilayah adalah salah satu varian Bekasi, ikuti defaultWilayah
    if (defaultWilayah === 'Kota Bekasi' || defaultWilayah === 'Kab. Bekasi') return defaultWilayah;
    return 'Kab. Bekasi';
  }

  if (clean === 'bandung' || clean === 'bdg') {
    if (defaultWilayah.includes('Bandung')) return defaultWilayah;
    return 'Kota Bandung';
  }
  if (clean === 'bogor' || clean === 'bgr') {
    if (defaultWilayah.includes('Bogor')) return defaultWilayah;
    return 'Kab. Bogor';
  }
  if (clean === 'cirebon' || clean === 'crb') {
    if (defaultWilayah.includes('Cirebon')) return defaultWilayah;
    return 'Kab. Cirebon';
  }
  if (clean === 'sukabumi' || clean === 'smi') {
    if (contextSheets && contextSheets.length > 0) {
      const hasKab = contextSheets.some((s) => s.toLowerCase().includes('kab'));
      const hasKota = contextSheets.some((s) => s.toLowerCase().includes('kota'));
      if (hasKab && !hasKota) return 'Kab. Sukabumi';
      if (hasKota && !hasKab) return 'Kota Sukabumi';
    }
    if (defaultWilayah.includes('Sukabumi')) return defaultWilayah;
    return 'Kota Sukabumi';
  }
  if (clean === 'tasikmalaya' || clean === 'tasik' || clean === 'tsm') {
    if (contextSheets && contextSheets.length > 0) {
      const hasKab = contextSheets.some((s) => s.toLowerCase().includes('kab'));
      const hasKota = contextSheets.some((s) => s.toLowerCase().includes('kota'));
      if (hasKab && !hasKota) return 'Kab. Tasikmalaya';
      if (hasKota && !hasKab) return 'Kota Tasikmalaya';
    }
    if (defaultWilayah.includes('Tasik')) return defaultWilayah;
    return 'Kab. Tasikmalaya';
  }

  for (const reg of JABAR_REGIONS) {
    if (reg.toLowerCase() === raw || reg.toLowerCase() === clean) return reg;
  }

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
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [forceTargetRegion, setForceTargetRegion] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Target fields SPESIFIK & SESUAI PERSIS dengan tabel pilar yang sedang dibuka
  const targetFields = useMemo(() => {
    return PILLAR_FIELD_DEFINITIONS[pillarId] || PILLAR_FIELD_DEFINITIONS.peksos;
  }, [pillarId]);

  // Cuplikan contoh isi nyata untuk setiap kolom di Excel (sampel nilai unik)
  const columnSampleValues = useMemo(() => {
    const samples: Record<string, string[]> = {};
    if (!excelHeaders.length || !dataRows.length) return samples;

    excelHeaders.forEach((header, colIdx) => {
      const items: string[] = [];
      const colKey = `col_${colIdx}`;
      // Telusuri baris untuk mengumpulkan hingga 6 nilai unik (sangat berguna untuk melihat variasi kota/wilayah)
      for (let r = 0; r < dataRows.length; r++) {
        const val = dataRows[r]?.[colIdx];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          const str = String(val).trim();
          // Jika bukan kolom nomor urut pertama, abaikan angka tunggal baris nomor kolom (1, 2, 3, 4) & KOP dinas
          if (colIdx > 0 && /^\d{1,2}$/.test(str)) continue;
          if (str.toLowerCase().includes('pemerintah daerah') || str.toLowerCase().includes('dinas sosial')) continue;

          if (!items.includes(str)) {
            items.push(str);
            if (items.length >= 6) break;
          }
        }
      }
      samples[header] = items;
      samples[colKey] = items;
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

  // Deteksi cerdas dan 100% presisi baris judul (header) tabel di Excel
  // Mencegah baris data terpotong (misal 185 jadi 178) atau baris header masuk jadi data (misal 457 jadi 458)
  const detectHeaderRowIndex = (rows: any[][]): number => {
    if (!rows || rows.length === 0) return 0;

    // 1. Prioritas Utama: Cari keberadaan nomor urut data (1, 2, 3...) di kolom awal
    // Di hampir seluruh file Excel dinas, baris tepat di bawah header dimulai dengan angka 1 dan 2
    for (let r = 0; r < Math.min(15, rows.length - 1); r++) {
      const rowCurr = rows[r] || [];
      const rowNext = rows[r + 1] || [];

      const c0Curr = String(rowCurr[0] ?? '').trim();
      const c0Next = String(rowNext[0] ?? '').trim();
      const c1Curr = String(rowCurr[1] ?? '').trim();
      const c1Next = String(rowNext[1] ?? '').trim();

      const isCol0Seq = c0Curr === '1' && c0Next === '2';
      const isCol1Seq = c1Curr === '1' && c1Next === '2';

      if (isCol0Seq || isCol1Seq) {
        // Baris r adalah baris data anggota pertama!
        // Berarti baris judul tabel adalah baris r - 1
        if (r === 0) return -1; // File langsung berisi data anggota tanpa header

        // Jika r >= 2, periksa apakah baris r - 1 adalah baris penomoran kolom (1) | (2) | (3)
        if (r >= 2) {
          const prevRow = rows[r - 1] || [];
          const nonEmpties = prevRow.filter((c) => c !== null && String(c).trim() !== '').map((c) => String(c).trim());
          const isColumnNumbering = nonEmpties.length >= 3 && nonEmpties.every((c) => /^\(?\d+\)?$/.test(c));
          if (isColumnNumbering) {
            return r - 2;
          }
        }
        return r - 1;
      }
    }

    // 2. Prioritas Kedua: Penilaian Cerdas Berdasarkan Kata Kunci Header Kolom
    const maxSearch = Math.min(10, rows.length);
    let bestIdx = 0;
    let bestScore = -100;

    const exactHeaderWords = [
      'no', 'no.', 'nomor', 'nama', 'nama lks', 'nama yayasan', 'nama lembaga', 'nama organisasi',
      'bidang', 'bidang pelayanan', 'jenis pelayanan', 'ketua', 'nama ketua', 'pimpinan',
      'alamat', 'alamat sekretariat', 'alamat kantor', 'domisili',
      'nomor tanda daftar', 'no tanda daftar', 'tanda daftar', 'izin', 'no izin', 'izin operasional',
      'masa berlaku', 'berlaku sampai', 'periode', 'telepon', 'hp', 'kontak', 'status',
      'kabupaten', 'kota', 'kab/kota', 'wilayah', 'kecamatan', 'kelurahan', 'desa',
      'nik', 'nik/no ktp', 'ktp', 'sertifikasi', 'keaktifan'
    ];

    for (let i = 0; i < maxSearch; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;
      const nonEmptyCells = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== '');
      if (nonEmptyCells.length < 2) continue; // Baris judul tunggal/KOP dinas

      let score = 0;
      const texts = nonEmptyCells.map((c) => String(c).trim().toLowerCase());

      // Jika sel pertama adalah angka urut 1, 2, 3... ini jelas baris data, bukan header!
      const firstCell = texts[0] || '';
      if (/^\d+$/.test(firstCell) && parseInt(firstCell, 10) > 0) {
        score -= 50;
      }

      texts.forEach((text) => {
        // Teks yang sangat panjang (> 45 karakter) seperti alamat lengkap atau deskripsi adalah data, bukan nama kolom
        if (text.length > 45) {
          score -= 10;
        } else if (text.length > 0 && text.length <= 35) {
          if (exactHeaderWords.includes(text)) {
            score += 15;
          } else if (exactHeaderWords.some((w) => text.startsWith(w + ' ') || text.endsWith(' ' + w))) {
            score += 10;
          } else if (exactHeaderWords.some((w) => text.includes(w))) {
            if (text.length <= 25) {
              score += 4;
            }
          }
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    return bestScore >= 5 ? bestIdx : 0;
  };

  // Terapkan pilihan baris header dan muat seluruh data di bawahnya secara utuh 100%
  const applyHeaderRowIndex = (hIdx: number, allRows: any[][], currentSheetName?: string) => {
    setHeaderRowIndex(hIdx);

    if (hIdx === -1) {
      // Mode tanpa baris judul (Baris 1 langsung berisi data anggota)
      const validRows = allRows.filter((r) => r && Array.isArray(r) && r.some((c) => c !== null && String(c).trim() !== ''));
      const maxCols = Math.max(4, ...validRows.map((r) => r.length));
      const headers = Array.from({ length: maxCols }, (_, idx) => `Kolom ${idx + 1}`);

      setExcelHeaders(headers);
      setDataRows(validRows);
      autoMapColumns(headers, validRows, currentSheetName);
      return;
    }

    const headerRow = allRows[hIdx] || [];
    const sampleRows = allRows.slice(hIdx + 1, hIdx + 15);
    const maxCols = Math.max(headerRow.length, ...sampleRows.map((r) => r?.length || 0), 4);
    const headers: string[] = [];

    for (let c = 0; c < maxCols; c++) {
      const rawTitle = String(headerRow[c] || '').trim();
      if (rawTitle) {
        headers.push(rawTitle);
      } else {
        headers.push(`Kolom ${c + 1}`);
      }
    }

    setExcelHeaders(headers);

    // Seluruh baris DI BAWAH baris header adalah data utuh 100%!
    // Saring baris yang 100% kosong atau baris nomor urut indeks kolom (1) | (2) | (3)
    const dataRowsAfterHeader = (hIdx === -1 ? allRows : allRows.slice(hIdx + 1)).filter((r) => {
      if (!r || !Array.isArray(r)) return false;
      const hasContent = r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (!hasContent) return false;

      // Saring jika baris ini HANYA baris penomoran indeks kolom "(1) | (2) | (3)"
      const nonEmpties = r.filter((c) => c !== null && String(c).trim() !== '').map((c) => String(c).trim());
      if (nonEmpties.length >= 3 && nonEmpties.every((c) => /^\(?\d+\)?$/.test(c))) {
        return false;
      }
      return true;
    });

    setDataRows(dataRowsAfterHeader);
    autoMapColumns(headers, dataRowsAfterHeader, currentSheetName);
  };

  // Pencocokan otomatis kolom Excel ke field tabel pilar
  const autoMapColumns = (headers: string[], rows: any[][], currentSheetName?: string) => {
    const activeSheet = currentSheetName || selectedSheet;
    const hasMultipleSheets = sheetNames.length > 1;
    const initialMapping: Record<string, string> = {};

    // 1. Deteksi apakah ada kolom yang memuat nama kota/kabupaten di Jawa Barat
    let detectedWilayahCol = '';
    headers.forEach((h, colIdx) => {
      const lower = h.toLowerCase();
      if (lower.includes('kabupaten') || lower.includes('kota') || lower.includes('kab/kota') || lower.includes('wilayah')) {
        detectedWilayahCol = h;
      }
    });

    if (!detectedWilayahCol) {
      headers.forEach((h, colIdx) => {
        const matchCityCount = rows.slice(0, 15).filter((r) => {
          const val = String(r[colIdx] || '').toLowerCase().trim();
          return JABAR_REGIONS.some((reg) => {
            const simple = reg.toLowerCase().replace('kab. ', '').replace('kota ', '').trim();
            return val.includes(simple);
          });
        }).length;
        if (matchCityCount >= 2 && !detectedWilayahCol) {
          detectedWilayahCol = h;
        }
      });
    }

    // 2. Pemetaan pintar setiap target field
    targetFields.forEach((target) => {
      if (target.key === 'wilayah' || target.key === 'wilayahKerja') {
        if (detectedWilayahCol) {
          const wIdx = headers.indexOf(detectedWilayahCol);
          initialMapping[target.key] = wIdx >= 0 ? `col_${wIdx}` : detectedWilayahCol;
        } else if (hasMultipleSheets || (activeSheet && normalizeJabarRegion(activeSheet, '') !== '')) {
          initialMapping[target.key] = '__SHEET_NAME__';
        } else {
          initialMapping[target.key] = headers.length > 2 ? 'col_2' : (headers.length > 0 ? 'col_0' : '');
        }
        return;
      }

      // Cocokkan judul header Excel dengan sinonim atau label field
      let bestIdx = -1;
      for (let c = 0; c < headers.length; c++) {
        const h = headers[c];
        const hLow = h.toLowerCase().trim();
        // Exact synonym match
        if (target.synonyms.some((s) => s.toLowerCase() === hLow)) {
          bestIdx = c;
          break;
        }
        // Substring synonym match
        if (target.synonyms.some((s) => hLow.includes(s.toLowerCase()))) {
          bestIdx = c;
          break;
        }
      }

      // Fallback berdasarkan urutan posisi umum jika tidak ada kecocokan teks
      if (bestIdx < 0) {
        if (target.key === 'nama' || target.key === 'namaLks' || target.key === 'namaKarangTaruna' || target.key === 'namaLk3' || target.key === 'namaBadanUsaha' || target.key === 'namaSlrt') {
          bestIdx = headers.length > 1 ? 1 : (headers.length > 0 ? 0 : -1);
        } else if (target.key === 'alamat' || target.key === 'alamatLks' || target.key === 'alamatSekretariat') {
          bestIdx = headers.length > 3 ? 3 : (headers.length > 2 ? 2 : -1);
        } else if (target.key === 'nik' || target.key === 'nomorInduk') {
          bestIdx = headers.length > 0 ? 0 : -1;
        } else if (target.key === 'hp' || target.key === 'nomorKontak' || target.key === 'kontak') {
          bestIdx = headers.length > 4 ? 4 : -1;
        } else if (target.key === 'nomorTandaDaftar' || target.key === 'sertifikasi') {
          bestIdx = headers.length > 5 ? 5 : -1;
        }
      }

      if (bestIdx >= 0 && bestIdx < headers.length) {
        initialMapping[target.key] = `col_${bestIdx}`;
      } else {
        initialMapping[target.key] = '';
      }
    });

    setColumnMapping(initialMapping);
  };

  // Handler pergantian baris header secara manual oleh pengguna
  const handleHeaderRowChange = (newIdx: number) => {
    applyHeaderRowIndex(newIdx, rawSheetRows);
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
      setForceTargetRegion('');

      // Parse baris mentah
      const sheet = workbook.Sheets[firstSheet];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!jsonData || jsonData.length === 0) {
        throw new Error(`Lembar kerja "${firstSheet}" kosong.`);
      }

      const sRegion = normalizeJabarRegion(firstSheet, '', workbook.SheetNames);
      jsonData.forEach((row) => {
        if (row && typeof row === 'object') {
          (row as any).__sourceSheet = firstSheet;
          (row as any).__sheetRegion = sRegion;
        }
      });

      setRawSheetRows(jsonData);
      const detectedIdx = detectHeaderRowIndex(jsonData);
      applyHeaderRowIndex(detectedIdx, jsonData, firstSheet);
      setStep(2);
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setParseError(err?.message || 'Gagal membaca isi file Excel. Pastikan format file valid (.xlsx, .xls, atau .csv).');
    } finally {
      setIsProcessing(false);
    }
  };

  // Ganti lembar kerja (sheet) aktif jika file Excel memiliki banyak sheet (misal: per kota)
  const handleSheetChange = (sheetName: string) => {
    if (!rawWorkbook) return;
    try {
      setSelectedSheet(sheetName);

      if (sheetName === '__ALL_SHEETS__') {
        // Mode Gabungkan Seluruh Sheet Sekaligus (All Sheets at Once)
        // KUNCI PRESISI 100%: Setiap Sheet diproses dan dipotong Header-nya secara MANDIRI!
        let referenceHeaders: string[] = [];
        let allProcessedDataRows: any[][] = [];

        rawWorkbook.SheetNames.forEach((sName) => {
          const sheet = rawWorkbook.Sheets[sName];
          if (!sheet) return;
          const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (!jsonData || jsonData.length === 0) return;

          const sRegion = normalizeJabarRegion(sName, '', rawWorkbook.SheetNames);

          // 1. Deteksi baris header untuk sheet ini secara spesifik & akurat
          const sHeaderIdx = detectHeaderRowIndex(jsonData);
          const sHeaderRow = sHeaderIdx >= 0 ? (jsonData[sHeaderIdx] || []) : [];
          const currentSheetHeaders = sHeaderRow.map((c) => String(c || '').trim());

          if (referenceHeaders.length === 0 && currentSheetHeaders.length > 0) {
            referenceHeaders = currentSheetHeaders;
          }

          // 2. Ambil baris data HANYA di bawah header sheet ini (Header sheet ini TIDAK AKAN masuk sebagai baris data palsu!)
          const rawDataRows = sHeaderIdx === -1 ? jsonData : jsonData.slice(sHeaderIdx + 1);

          // 3. Saring baris yang benar-benar kosong
          rawDataRows.forEach((row) => {
            if (!row || !Array.isArray(row)) return;
            const hasContent = row.some((c) => c !== null && c !== undefined && String(c).trim() !== '');
            if (!hasContent) return;

            // Saring jika baris ini adalah baris penomoran indeks kolom (1) | (2) | (3)
            const nonEmpties = row.filter((c) => c !== null && String(c).trim() !== '').map((c) => String(c).trim());
            if (nonEmpties.length >= 3 && nonEmpties.every((c) => /^\(?\d+\)?$/.test(c))) {
              return;
            }

            // Buat row object dengan metadata sheet dan wilayah sheet tersebut
            const taggedRow = [...row];
            (taggedRow as any).__sourceSheet = sName;
            (taggedRow as any).__sheetHeaders = currentSheetHeaders;
            (taggedRow as any).__sheetRegion = sRegion;

            allProcessedDataRows.push(taggedRow);
          });
        });

        // Bentuk headers acuan dari sheet yang memiliki header valid
        const maxCols = Math.max(referenceHeaders.length, 4);
        const headers: string[] = [];
        for (let c = 0; c < maxCols; c++) {
          const rawTitle = String(referenceHeaders[c] || '').trim();
          headers.push(rawTitle ? rawTitle : `Kolom ${c + 1}`);
        }

        setHeaderRowIndex(0);
        setRawSheetRows(allProcessedDataRows);
        setExcelHeaders(headers);
        setDataRows(allProcessedDataRows);
        autoMapColumns(headers, allProcessedDataRows, '__ALL_SHEETS__');
        return;
      }

      // Lembar kerja tunggal (Single Sheet)
      const sheet = rawWorkbook.Sheets[sheetName];
      if (!sheet) {
        throw new Error(`Lembar kerja "${sheetName}" tidak ditemukan.`);
      }
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!jsonData || jsonData.length === 0) {
        setRawSheetRows([]);
        setExcelHeaders([]);
        setDataRows([]);
        return;
      }
      const sRegion = normalizeJabarRegion(sheetName, '', rawWorkbook.SheetNames);
      jsonData.forEach((row) => {
        if (row && typeof row === 'object') {
          (row as any).__sourceSheet = sheetName;
          (row as any).__sheetRegion = sRegion;
        }
      });
      setRawSheetRows(jsonData);
      const detectedIdx = detectHeaderRowIndex(jsonData);
      applyHeaderRowIndex(detectedIdx, jsonData, sheetName);
    } catch (err: any) {
      console.error('Error switching sheet:', err);
      setParseError(err?.message || 'Gagal memuat lembar kerja yang dipilih.');
    }
  };

  // Lanjut import sheet berikutnya dari file yang sama
  const handleContinueToNextSheet = () => {
    const currentIdx = sheetNames.indexOf(selectedSheet);
    const nextIdx = currentIdx + 1 < sheetNames.length ? currentIdx + 1 : 0;
    const nextSheetName = sheetNames[nextIdx];
    handleSheetChange(nextSheetName);
    setStep(2);
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

    const defaultWilayah = selectedSheet && selectedSheet !== '__ALL_SHEETS__'
      ? normalizeJabarRegion(selectedSheet, session.wilayah && session.wilayah !== 'Semua Wilayah' ? session.wilayah : 'Kab. Bandung Barat', rawWorkbook?.SheetNames)
      : session.wilayah && session.wilayah !== 'Semua Wilayah' ? session.wilayah : 'Kab. Bandung Barat';
    const baseTimestamp = Date.now();

    return dataRows.map((row, index) => {
      const rowSourceSheet = (row as any).__sourceSheet || (selectedSheet !== '__ALL_SHEETS__' ? selectedSheet : '');
      const rowSheetRegion = (row as any).__sheetRegion || (rowSourceSheet ? normalizeJabarRegion(rowSourceSheet, '', rawWorkbook?.SheetNames) : '');
      const sheetHeaders = (row as any).__sheetHeaders as string[] | undefined;

      const getVal = (targetKey: string): any => {
        const mappingChoice = columnMapping[targetKey];
        if (!mappingChoice) return '';
        if (mappingChoice === '__SHEET_NAME__') return '';

        let refColIdx = -1;
        if (typeof mappingChoice === 'string' && mappingChoice.startsWith('col_')) {
          refColIdx = parseInt(mappingChoice.replace('col_', ''), 10);
        } else if (typeof mappingChoice === 'number') {
          refColIdx = mappingChoice;
        } else if (typeof mappingChoice === 'string') {
          const strictKolomMatch = mappingChoice.match(/^kolom\s+(\d+)$/i);
          if (strictKolomMatch) {
            refColIdx = parseInt(strictKolomMatch[1], 10) - 1;
          } else {
            refColIdx = excelHeaders.indexOf(mappingChoice);
            if (refColIdx < 0) {
              refColIdx = excelHeaders.findIndex(
                (h) => h.toLowerCase().trim() === mappingChoice.toLowerCase().trim()
              );
            }
          }
        }

        // Jika baris ini berasal dari sheet yang memiliki header tersendiri (__sheetHeaders):
        // Periksa apakah posisi kolom di sheet ini bergeser dengan mencocokkan nama judul kolom!
        if (sheetHeaders && Array.isArray(sheetHeaders) && sheetHeaders.length > 0) {
          const refHeaderTitle = excelHeaders[refColIdx] ? excelHeaders[refColIdx].toLowerCase().trim() : '';

          // 1. Cocokkan persis dengan nama judul kolom acuan (jika bukan nama default "Kolom X")
          if (refHeaderTitle && !refHeaderTitle.startsWith('kolom ')) {
            const matchedColInSheet = sheetHeaders.findIndex(
              (sh) => sh.toLowerCase().trim() === refHeaderTitle
            );
            if (matchedColInSheet >= 0 && matchedColInSheet < row.length) {
              return row[matchedColInSheet] ?? '';
            }
          }

          // 2. Cocokkan dengan sinonim target field pilar
          const targetDef = targetFields.find((tf) => tf.key === targetKey);
          if (targetDef && targetDef.synonyms.length > 0) {
            const matchedSynonymIdx = sheetHeaders.findIndex((sh) => {
              const shLow = sh.toLowerCase().trim();
              return targetDef.synonyms.some((s) => s.toLowerCase() === shLow || shLow.includes(s.toLowerCase()));
            });
            if (matchedSynonymIdx >= 0 && matchedSynonymIdx < row.length) {
              return row[matchedSynonymIdx] ?? '';
            }
          }
        }

        if (refColIdx < 0 || refColIdx >= row.length) return '';
        return row[refColIdx] ?? '';
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
          if (forceTargetRegion) {
            record[field.key] = forceTargetRegion;
            return;
          }
          const mappingChoice = columnMapping[field.key];
          let regionFound = '';

          // 1. OTORITAS TERTINGGI & ANTI-BERCAMPUR:
          // Jika baris berasal dari sheet tertentu (misal Sheet "Kota Bekasi" atau "Kab. Bekasi"),
          // MAKA SELURUH DATA DALAM SHEET TERSEBUT 100% PASTI ADALAH MILIK WILAYAH TERSEBUT!
          // TEKS DI DALAM ALAMAT ATAU KOLOM LAIN TIDAK BOLEH MENUKAR NAMA TAB SHEET!
          if (rowSheetRegion) {
            regionFound = rowSheetRegion;
          } else if (mappingChoice === '__SHEET_NAME__' && rowSourceSheet) {
            regionFound = normalizeJabarRegion(rowSourceSheet, '', rawWorkbook?.SheetNames);
          } else {
            // Jika nama sheet bukan nama kota (misal "Sheet1", "Data 2024"), baru ambil dari kolom yang dipetakan
            if (rawVal) {
              regionFound = normalizeJabarRegion(rawVal, '', rawWorkbook?.SheetNames);
            }
          }

          if (!regionFound) {
            if (pillarId === 'peksos' && session.wilayah === 'Prov. Jabar') {
              regionFound = 'Prov. Jabar';
            } else if (session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah') {
              regionFound = session.wilayah;
            } else {
              regionFound = defaultWilayah || 'Kab. Bandung Barat';
            }
          }
          record[field.key] = regionFound;
        } else if (field.key === 'hp' || field.key === 'nomorKontak' || field.key === 'kontak') {
          record[field.key] = sanitizePhone(rawVal) || '-';
        } else if (field.key === 'jenisKelamin') {
          record[field.key] = sanitizeGender(rawVal) || 'Laki-laki';
        } else if (field.key === 'nomorTandaDaftar') {
          const str = String(rawVal || '').trim();
          record.nomorTandaDaftar = str === 'CERT-2026' ? '' : str;
          record.sertifikasi = record.nomorTandaDaftar;
        } else if (field.key === 'sertifikasi') {
          const str = String(rawVal || '').trim();
          record.sertifikasi = str === 'CERT-2026' ? '' : str;
        } else {
          record[field.key] = String(rawVal || '').trim();
        }
      });

      // Jika pilar LKS: sinkronisasi nomor tanda daftar ke sertifikasi & nik agar konsisten di semua tampilan
      if (pillarId === 'lks') {
        if (!record.nomorTandaDaftar || record.nomorTandaDaftar === 'CERT-2026') {
          record.nomorTandaDaftar = record.sertifikasi && record.sertifikasi !== 'CERT-2026' ? record.sertifikasi : '';
        }
        if (record.nomorTandaDaftar) {
          record.sertifikasi = record.nomorTandaDaftar;
          if (!record.nik) {
            record.nik = record.nomorTandaDaftar;
          }
        }
      }

      // Sinkronisasi alias untuk tabel
      if (record.namaLks) record.nama = record.namaLks;
      if (record.namaKarangTaruna) record.nama = record.namaKarangTaruna;
      if (record.namaLk3) record.nama = record.namaLk3;
      if (record.namaBadanUsaha) record.nama = record.namaBadanUsaha;
      if (record.namaSlrt) record.nama = record.namaSlrt;

      // Default jika wilayah tidak terpetakan
      if (!record.wilayah || forceTargetRegion) {
        record.wilayah = forceTargetRegion || record.wilayah || defaultWilayah;
      }

      return record as Omit<PSKSDataRecord, 'id'>;
    }).filter((r, index) => {
      // Baris data valid jika memiliki minimal satu konten yang berarti
      const hasAnyData = Object.entries(r).some(([k, v]) => {
        if (['pillarId', 'status', 'orderIndex', 'createdAt', 'wilayah'].includes(k)) return false;
        const s = String(v || '').trim();
        return s !== '' && s !== '-';
      });

      if (!hasAnyData) return false;

      const n = (r.nama || '').trim();
      const lower = n.toLowerCase();

      // Saring jika baris ini adalah baris pengulangan KOP atau header tabel
      if (n === 'NO.' || n === 'NO' || n === 'No') return false;
      if (
        lower === 'pemerintah daerah provinsi jawa barat' ||
        lower === 'dinas sosial' ||
        lower === 'provinsi jawa barat' ||
        lower.startsWith('pemerintah daerah') ||
        lower.startsWith('rekapitulasi data') ||
        lower === 'jumlah' ||
        lower === 'total' ||
        lower.startsWith('total ') ||
        lower.startsWith('jumlah ') ||
        lower === 'nama lks' ||
        lower === 'nama yayasan' ||
        lower === 'nama lembaga' ||
        lower === 'nama organisasi' ||
        lower === 'nama'
      ) {
        return false;
      }

      // Jangan pernah buang data anggota hanya karena kolom nama kosong di file
      if (!n || n === '-') {
        r.nama = r.nomorTandaDaftar
          ? `LKS (${r.nomorTandaDaftar})`
          : (r.ketua ? `LKS [Ketua: ${r.ketua}]` : `[Data Anggota ${index + 1}]`);
      }

      return true;
    });
  }, [dataRows, excelHeaders, columnMapping, pillarId, targetFields, session.wilayah, selectedSheet, rawWorkbook, forceTargetRegion]);

  // Ringkasan persebaran wilayah/kota yang berhasil terpetakan
  const detectedRegionsSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    mappedRecords.forEach((r) => {
      const w = r.wilayah || 'Tidak Terpetakan';
      counts[w] = (counts[w] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [mappedRecords]);

  // Eksekusi Import Massal ke Database
  const handleExecuteImport = async () => {
    if (!mappedRecords.length) return;
    isCancelledRef.current = false;
    setIsProcessing(true);
    setImportProgress({ current: 0, total: mappedRecords.length });

    try {
      const count = await onBatchImport(mappedRecords);
      if (isCancelledRef.current) {
        setParseError('Proses import berhasil dibatalkan oleh pengguna.');
        return;
      }
      setImportResultCount(count);
      setStep(4); // Sukses
    } catch (err: any) {
      if (isCancelledRef.current) {
        setParseError('Proses import berhasil dibatalkan.');
        return;
      }
      console.error('Import failed:', err);
      setParseError(err?.message || 'Terjadi kesalahan saat menyimpan data import ke database.');
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  const handleCancelImport = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setImportProgress(null);
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
              {/* Pilihan Lembar Kerja (Sheet Selector) jika file memiliki banyak sheet */}
              {sheetNames.length > 1 && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-sm space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider block">
                          Pilih Lembar Kerja (Sheet / Kota) Yang Ingin Di-Import:
                        </span>
                        <span className="text-xs text-emerald-800 font-medium">
                          File Excel ini memiliki <strong>{sheetNames.length} sheet/kota berbeda</strong>:
                        </span>
                      </div>
                    </div>
                    <div className="w-full sm:w-80">
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="w-full bg-white border-2 border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs font-black text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                      >
                        <option value="__ALL_SHEETS__" className="font-extrabold text-emerald-900 bg-emerald-100">
                          🌟 [SEMUA LEMBAR KERJA] Gabungkan Seluruh Sheet Sekaligus ({sheetNames.length} Sheet)
                        </option>
                        {sheetNames.map((sName, sIdx) => (
                          <option key={sName} value={sName}>
                            📑 Sheet {sIdx + 1}: {sName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-900 font-bold bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-300">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      {selectedSheet === '__ALL_SHEETS__' ? (
                        <>Sedang memproses <strong>SELURUH LEMBAR KERJA SEKALIGUS</strong> ({sheetNames.length} sheet digabungkan • {dataRows.length} total baris terdeteksi).</>
                      ) : (
                        <>Sedang memproses <strong>Sheet "{selectedSheet}"</strong> ({dataRows.length} baris data terdeteksi).</>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Pengaturan Baris Header Cerdas (Smart Header Row Selector) */}
              <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border-2 border-emerald-500 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-black text-emerald-950 text-xs sm:text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      Pilih Baris Judul Kolom (Header) di File Excel Anda:
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Sistem membaca nama judul kolom dari baris yang Anda pilih di bawah ini agar sinkron persis dengan tabel:
                    </p>
                  </div>
                  <div className="w-full sm:w-96 shrink-0">
                    <select
                      value={headerRowIndex}
                      onChange={(e) => handleHeaderRowChange(Number(e.target.value))}
                      disabled={selectedSheet === '__ALL_SHEETS__'}
                      className="w-full bg-white border-2 border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs font-black text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer disabled:bg-emerald-50 disabled:text-emerald-900 disabled:cursor-default"
                    >
                      {selectedSheet === '__ALL_SHEETS__' ? (
                        <option value={0}>
                          ⚡ Otomatis: Baris judul dipotong mandiri per masing-masing sheet
                        </option>
                      ) : (
                        <>
                          <option value={-1} className="font-bold text-amber-900 bg-amber-50">
                            🚀 [File Langsung Berisi Data (Baris 1 Sudah Data Anggota)]
                          </option>
                          {rawSheetRows.slice(0, Math.min(10, rawSheetRows.length)).map((row, rIdx) => {
                            const preview = row
                              .filter((c) => c !== null && String(c).trim() !== '')
                              .slice(0, 4)
                              .map((c) => String(c).trim())
                              .join(' | ');
                            return (
                              <option key={rIdx} value={rIdx}>
                                📑 Baris ke-{rIdx + 1}: {preview ? `[ ${preview.slice(0, 45)}... ]` : '(Baris Kosong)'}
                              </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>File: <strong>{file?.name}</strong></span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg shadow-2xs">
                    ✨ Terdeteksi: <strong>{dataRows.length} Baris Data</strong> (100% Utuh di Bawah Baris Judul)
                  </span>
                </div>
              </div>

              {/* FITUR SOLUSI POIN 1: KUNCI WILAYAH TARGET (PILIHAN MANUAL PASTI MASUK 100%) */}
              <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                      <MapPin className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider block">
                        Kunci Wilayah Tujuan (Solusi Praktis &amp; 100% Pasti Masuk):
                      </span>
                      <span className="text-xs text-amber-900 font-medium">
                        Jika file ini khusus untuk 1 kabupaten/kota (Garut, Tasikmalaya, Kuningan, Indramayu, Sukabumi, dll), pilih di sini:
                      </span>
                    </div>
                  </div>
                  <div className="w-full sm:w-80 shrink-0">
                    <select
                      value={forceTargetRegion}
                      onChange={(e) => setForceTargetRegion(e.target.value)}
                      className="w-full bg-white border-2 border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-black text-amber-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="">⚡ [OTOMATIS]: Deteksi dari Kolom / Sheet Excel</option>
                      {KAB_KOTA_ONLY.map((r) => (
                        <option key={r} value={r}>
                          📍 Kunci ke: {r} (100% Seluruh Baris Masuk Sini)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {forceTargetRegion ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950 bg-amber-100/90 px-3.5 py-2 rounded-xl border border-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Wilayah Dikunci: Seluruh <strong>{mappedRecords.length} data</strong> di file ini <strong>100% dipastikan masuk ke {forceTargetRegion}</strong> tanpa terpengaruh ada/tidaknya kolom wilayah di Excel.
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800 italic">
                    Tips: Jika file Excel Anda tidak memiliki kolom bertuliskan nama kabupaten/kota, pilih nama wilayahnya pada menu di atas agar data langsung tercatat 100% akurat.
                  </p>
                )}
              </div>

              {/* Panduan Pemetaan yang Jelas */}
              <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-black text-amber-900 block">
                    Cara Menentukan Kolom (Sangat Mudah 1, 2, 3, 4):
                  </span>
                  <p className="text-amber-900/90 leading-relaxed">
                    Di sebelah kiri adalah <strong>Judul Kolom Tabel {pillar.shortName}</strong>. Di sebelah kanan, cukup pilih <strong>Kolom 1, Kolom 2, Kolom 3, dst</strong> sesuai posisi kolom di file Excel Anda. Sistem sudah menyertakan contoh data asli di samping setiap nomor kolom agar tidak tertukar!
                  </p>
                </div>
              </div>

              {/* Rangkuman Persebaran Wilayah Terdeteksi (Langsung Kelihatan di Langkah 2) */}
              {detectedRegionsSummary.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black shadow-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        Persebaran Wilayah Terdeteksi ({detectedRegionsSummary.length} Kabupaten/Kota):
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800">
                      Total: <strong>{mappedRecords.length} Data</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1 overscroll-contain">
                    {detectedRegionsSummary.map(([regionName, count]) => (
                      <span
                        key={regionName}
                        className="bg-white border border-emerald-300 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1.5"
                      >
                        <span>📍 {regionName}:</span>
                        <strong className="text-emerald-950 font-black">{count} Data</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                    const rawSelected = columnMapping[field.key] || '';
                    let selectedColKey = rawSelected;
                    if (rawSelected && rawSelected !== '__SHEET_NAME__' && !rawSelected.startsWith('col_')) {
                      const foundIdx = excelHeaders.indexOf(rawSelected);
                      if (foundIdx >= 0) {
                        selectedColKey = `col_${foundIdx}`;
                      } else {
                        const strictMatch = rawSelected.match(/^kolom\s+(\d+)$/i);
                        if (strictMatch) {
                          selectedColKey = `col_${parseInt(strictMatch[1], 10) - 1}`;
                        }
                      }
                    }

                    const isMatched = !!selectedColKey;
                    const samples = selectedColKey
                      ? columnSampleValues[selectedColKey] || columnSampleValues[rawSelected] || []
                      : [];

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
                              <span>Pilih Posisi Kolom di Excel:</span>
                            </div>
                            <select
                              value={selectedColKey}
                              onChange={(e) => handleMappingChange(field.key, e.target.value)}
                              className={`w-full text-xs font-bold p-2.5 rounded-xl border transition-all focus:outline-none ${
                                isMatched
                                  ? 'bg-white border-emerald-500 text-emerald-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs'
                                  : field.required
                                  ? 'bg-white border-amber-400 text-amber-950 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              <option value="">-- [ Kosongkan / Lewati Kolom Ini ] --</option>
                              {(field.key === 'wilayah' || field.key === 'wilayahKerja') && (
                                <option value="__SHEET_NAME__" className="font-extrabold text-emerald-900 bg-emerald-50">
                                  🏷️ [Otomatis dari Nama Sheet/Kota (Cianjur, Tasik, KBB, dll)]
                                </option>
                              )}
                              {excelHeaders.map((header, hIdx) => {
                                const colKey = `col_${hIdx}`;
                                const sample = columnSampleValues[colKey]?.[0] || columnSampleValues[header]?.[0] || '';
                                return (
                                  <option key={colKey} value={colKey}>
                                    📋 Kolom {hIdx + 1}: "{header}" {sample ? `(Contoh: "${sample.slice(0, 30)}")` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {/* FITUR PENJELAS: Contoh Data Asli dari Excel Anda */}
                        {isMatched && (
                          <div className="mt-2 pt-2 border-t border-emerald-200/60 ml-0 sm:ml-7 flex flex-wrap items-center gap-2 text-[11px]">
                            {selectedColKey === '__SHEET_NAME__' ? (
                              <div className="flex items-center gap-1.5 text-emerald-900 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Wilayah diambil otomatis dari nama tab sheet (Cianjur, Tasikmalaya, Kab. Bandung Barat, dll).</span>
                              </div>
                            ) : (
                              <>
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
                                    {(field.key === 'wilayah' || field.key === 'wilayahKerja') && samples.length > 1 && (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-400 text-emerald-900 font-extrabold text-[10px]">
                                        ✨ Terdeteksi Beragam Wilayah Berbeda ({samples.length}+ kota/kab)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">(Kolom ini kosong di baris-baris awal)</span>
                                )}
                              </>
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
                    {forceTargetRegion ? (
                      <>
                        Siap Menyimpan <strong>{mappedRecords.length} Data Anggota</strong> ke Wilayah <span className="text-emerald-950 bg-amber-300 font-extrabold px-2.5 py-0.5 rounded-lg border border-amber-500 shadow-2xs">📍 {forceTargetRegion}</span> secara realtime ke database.
                      </>
                    ) : (
                      <>
                        Sebanyak <strong>{mappedRecords.length} baris data anggota</strong> siap dimasukkan ke dalam Tabel <strong>{pillar.shortName}</strong> secara realtime ke database.
                      </>
                    )}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Struktur Sesuai Tabel Resmi</span>
                </div>
              </div>

              {/* Rincian Persebaran Kabupaten/Kota yang Terdeteksi */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black shadow-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      {forceTargetRegion
                        ? `Wilayah Tujuan Terkunci (${forceTargetRegion}):`
                        : `Distribusi ${detectedRegionsSummary.length} Kabupaten/Kota Terdeteksi:`}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">
                    Total: <strong>{mappedRecords.length} Data</strong>
                  </span>
                </div>

                {forceTargetRegion ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs text-emerald-950 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Wilayah Dikunci: Seluruh <strong>{mappedRecords.length} data</strong> di bawah ini 100% dipastikan tersimpan untuk wilayah: <strong className="text-emerald-900 bg-amber-200 px-2 py-0.5 rounded border border-amber-400">📍 {forceTargetRegion}</strong>.
                    </span>
                  </div>
                ) : (
                  detectedRegionsSummary.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1 overscroll-contain">
                      {detectedRegionsSummary.map(([regionName, count]) => (
                        <span
                          key={regionName}
                          className="bg-white border border-emerald-300 text-emerald-900 text-xs font-bold px-3 py-1 rounded-xl shadow-2xs flex items-center gap-1.5"
                        >
                          <span>📍 {regionName}:</span>
                          <strong className="text-emerald-950 font-black">{count} Data</strong>
                        </span>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Tabel Pratinjau dengan Kolom Persis Seperti PilarTable (Paginasi 50 Baris Cepat & Ringan) */}
              {(() => {
                const PREVIEW_PAGE_SIZE = 50;
                const totalPreviewPages = Math.max(1, Math.ceil(mappedRecords.length / PREVIEW_PAGE_SIZE));
                const safePreviewPage = Math.min(Math.max(1, previewPage), totalPreviewPages);
                const previewStartIndex = (safePreviewPage - 1) * PREVIEW_PAGE_SIZE;
                const paginatedPreviewRecords = mappedRecords.slice(previewStartIndex, previewStartIndex + PREVIEW_PAGE_SIZE);

                return (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-[#0f2b5c] px-4 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-amber-400 shrink-0" />
                        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                          Pratinjau Data Tabel {pillar.shortName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-amber-300 font-black bg-blue-950/60 border border-blue-700/60 px-2.5 py-1 rounded-lg shadow-2xs">
                          Total: {mappedRecords.length} Data (Hal {safePreviewPage} dari {totalPreviewPages})
                        </span>
                        {totalPreviewPages > 1 && (
                          <div className="flex items-center gap-1 bg-blue-950/80 p-0.5 rounded-lg border border-blue-700/60">
                            <button
                              type="button"
                              onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                              disabled={safePreviewPage <= 1}
                              className="p-1 rounded text-white hover:bg-blue-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                              title="Halaman Sebelumnya"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono font-bold px-1 text-slate-200">
                              {safePreviewPage}/{totalPreviewPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                              disabled={safePreviewPage >= totalPreviewPages}
                              className="p-1 rounded text-white hover:bg-blue-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                              title="Halaman Berikutnya"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[380px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#143b7d] text-white sticky top-0 z-10 shadow-xs">
                          <tr>
                            <th className="py-2.5 px-3 font-bold text-center border-r border-blue-900/60 w-12">No</th>
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
                          {paginatedPreviewRecords.map((rec: any, idx) => {
                            const globalIdx = previewStartIndex + idx;
                            return (
                              <tr key={globalIdx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-3 font-mono font-bold text-center text-slate-500 border-r border-slate-100">
                                  {globalIdx + 1}
                                </td>
                                {targetFields.map((f) => (
                                  <td
                                    key={f.key}
                                    className="py-2 px-3 text-slate-800 border-r border-slate-100 whitespace-nowrap"
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
                                    ) : f.key === 'nomorTandaDaftar' || f.key === 'sertifikat' || f.key === 'noSk' ? (
                                      <span className="font-mono text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {rec[f.key] || '-'}
                                      </span>
                                    ) : (
                                      <span>{rec[f.key] || '-'}</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalPreviewPages > 1 && (
                      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          Menampilkan baris <strong>{previewStartIndex + 1}</strong> sampai <strong>{Math.min(previewStartIndex + PREVIEW_PAGE_SIZE, mappedRecords.length)}</strong> dari <strong>{mappedRecords.length} data</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                            disabled={safePreviewPage <= 1}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
                          >
                            Sebelumnya
                          </button>
                          <span className="font-bold text-slate-700 px-1">
                            {safePreviewPage} / {totalPreviewPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                            disabled={safePreviewPage >= totalPreviewPages}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
                          >
                            Berikutnya
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {isProcessing && importProgress && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                      Sedang menyimpan massal ke Database Firestore...
                    </span>
                    <div className="flex items-center gap-3">
                      <span>
                        {importProgress.current} / {importProgress.total} Data
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelImport}
                        className="text-[11px] font-black text-rose-700 hover:text-white bg-rose-100 hover:bg-rose-600 border border-rose-300 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        title="Hentikan dan batalkan proses import sekarang"
                      >
                        Batalkan
                      </button>
                    </div>
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
                  Sebanyak <strong>{importResultCount} data anggota</strong> berhasil dimasukkan dan disinkronkan secara realtime ke database Firestore untuk Tabel <strong>{pillar.shortName}</strong> dari <strong>Sheet "{selectedSheet}"</strong>.
                </p>
              </div>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                {sheetNames.length > 1 && (
                  <button
                    type="button"
                    onClick={handleContinueToNextSheet}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                    <span>Lanjut Import Sheet Lainnya ({sheetNames.length} Sheet Tersedia)</span>
                  </button>
                )}
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
                <>
                  {isProcessing ? (
                    <button
                      type="button"
                      onClick={handleCancelImport}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 animate-pulse"
                      title="Klik untuk membatalkan proses import segera"
                    >
                      <X className="w-4 h-4" />
                      <span>Hentikan / Batalkan Import</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={isProcessing || mappedRecords.length === 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#043e2e] to-[#065e44] hover:from-[#032f23] hover:to-[#043e2e] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>Mulai Simpan {mappedRecords.length} Data {forceTargetRegion ? `ke ${forceTargetRegion}` : ''} ke Database</span>
                    </button>
                  )}
                </>
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
