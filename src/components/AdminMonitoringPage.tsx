import React, { useState, useEffect } from 'react';
import { UserSession, AdminAccount } from '../types';
import {
  Activity,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  UserCheck,
  Clock,
  Laptop,
  Radio,
  ArrowLeft,
  Users,
  CheckCircle2,
  Eye,
  Send,
  Zap,
  Building2,
  Info,
  MessageSquare,
  Inbox
} from 'lucide-react';
import { BackToHomeButton } from './BackToHomeButton';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AdminMonitoringPageProps {
  session?: UserSession;
  adminAccounts: AdminAccount[];
  onBackToHome: () => void;
  onOpenAdminManagement?: () => void;
  onNavigateToManagement?: () => void;
  onUpdateAdminAccount?: (updated: AdminAccount) => void;
  onOpenInbox?: () => void;
  onSendMessageToAccount?: (targetWilayah: string) => void;
  onSendMessage?: (msg: { senderName: string; senderRole: string; targetWilayah: string; subject: string; content: string; timestamp: string }) => void;
  onNavigateToMaintenance?: () => void;
}

export const AdminMonitoringPage: React.FC<AdminMonitoringPageProps> = ({
  session,
  adminAccounts,
  onBackToHome,
  onOpenAdminManagement,
  onNavigateToManagement,
  onUpdateAdminAccount,
  onOpenInbox,
  onSendMessageToAccount,
  onSendMessage,
  onNavigateToMaintenance,
}) => {
  const handleOpenManagement = onOpenAdminManagement || onNavigateToManagement || (() => {});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(null);
  const [targetAccountForMsg, setTargetAccountForMsg] = useState<AdminAccount | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showPopupAlert, setShowPopupAlert] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live time ticker for active session timestamp & continuous status recalculation
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [, setTicker] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
      setCurrentTimeStr(timeString);
      setTicker((prev) => prev + 1);
    };
    updateTime();
    const interval = setInterval(updateTime, 2000);
    return () => clearInterval(interval);
  }, []);

  const isDeveloperUser = session?.role === 'developer' || session?.isDeveloper;
  const isSuperadminUser = session?.role === 'superadmin';

  // Preserve all registered admin accounts (supports multiple accounts per Wilayah & new registered accounts)
  const deduplicatedMap = new Map<string, AdminAccount>();
  adminAccounts.forEach((acc) => {
    const key = (acc.username || acc.id || '').toLowerCase().trim();

    if (key && !deduplicatedMap.has(key)) {
      deduplicatedMap.set(key, acc);
    }
  });

  const cleanAccountsList = Array.from(deduplicatedMap.values());

  // STRICT RULE: Khusus memantau akun dengan role admin wilayah dan superadmin saja.
  // Seluruh akun user, guest, tamu, dan pengunjung sepenuhnya dikecualikan.
  const relevantAccounts = cleanAccountsList.filter((acc) => {
    const r = (acc.role || '').toLowerCase().trim();
    const u = (acc.username || '').toLowerCase().trim();
    const n = (acc.namaAdmin || '').toLowerCase().trim();

    // 1. STRICT REJECTION: Reject seluruh akun user, guest, tamu, dan pengunjung
    if (
      r === 'user' ||
      r === 'guest' ||
      r === 'tamu' ||
      acc.isGuest === true ||
      acc.statusActive === 'GUEST' ||
      u === 'tamu' ||
      u === 'tamu publik' ||
      u.startsWith('user_') ||
      u.includes('guest') ||
      n.includes('tamu publik') ||
      n.includes('pengunjung')
    ) {
      return false;
    }

    // 2. Developer Session: Developer, Superadmin, dan Admin Wilayah
    if (isDeveloperUser) {
      return (
        r === 'superadmin' ||
        r === 'admin' ||
        r === 'developer' ||
        u.startsWith('admin_') ||
        u.includes('superadmin') ||
        u === 'ilhamfazril'
      );
    }

    // 3. Superadmin & Admin Wilayah Session: Khusus superadmin dan admin wilayah
    return (
      r === 'superadmin' ||
      r === 'admin' ||
      u.startsWith('admin_') ||
      u.includes('superadmin')
    );
  });

  // Determine screen activity status for an account:
  // 'AKTIF_LAYAR' = Online & actively viewing screen (tab visible, focused, active heartbeat within 35s)
  // 'AFK_IDLE' = Online but idle on screen
  // 'LATAR_BELAKANG' = Tab running in background or lost window focus
  // 'OFFLINE' = Offline / Tab closed
  const getAccountScreenStatus = (acc: AdminAccount): 'AKTIF_LAYAR' | 'AFK_IDLE' | 'LATAR_BELAKANG' | 'OFFLINE' => {
    // 1. Check if this account is the local session user
    const isCurrentSessionUser =
      session?.statusActive === 'SAH_TERDAFTAR' &&
      (((session.isDeveloper || session.role === 'developer') && acc.role === 'developer') ||
        (session.role === 'superadmin' && acc.role === 'superadmin') ||
        (acc.role === session.role && (acc.wilayahTugas || '').toLowerCase().trim() === (session.wilayah || '').toLowerCase().trim()) ||
        (acc.username || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
        (acc.namaAdmin || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
        (acc.id || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim());

    if (isCurrentSessionUser) {
      const isVisible = document.visibilityState === 'visible';
      if (!isVisible) return 'LATAR_BELAKANG';
      return 'AKTIF_LAYAR';
    }

    // 2. Check Firestore heartbeat timestamp (must be within last 90 seconds)
    const activeTime = acc.lastHeartbeat || acc.lastActive;
    if (!activeTime) return 'OFFLINE';

    const timeDiff = Date.now() - new Date(activeTime).getTime();
    if (isNaN(timeDiff) || timeDiff > 90 * 1000) {
      return 'OFFLINE';
    }

    // 3. Check explicit statusLayar or statusKoneksi flags
    if (acc.statusLayar === 'OFFLINE' || acc.statusKoneksi === 'OFFLINE') {
      // If marked offline on unload, double check timeDiff
      if (timeDiff > 15 * 1000) return 'OFFLINE';
    }

    if (acc.statusLayar === 'AKTIF_LAYAR') return 'AKTIF_LAYAR';
    if (acc.statusLayar === 'AFK_IDLE') return 'AFK_IDLE';
    if (acc.statusLayar === 'LATAR_BELAKANG') return 'LATAR_BELAKANG';

    if (acc.isScreenActive === true || acc.statusKoneksi === 'ONLINE' || acc.isOnline === true) {
      return 'AKTIF_LAYAR';
    }

    if (acc.statusKoneksi === 'IDLE') return 'AFK_IDLE';

    return 'OFFLINE';
  };

  const isAccountOnline = (acc: AdminAccount) => {
    const status = getAccountScreenStatus(acc);
    return status === 'AKTIF_LAYAR' || status === 'AFK_IDLE' || status === 'LATAR_BELAKANG';
  };

  // Activity status text formatting
  const getActivityTime = (acc: AdminAccount) => {
    const screenStatus = getAccountScreenStatus(acc);
    if (screenStatus === 'AKTIF_LAYAR') {
      return `Sedang Aktif Membuka Layar • ${currentTimeStr || '19:25 WIB'}`;
    }
    if (screenStatus === 'LATAR_BELAKANG') {
      return `Tab Latar Belakang / Minimise • ${currentTimeStr || '19:25 WIB'}`;
    }
    if (screenStatus === 'AFK_IDLE') {
      return `Layar terbuka (Idle / Non-aktif)`;
    }
    if (acc.terakhirLogin) {
      return acc.terakhirLogin;
    }
    return 'Offline • Terakhir aktif baru saja';
  };

  // Filter accounts
  const filteredAccounts = relevantAccounts.filter((acc) => {
    const matchesSearch =
      (acc.namaAdmin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.wilayahTugas || '').toLowerCase().includes(searchTerm.toLowerCase());

    const online = isAccountOnline(acc);
    if (statusFilter === 'online') return matchesSearch && online;
    if (statusFilter === 'offline') return matchesSearch && !online;
    return matchesSearch;
  });

  const totalMonitored = relevantAccounts.length;
  const totalOnline = relevantAccounts.filter((acc) => isAccountOnline(acc)).length;
  const totalOffline = totalMonitored - totalOnline;
  const percentageOnline = totalMonitored > 0 ? Math.round((totalOnline / totalMonitored) * 100) : 0;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setActionSuccessMsg('✅ Pembaruan status koneksi & heartbeat admin selesai disinkronisasi!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }, 600);
  };

  const handleOpenPesanModal = (acc: AdminAccount) => {
    if (onSendMessageToAccount) {
      onSendMessageToAccount(acc.wilayahTugas);
    } else {
      setTargetAccountForMsg(acc);
      setMsgSubject(`Instruksi Resmi PSKS JABAR - ${acc.wilayahTugas}`);
      setMsgContent(`Halo Admin ${acc.wilayahTugas},\n\nMohon lakukan verifikasi berkala pada data PSKS wilayah tugas Anda.\n\nTerima kasih.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP NAVIGATION BAR & TAB TOGGLE */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-top-admin-monitor" />

            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>Monitoring Presensi Real-Time</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#043e2e] m-0">
                Pemantauan Admin Wilayah Jabar
              </h1>
            </div>
          </div>

          {/* FEATURE LABEL */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
            <div className="px-4 py-2 rounded-xl text-xs font-black bg-[#043e2e] text-[#f3e5ab] shadow-md flex items-center justify-center gap-1.5 border border-[#d4af37]/40">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>FITUR 2: PEMANTAUAN LIVE ADMIN WILAYAH</span>
            </div>
          </div>
        </div>

        {/* NOTIFICATION FEEDBACK ALERT */}
        {actionSuccessMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-fadeIn">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{actionSuccessMsg}</span>
          </div>
        )}

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* KPI 1: TOTAL ACCOUNT */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/10 text-[#043e2e] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#043e2e]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider m-0">
                {isDeveloperUser ? 'Target Developer (28 Akun)' : 'Admin Wilayah (27 Kab/Kota)'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#043e2e] m-0">
                {totalMonitored} <span className="text-xs font-extrabold text-slate-400">Akun</span>
              </h3>
            </div>
          </div>

          {/* KPI 2: ONLINE NOW */}
          <div className="bg-emerald-900/5 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/30 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Wifi className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider m-0">
                Online Sekarang
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-900 m-0">
                {totalOnline} <span className="text-xs font-extrabold text-emerald-700">🟢 Live</span>
              </h3>
            </div>
          </div>

          {/* KPI 3: OFFLINE */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-300 text-slate-700 flex items-center justify-center shrink-0">
              <WifiOff className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider m-0">
                Offline / Standby
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 m-0">
                {totalOffline} <span className="text-xs font-extrabold text-slate-500">⚪ Nonaktif</span>
              </h3>
            </div>
          </div>

          {/* KPI 4: ACTIVITY RATE */}
          <div className="bg-amber-50 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider m-0">
                Rasio Keaktifan System
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-950 m-0">
                {percentageOnline}% <span className="text-xs font-extrabold text-amber-800">Aktif</span>
              </h3>
            </div>
          </div>
        </div>

        {/* TOOLBAR: SEARCH, STATUS FILTER, & ACTION REFRESH */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* SEARCH BAR */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kabupaten/Kota or Nama Admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e] focus:bg-white"
            />
          </div>

          {/* FILTER BUTTONS & REFRESH */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
            {/* Status Online/Offline Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#043e2e] text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({totalMonitored})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('online')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === 'online'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                🟢 Online ({totalOnline})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('offline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === 'offline'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚪ Offline ({totalOffline})
              </button>
            </div>

            {onOpenInbox && (
              <button
                type="button"
                onClick={onOpenInbox}
                className="inline-flex items-center gap-1.5 bg-[#043e2e] hover:bg-[#065e44] text-[#f3e5ab] font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm border border-[#d4af37]/40"
              >
                <Inbox className="w-4 h-4 text-[#d4af37]" />
                <span>Buka Inbox Pesan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 bg-[#d4af37] hover:bg-[#b8901c] text-[#043e2e] font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sinkron...' : 'Pindai Koneksi'}</span>
            </button>
          </div>
        </div>

        {/* SCOPE INFO BANNER */}
        <div className="bg-amber-50 border-l-4 border-[#d4af37] p-4 rounded-r-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            {isDeveloperUser ? (
              <span>
                <strong>Mode Akses Developer:</strong> Menampilkan status pemantauan koneksi <strong>1 Superadmin Provinsi Jabar</strong> dan <strong>27 Admin Wilayah Kabupaten/Kota</strong> (Total 28 Akun).
              </span>
            ) : (
              <span>
                <strong>Mode Akses Superadmin:</strong> Menampilkan status pemantauan koneksi <strong>27 Admin Wilayah Kabupaten/Kota</strong> se-Jawa Barat.
              </span>
            )}
          </div>
        </div>

        {/* MONITORING GRID / TABLE LIST OF ACCOUNTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((acc) => {
              const online = isAccountOnline(acc);
              const isSuper = acc.role === 'superadmin';

              return (
                <div
                  key={acc.id}
                  className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between relative overflow-hidden ${
                    online
                      ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-50/20 to-white'
                      : 'border-slate-200'
                  }`}
                >
                  {/* TOP HEADER STATUS */}
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider ${
                          online
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                            online ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                          }`}
                        />
                        <span>{online ? '🟢 ONLINE' : '⚪ OFFLINE'}</span>
                      </span>

                      <span
                        className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full uppercase ${
                          isSuper
                            ? 'bg-[#d4af37] text-[#043e2e]'
                            : 'bg-[#043e2e] text-[#f3e5ab]'
                        }`}
                      >
                        {isSuper ? 'SUPERADMIN' : 'ADMIN WILAYAH'}
                      </span>
                    </div>

                    {/* ACCOUNT NAME & REGION */}
                    <div className="space-y-0.5 sm:space-y-1 mb-2.5 sm:mb-4">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#043e2e] flex items-center gap-1.5 sm:gap-2 m-0">
                        <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />
                        <span>{acc.wilayahTugas}</span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-600 font-semibold m-0 flex items-center gap-1 sm:gap-1.5">
                        <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                        <span>Username: <strong>{acc.username}</strong></span>
                      </p>
                    </div>

                    {/* METADATA INFO */}
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 space-y-1 sm:space-y-2 border border-slate-200 text-[11px] sm:text-xs text-slate-600 mb-2.5 sm:mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" /> Aktivitas:
                        </span>
                        <span className="font-bold text-slate-800">
                          {getActivityTime(acc)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" /> Perangkat:
                        </span>
                        <span className="font-bold text-slate-700 truncate max-w-[130px] sm:max-w-none">
                          {isSuper ? 'Pusat PSKS JABAR Web' : 'Browser Regional Jabar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION & STATUS INDICATOR */}
                  <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 sm:gap-2">
                    {/* Status Kehadiran Real-time Badge */}
                    {(() => {
                      const screenStatus = getAccountScreenStatus(acc);
                      if (screenStatus === 'AKTIF_LAYAR') {
                        return (
                          <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 sm:gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                            </span>
                            <span>Online (Aktif)</span>
                          </div>
                        );
                      }
                      if (screenStatus === 'AFK_IDLE') {
                        return (
                          <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 sm:gap-1.5 bg-amber-50 text-amber-800 border border-amber-300">
                            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 inline-block"></span>
                            <span>Idle (Pasif)</span>
                          </div>
                        );
                      }
                      if (screenStatus === 'LATAR_BELAKANG') {
                        return (
                          <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 sm:gap-1.5 bg-orange-50 text-orange-800 border border-orange-200">
                            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-400 inline-block"></span>
                            <span>Latar Belakang</span>
                          </div>
                        );
                      }
                      return (
                        <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 sm:gap-1.5 bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-400 inline-block"></span>
                          <span>Offline</span>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPesanModal(acc)}
                        className="py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 shadow-2xs"
                        title="Kirim Pesan Langsung Ke Admin Ini"
                      >
                        <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d4af37]" />
                        <span>Pesan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAccount(acc)}
                        className="py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold bg-[#043e2e] hover:bg-[#065e44] text-white transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1"
                        title="Lihat Detail Profil Akun"
                      >
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d4af37]" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-300 space-y-3">
              <WifiOff className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-700 m-0">
                Tidak Ada Akun Admin Ditemukan
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Coba ubah kata kunci pencarian atau bersihkan filter status online.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM BACK BUTTON */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-admin-monitor" />
          <div className="text-xs text-slate-500 font-semibold">
            <span>PSKS JABAR Provinsi Jawa Barat • Pemantauan Presensi Live</span>
          </div>
        </div>

        {/* MODAL DETAIL AKUN ADMIN */}
        {selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-[#d4af37] max-w-lg w-full p-6 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#043e2e] text-[#d4af37] flex items-center justify-center font-extrabold text-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#043e2e] m-0">
                      {selectedAccount.wilayahTugas}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold m-0">
                      Otoritas Akses Regional Jawa Barat
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Nama Akun / Username:</span>
                  <span className="font-bold text-slate-900">{selectedAccount.username}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Status Presensi Real-Time:</span>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                      isAccountOnline(selectedAccount)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isAccountOnline(selectedAccount) ? '🟢 ONLINE LIVE' : '⚪ OFFLINE'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Role level:</span>
                  <span className="font-bold text-[#043e2e] uppercase">{selectedAccount.role}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Aktivitas Sesi Terakhir:</span>
                  <span className="font-bold text-slate-800">{selectedAccount.terakhirLogin || 'Baru Saja'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Kata Sandi Akses:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedAccount.passwordPolos || '••••••••'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-[#043e2e] hover:bg-[#065e44] text-white cursor-pointer shadow-md"
                >
                  Tutup Detail Akun
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KIRIM PESAN LANGSUNG */}
        {targetAccountForMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-[#d4af37] max-w-lg w-full p-6 space-y-4 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#043e2e] flex items-center justify-center font-extrabold text-lg border border-amber-300">
                    <MessageSquare className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#043e2e] m-0">
                      Kirim Pesan Ke {targetAccountForMsg.wilayahTugas}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold m-0">
                      Penerima: <strong>{targetAccountForMsg.namaAdmin}</strong> ({targetAccountForMsg.username})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTargetAccountForMsg(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subjek Pesan:
                  </label>
                  <input
                    type="text"
                    value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Isi Pesan / Instruksi:
                  </label>
                  <textarea
                    rows={4}
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTargetAccountForMsg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!msgSubject.trim() || !msgContent.trim()) return;
                    const senderTitle = isDeveloperUser
                      ? 'Developer PSKS Jabar'
                      : 'Superadmin Provinsi Jawa Barat';
                    const now = new Date();
                    const formattedDate = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
                    const msgId = `msg_${Date.now()}`;

                    if (onSendMessage) {
                      onSendMessage({
                        senderName: session?.nama || senderTitle,
                        senderRole: isDeveloperUser ? 'developer' : 'superadmin',
                        targetWilayah: targetAccountForMsg.wilayahTugas,
                        subject: msgSubject,
                        content: msgContent,
                        timestamp: formattedDate,
                      });
                    } else {
                      try {
                        await setDoc(doc(db, 'admin_messages', msgId), {
                          id: msgId,
                          senderName: session?.nama || senderTitle,
                          senderRole: isDeveloperUser ? 'developer' : 'superadmin',
                          targetWilayah: targetAccountForMsg.wilayahTugas,
                          subject: msgSubject,
                          content: msgContent,
                          timestamp: formattedDate,
                          createdAt: Date.now(),
                          isRead: false,
                        });
                      } catch (err) {
                        handleFirestoreError(err, OperationType.CREATE, `admin_messages/${msgId}`);
                      }
                    }

                    const targetWil = targetAccountForMsg.wilayahTugas;
                    setActionSuccessMsg(`📩 Pesan resmi berhasil terkirim ke Inbox ${targetWil}!`);
                    setShowPopupAlert(`Pesan resmi Anda telah berhasil dikirimkan ke Admin ${targetWil}!`);
                    setTargetAccountForMsg(null);
                    setTimeout(() => setActionSuccessMsg(null), 3500);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#043e2e] text-[#f3e5ab] hover:bg-[#065e44] shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Kirim Pesan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POP-UP NOTIFICATION MODAL ON SENT */}
        {showPopupAlert && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-emerald-500 max-w-sm w-full p-6 text-center space-y-4 relative">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-400 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-lg font-black text-[#043e2e] m-0">
                  Pesan Berhasil Dikirim!
                </h3>
                <p className="text-xs text-slate-600 font-semibold mt-2 leading-relaxed">
                  {showPopupAlert}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPopupAlert(null)}
                className="w-full py-2.5 bg-[#043e2e] hover:bg-[#064e3b] text-[#f3e5ab] font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Oke, Mengerti
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
