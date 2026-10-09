import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Video,
  ImageIcon,
  Upload,
  CheckCircle2,
  Sparkles,
  Save,
  Check,
  Lock,
} from 'lucide-react';
import { UserSession, AppSettings } from '../types';
import { BackToHomeButton } from './BackToHomeButton';
import { OfficialPsksLogo } from './OfficialPsksLogo';
import { uploadVideoChunksToFirestore } from '../lib/videoSync';
import { recordSystemActivity } from '../lib/activityLogger';

interface BackgroundLogoManagementPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
}

export const BackgroundLogoManagementPage: React.FC<BackgroundLogoManagementPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
}) => {
  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const isAuthorized =
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) &&
    session.statusActive === 'SAH_TERDAFTAR';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Lock className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Akses Dibatasi</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6">Halaman ini hanya dapat diakses oleh Superadmin & Developer.</p>
        <BackToHomeButton onClick={onBackToHome} variant="gold" />
      </div>
    );
  }

  // Compress image helper
  const compressImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressed);
            return;
          }
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (customData?: AppSettings, msg?: string) => {
    const dataToSave = customData || formData;
    await onSaveSettings(dataToSave);
    try {
      recordSystemActivity({
        session,
        category: 'SYSTEM_SETTINGS',
        actionType: 'UPDATE',
        targetCollection: 'app_settings',
        targetId: 'global_bg_logo',
        targetName: 'Background & Logo PSKS',
        details: `Pembaruan background mode (${dataToSave.bgMode}) dan logo resmi PSKS Jabar.`,
      });
    } catch {}
    setSaveSuccessMsg(msg || '✅ Pengaturan Background & Logo PSKS berhasil disimpan dan aktif realtime!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'bgVideoUrl' | 'bgPhotoUrl' | 'logoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 35 * 1024 * 1024) {
      alert('Ukuran berkas terlalu besar. Maksimal 35MB.');
      return;
    }

    if (targetField === 'bgVideoUrl') {
      try {
        setVideoUploadProgress(15);
        await uploadVideoChunksToFirestore(file, (pct) => setVideoUploadProgress(pct));
        const updated = { ...formData, bgVideoUrl: '/eco_office_dinsos_jabar.mp4', bgMode: 'video' as const };
        setFormData(updated);
        await handleSave(updated, '✅ Video Latar Belakang Berhasil Diupload & Tersinkron Realtime ke Semua Perangkat!');
        setTimeout(() => setVideoUploadProgress(null), 3000);
      } catch (err: any) {
        console.warn('Video upload error:', err);
        setVideoUploadProgress(null);
      }
      return;
    }

    if (targetField === 'bgPhotoUrl' || targetField === 'logoUrl') {
      try {
        const compressedBase64 = await compressImageFile(file);
        const updated = { ...formData, [targetField]: compressedBase64 };
        if (targetField === 'bgPhotoUrl') {
          updated.bgMode = 'photo';
        }
        setFormData(updated);
        await handleSave(updated, `✅ Berkas ${targetField === 'logoUrl' ? 'Logo Resmi' : 'Foto Background'} Berhasil Diperbarui!`);
        return;
      } catch (err) {
        console.warn('Image compression fallback:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updated = { ...formData, [targetField]: result };
        if (targetField === 'bgPhotoUrl') {
          updated.bgMode = 'photo';
        }
        setFormData(updated);
        handleSave(updated, '✅ Berkas Berhasil Diperbarui!');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20">
      
      {/* SUCCESS TOAST */}
      {saveSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-400 text-xs font-black flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{saveSuccessMsg}</span>
          <button onClick={() => setSaveSuccessMsg(null)} className="ml-2 font-bold hover:opacity-80">✕</button>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <div className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 pb-3 flex items-center justify-between gap-3">
        <BackToHomeButton onClick={onBackToHome} id="btn-back-top-bg-logo" />

        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#043e2e] text-[#d4af37] border border-[#d4af37]/60 px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-md tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>KONTROL OTORITAS PUSAT • FITUR 11</span>
        </div>
      </div>

      {/* HERO HEADER SECTION */}
      <div className="max-w-5xl mx-auto px-4 mb-6 sm:mb-8">
        <div className="relative bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Otoritas Superadmin & Developer</span>
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug break-words">
                Pengaturan Background Hero & Logo Resmi PSKS
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                Pusat kendali visual beranda utama: konfigurasi video gerak EcoOffice / foto gambar hero resolusi tinggi, serta pembaruan logo resmi PSKS yang tersinkronisasi global secara realtime.
              </p>
            </div>

            {/* Quick Preview Badge Box */}
            <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center shrink-0 shadow-inner">
              <OfficialPsksLogo logoUrl={formData.logoUrl || appSettings.logoUrl} sizeClassName="w-12 h-12 sm:w-16 sm:h-16" />
              <div className="text-right sm:text-center">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                  Logo Resmi
                </span>
                <span className="text-[9px] text-emerald-200 font-semibold block">
                  Aktif Global
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        
        {/* BAGIAN 1: BACKGROUND HERO BERANDA */}
        <section className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#043e2e] text-[#d4af37] flex items-center justify-center shadow-md shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  11.1 Format & Berkas Background Hero
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Atur apakah beranda utama memutar video gerak EcoOffice atau menampilkan foto gambar statis resolusi tinggi.
                </p>
              </div>
            </div>

            <span className="text-xs font-black bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-300 uppercase shrink-0">
              {formData.bgMode === 'video' ? 'Mode Video EcoOffice Aktif' : 'Mode Foto Statis Aktif'}
            </span>
          </div>

          {/* MODE SELECTION CARDS */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Pilih Format Latar Belakang:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...formData, bgMode: 'video' as const };
                  setFormData(updated);
                  handleSave(updated, 'Mode Video EcoOffice Diaktifkan');
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                  formData.bgMode === 'video'
                    ? 'border-[#043e2e] bg-emerald-50/90 text-[#043e2e] shadow-md ring-2 ring-[#d4af37]/60'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${formData.bgMode === 'video' ? 'bg-[#043e2e] text-[#d4af37]' : 'bg-slate-100 text-slate-500'}`}>
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black">Mode Video EcoOffice</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Memutar rekaman video resmi EcoOffice bergerak loop di latar belakang beranda</p>
                    </div>
                  </div>
                  {formData.bgMode === 'video' && (
                    <span className="p-1 rounded-full bg-[#043e2e] text-[#d4af37]">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...formData, bgMode: 'photo' as const };
                  setFormData(updated);
                  handleSave(updated, 'Mode Foto Statis Diaktifkan');
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                  formData.bgMode === 'photo'
                    ? 'border-[#043e2e] bg-emerald-50/90 text-[#043e2e] shadow-md ring-2 ring-[#d4af37]/60'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${formData.bgMode === 'photo' ? 'bg-[#043e2e] text-[#d4af37]' : 'bg-slate-100 text-slate-500'}`}>
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black">Mode Foto Static</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Menampilkan gambar foto statis resolusi tinggi yang tenang dan berwibawa</p>
                    </div>
                  </div>
                  {formData.bgMode === 'photo' && (
                    <span className="p-1 rounded-full bg-[#043e2e] text-[#d4af37]">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* INPUT FORM FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* VIDEO CONFIG */}
            <div className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${formData.bgMode === 'video' ? 'bg-slate-50 border-[#043e2e]/40 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#043e2e]" />
                  <label className="text-xs font-black text-slate-900 uppercase">
                    Konfigurasi Video Latar Belakang (MP4)
                  </label>
                </div>
                {formData.bgMode === 'video' && (
                  <span className="text-[10px] font-black bg-[#043e2e] text-[#d4af37] px-2.5 py-0.5 rounded-md">AKTIF</span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tautan / URL Berkas Video</label>
                <input
                  type="text"
                  value={formData.bgVideoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, bgVideoUrl: e.target.value })}
                  placeholder="https://... atau /eco_office_dinsos_jabar.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-500 font-medium">Atau upload dari komputer/HP:</span>
                <label className="px-4 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border border-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{videoUploadProgress !== null ? `Mengunggah... ${videoUploadProgress}%` : 'Upload File Video'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    disabled={videoUploadProgress !== null}
                    onChange={(e) => handleFileUpload(e, 'bgVideoUrl')}
                    className="hidden"
                  />
                </label>
              </div>

              {videoUploadProgress !== null && (
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-amber-400 to-[#d4af37] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* FOTO CONFIG */}
            <div className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${formData.bgMode === 'photo' ? 'bg-slate-50 border-[#043e2e]/40 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#043e2e]" />
                  <label className="text-xs font-black text-slate-900 uppercase">
                    Konfigurasi Foto Statis Latar Belakang
                  </label>
                </div>
                {formData.bgMode === 'photo' && (
                  <span className="text-[10px] font-black bg-[#043e2e] text-[#d4af37] px-2.5 py-0.5 rounded-md">AKTIF</span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tautan / URL Berkas Foto</label>
                <input
                  type="text"
                  value={formData.bgPhotoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, bgPhotoUrl: e.target.value })}
                  placeholder="https://domain.com/foto_gedung.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-500 font-medium">Atau upload gambar dari komputer/HP:</span>
                <label className="px-4 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border border-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Foto Background</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'bgPhotoUrl')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* BAGIAN 2: LOGO RESMI PSKS JAWA BARAT (DISATUKAN SESUAI INSTRUKSI) */}
        <section className="bg-white rounded-3xl border-2 border-amber-300 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0f2b5c] text-amber-300 flex items-center justify-center shadow-md shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0f2b5c] uppercase tracking-tight">
                  11.2 Logo Resmi PSKS Jawa Barat
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Fitur logo disatukan ke latar belakang: pastikan logo resmi PSKS Jabar ber-TTE terpasang presisi dengan ring emas dinas.
                </p>
              </div>
            </div>

            <span className="text-xs font-black bg-amber-100 text-[#0f2b5c] px-3.5 py-1.5 rounded-full border border-amber-300 uppercase shrink-0">
              Identitas Resmi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Tautan / URL Logo Resmi</label>
              <input
                type="text"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://... atau data image logo permanen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <label className="px-5 py-3 rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-amber-300 border border-amber-400 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
              <Upload className="w-4 h-4" />
              <span>Upload Logo Baru</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'logoUrl')}
                className="hidden"
              />
            </label>
          </div>

          {/* PREVIEW LOGO */}
          <div className="flex items-center gap-5 bg-amber-50/70 p-5 rounded-2xl border border-amber-200">
            <OfficialPsksLogo logoUrl={formData.logoUrl} sizeClassName="w-16 h-16 sm:w-20 sm:h-20" />
            <div>
              <span className="text-sm font-black text-[#0f2b5c] block">Pratinjau Presisi Logo Resmi PSKS Jawa Barat</span>
              <span className="text-xs text-slate-600 font-medium block mt-1 leading-relaxed">
                Render bulat sempurna dengan ring emas dinas, background transparan bersih, dan rendering tajam di semua jenis layar (HP, tablet, laptop, dan monitor 4K).
              </span>
            </div>
          </div>
        </section>

        {/* SAVE BUTTON BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
          <div className="w-full sm:w-auto flex justify-start order-2 sm:order-1">
            <BackToHomeButton onClick={onBackToHome} variant="light" />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end order-1 sm:order-2">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Perubahan tersimpan otomatis ke database Supabase.</span>
            </div>
            <button
              type="button"
              onClick={() => handleSave(undefined, 'Pengaturan Background & Logo PSKS Berhasil Disimpan!')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#043e2e] to-[#0a523e] hover:from-[#06503c] hover:to-[#0c6149] text-[#d4af37] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg border border-[#d4af37]/60 cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Background & Logo</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
