import React, { useState } from 'react';
import {
  Share2,
  Phone,
  Instagram,
  Youtube,
  Facebook,
  AtSign,
  Twitter,
  Video,
  CheckCircle2,
  Sparkles,
  Save,
  Check,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { UserSession, AppSettings } from '../types';
import { BackToHomeButton } from './BackToHomeButton';
import { recordSystemActivity } from '../lib/activityLogger';

interface SocialMediaManagementPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
}

export const SocialMediaManagementPage: React.FC<SocialMediaManagementPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
}) => {
  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const handleSave = async (msg?: string) => {
    await onSaveSettings(formData);
    try {
      recordSystemActivity({
        session,
        category: 'SYSTEM_SETTINGS',
        actionType: 'UPDATE',
        targetCollection: 'app_settings',
        targetId: 'global_social_media',
        targetName: 'Media Sosial Resmi',
        details: 'Pembaruan 7 tautan media sosial resmi Dinas Sosial Provinsi Jawa Barat.',
      });
    } catch {}
    setSaveSuccessMsg(msg || '✅ Tautan 7 Media Sosial Resmi berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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

      {/* TOP HEADER BAR */}
      <header className="bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 text-white border-b-2 border-cyan-400 shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BackToHomeButton onClick={onBackToHome} variant="light" />
            <div>
              <div className="inline-flex items-center gap-2 bg-cyan-900 border border-cyan-400/60 px-3 py-0.5 rounded-full text-[10px] font-black text-cyan-300 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>KONTROL OTORITAS PUSAT • FITUR 13</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Pengaturan 7 Media Sosial & Saluran Resmi Dinsos Jabar
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        
        {/* 7 MEDIA SOSIAL SECTION */}
        <section className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-900 text-cyan-200 flex items-center justify-center shadow-md shrink-0">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  Tautan 7 Saluran Komunikasi & Media Sosial Resmi
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Tautan ini otomatis tampil di baris kontak, footer beranda, dan modul publikasi resmi portal Dinsos Jabar.
                </p>
              </div>
            </div>

            <span className="text-xs font-black bg-cyan-100 text-cyan-900 px-3.5 py-1.5 rounded-full border border-cyan-300 uppercase shrink-0">
              7 Saluran Terhubung
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {[
              { key: 'whatsapp', label: '1. WhatsApp Channel / Admin Pusat', icon: Phone, ph: 'https://wa.me/628112000123' },
              { key: 'instagram', label: '2. Instagram Resmi (@dinsos.jabar)', icon: Instagram, ph: 'https://www.instagram.com/dinsos.jabar' },
              { key: 'youtube', label: '3. YouTube TV (Dinsos Jabar TV)', icon: Youtube, ph: 'https://youtube.com/@dinsosjabartv' },
              { key: 'facebook', label: '4. Halaman Facebook Resmi', icon: Facebook, ph: 'https://facebook.com/dinsosjabar' },
              { key: 'tiktok', label: '5. TikTok Resmi (@dinsos.jabar)', icon: Video, ph: 'https://tiktok.com/@dinsos.jabar' },
              { key: 'email', label: '6. Email Official Kedinasan', icon: AtSign, ph: 'mailto:dinsos@jabarprov.go.id' },
              { key: 'x', label: '7. X / Twitter (@dinsosjabar)', icon: Twitter, ph: 'https://x.com/dinsosjabar' },
            ].map((item) => {
              const Icon = item.icon;
              const currentValue = (formData.socialLinks as any)?.[item.key] || '';
              return (
                <div key={item.key} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-800" />
                      <span>{item.label}</span>
                    </label>
                    {currentValue && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentValue, item.key)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                          title="Salin Tautan"
                        >
                          {copiedKey === item.key ? 'Tersalin!' : 'Salin'}
                        </button>
                        <a
                          href={currentValue}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-800 hover:text-cyan-600"
                          title="Buka Tautan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        socialLinks: {
                          ...formData.socialLinks,
                          [item.key]: val,
                        },
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-cyan-600"
                    placeholder={item.ph}
                  />
                </div>
              );
            })}
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
              <span>Perubahan tautan media sosial langsung tersinkronisasi ke footer dan kontak beranda.</span>
            </div>
            <button
              type="button"
              onClick={() => handleSave()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-800 to-blue-900 hover:from-cyan-900 hover:to-blue-950 text-cyan-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg border border-cyan-400/50 cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Media Sosial</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
