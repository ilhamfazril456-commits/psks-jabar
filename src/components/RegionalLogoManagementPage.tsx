import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  Sparkles,
  Lock,
  Search,
  RotateCcw,
  Check,
  Building2,
  Image as ImageIcon,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { UserSession } from '../types';
import { BackToHomeButton } from './BackToHomeButton';
import {
  OFFICIAL_REGIONS_28,
  compressLogoImage,
  saveRegionalLogoToFirestore,
  removeRegionalLogoFromFirestore,
  resolveRegionLogoUrl,
} from '../services/regionalLogoService';
import { recordSystemActivity } from '../lib/activityLogger';

interface RegionalLogoManagementPageProps {
  session: UserSession;
  regionalLogos: Record<string, string>;
  defaultLogoUrl?: string;
  onBackToHome: () => void;
}

export const RegionalLogoManagementPage: React.FC<RegionalLogoManagementPageProps> = ({
  session,
  regionalLogos,
  defaultLogoUrl = '/official_logo_128.webp',
  onBackToHome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingRegion, setUploadingRegion] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAuthorized =
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) &&
    session.statusActive === 'SAH_TERDAFTAR';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Lock className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Akses Dibatasi</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6">
          Halaman ini khusus dapat diakses oleh Superadmin & Developer.
        </p>
        <BackToHomeButton onClick={onBackToHome} variant="gold" />
      </div>
    );
  }

  // Filter daftar wilayah berdasarkan pencarian
  const filteredRegions = useMemo(() => {
    if (!searchTerm.trim()) return OFFICIAL_REGIONS_28;
    const term = searchTerm.toLowerCase();
    return OFFICIAL_REGIONS_28.filter((reg) => reg.toLowerCase().includes(term));
  }, [searchTerm]);

  // Hitung jumlah logo kustom yang sudah terpasang
  const uploadedCount = useMemo(() => {
    return OFFICIAL_REGIONS_28.filter((reg) => Boolean(regionalLogos[reg])).length;
  }, [regionalLogos]);

  // Handler upload & kompresi foto logo
  const handleFileUpload = async (regionName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe berkas
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format berkas tidak valid. Harap pilih gambar (PNG, WebP, atau JPEG).');
      return;
    }

    try {
      setUploadingRegion(regionName);
      setErrorMessage(null);

      // 1. Kompresi otomatis di sisi browser (Canvas)
      const compressedBase64 = await compressLogoImage(file);

      // 2. Simpan ke Firestore & LocalStorage
      await saveRegionalLogoToFirestore(regionName, compressedBase64);

      // 3. Catat aktivitas sistem
      try {
        recordSystemActivity({
          session,
          category: 'SYSTEM_SETTINGS',
          actionType: 'UPDATE',
          targetCollection: 'regional_logos',
          targetId: regionName,
          details: `Mengunggah logo resmi baru untuk wilayah: ${regionName}`,
        });
      } catch (logErr) {
        // abaikan log error jika offline
      }

      setSuccessToast(`✅ Logo resmi ${regionName} berhasil dikompresi & diperbarui!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Gagal mengupload logo:', err);
      setErrorMessage(err.message || 'Gagal memproses dan menyimpan logo wilayah.');
    } finally {
      setUploadingRegion(null);
      // Reset input agar bisa pilih ulang file yang sama jika diinginkan
      e.target.value = '';
    }
  };

  // Handler reset logo kembali ke default
  const handleResetLogo = async (regionName: string) => {
    if (!confirm(`Kembalikan logo ${regionName} ke logo default Pemprov Jabar?`)) {
      return;
    }

    try {
      setUploadingRegion(regionName);
      await removeRegionalLogoFromFirestore(regionName);

      try {
        recordSystemActivity({
          session,
          category: 'SYSTEM_SETTINGS',
          actionType: 'DELETE',
          targetCollection: 'regional_logos',
          targetId: regionName,
          details: `Mereset logo resmi wilayah ${regionName} ke default`,
        });
      } catch (logErr) {}

      setSuccessToast(`Logo ${regionName} dikembalikan ke default.`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mereset logo wilayah.');
    } finally {
      setUploadingRegion(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header Sticky Bar */}
      <header className="bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] text-white border-b-2 border-[#d4af37] py-4 sm:py-6 px-4 sm:px-8 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span className="bg-amber-400/20 text-[#f1c40f] text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-400/40 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#f1c40f]" />
                <span>KONTROL OTORITAS PUSAT • FITUR 14</span>
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs font-medium hidden sm:inline">
                Khusus Superadmin & Developer
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] shrink-0" />
              <span>Manajemen Logo Resmi 28 Wilayah</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
              Upload 28 lambang resmi daerah (1 Pemprov Jabar & 27 Kabupaten/Kota). Logo akan otomatis dikompresi jernih dan tampil presisi di pojok kanan plang header 10 pilar sosial.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <BackToHomeButton onClick={onBackToHome} variant="gold" label="Kembali ke Beranda" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Toast Notifikasi Sukses */}
        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm shadow-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 font-bold text-xs sm:text-sm shadow-md flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Status Dashboard & Filter Bar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-6 sm:mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0f2b5c]" />
              <span>Status Terpasang:</span>
              <span className="font-mono text-[#0f2b5c] font-black">
                {uploadedCount} / 28 Wilayah
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Kompresi Otomatis Aktif (Max ~40 KB / Logo)</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Kabupaten / Kota..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#0f2b5c] rounded-xl text-xs sm:text-sm font-semibold focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Panduan Desain & Anti-Terpotong Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white border-2 border-amber-400/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm">
            <div className="font-black text-amber-300">Format Logo & Dudukan Lambang Kedinasan:</div>
            <p className="text-blue-100 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Disarankan mengunggah gambar logo berformat <strong>PNG transparan</strong> (.png / .webp). Seluruh logo di plang pilar otomatis ditempatkan di atas <em>dudukan plakat putih ber-ring emas kedinasan</em> dengan fitur <code>object-contain</code>, sehingga logo bulat, perisai, maupun lonjong dijamin <strong>100% utuh tanpa terpotong</strong> dan bebas dari efek kotak-kotak catur.
            </p>
          </div>
        </div>

        {/* Grid 28 Kartu Logo Wilayah */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredRegions.map((regionName, idx) => {
            const hasCustomLogo = Boolean(regionalLogos[regionName]);
            const currentLogoUrl = resolveRegionLogoUrl(regionName, regionalLogos, defaultLogoUrl);
            const isProvinsi = regionName === 'Provinsi Jawa Barat';
            const isProcessing = uploadingRegion === regionName;

            return (
              <div
                key={regionName}
                className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between relative group ${
                  isProvinsi
                    ? 'bg-gradient-to-b from-white via-amber-50/20 to-blue-50/30 border-2 border-[#d4af37] shadow-md ring-2 ring-amber-400/20'
                    : hasCustomLogo
                    ? 'bg-white border-emerald-300 shadow-xs hover:shadow-md'
                    : 'bg-white border-slate-200 shadow-2xs hover:shadow-sm'
                }`}
              >
                {/* Header Card: Nama & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                      {isProvinsi ? 'INDUK' : `#${idx}`}
                    </span>

                    {hasCustomLogo ? (
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Logo Kustom</span>
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Default Pemprov
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-1 mb-1">
                    {regionName}
                  </h3>
                  <div className="text-[10.5px] text-slate-500 font-medium">
                    {isProvinsi ? 'Lambang Induk Jawa Barat' : 'Wilayah Kerja 10 Pilar'}
                  </div>
                </div>

                {/* Dudukan Lambang Kedinasan (Presisi, Anti-Terpotong & Elegan) */}
                <div className="my-3.5 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 group-hover:border-[#d4af37] shadow-inner p-2 flex items-center justify-center transition-colors relative overflow-hidden">
                    <img
                      src={currentLogoUrl}
                      alt={`Logo ${regionName}`}
                      className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-[10px] font-bold">
                        Mengompresi...
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi Upload & Reset */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="w-full py-2 px-3 rounded-xl bg-[#0f2b5c] hover:bg-[#143b7d] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center">
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{hasCustomLogo ? 'Ganti Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/webp,image/jpeg"
                      onChange={(e) => handleFileUpload(regionName, e)}
                      disabled={isProcessing}
                      className="hidden"
                    />
                  </label>

                  {hasCustomLogo && (
                    <button
                      type="button"
                      onClick={() => handleResetLogo(regionName)}
                      disabled={isProcessing}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Reset ke Default</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
