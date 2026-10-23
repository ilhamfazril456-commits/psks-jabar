import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  CreditCard, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UserSession, AppSettings } from '../types';
import { BackToHomeButton } from './BackToHomeButton';

interface PinSecurityManagementPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
}

export const PinSecurityManagementPage: React.FC<PinSecurityManagementPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
}) => {
  const isDeveloperUser = session.role === 'developer' || session.isDeveloper === true;
  const isAuthorized = isDeveloperUser || session.role === 'superadmin';

  // Real-time state derived from appSettings with clean defaults
  const superadminPinCurrent = appSettings.superadminPin || '123456';
  const developerPinCurrent = appSettings.developerPin || '992211';

  // Local state for edits
  const [newSuperadminPin, setNewSuperadminPin] = useState(superadminPinCurrent);
  const [newDeveloperPin, setNewDeveloperPin] = useState(developerPinCurrent);

  // Visibility toggle state for secret PINs
  const [showSuperadminPin, setShowSuperadminPin] = useState(false);
  const [showDeveloperPin, setShowDeveloperPin] = useState(false);

  // Loading & Feedback status
  const [isSavingSuperadmin, setIsSavingSuperadmin] = useState(false);
  const [isSavingDeveloper, setIsSavingDeveloper] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep local inputs synced with external real-time database changes
  useEffect(() => {
    if (appSettings.superadminPin) setNewSuperadminPin(appSettings.superadminPin);
    if (appSettings.developerPin) setNewDeveloperPin(appSettings.developerPin);
  }, [appSettings.superadminPin, appSettings.developerPin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const generateRandomPin = () => {
    // Generate secure 6-digit number between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSaveSuperadminPin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPin = newSuperadminPin.trim().replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) {
      setErrorMessage('PIN Superadmin harus berupa 6 digit angka.');
      return;
    }

    setIsSavingSuperadmin(true);
    try {
      const updated: AppSettings = {
        ...appSettings,
        superadminPin: cleanPin,
        pinSecurityUpdatedAt: Date.now(),
      };
      await onSaveSettings(updated);
      setSuccessMessage('✅ PIN Smart Card Superadmin berhasil diperbarui dan aktif realtime di database!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan PIN: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingSuperadmin(false);
    }
  };

  const handleSaveDeveloperPin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPin = newDeveloperPin.trim().replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) {
      setErrorMessage('PIN Developer harus berupa 6 digit angka.');
      return;
    }

    setIsSavingDeveloper(true);
    try {
      const updated: AppSettings = {
        ...appSettings,
        developerPin: cleanPin,
        pinSecurityUpdatedAt: Date.now(),
      };
      await onSaveSettings(updated);
      setSuccessMessage('✅ PIN Smart Card Developer berhasil diperbarui dan aktif realtime di database!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan PIN: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingDeveloper(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-black tracking-wide">Akses Dibatasi Khusus Developer</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6 text-center max-w-md">
          Modul Fitur 15 (Pusat Keamanan PIN) dilindungi secara ketat dan hanya dapat diakses oleh Akun Developer Utama.
        </p>
        <BackToHomeButton onClick={onBackToHome} variant="light" />
      </div>
    );
  }

  return (
    <div id="pin-security-section" className="min-h-[85vh] bg-slate-50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-top-pin-security" variant="light" />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-950 border border-indigo-300 px-3 py-1.5 rounded-full text-xs font-black shadow-xs">
              <Key className="w-3.5 h-3.5 text-indigo-700" />
              <span>FITUR 15</span>
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-900/10 border border-emerald-800/20 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold text-[#043e2e]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>OTORITAS EKSKLUSIF: DEVELOPER</span>
            </div>
          </div>
        </div>

        {/* Hero Banner Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06152d] via-[#091f42] to-[#040e1f] p-5 sm:p-8 text-white shadow-xl border border-indigo-900/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-indigo-300" />
                Pusat Kendali Keamanan Smart Card
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sinkronisasi Realtime Aktif
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Pusat Keamanan PIN Smart Access Card
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola dan pantau 6 digit PIN otorisasi untuk Kartu Fisik (Tap NFC & Scan QR) Superadmin dan Developer.
              Perubahan tersimpan otomatis dan aktif secara realtime ke database.
            </p>
          </div>
        </div>

        {/* Alert Feedback Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-semibold">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* Grid 2 Kartu PIN: Superadmin & Developer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* KARTU 1: PIN SUPERADMIN PROVINSI */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2b5c] to-[#1a4a9c] flex items-center justify-center text-amber-300 shadow-sm">
                    <CreditCard className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      PIN Smart Card Superadmin
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Otorisasi Kartu Fisik Superadmin Provinsi Jabar
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                  SUPERADMIN
                </span>
              </div>

              {/* Status PIN Aktif Saat Ini */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    PIN Aktif di Database
                  </div>
                  <div className="font-mono text-lg font-black text-slate-800 tracking-widest mt-0.5">
                    {showSuperadminPin ? superadminPinCurrent : '••••••'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuperadminPin(!showSuperadminPin)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={showSuperadminPin ? 'Sembunyikan PIN' : 'Lihat PIN Asli'}
                >
                  {showSuperadminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSuperadminPin ? 'Tutup' : 'Lihat'}</span>
                </button>
              </div>

              {/* Form Ubah PIN */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Ubah 6 Digit PIN Superadmin Baru:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]*"
                    value={newSuperadminPin}
                    onChange={(e) => setNewSuperadminPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 123456"
                    className="w-full h-11 px-3.5 font-mono text-base font-black tracking-widest rounded-xl border-2 border-slate-300 focus:border-indigo-600 focus:outline-hidden transition-all bg-white"
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-400 font-mono">
                    {newSuperadminPin.length}/6
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSuperadminPin(generateRandomPin())}
                    className="flex-1 py-2 px-3 rounded-lg border border-indigo-200 hover:border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Acak PIN Otomatis</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveSuperadminPin}
                disabled={isSavingSuperadmin}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1a4a9c] hover:from-[#133773] hover:to-[#2257b3] text-amber-300 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingSuperadmin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>Simpan PIN Superadmin Realtime</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* KARTU 2: PIN DEVELOPER UTAMA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#043e2e] to-[#0a523e] flex items-center justify-center text-emerald-200 shadow-sm">
                    <Key className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      PIN Smart Card Developer
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Otorisasi Kartu Fisik Lead Developer
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                  DEVELOPER
                </span>
              </div>

              {/* Status PIN Aktif Saat Ini & Form Ubah PIN */}
              {!isDeveloperUser ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center my-auto">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center mb-2">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Terkunci: Khusus Lead Developer
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Kredensial PIN Root Developer hanya dapat dikonfigurasi dan dilihat secara eksklusif oleh akun Developer utama (*Kang Ilham Fazril*).
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        PIN Aktif di Database
                      </div>
                      <div className="font-mono text-lg font-black text-slate-800 tracking-widest mt-0.5">
                        {showDeveloperPin ? developerPinCurrent : '••••••'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeveloperPin(!showDeveloperPin)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={showDeveloperPin ? 'Sembunyikan PIN' : 'Lihat PIN Asli'}
                    >
                      {showDeveloperPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showDeveloperPin ? 'Tutup' : 'Lihat'}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Ubah 6 Digit PIN Developer Baru:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        pattern="[0-9]*"
                        value={newDeveloperPin}
                        onChange={(e) => setNewDeveloperPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Contoh: 992211"
                        className="w-full h-11 px-3.5 font-mono text-base font-black tracking-widest rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-hidden transition-all bg-white"
                      />
                      <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-400 font-mono">
                        {newDeveloperPin.length}/6
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewDeveloperPin(generateRandomPin())}
                        className="flex-1 py-2 px-3 rounded-lg border border-emerald-200 hover:border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Acak PIN Otomatis</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSaveDeveloperPin}
                      disabled={isSavingDeveloper}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#043e2e] to-[#0a523e] hover:from-[#06503c] hover:to-[#0c6149] text-emerald-100 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingDeveloper ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                          <span>Menyimpan ke Database...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Simpan PIN Developer Realtime</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KARTU 3: KETERANGAN SISTEM KEAMANAN & ANTI-TEBAK */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Spesifikasi Keamanan Smart Access Card (Aturan Sistem Terpasang):</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-extrabold text-slate-800 mb-1">⏱️ Proteksi Anti-Tebak Bertingkat</div>
              <div className="text-slate-600 leading-relaxed">
                3x salah PIN dibekukan 15 detik. Setiap kesalahan berikutnya dibekukan 30 detik per salah percobaan.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-extrabold text-slate-800 mb-1">🔒 Token Fisik Permanen Terkunci</div>
              <div className="text-slate-600 leading-relaxed">
                Link NFC & Token QR yang sudah dicetak di kartu fisik dijamin 100% permanen dan tidak pernah diubah.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-extrabold text-slate-800 mb-1">⚡ Sinkronisasi Database Realtime</div>
              <div className="text-slate-600 leading-relaxed">
                Setiap pergantian PIN di modul ini langsung aktif detik itu juga ke sensor NFC dan kamera scanner.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
