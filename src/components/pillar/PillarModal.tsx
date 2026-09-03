import React from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../../types';

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
}) => {
  const isUserRole = session.role === 'user';
  const isUserCimahi = isUserRole && (session.wilayah || '').toLowerCase().trim() === 'kota cimahi';
  const isRegionalAdmin = session.role === 'admin' && session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah';
  const isLockedRegionUser = isUserRole && !isUserCimahi && !!session.wilayah && session.wilayah !== 'Semua Wilayah' && session.wilayah !== 'Prov. Jabar';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#043e2e] to-[#064e3b] text-white p-4 sm:p-5 border-b-4 border-[#d4af37] flex items-center justify-between shrink-0">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>Formulir {session.role === 'user' ? 'Ajukan Pendaftaran' : 'Registrasi'} {pillar.shortName} Baru</span>
            </h4>
            <p className="text-[11px] text-emerald-200 mt-0.5 font-medium">
              Semua kolom formulir bertanda bintang (<span className="text-red-400 font-bold">*</span>) wajib diisi lengkap &amp; tersinkronisasi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form - 1 Jajar 1 Baris Kolom (Single Column Layout) */}
        <form onSubmit={onSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-4.5">
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

          {/* 10. SLRT PUSKESOS */}
          {pillarId === 'slrt_puskesos' && (
            <div className="flex flex-col gap-4">
              {/* 1. Nama SLRT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama SLRT / Puskesos <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaSlrt}
                  onChange={(e) => setFormData({ ...formData, namaSlrt: e.target.value })}
                  placeholder="Contoh: SLRT Puskesos Berkah Mukti"
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
                  placeholder="Contoh: Sukajaya"
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
                  placeholder="Contoh: Lembang"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 4. Kabupaten/Kota */}
              {renderWilayahSelect({ label: 'Kabupaten/Kota' })}

              {/* 5. Tahun Berdiri */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Berdiri <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.tahunBerdiri}
                  onChange={(e) => setFormData({ ...formData, tahunBerdiri: e.target.value })}
                  placeholder="Contoh: 2019"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              {/* 6. Operator Puskesos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operator Puskesos <span className="text-red-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  placeholder="Contoh: Neng Lilis Suryani, S.AP"
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

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-colors"
            >
              {session.role === 'user' ? 'Ajukan Pendaftaran' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
