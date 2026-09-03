import React, { useState, useMemo } from 'react';
import { AdminAccount, UserSession } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';
import { hashPassword } from '../utils/crypto';
import { BackToHomeButton } from './BackToHomeButton';
import { UserAccountAnalyticsChart } from './UserAccountAnalyticsChart';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  UserX,
  UserCheck,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface UserManagementPageProps {
  session?: UserSession;
  adminAccounts: AdminAccount[];
  onUpdateUserAccount: (updated: AdminAccount, securitySignal?: 'PASSWORD_CHANGED' | 'FROZEN' | 'UNFROZEN' | 'DELETED') => void;
  onDeleteUserAccount: (id: string, targetUsername?: string) => void;
  onBackToHome: () => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  session,
  adminAccounts,
  onUpdateUserAccount,
  onDeleteUserAccount,
  onBackToHome,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FROZEN'>('ALL');
  const [wilayahFilter, setWilayahFilter] = useState<string>('ALL');

  // Password Visibility Toggle State by Account ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Password Modal State
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editError, setEditError] = useState('');

  // Freeze/Unfreeze Modal State
  const [freezingAccount, setFreezingAccount] = useState<AdminAccount | null>(null);

  // Delete Modal State
  const [deletingAccount, setDeletingAccount] = useState<AdminAccount | null>(null);

  // Dedicated Success Action Popup Modal State
  const [actionSuccessModal, setActionSuccessModal] = useState<{
    type: 'PASSWORD' | 'FREEZE' | 'UNFREEZE' | 'DELETE';
    title: string;
    message: string;
    username: string;
  } | null>(null);

  // Filter only accounts with role === 'user' (Strictly Registered Users Only, 100% Excludes Guests / Tamu Publik)
  const userAccounts = useMemo(() => {
    return adminAccounts.filter((acc) => {
      const r = (acc.role || '').toLowerCase().trim();
      const u = (acc.username || '').toLowerCase().trim();
      const n = (acc.namaAdmin || '').toLowerCase().trim();

      // 1. STRICT EXCLUSION: Tamu Publik / Guest / Pengunjung
      if (
        r === 'guest' ||
        r === 'tamu' ||
        u === 'tamu' ||
        u === 'tamu publik' ||
        u.includes('guest') ||
        n.includes('tamu publik') ||
        n.includes('pengunjung') ||
        acc.isGuest === true ||
        acc.statusActive === 'GUEST'
      ) {
        return false;
      }

      // 2. STRICT EXCLUSION: Developer, Superadmin, and Admin Wilayah
      if (
        r === 'developer' ||
        r === 'superadmin' ||
        r === 'admin' ||
        u === 'ilhamfazril' ||
        u === 'admin_ilham' ||
        u.includes('superadmin') ||
        u.startsWith('admin_') ||
        acc.isDeveloper === true
      ) {
        return false;
      }

      // 3. Must be role 'user' or registered user account
      return r === 'user' || acc.statusActive === 'SAH_TERDAFTAR';
    });
  }, [adminAccounts]);

  // Filtered & Searched Users
  const filteredUsers = useMemo(() => {
    return userAccounts.filter((user) => {
      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (user.username || '').toLowerCase().includes(q) ||
        (user.namaAdmin || '').toLowerCase().includes(q) ||
        (user.wilayahTugas || '').toLowerCase().includes(q);

      // Status filter
      const isFrozen = user.isFrozen === true || user.statusAkun === 'DIBEKUKAN';
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !isFrozen) ||
        (statusFilter === 'FROZEN' && isFrozen);

      // Wilayah filter
      const matchWilayah =
        wilayahFilter === 'ALL' ||
        (user.wilayahTugas || '').toLowerCase() === wilayahFilter.toLowerCase();

      return matchSearch && matchStatus && matchWilayah;
    });
  }, [userAccounts, searchQuery, statusFilter, wilayahFilter]);

  // Metric stats
  const totalCount = userAccounts.length;
  const activeCount = userAccounts.filter(
    (u) => !u.isFrozen && u.statusAkun !== 'DIBEKUKAN'
  ).length;
  const frozenCount = userAccounts.filter(
    (u) => u.isFrozen === true || u.statusAkun === 'DIBEKUKAN'
  ).length;
  const uniqueWilayahCount = useMemo(() => {
    const set = new Set(userAccounts.map((u) => u.wilayahTugas).filter(Boolean));
    return set.size;
  }, [userAccounts]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyPassword = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  // 1. EDIT PASSWORD ACTION
  const handleOpenEditPassword = (account: AdminAccount) => {
    setEditingAccount(account);
    setNewPassword(account.passwordPolos || '');
    setShowNewPassword(false);
    setEditError('');
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const pTrim = newPassword.trim();
    if (!pTrim) {
      setEditError('Kata sandi tidak boleh kosong!');
      return;
    }
    if (pTrim.length < 8) {
      setEditError('Kata sandi minimal harus 8 karakter!');
      return;
    }

    const hasUpper = /[A-Z]/.test(pTrim);
    const hasLower = /[a-z]/.test(pTrim);
    const hasNum = /[0-9]/.test(pTrim);

    if (!hasUpper || !hasLower || !hasNum) {
      setEditError('Kata sandi wajib kombinasi campuran huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9)!');
      return;
    }

    const updatedAccount: AdminAccount = {
      ...editingAccount,
      passwordPolos: pTrim,
      passwordHash: hashPassword(pTrim),
      lastUpdatedTimestamp: Date.now(),
    };

    const targetUname = editingAccount.username;
    onUpdateUserAccount(updatedAccount, 'PASSWORD_CHANGED');
    setEditingAccount(null);

    setActionSuccessModal({
      type: 'PASSWORD',
      title: 'Kata Sandi Berhasil Diperbarui!',
      message: `Kata sandi untuk akun "${targetUname}" telah berhasil diubah. Korban/pengguna target seketika menerima notifikasi darurat dan ditendang keluar secara realtime detik ini juga.`,
      username: targetUname,
    });
  };

  // 2. FREEZE / UNFREEZE ACTION
  const handleToggleFreeze = (account: AdminAccount) => {
    setFreezingAccount(account);
  };

  const handleConfirmToggleFreeze = () => {
    if (!freezingAccount) return;
    const currentFrozen = freezingAccount.isFrozen === true || freezingAccount.statusAkun === 'DIBEKUKAN';
    const nextFrozen = !currentFrozen;

    const updatedAccount: AdminAccount = {
      ...freezingAccount,
      isFrozen: nextFrozen,
      statusAkun: nextFrozen ? 'DIBEKUKAN' : 'AKTIF',
      lastUpdatedTimestamp: Date.now(),
    };

    const targetUname = freezingAccount.username;
    onUpdateUserAccount(updatedAccount, nextFrozen ? 'FROZEN' : 'UNFROZEN');
    setFreezingAccount(null);

    setActionSuccessModal({
      type: nextFrozen ? 'FREEZE' : 'UNFREEZE',
      title: nextFrozen ? 'Akun Berhasil Dibekukan!' : 'Pembekuan Berhasil Dibuka!',
      message: nextFrozen
        ? `Akun "${targetUname}" telah resmi DIBEKUKAN. Korban seketika menerima sensor getar tut-tut-tut dan langsung ditendang keluar secara realtime tanpa perlu refresh.`
        : `Pembekuan akun "${targetUname}" telah DIBUKA KEMBALI. Akun kini aktif dan dapat masuk kembali ke portal PSKS Jabar.`,
      username: targetUname,
    });
  };

  // 3. DELETE USER ACCOUNT ACTION
  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    const targetUname = deletingAccount.username;
    const targetId = deletingAccount.id;
    onDeleteUserAccount(targetId, targetUname);
    setDeletingAccount(null);

    setActionSuccessModal({
      type: 'DELETE',
      title: 'Akun Berhasil Dihapus Permanen!',
      message: `Akun "${targetUname}" telah berhasil dihapus secara permanen dari database. Korban seketika menerima peringatan darurat sensor getar dan langsung ditendang keluar secara realtime.`,
      username: targetUname,
    });
  };

  return (
    <div id="user-management-page" className="min-h-[85vh] bg-slate-50 py-6 px-3 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP NAVIGATION & ACCESS BADGE */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-top-user-manage" />

          <div className="flex items-center gap-2 bg-blue-950/10 border border-blue-800/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Kredensial & Otorisasi: Fitur 5 (Akun User)</span>
          </div>
        </div>

        {/* HERO BANNER CARD */}
        <div className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#043e2e] border border-[#d4af37]/60 px-3 py-1 rounded-full text-[11px] font-black text-[#d4af37]">
              <Users className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>FITUR 5 • MANAJEMEN AKUN USER</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
              Pusat Data & Kontrol Akun User
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-3xl leading-relaxed">
              Monitoring seluruh akun pengguna (User) yang terdaftar di PSKS Jabar. Anda dapat melihat informasi akun, memperbarui kata sandi, mengaktifkan/membekukan akses otentikasi, atau menghapus akun secara permanen.
            </p>
          </div>
        </div>

        {/* 4 STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black shrink-0 border border-blue-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Akun User
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {totalCount} <span className="text-xs font-semibold text-slate-400">Akun</span>
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0 border border-emerald-200">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status Aktif
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                {activeCount} <span className="text-xs font-semibold text-slate-400">Akun</span>
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-rose-200 p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-black shrink-0 border border-rose-200">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Dibekukan
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5">
                {frozenCount} <span className="text-xs font-semibold text-slate-400">Akun</span>
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black shrink-0 border border-amber-200">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Wilayah Tersebar
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">
                {uniqueWilayahCount} <span className="text-xs font-semibold text-slate-400">Kab/Kota</span>
              </h3>
            </div>
          </div>

        </div>

        {/* GRAFIK ANALISIS AKUN USER (SUPERADMIN & DEVELOPER) */}
        <UserAccountAnalyticsChart
          userAccounts={userAccounts}
          allAdminAccounts={adminAccounts}
          selectedWilayah={wilayahFilter}
          onSelectWilayah={(wil) => setWilayahFilter(wil)}
          selectedStatus={statusFilter}
          onSelectStatus={(status) => setStatusFilter(status)}
        />

        {/* SEARCH, FILTER & TOOLBAR */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Username, Nama, atau Wilayah..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#043e2e] focus:outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">Status:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-[#043e2e] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aktif ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('FROZEN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'FROZEN'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dibekukan ({frozenCount})
                </button>
              </div>
            </div>

            {/* Filter Wilayah Dropdown */}
            <div className="w-full md:w-56">
              <select
                value={wilayahFilter}
                onChange={(e) => setWilayahFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua 27 Wilayah</option>
                {KAB_KOTA_ONLY.map((wil) => (
                  <option key={wil} value={wil}>
                    {wil}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#043e2e] to-slate-900 text-white border-b-2 border-[#d4af37] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d4af37] text-[#043e2e] font-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Daftar Akun User Terdaftar
                </h3>
                <p className="text-xs text-emerald-200/90 font-medium">
                  Menampilkan {filteredUsers.length} dari total {totalCount} akun terdaftar
                </p>
              </div>
            </div>

            <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              Sinkronisasi Realtime Firestore
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-700">
                {totalCount === 0
                  ? 'Belum Ada Akun User Terdaftar'
                  : 'Tidak Ada Akun yang Sesuai Filter'}
              </h4>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                {totalCount === 0
                  ? 'Pengguna publik yang mendaftar melalui Smart Gate akan otomatis tercatat di tabel ini secara realtime.'
                  : 'Silakan ubah kata kunci pencarian atau reset filter untuk menampilkan akun user lainnya.'}
              </p>
              {totalCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setWilayahFilter('ALL');
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-4">Username & Profil</th>
                    <th className="py-3.5 px-4">Password</th>
                    <th className="py-3.5 px-4">Wilayah Domisili</th>
                    <th className="py-3.5 px-4">Waktu Daftar / Login</th>
                    <th className="py-3.5 px-4 text-center">Status Akun</th>
                    <th className="py-3.5 px-4 text-center w-48">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-medium">
                  {filteredUsers.map((user, idx) => {
                    const isFrozen = user.isFrozen === true || user.statusAkun === 'DIBEKUKAN';
                    const isPassVisible = visiblePasswords[user.id] || false;
                    const plainPass = user.passwordPolos || '********';

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isFrozen ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        {/* Username & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                              isFrozen
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-[#043e2e] text-amber-300'
                            }`}>
                              {(user.username || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm">
                                {user.username}
                              </div>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                USER TERDAFTAR
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Password with Reveal & Copy */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <code className="font-mono text-xs font-bold text-slate-800">
                              {isPassVisible ? plainPass : '••••••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                              title={isPassVisible ? 'Sembunyikan Password' : 'Lihat Password'}
                            >
                              {isPassVisible ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(user.id, plainPass)}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Salin Password"
                            >
                              {copiedId === user.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Wilayah */}
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#043e2e] px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{user.wilayahTugas || 'Jawa Barat'}</span>
                          </div>
                        </td>

                        {/* Terakhir Login / Waktu Daftar */}
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.terakhirLogin || 'Baru terdaftar'}</span>
                          </div>
                        </td>

                        {/* Status Akun */}
                        <td className="py-3.5 px-4 text-center">
                          {isFrozen ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <Lock className="w-3 h-3 text-rose-700" />
                              <span>Dibekukan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Aktif</span>
                            </span>
                          )}
                        </td>

                        {/* 3 Action Buttons: Edit Password, Bekukan/Buka, Hapus */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Tombol 1: Edit Password */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditPassword(user)}
                              className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="Edit Password Akun"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              <span>Edit Pass</span>
                            </button>

                            {/* Tombol 2: Bekukan / Buka Bekukan */}
                            <button
                              type="button"
                              onClick={() => handleToggleFreeze(user)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                                isFrozen
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-300'
                              }`}
                              title={isFrozen ? 'Buka Pembekuan Akun' : 'Bekukan Akses Akun'}
                            >
                              {isFrozen ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Buka</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-indigo-700" />
                                  <span>Bekukan</span>
                                </>
                              )}
                            </button>

                            {/* Tombol 3: Hapus Akun */}
                            <button
                              type="button"
                              onClick={() => setDeletingAccount(user)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all shadow-xs cursor-pointer"
                              title="Hapus Akun User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* BUTTON KEMBALI KE BERANDA - POJOK KIRI BAWAH */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 pb-6">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-user-manage" />
          <div className="text-xs text-slate-500 font-semibold">
            <span>PSKS JABAR Provinsi Jawa Barat • Manajemen Akun User</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PASSWORD */}
      {/* ========================================================================= */}
      {editingAccount && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#d4af37] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#043e2e] text-amber-300 font-black">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Edit Password User
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Akun: <strong>{editingAccount.username}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#043e2e] uppercase mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setEditError('');
                    }}
                    placeholder="Masukkan kata sandi baru (min 8 karakter)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-[#043e2e] focus:outline-none text-xs font-bold text-slate-900"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showNewPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password criteria chips */}
              <div className="grid grid-cols-3 gap-1.5 text-[8.5px] font-black">
                <div className={`p-1.5 rounded-lg text-center border ${
                  newPassword.length >= 8 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {newPassword.length >= 8 ? '✓' : '•'} 8+ Karakter
                </div>
                <div className={`p-1.5 rounded-lg text-center border ${
                  /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? '✓' : '•'} Huruf Besar & Kecil
                </div>
                <div className={`p-1.5 rounded-lg text-center border ${
                  /[0-9]/.test(newPassword) ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {/[0-9]/.test(newPassword) ? '✓' : '•'} Angka 0-9
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 text-xs font-black shadow-md transition-all cursor-pointer border border-[#d4af37]/40"
                >
                  Simpan Password Baru
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BEKUKAN / BUKA PEMBEKUAN AKUN */}
      {/* ========================================================================= */}
      {freezingAccount && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                freezingAccount.isFrozen || freezingAccount.statusAkun === 'DIBEKUKAN'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {freezingAccount.isFrozen || freezingAccount.statusAkun === 'DIBEKUKAN' ? (
                  <Unlock className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {freezingAccount.isFrozen || freezingAccount.statusAkun === 'DIBEKUKAN'
                    ? 'Buka Pembekuan Akun?'
                    : 'Bekukan Akses Akun User?'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Username: <strong>{freezingAccount.username}</strong> ({freezingAccount.wilayahTugas})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {freezingAccount.isFrozen || freezingAccount.statusAkun === 'DIBEKUKAN'
                ? 'Membuka pembekuan akan mengizinkan pengguna ini untuk masuk dan menggunakan portal PSKS Jabar kembali.'
                : 'Membekukan akun akan menolak otentikasi login pengguna ini secara otomatis hingga status dibuka kembali oleh Superadmin/Developer.'}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFreezingAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleFreeze}
                className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer ${
                  freezingAccount.isFrozen || freezingAccount.statusAkun === 'DIBEKUKAN'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {freezingAccount.isFrozen || freezingAccount.statusAkun === 'DIBEKUKAN'
                  ? 'Ya, Buka Pembekuan'
                  : 'Ya, Bekukan Akun'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HAPUS AKUN PERMANEN */}
      {/* ========================================================================= */}
      {deletingAccount && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-rose-500 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">
                  Hapus Akun User Permanen?
                </h3>
                <p className="text-xs text-rose-700 font-semibold">
                  Username: <strong>{deletingAccount.username}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-medium">
              ⚠️ <strong>Peringatan:</strong> Akun ini akan dihapus secara permanen dari database Firestore dan cache lokal. Tindakan ini tidak dapat dibatalkan.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Hapus Akun Sekarang
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: POP UP BERHASIL (SUCCESS ACTION MODAL) */}
      {/* ========================================================================= */}
      {actionSuccessModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#043e2e] max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-center animate-scaleUp">
            
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {actionSuccessModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {actionSuccessModal.message}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Target Sesi: <strong>{actionSuccessModal.username}</strong> terputus secara realtime.</span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActionSuccessModal(null)}
                className="w-full py-3 px-4 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 text-sm font-black shadow-lg transition-all cursor-pointer border border-[#d4af37]/40"
              >
                Mengerti & Selesai
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
