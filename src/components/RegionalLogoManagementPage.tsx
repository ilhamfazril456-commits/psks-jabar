import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  Sparkles,
  Lock,
  Search,
  Building2,
  AlertCircle,
  Layers,
  X,
} from 'lucide-react';
import { UserSession } from '../types';
import { BackToHomeButton } from './BackToHomeButton';
import {
  OFFICIAL_REGIONS_28,
  compressLogoImage,
  saveRegionalLogoToFirestore,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pop Up Notifikasi Singkat & Simpel Sukses Simpan
  const [uploadSuccessModal, setUploadSuccessModal] = useState<{
    regionName: string;
    logoUrl?: string;
  } | null>(null);

  // Auto-dismiss popup modal setelah 3.5 detik jika tidak disentuh
  useEffect(() => {
    if (!uploadSuccessModal) return;
    const timer = setTimeout(() => {
      setUploadSuccessModal(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [uploadSuccessModal]);

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
      setErrorMessage('Format berkas tidak valid. Harap pilih berkas gambar (PNG, WebP, atau JPEG).');
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

      // 4. Buka pop up modal singkat & simpel bahwa perubahan telah berhasil disimpan
      setUploadSuccessModal({
        regionName,
        logoUrl: compressedBase64,
      });
    } catch (err: any) {
      console.error('Gagal mengupload logo:', err);
      setErrorMessage(err.message || 'Gagal memproses dan menyimpan logo wilayah.');
    } finally {
      setUploadingRegion(null);
      // Reset input agar bisa pilih ulang berkas yang sama jika diinginkan
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* 1. TOP NAVIGATION BAR (Pojok Kiri Atas: Tombol Kembali ke Beranda) */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-3 flex items-center justify-between gap-3">
        {/* Tombol Kembali ke Beranda: Pojok Kiri Atas */}
        <BackToHomeButton
          onClick={onBackToHome}
          variant="gold"
          label="Kembali ke Beranda"
          id="btn-back-top-regional-logo"
        />

        {/* Badge Otoritas Tingkat Tinggi */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#091f42] to-[#0f2b5c] text-[#d4af37] border border-[#d4af37]/60 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-xs tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>KONTROL OTORITAS PUSAT • FITUR 14</span>
        </div>
      </div>

      {/* 2. PLANG FITUR: HERO BANNER SECTION (Nyaman saat di-scroll di seluruh device HP & Laptop) */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 text-white border-2 border-[#d4af37] shadow-xl">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-96 h-full bg-radial from-blue-500/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-8 left-1/4 w-72 h-32 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Khusus Superadmin & Developer</span>
                </span>
                <span className="text-blue-300 text-xs hidden sm:inline">•</span>
                <span className="text-blue-200 text-xs font-semibold hidden sm:inline">
                  Dinas Sosial Provinsi Jawa Barat
                </span>
              </div>

              {/* Judul Resmi Fitur: Pengelolaan Logo Wilayah */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] shrink-0" />
                <span>Pengelolaan Logo Wilayah</span>
              </h1>

              <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed max-w-2xl">
                Upload & kelola 28 lambang resmi daerah (1 Pemprov Jawa Barat & 27 Kabupaten/Kota). Seluruh logo otomatis dikompresi jernih dan tampil presisi di pojok kanan plang header 10 pilar sosial.
              </p>
            </div>

            {/* Quick Stats Box Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 shrink-0 shadow-inner">
              <div className="text-left sm:text-right">
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-bold">
                  Status Terpasang
                </div>
                <div className="text-lg sm:text-2xl font-black text-white font-mono">
                  {uploadedCount}{' '}
                  <span className="text-xs sm:text-sm font-medium text-blue-200">
                    / 28 Wilayah
                  </span>
                </div>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Kompresi Retina ~40KB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Error Alert jika terjadi kegagalan upload */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 font-bold text-xs sm:text-sm shadow-md flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 text-xs font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Status Bar & Pencarian Kabupaten / Kota */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-xs mb-6 sm:mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0f2b5c]" />
              <span>Total Slot:</span>
              <span className="font-mono text-[#0f2b5c] font-black">28 Daerah Jabar</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Format Rekomendasi: PNG Transparan</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:min-w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Kabupaten / Kota..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 focus:border-[#0f2b5c] rounded-xl text-xs sm:text-sm font-semibold focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Panduan Desain & Dudukan Lambang Kedinasan */}
        <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white border-2 border-amber-400/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/40">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-xs sm:text-sm">
            <div className="font-black text-amber-300">Format Lambang & Dudukan Plakat Kedinasan:</div>
            <p className="text-blue-100 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Seluruh logo di header 10 pilar otomatis ditempatkan di atas <em>dudukan plakat putih dengan ring emas</em> dan styling <code>object-contain</code>. Lambang bulat, perisai, maupun bersegi dijamin <strong>100% utuh tanpa terpotong</strong> dan bebas dari latar kotak-kotak catur.
            </p>
          </div>
        </div>

        {/* Grid 28 Kartu Logo Wilayah */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
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
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. FOOTER & TOMBOL KEMBALI KE BERANDA (Pojok Kiri Bawah) */}
        <div className="mt-8 sm:mt-12 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          {/* Tombol Kembali ke Beranda: Pojok Kiri Bawah */}
          <div className="flex items-center">
            <BackToHomeButton
              onClick={onBackToHome}
              variant="gold"
              label="Kembali ke Beranda"
              id="btn-back-bottom-regional-logo"
            />
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 font-semibold text-right">
            Dinas Sosial Provinsi Jawa Barat • Pengelolaan Logo Wilayah
          </div>
        </div>
      </main>

      {/* 5. POP UP NOTIFIKASI SINGKAT & SIMPEL: PERUBAHAN TELAH BERHASIL DISIMPAN */}
      {uploadSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-sm w-full text-center shadow-2xl border-2 border-emerald-400 relative animate-in zoom-in-95 duration-200">
            {/* Tombol Close silang */}
            <button
              type="button"
              onClick={() => setUploadSuccessModal(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ikon Centang Hijau Menyala */}
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            {/* Judul Notifikasi Pop Up */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Perubahan Berhasil Disimpan
            </h3>

            {/* Deskripsi Singkat & Simpel */}
            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
              Logo resmi untuk{' '}
              <strong className="text-slate-900 font-bold">{uploadSuccessModal.regionName}</strong>{' '}
              telah berhasil diunggah, dikompresi jernih, dan tersimpan ke sistem.
            </p>

            {/* Preview Logo yang Baru Saja Disimpan */}
            {uploadSuccessModal.logoUrl && (
              <div className="w-16 h-16 mx-auto mb-4 p-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center">
                <img
                  src={uploadSuccessModal.logoUrl}
                  alt="Preview Logo Disimpan"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
            )}

            {/* Tombol Konfirmasi Selesai */}
            <button
              type="button"
              onClick={() => setUploadSuccessModal(null)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#0f2b5c] to-blue-900 hover:from-[#143b7d] hover:to-blue-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#d4af37]/40 active:scale-95"
            >
              Selesai / Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
