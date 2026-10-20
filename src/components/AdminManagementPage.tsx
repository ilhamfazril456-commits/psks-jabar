import React, { useState, useMemo } from 'react';
import { AdminAccount, UserSession } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';
import { hashPassword } from '../utils/crypto';
import { ShieldCheck, Lock, KeyRound, ArrowLeft, UserPlus, Sparkles } from 'lucide-react';
import { AdminRegisteredModal, AdminEditedModal, AdminDeleteConfirmModal, AdminDeletedModal, AdminAlreadyExistsModal } from './WelcomePopups';
import { BackToHomeButton } from './BackToHomeButton';

interface AdminManagementPageProps {
  session?: UserSession;
  adminAccounts: AdminAccount[];
  onAddAdminAccount: (newAdmin: Omit<AdminAccount, 'id'>) => void;
  onUpdateAdminAccount?: (updated: AdminAccount, securitySignal?: string) => void;
  onDeleteAdminAccount?: (id: string) => void;
  onBackToHome: () => void;
  onOpenMonitoring?: () => void;
  onNavigateToMaintenance?: () => void;
}

// Password Validator: Minimal 12 Karakter Campuran Huruf Besar, Kecil, dan Angka
const validateAdminPassword = (password: string): { isValid: boolean; message: string } => {
  const p = (password || '').trim();
  if (!p) {
    return { isValid: false, message: 'Kata sandi tidak boleh kosong!' };
  }
  if (p.length < 12) {
    return { isValid: false, message: 'Kata sandi minimal 12 karakter!' };
  }
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasNum = /[0-9]/.test(p);
  if (!hasUpper || !hasLower || !hasNum) {
    return {
      isValid: false,
      message: 'Kata sandi wajib kombinasi campuran huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9)!',
    };
  }
  return { isValid: true, message: '' };
};

export const AdminManagementPage: React.FC<AdminManagementPageProps> = ({
  session,
  adminAccounts,
  onAddAdminAccount,
  onUpdateAdminAccount,
  onDeleteAdminAccount,
  onBackToHome,
  onOpenMonitoring,
  onNavigateToMaintenance,
}) => {
  const isCurrentUserDeveloper = session?.role === 'developer' || session?.isDeveloper;

  // Filter tabs: 'all' | 'regional' | 'super'
  const [accountRoleFilter, setAccountRoleFilter] = useState<'all' | 'regional' | 'super'>('all');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');

  // Filter & order accounts according to authorization rules - strictly ADMIN ONLY (no user accounts)
  const { allGrouped, displayedAccounts, counts } = useMemo(() => {
    // 1. Purge legacy test admin_ilham and strictly exclude user accounts
    let list = adminAccounts
      .filter((a) => (a.username || '').toLowerCase() !== 'admin_ilham')
      .filter((a) => a.role !== 'user');

    // 2. Hide developer AND superadmin accounts if current user is not developer
    // Superadmin will strictly see and supervise the 27 Regional Kab/Kota admin accounts
    if (!isCurrentUserDeveloper) {
      list = list.filter((a) => {
        const uLower = (a.username || '').toLowerCase().trim();
        const isDev = a.id === 'adm-dev' || a.role === 'developer' || uLower === 'ilhamfazril';
        const isSuper = a.id === 'adm-super' || a.role === 'superadmin' || uLower.includes('superadmin');
        return !isDev && !isSuper;
      });
    }

    // 3. Separate top authority accounts (Dev & Superadmin) and regional accounts
    const devAccounts: typeof list = [];
    const superAccounts: typeof list = [];
    const regionalAccounts: typeof list = [];

    list.forEach((acc) => {
      const uLower = (acc.username || '').toLowerCase().trim();
      const isDev = acc.id === 'adm-dev' || acc.role === 'developer' || uLower === 'ilhamfazril';
      const isSuper = acc.id === 'adm-super' || acc.role === 'superadmin' || uLower.includes('superadmin');

      if (isDev) {
        devAccounts.push(acc);
      } else if (isSuper) {
        superAccounts.push(acc);
      } else {
        regionalAccounts.push(acc);
      }
    });

    const all = isCurrentUserDeveloper
      ? [...devAccounts, ...superAccounts, ...regionalAccounts]
      : regionalAccounts;

    let filtered = all;
    if (accountRoleFilter === 'regional') {
      filtered = regionalAccounts;
    } else if (accountRoleFilter === 'super') {
      filtered = isCurrentUserDeveloper ? [...devAccounts, ...superAccounts] : regionalAccounts;
    }

    return {
      allGrouped: all,
      displayedAccounts: filtered,
      counts: {
        all: all.length,
        regional: regionalAccounts.length,
        super: devAccounts.length + superAccounts.length,
      },
    };
  }, [adminAccounts, isCurrentUserDeveloper, accountRoleFilter]);

  // Superadmin Management State
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminWilayah, setNewAdminWilayah] = useState('Kota Bandung');
  const [registeredAdminData, setRegisteredAdminData] = useState<{
    username: string;
    wilayah: string;
    role?: string;
  } | null>(null);

  // Modal Edit State
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [editAdminUser, setEditAdminUser] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [editAdminWilayah, setEditAdminWilayah] = useState('Kota Bandung');
  const [editedAdminData, setEditedAdminData] = useState<{
    username: string;
    wilayah: string;
  } | null>(null);

  // Modal Delete State
  const [deletingAccount, setDeletingAccount] = useState<AdminAccount | null>(null);
  const [deletedAdminData, setDeletedAdminData] = useState<{
    username: string;
    wilayah: string;
  } | null>(null);

  // Modal Already Exists State
  const [alreadyExistsUser, setAlreadyExistsUser] = useState<string | null>(null);

  // 1. MASTER ADD ENGINE
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    const isMasterAdmin =
      session?.role === 'superadmin' || session?.role === 'developer' || session?.isDeveloper;
    if (!isMasterAdmin) {
      alert('⚠️ Akses Dibatasi: Pendaftaran akun admin baru hanya berlaku untuk Superadmin & Developer!');
      return;
    }

    const userIn = newAdminUser.trim().toLowerCase();
    const sandiIn = newAdminPassword.trim();
    const wilayahIn = newAdminWilayah;

    if (!userIn || !sandiIn || !wilayahIn) {
      alert('Mohon lengkapi semua kolom pendaftaran akun admin!');
      return;
    }

    // Validasi Password: Minimal 12 Karakter Campuran Huruf Besar Kecil Dan Angka
    const passCheck = validateAdminPassword(sandiIn);
    if (!passCheck.isValid) {
      alert(`⚠️ Validasi Password Gagal:\n${passCheck.message}`);
      return;
    }

    // Cek duplikasi username (di antara akun aktif yang terdaftar)
    const duplicate = adminAccounts.some(
      (a) => (a.username || '').toLowerCase().trim() === userIn
    );
    if (duplicate) {
      setAlreadyExistsUser(userIn);
      return;
    }

    const assignedRole =
      newAdminRole === 'superadmin' || wilayahIn.toLowerCase().includes('provinsi')
        ? 'superadmin'
        : 'admin';

    onAddAdminAccount({
      username: userIn,
      namaAdmin: userIn,
      wilayahTugas: wilayahIn,
      role: assignedRole,
      passwordPolos: sandiIn,
      passwordHash: hashPassword(sandiIn),
      terakhirLogin: 'Baru dibuat',
    });

    setNewAdminUser('');
    setNewAdminPassword('');
    setRegisteredAdminData({
      username: userIn,
      wilayah: wilayahIn,
      role: assignedRole,
    });
  };

  // 2. MASTER EDIT ENGINE
  const handleOpenEditModal = (account: AdminAccount) => {
    if (account.role === 'developer' && !isCurrentUserDeveloper) {
      alert("🔒 Akses Dibatasi: Akun Developer hanya berhak diedit oleh Developer!");
      return;
    }
    if (account.role === 'superadmin' && !isCurrentUserDeveloper) {
      alert("🔒 Akses Dibatasi: Akun Superadmin hanya berhak diedit oleh Developer!");
      return;
    }
    setEditingAccount(account);
    setEditAdminUser(account.username);
    setEditAdminPassword(account.passwordPolos || '');
    const initialWilayah =
      account.id === 'adm-super' || (account.username || '').toLowerCase().includes('superadmin')
        ? 'PROVINSI JAWA BARAT'
        : account.id === 'adm-dev' || (account.username || '').toLowerCase() === 'ilhamfazril'
        ? 'Pusat Developer Jabar'
        : account.wilayahTugas;
    setEditAdminWilayah(initialWilayah);
  };

  const handleSaveEditAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (editingAccount.role === 'developer' && !isCurrentUserDeveloper) {
      alert("🔒 Akses Dibatasi: Akun Developer hanya berhak diedit oleh Developer!");
      setEditingAccount(null);
      return;
    }

    if (editingAccount.role === 'superadmin' && !isCurrentUserDeveloper) {
      alert("🔒 Akses Dibatasi: Akun Superadmin hanya berhak diedit oleh Developer!");
      setEditingAccount(null);
      return;
    }

    const userNew = editAdminUser.trim().toLowerCase();
    const sandiNew = editAdminPassword.trim();
    const wilayahNew = editAdminWilayah;

    if (!userNew || !sandiNew || !wilayahNew) {
      alert('Mohon isi semua data perubahan!');
      return;
    }

    // Validasi Password: Minimal 12 Karakter Campuran Huruf Besar Kecil Dan Angka
    const passCheck = validateAdminPassword(sandiNew);
    if (!passCheck.isValid) {
      alert(`⚠️ Validasi Password Gagal:\n${passCheck.message}`);
      return;
    }

    // Role protection: Developer and Superadmin roles can NEVER be downgraded to regular admin
    const lockedRole: 'developer' | 'superadmin' | 'admin' | 'user' =
      editingAccount.id === 'adm-dev' || editingAccount.username.toLowerCase() === 'ilhamfazril' || userNew === 'ilhamfazril'
        ? 'developer'
        : editingAccount.id === 'adm-super' || editingAccount.username.toLowerCase().includes('superadmin') || userNew.includes('superadmin')
        ? 'superadmin'
        : editingAccount.role || 'admin';

    // Wilayah protection: Ensure superadmin always retains provincial authority
    let normalizedWilayah = wilayahNew;
    if (lockedRole === 'superadmin' && (wilayahNew === 'Provinsi Jabar' || wilayahNew === 'PROVINSI JAWA BARAT')) {
      normalizedWilayah = 'PROVINSI JAWA BARAT';
    }

    if (onUpdateAdminAccount) {
      onUpdateAdminAccount(
        {
          ...editingAccount,
          _previousUsername: editingAccount.username,
          username: userNew,
          namaAdmin: userNew,
          role: lockedRole,
          wilayahTugas: normalizedWilayah,
          passwordPolos: sandiNew,
          passwordHash: hashPassword(sandiNew),
          lastUpdatedTimestamp: Date.now(),
        } as any,
        'PASSWORD_CHANGED'
      );
    }

    setEditingAccount(null);
    setEditedAdminData({
      username: userNew,
      wilayah: wilayahNew,
    });
  };

  // 3. MASTER DELETION ENGINE
  const handleDeleteAdmin = (account: AdminAccount) => {
    if (account.role === 'developer') {
      if (!isCurrentUserDeveloper) {
        alert("🔒 Akses Dibatasi: Akun Developer hanya dapat dikelola/dihapus oleh Pusat Developer Jabar!");
        return;
      }
      // Developer cannot delete their own account
      const isSelf = 
        (session?.username && account.username.toLowerCase() === session.username.toLowerCase()) ||
        (account.id && session?.userId && account.id === session.userId) ||
        (account.username.toLowerCase() === 'ilhamfazril' && (session?.username || '').toLowerCase() === 'ilhamfazril');
      if (isSelf) {
        alert("🔒 Akses Ditolak: Anda tidak dapat menghapus akun Developer diri Anda sendiri!");
        return;
      }
    }

    if (account.role === 'superadmin' && !isCurrentUserDeveloper) {
      alert("🔒 Akses Dibatasi: Hanya Developer yang berhak menghapus akun Superadmin!");
      return;
    }

    // Open sleek custom confirmation modal (bypasses native confirm issues)
    setDeletingAccount(account);
  };

  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    const targetAcc = deletingAccount;
    setDeletingAccount(null);

    if (onDeleteAdminAccount) {
      onDeleteAdminAccount(targetAcc.id);
    }

    setDeletedAdminData({
      username: targetAcc.username,
      wilayah: targetAcc.wilayahTugas,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* BUTTON KEMBALI KE BERANDA - POJOK KIRI ATAS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-top-admin-manage" />

          <div className="flex items-center gap-2 bg-blue-950/10 border border-blue-800/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Kredensial & Otorisasi: Manajemen Akun Admin</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Header Role Notification Banner */}
          <div className="bg-[#0f2b5c] text-white p-5 rounded-2xl border-l-8 border-[#d4af37] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#d4af37] text-[#0f2b5c] px-2.5 py-0.5 rounded shadow-sm">
                {isCurrentUserDeveloper ? 'SULTAN DEVELOPER PRIVILEGE' : 'SUPERADMIN PRIVILEGE'}
              </span>
              <h2 className="text-lg font-black mt-1 m-0 text-white">
                Pusat Pengelola Kredensial & Otoritas Akun Admin
              </h2>
              <p className="text-xs text-amber-200/90 m-0 mt-0.5 font-medium">
                {isCurrentUserDeveloper
                  ? '⚡ Anda masuk sebagai Developer (Akses Penuh: Berhak mengedit akun Superadmin & seluruh Admin Wilayah).'
                  : '👑 Anda masuk sebagai Superadmin (Hanya Developer yang berhak mengedit akun Superadmin).'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-900/60 border border-[#d4af37]/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl">
                Fitur 1 Admin
              </span>
            </div>
          </div>

          {/* 1. FORM TAMBAH AKUN MEMBENTANG FULL - SEJAJAR & RAPI */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-950/10 p-5 sm:p-8">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-5">
              <h3 className="text-base sm:text-lg font-black text-[#043e2e] m-0 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#d4af37]" />
                <span>Tambah Akun Admin Daerah / Pusat Baru</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                *Semua kolom wajib diisi
              </span>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
                {/* Kolom 0: Tipe Akun */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#043e2e]">
                    Tipe Akun (Role) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e]"
                  >
                    <option value="admin">🏢 Admin Wilayah (Kab/Kota)</option>
                    {isCurrentUserDeveloper && (
                      <option value="superadmin">👑 Superadmin Provinsi</option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Tingkat hak akses akun baru.
                  </p>
                </div>

                {/* Kolom 1: Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#043e2e]">
                    Nama Pengguna (Username) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: IlhamFazril3"
                    value={newAdminUser}
                    onChange={(e) => setNewAdminUser(e.target.value)}
                    required
                    className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e]"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    Username unik tanpa spasi.
                  </p>
                </div>

                {/* Kolom 2: Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#043e2e]">
                    Kata Sandi (Password) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Minimal 12 karakter"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                    className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e]"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold">
                    *Wajib min. 12 karakter kombinasi huruf & angka.
                  </p>
                </div>

                {/* Kolom 3: Wilayah Otoritas */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#043e2e]">
                    Wilayah Kerja Otoritas <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newAdminWilayah}
                    onChange={(e) => setNewAdminWilayah(e.target.value)}
                    required
                    className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e]"
                  >
                    <option value="">-- Pilih Otoritas Wilayah --</option>
                    {KAB_KOTA_ONLY.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                    <option value="Provinsi Jabar">Provinsi Jabar (Pusat Superadmin)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Pilih wilayah penugasan admin dinas.
                  </p>
                </div>
              </div>

              {/* Baris Tombol Submit Sejajar Rapi */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="h-11 px-6 bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-black rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#d4af37]/40 active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-[#d4af37]" />
                  <span>Daftarkan Akun Baru</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. TABEL DATABASE MEMBENTANG PENUH */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-emerald-950/10 p-3.5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#043e2e] m-0 flex items-center gap-2">
                  <span>📋 Database Kredensial Akun SIM-PSKS Jawa Barat</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                  Total akun terdaftar: <strong className="text-[#043e2e]">{counts.all} Akun</strong> (Menampilkan: {displayedAccounts.length} Akun)
                </p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800 font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Enkripsi Bcrypt (Salt 10-Rounds) Aktif</span>
              </div>
            </div>

            {/* Role Filter Tabs */}
            {isCurrentUserDeveloper ? (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500 mr-1">Kategori:</span>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                    accountRoleFilter === 'all'
                      ? 'bg-[#043e2e] text-[#f3e5ab] shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Semua Akun ({counts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('regional')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                    accountRoleFilter === 'regional'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🏢 Admin 27 Kab/Kota ({counts.regional})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('super')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                    accountRoleFilter === 'super'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  👑 Superadmin & Dev ({counts.super})
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-[#043e2e] text-[#f3e5ab] shadow-sm">
                  🏢 Data Kredensial 27 Admin Kabupaten / Kota Jawa Barat ({counts.regional})
                </span>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 mt-2">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#043e2e] text-white border-b-4 border-[#d4af37]">
                    <th className="py-3 px-3.5 font-bold w-12 text-center">No</th>
                    <th className="py-3 px-4 font-bold">Nama Wilayah</th>
                    <th className="py-3 px-4 font-bold">Username Admin</th>
                    <th className="py-3 px-4 font-bold">Role Hak Akses</th>
                    <th className="py-3 px-4 font-bold">Kata Sandi & Hash Bcrypt</th>
                    <th className="py-3 px-4 font-bold text-center w-48">Tindakan Otoritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedAccounts.map((item, idx) => {
                    const uLower = (item.username || '').toLowerCase().trim();
                    const isDevAccount = item.id === 'adm-dev' || item.role === 'developer' || uLower === 'ilhamfazril';
                    const isSuperAccount = item.id === 'adm-super' || item.role === 'superadmin' || uLower.includes('superadmin');
                    
                    // Password masking rule:
                    // By default passwords are plain text / uncensored.
                    // EXCEPTION: If current logged-in user is Superadmin (NOT developer), mask superadmin's OWN password.
                    // If current user is Developer, ALL passwords are raw plain text visible without censorship.
                    const isPasswordMasked = !isCurrentUserDeveloper && isSuperAccount;

                    return (
                      <tr key={item.id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="py-3 px-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-[#043e2e]">{item.wilayahTugas}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">{item.username}</td>
                        <td className="py-3 px-4 font-bold">
                          {isDevAccount ? (
                            <span className="bg-[#d4af37] text-[#043e2e] text-[10px] font-black px-2 py-0.5 rounded shadow uppercase">
                              DEVELOPER
                            </span>
                          ) : isSuperAccount ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                              SUPERADMIN
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              ADMIN REGIONAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#b8901c]">
                          <div className="flex flex-col gap-0.5">
                            <span>
                              {isPasswordMasked
                                ? '••••••••'
                                : (item.passwordPolos || 'Tersimpan Terenkripsi')}
                            </span>
                            <span className="text-[9px] font-sans font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-max flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 inline" />
                              Bcrypt Hash Active
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isDevAccount ? (
                              isCurrentUserDeveloper ? (
                                (() => {
                                  const isSelf =
                                    (session?.username && item.username.toLowerCase() === session.username.toLowerCase()) ||
                                    (item.id && session?.userId && item.id === session.userId) ||
                                    (item.username.toLowerCase() === 'ilhamfazril' && (session?.username || '').toLowerCase() === 'ilhamfazril');
                                  return (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(item)}
                                        className="bg-[#e5c158] hover:bg-[#d4af37] text-[#043e2e] font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                      >
                                        📝 Edit
                                      </button>
                                      {isSelf ? (
                                        <span className="text-[11px] font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 cursor-not-allowed" title="Akun Developer Utama (Diri Sendiri) dilindungi dari penghapusan">
                                          🔒 Akun Anda
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteAdmin(item)}
                                          className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                        >
                                          🗑️ Hapus
                                        </button>
                                      )}
                                    </>
                                  );
                                })()
                              ) : (
                                <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 cursor-not-allowed">
                                  🔒 Non-Editable
                                </span>
                              )
                            ) : isSuperAccount && !isCurrentUserDeveloper ? (
                              <span
                                onClick={() => alert("🔒 Hak Terkunci: Hanya Developer yang berhak mengedit/menghapus akun Superadmin!")}
                                className="text-[11px] font-extrabold text-amber-800 bg-amber-50 px-3 py-1 rounded-md border border-amber-300 cursor-pointer hover:bg-amber-100 transition-colors"
                                title="Klik untuk info otoritas"
                              >
                                🔒 Otoritas Dev
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="bg-[#e5c158] hover:bg-[#d4af37] text-[#043e2e] font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                >
                                  📝 Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(item)}
                                  className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                >
                                  🗑️ Hapus
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL EDIT AESTHETIC */}
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#022319]/40 backdrop-blur-md animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border-t-8 border-[#e5c158] relative">
              <h3 className="text-lg font-black text-[#043e2e] m-0 border-b-2 border-slate-100 pb-3 mb-5">
                📝 Edit Kredensial Akun ({editingAccount.username})
              </h3>

              <form onSubmit={handleSaveEditAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#043e2e] mb-1.5">
                    Nama Pengguna (Username)
                  </label>
                  <input
                    type="text"
                    value={editAdminUser}
                    onChange={(e) => setEditAdminUser(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#043e2e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#043e2e] mb-1.5">
                    Kata Sandi Baru (Password)
                  </label>
                  <input
                    type="text"
                    value={editAdminPassword}
                    onChange={(e) => setEditAdminPassword(e.target.value)}
                    required
                    placeholder="Minimal 12 karakter..."
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#043e2e]"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    *Wajib minimal 12 karakter campuran huruf besar (A-Z), kecil (a-z), dan angka (0-9).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#043e2e] mb-1.5">
                    Wilayah Kerja Otoritas
                  </label>
                  <select
                    value={editAdminWilayah}
                    onChange={(e) => setEditAdminWilayah(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                  >
                    {KAB_KOTA_ONLY.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                    <option value="PROVINSI JAWA BARAT">Provinsi Jawa Barat (Pusat Superadmin)</option>
                    <option value="Provinsi Jabar">Provinsi Jabar (Pusat Superadmin)</option>
                    <option value="Pusat Developer Jabar">Pusat Developer Jabar</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold py-3 px-4 rounded-xl shadow transition-all text-xs cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="bg-slate-500 hover:bg-slate-600 text-white font-extrabold py-3 px-5 rounded-xl transition-all text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal Pop-up Animated Checkmark Success Add & Edit Admin */}
        <AdminRegisteredModal
          isOpen={!!registeredAdminData}
          onClose={() => setRegisteredAdminData(null)}
          username={registeredAdminData?.username || ''}
          wilayah={registeredAdminData?.wilayah || ''}
          role={registeredAdminData?.role}
        />
        <AdminEditedModal
          isOpen={!!editedAdminData}
          onClose={() => setEditedAdminData(null)}
          username={editedAdminData?.username || ''}
          wilayah={editedAdminData?.wilayah || ''}
        />
        <AdminDeleteConfirmModal
          isOpen={!!deletingAccount}
          onClose={() => setDeletingAccount(null)}
          onConfirm={handleConfirmDelete}
          username={deletingAccount?.username || ''}
          wilayah={deletingAccount?.wilayahTugas || ''}
        />
        <AdminDeletedModal
          isOpen={!!deletedAdminData}
          onClose={() => setDeletedAdminData(null)}
          username={deletedAdminData?.username || ''}
          wilayah={deletedAdminData?.wilayah || ''}
        />
        <AdminAlreadyExistsModal
          isOpen={!!alreadyExistsUser}
          onClose={() => setAlreadyExistsUser(null)}
          username={alreadyExistsUser || ''}
        />

        {/* BUTTON KEMBALI KE BERANDA - POJOK KIRI BAWAH */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-admin-manage" />
          <div className="text-xs text-slate-500 font-semibold">
            <span>PSKS JABAR Provinsi Jawa Barat • Otoritas Admin Regional</span>
          </div>
        </div>
      </div>
    </div>
  );
};
