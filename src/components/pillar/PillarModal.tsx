import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Check,
  CheckCircle2,
  UploadCloud,
  FileImage,
  Trash2,
  Eye,
  Sparkles,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { UserSession } from '../../types';
import { compressBerkasImage } from '../../lib/imageCompressor';

interface FormDataState {
  wilayah: string;
  kec: string;
  kelDesa: string;
  nama: string;
  alamat: string;
  nik: string;
  jenisKelamin: string;
  predikatTerakhir: string;
  hp: string;
  email: string;
  nomorKontak: string;
  noTglSertifikatKompetensi: string;
  noTglSertifikasi: string;
  sertifikasiKompetensi: string;
  pendidikan: string;
  jenjangJabatan: string;
  tempatBertugas: string;
  instansiBertugas: string;
  statusPeksos: string;
  jenjangJabatanPemerintah: string;
  masaBerlakuSk: string;
  noSkKeanggotaan: string;
  statusKeaktifan: string;
  bimtekDiikuti: string[];
  sertifikasi: string;
  lembaga: string;

  // Foto Berkas Pendukung (Kompresi Client-side Canvas Ultra Hemat Memori)
  berkasFotoUrl?: string;
  berkasFotoNama?: string;
  berkasFotoSizeKb?: number;
  berkasFotoOriginalSizeKb?: number;

  // Specific 9 pillars fields
  masaBakti: string;
  noSk: string;
  statusAktif: string;
  nomorInduk: string;
  sertifikat: string;
  keahlian: string;
  pelatihan: string;
  namaLks: string;
  bidangPelayanan: string;
  ketua: string;
  nomorTandaDaftar: string;
  masaBerlaku: string;
  namaKarangTaruna: string;
  tahunBerdiri: string;
  namaLk3: string;
  kontak: string;
  jenisLayanan: string;
  instansi: string;
  jabatan: string;
  wilayahKerja: string;
  skPengangkatan: string;
  masaTugas: string;
  namaBadanUsaha: string;
  jenisUsaha: string;
  bentukCsr: string;
  bidangBantuan: string;
  namaSlrt: string;
  operator: string;
  jenisWilayah?: 'Desa' | 'Kelurahan';
}

interface PillarModalProps {
  pillarId: string;
  pillar: any;
  session: UserSession;
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  regionOptions: string[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isEditMode?: boolean;
}

export const PillarModal: React.FC<PillarModalProps> = ({
  pillarId,
  pillar,
  session,
  formData,
  setFormData,
  regionOptions,
  onSubmit,
  onClose,
  isEditMode = false,
}) => {
  const isUserRole = session.role === 'user';
  const isUserCimahi = isUserRole && (session.wilayah || '').toLowerCase().trim() === 'kota cimahi';
  const isRegionalAdmin = session.role === 'admin' && session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah';
  const isLockedRegionUser = isUserRole && !isUserCimahi && !!session.wilayah && session.wilayah !== 'Semua Wilayah' && session.wilayah !== 'Prov. Jabar';

  // Photo Berkas Upload & Compression State (Canvas Client-side)
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setCompressError('Format file harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }
    setCompressError(null);
    setIsCompressing(true);
    try {
      const result = await compressBerkasImage(file, 1200, 1200, 0.75);
      setFormData((prev) => ({
        ...prev,
        berkasFotoUrl: result.dataUrl,
        berkasFotoNama: result.name,
        berkasFotoSizeKb: result.compressedSizeKb,
        berkasFotoOriginalSizeKb: result.originalSizeKb,
      }));
    } catch (err: any) {
      setCompressError(err?.message || 'Gagal memproses dan mengompresi gambar.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      berkasFotoUrl: undefined,
      berkasFotoNama: undefined,
      berkasFotoSizeKb: undefined,
      berkasFotoOriginalSizeKb: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderWilayahSelect = (options?: { label?: string; placeholder?: string; isWilayahKerja?: boolean }) => {
    const label = options?.label || 'Kabupaten/Kota';
    const placeholder = options?.placeholder || (options?.isWilayahKerja ? 'Pilih Wilayah Kerja' : 'Pilih Kab/Kota');
    const isWilayahKerja = options?.isWilayahKerja || false;
    const val = isWilayahKerja ? (formData.wilayahKerja || formData.wilayah) : formData.wilayah;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedVal = e.target.value;
      if (isWilayahKerja) {
        setFormData({ ...formData, wilayahKerja: selectedVal, wilayah: selectedVal });
      } else {
        setFormData({ ...formData, wilayah: selectedVal });
      }
    };

    if (isUserCimahi) {
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              {label} <span className="text-red-500">*</span> :
            </label>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              Pilihan Khusus Kota Cimahi / Prov. Jabar
            </span>
          </div>
          <select
            required
            value={val}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e]"
          >
            <option value="" disabled>{placeholder}</option>
            <option value="Kota Cimahi">Kota Cimahi</option>
            <option value="Prov. Jabar">Prov. Jabar</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            * Pendaftaran wilayah Kota Cimahi akan diteruskan ke Admin Kota Cimahi. Jika anda sebagai pegawai di Dinas Sosial Provinsi Jawa Barat maka pilih Prov. Jabar yang akan diteruskan ke Superadmin Jabar.
          </p>
        </div>
      );
    }

    if (isLockedRegionUser || isRegionalAdmin) {
      const lockedWilayah = session.wilayah;
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              {label} <span className="text-red-500">*</span> :
            </label>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Terkunci ({lockedWilayah})
            </span>
          </div>
          <div className="relative">
            <select
              disabled
              value={lockedWilayah}
              className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-not-allowed appearance-none"
            >
              <option value={lockedWilayah}>{lockedWilayah}</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-700">
              <Lock className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            * Wilayah pendaftaran otomatis terkunci sesuai akun domisili wilayah Anda ({lockedWilayah}).
          </p>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label} <span className="text-red-500">*</span> :
        </label>
        <select
          required
          value={val}
          onChange={handleChange}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e]"
        >
          <option value="" disabled>{placeholder}</option>
          {regionOptions.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-600/40 flex flex-col max-h-[92dvh] sm:max-h-[88vh] h-[92dvh] sm:h-auto overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header: Selalu tampil di atas, dijamin 100% tidak terpotong */}
        <div className="bg-gradient-to-r from-[#043e2e] to-[#064e3b] text-white p-4 sm:p-5 border-b-4 border-[#d4af37] flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="min-w-0 pr-2">
            <h4 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2 truncate">
              {isEditMode ? (
                <>
                  <span>Edit Data Anggota {pillar.shortName}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Mode Edit
                  </span>
                </>
              ) : (
                <span>Formulir {(session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) ? 'Registrasi' : 'Ajukan Pendaftaran'} {pillar.shortName} Baru</span>
              )}
            </h4>
            <p className="text-[11px] text-emerald-200 mt-0.5 font-medium">
              {isEditMode
                ? 'Perubahan data akan disimpan langsung secara realtime ke server Database Firestore.'
                : session.role === 'admin'
                ? 'Pendaftaran anggota baru oleh Admin Wilayah akan diteruskan ke Superadmin & Developer untuk persetujuan & pengesahan.'
                : session.role === 'user'
                ? 'Pengajuan pendaftaran akan dikirim ke verifikator wilayah untuk diverifikasi berkasnya.'
                : 'Semua kolom formulir bertanda bintang (*) wajib diisi lengkap & tersinkronisasi.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl cursor-pointer hover:bg-white/10 transition-colors shrink-0"
            title="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form: Form scrollable langsung sebagai flex child dengan overflow-y-auto */}
        <form
          id="form-pilar-pendaftaran"
          onSubmit={onSubmit}
          className="p-4 sm:p-6 pb-8 overflow-y-auto flex-1 min-h-0 space-y-4 sm:space-y-4.5 overscroll-contain"
        >
          {/* 1. PEKSOS */}
            {pillarId === 'peksos' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Nama Lengkap <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Drs. Ahmad Hidayat, M.Si., Sp.PKS"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. NIK */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    2. NIK (16 Angka) <span className="text-red-500">*</span> :
                  </label>
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                    formData.nik.length === 16 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {formData.nik.length}/16 Digit
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{16}"
                  maxLength={16}
                  required
                  value={formData.nik}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setFormData({ ...formData, nik: cleaned });
                  }}
                  placeholder="Contoh: 3273011204850001 (Wajib 16 Digit Angka KTP)"
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none tracking-wider font-mono ${
                    formData.nik.length === 16 
                      ? 'border-emerald-500 focus:border-emerald-600' 
                      : 'border-slate-300 focus:border-[#043e2e]'
                  }`}
                />
              </div>

              {/* 3. Jenis Kelamin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Jenis Kelamin <span className="text-red-500">*</span> :
                </label>
                <select
                  required
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e]"
                >
                  <option value="" disabled>Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* 4. Pendidikan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Pendidikan <span className="text-red-500">*</span> :
                </label>
                <select
                  required
                  value={formData.pendidikan}
                  onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e]"
                >
                  <option value="" disabled>Pilih Pendidikan</option>
                  <option value="D4/S1 Kesejahteraan Sosial / Pekerjaan Sosial">D4/S1 Kesejahteraan Sosial / Pekerjaan Sosial</option>
                  <option value="S1 Pekerjaan Sosial">S1 Pekerjaan Sosial</option>
                  <option value="S2 Pekerjaan Sosial">S2 Pekerjaan Sosial</option>
                  <option value="S2 Kesejahteraan Sosial">S2 Kesejahteraan Sosial</option>
                  <option value="S3 Kesejahteraan Sosial">S3 Kesejahteraan Sosial</option>
                  <option value="D3 Pekerjaan Sosial">D3 Pekerjaan Sosial</option>
                  <option value="SMA/SMK Sederajat">SMA/SMK Sederajat</option>
                  <option value="S1 Ilmu Sosial / Sosiologi">S1 Ilmu Sosial / Sosiologi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* 5. Nomor dan Tanggal Sertifikasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  5. Nomor dan tanggal sertifikasi <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.noTglSertifikasi}
                  onChange={(e) => setFormData({ ...formData, noTglSertifikasi: e.target.value })}
                  placeholder="Contoh: 112/LSPS-BDG/2024 (10 Feb 2024)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Sertifikasi Kompetensi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6. Sertifikasi Kompetensi <span className="text-red-500">*</span> :
                </label>
                <select
                  required
                  value={formData.sertifikasiKompetensi}
                  onChange={(e) => setFormData({ ...formData, sertifikasiKompetensi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e]"
                >
                  <option value="" disabled>Pilih Sertifikasi Kompetensi</option>
                  <option value="Pekerja Sosial Generalis">Pekerja Sosial Generalis</option>
                  <option value="Pekerja Sosial Spesialis">Pekerja Sosial Spesialis</option>
                  <option value="Sertifikasi Kompetensi Nasional LSP">Sertifikasi Kompetensi Nasional LSP</option>
                  <option value="Sertifikasi Profesi Pekerja Sosial Utama">Sertifikasi Profesi Pekerja Sosial Utama</option>
                  <option value="Sertifikasi Profesi Pekerja Sosial Madya">Sertifikasi Profesi Pekerja Sosial Madya</option>
                  <option value="Belum Bersertifikat">Belum Bersertifikat</option>
                </select>
              </div>

              {/* 7. Jenjang Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  7. Jenjang Jabatan <span className="text-red-500">*</span> :
                </label>
                <select
                  required
                  value={formData.jenjangJabatan}
                  onChange={(e) => setFormData({ ...formData, jenjangJabatan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e]"
                >
                  <option value="" disabled>Pilih Jenjang Jabatan</option>
                  <option value="Peksos Ahli Pertama">Peksos Ahli Pertama</option>
                  <option value="Peksos Ahli Muda">Peksos Ahli Muda</option>
                  <option value="Peksos Ahli Madya">Peksos Ahli Madya</option>
                  <option value="Peksos Ahli Utama">Peksos Ahli Utama</option>
                  <option value="Peksos Pemula">Peksos Pemula</option>
                  <option value="Peksos Terampil">Peksos Terampil</option>
                  <option value="Peksos Mahir">Peksos Mahir</option>
                  <option value="Peksos Penyelia">Peksos Penyelia</option>
                  <option value="Non-Jabatan Fungsional / Staf">Non-Jabatan Fungsional / Staf</option>
                </select>
              </div>

              {/* 8. Tempat Bertugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  8. Tempat Bertugas <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.tempatBertugas}
                  onChange={(e) => setFormData({ ...formData, tempatBertugas: e.target.value })}
                  placeholder="Contoh: Bidang Rehabilitasi Sosial / Sentra Terpadu Galih Pakuan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 9. Instansi / Tempat Bertugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  9. Instansi/tempat bertugas <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.instansiBertugas}
                  onChange={(e) => setFormData({ ...formData, instansiBertugas: e.target.value })}
                  placeholder="Contoh: Dinas Sosial Provinsi Jawa Barat / LKS Al-Hikmah"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 10. Status Peksos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  10. Status Peksos (Pemerintah/Masyarakat) <span className="text-red-500">*</span> :
                </label>
                <select
                  required
                  value={formData.statusPeksos}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setFormData({
                      ...formData,
                      statusPeksos: newStatus,
                      lembaga: newStatus === 'Pemerintah' ? 'Lembaga Pemerintah' : 'Swasta',
                      jenjangJabatanPemerintah: newStatus === 'Pemerintah' ? (formData.jenjangJabatanPemerintah || 'Ahli Pertama') : '-',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e]"
                >
                  <option value="" disabled>Pilih Status Peksos</option>
                  <option value="Pemerintah">Pemerintah</option>
                  <option value="Masyarakat">Masyarakat</option>
                </select>
              </div>

              {/* 11. Jenjang Jabatan Pemerintah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  11. Jenjang Jabatan (jika Pemerintah) <span className="text-red-500">*</span> :
                </label>
                <select
                  required={formData.statusPeksos === 'Pemerintah'}
                  value={formData.statusPeksos === 'Pemerintah' ? formData.jenjangJabatanPemerintah : '-'}
                  disabled={formData.statusPeksos !== 'Pemerintah'}
                  onChange={(e) => setFormData({ ...formData, jenjangJabatanPemerintah: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#043e2e] disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <option value="" disabled>Pilih Jenjang Jabatan Pemerintah</option>
                  {formData.statusPeksos === 'Pemerintah' ? (
                    <>
                      <option value="Ahli Pertama">Ahli Pertama</option>
                      <option value="Ahli Muda">Ahli Muda</option>
                      <option value="Ahli Madya">Ahli Madya</option>
                      <option value="Ahli Utama">Ahli Utama</option>
                      <option value="Pemula">Pemula</option>
                      <option value="Terampil">Terampil</option>
                      <option value="Mahir">Mahir</option>
                      <option value="Penyelia">Penyelia</option>
                    </>
                  ) : (
                    <option value="-">- (Bukan Peksos Pemerintah)</option>
                  )}
                </select>
              </div>

              {/* 12. Kabupaten/Kota */}
              {renderWilayahSelect({ label: '12. Kabupaten/Kota' })}

              {/* 13. Nomor HP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  13. Nomor HP <span className="text-red-500">*</span> :
                </label>
                <input
                  type="tel"
                  required
                  value={formData.hp}
                  onChange={(e) => {
                    const cleanHp = e.target.value.replace(/[^0-9+\s-]/g, '');
                    setFormData({ ...formData, hp: cleanHp });
                  }}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 14. Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  14. Email <span className="text-red-500">*</span> :
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Contoh: peksos.jabar@dinsos.jabarprov.go.id"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 15. Status Keaktifan (Terkunci Aktif) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    15. Status Keaktifan <span className="text-red-500">*</span> :
                  </label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci (Aktif Saja)
                  </span>
                </div>
                <div className="relative">
                  <select
                    disabled
                    value="Aktif"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-emerald-900 focus:outline-none cursor-not-allowed appearance-none"
                  >
                    <option value="Aktif">Aktif</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  * Pendaftaran baru ditetapkan berstatus "Aktif" secara otomatis oleh sistem.
                </p>
              </div>

              {/* 16. Nomor Kontak */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  16. Nomor kontak <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomorKontak}
                  onChange={(e) => setFormData({ ...formData, nomorKontak: e.target.value })}
                  placeholder="Contoh: 022-2503125 (Kontak Kantor / Darurat)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>
            </div>
          )}

          {/* 2. PSM */}
          {pillarId === 'psm' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Siti Nurhaliza, S.Pd"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Desa/Kelurahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Desa/Kelurahan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kelDesa}
                  onChange={(e) => setFormData({ ...formData, kelDesa: e.target.value })}
                  placeholder="Contoh: Gegerkalong"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 3. Kecamatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kecamatan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kec}
                  onChange={(e) => setFormData({ ...formData, kec: e.target.value })}
                  placeholder="Contoh: Sukasari"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 4. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 5. Masa Bakti */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masa Bakti <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.masaBakti}
                  onChange={(e) => setFormData({ ...formData, masaBakti: e.target.value })}
                  placeholder="Contoh: 2024 - 2029"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Nomor SK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor SK <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.noSk}
                  onChange={(e) => setFormData({ ...formData, noSk: e.target.value })}
                  placeholder="Contoh: SK.PSM/BDG/2024/015"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 7. Nomor HP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP <span className="text-red-500">*</span> :
                </label>
                <input
                  type="tel"
                  required
                  value={formData.hp}
                  onChange={(e) => {
                    const cleanHp = e.target.value.replace(/[^0-9+\s-]/g, '');
                    setFormData({ ...formData, hp: cleanHp });
                  }}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 8. Status Aktif (Terkunci Aktif Saja) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Status Aktif <span className="text-red-500">*</span> :
                  </label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci (Aktif Saja)
                  </span>
                </div>
                <div className="relative">
                  <select
                    disabled
                    value="Aktif"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-emerald-900 focus:outline-none cursor-not-allowed appearance-none"
                  >
                    <option value="Aktif">Aktif</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  * Pendaftaran baru ditetapkan berstatus "Aktif" secara otomatis oleh sistem.
                </p>
              </div>
            </div>
          )}

          {/* 3. TAGANA */}
          {pillarId === 'tagana' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama Anggota Tagana */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Anggota Tagana <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Hendra Kurniawan, S.Sos"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 3. Nomor Induk Anggota */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Anggota <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomorInduk}
                  onChange={(e) => setFormData({ ...formData, nomorInduk: e.target.value })}
                  placeholder="Contoh: TGN-32.73-0421"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 4. Sertifikat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sertifikat <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.sertifikat}
                  onChange={(e) => setFormData({ ...formData, sertifikat: e.target.value })}
                  placeholder="Contoh: Sertifikat Madya Water Rescue BNSP"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 5. Keahlian */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keahlian <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.keahlian}
                  onChange={(e) => setFormData({ ...formData, keahlian: e.target.value })}
                  placeholder="Contoh: Dapur Umum & Logistik Darurat / Vertical Rescue"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Pelatihan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pelatihan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.pelatihan}
                  onChange={(e) => setFormData({ ...formData, pelatihan: e.target.value })}
                  placeholder="Contoh: Diklat Kebencanaan Nasional 2024"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 7. Status Aktif (Terkunci Aktif Saja) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Status Aktif <span className="text-red-500">*</span> :
                  </label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci (Aktif Saja)
                  </span>
                </div>
                <div className="relative">
                  <select
                    disabled
                    value="Aktif"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-emerald-900 focus:outline-none cursor-not-allowed appearance-none"
                  >
                    <option value="Aktif">Aktif</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  * Pendaftaran baru ditetapkan berstatus "Aktif" secara otomatis oleh sistem.
                </p>
              </div>
            </div>
          )}

          {/* 4. LKS */}
          {pillarId === 'lks' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama LKS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama LKS <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaLks}
                  onChange={(e) => setFormData({ ...formData, namaLks: e.target.value })}
                  placeholder="Contoh: Yayasan Kasih Ibu Nusantara"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Bidang Pelayanan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bidang pelayanan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.bidangPelayanan}
                  onChange={(e) => setFormData({ ...formData, bidangPelayanan: e.target.value })}
                  placeholder="Contoh: Rehabilitasi Sosial Anak & Lansia Terlantar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 3. Ketua LKS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ketua LKS <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.ketua}
                  onChange={(e) => setFormData({ ...formData, ketua: e.target.value })}
                  placeholder="Contoh: Hj. Ratna Juwita, M.Pd"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 4. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 5. Alamat Sekretariat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Sekretariat <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Terusan Pasirkoja No. 88"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Nomor Tanda Daftar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Tanda Daftar <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomorTandaDaftar}
                  onChange={(e) => setFormData({ ...formData, nomorTandaDaftar: e.target.value })}
                  placeholder="Contoh: 062/TD-LKS/DINSOS/2024"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 7. Masa Berlaku */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masa Berlaku <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.masaBerlaku}
                  onChange={(e) => setFormData({ ...formData, masaBerlaku: e.target.value })}
                  placeholder="Contoh: 2024 - 2029"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>
            </div>
          )}

          {/* 5. KARANG TARUNA */}
          {pillarId === 'karangtaruna' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama Karang Taruna */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Karang Taruna <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaKarangTaruna}
                  onChange={(e) => setFormData({ ...formData, namaKarangTaruna: e.target.value })}
                  placeholder="Contoh: Karang Taruna Mandala Karya"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Desa/Kelurahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Desa/Kelurahan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kelDesa}
                  onChange={(e) => setFormData({ ...formData, kelDesa: e.target.value })}
                  placeholder="Contoh: Ciumbuleuit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 3. Kecamatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kecamatan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kec}
                  onChange={(e) => setFormData({ ...formData, kec: e.target.value })}
                  placeholder="Contoh: Cidadap"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 4. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 5. Ketua */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ketua <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.ketua}
                  onChange={(e) => setFormData({ ...formData, ketua: e.target.value })}
                  placeholder="Contoh: Dimas Pratama"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Nomor SK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor SK <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.noSk}
                  onChange={(e) => setFormData({ ...formData, noSk: e.target.value })}
                  placeholder="Contoh: SK.KT/140/2023"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 7. Tahun Berdiri */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Berdiri <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.tahunBerdiri}
                  onChange={(e) => setFormData({ ...formData, tahunBerdiri: e.target.value })}
                  placeholder="Contoh: 2018"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>
            </div>
          )}

          {/* 6. LK3 */}
          {pillarId === 'lk3' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama LK3 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama LK3 <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaLk3}
                  onChange={(e) => setFormData({ ...formData, namaLk3: e.target.value })}
                  placeholder="Contoh: LK3 Sejahtera Bersama"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 3. Ketua LK3 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ketua LK3 <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.ketua}
                  onChange={(e) => setFormData({ ...formData, ketua: e.target.value })}
                  placeholder="Contoh: Dr. Irfan Maulana, M.Si"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 4. Kontak Telepon / WA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kontak Telepon / WA <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  placeholder="Contoh: 081299887766"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 5. Alamat Kantor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Kantor <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: Komplek Perkantoran Dinsos Gedung B Lt. 2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Jenis Layanan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis layanan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.jenisLayanan}
                  onChange={(e) => setFormData({ ...formData, jenisLayanan: e.target.value })}
                  placeholder="Contoh: Konseling Keluarga & Mediasi Permasalahan Sosial"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 7. Status Aktif (Terkunci Aktif Saja) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Status Aktif <span className="text-red-500">*</span> :
                  </label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci (Aktif Saja)
                  </span>
                </div>
                <div className="relative">
                  <select
                    disabled
                    value="Aktif"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-emerald-900 focus:outline-none cursor-not-allowed appearance-none"
                  >
                    <option value="Aktif">Aktif</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  * Pendaftaran baru ditetapkan berstatus "Aktif" secara otomatis oleh sistem.
                </p>
              </div>
            </div>
          )}

          {/* 7. PENSOS */}
          {pillarId === 'pensos' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama Penyuluh Sosial */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Penyuluh Sosial <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Drs. Bambang Sutrisno, M.Si"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Instansi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instansi <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.instansi}
                  onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                  placeholder="Contoh: Dinas Sosial Provinsi Jawa Barat"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 3. Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Contoh: Penyuluh Sosial Ahli Madya"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 4. Wilayah Kerja */}
              {renderWilayahSelect({ label: 'Wilayah kerja', isWilayahKerja: true })}

              {/* 5. Sertifikasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sertifikasi <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.sertifikasi}
                  onChange={(e) => setFormData({ ...formData, sertifikasi: e.target.value })}
                  placeholder="Contoh: Sertifikat Diklat Fungsional Pensos BNSP 2023"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>
            </div>
          )}

          {/* 8. TKSK */}
          {pillarId === 'tksk' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama TKSK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama TKSK <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Asep Saepudin, S.Sos"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Kecamatan Penugasan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kecamatan Penugasan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kec}
                  onChange={(e) => setFormData({ ...formData, kec: e.target.value })}
                  placeholder="Contoh: Kec. Coblong"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 3. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 4. SK Pengangkatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  SK Pengangkatan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.skPengangkatan}
                  onChange={(e) => setFormData({ ...formData, skPengangkatan: e.target.value })}
                  placeholder="Contoh: SK.KEMENSOS/TKSK/2024/098"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 5. Pendidikan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pendidikan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.pendidikan}
                  onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                  placeholder="Contoh: S1 Kesejahteraan Sosial / Ilmu Pemerintahan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Nomor HP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP <span className="text-red-500">*</span> :
                </label>
                <input
                  type="tel"
                  required
                  value={formData.hp}
                  onChange={(e) => {
                    const cleanHp = e.target.value.replace(/[^0-9+\s-]/g, '');
                    setFormData({ ...formData, hp: cleanHp });
                  }}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 7. Masa Tugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masa tugas <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.masaTugas}
                  onChange={(e) => setFormData({ ...formData, masaTugas: e.target.value })}
                  placeholder="Contoh: 2024 - 2029"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>
            </div>
          )}

          {/* 9. BADAN USAHA */}
          {pillarId === 'badanusaha' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama Badan Usaha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Badan Usaha / Perusahaan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaBadanUsaha}
                  onChange={(e) => setFormData({ ...formData, namaBadanUsaha: e.target.value })}
                  placeholder="Contoh: PT Bank Pembangunan Daerah Jawa Barat (BJB)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 2. Jenis Usaha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis usaha <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.jenisUsaha}
                  onChange={(e) => setFormData({ ...formData, jenisUsaha: e.target.value })}
                  placeholder="Contoh: Perbankan / BUMD / Manufaktur"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 3. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 4. Bentuk CSR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bentuk CSR <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.bentukCsr}
                  onChange={(e) => setFormData({ ...formData, bentukCsr: e.target.value })}
                  placeholder="Contoh: Hibah Peralatan Disabilitas & Renovasi Rutilahu"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 5. Bidang Bantuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bidang bantuan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.bidangBantuan}
                  onChange={(e) => setFormData({ ...formData, bidangBantuan: e.target.value })}
                  placeholder="Contoh: Pemberdayaan Ekonomi & Perlindungan Sosial"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Kontak PIC / Perusahaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kontak PIC / Perusahaan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  placeholder="Contoh: 022-4234868 / 081122334455"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>
            </div>
          )}

          {/* 10. SLRT PUSKESOS (Opsi A: Ringkas & Sesuai Tabel Rekapitulasi) */}
          {pillarId === 'slrt_puskesos' && (
            <div className="flex flex-col gap-4">
              {/* 1. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 2. Kecamatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kecamatan <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kec}
                  onChange={(e) => setFormData({ ...formData, kec: e.target.value })}
                  placeholder="Contoh: Cileunyi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 3. Status Wilayah: Desa / Kelurahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Wilayah Pemerintahan <span className="text-red-500">*</span> :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        jenisWilayah: 'Desa',
                        nama: formData.kelDesa ? `Desa ${formData.kelDesa}` : formData.nama,
                      });
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      (formData as any).jenisWilayah !== 'Kelurahan'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>Desa</span>
                    {(formData as any).jenisWilayah !== 'Kelurahan' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        jenisWilayah: 'Kelurahan',
                        nama: formData.kelDesa ? `Kel. ${formData.kelDesa}` : formData.nama,
                      });
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      (formData as any).jenisWilayah === 'Kelurahan'
                        ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>Kelurahan</span>
                    {(formData as any).jenisWilayah === 'Kelurahan' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 4. Nama Desa / Kelurahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama {(formData as any).jenisWilayah === 'Kelurahan' ? 'Kelurahan' : 'Desa'} Yang Telah Membentuk Puskesos <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.kelDesa}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isKel = (formData as any).jenisWilayah === 'Kelurahan';
                    setFormData({
                      ...formData,
                      kelDesa: val,
                      nama: val ? (isKel ? `Kel. ${val}` : `Desa ${val}`) : '',
                      namaSlrt: val ? `Puskesos ${isKel ? 'Kel.' : 'Desa'} ${val}` : '',
                    });
                  }}
                  placeholder={`Contoh: ${(formData as any).jenisWilayah === 'Kelurahan' ? 'Cibeunying' : 'Cileunyi Kulon'}`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>
            </div>
          )}

          {/* UPLOAD FOTO BERKAS PENDUKUNG (KOMPRESI CLIENT-SIDE ULTRA HEMAT FIREBASE) */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 border-2 border-dashed border-emerald-300/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <FileImage className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span>Foto Berkas Pendukung (KTP / SK / Surat Tugas)</span>
                    <span className="text-[10px] font-bold text-slate-500 font-normal">(Opsional)</span>
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
                    Otomatis dikompresi di browser (Client-Side Canvas) sehingga hemat penyimpanan Firebase dan upload instan.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-black text-emerald-900 self-start sm:self-auto shrink-0 shadow-2xs">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                <span>Ultra Hemat Kuota</span>
              </div>
            </div>

            {compressError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{compressError}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!formData.berkasFotoUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isCompressing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-100/70 scale-[0.99]'
                    : 'border-emerald-300/80 bg-white hover:bg-emerald-50/50 hover:border-emerald-500'
                }`}
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
                    <span className="text-xs font-black text-emerald-900">
                      Mengompresi foto berkas di browser...
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Memadatkan resolusi & ukuran agar hemat penyimpanan cloud
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-black text-slate-800">
                        Klik untuk Pilih Foto Berkas, atau Seret & Lepas ke sini
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Mendukung format JPG, PNG, atau WebP. Ukuran bebas (otomatis dikompresi menjadi ~50-80 KB).
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-emerald-200 p-3 sm:p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setShowPhotoModal(true)}
                      className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer group shadow-2xs"
                      title="Klik untuk memperbesar"
                    >
                      <img
                        src={formData.berkasFotoUrl}
                        alt="Berkas Pendaftaran"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                        <span className="truncate">{formData.berkasFotoNama || 'Foto Berkas Terkompresi'}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                          Tersimpan
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                        {formData.berkasFotoOriginalSizeKb && formData.berkasFotoOriginalSizeKb > 0 && (
                          <span className="text-slate-500 line-through">
                            Asli: {formData.berkasFotoOriginalSizeKb} KB
                          </span>
                        )}
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-black">
                          Kompresi: {formData.berkasFotoSizeKb || 50} KB
                        </span>
                        {formData.berkasFotoOriginalSizeKb && formData.berkasFotoSizeKb && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-black flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            Hemat {Math.max(1, Math.round((1 - formData.berkasFotoSizeKb / formData.berkasFotoOriginalSizeKb) * 100))}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Perbesar Foto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer border border-emerald-200 transition-colors"
                      title="Ganti Foto"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Ganti</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-200 transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Actions (Permanent Fixed Footer - Always Visible & Never Cut Off) */}
        <div className="flex items-center justify-end gap-3 p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 z-20 shadow-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="form-pilar-pendaftaran"
            className="px-6 py-2.5 bg-gradient-to-r from-[#043e2e] to-[#064e3b] hover:from-[#032f23] hover:to-[#043e2e] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40"
          >
            {isEditMode ? 'Simpan Perubahan Data' : ((session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) ? 'Simpan Data' : 'Ajukan Pendaftaran')}
          </button>
        </div>

        {/* Modal Preview Zoom Foto Berkas (Z-index tertinggi) */}
        {showPhotoModal && formData.berkasFotoUrl && (
          <div
            className="fixed inset-0 z-[1000000] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setShowPhotoModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-black text-slate-800">
                    Pratinjau Berkas: {formData.berkasFotoNama || 'Dokumen Pendukung'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-900 rounded-xl p-2">
                <img
                  src={formData.berkasFotoUrl}
                  alt="Pratinjau Berkas Pendaftaran"
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-1">
                <span>Ukuran Terkompresi: {formData.berkasFotoSizeKb || 50} KB (Aman Memori Firebase)</span>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
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
