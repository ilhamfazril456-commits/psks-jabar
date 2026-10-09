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
  XCircle,
  CheckCircle,
  FileCheck,
  FileX,
  Radio,
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
  const [vervalFilter, setVervalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
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

  // Verval Approval Modal State (Pop Up Konfirmasi Penerimaan Akun)
  const [approvingAccount, setApprovingAccount] = useState<AdminAccount | null>(null);

  // Verval Rejection Modal State
  const [rejectingAccount, setRejectingAccount] = useState<AdminAccount | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Data wilayah domisili tidak sesuai');
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('');

  // Dedicated Success Action Popup Modal State
  const [actionSuccessModal, setActionSuccessModal] = useState<{
    type: 'PASSWORD' | 'FREEZE' | 'UNFREEZE' | 'DELETE' | 'VERVAL_APPROVE' | 'VERVAL_REJECT';
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

      // 3. Must be role 'user' or registered user account or pending verval
      return (
        r === 'user' ||
        acc.statusActive === 'SAH_TERDAFTAR' ||
        acc.statusVerval === 'MENUNGGU_VERIFIKASI' ||
        acc.statusActive === 'PENDING_VERIFIKASI' ||
        acc.statusVerval === 'DITOLAK'
      );
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
        (user.wilayahTugas || '').toLowerCase().includes(q) ||
        (user.noRegistrasi || '').toLowerCase().includes(q);

      // Status Verval Filter
      const isPending = user.statusVerval === 'MENUNGGU_VERIFIKASI' || user.statusActive === 'PENDING_VERIFIKASI';
      const isApproved = user.statusVerval === 'DISETUJUI' || (!user.statusVerval && user.statusActive === 'SAH_TERDAFTAR');
      const isRejected = user.statusVerval === 'DITOLAK' || user.statusActive === 'DITOLAK';

      let matchVerval = true;
      if (vervalFilter === 'PENDING') matchVerval = isPending;
      else if (vervalFilter === 'APPROVED') matchVerval = isApproved;
      else if (vervalFilter === 'REJECTED') matchVerval = isRejected;

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

      return matchSearch && matchVerval && matchStatus && matchWilayah;
    });
  }, [userAccounts, searchQuery, vervalFilter, statusFilter, wilayahFilter]);

  // Metric stats
  const totalCount = userAccounts.length;
  const pendingVervalCount = userAccounts.filter(
    (u) => u.statusVerval === 'MENUNGGU_VERIFIKASI' || u.statusActive === 'PENDING_VERIFIKASI'
  ).length;
  const approvedCount = userAccounts.filter(
    (u) => u.statusVerval === 'DISETUJUI' || (!u.statusVerval && u.statusActive === 'SAH_TERDAFTAR')
  ).length;
  const rejectedCount = userAccounts.filter(
    (u) => u.statusVerval === 'DITOLAK' || u.statusActive === 'DITOLAK'
  ).length;
  const activeCount = userAccounts.filter(
    (u) => !u.isFrozen && u.statusAkun !== 'DIBEKUKAN' && (u.statusVerval === 'DISETUJUI' || u.statusActive === 'SAH_TERDAFTAR' || !u.statusVerval)
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
      message: `Akun "${targetUname}" telah berhasil dihapus secara permanen dari database. Pengguna seketika menerima peringatan darurat dan langsung ditendang keluar secara realtime.`,
      username: targetUname,
    });
  };

  // 4. VERVAL ACTION: BUKA POP UP KONFIRMASI TERIMA PENDAFTARAN
  const handleOpenApproveModal = (account: AdminAccount) => {
    setApprovingAccount(account);
  };

  const handleConfirmApprove = () => {
    if (!approvingAccount) return;
    const account = approvingAccount;
    const updatedAccount: AdminAccount = {
      ...account,
      statusVerval: 'DISETUJUI',
      statusActive: 'SAH_TERDAFTAR',
      statusAkun: 'AKTIF',
      isFrozen: false,
      vervalAt: Date.now(),
      vervalBy: session?.nama || session?.username || 'Superadmin Jabar',
      lastUpdatedTimestamp: Date.now(),
    };

    onUpdateUserAccount(updatedAccount);
    setApprovingAccount(null);

    setActionSuccessModal({
      type: 'VERVAL_APPROVE',
      title: 'Akun User Berhasil Disetujui!',
      message: `Pendaftaran akun "${account.username}" (${account.wilayahTugas}) telah BERHASIL DISETUJUI & DISAHKAN. Pengguna terkait kini sah terdaftar dan layar pendaftaran pengguna seketika berubah realtime detik ini juga.`,
      username: account.username,
    });
  };

  // 5. VERVAL ACTION: BUKA MODAL TOLAK PENDAFTARAN
  const handleOpenRejectModal = (account: AdminAccount) => {
    setRejectingAccount(account);
    setRejectionReason('Data wilayah domisili tidak sesuai');
    setCustomRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingAccount) return;
    const finalReason =
      rejectionReason === 'LAINNYA'
        ? customRejectionReason.trim() || 'Data pendaftaran belum memenuhi kriteria persyaratan'
        : rejectionReason;

    const updatedAccount: AdminAccount = {
      ...rejectingAccount,
      statusVerval: 'DITOLAK',
      statusActive: 'DITOLAK',
      alasanPenolakan: finalReason,
      vervalAt: Date.now(),
      vervalBy: session?.nama || session?.username || 'Superadmin Jabar',
      lastUpdatedTimestamp: Date.now(),
    };

    const targetUname = rejectingAccount.username;
    onUpdateUserAccount(updatedAccount);
    setRejectingAccount(null);

    setActionSuccessModal({
      type: 'VERVAL_REJECT',
      title: 'Pendaftaran Akun Telah Ditolak',
      message: `Pendaftaran akun "${targetUname}" telah DITOLAK dengan alasan: "${finalReason}". Status penolakan seketika terkirim secara realtime ke halaman pendaftaran pengguna yang bersangkutan.`,
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
            <span>Otoritas Superadmin: Verval Akun User</span>
          </div>
        </div>

        {/* HERO BANNER CARD */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0f2b5c] to-slate-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#0f2b5c] border border-[#d4af37]/60 px-3 py-1 rounded-full text-[11px] font-black text-[#d4af37]">
              <Users className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>FITUR 2 • VERVAL AKUN USER</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
              Pusat Otoritas & Verval Akun User
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-3xl leading-relaxed">
              Verifikasi dan validasi pendaftaran akun pengguna (User) baru se-Jawa Barat secara realtime. Anda dapat menyortir akun yang membutuhkan verifikasi (Terima/Tolak), mengelola akun yang sudah disetujui (Ganti Sandi, Bekukan, Hapus), serta memantau sebaran wilayah pendaftar.
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

          {/* Menunggu Verval Card with Attention Indicator */}
          <div className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 transition-all ${
            pendingVervalCount > 0 ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-300/40' : 'border-slate-200'
          }`}>
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black shrink-0 border relative ${
              pendingVervalCount > 0 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <Clock className="w-6 h-6" />
              {pendingVervalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>Menunggu Verval</span>
                {pendingVervalCount > 0 && (
                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-black">
                    PERLU TINDAKAN
                  </span>
                )}
              </p>
              <h3 className={`text-xl sm:text-2xl font-black mt-0.5 ${
                pendingVervalCount > 0 ? 'text-amber-700' : 'text-slate-700'
              }`}>
                {pendingVervalCount} <span className="text-xs font-semibold text-slate-400">Pengajuan</span>
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Disetujui / Sah
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                {approvedCount} <span className="text-xs font-semibold text-slate-400">Akun</span>
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

        {/* SORTIR VERVAL & SEARCH TOOLBAR */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* BARIS 1: TOMBOL SORTIR VERVAL (Fitur Utama Verval Sesuai Permintaan User) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Sortir Status Verifikasi & Validasi (Verval):</span>
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setVervalFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  vervalFilter === 'ALL'
                    ? 'bg-[#0f2b5c] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>Semua Akun</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  vervalFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVervalFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  vervalFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-md'
                    : pendingVervalCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 animate-pulse'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Menunggu Verval</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  vervalFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-300 text-amber-950'
                }`}>
                  {pendingVervalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVervalFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  vervalFilter === 'APPROVED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Sudah Terdaftar (Sah)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  vervalFilter === 'APPROVED' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {approvedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVervalFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  vervalFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>Ditolak</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  vervalFilter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                  {rejectedCount}
                </span>
              </button>
            </div>
          </div>

          {/* BARIS 2: PENCARIAN, FILTER STATUS AKTIF, & FILTER WILAYAH */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Username, No Registrasi, atau Wilayah..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0f2b5c] focus:outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white transition-all shadow-inner"
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

            {/* Filter Status Aktif */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">Status Akun:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-[#0f2b5c] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
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
                  Aktif
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
                  Dibekukan
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
          
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0f2b5c] to-slate-900 text-white border-b-2 border-[#d4af37] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d4af37] text-[#0f2b5c] font-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Daftar Verval & Akun User Terdaftar
                </h3>
                <p className="text-xs text-emerald-200/90 font-medium">
                  Menampilkan {filteredUsers.length} dari total {totalCount} akun terdaftar
                </p>
              </div>
            </div>

            <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              Sinkronisasi Realtime Supabase
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
                    <th className="py-3.5 px-4">Username & Data Akun</th>
                    <th className="py-3.5 px-4">Password</th>
                    <th className="py-3.5 px-4">Wilayah Domisili</th>
                    <th className="py-3.5 px-4">Waktu Pendaftaran</th>
                    <th className="py-3.5 px-4 text-center">Status Verval</th>
                    <th className="py-3.5 px-4 text-center w-56">Aksi Verval & Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-medium">
                  {filteredUsers.map((user, idx) => {
                    const isPending = user.statusVerval === 'MENUNGGU_VERIFIKASI' || user.statusActive === 'PENDING_VERIFIKASI';
                    const isRejected = user.statusVerval === 'DITOLAK' || user.statusActive === 'DITOLAK';
                    const isApproved = user.statusVerval === 'DISETUJUI' || (!user.statusVerval && user.statusActive === 'SAH_TERDAFTAR');
                    const isFrozen = user.isFrozen === true || user.statusAkun === 'DIBEKUKAN';
                    const isPassVisible = visiblePasswords[user.id] || false;
                    const plainPass = user.passwordPolos || '********';

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${
                          isPending
                            ? 'bg-amber-50/60 hover:bg-amber-100/50 border-l-4 border-l-amber-500'
                            : isRejected
                            ? 'bg-rose-50/40 hover:bg-rose-100/40'
                            : isFrozen
                            ? 'bg-rose-50/30 hover:bg-rose-100/30'
                            : 'hover:bg-slate-50/80'
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
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isFrozen
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-[#0f2b5c] text-amber-300'
                            }`}>
                              {(user.username || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                                <span>{user.username}</span>
                                {isPending && (
                                  <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">
                                    Menunggu Verval
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                                    : isApproved
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {user.noRegistrasi || (isPending ? 'Tiket: REG-USER' : 'USER TERDAFTAR')}
                                </span>
                              </div>
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
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0f2b5c] px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{user.wilayahTugas || 'Jawa Barat'}</span>
                          </div>
                        </td>

                        {/* Terakhir Login / Waktu Daftar */}
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{user.tanggalPendaftaranFormatted || user.waktuPendaftaran || user.terakhirLogin || 'Baru mendaftar'}</span>
                            </div>
                            {user.registeredIp && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                IP: {user.registeredIp}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Verval & Keaktifan */}
                        <td className="py-3.5 px-4 text-center">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-400 shadow-xs animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Menunggu Verval</span>
                            </span>
                          ) : isRejected ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                <XCircle className="w-3 h-3 text-rose-700" />
                                <span>Ditolak</span>
                              </span>
                              {user.alasanPenolakan && (
                                <span className="text-[9.5px] text-rose-600 font-medium max-w-[130px] truncate mt-0.5" title={user.alasanPenolakan}>
                                  {user.alasanPenolakan}
                                </span>
                              )}
                            </div>
                          ) : isFrozen ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <Lock className="w-3 h-3 text-rose-700" />
                              <span>Dibekukan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Terverifikasi (Sah)</span>
                            </span>
                          )}
                        </td>

                        {/* Aksi Verval & Kontrol Akun */}
                        <td className="py-3.5 px-4 text-center">
                          {isPending ? (
                            /* JALUR AKSI KHUSUS USER BARU MENDAFTAR: TOMBOL TERIMA & TOLAK SECARA REALTIME */
                            <div className="flex items-center justify-center gap-1.5">
                              {/* TOMBOL TERIMA (APPROVE) */}
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(user)}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 border border-emerald-700"
                                title="Terima dan Sahkan Pendaftaran Akun User"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                <span>Terima</span>
                              </button>

                              {/* TOMBOL TOLAK (REJECT) */}
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(user)}
                                className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 border border-rose-700"
                                title="Tolak Pendaftaran Akun User"
                              >
                                <XCircle className="w-3.5 h-3.5 text-white" />
                                <span>Tolak</span>
                              </button>

                              {/* TOMBOL HAPUS */}
                              <button
                                type="button"
                                onClick={() => setDeletingAccount(user)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 border border-slate-200 transition-all shadow-2xs cursor-pointer"
                                title="Hapus Pengajuan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isRejected ? (
                            /* AKSI UNTUK AKUN DITOLAK: TERIMA ULANG ATAU HAPUS */
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(user)}
                                className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                title="Terima Ulang Pendaftaran"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Terima Ulang</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingAccount(user)}
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all shadow-xs cursor-pointer"
                                title="Hapus Permanen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            /* JALUR AKSI AKUN YANG SUDAH TERDAFTAR DAN DISETUJUI: 3 TOMBOL AKSI LENGKAP DIPERTAHANKAN (EDIT, BEKUKAN, HAPUS) */
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
                          )}
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
                <div className="p-2 rounded-xl bg-[#0f2b5c] text-amber-300 font-black">
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
                <label className="block text-xs font-black text-[#0f2b5c] uppercase mb-1">
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
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-[#0f2b5c] focus:outline-none text-xs font-bold text-slate-900"
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
                  className="px-5 py-2 rounded-xl bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 text-xs font-black shadow-md transition-all cursor-pointer border border-[#d4af37]/40"
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
              ⚠️ <strong>Peringatan:</strong> Akun ini akan dihapus secara permanen dari database Supabase dan cache lokal. Tindakan ini tidak dapat dibatalkan.
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
      {/* MODAL 4B: KONFIRMASI TERIMA PENDAFTARAN AKUN USER (VERVAL APPROVE POP UP) */}
      {/* ========================================================================= */}
      {approvingAccount && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-emerald-500 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 font-black shadow-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Apakah Anda Yakin Ingin Menerima Akun Ini?
                  </h3>
                  <p className="text-xs text-emerald-800 font-bold">
                    Konfirmasi Pengesahan Pendaftaran Akun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingAccount(null)}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* DETAIL DATA CALON PENGGUNA */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Username:</span>
                <span className="font-black text-slate-900 font-mono text-sm">{approvingAccount.username}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Wilayah Tugas:</span>
                <span className="font-bold text-slate-800">{approvingAccount.wilayahTugas || 'Jawa Barat'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold uppercase text-[10px]">No. Registrasi:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {approvingAccount.noRegistrasi || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Waktu Pengajuan:</span>
                <span className="font-medium text-slate-700">
                  {approvingAccount.tanggalPendaftaranFormatted || (approvingAccount.waktuPendaftaran ? new Date(approvingAccount.waktuPendaftaran).toLocaleString('id-ID') : 'Baru Saja')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed">
              ✅ <strong>Konfirmasi Realtime:</strong> Dengan menyetujui, akun ini akan sah terdaftar dan langsung dapat digunakan login. Layar perangkat pendaftar akan <strong>seketika berubah menjadi Disetujui</strong> secara realtime detik ini juga.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setApprovingAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Terima & Sahkan Akun</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TOLAK PENDAFTARAN AKUN USER (VERVAL REJECT MODAL) */}
      {/* ========================================================================= */}
      {rejectingAccount && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-rose-500 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 font-black shadow-xs">
                  <XCircle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Apakah Anda Yakin Ingin Menolak Akun Ini?
                  </h3>
                  <p className="text-xs text-rose-700 font-semibold">
                    Akun: <strong>{rejectingAccount.username}</strong> ({rejectingAccount.wilayahTugas})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingAccount(null)}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700 uppercase">
                Pilih Alasan Penolakan:
              </label>

              <div className="space-y-1.5 text-xs font-semibold">
                {[
                  'Data wilayah domisili tidak sesuai',
                  'Format identitas / username tidak valid',
                  'Akun duplikat atau sudah terdaftar sebelumnya',
                  'Tidak terkonfirmasi dalam pilar PSKS daerah',
                  'LAINNYA',
                ].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      rejectionReason === opt
                        ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={opt}
                      checked={rejectionReason === opt}
                      onChange={() => setRejectionReason(opt)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>{opt === 'LAINNYA' ? 'Alasan Lainnya (Ketik Manual)' : opt}</span>
                  </label>
                ))}
              </div>

              {rejectionReason === 'LAINNYA' && (
                <div className="pt-1">
                  <textarea
                    rows={2}
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Tuliskan alasan penolakan secara spesifik..."
                    className="w-full p-2.5 text-xs font-medium border border-rose-300 rounded-xl focus:outline-none focus:border-rose-500 bg-rose-50/30"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 font-medium leading-relaxed">
              ⚠️ <strong>Pemberitahuan Realtime:</strong> Status penolakan beserta alasan ini akan seketika terkirim ke layar pendaftaran calon pengguna secara realtime detik ini juga. Pengguna dapat membaca alasan dan disediakan tombol <strong>Daftar Ulang</strong>.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>Ya, Tolak Pendaftaran</span>
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
          <div className="bg-white rounded-3xl border-2 border-[#0f2b5c] max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-center animate-scaleUp">
            
            <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center shadow-lg animate-bounce ${
              actionSuccessModal.type === 'VERVAL_REJECT' || actionSuccessModal.type === 'FREEZE' || actionSuccessModal.type === 'DELETE'
                ? 'bg-rose-100 border-rose-500 text-rose-700'
                : 'bg-emerald-100 border-emerald-500 text-emerald-700'
            }`}>
              {actionSuccessModal.type === 'VERVAL_REJECT' ? (
                <XCircle className="w-9 h-9" />
              ) : (
                <CheckCircle2 className="w-9 h-9" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {actionSuccessModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {actionSuccessModal.message}
              </p>
            </div>

            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
              actionSuccessModal.type === 'VERVAL_APPROVE'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : actionSuccessModal.type === 'VERVAL_REJECT'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {actionSuccessModal.type === 'VERVAL_APPROVE'
                  ? `Akun [${actionSuccessModal.username}] telah SAH dan dapat langsung login.`
                  : actionSuccessModal.type === 'VERVAL_REJECT'
                  ? `Status penolakan [${actionSuccessModal.username}] terkirim realtime ke user.`
                  : `Target Sesi: [${actionSuccessModal.username}] diperbarui secara realtime.`}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActionSuccessModal(null)}
                className="w-full py-3 px-4 rounded-xl bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 text-sm font-black shadow-lg transition-all cursor-pointer border border-[#d4af37]/40"
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
