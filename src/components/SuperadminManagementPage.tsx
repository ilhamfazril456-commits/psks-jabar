import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  X, 
  AlertCircle, 
  RefreshCw,
  Sliders,
  Phone,
  Fingerprint,
  User,
  Award,
} from 'lucide-react';
import { AdminAccount, UserSession, PillarId, AppSettings } from '../types';
import { PILLARS_CONFIG } from '../data/initialData';
import { KEPAHLAWANAN_MENUS, type KepahlawananMenuId } from './KepahlawananSection';
import { hashPassword, encryptSensitiveData, decryptSensitiveData } from '../utils/crypto';
import { BackToHomeButton } from './BackToHomeButton';

interface SuperadminManagementPageProps {
  session: UserSession;
  adminAccounts: AdminAccount[];
  appSettings?: AppSettings;
  onAddSuperadmin: (newAdmin: Omit<AdminAccount, 'id'>) => void;
  onUpdateSuperadmin: (updated: AdminAccount, securitySignal?: string) => void;
  onDeleteSuperadmin: (id: string) => void;
  onBackToHome: () => void;
}

const ALL_PILLAR_KEYS: PillarId[] = [
  'peksos',
  'psm',
  'tagana',
  'lks',
  'karangtaruna',
  'lk3',
  'pensos',
  'tksk',
  'badanusaha',
  'slrt_puskesos',
];

const ALL_KEPAHLAWANAN_KEYS: KepahlawananMenuId[] = [
  'pahlawan_nasional',
  'pkri',
  'janda_pkri',
  'keluarga_pahlawan',
];

// Validasi Password: Min 12 karakter kombinasi huruf besar, kecil, angka
const validateSuperPassword = (p: string): { isValid: boolean; message: string } => {
  const clean = (p || '').trim();
  if (!clean) return { isValid: false, message: 'Kata sandi tidak boleh kosong.' };
  if (clean.length < 12) return { isValid: false, message: 'Kata sandi minimal 12 karakter.' };
  if (!/[A-Z]/.test(clean) || !/[a-z]/.test(clean) || !/[0-9]/.test(clean)) {
    return {
      isValid: false,
      message: 'Wajib kombinasi huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9).',
    };
  }
  return { isValid: true, message: '' };
};

// Validasi PIN 6 Digit
const validatePinNumber = (pin: string): boolean => {
  return /^\d{6}$/.test((pin || '').trim());
};

function getPlainSuperadminPassword(item: AdminAccount): string {
  if (item.passwordEncrypted) {
    try {
      const dec = decryptSensitiveData(item.passwordEncrypted);
      if (dec) return dec;
    } catch {}
  }
  if (item.passwordPolos && item.passwordPolos !== '••••••••') {
    return item.passwordPolos;
  }
  if (item.id === 'adm-super' || (item.username || '').toLowerCase() === 'superadmin') {
    return 'Super12345jabar';
  }
  return '';
}

function getSuperadminPin(item: AdminAccount): string {
  if (item.pinOtoritas) return item.pinOtoritas;
  if (item.pinEncrypted) {
    try {
      const dec = decryptSensitiveData(item.pinEncrypted);
      if (dec && /^\d{6}$/.test(dec)) return dec;
    } catch {}
  }
  return '150109';
}

export const SuperadminManagementPage: React.FC<SuperadminManagementPageProps> = ({
  session,
  adminAccounts,
  appSettings,
  onAddSuperadmin,
  onUpdateSuperadmin,
  onDeleteSuperadmin,
  onBackToHome,
}) => {
  const isDeveloperUser = session.role === 'developer' || session.isDeveloper === true;

  // Filter khusus akun Superadmin dari daftar
  const superadminList = useMemo(() => {
    return adminAccounts.filter((a) => {
      const uLower = (a.username || '').toLowerCase().trim();
      return a.role === 'superadmin' || a.id === 'adm-super' || uLower.includes('superadmin');
    });
  }, [adminAccounts]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return superadminList;
    return superadminList.filter(
      (a) =>
        (a.namaAdmin || '').toLowerCase().includes(q) ||
        (a.username || '').toLowerCase().includes(q) ||
        (a.noWhatsapp || '').includes(q) ||
        (a.nik || '').includes(q)
    );
  }, [superadminList, searchQuery]);

  // Visibility toggle map for username, passwords, and PIN
  const [visibleUsernameMap, setVisibleUsernameMap] = useState<Record<string, boolean>>({});
  const [visiblePasswordMap, setVisiblePasswordMap] = useState<Record<string, boolean>>({});
  const [visiblePinMap, setVisiblePinMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);

  // Form Fields
  const [formNama, setFormNama] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPin, setFormPin] = useState('150109');
  const [formNik, setFormNik] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAccessType, setFormAccessType] = useState<'all' | 'custom'>('all');
  const [formSelectedPillars, setFormSelectedPillars] = useState<string[]>(ALL_PILLAR_KEYS);
  const [formKepahlawananAccessType, setFormKepahlawananAccessType] = useState<'all' | 'custom'>('all');
  const [formSelectedKepahlawanan, setFormSelectedKepahlawanan] = useState<string[]>(ALL_KEPAHLAWANAN_KEYS);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State for Delete Confirmation
  const [deletingAccount, setDeletingAccount] = useState<AdminAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const generateStrongPassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    let res = 'Super';
    for (let i = 0; i < 3; i++) res += uppers[Math.floor(Math.random() * uppers.length)];
    for (let i = 0; i < 3; i++) res += lowers[Math.floor(Math.random() * lowers.length)];
    for (let i = 0; i < 4; i++) res += numbers[Math.floor(Math.random() * numbers.length)];
    return res;
  };

  const generateRandom6Pin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setFormNama('');
    setFormUsername('');
    setFormPassword(generateStrongPassword());
    setFormPin(generateRandom6Pin());
    setFormNik('');
    setFormPhone('');
    setFormAccessType('all');
    setFormSelectedPillars(ALL_PILLAR_KEYS);
    setFormKepahlawananAccessType('all');
    setFormSelectedKepahlawanan(ALL_KEPAHLAWANAN_KEYS);
    setFormError(null);
    setIsModalOpen(true);
  };

  const resolveEffectivePin = (item: AdminAccount): string => {
    const personal = getSuperadminPin(item);
    if (item.pinOtoritas || item.pinEncrypted) return personal;
    if (
      (item.id === 'adm-super' || (item.username || '').toLowerCase().includes('superadmin')) &&
      appSettings?.superadminPin &&
      /^\d{6}$/.test(appSettings.superadminPin.trim())
    ) {
      return appSettings.superadminPin.trim();
    }
    return personal;
  };

  const handleOpenEditModal = (acc: AdminAccount) => {
    setEditingAccount(acc);
    setFormNama(acc.namaAdmin || acc.username || '');
    setFormUsername(acc.username || '');
    const currentPass = getPlainSuperadminPassword(acc);
    setFormPassword(currentPass || '');
    setFormPin(resolveEffectivePin(acc));
    setFormNik(acc.nik || '');
    setFormPhone(acc.noWhatsapp || '');
    
    const allowed = acc.allowedPillars || ['all'];
    if (allowed.includes('all') || allowed.includes('*') || allowed.length >= ALL_PILLAR_KEYS.length) {
      setFormAccessType('all');
      setFormSelectedPillars(ALL_PILLAR_KEYS);
    } else {
      setFormAccessType('custom');
      setFormSelectedPillars(allowed);
    }

    const allowedKep = acc.allowedKepahlawanan || ['all'];
    if (allowedKep.includes('all') || allowedKep.includes('*') || allowedKep.length >= ALL_KEPAHLAWANAN_KEYS.length) {
      setFormKepahlawananAccessType('all');
      setFormSelectedKepahlawanan(ALL_KEPAHLAWANAN_KEYS);
    } else {
      setFormKepahlawananAccessType('custom');
      setFormSelectedKepahlawanan(allowedKep);
    }

    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTogglePillar = (pKey: string) => {
    setFormSelectedPillars((prev) => {
      if (prev.includes(pKey)) {
        return prev.filter((k) => k !== pKey);
      } else {
        return [...prev, pKey];
      }
    });
  };

  const handleSelectAllPillars = () => {
    setFormSelectedPillars(ALL_PILLAR_KEYS);
  };

  const handleClearAllPillars = () => {
    setFormSelectedPillars([]);
  };

  const handleToggleKepahlawanan = (kKey: string) => {
    setFormSelectedKepahlawanan((prev) =>
      prev.includes(kKey) ? prev.filter((k) => k !== kKey) : [...prev, kKey]
    );
  };

  const handleSelectAllKepahlawanan = () => {
    setFormSelectedKepahlawanan(ALL_KEPAHLAWANAN_KEYS);
  };

  const handleClearAllKepahlawanan = () => {
    setFormSelectedKepahlawanan([]);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const namaClean = formNama.trim();
    const unameClean = formUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const passClean = formPassword.trim();
    const pinClean = formPin.trim();

    if (!namaClean) {
      setFormError('Nama lengkap Superadmin wajib diisi.');
      return;
    }
    if (!unameClean || unameClean.length < 4) {
      setFormError('Username minimal 4 karakter (tanpa spasi).');
      return;
    }

    const existingPlainPass = editingAccount ? getPlainSuperadminPassword(editingAccount) : '';
    const isPasswordBeingChanged = !editingAccount || (passClean.length > 0 && passClean !== existingPlainPass);

    if (!editingAccount) {
      const passVal = validateSuperPassword(passClean);
      if (!passVal.isValid) {
        setFormError(passVal.message);
        return;
      }
    } else if (isPasswordBeingChanged) {
      const passVal = validateSuperPassword(passClean);
      if (!passVal.isValid) {
        setFormError(passVal.message);
        return;
      }
    } else if (!editingAccount.passwordHash && !passClean) {
      setFormError('Kata sandi wajib diisi untuk akun yang belum memiliki kata sandi.');
      return;
    }

    if (!validatePinNumber(pinClean)) {
      setFormError('PIN Otoritas harus tepat 6 digit angka murni.');
      return;
    }

    if (
      formAccessType === 'custom' &&
      formSelectedPillars.length === 0 &&
      formKepahlawananAccessType === 'custom' &&
      formSelectedKepahlawanan.length === 0
    ) {
      setFormError('Pilih minimal 1 pilar PSKS atau 1 menu Kepahlawanan untuk hak akses kustom.');
      return;
    }

    // Periksa duplikasi username jika akun baru
    if (!editingAccount) {
      const exists = adminAccounts.some(
        (a) => (a.username || '').toLowerCase().trim() === unameClean
      );
      if (exists) {
        setFormError(`Username "${unameClean}" sudah digunakan oleh akun lain!`);
        return;
      }
    }

    const finalAllowedPillars = formAccessType === 'all' ? ['all'] : formSelectedPillars;
    const finalAllowedKepahlawanan =
      formKepahlawananAccessType === 'all' ? ['all'] : formSelectedKepahlawanan;

    // Zero-Leakage Cryptographic Construction
    const passwordHash = isPasswordBeingChanged
      ? hashPassword(passClean)
      : editingAccount!.passwordHash || hashPassword(passClean);
    const passwordEncrypted = isPasswordBeingChanged
      ? encryptSensitiveData(passClean)
      : editingAccount!.passwordEncrypted || (passClean ? encryptSensitiveData(passClean) : undefined);
    const pinEncrypted = encryptSensitiveData(pinClean);

    if (editingAccount) {
      // Update Superadmin
      const updatedAccount: AdminAccount & { _previousUsername?: string } = {
        ...editingAccount,
        _previousUsername: editingAccount.username,
        namaAdmin: namaClean,
        username: unameClean,
        passwordHash,
        passwordEncrypted,
        pinOtoritas: pinClean,
        pinEncrypted,
        allowedPillars: finalAllowedPillars,
        allowedKepahlawanan: finalAllowedKepahlawanan,
        nik: formNik.trim(),
        noWhatsapp: formPhone.trim(),
        role: 'superadmin',
        wilayahTugas: 'PROVINSI JAWA BARAT',
        statusActive: 'SAH_TERDAFTAR',
        lastUpdatedTimestamp: Date.now(),
        lastEditedBy: session.nama || 'Lead Developer',
        lastEditedByRole: 'developer',
      };
      // Hapus password polos telanjang sebelum dikirim ke database
      delete updatedAccount.passwordPolos;

      onUpdateSuperadmin(updatedAccount, 'SUPERADMIN_UPDATED');
      showToast(`✅ Akun Superadmin "${namaClean}" berhasil diperbarui (PIN & Hak Akses langsung aktif)!`);
    } else {
      // Tambah Superadmin Baru
      const newId = `adm-super-${Date.now()}`;
      const newAccountPayload: Omit<AdminAccount, 'id'> = {
        namaAdmin: namaClean,
        username: unameClean,
        passwordHash,
        passwordEncrypted,
        pinOtoritas: pinClean,
        pinEncrypted,
        allowedPillars: finalAllowedPillars,
        allowedKepahlawanan: finalAllowedKepahlawanan,
        nik: formNik.trim(),
        noWhatsapp: formPhone.trim(),
        role: 'superadmin',
        wilayahTugas: 'PROVINSI JAWA BARAT',
        statusActive: 'SAH_TERDAFTAR',
        statusAkun: 'AKTIF',
        isFrozen: false,
        lastUpdatedTimestamp: Date.now(),
        lastEditedBy: session.nama || 'Lead Developer',
        lastEditedByRole: 'developer',
      };

      onAddSuperadmin(newAccountPayload);
      showToast(`✅ Akun Superadmin "${namaClean}" (@${unameClean}) berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  const handleToggleFreeze = (acc: AdminAccount) => {
    const isCurrentlyFrozen = acc.isFrozen === true || acc.statusAkun === 'DIBEKUKAN';
    const nextFrozen = !isCurrentlyFrozen;
    const updated: AdminAccount = {
      ...acc,
      isFrozen: nextFrozen,
      statusAkun: nextFrozen ? 'DIBEKUKAN' : 'AKTIF',
      lastUpdatedTimestamp: Date.now(),
    };
    onUpdateSuperadmin(updated);
    showToast(
      nextFrozen
        ? `⚠️ Akun Superadmin "${acc.namaAdmin}" berhasil DIBEKUKAN.`
        : `✅ Akun Superadmin "${acc.namaAdmin}" telah DIAKTIFKAN kembali.`
    );
  };

  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    if (superadminList.length <= 1) {
      showToast('❌ Tidak dapat menghapus! Minimal harus tersisa 1 akun Superadmin di sistem.');
      setDeletingAccount(null);
      return;
    }

    onDeleteSuperadmin(deletingAccount.id);
    showToast(`🗑️ Akun Superadmin "${deletingAccount.namaAdmin}" telah dihapus.`);
    setDeletingAccount(null);
  };

  // Hanya Developer Utama yang berhak mengakses
  if (!isDeveloperUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-black text-rose-400 mb-2">Akses Terbatas: Khusus Akun Developer</h2>
        <p className="text-slate-400 text-sm max-w-md text-center mb-6">
          Fitur Manajemen Akun Superadmin tingkat provinsi hanya dapat dibuka secara eksklusif oleh Lead Developer (Kang Ilham Fazril).
        </p>
        <BackToHomeButton onClick={onBackToHome} label="Kembali ke Beranda" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[9999] bg-[#043e2e] text-emerald-200 border-2 border-emerald-400/50 py-3 px-5 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#043e2e] via-[#092d3b] to-[#0f2b5c] text-white pt-8 pb-14 px-4 sm:px-6 relative overflow-hidden border-b-4 border-amber-400/60 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                ROOT DEVELOPER AUTHORITY
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                FITUR 2 KHUSUS DEVELOPER
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Sliders className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
              <span>Manajemen Superadmin Provinsi</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl mt-1.5 leading-relaxed">
              Konsol otoritas penuh untuk menambah superadmin, mengatur hak akses ke 10 pilar PSKS Jabar serta Gerbang Kepahlawanan, dan mengelola kata sandi serta PIN tanpa celah kebocoran data.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>Tambah Superadmin Baru</span>
            </button>
            <BackToHomeButton onClick={onBackToHome} label="Beranda" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Superadmin</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{superadminList.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Akun Terdaftar</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Status Aktif</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {superadminList.filter((a) => !a.isFrozen && a.statusAkun !== 'DIBEKUKAN').length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Bisa Login</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Akses 10 Pilar Penuh</div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {superadminList.filter((a) => {
                const al = a.allowedPillars || ['all'];
                return al.includes('all') || al.includes('*') || al.length >= 10;
              }).length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Semua Pilar</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Akses Pilar Terbatas</div>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {superadminList.filter((a) => {
                const al = a.allowedPillars || ['all'];
                return !al.includes('all') && !al.includes('*') && al.length < 10;
              }).length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Kustom Penugasan</div>
          </div>
        </div>

        {/* Search Bar & Title */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, username, NIK..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden bg-slate-50"
            />
          </div>
          <div className="text-[11px] font-semibold text-slate-500 text-right w-full sm:w-auto">
            Menampilkan <strong className="text-slate-800">{filteredList.length}</strong> akun Superadmin
          </div>
        </div>

        {/* Superadmin Accounts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredList.map((item) => {
            const isFrozen = item.isFrozen === true || item.statusAkun === 'DIBEKUKAN';
            const plainPass = getPlainSuperadminPassword(item);
            const plainPin = resolveEffectivePin(item);
            const isUsernameVisible = visibleUsernameMap[item.id] || false;
            const isPassVisible = visiblePasswordMap[item.id] || false;
            const isPinVisible = visiblePinMap[item.id] || false;

            const allowed = item.allowedPillars || ['all'];
            const isFullAccess = allowed.includes('all') || allowed.includes('*') || allowed.length >= ALL_PILLAR_KEYS.length;
            const allowedKep = item.allowedKepahlawanan || ['all'];
            const isFullKepAccess = allowedKep.includes('all') || allowedKep.includes('*') || allowedKep.length >= ALL_KEPAHLAWANAN_KEYS.length;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-md hover:shadow-xl flex flex-col justify-between ${
                  isFrozen ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header: Avatar & Status (Username dipindahkan ke kotak kredensial sesuai urutan) */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#043e2e] to-[#0f2b5c] text-amber-300 flex items-center justify-center font-black text-base shadow-sm shrink-0">
                        SA
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                            {item.namaAdmin || item.username}
                          </h3>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                          Superadmin Provinsi Jawa Barat
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border leading-none ${
                        isFrozen
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isFrozen ? 'DIBEKUKAN' : 'AKTIF'}
                    </span>
                  </div>

                  {/* Kredensial Box: Urutan Wajib -> Username, Password, PIN Otoritas */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 mb-4">
                    {/* 1. Username Row (Bisa dibuka/tutup) */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold shrink-0">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Username:</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 truncate">
                        <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 truncate max-w-[160px] sm:max-w-[210px]">
                          {isUsernameVisible ? item.username || '—' : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleUsernameMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                          }
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title={isUsernameVisible ? 'Tutup Username' : 'Lihat Username'}
                        >
                          {isUsernameVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.username || '', `user-${item.id}`)}
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Salin Username"
                        >
                          {copiedId === `user-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 2. Password Row */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold shrink-0">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Kata Sandi:</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 truncate">
                        <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {isPassVisible ? plainPass || '••••••••' : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setVisiblePasswordMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                          }
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title={isPassVisible ? 'Tutup Password' : 'Intip Password'}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(plainPass, `pass-${item.id}`)}
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Salin Password"
                        >
                          {copiedId === `pass-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 3. PIN Otoritas Row */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold shrink-0">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>PIN Otoritas:</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-900">
                        <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 tracking-widest text-emerald-700">
                          {isPinVisible ? plainPin : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setVisiblePinMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                          }
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title={isPinVisible ? 'Tutup PIN' : 'Lihat PIN'}
                        >
                          {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(plainPin, `pin-${item.id}`)}
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Salin PIN"
                        >
                          {copiedId === `pin-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hak Akses Pilar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        Kewenangan Pilar PSKS:
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">
                        {isFullAccess ? 'Semua Pilar (10)' : `${allowed.length} Pilar`}
                      </span>
                    </div>

                    {isFullAccess ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-emerald-900 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Akses Penuh — Bebas Membuka Seluruh 10 Pilar PSKS Jabar</span>
                      </div>
                    ) : allowed.length === 0 ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center gap-2 text-rose-800 text-xs font-bold">
                        <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Terkunci Penuh — Tidak Ada Pilar PSKS Diizinkan</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {allowed.map((pKey) => {
                          const cfg = PILLARS_CONFIG[pKey];
                          return (
                            <span
                              key={pKey}
                              className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-bold flex items-center gap-1"
                            >
                              <span>{cfg?.icon || '•'}</span>
                              <span>{cfg?.title || pKey.toUpperCase()}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Hak Akses Kepahlawanan */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-[#0f2b5c]" />
                        Kewenangan Kepahlawanan:
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">
                        {isFullKepAccess ? 'Semua Menu (4)' : `${allowedKep.length} Menu`}
                      </span>
                    </div>

                    {isFullKepAccess ? (
                      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 flex items-center gap-2 text-[#0f2b5c] text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>Akses Penuh — Bebas Membuka Seluruh 4 Menu Kepahlawanan</span>
                      </div>
                    ) : allowedKep.length === 0 ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center gap-2 text-rose-800 text-xs font-bold">
                        <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Terkunci Penuh — Tidak Ada Menu Kepahlawanan Diizinkan</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {allowedKep.map((kKey) => {
                          const cfg = KEPAHLAWANAN_MENUS.find((m) => m.id === kKey);
                          return (
                            <span
                              key={kKey}
                              className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-[#0f2b5c] text-[10px] font-bold flex items-center gap-1"
                            >
                              <span>{cfg?.title || kKey.toUpperCase()}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit & Hak Akses</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFreeze(item)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isFrozen
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      {isFrozen ? 'Aktifkan' : 'Bekukan'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingAccount(item)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus Superadmin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredList.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">Tidak ada akun Superadmin ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Silakan klik tombol Tambah Superadmin Baru.'}
            </p>
          </div>
        )}
      </div>

      {/* ================= MODAL TAMBAH / EDIT SUPERADMIN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#043e2e] to-[#0f2b5c] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <UserPlus className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {editingAccount ? 'Edit Akun & Hak Akses Superadmin' : 'Tambah Superadmin Baru'}
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Tingkat Otoritas: Provinsi Jawa Barat (Zero-Leakage Guard)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Baris 1: Nama & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Superadmin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Si"
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Akun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="Contoh: superadmin_ahmad"
                    className="w-full h-10 px-3 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Baris 2: NIK & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nomor NIK (16 Digit)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="3204xxxxxxxxxxxx"
                    className="w-full h-10 px-3 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>No. WhatsApp / HP</span>
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full h-10 px-3 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Baris 3: Password & PIN Otoritas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Kata Sandi {!editingAccount && <span className="text-rose-500">*</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormPassword(generateStrongPassword())}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Acak Kuat</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required={!editingAccount}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingAccount ? 'Kosongkan jika tidak mengubah sandi' : 'Min. 12 karakter kombinasi'}
                    className="w-full h-10 px-3 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {editingAccount ? 'Biarkan kosong/tetap jika hanya mengubah PIN atau hak akses.' : 'Kombinasi huruf besar, kecil, & angka.'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      PIN Otoritas (6 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormPin(generateRandom6Pin())}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Acak PIN</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 150109"
                    className="w-full h-10 px-3 text-xs sm:text-sm font-mono font-black tracking-widest rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-hidden text-emerald-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    PIN Smart Card & validasi otorisasi.
                  </span>
                </div>
              </div>

              {/* Section 4: HAK AKSES PILAR (Granular Pillar Access Control) */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Hak Akses 10 Pilar PSKS:</span>
                </label>

                {/* Radio Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      formAccessType === 'all'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accessType"
                      checked={formAccessType === 'all'}
                      onChange={() => setFormAccessType('all')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold">Akses Penuh (10 Pilar)</div>
                      <div className="text-[10px] text-slate-500">Boleh membuka seluruh pilar</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      formAccessType === 'custom'
                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accessType"
                      checked={formAccessType === 'custom'}
                      onChange={() => setFormAccessType('custom')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold">Kustom Pilar Tertentu</div>
                      <div className="text-[10px] text-slate-500">Pilih pilar spesifik yang diizinkan</div>
                    </div>
                  </label>
                </div>

                {/* Custom Checklist Panel */}
                {formAccessType === 'custom' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Pilih Pilar yang Diizinkan: ({formSelectedPillars.length}/10)
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSelectAllPillars}
                          className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleClearAllPillars}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Hapus Semua
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {ALL_PILLAR_KEYS.map((pKey) => {
                        const cfg = PILLARS_CONFIG[pKey];
                        const isChecked = formSelectedPillars.includes(pKey);
                        return (
                          <label
                            key={pKey}
                            onClick={() => handleTogglePillar(pKey)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-white border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                                : 'bg-slate-100/60 border-slate-200 text-slate-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-base">{cfg?.icon || '•'}</span>
                            <span className="truncate">{cfg?.title || pKey.toUpperCase()}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: HAK AKSES KEPAHLAWANAN (Granular Kepahlawanan Access Control) */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#0f2b5c]" />
                  <span>Pengaturan Hak Akses Kepahlawanan:</span>
                </label>

                {/* Radio Type Kepahlawanan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      formKepahlawananAccessType === 'all'
                        ? 'border-blue-600 bg-blue-50/60 text-[#0f2b5c] font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kepahlawananAccessType"
                      checked={formKepahlawananAccessType === 'all'}
                      onChange={() => setFormKepahlawananAccessType('all')}
                      className="text-blue-700 focus:ring-blue-600"
                    />
                    <div className="text-xs">
                      <div className="font-bold">Akses Penuh (4 Menu)</div>
                      <div className="text-[10px] text-slate-500">Boleh membuka seluruh Kepahlawanan</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      formKepahlawananAccessType === 'custom'
                        ? 'border-amber-500 bg-amber-50/60 text-amber-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kepahlawananAccessType"
                      checked={formKepahlawananAccessType === 'custom'}
                      onChange={() => setFormKepahlawananAccessType('custom')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold">Kustom Kepahlawanan</div>
                      <div className="text-[10px] text-slate-500">Pilih menu spesifik yang diizinkan</div>
                    </div>
                  </label>
                </div>

                {/* Custom Kepahlawanan Checklist Panel */}
                {formKepahlawananAccessType === 'custom' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Pilih Menu Kepahlawanan: ({formSelectedKepahlawanan.length}/4)
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSelectAllKepahlawanan}
                          className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleClearAllKepahlawanan}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Hapus Semua
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {KEPAHLAWANAN_MENUS.map((menu) => {
                        const isChecked = formSelectedKepahlawanan.includes(menu.id);
                        return (
                          <label
                            key={menu.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-white border-blue-400 text-[#0f2b5c] font-bold shadow-2xs'
                                : 'bg-slate-100/60 border-slate-200 text-slate-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleKepahlawanan(menu.id)}
                              className="rounded text-blue-700 focus:ring-blue-600"
                            />
                            <span className="truncate">{menu.fullTitle}</span>
                          </label>
                        );
                      })}
                    </div>

                    {formSelectedKepahlawanan.length === 0 && (
                      <p className="text-[11px] font-semibold text-rose-700 pt-1">
                        Semua 4 menu Gerbang Kepahlawanan akan dikunci bagi akun Superadmin ini.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#043e2e] to-[#0f2b5c] hover:from-[#06533e] hover:to-[#143b7d] text-amber-300 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{editingAccount ? 'Simpan Perubahan' : 'Tambahkan Superadmin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deletingAccount && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-rose-300 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Hapus Akun Superadmin Ini?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Anda akan menghapus akun atas nama <strong>{deletingAccount.namaAdmin}</strong> (@{deletingAccount.username}). Akun ini tidak akan bisa login lagi ke sistem.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
