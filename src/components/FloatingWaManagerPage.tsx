import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Phone,
  Send,
  RefreshCw,
  Copy,
  ExternalLink,
  Info,
  Layers,
  ArrowUpDown,
  Flame,
  Globe,
  Code2,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import { UserSession, AppSettings } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';
import { BackToHomeButton } from './BackToHomeButton';
import { recordSystemActivity } from '../lib/activityLogger';

interface FloatingWaManagerPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
}

export const FloatingWaManagerPage: React.FC<FloatingWaManagerPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
}) => {
  const isAuthorized =
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) &&
    session.statusActive === 'SAH_TERDAFTAR';

  const isDeveloper = session.role === 'developer' || session.isDeveloper;

  // Local state for 27 Region Numbers
  const [regionNumbers, setRegionNumbers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    KAB_KOTA_ONLY.forEach((wil) => {
      map[wil] = appSettings.floatingWaRegionNumbers?.[wil] || appSettings.floatingWaNumber || '6289602421065';
    });
    return map;
  });

  // Local state for Superadmin and Developer WA
  const [superadminNumber, setSuperadminNumber] = useState<string>(
    appSettings.floatingWaSuperadminNumber || appSettings.floatingWaNumber || '6289602421065'
  );
  const [developerNumber, setDeveloperNumber] = useState<string>(
    appSettings.floatingWaDeveloperNumber || '6289602421065'
  );

  // ALL IN Bulk Input State
  const [allInNumber, setAllInNumber] = useState<string>('');

  // UI Filters and Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'default'>('all');
  const [sortOption, setSortOption] = useState<'standard' | 'asc' | 'desc'>('standard');

  // Modal & Toast States
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

  const [showSuccessToast, setShowSuccessToast] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({ show: false, title: '', message: '' });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sanitize phone number to standard format
  const sanitizePhoneNumber = (val: string): string => {
    let clean = val.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const triggerToast = (title: string, message: string) => {
    setShowSuccessToast({ show: true, title, message });
    setTimeout(() => {
      setShowSuccessToast({ show: false, title: '', message: '' });
    }, 3500);
  };

  // Handle saving all settings to Firestore / LocalStorage
  const handleSaveAll = async (
    customRegionMap?: Record<string, string>,
    customSuperadmin?: string,
    customDeveloper?: string,
    actionLogDesc?: string
  ) => {
    setIsSaving(true);
    try {
      const finalRegions = customRegionMap || regionNumbers;
      const finalSuperadmin = customSuperadmin || superadminNumber;
      const finalDeveloper = customDeveloper || developerNumber;

      const updated: AppSettings = {
        ...appSettings,
        floatingWaNumber: finalSuperadmin || appSettings.floatingWaNumber || '6289602421065',
        floatingWaSuperadminNumber: finalSuperadmin,
        floatingWaDeveloperNumber: finalDeveloper,
        floatingWaRegionNumbers: finalRegions,
      };

      await onSaveSettings(updated);

      // Audit Log
      recordSystemActivity({
        session,
        category: 'ADMIN_ACCOUNT',
        actionType: 'UPDATE',
        targetCollection: 'app_settings',
        targetId: 'floating_wa_config',
        targetName: 'Konfigurasi Floating WhatsApp',
        targetWilayah: session.wilayah,
        details:
          actionLogDesc ||
          `${session.nama} (${session.role}) memperbarui konfigurasi nomor WhatsApp Floating 27 Kab/Kota Jawa Barat.`,
      });

      triggerToast('Perubahan Berhasil Disimpan', 'Konfigurasi nomor WhatsApp floating telah diperbarui secara realtime.');
    } catch (err) {
      console.error('Failed saving floating WA settings', err);
      alert('Terjadi kesalahan saat menyimpan data pengaturan WhatsApp.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle ALL IN Bulk Replacement
  const handleApplyAllIn = () => {
    if (!allInNumber.trim()) {
      alert('Silakan masukkan nomor WhatsApp pada kolom ALL IN terlebih dahulu.');
      return;
    }

    const cleanNum = sanitizePhoneNumber(allInNumber.trim());
    if (cleanNum.length < 8) {
      alert('Format nomor WhatsApp tidak valid. Masukkan minimal 8-15 digit angka.');
      return;
    }

    setConfirmModalData({
      title: 'Terapkan ALL IN ke Seluruh Wilayah?',
      message: `Tindakan ini akan langsung mengubah seluruh 27 kontak WhatsApp Admin Kabupaten/Kota dan kontak Superadmin Provinsi Jawa Barat menjadi nomor: ${cleanNum}.\n\nApakah Anda yakin ingin melanjutkan?`,
      action: async () => {
        const newMap: Record<string, string> = {};
        KAB_KOTA_ONLY.forEach((w) => {
          newMap[w] = cleanNum;
        });
        setRegionNumbers(newMap);
        setSuperadminNumber(cleanNum);

        await handleSaveAll(
          newMap,
          cleanNum,
          developerNumber,
          `${session.nama} menerapkan fitur ALL IN nomor WhatsApp (${cleanNum}) ke seluruh 27 Kab/Kota dan Superadmin.`
        );
        setShowConfirmModal(false);
      },
    });
    setShowConfirmModal(true);
  };

  // Copy Superadmin number to a specific region
  const handleCopyFromSuperadmin = (wilayah: string) => {
    const updated = { ...regionNumbers, [wilayah]: superadminNumber };
    setRegionNumbers(updated);
    handleSaveAll(updated, superadminNumber, developerNumber, `Menyalin nomor Superadmin ke wilayah ${wilayah}.`);
  };

  // Change individual region number
  const handleRegionNumberChange = (wilayah: string, value: string) => {
    setRegionNumbers((prev) => ({
      ...prev,
      [wilayah]: value,
    }));
  };

  // Filter and sort the 27 regions
  const filteredRegions = useMemo(() => {
    let list = [...KAB_KOTA_ONLY];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((wil) => {
        const num = regionNumbers[wil] || '';
        return wil.toLowerCase().includes(q) || num.includes(q);
      });
    }

    // Filter type
    if (filterType === 'custom') {
      list = list.filter((wil) => {
        const num = regionNumbers[wil];
        return num && num !== superadminNumber;
      });
    } else if (filterType === 'default') {
      list = list.filter((wil) => {
        const num = regionNumbers[wil];
        return !num || num === superadminNumber;
      });
    }

    // Sorting
    if (sortOption === 'asc') {
      list.sort((a, b) => a.localeCompare(b));
    } else if (sortOption === 'desc') {
      list.sort((a, b) => b.localeCompare(a));
    }

    return list;
  }, [regionNumbers, superadminNumber, searchQuery, filterType, sortOption]);

  // Telemetry counts
  const filledCount = useMemo(() => {
    return Object.values(regionNumbers).filter((v) => Boolean(v && v.trim())).length;
  }, [regionNumbers]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-sm text-slate-600 max-w-md mt-1 mb-6">
          Halaman ini hanya dapat diakses oleh Super Admin Dinsos Provinsi Jawa Barat & Tim Developer Terverifikasi.
        </p>
        <BackToHomeButton onClick={onBackToHome} id="btn-back-unauth-wa" />
      </div>
    );
  }

  return (
    <div id="floating-wa-manager-page" className="min-h-screen bg-slate-50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* TOP NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-top-floating-wa" />

          <div className="flex items-center gap-2 bg-gradient-to-r from-[#032e22] to-[#085a43] text-amber-300 border border-[#d4af37]/40 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            <span>FITUR 8 • OTORITAS KONTAK WHATSAPP CS</span>
          </div>
        </div>

        {/* HERO HEADER SECTION */}
        <div className="relative bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-3xl p-6 sm:p-10 text-white border-2 border-[#d4af37] shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Panel Pengaturan Kontak CS Floating</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase leading-tight">
                Ubah Kontak Floating WhatsApp
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
                Pusat kendali pengaturan nomor WhatsApp Customer Service melayang untuk 27 Kabupaten/Kota se-Jawa Barat, 
                Superadmin Dinsos Provinsi, dan Developer. Dilengkapi fitur <span className="text-[#d4af37] font-bold">ALL IN</span> untuk mengubah seluruh nomor wilayah dalam satu klik.
              </p>
            </div>

            {/* Quick Summary Pill Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 text-left shrink-0 w-full md:w-auto shadow-inner space-y-2.5">
              <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-300" />
                <span>Status Cakupan Wilayah</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-[#032e22]/80 border border-emerald-500/30 p-2.5 rounded-xl">
                  <div className="text-lg sm:text-2xl font-black text-white">{filledCount}/27</div>
                  <div className="text-[10px] text-emerald-200 font-semibold">Wilayah Terisi</div>
                </div>
                <div className="bg-[#032e22]/80 border border-amber-500/30 p-2.5 rounded-xl">
                  <div className="text-lg sm:text-2xl font-black text-amber-300">Realtime</div>
                  <div className="text-[10px] text-amber-200 font-semibold">Sinkronisasi Cloud</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: ALL IN MASS BULK UPDATER (1 KOLOM UTAMA) */}
        <div className="relative bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 rounded-3xl p-5 sm:p-7 border-2 border-amber-400/80 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-300/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md">
                <Flame className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#043e2e] uppercase tracking-wide flex items-center gap-2">
                  <span>1 Kolom Utama: Fitur ALL IN No WA Admin Dinsos</span>
                  <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                    MASSAL
                  </span>
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Ubah seluruh nomor WhatsApp 27 Kabupaten/Kota dan Superadmin sekaligus dengan satu nomor tujuan yang sama.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-all-in-wa"
                value={allInNumber}
                onChange={(e) => setAllInNumber(e.target.value)}
                placeholder="Contoh: 6289602421065 atau 08122334455"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-amber-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-bold text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              id="btn-apply-all-in-wa"
              onClick={handleApplyAllIn}
              disabled={isSaving}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 border border-[#d4af37] font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>Terapkan ALL IN ke Seluruh 27 Wilayah</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            * Format otomatis disesuaikan (08... akan otomatis dikonversi menjadi format internasional 628...).
          </p>
        </div>

        {/* SECTION 2: 1 KOLOM SUPERADMIN & 1 KOLOM DEVELOPER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* 1 KOLOM NO WA ADMIN DINSOS SUPERADMIN */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-200 shadow-md space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#043e2e] text-[#d4af37] flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#043e2e] uppercase tracking-wide">
                      1 Kolom No WA Admin Dinsos Superadmin
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Provinsi Jawa Barat (Pusat Kendali Otoritas)
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-[#043e2e] text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                  SUPERADMIN
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Nomor WhatsApp Superadmin Provinsi:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-superadmin-wa"
                    value={superadminNumber}
                    onChange={(e) => setSuperadminNumber(e.target.value)}
                    placeholder="6289602421065"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e] text-xs font-bold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <a
                  href={`https://wa.me/${sanitizePhoneNumber(superadminNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Uji Chat WA</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(superadminNumber, 'superadmin')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                >
                  {copiedKey === 'superadmin' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'superadmin' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-save-superadmin-wa"
                onClick={() => handleSaveAll(regionNumbers, superadminNumber, developerNumber, 'Menyimpan nomor WhatsApp Superadmin.')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>

          {/* 1 KOLOM NO WA KHUSUS DEVELOPER (JIKA ROLE DEVELOPER) */}
          {isDeveloper ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-6 border-2 border-indigo-500/50 shadow-md space-y-4 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-indigo-200 uppercase tracking-wide">
                        1 Kolom No WA Admin Developer
                      </h4>
                      <p className="text-[11px] text-indigo-300/80 font-medium">
                        Khusus Akses Root & Pemeliharaan Sistem
                      </p>
                    </div>
                  </div>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-indigo-400/40">
                    DEV ONLY
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="text-xs font-bold text-indigo-200 block">
                    Nomor WhatsApp Admin Developer:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="input-developer-wa"
                      value={developerNumber}
                      onChange={(e) => setDeveloperNumber(e.target.value)}
                      placeholder="6289602421065"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-indigo-500/50 focus:border-indigo-400 text-xs font-bold text-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-indigo-800/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${sanitizePhoneNumber(developerNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Uji Chat WA</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(developerNumber, 'developer')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-200 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    {copiedKey === 'developer' ? (
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'developer' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-save-developer-wa"
                  onClick={() => handleSaveAll(regionNumbers, superadminNumber, developerNumber, 'Menyimpan nomor WhatsApp Developer.')}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs flex flex-col justify-center items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-700">
                Pemberitahuan Sinkronisasi
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Setiap perubahan nomor WhatsApp pada halaman ini akan langsung terhubung secara realtime ke tombol CS melayang di seluruh website.
              </p>
            </div>
          )}

        </div>

        {/* SECTION 3: 27 KOLOM NOMOR WA ADMIN WILAYAH (KABUPATEN / KOTA) */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
          
          {/* Header & Filter / Search Controls */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#043e2e] uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#d4af37]" />
                <span>27 Kolom No WA Admin Wilayah Kabupaten / Kota</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sesuaikan nomor WhatsApp admin per wilayah agar pengunjung dapat menghubungi admin sesuai domisili.
              </p>
            </div>

            {/* Filter, Sort & Search Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari wilayah atau nomor..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#043e2e] text-xs font-bold text-slate-800 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-[#043e2e] text-amber-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({KAB_KOTA_ONLY.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('custom')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    filterType === 'custom'
                      ? 'bg-[#043e2e] text-amber-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nomor Khusus
                </button>
              </div>

              {/* Sorting Button */}
              <button
                type="button"
                onClick={() => {
                  if (sortOption === 'standard') setSortOption('asc');
                  else if (sortOption === 'asc') setSortOption('desc');
                  else setSortOption('standard');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                title="Ubah Urutan Wilayah"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>
                  {sortOption === 'standard' ? 'Urutan Jabar' : sortOption === 'asc' ? 'A-Z' : 'Z-A'}
                </span>
              </button>

              {/* Global Save Button */}
              <button
                type="button"
                id="btn-save-all-floating-wa"
                onClick={() => handleSaveAll()}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#043e2e] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 border border-[#d4af37] font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Simpan Semua</span>
              </button>

            </div>
          </div>

          {/* 27 REGIONS GRID (Responsive: 1 col on mobile, 2 col on tablet, 3 col on large screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredRegions.map((wilayah, index) => {
              const currentNum = regionNumbers[wilayah] || '';
              const isDefault = !currentNum || currentNum === superadminNumber;
              const cleanNum = sanitizePhoneNumber(currentNum);

              return (
                <div
                  key={wilayah}
                  id={`wa-card-${wilayah.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-400 transition-all duration-200 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md group"
                >
                  <div>
                    {/* Region Title & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#043e2e] text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h5 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          {wilayah}
                        </h5>
                      </div>
                      
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${
                          isDefault
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        }`}
                      >
                        {isDefault ? 'Superadmin' : 'Kustom'}
                      </span>
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={currentNum}
                        onChange={(e) => handleRegionNumberChange(wilayah, e.target.value)}
                        placeholder="Contoh: 6289602421065"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e] text-xs font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1 text-[10px]">
                    <div className="flex items-center gap-1">
                      <a
                        href={`https://wa.me/${cleanNum}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-2xs"
                        title="Buka Chat WhatsApp"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Tes</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(currentNum, wilayah)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-all cursor-pointer"
                        title="Salin Nomor"
                      >
                        {copiedKey === wilayah ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === wilayah ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyFromSuperadmin(wilayah)}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition-all cursor-pointer"
                      title="Salin dari nomor Superadmin"
                    >
                      Salin Super
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRegions.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-slate-600">Tidak ada wilayah yang sesuai dengan pencarian.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Reset Pencarian & Filter
              </button>
            </div>
          )}

          {/* Bottom Save Bar inside Table */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredRegions.length} dari 27 Kabupaten/Kota se-Jawa Barat.
            </div>
            
            <button
              type="button"
              id="btn-save-all-floating-wa-bottom"
              onClick={() => handleSaveAll()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 border-2 border-[#d4af37] font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Simpan Seluruh Perubahan (27 Wilayah)</span>
            </button>
          </div>

        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-floating-wa" />
          <div className="text-xs text-slate-500 font-semibold">
            <span>PSKS JABAR Provinsi Jawa Barat • Otoritas Kontak Floating WhatsApp</span>
          </div>
        </div>

      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {showConfirmModal && confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#d4af37] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <Flame className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 uppercase">
                {confirmModalData.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {confirmModalData.message}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-modal-action"
                onClick={confirmModalData.action}
                className="flex-1 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 border border-[#d4af37] font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP TOAST */}
      {showSuccessToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#043e2e] text-white border-2 border-[#d4af37] rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#043e2e] flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 font-black" />
          </div>
          <div className="space-y-0.5 flex-1">
            <h4 className="text-xs font-black text-amber-300">{showSuccessToast.title}</h4>
            <p className="text-[11px] text-emerald-100 leading-tight">{showSuccessToast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
};
