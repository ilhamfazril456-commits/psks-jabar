import React, { useState, useEffect } from 'react';
import { UserSession, AppSettings } from '../types';
import { WILAYAH_JABAR_LIST } from './InboxModal';
import { BackToHomeButton } from './BackToHomeButton';
import {
  ShieldAlert,
  Power,
  Save,
  ArrowLeft,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  Search,
  CheckSquare,
  XSquare,
  Lock,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface MaintenanceManagementPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
}

export const MaintenanceManagementPage: React.FC<MaintenanceManagementPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
}) => {
  const isDeveloper = session.isDeveloper || session.role === 'developer';

  // Initialize 27 Wilayah States for User
  const [userWilayahState, setUserWilayahState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const existing = appSettings.maintenanceUserWilayah || {};
    WILAYAH_JABAR_LIST.forEach((w) => {
      initial[w] = existing[w] !== undefined ? existing[w] : !!appSettings.maintenanceUser;
    });
    return initial;
  });

  // Initialize 27 Wilayah States for Admin
  const [adminWilayahState, setAdminWilayahState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const existing = appSettings.maintenanceAdminWilayah || {};
    WILAYAH_JABAR_LIST.forEach((w) => {
      initial[w] = existing[w] !== undefined ? existing[w] : !!appSettings.maintenanceAdmin;
    });
    return initial;
  });

  // Superadmin Maintenance State (Developer Only)
  const [mSuperadmin, setMSuperadmin] = useState<boolean>(!!appSettings.maintenanceSuperadmin);

  // Messages
  const [mMsgUser, setMMsgUser] = useState<string>(
    appSettings.maintenanceMsgUser ||
      'Mohon maaf, layanan portal untuk User/Pengunjung Publik di wilayah Anda sedang dalam pemeliharaan berkala.'
  );
  const [mMsgAdmin, setMMsgAdmin] = useState<string>(
    appSettings.maintenanceMsgAdmin ||
      'Pemberitahuan: Akses Portal Admin Wilayah sedang dalam pemeliharaan oleh Tim Developer Pusat.'
  );
  const [mMsgSuperadmin, setMMsgSuperadmin] = useState<string>(
    appSettings.maintenanceMsgSuperadmin ||
      'Perhatian: Pemeliharaan Server Superadmin Provinsi sedang berlangsung.'
  );

  const [searchUserWilayah, setSearchUserWilayah] = useState('');
  const [searchAdminWilayah, setSearchAdminWilayah] = useState('');
  const [activeSection, setActiveSection] = useState<'all' | 'user' | 'admin' | 'superadmin'>('all');

  // Popup notice for classic elegant confirmation
  const [saving, setSaving] = useState(false);
  const [popupNotice, setPopupNotice] = useState<{
    title: string;
    subtitle: string;
    detail: string;
    timestamp: string;
  } | null>(null);

  // Sync if appSettings update externally
  useEffect(() => {
    const existingUser = appSettings.maintenanceUserWilayah || {};
    const newUserState: Record<string, boolean> = {};
    WILAYAH_JABAR_LIST.forEach((w) => {
      newUserState[w] = existingUser[w] !== undefined ? existingUser[w] : !!appSettings.maintenanceUser;
    });
    setUserWilayahState(newUserState);

    const existingAdmin = appSettings.maintenanceAdminWilayah || {};
    const newAdminState: Record<string, boolean> = {};
    WILAYAH_JABAR_LIST.forEach((w) => {
      newAdminState[w] = existingAdmin[w] !== undefined ? existingAdmin[w] : !!appSettings.maintenanceAdmin;
    });
    setAdminWilayahState(newAdminState);

    setMSuperadmin(!!appSettings.maintenanceSuperadmin);
    if (appSettings.maintenanceMsgUser) setMMsgUser(appSettings.maintenanceMsgUser);
    if (appSettings.maintenanceMsgAdmin) setMMsgAdmin(appSettings.maintenanceMsgAdmin);
    if (appSettings.maintenanceMsgSuperadmin) setMMsgSuperadmin(appSettings.maintenanceMsgSuperadmin);
  }, [appSettings]);

  // Calculations for stats
  const activeUserCount = WILAYAH_JABAR_LIST.filter((w) => userWilayahState[w]).length;
  const isAllUserActive = activeUserCount === WILAYAH_JABAR_LIST.length;

  const activeAdminCount = WILAYAH_JABAR_LIST.filter((w) => adminWilayahState[w]).length;
  const isAllAdminActive = activeAdminCount === WILAYAH_JABAR_LIST.length;

  // Real-time auto save helper function
  const autoSaveConfig = async (
    newUserWilayah?: Record<string, boolean>,
    newAdminWilayah?: Record<string, boolean>,
    newSuperadmin?: boolean,
    newMsgUser?: string,
    newMsgAdmin?: string,
    newMsgSuperadmin?: string,
    labelInfo?: string
  ) => {
    const uWilayah = newUserWilayah ?? userWilayahState;
    const aWilayah = newAdminWilayah ?? adminWilayahState;
    const supState = newSuperadmin ?? mSuperadmin;
    const msgU = newMsgUser ?? mMsgUser;
    const msgA = newMsgAdmin ?? mMsgAdmin;
    const msgS = newMsgSuperadmin ?? mMsgSuperadmin;

    const globalUser = WILAYAH_JABAR_LIST.every((w) => uWilayah[w]);
    const globalAdmin = WILAYAH_JABAR_LIST.every((w) => aWilayah[w]);

    const updatedSettings: AppSettings = {
      ...appSettings,
      maintenanceUser: globalUser,
      maintenanceAdmin: globalAdmin,
      maintenanceSuperadmin: supState,
      maintenanceMsgUser: msgU,
      maintenanceMsgAdmin: msgA,
      maintenanceMsgSuperadmin: msgS,
      maintenanceUserWilayah: uWilayah,
      maintenanceAdminWilayah: aWilayah,
    };

    try {
      await onSaveSettings(updatedSettings);
      setPopupNotice({
        title: 'Status Saklar Maintenance Terpembarui',
        subtitle: 'Sinkronisasi Real-Time Firestore • 27 Wilayah Jawa Barat',
        detail: labelInfo || 'Perubahan status mode pemeliharaan sistem telah berhasil disinkronkan dan aktif secara otomatis.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
      });
    } catch (err) {
      console.error('Auto save error:', err);
    }
  };

  // Handlers for User Wilayah
  const handleToggleAllUser = (enable: boolean) => {
    const next: Record<string, boolean> = {};
    WILAYAH_JABAR_LIST.forEach((w) => {
      next[w] = enable;
    });
    setUserWilayahState(next);
    autoSaveConfig(
      next,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      enable
        ? 'Seluruh 27 Wilayah Kabupaten/Kota untuk Portal USER Publik berhasil diaktifkan mode maintenance.'
        : 'Seluruh 27 Wilayah Kabupaten/Kota untuk Portal USER Publik dinonaktifkan dari pemeliharaan (Akses Normal).'
    );
  };

  const handleToggleSingleUser = (wilayah: string) => {
    const nextState = !userWilayahState[wilayah];
    const nextMap = { ...userWilayahState, [wilayah]: nextState };
    setUserWilayahState(nextMap);
    autoSaveConfig(
      nextMap,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      `Saklar maintenance User Publik (${wilayah}) diubah menjadi ${nextState ? 'AKTIF (Di-Blokir)' : 'NON-AKTIF (Akses Normal)'}.`
    );
  };

  // Handlers for Admin Wilayah
  const handleToggleAllAdmin = (enable: boolean) => {
    const next: Record<string, boolean> = {};
    WILAYAH_JABAR_LIST.forEach((w) => {
      next[w] = enable;
    });
    setAdminWilayahState(next);
    autoSaveConfig(
      undefined,
      next,
      undefined,
      undefined,
      undefined,
      undefined,
      enable
        ? 'Seluruh 27 Wilayah Kabupaten/Kota untuk Portal ADMIN Wilayah berhasil diaktifkan mode maintenance.'
        : 'Seluruh 27 Wilayah Kabupaten/Kota untuk Portal ADMIN Wilayah dinonaktifkan dari pemeliharaan (Akses Normal).'
    );
  };

  const handleToggleSingleAdmin = (wilayah: string) => {
    const nextState = !adminWilayahState[wilayah];
    const nextMap = { ...adminWilayahState, [wilayah]: nextState };
    setAdminWilayahState(nextMap);
    autoSaveConfig(
      undefined,
      nextMap,
      undefined,
      undefined,
      undefined,
      undefined,
      `Saklar maintenance Admin Regional (${wilayah}) diubah menjadi ${nextState ? 'AKTIF (Di-Blokir)' : 'NON-AKTIF (Akses Normal)'}.`
    );
  };

  const handleToggleSuperadmin = () => {
    const nextState = !mSuperadmin;
    setMSuperadmin(nextState);
    autoSaveConfig(
      undefined,
      undefined,
      nextState,
      undefined,
      undefined,
      undefined,
      `Saklar maintenance Superadmin Pusat diubah menjadi ${nextState ? 'AKTIF (Di-Blokir)' : 'NON-AKTIF (Akses Normal)'}.`
    );
  };

  // Submit and save to Firestore
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Global flag is true only if ALL 27 regions are enabled
      const globalUser = WILAYAH_JABAR_LIST.every((w) => userWilayahState[w]);
      const globalAdmin = WILAYAH_JABAR_LIST.every((w) => adminWilayahState[w]);

      const updatedSettings: AppSettings = {
        ...appSettings,
        maintenanceUser: globalUser,
        maintenanceAdmin: globalAdmin,
        maintenanceSuperadmin: mSuperadmin,
        maintenanceMsgUser: mMsgUser,
        maintenanceMsgAdmin: mMsgAdmin,
        maintenanceMsgSuperadmin: mMsgSuperadmin,
        maintenanceUserWilayah: userWilayahState,
        maintenanceAdminWilayah: adminWilayahState,
      };

      await onSaveSettings(updatedSettings);
      alert('⚡ SAKLAR MAINTENANCE BERHASIL DISIMPAN & DISINKRONKAN REALTIME KE 27 WILAYAH JABAR!');
    } catch (err) {
      console.error('Error saving maintenance configuration:', err);
      alert('❌ Gagal menyimpan saklar maintenance. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const filteredUserWilayah = WILAYAH_JABAR_LIST.filter((w) =>
    w.toLowerCase().includes(searchUserWilayah.toLowerCase())
  );

  const filteredAdminWilayah = WILAYAH_JABAR_LIST.filter((w) =>
    w.toLowerCase().includes(searchAdminWilayah.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-28 animate-fadeIn">
      {/* HEADER MEGAH MEWAH */}
      <div className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 text-white border-b-4 border-[#d4af37] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <BackToHomeButton onClick={onBackToHome} variant="gold" id="btn-back-top-maintenance" />

                <span className="bg-[#d4af37] text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  FITUR 3 OF 3
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  REALTIME FIRESTORE SYNC
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3 mt-2">
                <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37] shrink-0" />
                <span>Konsol Saklar Maintenance Sistem Jabar</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 max-w-3xl leading-relaxed">
                Pusat Otoritas Pengendali Mode Pemeliharaan Real-Time untuk 27 Wilayah Kabupaten/Kota Jawa Barat. Atur saklar blokir per wilayah, saklar otomatis All-In, dan notifikasi pengumuman resmi.
              </p>
            </div>
          </div>

          {/* QUICK SECTION TABS */}
          <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-white/10">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeSection === 'all'
                  ? 'bg-[#d4af37] text-slate-950 shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Semua Fitur Maintenance
            </button>
            <button
              onClick={() => setActiveSection('user')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeSection === 'user'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Maintenance User ({activeUserCount}/27 Active)</span>
            </button>
            <button
              onClick={() => setActiveSection('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeSection === 'admin'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Maintenance Admin ({activeAdminCount}/27 Active)</span>
            </button>
            {isDeveloper && (
              <button
                onClick={() => setActiveSection('superadmin')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === 'superadmin'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Superadmin (Khusus Developer)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-10">
        {/* ========================================================================= */}
        {/* SECTION 1: MAINTENANCE USER PUBLIK (27 WILAYAH) */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'user') && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-rose-300 shadow-xl overflow-hidden transition-all">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 text-white p-3.5 sm:p-6 border-b-2 border-rose-500 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-600 text-white shadow-lg shrink-0">
                  <Users className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                      Maintenance USER / Publik (27 Wilayah)
                    </h2>
                    <span className="bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full uppercase">
                      Portal Pengunjung
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-rose-200 mt-0.5 font-semibold leading-tight sm:leading-normal">
                    Atur saklar pemeliharaan khusus untuk pengunjung & user publik di 27 Kabupaten/Kota.
                  </p>
                </div>
              </div>

              {/* Master All-In Switch Button */}
              <div className="flex items-center gap-3 bg-rose-900/60 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-rose-400/30 shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="block text-[10px] font-black text-rose-200 uppercase">
                    Saklar All-In User
                  </span>
                  <span className="block text-xs font-bold text-white">
                    {activeUserCount} / 27 Wilayah Terkunci
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAllUser(!isAllUserActive)}
                  className={`w-full sm:w-auto px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border ${
                    isAllUserActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400'
                  }`}
                >
                  <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>
                    {isAllUserActive
                      ? '⚡ MATIKAN SEMUA (27 WILAYAH)'
                      : '⚡ AKTIFKAN ALL-IN (27 WILAYAH)'}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
              {/* Notifikasi Teks User Column */}
              <div className="bg-rose-50/80 border-2 border-rose-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-[11px] sm:text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
                    <span>Kolom Pesan Notifikasi Maintenance User:</span>
                  </label>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-rose-700">
                    Tampil pada layar blokir pengunjung (Tersimpan Otomatis)
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={mMsgUser}
                  onChange={(e) => setMMsgUser(e.target.value)}
                  onBlur={() => autoSaveConfig(undefined, undefined, undefined, mMsgUser, undefined, undefined, 'Pesan notifikasi pemeliharaan User Publik berhasil diperbarui.')}
                  placeholder="Tuliskan pesan pemeliharaan untuk pengunjung publik..."
                  className="w-full bg-white border-2 border-rose-300 focus:border-rose-600 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-xs font-semibold text-slate-800 focus:outline-none shadow-inner"
                />
              </div>

              {/* Toolbar Search & Preset */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchUserWilayah}
                    onChange={(e) => setSearchUserWilayah(e.target.value)}
                    placeholder="Cari Wilayah Kabupaten/Kota..."
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleAllUser(true)}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
                    <span>Pilih Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllUser(false)}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <XSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                    <span>Buka Semua</span>
                  </button>
                </div>
              </div>

              {/* 27 WILAYAH SWITCHES GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {filteredUserWilayah.map((wilayah) => {
                  const isBlocked = !!userWilayahState[wilayah];
                  return (
                    <div
                      key={wilayah}
                      onClick={() => handleToggleSingleUser(wilayah)}
                      className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                        isBlocked
                          ? 'bg-rose-50/90 border-rose-500 shadow-xs hover:border-rose-600'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-black text-slate-900">
                          {wilayah}
                        </span>
                        <span
                          className={`inline-block text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full mt-0.5 sm:mt-1 uppercase ${
                            isBlocked
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isBlocked ? '🔴 TERBLOKIR' : '🟢 NORMAL'}
                        </span>
                      </div>

                      {/* Toggle Switch Pill */}
                      <div className="relative inline-flex items-center shrink-0">
                        <div
                          className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors p-0.5 ${
                            isBlocked ? 'bg-rose-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white shadow-md transition-transform transform ${
                              isBlocked ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: MAINTENANCE ADMIN REGIONAL (27 WILAYAH) */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'admin') && (
          <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl overflow-hidden transition-all">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white p-6 border-b-2 border-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-amber-600 text-white shadow-lg shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Maintenance ADMIN Regional (27 Wilayah)
                    </h2>
                    <span className="bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      Admin Kab/Kota
                    </span>
                  </div>
                  <p className="text-xs text-amber-200 mt-0.5 font-semibold">
                    Atur saklar pemeliharaan untuk akun Admin Dinas Sosial di 27 Kabupaten/Kota se-Jawa Barat.
                  </p>
                </div>
              </div>

              {/* Master All-In Switch Button */}
              <div className="flex items-center gap-3 bg-amber-900/60 p-2.5 rounded-2xl border border-amber-400/30 shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="block text-[10px] font-black text-amber-200 uppercase">
                    Saklar All-In Admin
                  </span>
                  <span className="block text-xs font-bold text-white">
                    {activeAdminCount} / 27 Wilayah Terkunci
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAllAdmin(!isAllAdminActive)}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer border ${
                    isAllAdminActive
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>
                    {isAllAdminActive
                      ? '⚡ MATIKAN SEMUA (27 WILAYAH)'
                      : '⚡ AKTIFKAN ALL-IN (27 WILAYAH)'}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Notifikasi Teks Admin Column */}
              <div className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Kolom Pesan Notifikasi Maintenance Admin:</span>
                  </label>
                  <span className="text-[11px] font-semibold text-amber-700">
                    Tampil pada portal login & dashboard admin terblokir
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={mMsgAdmin}
                  onChange={(e) => setMMsgAdmin(e.target.value)}
                  placeholder="Tuliskan pesan pemeliharaan untuk admin wilayah..."
                  className="w-full bg-white border-2 border-amber-300 focus:border-amber-600 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none shadow-inner"
                />
              </div>

              {/* Toolbar Search & Preset */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchAdminWilayah}
                    onChange={(e) => setSearchAdminWilayah(e.target.value)}
                    placeholder="Cari Wilayah Kabupaten/Kota..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleAllAdmin(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pilih Semua (Maintenance)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllAdmin(false)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <XSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Buka Semua (Normal)</span>
                  </button>
                </div>
              </div>

              {/* 27 WILAYAH SWITCHES GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAdminWilayah.map((wilayah) => {
                  const isBlocked = !!adminWilayahState[wilayah];
                  return (
                    <div
                      key={wilayah}
                      onClick={() => handleToggleSingleAdmin(wilayah)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        isBlocked
                          ? 'bg-amber-50/90 border-amber-500 shadow-md hover:border-amber-600'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-black text-slate-900">
                          {wilayah}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1 uppercase ${
                            isBlocked
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isBlocked ? '🟠 TERBLOKIR' : '🟢 NORMAL'}
                        </span>
                      </div>

                      {/* Toggle Switch Pill */}
                      <div className="relative inline-flex items-center shrink-0">
                        <div
                          className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                            isBlocked ? 'bg-amber-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${
                              isBlocked ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: KHUSUS AKUN DEVELOPER (MAINTENANCE SUPERADMIN) */}
        {/* ========================================================================= */}
        {isDeveloper && (activeSection === 'all' || activeSection === 'superadmin') && (
          <div className="bg-white rounded-3xl border-2 border-purple-400 shadow-xl overflow-hidden transition-all">
            <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 text-white p-6 border-b-2 border-purple-500 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-purple-600 text-white shadow-lg shrink-0">
                  <Lock className="w-7 h-7 text-[#d4af37]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Maintenance SUPERADMIN (Khusus Developer)
                    </h2>
                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#d4af37]" />
                      Otoritas Developer Utama
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mt-0.5 font-semibold">
                    Kunci saklar pemeliharaan untuk Superadmin Provinsi Jawa Barat. Otoritas penuh khusus pengembang (Ilham Fazril).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={mSuperadmin}
                    onChange={(e) => setMSuperadmin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <div className="p-6 space-y-4 bg-purple-50/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-purple-950 uppercase tracking-wider">
                  Kolom Pesan Notifikasi Maintenance Superadmin:
                </label>
                <span className="text-[11px] font-semibold text-purple-800">
                  Tampil saat Superadmin Provinsi mengakses sistem (Tersimpan Otomatis)
                </span>
              </div>
              <textarea
                rows={2}
                value={mMsgSuperadmin}
                onChange={(e) => setMMsgSuperadmin(e.target.value)}
                onBlur={() => autoSaveConfig(undefined, undefined, undefined, undefined, undefined, mMsgSuperadmin, 'Pesan notifikasi pemeliharaan Superadmin Pusat berhasil diperbarui.')}
                placeholder="Tuliskan pesan pemeliharaan untuk superadmin..."
                className="w-full bg-white border-2 border-purple-300 focus:border-purple-600 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none shadow-inner"
              />
            </div>
          </div>
        )}

        {/* BOTTOM BACK BUTTON */}
        <div className="pt-6 border-t border-slate-300 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToHome} variant="gold" id="btn-back-bottom-maintenance" />
          <div className="text-xs text-slate-600 font-semibold">
            <span>PSKS JABAR Provinsi Jawa Barat • Konsol Saklar Pemeliharaan</span>
          </div>
        </div>
      </div>

      {/* POP-UP NOTIFIKASI KLASIK & BERKELAS: SINKRONISASI REALTIME */}
      {popupNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl border-2 border-[#d4af37] shadow-2xl overflow-hidden transform transition-all scale-100">
            {/* HEADER KLASIK MEWAH */}
            <div className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 text-white p-5 border-b-2 border-[#d4af37] relative">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-[#d4af37] text-[#043e2e] shadow-lg shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-[#d4af37] uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-[#d4af37]/30">
                    SINKRONISASI CLOUD REAL-TIME
                  </span>
                  <h3 className="text-base font-black text-white tracking-wide mt-1">
                    {popupNotice.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPopupNotice(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer text-xs font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* CONTENT BODY */}
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-950">
                    Konfigurasi Berhasil Disimpan & Disinkronkan
                  </h4>
                  <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                    {popupNotice.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold px-1 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Status: Terhubung Cloud Firestore
                </span>
                <span className="text-slate-500 font-mono">{popupNotice.timestamp}</span>
              </div>

              {/* BUTTON TUTUP */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setPopupNotice(null)}
                  className="w-full py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white hover:brightness-110 shadow-lg transition-all cursor-pointer border border-[#d4af37]/60 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                  <span>Mengerti & Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
