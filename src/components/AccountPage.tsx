import React, { useState, useEffect, useMemo } from 'react';
import { UserSession, AdminAccount } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';
import { Shield, User, Key, LogOut, LogIn, UserPlus, RefreshCw, CheckCircle2, ShieldCheck, Lock, AlertTriangle, X, Code2, QrCode, CreditCard, ArrowLeft, Camera, Sparkles, Clock, Wifi } from 'lucide-react';
import { comparePassword, hashPassword } from '../utils/crypto';
import { CaptchaWidget } from './CaptchaWidget';
import { QRCardScannerModal } from './QRCardScannerModal';
import { PrintableQRCardModal } from './PrintableQRCardModal';
import { AdminRegisteredModal } from './WelcomePopups';
import { BackToHomeButton } from './BackToHomeButton';

interface AccountPageProps {
  session: UserSession;
  adminAccounts: AdminAccount[];
  onLogin: (role: 'user' | 'admin' | 'superadmin' | 'developer', username: string, wilayah: string) => void;
  onLogout: () => void;
  onAddAdminAccount: (newAdmin: Omit<AdminAccount, 'id'>) => void;
  onUpdateAdminAccount?: (updated: AdminAccount) => void;
  onDeleteAdminAccount?: (id: string) => void;
  openLoginOnMount?: boolean;
  onBackToHome?: () => void;
  onOpenGateModal?: () => void;
  onOpenDeveloperPanel?: () => void;
  onNavigateToManagement?: () => void;
  onNavigateToMonitoring?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  session,
  adminAccounts,
  onLogin,
  onLogout,
  onAddAdminAccount,
  onUpdateAdminAccount,
  onDeleteAdminAccount,
  openLoginOnMount = false,
  onBackToHome,
  onOpenGateModal,
  onOpenDeveloperPanel,
  onNavigateToManagement,
  onNavigateToMonitoring,
}) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(openLoginOnMount);
  const [loginRole, setLoginRole] = useState<'user' | 'admin' | 'superadmin'>('admin');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedRegionInput, setSelectedRegionInput] = useState('Kota Cimahi');
  const [captchaInput, setCaptchaInput] = useState('');
  const [currentCaptchaCode, setCurrentCaptchaCode] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [modalStep, setModalStep] = useState<'main' | 'user_region' | 'dinas_method_choice' | 'dinas_login'>('main');
  
  // QR Card Scanner & Printable Card Modals
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannerDefaultTab, setScannerDefaultTab] = useState<'qr' | 'nfc'>('qr');
  const [scannerMode, setScannerMode] = useState<'login' | 'check'>('check');
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);
  const [showLoginConfirmModal, setShowLoginConfirmModal] = useState(false);

  useEffect(() => {
    if (openLoginOnMount) {
      setIsLoginModalOpen(true);
      setModalStep('main');
    }
  }, [openLoginOnMount]);

  useEffect(() => {
    if (isLoginModalOpen) {
      setUsernameInput('');
      setPasswordInput('');
      setCaptchaInput('');
      setCaptchaError(false);
      setErrorMessage('');
    }
  }, [isLoginModalOpen]);

  // Security & Brute Force Protection State (matching login.php)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Superadmin Management State (matching manajemenakun.php)
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminWilayah, setNewAdminWilayah] = useState('Kota Bandung');
  const [registeredAdminData, setRegisteredAdminData] = useState<{
    username: string;
    wilayah: string;
    role?: string;
  } | null>(null);

  const isCurrentUserDeveloper = session.role === 'developer';

  // Filter & order accounts according to authorization rules
  const displayedAccounts = useMemo(() => {
    let list = adminAccounts.filter((a) => (a.username || '').toLowerCase() !== 'admin_ilham');

    if (!isCurrentUserDeveloper) {
      list = list.filter((a) => a.role !== 'developer');
    }

    const devAccounts: typeof list = [];
    const superAccounts: typeof list = [];
    const regionalAccounts: typeof list = [];

    list.forEach((acc) => {
      const isDev = acc.role === 'developer';
      const isSuper = acc.role === 'superadmin' || (acc.username || '').toLowerCase().includes('superadmin');

      if (isDev) {
        devAccounts.push(acc);
      } else if (isSuper) {
        superAccounts.push(acc);
      } else {
        regionalAccounts.push(acc);
      }
    });

    return [...devAccounts, ...superAccounts, ...regionalAccounts];
  }, [adminAccounts, isCurrentUserDeveloper]);

  // Modal Edit State (matching manajemenakun.php)
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [editAdminUser, setEditAdminUser] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [editAdminWilayah, setEditAdminWilayah] = useState('Kota Bandung');

  // Brute force countdown timer effect
  useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const formatCountdown = (totalSeconds: number) => {
    const menit = Math.floor(totalSeconds / 60);
    const detik = totalSeconds % 60;
    if (menit > 0) {
      return `${menit} menit ${detik} detik`;
    }
    return `${detik} detik`;
  };

  const handleGuestLogin = () => {
    onLogin('user', 'Tamu Publik', selectedRegionInput || 'KOTA BANDUNG');
    setIsLoginModalOpen(false);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      return;
    }

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMessage("❌ Mohon isi Username dan Password terlebih dahulu!");
      return;
    }

    // CAPTCHA Verification
    if (!captchaInput.trim() || captchaInput.trim().toUpperCase() !== currentCaptchaCode) {
      setCaptchaError(true);
      setErrorMessage("❌ Kode CAPTCHA salah atau belum diisi! Silakan masukkan 5 karakter yang tertera pada visual gambar.");
      return;
    }

    const userLower = usernameInput.trim().toLowerCase();
    const passInput = passwordInput.trim();

    // 0. VALIDASI AKUN DEVELOPER KHUSUS (ILHAM FAZRIL)
    const devAcc = adminAccounts.find((a) => a.role === 'developer' && (a.username || '').toLowerCase() === 'ilhamfazril');
    if (userLower === "ilhamfazril") {
      const isDevValid = comparePassword(passInput, devAcc?.passwordHash || devAcc?.passwordPolos || "IlhamSangDeveloper") || (devAcc?.passwordPolos && passInput === devAcc.passwordPolos);
      if (isDevValid) {
        setFailedAttempts(0);
        setLockoutRemaining(0);
        setErrorMessage('');
        setUsernameInput('');
        setPasswordInput('');
        setCaptchaInput('');
        setCaptchaError(false);
        onLogin('developer', devAcc?.namaAdmin || 'Ilham Fazril', 'Pusat Developer Jabar');
        setIsLoginModalOpen(false);
        return;
      } else {
        triggerFailedAttempt();
        return;
      }
    }

    // A. VALIDASI AKUN SUPERADMIN PUSAT
    const superAcc = adminAccounts.find((a) => a.role === 'superadmin' || (a.username || '').toLowerCase() === 'superadmin jabar');
    if (userLower === "superadmin jabar" || userLower === "superadmin") {
      const isSuperValid = comparePassword(passInput, superAcc?.passwordHash || superAcc?.passwordPolos || "super12345jabar") || (superAcc?.passwordPolos && passInput === superAcc.passwordPolos);
      if (isSuperValid) {
        setFailedAttempts(0);
        setLockoutRemaining(0);
        setErrorMessage('');
        setUsernameInput('');
        setPasswordInput('');
        setCaptchaInput('');
        setCaptchaError(false);
        onLogin('superadmin', 'Superadmin jabar', 'PROVINSI JAWA BARAT');
        setIsLoginModalOpen(false);
        return;
      } else {
        triggerFailedAttempt();
        return;
      }
    }

    // B. VALIDASI AKUN ADMIN REGIONAL
    const matchedAccount = adminAccounts.find(
      (a) => (a.username || '').toLowerCase() === userLower
    );

    if (matchedAccount) {
      const isValid = comparePassword(passInput, matchedAccount.passwordHash || matchedAccount.passwordPolos) || (matchedAccount.passwordPolos && passInput === matchedAccount.passwordPolos);
      if (!isValid) {
        triggerFailedAttempt();
        return;
      }
      setFailedAttempts(0);
      setLockoutRemaining(0);
      setErrorMessage('');
      setUsernameInput('');
      setPasswordInput('');
      setCaptchaInput('');
      setCaptchaError(false);
      const role = matchedAccount.role || 'user';
      onLogin(role, matchedAccount.namaAdmin, matchedAccount.wilayahTugas);
      setIsLoginModalOpen(false);
      return;
    } else {
      triggerFailedAttempt();
    }
  };

  const triggerFailedAttempt = () => {
    const nextSalah = failedAttempts + 1;
    setFailedAttempts(nextSalah);

    if (nextSalah >= 3) {
      const duration = (nextSalah - 2) * 30; // 30s (3x), 60s (4x), 90s (5x), 120s (6x)
      setLockoutRemaining(duration);
      setErrorMessage(`❌ Akses dibekukan sementara karena salah memasukkan kredensial! Harap tunggu ${duration} detik.`);
    } else {
      setErrorMessage(`❌ Username/Password yang anda masukkan Salah, Kesempatan Sisa ( ${3 - nextSalah}x lagi )`);
    }
  };

  // 1. MASTER ADD ENGINE: Menambah akun baru & sinkronisasi global
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    const isMasterAdmin =
      session.role === 'superadmin' || session.isDeveloper || (session.role as string) === 'developer';
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

    // Cek duplikasi username
    const duplicate = adminAccounts.some((a) => (a.username || '').toLowerCase() === userIn);
    if (duplicate) {
      alert(`⚠️ Gagal: Username '${userIn}' sudah terdaftar dalam sistem!`);
      return;
    }

    const assignedRole = wilayahIn.toLowerCase().includes('provinsi') ? 'superadmin' : 'admin';

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

  // 2. MASTER EDIT ENGINE: Membuka modal edit dan menyimpan perubahan
  const handleOpenEditModal = (account: AdminAccount) => {
    setEditingAccount(account);
    setEditAdminUser(account.username);
    setEditAdminPassword(account.passwordPolos || '');
    setEditAdminWilayah(account.wilayahTugas);
  };

  const handleSaveEditAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const userNew = editAdminUser.trim().toLowerCase();
    const sandiNew = editAdminPassword.trim();
    const wilayahNew = editAdminWilayah;

    if (!userNew || !sandiNew || !wilayahNew) {
      alert('Mohon isi semua data perubahan!');
      return;
    }

    if (onUpdateAdminAccount) {
      onUpdateAdminAccount({
        ...editingAccount,
        username: userNew,
        namaAdmin: userNew,
        wilayahTugas: wilayahNew,
        passwordPolos: sandiNew,
        passwordHash: hashPassword(sandiNew),
      });
    }

    alert("📝 Perubahan Berhasil!\nData Kredensial Admin Wilayah Berhasil Diperbarui & Sinkron Global.");
    setEditingAccount(null);
  };

  // 3. MASTER DELETION ENGINE: Menghapus mutlak dari tabel & state
  const handleDeleteAdmin = (account: AdminAccount) => {
    if (account.role === 'developer') {
      if (!isCurrentUserDeveloper) {
        alert("🔒 Akses Dibatasi: Akun Developer hanya dapat dikelola/dihapus oleh Pusat Developer Jabar!");
        return;
      }
      const isSelf = 
        (session?.username && account.username.toLowerCase() === session.username.toLowerCase()) ||
        (account.id && session?.userId && account.id === session.userId) ||
        (account.username.toLowerCase() === 'ilhamfazril' && (session?.username || '').toLowerCase() === 'ilhamfazril');
      if (isSelf) {
        alert("🔒 Akses Ditolak: Anda tidak dapat menghapus akun Developer diri Anda sendiri!");
        return;
      }
    }

    if (
      window.confirm(
        `🚨 PERINGATAN OTORITAS!\n\nApakah Anda yakin ingin MENGHAPUS akun '${account.username}' milik wilayah ${account.wilayahTugas}?`
      )
    ) {
      if (onDeleteAdminAccount) {
        onDeleteAdminAccount(account.id);
      }
      alert("🗑️ Sukses! Akun bersangkutan telah dihapus secara instan dari tabel & Database.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 py-10 px-4 sm:px-6 lg:px-8 pb-24 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-emerald-100/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* TOP NAVIGATION BAR: BUTTON KEMBALI KE BERANDA */}
        {onBackToHome && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-top-account" />
            <div className="text-xs font-bold text-slate-500 bg-white/80 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
              <span>PSKS JABAR Provinsi Jawa Barat</span>
            </div>
          </div>
        )}

        {/* Header Title Section - Clean Emerald & Gold Accent */}
        <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] border-l-4 border-[#d4af37] p-6 sm:p-8 rounded-3xl shadow-xl border border-[#d4af37]/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gradient-to-r from-[#d4af37] via-amber-200 to-[#f3e5ab] text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-slate-950 shrink-0" />
                <span>PUSAT OTORITAS PSKS JABAR</span>
              </span>
              <span className="bg-emerald-950/80 text-emerald-200 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-600/40">
                PROVINSI JAWA BARAT
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white m-0 tracking-tight">
              Pusat Otoritas & Akses Pengguna
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1.5 m-0 font-medium max-w-2xl leading-relaxed">
              {(session.role === 'superadmin' || session.isDeveloper || (session.role as string) === 'developer')
                ? 'Manajemen kredensial terpadu, tingkat hak otorisasi dinas, proteksi pendaftaran admin, dan akses cepat berbasis Smart Card Kode QR.'
                : 'Rincian data profil, status otorisasi akun terdaftar, dan informasi wilayah tugas dinas.'}
            </p>
          </div>
        </div>

        {/* SEKSI CARD PROFIL MEWAH UPGRADE MAKSIMAL - Bright Clean Emerald & Gold */}
        <div id="informasi-akun-section" className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden relative">
          <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] p-6 sm:p-10 border-b-2 border-[#d4af37] text-white flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative overflow-hidden">
            {/* Top Right Metallic Overlay */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#d4af37]/15 rounded-full blur-2xl pointer-events-none" />

            {/* Avatar Lingkaran Sultan */}
            <div className="relative shrink-0">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full font-black text-4xl sm:text-5xl flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.35)] border-4 border-[#d4af37] ${
                  session.statusActive === 'SAH_TERDAFTAR' && (session.isDeveloper || (session.role as string) === 'developer')
                    ? 'bg-gradient-to-br from-[#b8901c] via-[#d4af37] to-[#f3e5ab] text-slate-950'
                    : session.statusActive === 'SAH_TERDAFTAR' && session.role === 'superadmin'
                    ? 'bg-gradient-to-br from-[#d4af37] to-amber-200 text-slate-950'
                    : session.statusActive === 'SAH_TERDAFTAR'
                    ? 'bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950 text-emerald-100'
                    : 'bg-emerald-900 text-amber-300 border-[#d4af37]'
                }`}
              >
                {session.statusActive === 'SAH_TERDAFTAR' && session.nama
                  ? session.nama.charAt(0).toUpperCase()
                  : 'G'}
              </div>
              {session.statusActive === 'SAH_TERDAFTAR' && (
                <span className="absolute bottom-1 right-1 bg-emerald-400 border-2 border-[#043e2e] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                </span>
              )}
            </div>

            {/* Profile Info Summary */}
            <div className="text-center sm:text-left space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h3 className="text-2xl sm:text-3xl font-black text-white m-0 tracking-wide">
                  {session.statusActive === 'SAH_TERDAFTAR' ? session.nama : 'Guest Pengunjung'}
                </h3>
                {session.role === 'developer' && (
                  <span className="bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#f3e5ab] text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    <span>SULTAN DEVELOPER</span>
                  </span>
                )}
                {session.role === 'superadmin' && (
                  <span className="bg-gradient-to-r from-[#d4af37] to-amber-200 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-950" />
                    <span>SUPERADMIN PUSAT</span>
                  </span>
                )}
              </div>

              <div className="text-amber-300 text-xs sm:text-sm font-bold flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                {session.statusActive === 'SAH_TERDAFTAR' ? (
                  session.role === 'developer' ? (
                    <span className="text-[#f3e5ab] font-extrabold flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-[#d4af37]" />
                      <span>Otoritas Tertinggi Pengembang & Sistem Administrator</span>
                    </span>
                  ) : session.role === 'superadmin' ? (
                    <span className="text-amber-200 font-extrabold flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#d4af37]" />
                      <span>Otoritas Penuh Pengelolaan Provinsi Jawa Barat</span>
                    </span>
                  ) : session.role === 'user' ? (
                    <span className="text-emerald-100 font-semibold flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-300" />
                      <span>Pengguna Terdaftar: {session.wilayah || 'Jawa Barat'}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-100 font-semibold flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-300" />
                      <span>Admin Wilayah Tugas: {session.wilayah || 'Jawa Barat'}</span>
                    </span>
                  )
                ) : (
                  <span className="text-emerald-200 font-medium">Sesi Tamu Publik (Tanpa Otorisasi Dinas)</span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="p-6 sm:p-8 bg-slate-50 divide-y divide-slate-200 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3.5">
              <div>
                <span className="font-extrabold text-emerald-900 block text-[11px] uppercase tracking-wider mb-1">
                  Nama Pengguna (Username)
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {session.statusActive === 'SAH_TERDAFTAR' ? session.nama : 'Pengunjung Tamu'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Identitas otentikasi akun yang terdaftar dalam database.</p>
              </div>

              <div>
                <span className="font-extrabold text-emerald-900 block text-[11px] uppercase tracking-wider mb-1">
                  Tingkat Otoritas (Role Level)
                </span>
                <span className="font-black text-[#043e2e] text-sm uppercase">
                  {session.statusActive === 'SAH_TERDAFTAR'
                    ? session.role === 'developer'
                      ? 'DEVELOPER SYSTEM ADMINISTRATOR'
                      : session.role === 'superadmin'
                      ? 'SUPERADMIN ACCESS CONTROL'
                      : session.role === 'user'
                      ? `PENGGUNA TERDAFTAR (${session.wilayah || 'Jawa Barat'})`
                      : `ADMIN REGIONAL (${session.wilayah || 'Jawa Barat'})`
                    : 'Public Visitor'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Tingkat hak akses operasi dan persetujuan data.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3.5">
              <div>
                <span className="font-extrabold text-emerald-900 block text-[11px] uppercase tracking-wider mb-1">
                  Status Sesi & Otorisasi
                </span>
                <div>
                  {session.statusActive === 'SAH_TERDAFTAR' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Terverifikasi Aktif & Terenskripsi</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider">
                      <span>Offline (Pengunjung Mode Baca)</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Sesi terhubung secara aman dengan proteksi kata sandi Bcrypt.</p>
              </div>

              <div>
                <span className="font-extrabold text-emerald-900 block text-[11px] uppercase tracking-wider mb-1">
                  Wilayah Tugas / Domisili
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {session.statusActive === 'SAH_TERDAFTAR'
                    ? session.wilayah || 'PROVINSI JAWA BARAT'
                    : selectedRegionInput || 'Seluruh Jawa Barat'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Cakupan area pengelolaan dan pelaporan PSKS.</p>
              </div>
            </div>

            {/* Added Session Login Timestamp & Security Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3.5">
              <div>
                <span className="font-extrabold text-emerald-900 block text-[11px] uppercase tracking-wider mb-1">
                  Waktu Masuk / Terakhir Login
                </span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {session.loginTimestamp
                      ? new Date(session.loginTimestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        }) + ' WIB'
                      : 'Baru saja'}
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Catatan waktu autentikasi sesi aktif di Pusat Akun.</p>
              </div>

              <div>
                <span className="font-extrabold text-emerald-900 block text-[11px] uppercase tracking-wider mb-1">
                  Status Enkripsi & Kredensial Akun
                </span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Bcrypt Salting (10 Rounds) Terproteksi</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Kredensial tersimpan dan terlindungi dengan standar keamanan tinggi.</p>
              </div>
            </div>

            {/* Quick Actions Header Buttons inside Profile Card */}
            <div className="pt-4 sm:pt-6 pb-1 sm:pb-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
              <button
                onClick={() => {
                  if (onBackToHome) {
                    onBackToHome();
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="w-full sm:w-auto flex-1 bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] hover:brightness-110 text-amber-300 border border-[#d4af37] font-black py-2.5 sm:py-3 px-3.5 sm:px-6 rounded-xl sm:rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                <span>Kembali ke Beranda Utama</span>
              </button>

              {session.statusActive === 'SAH_TERDAFTAR' ? (
                <button
                  onClick={onLogout}
                  className="w-full sm:w-auto flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-extrabold py-2.5 sm:py-3 px-3.5 sm:px-6 rounded-xl sm:rounded-2xl transition-all cursor-pointer text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                  <span>Keluar Akun</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginConfirmModal(true)}
                  className="w-full sm:w-auto flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400 font-extrabold py-2.5 sm:py-3 px-3.5 sm:px-6 rounded-xl sm:rounded-2xl transition-all cursor-pointer text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
                  <span>Masuk ke akun</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {session.role !== 'user' && (session.role === 'superadmin' || session.role === 'developer') && (
          <div className="bg-gradient-to-br from-[#022319] via-[#043e2e] to-[#065e44] rounded-3xl p-6 sm:p-8 border-2 border-[#d4af37]/80 shadow-2xl shadow-[#d4af37]/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-[#d4af37] text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-950" />
                    <span>SMART CARD INTEGRATED</span>
                  </span>
                  <span className="text-amber-200 text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Otentikasi Kilat Kode QR v3.0</span>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white m-0">
                  Integrasi Smart Card Akses QR Pintar Otoritas Tinggi
                </h3>

                <p className="text-emerald-100/90 text-xs sm:text-sm font-medium leading-relaxed m-0">
                  <strong className="text-amber-300">
                    Akun {session.role === 'superadmin' ? 'Superadmin Jawa Barat' : session.role === 'developer' ? 'Developer Sistem' : 'Admin Wilayah'}
                  </strong> telah terintegrasi secara pintar dengan teknologi <strong className="text-[#d4af37]">Smart Card QR Code</strong>. Anda dapat mengecek keaktifan, validitas, dan status otorisasi Smart Card QR fisik maupun digital secara langsung melalui pemindai kamera perangkat Anda.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <button
                  onClick={() => {
                    setScannerMode('check');
                    setIsQrScannerOpen(true);
                  }}
                  className="bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#f3e5ab] hover:scale-[1.02] text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>CEK SMART CARD</span>
                </button>

                {(session.isDeveloper || (session.role as string) === 'developer') && (
                  <button
                    onClick={() => setIsPrintCardsOpen(true)}
                    className="bg-[#021d15]/90 hover:bg-[#022319] text-amber-200 border border-[#d4af37]/70 hover:border-[#d4af37] font-bold py-3 px-5 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                  >
                    <CreditCard className="w-4 h-4 text-[#d4af37]" />
                    <span>Lihat & Cetak Smart Card QR</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION BAR: BUTTON KEMBALI KE BERANDA */}
        {onBackToHome && (
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-account" />
            <div className="text-xs text-slate-500 font-semibold">
              <span>PSKS JABAR Provinsi Jawa Barat • Halaman Profil & Otoritas</span>
            </div>
          </div>
        )}



        {/* Modal Pop-up Login Akun Dinas (Clean Bright Theme) */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4af37] overflow-hidden relative max-w-lg w-full my-auto max-h-[90vh] flex flex-col text-slate-800">
              {/* Button Close Modal */}
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-3.5 right-3.5 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors z-10 cursor-pointer"
                title="Tutup Modal Login"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white p-6 text-center relative shrink-0 border-b-2 border-[#d4af37]">
                <span className="bg-[#d4af37] text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full tracking-wider inline-block mb-1.5 shadow uppercase">
                  JABAR SECURE v3 (PSKS JABAR)
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
                  Otorisasi Akses Pengguna
                </h2>
                <p className="text-xs text-amber-200/90 mt-1 mb-0 font-medium">
                  Sistem Pengaman Berlapis Potensi Sumber Kesejahteraan Sosial
                </p>
              </div>

              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {/* Error Alert Box */}
                {errorMessage && (
                  <div className="bg-red-50 text-red-800 border border-red-300 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      {lockoutRemaining > 0 ? (
                        <span>
                          ⚠️ Serangan Brute Force Terdeteksi! Akses dibekukan. Tunggu:{" "}
                          <strong className="font-bold underline text-red-900">{formatCountdown(lockoutRemaining)}</strong>
                        </span>
                      ) : (
                        <span>{errorMessage}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 1: Main View - Only 2 Clean Choice Cards */}
                {modalStep === 'main' && (
                  <div className="space-y-3.5 py-1">
                    <p className="text-center text-xs font-semibold text-slate-600 mb-3">
                      Pilih metode masuk untuk mengakses Layanan & Pusat Akun PSKS Jabar:
                    </p>

                    {/* Choice 1: Lanjutkan Sebagai User */}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setModalStep('user_region');
                      }}
                      className="w-full text-left p-4.5 rounded-2xl border-2 border-emerald-300 hover:border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/70 transition-all shadow-sm group cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#043e2e] text-amber-300 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <User className="w-6 h-6 text-amber-300" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-sm text-[#043e2e] m-0">
                            1. Lanjutkan sebagai User
                          </h3>
                          <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            Publik
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                          Akses cepat membaca data publik wilayah tanpa memerlukan kata sandi.
                        </p>
                      </div>
                    </button>

                    {/* Choice 2: Login Ke Akun Dinas */}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setModalStep('dinas_method_choice');
                      }}
                      className="w-full text-left p-4.5 rounded-2xl border-2 border-[#d4af37] hover:border-amber-600 bg-amber-50/70 hover:bg-amber-100/70 transition-all shadow-sm group cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#043e2e] border border-[#d4af37]/60 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Lock className="w-6 h-6 text-[#d4af37]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-sm text-[#043e2e] m-0">
                            2. Login ke Akun Dinas
                          </h3>
                          <span className="text-[10px] font-extrabold bg-[#d4af37] text-slate-950 px-2.5 py-0.5 rounded-full">
                            Resmi
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                          Otorisasi khusus Admin Wilayah, Superadmin & Developer (Via Akun / Smart Card QR).
                        </p>
                      </div>
                    </button>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsLoginModalOpen(false)}
                        className="w-full py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer border border-slate-300"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: DINAS METHOD CHOICE */}
                {modalStep === 'dinas_method_choice' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-center border-b border-slate-200 pb-3">
                      <span className="bg-[#d4af37] text-slate-950 font-black text-[9px] px-3 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                        OTORISASI RESMI AKUN DINAS
                      </span>
                      <h3 className="font-black text-base text-[#043e2e] m-0">
                        Pilih Opsi Masuk Sistem
                      </h3>
                      <p className="text-xs text-slate-600 font-medium m-0 mt-1">
                        Gunakan Kredensial Terdaftar atau Kartu Akses QR Otoritas:
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* LUXURY BUTTON 1: LOGIN MENGGUNAKAN AKUN TERDAFTAR */}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setModalStep('dinas_login');
                        }}
                        className="w-full text-left p-4.5 rounded-2xl border-2 border-[#d4af37] bg-emerald-50 hover:bg-emerald-100/80 text-slate-900 shadow-md transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-[#043e2e] text-[#d4af37] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform font-black">
                            <Key className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-sm text-[#043e2e] transition-colors m-0">
                                Login Menggunakan Akun Terdaftar
                              </h4>
                              <span className="text-[9px] font-black bg-[#d4af37] text-slate-950 px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ml-1">
                                KREDENSIAL
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                              Otorisasi manual menggunakan Username, Password, dan Kode CAPTCHA visual.
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* LUXURY BUTTON 2 & 3: PEMINDAI QR & TAP SMARTCARD */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage('');
                            setScannerDefaultTab('qr');
                            setIsQrScannerOpen(true);
                          }}
                          className="p-3.5 rounded-2xl border-2 border-[#d4af37] bg-gradient-to-br from-[#0c5942] to-[#043e2e] hover:from-[#094735] hover:to-[#032e22] text-white shadow-md transition-all cursor-pointer group flex flex-col items-center text-center justify-between min-h-[145px]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 mb-1 group-hover:scale-110 transition-transform">
                            <QrCode className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-amber-200 m-0">
                              Pemindai QR
                            </h4>
                            <p className="text-[10px] text-emerald-100 font-medium mt-0.5 leading-tight">
                              Pindai fisik QR
                            </p>
                          </div>
                          <span className="mt-2 text-[9px] font-black bg-[#d4af37] text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider w-full">
                            Buka Kamera
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage('');
                            setScannerDefaultTab('nfc');
                            setIsQrScannerOpen(true);
                          }}
                          className="p-3.5 rounded-2xl border-2 border-[#d4af37] bg-gradient-to-br from-slate-900 via-slate-800 to-[#043e2e] hover:from-black hover:to-slate-900 text-white shadow-md transition-all cursor-pointer group flex flex-col items-center text-center justify-between min-h-[145px]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-1 group-hover:scale-110 transition-transform">
                            <Wifi className="w-5 h-5 rotate-90 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-amber-200 m-0">
                              Tap SmartCard
                            </h4>
                            <p className="text-[10px] text-slate-300 font-medium mt-0.5 leading-tight">
                              Sensor Tap NFC
                            </p>
                          </div>
                          <span className="mt-2 text-[9px] font-black bg-[#d4af37] text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider w-full">
                            Sensor NFC
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2.5">
                      {(session.isDeveloper || (session.role as string) === 'developer') && (
                        <button
                          type="button"
                          onClick={() => setIsPrintCardsOpen(true)}
                          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-[#d4af37] text-[#043e2e] font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4 text-[#d4af37]" />
                          <span>🎴 Lihat & Cetak Smart Card QR Developer</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setModalStep('main')}
                        className="w-full py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-300"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Pilihan Akses Utama</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2A: User Region Selection */}
                {modalStep === 'user_region' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center">
                      <h3 className="font-bold text-xs text-[#043e2e] flex items-center justify-center gap-2">
                        <User className="w-4 h-4 text-[#d4af37]" />
                        <span>Mode Tamu Pengunjung Publik</span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Pilih Kabupaten / Kota tugas untuk melanjutkan sebagai User Pengunjung:
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Pilih Wilayah Kabupaten / Kota
                      </label>
                      <select
                        value={selectedRegionInput}
                        onChange={(e) => setSelectedRegionInput(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                      >
                        {KAB_KOTA_ONLY.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setModalStep('main')}
                        className="flex-1 py-3 rounded-2xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all cursor-pointer"
                      >
                        ← Kembali
                      </button>
                      <button
                        type="button"
                        onClick={handleGuestLogin}
                        className="flex-[1.5] py-3 rounded-2xl text-xs font-extrabold bg-[#043e2e] hover:bg-[#065e44] text-white shadow-lg transition-all cursor-pointer"
                      >
                        Konfirmasi & Masuk User →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2B: Dinas Login Form */}
                {modalStep === 'dinas_login' && (
                  <form onSubmit={handleFormLogin} className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Username Akun Dinas
                      </label>
                      <input
                        type="text"
                        placeholder="Masukkan Username Anda"
                        value={usernameInput}
                        onChange={(e) => {
                          setUsernameInput(e.target.value);
                          setErrorMessage('');
                        }}
                        className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-2xl p-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Kata Sandi (Password)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          setErrorMessage('');
                        }}
                        className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-2xl p-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    {/* Visual Interactive CAPTCHA Widget */}
                    <CaptchaWidget
                      userInput={captchaInput}
                      setUserInput={(val) => {
                        setCaptchaInput(val);
                        setCaptchaError(false);
                        setErrorMessage('');
                      }}
                      onCaptchaCodeChange={(code) => setCurrentCaptchaCode(code)}
                      isError={captchaError}
                    />

                    {/* Action Buttons Wrapper */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setModalStep('dinas_method_choice')}
                        className="flex-1 py-3 rounded-2xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all text-center cursor-pointer"
                      >
                        ← Kembali
                      </button>

                      <button
                        type="submit"
                        disabled={lockoutRemaining > 0}
                        className={`flex-[1.5] py-3 px-4 rounded-2xl text-xs font-extrabold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                          lockoutRemaining > 0
                            ? 'bg-slate-300 text-slate-500 border border-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-amber-300 border border-[#d4af37] font-black'
                        }`}
                      >
                        <Lock className="w-4 h-4 text-amber-300" />
                        <span>{lockoutRemaining > 0 ? `Dibekukan (${lockoutRemaining}s)` : 'Login Akun Dinas'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modals Pemindai QR & Cetak Kartu Akses */}
        <QRCardScannerModal
          isOpen={isQrScannerOpen}
          mode={scannerMode}
          defaultTab={scannerDefaultTab}
          onClose={() => setIsQrScannerOpen(false)}
          onSuccessLogin={(role, nama, wilayah) => {
            setIsLoginModalOpen(false);
            onLogin(role, nama, wilayah);
          }}
          onOpenPrintCards={() => setIsPrintCardsOpen(true)}
        />

        <PrintableQRCardModal
          isOpen={isPrintCardsOpen}
          onClose={() => setIsPrintCardsOpen(false)}
          onOpenScanner={() => setIsQrScannerOpen(true)}
        />

        {/* Modal Pop-up Animated Checkmark Success Add Admin */}
        <AdminRegisteredModal
          isOpen={!!registeredAdminData}
          onClose={() => setRegisteredAdminData(null)}
          username={registeredAdminData?.username || ''}
          wilayah={registeredAdminData?.wilayah || ''}
          role={registeredAdminData?.role}
        />

        {/* Modal Pop-up Edit Akun Admin */}
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4af37] max-w-lg w-full p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base sm:text-lg font-black text-[#043e2e] m-0">
                  📝 Edit Data Kredensial Admin Wilayah
                </h3>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Admin
                  </label>
                  <input
                    type="text"
                    value={editAdminUser}
                    onChange={(e) => setEditAdminUser(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Baru (Password)
                  </label>
                  <input
                    type="text"
                    value={editAdminPassword}
                    onChange={(e) => setEditAdminPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah Kerja Otoritas
                  </label>
                  <select
                    value={editAdminWilayah}
                    onChange={(e) => setEditAdminWilayah(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  >
                    {KAB_KOTA_ONLY.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                    <option value="Provinsi Jabar">Provinsi Jabar (Pusat Superadmin)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-extrabold rounded-xl text-xs border border-amber-400/40 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* POPUP SIMPLE KONFIRMASI MASUK / LOGIN AKUN UNTUK TAMU PUBLIK */}
        {showLoginConfirmModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
            <div className="bg-gradient-to-b from-[#032e22] via-[#043e2e] to-[#011a13] border-2 border-[#d4af37] rounded-2xl p-6 max-w-md w-full shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-150 ring-1 ring-amber-400/30">
              {/* Decorative background glow */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Icon Header */}
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                <LogIn className="w-7 h-7 text-emerald-400" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-black text-white mb-2 tracking-tight">
                Konfirmasi Masuk Akun
              </h3>

              {/* Confirmation Question Message */}
              <p className="text-sm text-emerald-100/90 leading-relaxed mb-6 font-medium px-2">
                Apakah anda yakin ingin <strong className="text-white font-extrabold">Login</strong>? Halaman anda akan diarahkan ke halaman gerbang utama untuk masuk/daftar akun!
              </p>

              {/* Action Buttons: Batal & Ya */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/20 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginConfirmModal(false);
                    if (onOpenGateModal) {
                      onOpenGateModal();
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950/50 border border-emerald-300/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Ya</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

