import React, { useState } from 'react';
import {
  UserCheck,
  User,
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  Save,
  Lock,
} from 'lucide-react';
import { UserSession, AppSettings } from '../types';
import { BackToHomeButton } from './BackToHomeButton';
import { recordSystemActivity } from '../lib/activityLogger';

interface ProfileKadinasManagementPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
}

export const ProfileKadinasManagementPage: React.FC<ProfileKadinasManagementPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
}) => {
  const [formData, setFormData] = useState<AppSettings>(appSettings);
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
        targetId: 'global_profile_kadinas',
        targetName: 'Profil & Foto Kadinas',
        details: `Pembaruan foto kadinas dan naskah profil/sambutan dinas (${dataToSave.kadinasName || 'Kepala Dinas'}).`,
      });
    } catch {}
    setSaveSuccessMsg(msg || '✅ Profil & Foto Resmi Kepala Dinas berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran berkas foto terlalu besar. Maksimal 20MB.');
      return;
    }

    try {
      const compressedBase64 = await compressImageFile(file);
      const updated = { ...formData, kadinasPhotoUrl: compressedBase64 };
      setFormData(updated);
      await handleSave(updated, '✅ Foto Resmi Kepala Dinas Berhasil Diperbarui!');
      return;
    } catch (err) {
      console.warn('Image compression fallback:', err);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updated = { ...formData, kadinasPhotoUrl: result };
        setFormData(updated);
        handleSave(updated, '✅ Foto Resmi Kepala Dinas Berhasil Diperbarui!');
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
        <BackToHomeButton onClick={onBackToHome} id="btn-back-top-kadinas-profile" />

        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0f2b5c] text-amber-300 border border-amber-400/60 px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-md tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>KONTROL OTORITAS PUSAT • FITUR 12</span>
        </div>
      </div>

      {/* HERO HEADER SECTION */}
      <div className="max-w-5xl mx-auto px-4 mb-6 sm:mb-8">
        <div className="relative bg-gradient-to-r from-slate-950 via-[#0f2b5c] to-slate-950 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Otoritas Superadmin & Developer</span>
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug break-words">
                Pengaturan Profil & Foto Resmi Kepala Dinas Sosial
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
                Pusat kendali identitas pimpinan: pembaruan foto kedinasan beresolusi tinggi, nama lengkap beserta gelar resmi, NIP kedinasan, sambutan, serta visi & misi Kadinas Sosial Provinsi Jawa Barat.
              </p>
            </div>

            {/* Quick Preview Badge Box */}
            <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center shrink-0 shadow-inner">
              {formData.kadinasPhotoUrl ? (
                <img
                  src={formData.kadinasPhotoUrl}
                  alt="Kadinas"
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#d4af37] shadow-md"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-900 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-xs sm:text-sm">
                  KADINAS
                </div>
              )}
              <div className="text-right sm:text-center">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                  Foto Resmi
                </span>
                <span className="text-[9px] text-blue-200 font-semibold block">
                  Pimpinan Jabar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        
        {/* BAGIAN 1: FOTO KEPALA DINAS (DISATUKAN) */}
        <section className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0f2b5c] text-amber-300 flex items-center justify-center shadow-md shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0f2b5c] uppercase tracking-tight">
                  12.1 Foto Resmi Kepala Dinas Sosial Provinsi Jawa Barat
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Perbarui tautan atau unggah foto resmi pimpinan dinas untuk ditampilkan pada halaman profil dan dokumen publik.
                </p>
              </div>
            </div>

            <span className="text-xs font-black bg-blue-100 text-blue-900 px-3.5 py-1.5 rounded-full border border-blue-200 uppercase shrink-0">
              Pimpinan Dinas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Tautan / URL Berkas Foto Resmi</label>
              <input
                type="text"
                value={formData.kadinasPhotoUrl || ''}
                onChange={(e) => setFormData({ ...formData, kadinasPhotoUrl: e.target.value })}
                placeholder="https://... atau data image foto resmi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <label className="px-5 py-3 rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-amber-300 border border-amber-400 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
              <Upload className="w-4 h-4" />
              <span>Upload Foto Kadinas</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* PREVIEW FOTO */}
          {formData.kadinasPhotoUrl && (
            <div className="flex items-center gap-5 bg-blue-50/60 p-5 rounded-2xl border border-blue-200">
              <img
                src={formData.kadinasPhotoUrl}
                alt="Preview Kadinas"
                className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-2xl border-2 border-[#d4af37] shadow-md shrink-0"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div>
                <span className="text-sm font-black text-slate-900 block">Pratinjau Foto Pimpinan Aktif</span>
                <span className="text-sm font-bold text-[#0f2b5c] mt-0.5 block">{formData.kadinasName || 'Kepala Dinas Sosial Provinsi Jawa Barat'}</span>
                <span className="text-xs text-slate-500 font-medium">{formData.profileSubtitle || 'Dinas Sosial Provinsi Jawa Barat'}</span>
              </div>
            </div>
          )}
        </section>

        {/* BAGIAN 2: IDENTITAS PEJABAT & NASKAH SAMBUTAN HALAMAN PROFIL */}
        <section className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5 border-b border-slate-200 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#043e2e] text-[#d4af37] flex items-center justify-center shadow-md shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                12.2 Identitas Pejabat & Teks Sambutan Halaman Profil
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Atur nama lengkap pimpinan, gelar resmi, jabatan, serta naskah sambutan resmi kepala dinas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap & Gelar Resmi Kepala Dinas</label>
              <input
                type="text"
                value={formData.kadinasName || ''}
                onChange={(e) => setFormData({ ...formData, kadinasName: e.target.value })}
                placeholder="Contoh: Dra. Hj. Ida Wahida Hidayati, S.H., S.E., M.Si."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Jabatan / Subtitle Profil</label>
              <input
                type="text"
                value={formData.profileSubtitle || ''}
                onChange={(e) => setFormData({ ...formData, profileSubtitle: e.target.value })}
                placeholder="Kepala Dinas Sosial Provinsi Jawa Barat"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Kalimat Pembuka / Salam Sambutan</label>
            <input
              type="text"
              value={formData.profileGreeting || ''}
              onChange={(e) => setFormData({ ...formData, profileGreeting: e.target.value })}
              placeholder="Assalamu’alaikum Warahmatullahi Wabarakatuh, Sampurasun Warga Jawa Barat..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Isi Paragraf Sambutan (Gunakan Enter / Baris Baru untuk memisahkan antar paragraf)
            </label>
            <textarea
              rows={7}
              value={formData.profileBody || ''}
              onChange={(e) => setFormData({ ...formData, profileBody: e.target.value })}
              placeholder="Tuliskan naskah sambutan resmi Kepala Dinas Sosial..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Kalimat Penutup / Slogan Resmi Kedinasan</label>
            <input
              type="text"
              value={formData.profileClosing || ''}
              onChange={(e) => setFormData({ ...formData, profileClosing: e.target.value })}
              placeholder="Wassalamu’alaikum Warahmatullahi Wabarakatuh, Jabar Juara Lahir Batin."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* LIVE PREVIEW BOX */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Pratinjau Langsung Naskah Profil:
            </span>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs sm:text-sm leading-relaxed text-slate-700">
              <p className="font-bold text-[#043e2e]">{formData.profileGreeting || 'Salam Sejahtera...'}</p>
              <div className="space-y-2">
                {(formData.profileBody || '')
                  .split('\n')
                  .filter((p) => p.trim().length > 0)
                  .map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
              </div>
              {formData.profileClosing && (
                <p className="font-bold text-[#0f2b5c] italic pt-1">{formData.profileClosing}</p>
              )}
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
              <span>Perubahan tersimpan otomatis ke database Supabase dan langsung tampil di halaman Profil.</span>
            </div>
            <button
              type="button"
              onClick={() => handleSave(undefined, 'Profil & Foto Resmi Kadinas Berhasil Disimpan!')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#153a75] hover:from-[#133773] hover:to-[#1a468d] text-amber-300 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg border border-amber-400/60 cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil & Foto Kadinas</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
