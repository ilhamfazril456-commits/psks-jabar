import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { OfficialPsksLogo } from './OfficialPsksLogo';
import { KAB_KOTA_ONLY } from '../data/initialData';
import { AdminAccount, AppSettings } from '../types';
import {
  Shield,
  User,
  Lock,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Key,
  Sparkles,
  Building2,
  Globe2,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  LogIn,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Camera,
  Check,
  Clock,
  MapPin,
  AlertOctagon,
  Laptop,
  Wifi,
  CreditCard,
  Radio,
  Copy,
  XCircle,
  RefreshCw,
  Phone,
  HelpCircle,
  KeyRound
} from 'lucide-react';

import { CaptchaWidget } from './CaptchaWidget';
const PrivacyTermsModal = React.lazy(() => import('./PrivacyTermsModal').then(m => ({ default: m.PrivacyTermsModal })));
const RegisterSuccessModal = React.lazy(() => import('./WelcomePopups').then(m => ({ default: m.RegisterSuccessModal })));
const QRCardScannerModal = React.lazy(() => import('./QRCardScannerModal').then(m => ({ default: m.QRCardScannerModal })));
const PrintableQRCardModal = React.lazy(() => import('./PrintableQRCardModal').then(m => ({ default: m.PrintableQRCardModal })));
import { AuthorityPinVerificationModal } from './AuthorityPinVerificationModal';
import {
  getStableDeviceId,
  detectClientIp,
  subscribeToClientQuota,
  recordAccountRegistration,
  isPrivateOrLocalIp,
  QuotaInfo,
} from '../services/ipRegistrationService';
import { getFirestoreDoc } from '../services/firestoreDataService';

interface SmartGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPillarTitle?: string;
  onConfirmGuestRegion: (region: string) => void;
  onPerformLogin: (role: 'user' | 'admin' | 'superadmin' | 'developer', nama: string, wilayah: string, username?: string, userId?: string) => void;
  adminAccounts: AdminAccount[];
  onRegisterAccount?: (newAccount: Omit<AdminAccount, 'id'>) => Promise<void> | void;
  onUpdateAccountLocal?: (account: AdminAccount) => void;
  appSettings?: AppSettings;
  logoUrl?: string;
}

export const SmartGateModal: React.FC<SmartGateModalProps> = ({
  isOpen,
  onClose,
  targetPillarTitle = 'PSKS Jabar',
  onConfirmGuestRegion,
  onPerformLogin,
  adminAccounts,
  onRegisterAccount,
  onUpdateAccountLocal,
  appSettings,
  logoUrl,
}) => {
  // Navigation Flow State:
  // 'main' -> Layar Utama (3 Jalur Utama)
  // 'register' -> Jalur 1 (Pendaftaran Akun Baru)
  // 'register_status' -> Halaman Informasi Pendaftaran Akun (Status Verval Realtime)
  // 'login_choice' -> Jalur 2 (Pilihan Metode Masuk: Manual / Smart Card)
  // 'login_manual' -> Jalur 2: Pilihan A (Login Manual Form)
  // 'login_smart_card' -> Jalur 2: Pilihan B (Layar Transisi & Animasi Smart Card)
  // 'guest' -> Jalur 3 (Akses Tamu Publik & Pilih Wilayah)
  // 'forgot_password' -> Formulir Lupa Kata Sandi (Pemulihan Akun via NIK & WA)
  // 'forgot_password_status' -> Pantau Status Tiket Pemulihan Akun Realtime
  const [view, setView] = useState<'main' | 'register' | 'register_status' | 'login_choice' | 'login_manual' | 'login_smart_card' | 'guest' | 'forgot_password' | 'forgot_password_status'>('main');

  // Khusus Tampilan Layar HP: Lapisan Pertama (Intro Selamat Datang & Tombol MULAI)
  // Ketika tombol MULAI ditekan, berlanjut ke Lapisan Kedua (Pilihan Login yang sudah ada)
  const [showMobileIntro, setShowMobileIntro] = useState<boolean>(true);

  // Wilayah selection states - defaults to empty string so user consciously selects
  const [selectedGuestRegion, setSelectedGuestRegion] = useState<string>('');
  const [selectedRegisterRegion, setSelectedRegisterRegion] = useState<string>('');

  // Registration Form States
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regNoWhatsapp, setRegNoWhatsapp] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<{ username: string; wilayah: string } | null>(null);

  // Forgot Password / Pemulihan Akun States (Tahap 3)
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotNik, setForgotNik] = useState('');
  const [forgotNoWhatsapp, setForgotNoWhatsapp] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotTicketCopied, setForgotTicketCopied] = useState(false);
  const [activeForgotAccount, setActiveForgotAccount] = useState<AdminAccount | null>(null);
  const [savedForgotSession, setSavedForgotSession] = useState<{ username: string; requestedAt: number } | null>(() => {
    try {
      const saved = localStorage.getItem('psks_active_reset_ticket');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Registration Ticket & Realtime Verval Status Tracking
  const [registrationTicket, setRegistrationTicket] = useState<{
    username: string;
    wilayah: string;
    waktuPendaftaran: string;
    noRegistrasi: string;
    passwordPolos?: string;
    nik?: string;
    noWhatsapp?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('psks_latest_user_registration_ticket');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Visual copy indicator for registration ticket number
  const [ticketCopied, setTicketCopied] = useState(false);
  const handleCopyTicket = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setTicketCopied(true);
    setTimeout(() => {
      setTicketCopied(false);
    }, 2000);
  };

  // Login Form States (Universal for User, Admin, Superadmin, Developer)
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [currentCaptchaCode, setCurrentCaptchaCode] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [captchaRefreshTrigger, setCaptchaRefreshTrigger] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pendingAuthorityLogin, setPendingAuthorityLogin] = useState<{
    role: 'superadmin' | 'developer';
    nama: string;
    wilayah: string;
    username?: string;
    userId?: string;
  } | null>(null);

  // Hardware Scanner & Print Modals
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannerDefaultTab, setScannerDefaultTab] = useState<'qr' | 'nfc'>('qr');
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);

  // Privacy & Terms Modal State
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);
  const [privacyTermsInitialTab, setPrivacyTermsInitialTab] = useState<'privacy' | 'terms'>('privacy');

  // Privileged 6-Digit PIN Gate State (for Superadmin & Developer manual logins)
  const [pendingPrivilegedAuth, setPendingPrivilegedAuth] = useState<{
    role: 'superadmin' | 'developer';
    nama: string;
    wilayah: string;
    username?: string;
    userId?: string;
  } | null>(null);

  // Input & Scroll Refs
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const captchaInputRef = useRef<HTMLInputElement>(null);
  const regUsernameRef = useRef<HTMLInputElement>(null);

  const executeDirectLoginSuccess = useCallback((
    role: 'user' | 'developer' | 'superadmin' | 'admin',
    nama: string,
    wilayah: string,
    username?: string,
    userId?: string
  ) => {
    setIsLoggingIn(true);
    setSuccessMessage(`✅ OTENTIKASI BERHASIL! Selamat datang, ${nama} (${wilayah}).`);
    setErrorMessage('');

    onPerformLogin(role, nama, wilayah, username, userId);

    setTimeout(() => {
      setFailedAttempts(0);
      setLockoutRemaining(0);
      setUsernameInput('');
      setPasswordInput('');
      setCaptchaInput('');
      setCaptchaError(false);
      setIsLoggingIn(false);
      setSuccessMessage('');
      setView('main');
      onClose();
    }, 350);
  }, [onPerformLogin, onClose]);

  // Bot Honeypot Traps & Request Throttling (Zero layout impact, eliminates automated bots)
  const [regHoneypot, setRegHoneypot] = useState('');
  const [loginHoneypot, setLoginHoneypot] = useState('');
  const lastSubmitTimestampRef = useRef<number>(0);

  // Client IP and Stable Device ID detection
  const [detectedIp, setDetectedIp] = useState<string>(() => {
    return sessionStorage.getItem('simpsks_client_ip') || '';
  });
  const [detectedDeviceId] = useState<string>(() => {
    return getStableDeviceId();
  });

  // Realtime Quota Information state (Strict 1 Account per IP / Perangkat)
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo>(() => {
    const rawLocal = localStorage.getItem('simpsks_device_registered_accounts');
    let localList: string[] = [];
    if (rawLocal) {
      try {
        localList = JSON.parse(rawLocal);
      } catch {}
    }
    return {
      registeredAccounts: localList.slice(0, 1),
      count: Math.min(localList.length, 1),
      isQuotaFull: localList.length >= 1,
      ip: '',
      deviceId: getStableDeviceId(),
      isRealtimeSynced: false,
    };
  });

  // Real-time lookup of client's registered account strictly for THIS specific physical device
  const clientRegisteredAccount = useMemo(() => {
    const devId = detectedDeviceId || getStableDeviceId();

    // 1. First priority: from registration ticket created on THIS device
    if (registrationTicket?.username) {
      const u = registrationTicket.username.toLowerCase().trim();
      const found = adminAccounts.find((a) => (a.username || '').toLowerCase().trim() === u);
      if (found) return found;
    }

    // 2. Second priority: from quotaInfo registeredAccounts for THIS device
    if (quotaInfo?.registeredAccounts && quotaInfo.registeredAccounts.length > 0) {
      for (const uname of quotaInfo.registeredAccounts) {
        const u = uname.toLowerCase().trim();
        const found = adminAccounts.find((a) => (a.username || '').toLowerCase().trim() === u);
        if (found) return found;
      }
    }

    // 3. Third priority: by deviceId match in adminAccounts
    if (devId) {
      const found = adminAccounts.find((a) => a.deviceId === devId && a.role === 'user');
      if (found) return found;
    }

    return null;
  }, [registrationTicket, quotaInfo?.registeredAccounts, adminAccounts, detectedDeviceId]);

  // Real-time listener lookup for this user from adminAccounts
  const liveRegisteredAccount = clientRegisteredAccount;

  // Auto-clean stale ticket if account was removed/deleted from database by Superadmin
  useEffect(() => {
    if (registrationTicket?.username && adminAccounts.length > 0) {
      const u = registrationTicket.username.toLowerCase().trim();
      const stillInDb = adminAccounts.some((a) => (a.username || '').toLowerCase().trim() === u);
      if (!stillInDb) {
        setRegistrationTicket(null);
        try {
          localStorage.removeItem('psks_latest_user_registration_ticket');
        } catch {}
      }
    }
  }, [adminAccounts, registrationTicket]);

  // Detect IP dynamically whenever gate modal is open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    detectClientIp().then((ip) => {
      if (isMounted && ip) {
        setDetectedIp(ip);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Subscribe to real-time Firestore quota updates for this device/IP whenever modal is open
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToClientQuota(
      detectedIp,
      detectedDeviceId,
      adminAccounts || [],
      (info) => {
        setQuotaInfo(info);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, detectedIp, detectedDeviceId, adminAccounts, regSuccess]);

  const deviceRegisteredAccounts = quotaInfo.registeredAccounts;
  const isDeviceQuotaFull = quotaInfo.count >= 1 || Boolean(clientRegisteredAccount);

  const getDeviceRegisteredAccounts = (): string[] => {
    return quotaInfo.registeredAccounts;
  };

  // Handler Pintar Klik "Daftar Akun Baru" sesuai 4 Kondisi Realtime
  const handleDaftarAkunBaruClick = () => {
    setErrorMessage('');
    
    // KONDISI 1: Belum pernah mendaftar (atau akun lama sudah dihapus oleh Superadmin)
    if (!clientRegisteredAccount) {
      setView('register');
      return;
    }

    // KONDISI 2, 3, 4: Sudah ada akun yang diajukan dari IP/perangkat ini
    // Langsung arahkan ke halaman informasi pendaftaran akun (Pending, Ditolak, atau Disetujui)
    setView('register_status');
  };


  // Reset form inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('main');
      setUsernameInput('');
      setPasswordInput('');
      setCaptchaInput('');
      setCaptchaError(false);
      setErrorMessage('');
      setSuccessMessage('');
      setIsLoggingIn(false);
      setRegUsername('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegSuccess(false);
      setRegisteredUserData(null);
      setSelectedGuestRegion('');
      setSelectedRegisterRegion('');
    }
  }, [isOpen]);

  // Auto-dismiss success message after 2 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCloseRegisterSuccess = () => {
    setRegisteredUserData(null);
    setView('login_manual');
  };

  if (!isOpen) return null;

  // Helper for matching wilayah with prefixes and variations
  const isWilayahMatch = (wil: string, map?: Record<string, boolean>) => {
    if (!map || !wil) return false;
    if (map[wil] === true) return true;
    const wilLower = wil.toLowerCase().trim();
    const wilClean = wilLower.replace(/^(kabupaten|kab\.|kota|provinsi|prov\.)\s+/i, '').trim();
    const matchKey = Object.keys(map).find((k) => {
      const kLower = k.toLowerCase().trim();
      const kClean = kLower.replace(/^(kabupaten|kab\.|kota|provinsi|prov\.)\s+/i, '').trim();
      return (
        kLower === wilLower ||
        kClean === wilClean ||
        (wilClean.length > 2 && kClean.includes(wilClean)) ||
        (kClean.length > 2 && wilClean.includes(kClean))
      );
    });
    return matchKey ? map[matchKey] === true : false;
  };

  // --- JALUR 3: AKSES TAMU SUBMIT ---
  const handleGuestSubmit = () => {
    if (!selectedGuestRegion || selectedGuestRegion === '') {
      setErrorMessage('⚠️ Silakan pilih salah satu Wilayah Kabupaten / Kota terlebih dahulu untuk melanjutkan!');
      return;
    }

    // Pengecekan Maintenance untuk Akses Tamu Publik
    if (appSettings) {
      const isGlobalUserMaintenance = !!appSettings.maintenanceUser;
      const isWilayahMaintenance = isWilayahMatch(selectedGuestRegion, appSettings.maintenanceUserWilayah);
      if (isGlobalUserMaintenance || isWilayahMaintenance) {
        const msg = appSettings.maintenanceMsgUser || 'Mohon maaf, sistem informasi portal publik sedang dalam tahap pemeliharaan rutin (Maintenance).';
        setErrorMessage(`⚠️ PEMELIHARAAN SISTEM (MAINTENANCE AKTIF):\n\n${msg}\n\nAkses Tamu Publik untuk wilayah "${selectedGuestRegion}" ditutup sementara waktu demi peningkatan layanan.`);
        return;
      }
    }

    setErrorMessage('');
    onConfirmGuestRegion(selectedGuestRegion);
    setView('main');
    onClose();
  };

  // --- JALUR 1: REGISTRASI AKUN USER ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Bot Honeypot Trap Detection (Catches automated scripts instantly before database calls)
    if (regHoneypot.trim()) {
      setErrorMessage('❌ Aktivitas bot otomatis terdeteksi. Permintaan pendaftaran ditolak demi keamanan sistem.');
      return;
    }

    // Rate-limit click spamming (Minimum 1.5s interval between submissions)
    const now = Date.now();
    if (now - lastSubmitTimestampRef.current < 1500) {
      setErrorMessage('⚠️ Mohon tunggu sejenak sebelum menekan tombol kembali.');
      return;
    }
    lastSubmitTimestampRef.current = now;

    // Check device quota limitation (Max 3 accounts per device)
    const currentDeviceAccounts = getDeviceRegisteredAccounts();
    if (currentDeviceAccounts.length >= 3) {
      setErrorMessage('❌ Batas Pendaftaran Tercapai! Perangkat ini telah mencapai batas maksimal 3 kali pendaftaran (3 akun). Pendaftaran akun baru dari perangkat ini tidak diperbolehkan.');
      return;
    }

    const uTrim = regUsername.trim();
    const pTrim = regPassword.trim();
    const cTrim = regConfirmPassword.trim();
    const nikTrim = regNik.trim();
    const waTrim = regNoWhatsapp.trim().replace(/[\s-]/g, '');

    if (!uTrim) {
      setErrorMessage('❌ Mohon isi Username pendaftaran!');
      regUsernameRef.current?.focus();
      return;
    }

    if (uTrim.length < 3) {
      setErrorMessage('❌ Username minimal harus terdiri dari 3 karakter!');
      return;
    }

    if (!nikTrim) {
      setErrorMessage('❌ Mohon isi NIK Kependudukan (16 digit angka)!');
      return;
    }

    if (!/^[0-9]{16}$/.test(nikTrim)) {
      setErrorMessage('❌ NIK Kependudukan wajib tepat 16 digit angka!');
      return;
    }

    // Check duplicate NIK in existing database accounts
    const isNikDuplicate = adminAccounts.some((acc) => acc.nik && acc.nik.trim() === nikTrim);
    if (isNikDuplicate) {
      setErrorMessage(`❌ NIK "${nikTrim}" sudah terdaftar pada sistem! 1 NIK hanya berlaku untuk 1 akun pengguna.`);
      return;
    }

    if (!waTrim) {
      setErrorMessage('❌ Mohon isi Nomor WhatsApp aktif!');
      return;
    }

    if (!/^(08|628|\+628)[0-9]{8,12}$/.test(waTrim)) {
      setErrorMessage('❌ Nomor WhatsApp tidak valid! Gunakan format nomor aktif (Contoh: 081234567890).');
      return;
    }

    if (!pTrim) {
      setErrorMessage('❌ Mohon masukkan Kata Sandi (Password)!');
      return;
    }

    // Password validation: Min 8 chars, uppercase, lowercase, numbers
    if (pTrim.length < 8) {
      setErrorMessage('❌ Kata Sandi minimal harus 8 karakter!');
      return;
    }

    const hasUpper = /[A-Z]/.test(pTrim);
    const hasLower = /[a-z]/.test(pTrim);
    const hasNum = /[0-9]/.test(pTrim);

    if (!hasUpper || !hasLower || !hasNum) {
      setErrorMessage('❌ Kata Sandi harus campuran huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9)!');
      return;
    }

    if (!cTrim) {
      setErrorMessage('❌ Mohon isi Konfirmasi Kata Sandi!');
      return;
    }

    if (pTrim !== cTrim) {
      setErrorMessage('❌ Konfirmasi Kata Sandi tidak cocok dengan Kata Sandi!');
      return;
    }

    if (!selectedRegisterRegion || selectedRegisterRegion === '') {
      setErrorMessage('⚠️ Mohon pilih salah satu Wilayah Domisili / Tugas dari 27 Kabupaten/Kota Jawa Barat!');
      return;
    }

    // Check duplicate and reserved username against existing database accounts
    const uLower = uTrim.toLowerCase();
    const reservedUsernames = ['ilhamfazril', 'ilham fazril', 'superadmin jabar', 'superadmin', 'developer', 'admin', 'admin_jabar'];
    const isDuplicate = adminAccounts.some((acc) => (acc.username || '').toLowerCase().trim() === uLower);
    if (isDuplicate || reservedUsernames.includes(uLower) || uLower.startsWith('admin_')) {
      setErrorMessage(`❌ Username "${uTrim}" tidak dapat digunakan atau sudah terdaftar. Silakan gunakan username lain atau masuk di menu login!`);
      return;
    }

    setIsRegistering(true);

    try {
      const { hashPassword } = await import('../utils/crypto');
      const nowMs = Date.now();
      const ticketNumber = `REG-PSKS-${Date.now().toString().slice(-6)}`;
      const formattedDate = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(nowMs)) + ' WIB';

      const newAccountData: Omit<AdminAccount, 'id'> = {
        username: uTrim,
        namaAdmin: uTrim,
        wilayahTugas: selectedRegisterRegion,
        role: 'user',
        nik: nikTrim,
        noWhatsapp: waTrim,
        passwordPolos: pTrim,
        passwordHash: hashPassword(pTrim),
        terakhirLogin: 'Baru mendaftar',
        isOnline: false,
        statusKoneksi: 'OFFLINE',
        statusLayar: 'OFFLINE',
        registeredIp: detectedIp || undefined,
        deviceId: detectedDeviceId || getStableDeviceId(),
        // Realtime Verval Fields
        statusVerval: 'MENUNGGU_VERIFIKASI',
        statusActive: 'PENDING_VERIFIKASI',
        statusAkun: 'AKTIF',
        noRegistrasi: ticketNumber,
        waktuPendaftaran: new Date(nowMs).toISOString(),
        tanggalPendaftaranFormatted: formattedDate,
        lastUpdatedTimestamp: nowMs,
      };

      if (onRegisterAccount) {
        await onRegisterAccount(newAccountData);
      }

      // Record this registration on the device and in Firestore in real-time
      await recordAccountRegistration(uTrim, detectedIp, detectedDeviceId || getStableDeviceId());

      // Update quota info immediately in local state (Strict 1 account per IP / device)
      const updatedAccounts = [uTrim];
      setQuotaInfo({
        registeredAccounts: updatedAccounts,
        count: 1,
        isQuotaFull: true,
        ip: detectedIp,
        deviceId: detectedDeviceId || getStableDeviceId(),
        isRealtimeSynced: true,
      });

      // Simpan tiket registrasi ke state & local storage untuk dipantau secara realtime
      const ticketData = {
        username: uTrim,
        wilayah: selectedRegisterRegion,
        waktuPendaftaran: formattedDate,
        noRegistrasi: ticketNumber,
        passwordPolos: pTrim,
        nik: nikTrim,
        noWhatsapp: waTrim,
      };
      setRegistrationTicket(ticketData);
      try {
        localStorage.setItem('psks_latest_user_registration_ticket', JSON.stringify(ticketData));
      } catch {}

      // Auto populate username only; leave password empty for manual entry
      setUsernameInput(uTrim);
      setPasswordInput('');
      setIsRegistering(false);

      // LANGSUNG ARAHKAN KE HALAMAN INFORMASI PENDAFTARAN AKUN (STATUS VERVAL REALTIME)
      setView('register_status');
    } catch (err) {
      setIsRegistering(false);
      setErrorMessage('❌ Gagal menyimpan pendaftaran akun ke server. Silakan coba kembali.');
    }
  };

  // --- TAHAP 3: ALUR PENGAJUAN RESET KATA SANDI (LUPA KATA SANDI) ---
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const uTrim = forgotUsername.trim().toLowerCase();
    const nikTrim = forgotNik.trim();
    const waTrim = forgotNoWhatsapp.trim().replace(/[\s-]/g, '');

    if (!uTrim) {
      setErrorMessage('❌ Mohon isi Username akun yang ingin dipulihkan!');
      return;
    }
    if (!nikTrim || !/^[0-9]{16}$/.test(nikTrim)) {
      setErrorMessage('❌ NIK Kependudukan wajib tepat 16 digit angka!');
      return;
    }
    if (!waTrim || !/^(08|628|\+628)[0-9]{8,12}$/.test(waTrim)) {
      setErrorMessage('❌ Nomor WhatsApp tidak valid! Gunakan format nomor aktif (Contoh: 081234567890).');
      return;
    }

    setIsSubmittingForgot(true);

    try {
      // Find matching user account in registered accounts
      const targetAccount = adminAccounts.find((acc) => (acc.username || '').toLowerCase().trim() === uTrim);

      if (!targetAccount) {
        setErrorMessage(`❌ Akun dengan username "${forgotUsername.trim()}" tidak ditemukan dalam sistem!`);
        setIsSubmittingForgot(false);
        return;
      }

      // If account already has NIK, verify match
      if (targetAccount.nik && targetAccount.nik.trim() !== nikTrim) {
        setErrorMessage('❌ NIK yang Anda masukkan tidak cocok dengan data pendaftaran akun ini!');
        setIsSubmittingForgot(false);
        return;
      }

      // If account already has WhatsApp, verify match (normalize 08 vs 62)
      if (targetAccount.noWhatsapp) {
        const accWaClean = targetAccount.noWhatsapp.replace(/[\s-]/g, '').replace(/^\+/, '');
        const inputWaClean = waTrim.replace(/^\+/, '');
        const normAcc = accWaClean.startsWith('62') ? '0' + accWaClean.slice(2) : accWaClean;
        const normInput = inputWaClean.startsWith('62') ? '0' + inputWaClean.slice(2) : inputWaClean;
        if (normAcc !== normInput) {
          setErrorMessage('❌ Nomor WhatsApp yang Anda masukkan tidak cocok dengan data terdaftar akun ini!');
          setIsSubmittingForgot(false);
          return;
        }
      }

      // Create or update reset ticket on this account
      const nowMs = Date.now();
      const updatedAccount: AdminAccount = {
        ...targetAccount,
        nik: targetAccount.nik || nikTrim,
        noWhatsapp: targetAccount.noWhatsapp || waTrim,
        resetTicket: {
          status: 'MENUNGGU_RESET',
          requestedAt: nowMs,
          nik: nikTrim,
          noWhatsapp: waTrim,
        },
        lastUpdatedTimestamp: nowMs,
      };

      if (onUpdateAccountLocal) {
        onUpdateAccountLocal(updatedAccount);
      }

      const resetSession = {
        username: targetAccount.username,
        requestedAt: nowMs,
      };
      setSavedForgotSession(resetSession);
      setActiveForgotAccount(updatedAccount);
      try {
        localStorage.setItem('psks_active_reset_ticket', JSON.stringify(resetSession));
      } catch {}

      setSuccessMessage('Pengajuan reset sandi berhasil dikirim! Menunggu persetujuan Superadmin / Developer.');
      setView('forgot_password_status');
    } catch {
      setErrorMessage('Terjadi kendala saat mengirim pengajuan. Silakan coba kembali.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // --- SECURITY: ANTI BRUTE FORCE TRIGGER ---
  const triggerFailedAttempt = (customMsg?: string) => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    // Auto-refresh CAPTCHA code on failure
    setCaptchaRefreshTrigger((prev) => prev + 1);
    setCaptchaInput('');
    setPasswordInput('');
    setCaptchaError(true);

    if (nextAttempts >= 3) {
      const duration = (nextAttempts - 2) * 30; // 30s, 60s, 90s...
      setLockoutRemaining(duration);
      setErrorMessage(`❌ AKSES DIBEKUKAN SEMENTARA! Terlalu banyak percobaan kredensial salah (${nextAttempts}x). Harap tunggu ${duration} detik.`);

      const interval = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      const remaining = 3 - nextAttempts;
      setErrorMessage(
        customMsg || `❌ Username atau Password yang Anda masukkan Salah! Sisa Kesempatan: ${remaining}x lagi sebelum pembekuan akun.`
      );
    }

    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  // --- JALUR 2: LOGIN MANUAL SUBMIT (UNIVERSAL ROLE SORTING) ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bot Honeypot Trap Detection (Catches automated scripts instantly before database calls)
    if (loginHoneypot.trim()) {
      setErrorMessage('❌ Aktivitas bot otomatis terdeteksi. Akses login ditolak demi keamanan sistem.');
      return;
    }

    // Rate-limit click spamming (Minimum 1.5s interval between submissions)
    const now = Date.now();
    if (now - lastSubmitTimestampRef.current < 1500) {
      setErrorMessage('⚠️ Mohon tunggu sejenak sebelum mencoba kembali.');
      return;
    }
    lastSubmitTimestampRef.current = now;

    if (lockoutRemaining > 0 || isLoggingIn) return;

    if (!usernameInput.trim()) {
      setErrorMessage('❌ Mohon isi Username terlebih dahulu!');
      usernameInputRef.current?.focus();
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage('❌ Mohon isi Kata Sandi (Password) terlebih dahulu!');
      passwordInputRef.current?.focus();
      return;
    }

    // Smart Security Gate Verification
    if (!captchaInput.trim()) {
      setCaptchaError(true);
      setErrorMessage('🛡️ Verifikasi Keamanan: Mohon centang kotak verifikasi di atas terlebih dahulu.');
      return;
    }

    const { comparePassword } = await import('../utils/crypto');

    const uLower = usernameInput.trim().toLowerCase();
    const pInput = passwordInput.trim();

    const handleLoginSuccess = (
      role: 'user' | 'developer' | 'superadmin' | 'admin',
      nama: string,
      wilayah: string,
      username?: string,
      userId?: string
    ) => {
      // Privileged Access Management: Superadmin and Developer MUST pass 6-digit PIN verification
      if (role === 'superadmin' || role === 'developer') {
        setPendingPrivilegedAuth({
          role,
          nama,
          wilayah,
          username,
          userId,
        });
        return;
      }
      executeDirectLoginSuccess(role, nama, wilayah, username, userId);
    };

    // 0. Primary Secure Server-Side Login (Protects Passwords & Hashes from Client-Side Exposure)
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uLower, password: pInput, turnstileToken: captchaInput }),
      });
      const data = await resp.json();
      if (resp.ok && data.valid && data.session) {
        handleLoginSuccess(
          data.session.role,
          data.session.namaAdmin,
          data.session.wilayahTugas,
          data.session.username,
          data.session.id
        );
        return;
      }
      if (resp.status === 401 || resp.status === 403 || resp.status === 429) {
        setErrorMessage(data.message || 'Kombinasi Nama Pengguna atau Kata Sandi salah.');
        triggerFailedAttempt();
        return;
      }
    } catch {
      // Offline fallback: continue to local check only if server is unreachable
    }

    // 1. Check Universal Registered Accounts (Strictly validates against database passwordHash)
    let matchedAccount = adminAccounts.find(
      (a) => (a.username || '').toLowerCase().trim() === uLower
    );

    if (matchedAccount) {
      if (matchedAccount.isFrozen === true || matchedAccount.statusAkun === 'DIBEKUKAN' || matchedAccount.statusActive === 'FROZEN') {
        setErrorMessage('❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan/dibekukan oleh Administrator. Akses masuk ditolak.');
        return;
      }

      const isValid = comparePassword(pInput, matchedAccount.passwordHash);
      if (isValid) {
        // Cek Status Verval Khusus Akun User (Wajib disetujui Superadmin sebelum boleh login)
        if (matchedAccount.role === 'user') {
          const isPending = matchedAccount.statusVerval === 'MENUNGGU_VERIFIKASI' || matchedAccount.statusActive === 'PENDING_VERIFIKASI';
          const isRejected = matchedAccount.statusVerval === 'DITOLAK' || matchedAccount.statusActive === 'DITOLAK';

          if (isPending) {
            const ticketData = {
              username: matchedAccount.username,
              wilayah: matchedAccount.wilayahTugas,
              waktuPendaftaran: matchedAccount.tanggalPendaftaranFormatted || matchedAccount.waktuPendaftaran || 'Baru mendaftar',
              noRegistrasi: matchedAccount.noRegistrasi || `REG-PSKS-${(matchedAccount.id || '').slice(-6)}`,
              passwordPolos: matchedAccount.passwordPolos || pInput,
            };
            setRegistrationTicket(ticketData);
            try {
              localStorage.setItem('psks_latest_user_registration_ticket', JSON.stringify(ticketData));
            } catch {}

            setErrorMessage('⏳ AKUN MENUNGGU VERIFIKASI: Pendaftaran akun Anda sedang dalam proses verifikasi oleh Superadmin Dinas Sosial Provinsi Jawa Barat.');
            return;
          }

          if (isRejected) {
            const reason = matchedAccount.alasanPenolakan || 'Data yang diajukan belum memenuhi persyaratan.';
            setErrorMessage(`❌ PENDAFTARAN DITOLAK: Pengajuan akun Anda ditolak oleh Superadmin (${reason}). Silakan lakukan pendaftaran ulang.`);
            return;
          }
        }

        // Explicitly set isFrozen false & statusAkun AKTIF on successful authenticated login
        matchedAccount = {
          ...matchedAccount,
          isFrozen: false,
          statusAkun: 'AKTIF',
        };
        if (onUpdateAccountLocal) {
          onUpdateAccountLocal(matchedAccount);
        }

        // Resilient role determination: Guaranteed superadmin and developer authority
        const assignedRole: 'user' | 'admin' | 'superadmin' | 'developer' = 
          matchedAccount.id === 'adm-dev' || (matchedAccount.username || '').toLowerCase() === 'ilhamfazril'
            ? 'developer'
            : matchedAccount.id === 'adm-super' || (matchedAccount.username || '').toLowerCase().includes('superadmin')
            ? 'superadmin'
            : (matchedAccount.role as any) || 'user';

        const assignedWilayah =
          assignedRole === 'superadmin'
            ? 'PROVINSI JAWA BARAT'
            : assignedRole === 'developer'
            ? 'Pusat Developer Jabar'
            : matchedAccount.wilayahTugas || 'Jawa Barat';

        handleLoginSuccess(
          assignedRole,
          matchedAccount.namaAdmin || matchedAccount.username,
          assignedWilayah,
          matchedAccount.username,
          matchedAccount.id
        );
        return;
      } else {
        triggerFailedAttempt();
        return;
      }
    } else {
      triggerFailedAttempt();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#06152d] via-[#091f42] to-[#040e1f] w-full h-[100dvh] overflow-hidden flex flex-col justify-between select-none font-sans text-slate-800 p-0 sm:p-3 md:p-4 overscroll-none">
      {/* Dynamic Aesthetic Ambient Glow Canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[150px]" />
        <div className="absolute top-[35%] right-[25%] w-[500px] h-[500px] bg-[#d4af37]/10 rounded-full blur-[120px]" />
      </div>

      {/* Center Split-Screen Container (Full Screen Responsive, Strictly No-Scroll) */}
      <main className="relative z-20 w-full max-w-5xl lg:max-w-6xl mx-auto flex-1 min-h-0 h-full max-md:h-[100dvh] md:my-auto p-0 sm:py-2 flex items-center justify-center">
        
        {/* Split-Screen Card (Full Screen Balanced on Mobile, Fixed Split-Screen on Desktop) */}
        <div className="relative w-full h-full max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:rounded-none max-md:border-0 sm:max-h-[90vh] md:max-h-[680px] lg:max-h-[700px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-950/80 border border-blue-800/40 overflow-hidden flex flex-col md:flex-row">
          
          {/* ================= LEFT COLUMN: DISTINCT ROYAL BLUE BRANDING (DESKTOP / LAPTOP) ================= */}
          <div className="hidden md:flex md:w-[38%] lg:w-[40%] bg-gradient-to-br from-[#123e8c] via-[#0d2d68] to-[#07193d] text-white p-5 lg:p-7 flex-col justify-between relative overflow-hidden shrink-0 border-r border-blue-400/20 shadow-lg">
            
            {/* Subtle Atmospheric Geometric Depth (Non-distracting, pure CSS) */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-[50px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-indigo-500/10 blur-[40px] pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-sky-400/10 blur-[40px] pointer-events-none" />

            {/* Top Brand Logo & Title (Anti-AI Slop: Clean, Authoritative, Zero Pills) */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <OfficialPsksLogo logoUrl={logoUrl} sizeClassName="w-14 h-14 mb-2 drop-shadow-md" />
              <span className="text-sm font-black tracking-widest text-white uppercase drop-shadow-xs">
                PSKS JABAR
              </span>
              <span className="text-[10px] text-blue-200/90 font-medium tracking-wide mt-0.5">
                Dinas Sosial Provinsi Jawa Barat
              </span>
            </div>

            {/* Middle Welcome Statement */}
            <div className="relative z-10 my-auto py-2 text-center flex flex-col items-center">
              <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-xs">
                Welcome Back!
              </h2>
              <p className="text-[11px] lg:text-[12px] text-blue-100 font-medium leading-relaxed max-w-xs mx-auto mb-4">
                Potensi & Sumber Kesejahteraan Sosial Provinsi Jawa Barat
              </p>

              {/* Dynamic Left Action Button (Architectural rounded-xl, Zero-Pill) */}
              {view === 'main' ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setView('register');
                  }}
                  className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>Daftar Akun Baru</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setView('main');
                  }}
                  className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-100" />
                  <span>Menu Utama</span>
                </button>
              )}
            </div>

            {/* Bottom Sub-Links */}
            <div className="relative z-10 pt-2 border-t border-white/15 text-center">
              <p className="text-[8.5px] text-blue-200/80 font-bold tracking-widest uppercase">
                DINAS SOSIAL PROVINSI JAWA BARAT
              </p>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: FORM / MOBILE INTRO SECTION ================= */}
          <div className={`w-full md:w-[62%] lg:w-[60%] ${showMobileIntro && view === 'main' ? 'max-md:bg-gradient-to-br max-md:from-[#143b7d] max-md:via-[#0f2b5c] max-md:to-[#091f42] max-md:text-white bg-white text-slate-800' : 'bg-white text-slate-800'} px-3.5 pt-3 pb-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 flex flex-col justify-between relative overflow-hidden flex-1 min-h-0 h-full transition-colors duration-300`}>
            
            {/* Top Right Curved Blue Accent Wave */}
            <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full ${showMobileIntro && view === 'main' ? 'max-md:bg-blue-400/15 bg-blue-600/10' : 'bg-blue-600/10'} pointer-events-none`} />
            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${showMobileIntro && view === 'main' ? 'max-md:bg-[#d4af37]/10 bg-blue-700/15' : 'bg-blue-700/15'} pointer-events-none`} />

            {/* ========================================================================= */}
            {/* KHUSUS TAMPILAN HP: LAPISAN PERTAMA (INTRO BIRU SELAMAT DATANG & BUTTON MULAI) */}
            {/* ========================================================================= */}
            {showMobileIntro && view === 'main' && (
              <div className="md:hidden relative z-10 flex-1 min-h-0 flex flex-col justify-between items-center text-center pt-2 pb-1 px-1 animate-fadeIn text-white h-full">
                {/* Bagian Atas: Logo Resmi & Identitas Bersih (Anti-AI Slop, Zero Pill) */}
                <div className="flex flex-col items-center pt-2">
                  <OfficialPsksLogo logoUrl={logoUrl} sizeClassName="w-14 h-14 mb-2 drop-shadow-lg" />
                  <span className="text-sm font-black tracking-widest text-white uppercase drop-shadow-xs">
                    PSKS JABAR
                  </span>
                  <span className="text-[10px] font-semibold text-blue-200/90 tracking-wide mt-0.5">
                    Dinas Sosial Provinsi Jawa Barat
                  </span>
                </div>

                {/* Bagian Tengah: Teks Sambutan & Identitas Sistem Bersih */}
                <div className="my-auto py-3 flex flex-col items-center">
                  <h2 className="text-2xl font-black text-white tracking-tight leading-tight mb-1.5">
                    Selamat Datang
                  </h2>
                  <p className="text-xs font-medium text-blue-100 leading-relaxed max-w-[280px] px-2 mb-2">
                    Potensi & Sumber Kesejahteraan Sosial Provinsi Jawa Barat
                  </p>
                  <p className="text-[10px] text-blue-200/80 font-medium tracking-wide">
                    Integrasi Satu Data & Verifikasi Pilar Sosial Se-Jawa Barat
                  </p>
                </div>

                {/* Bagian Bawah: Button MULAI & Copyright Lapisan 1 (Satu-Satunya) */}
                <div className="w-full space-y-2 pt-1 pb-1">
                  <button
                    type="button"
                    id="btn-mobile-intro-mulai"
                    onClick={() => setShowMobileIntro(false)}
                    className="w-full min-h-[46px] py-2.5 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3d978] to-[#d4af37] hover:brightness-105 active:scale-95 text-[#043e2e] font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 border-2 border-amber-300 transition-all cursor-pointer select-none"
                  >
                    <span>MULAI</span>
                    <ArrowRight className="w-5 h-5 text-[#043e2e] stroke-[2.5]" />
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[8.5px] text-blue-200/80 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Portal Resmi Terverifikasi • 27 Kab/Kota</span>
                  </div>
                  {/* Copyright Resmi Lapisan 1 (Satu-Satunya) - Terangkat dan Tidak Terpotong */}
                  <div className="pt-1.5 pb-1 border-t border-blue-400/25 w-full">
                    <p className="text-[7.5px] sm:text-[8.5px] text-blue-100 font-semibold tracking-tight text-center leading-snug break-words px-1">
                      © Dinas Sosial Provinsi Jawa Barat ( Developer By Ilham Fazril ) Hak Cipta Dilindungi Undang-Undang
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Header Greeting inside White Area */}
            <div className={`relative z-10 text-center mb-1 sm:mb-2 shrink-0 ${showMobileIntro && view === 'main' ? 'hidden md:block' : 'block'}`}>
              <h3 className="text-sm sm:text-xl font-black text-[#0f2b5c] tracking-tight text-center">
                {view === 'main' && 'Selamat Datang'}
                {view === 'register' && 'Daftar Akun Baru'}
                {view === 'login_choice' && 'Pilih Metode Masuk'}
                {view === 'login_manual' && 'Masuk Akun'}
                {view === 'login_smart_card' && 'Smart Card Login'}
                {view === 'guest' && 'Akses Tamu Publik'}
                {view === 'forgot_password' && 'Lupa Kata Sandi'}
                {view === 'forgot_password_status' && 'Status Pemulihan Akun'}
              </h3>
              <p className="text-[9.5px] sm:text-xs text-slate-700 font-semibold mt-0.5">
                {view === 'main' && 'Pilih jalur akses portal untuk melanjutkan'}
                {view === 'register' && 'Buat akun user baru untuk akses data wilayah'}
                {view === 'login_choice' && 'Pilih metode otentikasi masuk ke akun Anda'}
                {view === 'login_manual' && 'Masukkan kredensial akun terdaftar Anda'}
                {view === 'login_smart_card' && 'Otorisasi instan menggunakan Smart Card'}
                {view === 'guest' && 'Pilih wilayah Jawa Barat untuk akses mode tamu'}
                {view === 'forgot_password' && 'Verifikasi NIK dan WhatsApp resmi untuk reset sandi'}
                {view === 'forgot_password_status' && 'Pantau persetujuan tiket reset sandi secara realtime'}
              </p>
            </div>

            {/* Center Animated Form Container (Strictly fits without scrollbar) */}
            <div className={`relative z-10 flex-1 min-h-0 flex flex-col justify-center overflow-hidden px-0.5 ${showMobileIntro && view === 'main' ? 'hidden md:flex' : 'flex'}`}>
              
                {/* ========================================================================= */}
                {/* LAYAR UTAMA (3 JALUR UTAMA SEJAJAR) */}
                {/* ========================================================================= */}
                {view === 'main' && (
                  <div
                    key="view-main"
                    className="space-y-1.5 sm:space-y-2 my-auto animate-scaleUp"
                  >

                    {/* JALUR 1: TOMBOL DAFTAR AKUN BARU (DENGAN LOGIKA 4 KONDISI CERDAS PER-IP) */}
                    <button
                      type="button"
                      id="btn-jalur-daftar-akun-baru"
                      onClick={handleDaftarAkunBaruClick}
                      className="relative w-full group text-left px-3 py-2 sm:px-3.5 sm:py-2.5 h-[72px] sm:h-[78px] rounded-xl sm:rounded-2xl bg-blue-50/90 hover:bg-blue-100 border-2 border-blue-500/40 hover:border-blue-600 transition-all duration-200 shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-2.5 sm:gap-3 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-[#0f2b5c] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
                      </div>
                      <div className="flex-1 min-w-0 pr-22 sm:pr-26 flex flex-col justify-center">
                        <span className="text-xs sm:text-sm font-black text-[#0f2b5c] group-hover:text-blue-950 truncate block">
                          Daftar Akun Baru
                        </span>
                        <p className="text-[9px] sm:text-[10.5px] text-slate-600 font-medium leading-tight mt-0.5 line-clamp-2">
                          {!clientRegisteredAccount
                            ? 'Registrasi mandiri 1 akun per perangkat untuk warga & personil potensi sosial Jabar.'
                            : clientRegisteredAccount.statusVerval === 'DISETUJUI' || clientRegisteredAccount.statusActive === 'SAH_TERDAFTAR'
                            ? `Akun "${clientRegisteredAccount.username}" telah disahkan di perangkat ini. Klik untuk masuk.`
                            : clientRegisteredAccount.statusVerval === 'DITOLAK'
                            ? `Pendaftaran "${clientRegisteredAccount.username}" ditolak. Klik untuk daftar ulang.`
                            : `Pengajuan "${clientRegisteredAccount.username}" sedang ditinjau Superadmin.`}
                        </p>
                      </div>
                      {/* Pinned Corner Badge */}
                      <span className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 text-[7.5px] sm:text-[8px] font-black px-2 py-0.5 rounded-full uppercase whitespace-nowrap shadow-xs tracking-tight ${
                        !clientRegisteredAccount
                          ? 'bg-blue-200 text-blue-900 border border-blue-300/50'
                          : clientRegisteredAccount.statusVerval === 'DISETUJUI' || clientRegisteredAccount.statusActive === 'SAH_TERDAFTAR'
                          ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                          : clientRegisteredAccount.statusVerval === 'DITOLAK'
                          ? 'bg-rose-200 text-rose-950 border border-rose-300'
                          : 'bg-amber-200 text-amber-950 border border-amber-300'
                      }`}>
                        {!clientRegisteredAccount ? '1 Akun / Perangkat' : clientRegisteredAccount.statusVerval === 'DISETUJUI' || clientRegisteredAccount.statusActive === 'SAH_TERDAFTAR' ? 'Terverifikasi' : clientRegisteredAccount.statusVerval === 'DITOLAK' ? 'Ditolak' : 'Menunggu Verval'}
                      </span>
                    </button>

                    {/* JALUR 2: TOMBOL MASUK KE AKUN */}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setView('login_choice');
                      }}
                      className="relative w-full group text-left px-3 py-2 sm:px-3.5 sm:py-2.5 h-[72px] sm:h-[78px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#143b7d] to-[#0f2b5c] hover:from-[#1a4a9c] hover:to-[#0d2d5e] text-white border-2 border-[#d4af37]/60 hover:border-[#d4af37] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2.5 sm:gap-3 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#d4af37] text-[#0f2b5c] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0 font-black">
                        <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-16 sm:pr-20 flex flex-col justify-center">
                        <span className="text-xs sm:text-sm font-black text-amber-200 group-hover:text-white truncate block">
                          Masuk ke Akun
                        </span>
                        <p className="text-[9px] sm:text-[10.5px] text-blue-100 font-medium leading-tight mt-0.5 line-clamp-2">
                          Login/Masuk ke akun yang sudah terdaftar
                        </p>
                      </div>
                      {/* Pinned Corner Badge */}
                      <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 text-[7.5px] sm:text-[8px] font-black bg-[#d4af37] text-[#0f2b5c] px-2 py-0.5 rounded-full uppercase whitespace-nowrap shadow-xs tracking-normal">
                        Login
                      </span>
                    </button>

                    {/* PEMISAH ELEGAN DENGAN TEKS 'ATAU' */}
                    <div className="relative flex items-center justify-center py-0.5 sm:py-1">
                      <div className="flex-grow border-t border-slate-300"></div>
                      <div className="flex-shrink mx-2 sm:mx-3 flex items-center gap-1 bg-slate-200 text-slate-800 font-black text-[8.5px] sm:text-[10px] uppercase tracking-widest px-2.5 py-0.2 sm:px-3 sm:py-0.5 rounded-full border border-slate-300 shadow-2xs">
                        <span>ATAU</span>
                      </div>
                      <div className="flex-grow border-t border-slate-300"></div>
                    </div>

                    {/* JALUR 3: TOMBOL LANJUTKAN SEBAGAI TAMU */}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setView('guest');
                      }}
                      className="relative w-full group text-left px-3 py-2 sm:px-3.5 sm:py-2.5 h-[72px] sm:h-[78px] rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-amber-50/70 border-2 border-dashed border-slate-300 hover:border-amber-400 transition-all duration-200 shadow-xs cursor-pointer flex items-center gap-2.5 sm:gap-3 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-200 group-hover:bg-amber-200 text-slate-700 group-hover:text-[#0f2b5c] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <Globe2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-20 sm:pr-24 flex flex-col justify-center">
                        <span className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-[#0f2b5c] truncate block">
                          Lanjutkan Sebagai Tamu
                        </span>
                        <p className="text-[9px] sm:text-[10.5px] text-slate-700 font-medium leading-tight mt-0.5 line-clamp-2">
                          Akses publik instan untuk membaca grafik & data PSKS tanpa password.
                        </p>
                      </div>
                      {/* Pinned Corner Badge */}
                      <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 text-[7.5px] sm:text-[8px] font-black bg-amber-200/90 text-[#0f2b5c] px-2 py-0.5 rounded-full uppercase border border-amber-300 whitespace-nowrap shadow-xs tracking-normal">
                        Tanpa Login
                      </span>
                    </button>

                  </div>
                )}

                {/* ========================================================================= */}
                {/* JALUR 1: FORMULIR PENDAFTARAN AKUN USER BARU */}
                {/* ========================================================================= */}
                {view === 'register' && (
                  <form
                    key="view-register"
                    onSubmit={handleRegisterSubmit}
                    className="space-y-1.5 sm:space-y-1.5 my-auto animate-scaleUp"
                  >
                    {/* Bot Honeypot Trap (Completely hidden from humans, traps automated scrapers & bots) */}
                    <div className="opacity-0 absolute -left-[9999px] -top-[9999px] h-0 w-0 pointer-events-none select-none overflow-hidden" aria-hidden="true" tabIndex={-1}>
                      <label htmlFor="reg-honeypot-trap">Do not fill this field</label>
                      <input
                        type="text"
                        id="reg-honeypot-trap"
                        name="website_url_verification"
                        tabIndex={-1}
                        autoComplete="off"
                        value={regHoneypot}
                        onChange={(e) => setRegHoneypot(e.target.value)}
                      />
                    </div>

                    {/* Device / IP Quota Info Badge */}
                    <div className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-1.5 text-[9.5px] font-black ${
                      isDeviceQuotaFull 
                        ? 'bg-rose-50 border-rose-300 text-rose-800' 
                        : 'bg-blue-50/90 border-blue-300 text-[#0f2b5c]'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <Laptop className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                        <span className="whitespace-nowrap">Batas Kuota Pendaftaran:</span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[8px] bg-blue-100 text-blue-800 rounded font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                          1 Akun per IP
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 shadow-xs ${
                        isDeviceQuotaFull
                          ? 'bg-rose-600 text-white'
                          : 'bg-blue-800 text-white'
                      }`}>
                        {deviceRegisteredAccounts.length}/1 Akun {isDeviceQuotaFull ? '(Penuh)' : '(Tersedia 1)'}
                      </span>
                    </div>

                    {/* Alert Error / Success */}
                    {errorMessage && (
                      <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-[10px] font-bold flex items-start gap-1.5 shadow-xs">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                        <span className="flex-1 leading-tight">{errorMessage}</span>
                      </div>
                    )}

                    {regSuccess && (
                      <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-[10px] font-black flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {/* Input 1: Username */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5">
                        Username Baru
                      </label>
                      <div className="relative">
                        <input
                          ref={regUsernameRef}
                          type="text"
                          disabled={isDeviceQuotaFull || isRegistering}
                          placeholder="Masukkan Username Akun"
                          value={regUsername}
                          onChange={(e) => {
                            setRegUsername(e.target.value);
                            setErrorMessage('');
                          }}
                          className="w-full bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] rounded-full px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40 disabled:opacity-60"
                        />
                        <User className="w-3 h-3 text-blue-700/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Input 1.2: NIK Kependudukan (16 Digit Wajib) */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5 flex items-center justify-between">
                        <span>NIK Kependudukan (16 Digit)</span>
                        <span className={`text-[8px] font-bold ${regNik.length === 16 ? 'text-emerald-700' : 'text-blue-700'}`}>
                          {regNik.length === 16 ? '✓ 16 Digit Lengkap' : `${regNik.length}/16 Digit`}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={16}
                          disabled={isDeviceQuotaFull || isRegistering}
                          placeholder="Masukkan 16 digit NIK KTP Anda"
                          value={regNik}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setRegNik(val);
                            setErrorMessage('');
                          }}
                          className="w-full bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] rounded-full px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40 disabled:opacity-60"
                        />
                        <CreditCard className="w-3 h-3 text-blue-700/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Input 1.3: Nomor WhatsApp Aktif */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5 flex items-center justify-between">
                        <span>Nomor WhatsApp Aktif</span>
                        <span className="text-[8px] text-blue-700 font-bold">Untuk konfirmasi & lupa sandi</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          inputMode="tel"
                          disabled={isDeviceQuotaFull || isRegistering}
                          placeholder="Contoh: 081234567890"
                          value={regNoWhatsapp}
                          onChange={(e) => {
                            setRegNoWhatsapp(e.target.value);
                            setErrorMessage('');
                          }}
                          className="w-full bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] rounded-full px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40 disabled:opacity-60"
                        />
                        <Phone className="w-3 h-3 text-blue-700/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Input 2: Password */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5 flex items-center justify-between">
                        <span>Kata Sandi (Password)</span>
                        <span className="text-[8px] text-blue-700 font-bold">Min. 8 karakter (Besar, Kecil, Angka)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          disabled={isDeviceQuotaFull || isRegistering}
                          placeholder="Contoh: JabarSejahtera2026"
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            setErrorMessage('');
                          }}
                          className="w-full bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] rounded-full px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40 disabled:opacity-60"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          aria-label={showRegPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700/60 hover:text-blue-900 cursor-pointer"
                          title={showRegPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                        >
                          {showRegPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Input 2.5: Konfirmasi Kata Sandi (Confirm Password) */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5 flex items-center justify-between">
                        <span>Konfirmasi Kata Sandi</span>
                        {regConfirmPassword && (
                          <span className={`text-[8px] font-black ${regPassword === regConfirmPassword ? 'text-blue-700' : 'text-rose-600'}`}>
                            {regPassword === regConfirmPassword ? '✓ Sandi Cocok' : '✗ Belum Cocok'}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          disabled={isDeviceQuotaFull || isRegistering}
                          placeholder="Ketik ulang kata sandi di atas"
                          value={regConfirmPassword}
                          onChange={(e) => {
                            setRegConfirmPassword(e.target.value);
                            setErrorMessage('');
                          }}
                          className={`w-full bg-blue-50/60 focus:bg-white border rounded-full px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40 disabled:opacity-60 ${
                            regConfirmPassword
                              ? regPassword === regConfirmPassword
                                ? 'border-blue-500 focus:border-blue-600'
                                : 'border-rose-400 focus:border-rose-500'
                              : 'border-blue-300/80 focus:border-[#0f2b5c]'
                          }`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          aria-label={showRegConfirmPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700/60 hover:text-blue-900 cursor-pointer"
                          title={showRegConfirmPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                        >
                          {showRegConfirmPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Compact Password Criteria Indicators */}
                    <div className="grid grid-cols-4 gap-1 pt-0.5 text-[7.5px] font-black leading-none">
                      <div className={`p-1 rounded-md text-center border ${
                        regPassword.length >= 8 ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {regPassword.length >= 8 ? '✓' : '•'} 8+ Huruf
                      </div>
                      <div className={`p-1 rounded-md text-center border ${
                        /[A-Z]/.test(regPassword) ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {/[A-Z]/.test(regPassword) ? '✓' : '•'} Huruf Besar
                      </div>
                      <div className={`p-1 rounded-md text-center border ${
                        /[a-z]/.test(regPassword) ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {/[a-z]/.test(regPassword) ? '✓' : '•'} Huruf Kecil
                      </div>
                      <div className={`p-1 rounded-md text-center border ${
                        /[0-9]/.test(regPassword) ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {/[0-9]/.test(regPassword) ? '✓' : '•'} Angka 0-9
                      </div>
                    </div>

                    {/* Input 3: Dropdown Pilihan Alamat / Wilayah */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5 flex items-center justify-between">
                        <span>Pilihan Alamat / Wilayah</span>
                        <span className="text-[8px] text-blue-700 font-bold">27 Kab / Kota Jabar</span>
                      </label>
                      <div className="relative">
                        <select
                          disabled={isDeviceQuotaFull || isRegistering}
                          value={selectedRegisterRegion}
                          onChange={(e) => {
                            setSelectedRegisterRegion(e.target.value);
                            setErrorMessage('');
                          }}
                          className={`w-full bg-blue-50/60 focus:bg-white border rounded-full px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none transition-all cursor-pointer appearance-none disabled:opacity-60 ${
                            selectedRegisterRegion === ''
                              ? 'border-blue-400 text-slate-700'
                              : 'border-[#0f2b5c] text-[#0f2b5c] font-black'
                          }`}
                        >
                          <option value="" disabled>
                            -- Silakan Pilih Wilayah Kabupaten / Kota --
                          </option>
                          {KAB_KOTA_ONLY.map((kota) => (
                            <option key={kota} value={kota}>
                              {kota}
                            </option>
                          ))}
                        </select>
                        <Globe2 className="w-3 h-3 text-blue-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-0.5 space-y-1">
                      <button
                        type="submit"
                        disabled={isDeviceQuotaFull || isRegistering}
                        className={`w-full py-1.5 font-black rounded-full text-xs shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 ${
                          isDeviceQuotaFull
                            ? 'bg-slate-300 text-slate-700 cursor-not-allowed border border-slate-300'
                            : 'bg-[#0f2b5c] hover:bg-[#143b7d] text-white shadow-blue-950/20 cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                        }`}
                      >
                        {isRegistering ? (
                          <span>Mendaftarkan Akun...</span>
                        ) : isDeviceQuotaFull ? (
                          <span>Pendaftaran IP / Perangkat Dikunci (1 Akun Terdaftar)</span>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-[#d4af37]" />
                            <span>Daftar Sekarang</span>
                          </>
                        )}
                      </button>

                      {registrationTicket && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage('');
                            setView('register_status');
                          }}
                          className="w-full py-1 text-blue-900 hover:text-blue-950 font-bold text-[9.5px] text-center cursor-pointer hover:underline block"
                        >
                          Sudah pernah mendaftar? Klik di sini untuk pantau status verval akun →
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setView('main');
                        }}
                        className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Kembali ke Menu Utama</span>
                      </button>
                    </div>

                  </form>
                )}

                {/* ========================================================================= */}
                {/* JALUR 1B: HALAMAN INFORMASI PENDAFTARAN AKUN (STATUS VERVAL REALTIME) */}
                {/* ========================================================================= */}
                {view === 'register_status' && (() => {
                  const currentStatus = liveRegisteredAccount
                    ? (liveRegisteredAccount.statusVerval || (liveRegisteredAccount.statusActive === 'SAH_TERDAFTAR' ? 'DISETUJUI' : 'MENUNGGU_VERIFIKASI'))
                    : 'MENUNGGU_VERIFIKASI';
                  const isPending = currentStatus === 'MENUNGGU_VERIFIKASI';
                  const isApproved = currentStatus === 'DISETUJUI';
                  const isRejected = currentStatus === 'DITOLAK';

                  const ticketNo = registrationTicket?.noRegistrasi || liveRegisteredAccount?.noRegistrasi || 'REG-PSKS-PENDING';
                  const uname = registrationTicket?.username || liveRegisteredAccount?.username || regUsername || 'User Baru';
                  const wil = registrationTicket?.wilayah || liveRegisteredAccount?.wilayahTugas || selectedRegisterRegion || 'Jawa Barat';
                  const waktuDaftar = registrationTicket?.waktuPendaftaran || liveRegisteredAccount?.tanggalPendaftaranFormatted || liveRegisteredAccount?.waktuPendaftaran || 'Baru Saja';

                  return (
                    <div
                      key="view-register-status"
                      className="space-y-2.5 my-auto animate-scaleUp text-left"
                    >
                      {/* HEADER KOP KECIL */}
                      <div className="text-center space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0f2b5c] text-[9.5px] font-black tracking-wide border border-blue-200">
                          <Radio className="w-3 h-3 text-blue-700 animate-pulse" />
                          <span>STATUS VERVAL AKUN REALTIME</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-[#0f2b5c] leading-tight">
                          Informasi Pendaftaran Akun
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Data pendaftaran Anda tersinkronisasi langsung ke Superadmin Provinsi.
                        </p>
                      </div>

                      {/* STATUS BANNER BOX SECARA REALTIME */}
                      {isPending && (
                        <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-xs relative overflow-hidden space-y-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                              <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-black text-amber-900 leading-tight">
                                  Menunggu Verifikasi & Validasi
                                </h4>
                                <span className="inline-flex items-center gap-1 bg-amber-200 text-amber-950 text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                  <span>Sedang Ditinjau</span>
                                </span>
                              </div>
                              <p className="text-[10.5px] text-amber-900 font-medium leading-relaxed mt-1">
                                Saat ini Anda telah mengajukan pendaftaran akun atas nama <strong className="text-slate-900 font-black">{uname}</strong> ({wil}) dan sedang dalam proses verifikasi & validasi oleh Superadmin Dinas Sosial Provinsi Jawa Barat.
                              </p>
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-amber-100/90 border border-amber-300 text-[10px] text-amber-950 font-semibold flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                            <span className="leading-tight">
                              <strong>Pemberitahuan Sistem:</strong> Karena saat ini Anda telah mengajukan pendaftaran akun yang sedang dalam proses verifikasi pada perangkat ini, saat ini Anda <strong>tidak bisa melakukan proses pendaftaran akun</strong> baru lagi (Pembatasan 1 Akun per Perangkat).
                            </span>
                          </div>

                          <div className="bg-amber-100/60 rounded-xl p-1.5 border border-amber-200 text-[9.5px] text-amber-900 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>
                              <strong>Live Realtime:</strong> Layar ini otomatis berganti detik ini juga begitu disetujui atau ditolak tanpa refresh.
                            </span>
                          </div>
                        </div>
                      )}

                      {isApproved && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-md relative overflow-hidden space-y-2.5 animate-fadeIn">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <CheckCircle2 className="w-5 h-5 animate-bounce" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs sm:text-sm font-black text-emerald-900 leading-tight">
                                  Pendaftaran Akun Diterima & Disahkan!
                                </h4>
                                <span className="inline-flex items-center gap-1 bg-emerald-200 text-emerald-950 text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                  <span>SAH TERDAFTAR</span>
                                </span>
                              </div>
                              <p className="text-[10.5px] text-emerald-900 font-medium leading-relaxed mt-1">
                                🎉 <strong>Selamat!</strong> Pendaftaran akun atas nama <strong className="text-emerald-950 font-black">{uname}</strong> sudah diterima dan resmi disahkan oleh Superadmin Dinas Sosial Provinsi Jawa Barat.
                              </p>
                              <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                                Akun Anda kini aktif untuk wilayah <strong>{wil}</strong>. Silakan klik tombol di bawah untuk masuk ke akun Anda.
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/80 rounded-xl p-2 border border-emerald-300 text-[10px] text-emerald-950 flex items-center justify-between">
                            <span>Kode Pendaftaran: <code className="font-mono font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">{ticketNo}</code></span>
                            <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">AKUN AKTIF</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              setUsernameInput(uname);
                              setPasswordInput('');
                              setView('login_manual');
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Masuk Ke Akun</span>
                          </button>
                        </div>
                      )}

                      {isRejected && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950 shadow-md relative overflow-hidden space-y-2.5 animate-fadeIn">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <XCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs sm:text-sm font-black text-rose-950 leading-tight">
                                  Pendaftaran Akun Ditolak
                                </h4>
                                <span className="inline-flex items-center gap-1 bg-rose-200 text-rose-950 text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                  <span>DITOLAK</span>
                                </span>
                              </div>
                              <p className="text-[10.5px] text-rose-900 font-medium leading-relaxed mt-1">
                                Mohon maaf yang sebesar-besarnya, pengajuan pendaftaran akun atas nama <strong className="text-rose-950 font-black">{uname}</strong> belum dapat kami setujui oleh Superadmin Dinas Sosial Provinsi Jawa Barat.
                              </p>
                              <div className="mt-1.5 p-2 rounded-xl bg-white border border-rose-200 text-[10.5px] text-rose-900 font-semibold shadow-2xs">
                                <span className="text-[9px] font-black uppercase text-rose-700 block mb-0.5">Catatan Alasan Penolakan:</span>
                                &quot;{liveRegisteredAccount?.alasanPenolakan || 'Data yang diajukan belum memenuhi persyaratan verifikasi wilayah.'}&quot;
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/80 rounded-xl p-2 border border-rose-200 text-[10px] text-rose-950 flex items-center justify-between">
                            <span>Kode Pendaftaran: <code className="font-mono font-black text-rose-900 bg-rose-100 px-1.5 py-0.5 rounded">{ticketNo}</code></span>
                            <span className="text-[9px] font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">STATUS DITOLAK</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              // Reset data pendaftaran lama yang ditolak agar form bersih untuk pendaftaran ulang
                              setRegistrationTicket(null);
                              try {
                                localStorage.removeItem('psks_latest_user_registration_ticket');
                              } catch {}
                              setRegUsername('');
                              setRegPassword('');
                              setRegConfirmPassword('');
                              setSelectedRegisterRegion('');
                              setView('register');
                            }}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Daftar Ulang</span>
                          </button>
                        </div>
                      )}

                      {/* DETAIL CARD INFORMASI PENDAFTARAN */}
                      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            No. Tiket Pendaftaran
                          </span>
                          <div className="flex items-center gap-1.5">
                            <code className="text-[10.5px] font-mono font-black text-[#0f2b5c] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {ticketNo}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyTicket(ticketNo)}
                              className="px-1.5 py-0.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer flex items-center gap-1 transition-all"
                              title="Salin Nomor Registrasi"
                            >
                              {ticketCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-[9px] font-bold text-emerald-600">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span className="text-[9px] font-semibold text-slate-500">Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="block text-[9.5px] font-bold text-slate-400 uppercase">Username</span>
                            <span className="font-black text-slate-900 text-[11px] truncate block">{uname}</span>
                          </div>
                          <div>
                            <span className="block text-[9.5px] font-bold text-slate-400 uppercase">Wilayah Domisili</span>
                            <span className="font-black text-[#0f2b5c] text-[11px] truncate block">{wil}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[9.5px] font-bold text-slate-400 uppercase">Waktu Pengajuan</span>
                            <span className="font-semibold text-slate-700 text-[10.5px] block">{waktuDaftar}</span>
                          </div>
                        </div>
                      </div>

                      {/* TOMBOL AKSI KEMBALI */}
                      <div className="pt-1 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage('');
                            setView('main');
                          }}
                          className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Kembali ke Menu Utama</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* ========================================================================= */}
                {/* JALUR 2: PILIHAN METODE MASUK (LOGIN CHOICE) */}
                {/* ========================================================================= */}
                {view === 'login_choice' && (
                  <div
                    key="view-login-choice"
                    className="space-y-2 my-auto animate-scaleUp"
                  >
                    
                    {/* PILIHAN A: LOGIN MANUAL */}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setView('login_manual');
                      }}
                      className="relative w-full group text-left px-3 py-2 sm:px-3.5 sm:py-2.5 h-[72px] sm:h-[78px] rounded-xl sm:rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-600/40 hover:border-blue-600 transition-all duration-200 shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-2.5 sm:gap-3 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0f2b5c] text-[#d4af37] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0 font-black">
                        <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-20 sm:pr-24 flex flex-col justify-center">
                        <span className="text-xs sm:text-sm font-black text-[#0f2b5c] truncate block">
                          Masuk Ke Akun Anda
                        </span>
                        <p className="text-[9px] sm:text-[10.5px] text-slate-600 font-medium leading-tight mt-0.5 line-clamp-2">
                          Login manual dengan Username, Password, dan Verifikasi Cloudflare.
                        </p>
                      </div>
                      {/* Pinned Corner Badge */}
                      <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 text-[7.5px] sm:text-[8px] font-black bg-blue-200 text-[#0f2b5c] px-2 py-0.5 rounded-full uppercase whitespace-nowrap shadow-xs tracking-normal">
                        User & Admin
                      </span>
                    </button>

                    {/* PILIHAN B: MASUK MENGGUNAKAN SMART CARD */}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setView('login_smart_card');
                      }}
                      className="relative w-full group text-left px-3 py-2 sm:px-3.5 sm:py-2.5 h-[72px] sm:h-[78px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#0f2b5c] hover:from-black hover:to-slate-900 text-white border-2 border-[#d4af37] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2.5 sm:gap-3 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#d4af37] text-[#0f2b5c] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0 font-black">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-20 sm:pr-24 flex flex-col justify-center">
                        <span className="text-xs sm:text-sm font-black text-amber-200 group-hover:text-white flex items-center gap-1 truncate block">
                          <span>Smart Card</span>
                          <Sparkles className="w-3 h-3 text-[#d4af37] inline shrink-0" />
                        </span>
                        <p className="text-[9px] sm:text-[10.5px] text-slate-300 font-medium leading-tight mt-0.5 line-clamp-2">
                          Scan Kode QR / Tap Kartu Akses Khusus
                        </p>
                      </div>
                      {/* Pinned Corner Badge */}
                      <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 text-[7.5px] sm:text-[8px] font-black bg-[#d4af37] text-[#0f2b5c] px-2 py-0.5 rounded-full uppercase whitespace-nowrap shadow-xs tracking-normal">
                        Superadmin
                      </span>
                    </button>

                    {/* Tombol Kembali ke Menu Utama */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setView('main');
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Kembali ke Menu Utama</span>
                      </button>
                    </div>

                  </div>
                )}

                {/* ========================================================================= */}
                {/* JALUR 2 -> PILIHAN A: FORM LOGIN MANUAL */}
                {/* ========================================================================= */}
                {view === 'login_manual' && (
                  <form
                    key="view-login-manual"
                    onSubmit={handleLoginSubmit}
                    className="space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-center min-h-0 py-0.5 animate-scaleUp"
                  >
                    {/* Bot Honeypot Trap (Completely hidden from humans, traps automated bot attempts) */}
                    <div className="opacity-0 absolute -left-[9999px] -top-[9999px] h-0 w-0 pointer-events-none select-none overflow-hidden" aria-hidden="true" tabIndex={-1}>
                      <label htmlFor="login-honeypot-trap">Do not fill this field</label>
                      <input
                        type="text"
                        id="login-honeypot-trap"
                        name="company_fax_verification"
                        tabIndex={-1}
                        autoComplete="off"
                        value={loginHoneypot}
                        onChange={(e) => setLoginHoneypot(e.target.value)}
                      />
                    </div>
                    
                    {/* Rate Limiting & Account Lockout Banner */}
                    {lockoutRemaining > 0 && (
                      <div className="bg-gradient-to-r from-red-700 via-rose-800 to-red-900 text-white p-2 rounded-xl shadow-md border border-red-400 animate-pulse">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-[10px] uppercase tracking-wider text-amber-200">
                                ⏳ AKUN DIBEKUKAN SEMENTARA
                              </span>
                              <span className="text-[10px] font-extrabold bg-black/40 px-1.5 py-0.2 rounded-full border border-amber-300">
                                {lockoutRemaining}s
                              </span>
                            </div>
                            <p className="text-[9px] text-rose-100 font-medium leading-tight">
                              Terlalu banyak percobaan kredensial salah. Sistem mengunci otentikasi.
                            </p>
                          </div>
                        </div>
                        {/* Lockout Progress Bar */}
                        <div className="w-full bg-black/40 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.min(100, (lockoutRemaining / 30) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rate Limiting Real-Time Security Health & Progress Bar (Yellow -> Red Transition) */}
                    {lockoutRemaining === 0 && (
                      <div
                        className={`p-1.5 rounded-xl border transition-all duration-300 shadow-xs ${
                          failedAttempts === 0
                            ? 'bg-emerald-50/80 border-emerald-300/80 text-emerald-950'
                            : failedAttempts === 1
                            ? 'bg-amber-50/90 border-amber-400 text-amber-950 shadow-amber-200/50'
                            : 'bg-rose-50 border-rose-500 text-rose-950 shadow-rose-200/50 animate-pulse'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {failedAttempts === 0 && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {failedAttempts === 1 && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            {failedAttempts >= 2 && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />}

                            <span className="text-[9.5px] sm:text-[10px] font-black tracking-tight truncate">
                              {failedAttempts === 0 && 'Status Keamanan: 3/3 Kesempatan (Aman)'}
                              {failedAttempts === 1 && 'Peringatan: Sisa 2 Kesempatan Login'}
                              {failedAttempts >= 2 && '🚨 KRITIS: Sisa 1 Kesempatan Terakhir!'}
                            </span>
                          </div>

                          <span
                            className={`text-[8px] sm:text-[8.5px] font-black px-1.5 py-0.2 rounded-full uppercase border shrink-0 ${
                              failedAttempts === 0
                                ? 'bg-emerald-200 text-emerald-900 border-emerald-300'
                                : failedAttempts === 1
                                ? 'bg-amber-200 text-amber-950 border-amber-400 font-extrabold'
                                : 'bg-rose-600 text-white border-rose-700 animate-bounce'
                            }`}
                          >
                            {failedAttempts === 0 ? 'Normal' : failedAttempts === 1 ? 'Waspada' : 'Pembekuan Dekat'}
                          </span>
                        </div>

                        {/* Visual Step Progress Bar with Dynamic Color Gradient (Green -> Yellow -> Red) */}
                        <div className="space-y-0.5">
                          <div className="grid grid-cols-3 gap-1 h-1.5 w-full bg-slate-200/80 rounded-full p-0.5">
                            {/* Slot 1 (Critical remaining attempt) */}
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                failedAttempts <= 2
                                  ? failedAttempts === 0
                                    ? 'bg-emerald-500'
                                    : failedAttempts === 1
                                    ? 'bg-amber-500'
                                    : 'bg-rose-600 animate-pulse'
                                  : 'bg-slate-300'
                              }`}
                            />
                            {/* Slot 2 */}
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                failedAttempts <= 1
                                  ? failedAttempts === 0
                                    ? 'bg-emerald-500'
                                    : 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                            {/* Slot 3 */}
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                failedAttempts === 0 ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                          </div>

                          {failedAttempts > 0 && (
                            <div className="flex items-center justify-between text-[8px] font-bold px-0.5 pt-0.5">
                              <span className={failedAttempts >= 2 ? 'text-rose-700 font-black' : 'text-amber-800'}>
                                {failedAttempts >= 2
                                  ? '*1x salah lagi, akun otomatis dibekukan sementara!'
                                  : '*Gunakan kredensial yang valid untuk menghindari pembekuan akun.'}
                              </span>
                              <span className={failedAttempts >= 2 ? 'text-rose-700 font-extrabold' : 'text-amber-900'}>
                                {3 - failedAttempts}x Sisa
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notification Alerts */}
                    {successMessage && (
                      <div className="bg-emerald-600 text-white p-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {errorMessage && lockoutRemaining === 0 && (
                      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-2 rounded-xl text-[10.5px] font-bold flex flex-col gap-1.5 shadow-xs">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-200 shrink-0 mt-0.5" />
                          <span className="flex-1 font-bold leading-tight">{errorMessage}</span>
                        </div>
                        {errorMessage.includes('MENUNGGU VERIFIKASI') && (
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              setView('register_status');
                            }}
                            className="self-start text-[10px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-all mt-0.5"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Lihat Status Pendaftaran Sekarang →</span>
                          </button>
                        )}
                        {errorMessage.includes('DITOLAK') && (
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              setView('register');
                            }}
                            className="self-start text-[10px] font-black bg-white hover:bg-slate-100 text-rose-700 px-3 py-1 rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-all mt-0.5"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Ajukan Pendaftaran Baru →</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Input 1: Username */}
                    <div>
                      <label className="block text-[10px] font-black text-[#0f2b5c] uppercase mb-0.5">
                        Username
                      </label>
                      <div className="relative">
                        <input
                          ref={usernameInputRef}
                          type="text"
                          disabled={lockoutRemaining > 0}
                          autoComplete="username"
                          placeholder="Ketik Username Akun"
                          value={usernameInput}
                          onChange={(e) => {
                            setUsernameInput(e.target.value);
                            setErrorMessage('');
                          }}
                          className={`w-full rounded-full px-3 py-1.5 text-xs font-bold focus:outline-none transition-all ${
                            lockoutRemaining > 0
                              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                              : 'bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] text-slate-800 placeholder-blue-900/40'
                          }`}
                        />
                        <User className="w-3 h-3 text-blue-700/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Input 2: Password */}
                    <div>
                      <label className="block text-[10px] font-black text-[#0f2b5c] uppercase mb-0.5">
                        Kata Sandi (Password)
                      </label>
                      <div className="relative">
                        <input
                          ref={passwordInputRef}
                          type={showLoginPassword ? 'text' : 'password'}
                          disabled={lockoutRemaining > 0}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value);
                            setErrorMessage('');
                          }}
                          className={`w-full rounded-full px-3 py-1.5 text-xs font-bold focus:outline-none transition-all ${
                            lockoutRemaining > 0
                              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                              : 'bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] text-slate-800 placeholder-blue-900/40'
                          }`}
                        />
                        <button
                          type="button"
                          disabled={lockoutRemaining > 0}
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          aria-label={showLoginPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700/60 hover:text-blue-900 cursor-pointer"
                          title={showLoginPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                        >
                          {showLoginPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Input 3: Visual CAPTCHA Widget */}
                    <div>
                      <CaptchaWidget
                        userInput={captchaInput}
                        setUserInput={(val) => {
                          setCaptchaInput(val);
                          setCaptchaError(false);
                          setErrorMessage('');
                        }}
                        onCaptchaCodeChange={(code) => setCurrentCaptchaCode(code)}
                        isError={captchaError}
                        refreshTrigger={captchaRefreshTrigger}
                        inputRef={captchaInputRef}
                      />
                    </div>

                    {/* Tombol Lupa Kata Sandi */}
                    <div className="flex items-center justify-between px-1 text-[9.5px]">
                      <span className="text-slate-500 font-medium">Lupa kredensial akun?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setSuccessMessage('');
                          setForgotUsername(usernameInput.trim());
                          setView('forgot_password');
                        }}
                        className="font-black text-blue-700 hover:text-blue-950 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <HelpCircle className="w-3 h-3 text-blue-600" />
                        <span>Lupa Kata Sandi?</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-0.5 space-y-1">
                      <button
                        type="submit"
                        disabled={lockoutRemaining > 0 || isLoggingIn}
                        className={`w-full py-2 rounded-full text-xs font-black text-white shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                          lockoutRemaining > 0 || isLoggingIn
                            ? 'bg-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-[#0f2b5c] hover:bg-[#143b7d] shadow-blue-950/20 hover:scale-[1.01] active:scale-[0.99]'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>
                          {isLoggingIn
                            ? 'Memverifikasi...'
                            : lockoutRemaining > 0
                            ? `Dibekukan (${lockoutRemaining}s)`
                            : 'Masuk Sekarang'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setView('login_choice');
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Kembali ke Pilihan Masuk</span>
                      </button>
                    </div>

                  </form>
                )}

                {/* ========================================================================= */}
                {/* JALUR LUPA KATA SANDI (FORGOT PASSWORD FORM) */}
                {/* ========================================================================= */}
                {view === 'forgot_password' && (
                  <form
                    key="view-forgot-password"
                    onSubmit={handleForgotPasswordSubmit}
                    className="space-y-2 sm:space-y-2.5 my-auto animate-scaleUp py-1 max-w-sm mx-auto w-full"
                  >
                    {/* Info Card */}
                    <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-[#0f2b5c] text-[10px] font-medium leading-relaxed flex items-start gap-2 shadow-xs">
                      <KeyRound className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-black text-xs text-[#0f2b5c] mb-0.5">Pemulihan Kredensial Akun</strong>
                        Masukkan Username, NIK (16 digit), dan No. WhatsApp resmi saat Anda mendaftar. Sistem akan mengirim tiket reset sandi ke Superadmin / Developer.
                      </div>
                    </div>

                    {/* Alert Error / Success */}
                    {errorMessage && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-[10px] font-bold flex items-start gap-1.5 shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span className="flex-1 leading-tight">{errorMessage}</span>
                      </div>
                    )}

                    {/* Input 1: Username */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5">
                        Username Akun
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={isSubmittingForgot}
                          placeholder="Ketik Username Anda"
                          value={forgotUsername}
                          onChange={(e) => {
                            setForgotUsername(e.target.value);
                            setErrorMessage('');
                          }}
                          className="w-full bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] rounded-full px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40"
                        />
                        <User className="w-3.5 h-3.5 text-blue-700/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Input 2: NIK Kependudukan */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5 flex items-center justify-between">
                        <span>NIK Kependudukan (16 Digit)</span>
                        <span className={`text-[8px] font-bold ${forgotNik.length === 16 ? 'text-emerald-700' : 'text-blue-700'}`}>
                          {forgotNik.length === 16 ? '✓ 16 Digit' : `${forgotNik.length}/16 Digit`}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={16}
                          disabled={isSubmittingForgot}
                          placeholder="Masukkan 16 digit NIK terdaftar"
                          value={forgotNik}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setForgotNik(val);
                            setErrorMessage('');
                          }}
                          className="w-full bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] rounded-full px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40"
                        />
                        <CreditCard className="w-3.5 h-3.5 text-blue-700/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Input 3: Nomor WhatsApp */}
                    <div>
                      <label className="block text-[9.5px] font-black text-[#0f2b5c] uppercase mb-0.5">
                        Nomor WhatsApp Terdaftar
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          inputMode="tel"
                          disabled={isSubmittingForgot}
                          placeholder="Contoh: 081234567890"
                          value={forgotNoWhatsapp}
                          onChange={(e) => {
                            setForgotNoWhatsapp(e.target.value);
                            setErrorMessage('');
                          }}
                          className="w-full bg-blue-50/60 focus:bg-white border border-blue-300/80 focus:border-[#0f2b5c] rounded-full px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none transition-all placeholder-blue-800/40"
                        />
                        <Phone className="w-3.5 h-3.5 text-blue-700/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1 space-y-1.5">
                      <button
                        type="submit"
                        disabled={isSubmittingForgot}
                        className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-black rounded-full text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {isSubmittingForgot ? (
                          <span>Mengirim Pengajuan...</span>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                            <span>Kirim Pengajuan Reset Sandi</span>
                          </>
                        )}
                      </button>

                      {savedForgotSession && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage('');
                            setView('forgot_password_status');
                          }}
                          className="w-full py-1 text-purple-900 hover:text-purple-950 font-bold text-[10px] text-center cursor-pointer hover:underline block"
                        >
                          Sudah mengajukan reset sandi? Pantau status tiket Anda di sini →
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setView('login_manual');
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Kembali ke Halaman Masuk</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================================= */}
                {/* JALUR PANTAU STATUS RESET KATA SANDI (STATUS RESET REALTIME) */}
                {/* ========================================================================= */}
                {view === 'forgot_password_status' && (() => {
                  const targetUname = (activeForgotAccount?.username || savedForgotSession?.username || forgotUsername || '').trim().toLowerCase();
                  const liveAcc = adminAccounts.find((a) => (a.username || '').toLowerCase().trim() === targetUname) || activeForgotAccount;
                  const ticket = liveAcc?.resetTicket;
                  const status = ticket?.status || 'MENUNGGU_RESET';

                  return (
                    <div
                      key="view-forgot-password-status"
                      className="space-y-3 sm:space-y-3.5 my-auto animate-scaleUp py-1 max-w-sm mx-auto w-full"
                    >
                      {/* STATUS CARD MENUNGGU PERSETUJUAN */}
                      {status === 'MENUNGGU_RESET' && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-sm space-y-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                              <Clock className="w-5 h-5 animate-spin" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs sm:text-sm font-black text-amber-950 leading-tight">
                                  Menunggu Persetujuan
                                </h4>
                                <span className="bg-amber-200 text-amber-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                  DITINJAU
                                </span>
                              </div>
                              <p className="text-[10px] text-amber-900 font-medium leading-relaxed mt-1">
                                Pengajuan reset sandi akun <strong className="text-amber-950 font-black">{liveAcc?.username || targetUname}</strong> telah masuk ke antrean Verval Akun Superadmin & Developer.
                              </p>
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-white/80 border border-amber-200 text-[10px] text-amber-950 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-bold">NIK Pemohon:</span>
                              <span className="font-mono font-black">{ticket?.nik || forgotNik || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-bold">WhatsApp:</span>
                              <span className="font-mono font-black text-emerald-700">{ticket?.noWhatsapp || forgotNoWhatsapp || '-'}</span>
                            </div>
                          </div>

                          <p className="text-[9.5px] text-amber-800 font-medium text-center">
                            ⏳ Anda tidak perlu menunggu di halaman ini. Kapan pun Superadmin menyetujui, sandi sementara akan otomatis muncul di sini.
                          </p>
                        </div>
                      )}

                      {/* STATUS CARD DISETUJUI & SANDI TERBIT */}
                      {status === 'DISETUJUI' && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-md space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs sm:text-sm font-black text-emerald-950 leading-tight">
                                  Sandi Sementara Diterbitkan!
                                </h4>
                                <span className="bg-emerald-200 text-emerald-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                  DISETUJUI
                                </span>
                              </div>
                              <p className="text-[10px] text-emerald-900 font-medium leading-relaxed mt-1">
                                Superadmin/Developer telah memverifikasi identitas Anda dan menerbitkan sandi sementara berikut:
                              </p>
                            </div>
                          </div>

                          {/* KOTAK SANDI SEMENTARA DENGAN TOMBOL SALIN */}
                          <div className="p-3 rounded-xl bg-white border-2 border-emerald-300 shadow-inner flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-400 block">Sandi Sementara Anda:</span>
                              <code className="text-sm sm:text-base font-mono font-black text-emerald-900 tracking-wider">
                                {ticket?.temporaryPassword || liveAcc?.passwordPolos || '••••••••'}
                              </code>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const pass = ticket?.temporaryPassword || liveAcc?.passwordPolos || '';
                                if (pass) {
                                  navigator.clipboard.writeText(pass);
                                  setForgotTicketCopied(true);
                                  setTimeout(() => setForgotTicketCopied(false), 2000);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              {forgotTicketCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const pass = ticket?.temporaryPassword || liveAcc?.passwordPolos || '';
                              setUsernameInput(liveAcc?.username || targetUname);
                              setPasswordInput(pass);
                              setErrorMessage('');
                              setView('login_manual');
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Gunakan Sandi Ini & Masuk Sekarang</span>
                          </button>
                        </div>
                      )}

                      {/* STATUS CARD DITOLAK */}
                      {status === 'DITOLAK' && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950 shadow-sm space-y-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                              <XCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs sm:text-sm font-black text-rose-950 leading-tight">
                                  Pengajuan Reset Ditolak
                                </h4>
                                <span className="bg-rose-200 text-rose-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                  DITOLAK
                                </span>
                              </div>
                              <p className="text-[10px] text-rose-900 font-medium leading-relaxed mt-1">
                                Permintaan reset sandi akun <strong className="text-rose-950 font-black">{liveAcc?.username || targetUname}</strong> tidak dapat disetujui karena ketidaksesuaian data NIK atau WhatsApp.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              setView('forgot_password');
                            }}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Ajukan Ulang dengan Data Sesuai</span>
                          </button>
                        </div>
                      )}

                      {/* Tombol Kembali */}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setView('main');
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Kembali ke Menu Utama</span>
                      </button>
                    </div>
                  );
                })()}

                {/* ========================================================================= */}
                {/* JALUR 2 -> PILIHAN B: LAYAR PEMINDAIAN SMART CARD */}
                {/* ========================================================================= */}
                {view === 'login_smart_card' && (
                  <div
                    key="view-login-smart-card"
                    className="space-y-3 sm:space-y-3.5 text-center my-auto py-1 max-w-sm mx-auto w-full animate-scaleUp"
                  >
                    {/* Header Smart Card */}
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 bg-[#d4af37] text-[#0f2b5c] text-[9px] sm:text-[9.5px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>AKSES RESMI JABAR</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-[#0f2b5c] m-0 tracking-tight">
                        Smart Card
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-600 font-bold leading-tight m-0">
                        Scan Kode QR / Tap Kartu
                      </p>
                    </div>

                    {/* 2 Pilihan Bersebelahan Kanan-Kiri yang Rapi dan Seimbang */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-left w-full">
                      {/* Pilihan 1 (Kiri): Pemindai Kode QR */}
                      <button
                        type="button"
                        onClick={() => {
                          setScannerDefaultTab('qr');
                          setIsQrScannerOpen(true);
                        }}
                        className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-[#143b7d] to-[#0f2b5c] hover:from-[#1a4a9c] hover:to-[#0d2d5e] text-white border-2 border-[#d4af37] shadow-sm hover:shadow-md cursor-pointer flex flex-col items-center text-center justify-between group transition-all min-h-[145px] sm:min-h-[155px] hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 mb-1 group-hover:scale-105 transition-transform shadow-inner">
                          <QrCode className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                        </div>
                        <div className="space-y-0.5 w-full my-auto">
                          <h5 className="text-[11px] sm:text-xs font-black text-amber-200 m-0 leading-tight">
                            Pemindai Kode QR
                          </h5>
                          <p className="text-[9.5px] sm:text-[10px] text-blue-100 font-medium leading-tight m-0">
                            Pindai kartu QR via kamera
                          </p>
                        </div>
                        <span className="mt-2 text-[9px] sm:text-[9.5px] font-black bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#f3e5ab] text-slate-950 px-2 py-1 rounded-full uppercase tracking-wider w-full shadow-xs">
                          Buka Kamera
                        </span>
                      </button>

                      {/* Pilihan 2 (Kanan): Tap SmartCard (NFC) */}
                      <button
                        type="button"
                        onClick={() => {
                          setScannerDefaultTab('nfc');
                          setIsQrScannerOpen(true);
                        }}
                        className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#0f2b5c] hover:from-black hover:to-slate-900 text-white border-2 border-[#d4af37] shadow-sm hover:shadow-md cursor-pointer flex flex-col items-center text-center justify-between group transition-all min-h-[145px] sm:min-h-[155px] hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-1 group-hover:scale-105 transition-transform shadow-inner">
                          <Wifi className="w-5 h-5 sm:w-6 sm:h-6 rotate-90 animate-pulse" />
                        </div>
                        <div className="space-y-0.5 w-full my-auto">
                          <h5 className="text-[11px] sm:text-xs font-black text-amber-200 m-0 leading-tight">
                            Tap SmartCard
                          </h5>
                          <p className="text-[9.5px] sm:text-[10px] text-slate-300 font-medium leading-tight m-0">
                            Tempelkan kartu ke NFC
                          </p>
                        </div>
                        <span className="mt-2 text-[9px] sm:text-[9.5px] font-black bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#f3e5ab] text-slate-950 px-2 py-1 rounded-full uppercase tracking-wider w-full shadow-xs">
                          Sensor Tap NFC
                        </span>
                      </button>
                    </div>

                    {/* Informasi Status NFC */}
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2 text-center text-[10.5px] text-blue-900 font-semibold flex items-center justify-center gap-1.5 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Pastikan perangkat Anda memiliki fitur NFC dan dalam kondisi Aktif</span>
                    </div>

                    {/* Tombol Kembali ke Pilihan Masuk */}
                    <div className="pt-1 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setView('login_choice');
                        }}
                        className="w-full py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-full text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                        <span>Kembali ke Pilihan Masuk</span>
                      </button>
                    </div>

                  </div>
                )}

                {/* ========================================================================= */}
                {/* JALUR 3: TAMPILAN AKSES TAMU (PILIH 27 WILAYAH) */}
                {/* ========================================================================= */}
                {view === 'guest' && (
                  <div
                    key="view-guest"
                    className="space-y-2.5 my-auto animate-scaleUp"
                  >
                    
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-[#0f2b5c] text-[9.5px] font-black px-2.5 py-0.5 rounded-full mb-1">
                        <Globe2 className="w-3 h-3 text-[#0f2b5c]" />
                        <span>AKSES PUBLIK TANPA LOGIN</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-semibold">
                        Pilih Kabupaten/Kota di Jawa Barat untuk membaca data:
                      </p>
                    </div>

                    {/* Alert if not selected */}
                    {errorMessage && (
                      <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[10.5px] font-bold flex items-center gap-1.5 shadow-xs">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Dropdown 27 Wilayah Jawa Barat */}
                    <div>
                      <label className="block text-[10px] font-black text-[#0f2b5c] uppercase mb-0.5 flex items-center justify-between">
                        <span>Pilih Wilayah Kabupaten / Kota</span>
                        <span className="text-[8.5px] text-blue-800 font-black">27 Wilayah Jabar</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedGuestRegion}
                          onChange={(e) => {
                            setSelectedGuestRegion(e.target.value);
                            setErrorMessage('');
                          }}
                          className={`w-full bg-blue-50/60 focus:bg-white border rounded-full px-3 py-2 text-xs font-black focus:outline-none transition-all cursor-pointer appearance-none shadow-xs ${
                            selectedGuestRegion === ''
                              ? 'border-amber-500 text-slate-700'
                              : 'border-blue-600 text-[#0f2b5c]'
                          }`}
                        >
                          <option value="" disabled>
                            -- Silakan Pilih Wilayah Kabupaten / Kota --
                          </option>
                          {KAB_KOTA_ONLY.map((kota) => (
                            <option key={kota} value={kota}>
                              {kota}
                            </option>
                          ))}
                        </select>
                        <Globe2 className="w-3.5 h-3.5 text-blue-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {selectedGuestRegion !== '' && (
                        <div className="mt-1 p-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[10.5px] font-bold flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Wilayah Terpilih: <strong>{selectedGuestRegion}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-0.5 space-y-1">
                      <button
                        type="button"
                        onClick={handleGuestSubmit}
                        className="w-full py-2 bg-[#0f2b5c] hover:bg-[#143b7d] text-white font-black rounded-full text-xs shadow-sm shadow-blue-950/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Masuk Sebagai Tamu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setView('main');
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Kembali ke Menu Utama</span>
                      </button>
                    </div>

                  </div>
                )}

            </div>

            {/* Bottom Form Footer Links */}
            <div className={`relative z-10 pt-1.5 sm:pt-1.5 border-t border-slate-200 flex flex-col gap-1 sm:gap-1 text-[8.5px] sm:text-[9.5px] text-slate-600 font-semibold shrink-0 pb-1 sm:pb-0 ${showMobileIntro && view === 'main' ? 'hidden md:flex' : 'flex'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPrivacyTermsInitialTab('privacy');
                      setIsPrivacyTermsOpen(true);
                    }}
                    className="hover:text-blue-700 hover:underline cursor-pointer font-semibold"
                  >
                    Kebijakan Privasi
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrivacyTermsInitialTab('terms');
                      setIsPrivacyTermsOpen(true);
                    }}
                    className="hover:text-blue-700 hover:underline cursor-pointer font-semibold"
                  >
                    Syarat Layanan
                  </button>
                </div>

                <div className="flex items-center gap-1 text-blue-800 font-bold">
                  <ShieldAlert className="w-3 h-3 text-[#d4af37]" />
                  <span>Enkripsi PBKDF2</span>
                </div>
              </div>

              {/* Copyright Resmi Khusus Mobile Lapisan 2 (Satu-Satunya di HP) - Terangkat dan Tidak Terpotong */}
              <div className="md:hidden text-[7.5px] sm:text-[8.5px] text-slate-500 font-medium text-center leading-tight break-words px-1 pt-1 pb-0.5">
                © Dinas Sosial Provinsi Jawa Barat ( Developer By Ilham Fazril ) Hak Cipta Dilindungi Undang-Undang
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Bottom Page Footer (Khusus Desktop - Satu-Satunya Copyright di Layar Desktop) */}
      <footer className="hidden md:flex relative z-20 w-full max-w-5xl lg:max-w-6xl mx-auto px-4 py-1.5 items-center justify-between text-[10px] text-blue-100/90 border border-blue-800/40 bg-[#071733]/85 backdrop-blur-md shrink-0 rounded-xl shadow-lg">
        <div className="flex items-center gap-1.5 font-semibold">
          <Building2 className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
          <span>© Dinas Sosial Provinsi Jawa Barat ( Developer By Ilham Fazril ) Hak Cipta Dilindungi Undang-Undang</span>
        </div>
        <div className="text-[9.5px] text-blue-300 font-semibold">
          Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR)
        </div>
      </footer>

      {/* Modal Kebijakan Privasi & Syarat Ketentuan */}
      {isPrivacyTermsOpen && (
        <React.Suspense fallback={null}>
          <PrivacyTermsModal
            isOpen={isPrivacyTermsOpen}
            onClose={() => setIsPrivacyTermsOpen(false)}
            initialTab={privacyTermsInitialTab}
          />
        </React.Suspense>
      )}

      {/* Modals Pemindai QR & Cetak Kartu Akses (Hardware Handler) */}
      {isQrScannerOpen && (
        <React.Suspense fallback={null}>
          <QRCardScannerModal
            isOpen={isQrScannerOpen}
            defaultTab={scannerDefaultTab}
            appSettings={appSettings}
            onClose={() => setIsQrScannerOpen(false)}
            onSuccessLogin={(role, nama, wilayah) => {
              onClose();
              onPerformLogin(role, nama, wilayah);
            }}
            onOpenPrintCards={() => setIsPrintCardsOpen(true)}
          />
        </React.Suspense>
      )}

      {isPrintCardsOpen && (
        <React.Suspense fallback={null}>
          <PrintableQRCardModal
            isOpen={isPrintCardsOpen}
            onClose={() => setIsPrintCardsOpen(false)}
            onOpenScanner={() => setIsQrScannerOpen(true)}
          />
        </React.Suspense>
      )}

      {/* Pop-up Centang Hijau 1 Detik Setelah Registrasi Berhasil */}
      {!!registeredUserData && (
        <React.Suspense fallback={null}>
          <RegisterSuccessModal
            isOpen={!!registeredUserData}
            onClose={handleCloseRegisterSuccess}
            username={registeredUserData?.username || ''}
            wilayah={registeredUserData?.wilayah || ''}
          />
        </React.Suspense>
      )}

      {/* Modal Otorisasi PIN 6 Digit Pure Putih untuk Superadmin & Developer */}
      {pendingPrivilegedAuth && (
        <AuthorityPinVerificationModal
          role={pendingPrivilegedAuth.role}
          nama={pendingPrivilegedAuth.nama}
          wilayah={pendingPrivilegedAuth.wilayah}
          method="manual"
          appSettings={appSettings}
          onSuccess={() => {
            const auth = pendingPrivilegedAuth;
            setPendingPrivilegedAuth(null);
            executeDirectLoginSuccess(auth.role, auth.nama, auth.wilayah, auth.username, auth.userId);
          }}
          onCancel={() => {
            setPendingPrivilegedAuth(null);
          }}
        />
      )}

    </div>
  );
};
