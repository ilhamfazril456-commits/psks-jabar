import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Code2,
  Code,
  Database,
  Server,
  Palette,
  Zap,
  Star,
  Shield,
  Lock,
  Terminal,
  Layers,
  CheckCircle2,
  Package,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  User,
  Mail,
  Briefcase,
  MapPin,
  Award,
  BookOpen,
  X,
  FileCode2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Cpu,
  Binary,
  Layout,
  Save,
  Video,
  Image as ImageIcon,
  Phone,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Sliders,
  Check,
  Globe,
  Boxes,
  Flame,
  Wifi,
  Radio,
  Activity,
  HardDrive,
  Share2,
  ExternalLink,
  MessageSquare,
  Instagram,
  Youtube,
  Facebook,
  AtSign,
  Twitter,
  RotateCcw,
  FileText,
  Info,
  Users,
  Grid,
  List,
  Upload,
  Quote,
  UserCheck,
  Clock,
  Key,
  Hourglass,
  Laptop,
  QrCode,
  CreditCard,
  FileCode,
  ShieldOff,
  Eye,
  Puzzle,
  MonitorCheck,
  Scan,
} from 'lucide-react';
import { AppSettings, PSKSDataRecord, AdminAccount, AdminMessage, UserSession } from '../types';
import { DEFAULT_APP_SETTINGS } from '../data/defaultSettings';
import { OfficialPsksLogo } from './OfficialPsksLogo';
import { OFFICIAL_KADINAS_PHOTO } from '../assets/officialKadinasPhoto';
import { DEFAULT_PILLAR_DATA, DEFAULT_ADMIN_ACCOUNTS } from '../data/initialData';
import { SmartAccessCardSection } from './SmartAccessCardSection';
import { uploadVideoChunksToFirestore } from '../lib/videoSync';
import { AIBrainFirestoreManager } from './AIBrainFirestoreManager';

interface DeveloperControlPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  inline?: boolean;
  viewFilter?: 'all' | 'settings_only' | 'info_only';
  selectedSection?: SettingsMenuSection | null;
  onSectionChange?: (section: SettingsMenuSection | null) => void;
  allPillarData?: Record<string, PSKSDataRecord[]>;
  adminAccounts?: AdminAccount[];
  adminMessages?: AdminMessage[];
  session?: UserSession;
}

export type SettingsMenuSection =
  | 'background'
  | 'kadinas_photo'
  | 'profil_text'
  | 'medsos_wa'
  | 'security'
  | 'smart_card'
  | 'languages'
  | 'libraries'
  | 'database'
  | 'ai_assistant'
  | 'team'
  | 'developer'
  | 'all';

export const DeveloperControlPanel: React.FC<DeveloperControlPanelProps> = ({
  isOpen = true,
  onClose,
  appSettings,
  onSaveSettings,
  inline = false,
  viewFilter = 'all',
  selectedSection: propsSelectedSection,
  onSectionChange,
  allPillarData,
  adminAccounts,
  adminMessages,
  session = { role: 'developer', nama: 'Developer', wilayah: 'Jawa Barat', statusActive: 'SAH_TERDAFTAR' },
}) => {
  if (!inline && !isOpen) return null;

  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [internalSection, setInternalSection] = useState<SettingsMenuSection | null>(null);
  const [lastTouchedSection, setLastTouchedSection] = useState<SettingsMenuSection | null>(null);

  // REAL-TIME FIRESTORE STORAGE CALCULATOR (Real & Accurate Storage Metrics)
  const storageMetrics = useMemo(() => {
    // 1. Data 10 Pilar PSKS (pillar_members)
    let pillarRecordsCount = 0;
    let pillarBytes = 0;

    let pillarDataSource = allPillarData;
    if (!pillarDataSource || Object.keys(pillarDataSource).length === 0) {
      try {
        const cached = localStorage.getItem('psks_all_pillar_data');
        if (cached) {
          pillarDataSource = JSON.parse(cached);
        }
      } catch {}
    }
    if (!pillarDataSource || Object.keys(pillarDataSource).length === 0) {
      pillarDataSource = DEFAULT_PILLAR_DATA;
    }

    if (pillarDataSource) {
      Object.values(pillarDataSource).forEach((records) => {
        if (Array.isArray(records)) {
          pillarRecordsCount += records.length;
          records.forEach((rec) => {
            const str = JSON.stringify(rec);
            const rawBytes = new Blob([str]).size;
            const fieldsCount = Object.keys(rec).length;
            // Document payload + 32 bytes document overhead + 32 bytes per index/field
            pillarBytes += rawBytes + 32 + fieldsCount * 32;
          });
        }
      });
    }

    // 2. Kredensial Akun Dinas & Wilayah (admin_accounts)
    let adminAccountsCount = 0;
    let adminBytes = 0;
    let adminSource = adminAccounts;
    if (!adminSource || adminSource.length === 0) {
      try {
        const cached = localStorage.getItem('psks_admin_accounts');
        if (cached) {
          adminSource = JSON.parse(cached);
        }
      } catch {}
    }
    if (!adminSource || adminSource.length === 0) {
      adminSource = DEFAULT_ADMIN_ACCOUNTS;
    }
    if (adminSource && Array.isArray(adminSource)) {
      adminAccountsCount = adminSource.length;
      adminSource.forEach((adm) => {
        const str = JSON.stringify(adm);
        const rawBytes = new Blob([str]).size;
        const fieldsCount = Object.keys(adm).length;
        adminBytes += rawBytes + 32 + fieldsCount * 32;
      });
    }

    // 3. Konfigurasi & Identitas Portal (app_settings)
    // Firestore stores sanitized config (excluding raw heavy video blobs which exceed 1MB doc limits)
    const settingsTarget = formData || appSettings || DEFAULT_APP_SETTINGS;
    const sanitizedSettings = { ...settingsTarget };
    if (sanitizedSettings.bgVideoUrl && sanitizedSettings.bgVideoUrl.length > 500000) {
      sanitizedSettings.bgVideoUrl = 'LOCAL_STORAGE_SAVED_VIDEO';
    }
    if (sanitizedSettings.bgPhotoUrl && sanitizedSettings.bgPhotoUrl.length > 500000) {
      sanitizedSettings.bgPhotoUrl = 'LOCAL_STORAGE_SAVED_PHOTO';
    }
    if (sanitizedSettings.kadinasPhotoUrl && sanitizedSettings.kadinasPhotoUrl.length > 800000) {
      sanitizedSettings.kadinasPhotoUrl = 'LOCAL_STORAGE_SAVED_PHOTO';
    }
    const settingsStr = JSON.stringify(sanitizedSettings);
    const settingsRawBytes = new Blob([settingsStr]).size;
    const settingsFieldsCount = Object.keys(sanitizedSettings).length;
    const settingsBytes = settingsRawBytes + 32 + settingsFieldsCount * 32;
    const settingsCount = 1;

    // 4. Kotak Masuk & Instruksi Wilayah (admin_messages)
    let messagesCount = 0;
    let messagesBytes = 0;
    let messagesSource = adminMessages;
    if (!messagesSource || messagesSource.length === 0) {
      try {
        const cached = localStorage.getItem('psks_admin_messages');
        if (cached) {
          messagesSource = JSON.parse(cached);
        }
      } catch {}
    }
    if (messagesSource && Array.isArray(messagesSource)) {
      messagesCount = messagesSource.length;
      messagesSource.forEach((msg) => {
        const str = JSON.stringify(msg);
        const rawBytes = new Blob([str]).size;
        const fieldsCount = Object.keys(msg).length;
        messagesBytes += rawBytes + 32 + fieldsCount * 32;
      });
    }

    // 5. Registrasi Mandiri PSKS (registration_submissions)
    let registrationsCount = 0;
    let registrationsBytes = 0;
    try {
      const cachedReg = localStorage.getItem('psks_registration_submissions');
      if (cachedReg) {
        const parsedReg = JSON.parse(cachedReg);
        if (Array.isArray(parsedReg)) {
          registrationsCount = parsedReg.length;
          parsedReg.forEach((reg) => {
            const str = JSON.stringify(reg);
            const rawBytes = new Blob([str]).size;
            const fieldsCount = Object.keys(reg).length;
            registrationsBytes += rawBytes + 32 + fieldsCount * 32;
          });
        }
      }
    } catch {}

    // 6. Riwayat Log Audit & Keamanan (system_logs)
    let logsCount = 0;
    let logsBytes = 0;
    try {
      const cachedLogs = localStorage.getItem('psks_system_logs');
      if (cachedLogs) {
        const parsedLogs = JSON.parse(cachedLogs);
        if (Array.isArray(parsedLogs)) {
          logsCount = parsedLogs.length;
          parsedLogs.forEach((log) => {
            const str = JSON.stringify(log);
            const rawBytes = new Blob([str]).size;
            const fieldsCount = Object.keys(log).length;
            logsBytes += rawBytes + 32 + fieldsCount * 32;
          });
        }
      }
    } catch {}

    // 7. Smart Access Card & Token Keamanan (security_tokens)
    let securityTokensCount = 0;
    let securityTokensBytes = 0;
    try {
      const cachedDevice = localStorage.getItem('simpsks_device_registered_accounts');
      if (cachedDevice) {
        const parsedDev = JSON.parse(cachedDevice);
        if (Array.isArray(parsedDev)) {
          securityTokensCount = parsedDev.length;
          parsedDev.forEach((dev) => {
            const str = JSON.stringify(dev);
            const rawBytes = new Blob([str]).size;
            const fieldsCount = Object.keys(dev).length;
            securityTokensBytes += rawBytes + 32 + fieldsCount * 32;
          });
        }
      }
    } catch {}

    // Aggregations
    const totalDocuments =
      pillarRecordsCount +
      adminAccountsCount +
      settingsCount +
      messagesCount +
      registrationsCount +
      logsCount +
      securityTokensCount;

    const totalBytes =
      pillarBytes +
      adminBytes +
      settingsBytes +
      messagesBytes +
      registrationsBytes +
      logsBytes +
      securityTokensBytes;

    const totalKB = totalBytes / 1024;
    const totalMB = totalBytes / (1024 * 1024);
    const quotaMB = 500; // 500 MB Supabase Free Tier Capacity
    const quotaKB = quotaMB * 1024;
    const quotaBytes = quotaMB * 1024 * 1024;

    const remainingMB = Math.max(quotaMB - totalMB, 0);
    const remainingKB = Math.max(quotaKB - totalKB, 0);
    const remainingBytes = Math.max(quotaBytes - totalBytes, 0);

    const usagePercentage = (totalMB / quotaMB) * 100;
    const remainingPercentage = Math.max(100 - usagePercentage, 0);
    const remainingEstimatedDocs = Math.max(500000 - totalDocuments, 0);

    const formattedMB = totalMB < 0.01 ? (totalKB / 1024).toFixed(3) : totalMB.toFixed(2);
    const formattedPercent = usagePercentage < 0.01 ? '0.03%' : `${usagePercentage.toFixed(2)}%`;
    const formattedRemainingMB = remainingMB.toFixed(2);
    const formattedRemainingPercent = `${remainingPercentage.toFixed(2)}%`;

    // Sections Breakdown per Module / Collection (7 Realtime Categories)
    const sections = [
      {
        id: 'pillar_members',
        title: 'Data 10 Pilar PSKS',
        collection: 'psks_records (Tabel Utama Pilar)',
        purpose: 'Menyimpan seluruh basis data keanggotaan, pengurus, NIK, kontak, legalitas SK, dan alamat 10 Pilar Sosial se-Jawa Barat (Karang Taruna, TKSK, PSM, LKS, KSB, WKSBM, dll.).',
        count: pillarRecordsCount,
        bytes: pillarBytes,
        kb: pillarBytes / 1024,
        mb: pillarBytes / (1024 * 1024),
        percentOfQuota: (pillarBytes / quotaBytes) * 100,
        percentOfUsed: totalBytes > 0 ? (pillarBytes / totalBytes) * 100 : 0,
        badge: 'DATA UTAMA PILAR',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: Users,
      },
      {
        id: 'admin_accounts',
        title: 'Kredensial Akun Dinas & Wilayah',
        collection: 'admin_accounts (Kredensial)',
        purpose: 'Autentikasi 27 Dinas Sosial Kabupaten/Kota se-Jawa Barat, Superadmin Provinsi, dan Developer Master lengkap dengan hash kredensial, NIP, kontak resmi, dan hak otoritas wilayah.',
        count: adminAccountsCount,
        bytes: adminBytes,
        kb: adminBytes / 1024,
        mb: adminBytes / (1024 * 1024),
        percentOfQuota: (adminBytes / quotaBytes) * 100,
        percentOfUsed: totalBytes > 0 ? (adminBytes / totalBytes) * 100 : 0,
        badge: 'OTORITAS WILAYAH',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        icon: ShieldCheck,
      },
      {
        id: 'app_settings',
        title: 'Konfigurasi & Identitas Portal',
        collection: 'app_settings (Master Config)',
        purpose: 'Menyimpan preferensi global portal, nama instansi, visi misi, foto resmi Kepala Dinas Sosial, saklar mode maintenance per wilayah, nomor WhatsApp CS, dan video latar.',
        count: settingsCount,
        bytes: settingsBytes,
        kb: settingsBytes / 1024,
        mb: settingsBytes / (1024 * 1024),
        percentOfQuota: (settingsBytes / quotaBytes) * 100,
        percentOfUsed: totalBytes > 0 ? (settingsBytes / totalBytes) * 100 : 0,
        badge: 'CONFIG SYSTEM',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: Sliders,
      },
      {
        id: 'admin_messages',
        title: 'Kotak Masuk & Instruksi Wilayah',
        collection: 'admin_messages (Inbox Dinas)',
        purpose: 'Jalur komunikasi internal pengawasan dinas, disposisi berkas, surat edaran, instruksi pembinaan pilar sosial, dan koordinasi cepat antar Dinsos Provinsi dan 27 Kab/Kota.',
        count: messagesCount,
        bytes: messagesBytes,
        kb: messagesBytes / 1024,
        mb: messagesBytes / (1024 * 1024),
        percentOfQuota: (messagesBytes / quotaBytes) * 100,
        percentOfUsed: totalBytes > 0 ? (messagesBytes / totalBytes) * 100 : 0,
        badge: 'KOTAK MASUK',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        icon: Mail,
      },
      {
        id: 'registration_submissions',
        title: 'Registrasi Mandiri PSKS',
        collection: 'registration_submissions',
        purpose: 'Menampung formulir pendaftaran mandiri dan pengajuan data pilar sosial baru dari masyarakat/pengurus sebelum diverifikasi dan disahkan oleh dinas sosial.',
        count: registrationsCount,
        bytes: registrationsBytes,
        kb: registrationsBytes / 1024,
        mb: registrationsBytes / (1024 * 1024),
        percentOfQuota: (registrationsBytes / quotaBytes) * 100,
        percentOfUsed: totalBytes > 0 ? (registrationsBytes / totalBytes) * 100 : 0,
        badge: 'VERIFIKASI MANDIRI',
        badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
        icon: FileText,
      },
      {
        id: 'system_logs',
        title: 'Riwayat Log Audit & Keamanan',
        collection: 'psks_system_logs (Audit Trail)',
        purpose: 'Rekam jejak digital terenkripsi untuk seluruh aktivitas login, pengubahan data pilar, ekspor laporan data, dan deteksi proteksi keamanan sistem.',
        count: logsCount,
        bytes: logsBytes,
        kb: logsBytes / 1024,
        mb: logsBytes / (1024 * 1024),
        percentOfQuota: (logsBytes / quotaBytes) * 100,
        percentOfUsed: totalBytes > 0 ? (logsBytes / totalBytes) * 100 : 0,
        badge: 'AUDIT TRAIL',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
        icon: Activity,
      },
      {
        id: 'security_tokens',
        title: 'Smart Access Card & Token Keamanan',
        collection: 'security_tokens / device_registry',
        purpose: 'Registri Unique Hardware Identifier (UID) kartu fisik Smart Access Card Mifare 13,56 MHz, pairing otorisasi hardware browser terdaftar, dan payload QR Code bypass terenkripsi.',
        count: securityTokensCount,
        bytes: securityTokensBytes,
        kb: securityTokensBytes / 1024,
        mb: securityTokensBytes / (1024 * 1024),
        percentOfQuota: (securityTokensBytes / quotaBytes) * 100,
        percentOfUsed: totalBytes > 0 ? (securityTokensBytes / totalBytes) * 100 : 0,
        badge: 'HARDWARE TOKEN',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        icon: CreditCard,
      },
    ];

    return {
      totalDocuments,
      pillarRecordsCount,
      adminAccountsCount,
      totalBytes,
      totalKB,
      totalMB,
      quotaMB,
      quotaKB,
      quotaBytes,
      remainingMB,
      remainingKB,
      remainingBytes,
      usagePercentage,
      remainingPercentage,
      remainingEstimatedDocs,
      formattedDisplay: `${formattedMB} MB / 500 MB (${formattedPercent} Terpakai)`,
      formattedRemaining: `${formattedRemainingMB} MB / 500 MB (${formattedRemainingPercent} Bebas)`,
      formattedDetailKB: `${totalKB.toFixed(1)} KB`,
      sections,
    };
  }, [allPillarData, adminAccounts, appSettings, formData, adminMessages]);

  const selectedSection = propsSelectedSection !== undefined ? propsSelectedSection : internalSection;
  const lastActiveSectionRef = useRef<SettingsMenuSection | null>(selectedSection);

  useEffect(() => {
    if (selectedSection !== null) {
      lastActiveSectionRef.current = selectedSection;
    } else if (lastActiveSectionRef.current !== null && lastActiveSectionRef.current !== 'all') {
      const targetSec = lastActiveSectionRef.current;

      const scrollCardToCenter = () => {
        const cardEl = document.getElementById(`btn-menu-${targetSec}`);
        if (cardEl) {
          const rect = cardEl.getBoundingClientRect();
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;
          const cardHeight = rect.height;
          const targetScrollY = window.pageYOffset + rect.top - (windowHeight / 2) + (cardHeight / 2);

          window.scrollTo({
            top: Math.max(0, targetScrollY),
            behavior: 'smooth',
          });

          cardEl.classList.add('ring-4', 'ring-[#d4af37]', 'ring-offset-2');
          setTimeout(() => {
            cardEl.classList.remove('ring-4', 'ring-[#d4af37]', 'ring-offset-2');
          }, 1500);
          return true;
        }
        return false;
      };

      const timer = setTimeout(() => {
        if (!scrollCardToCenter()) {
          setTimeout(scrollCardToCenter, 100);
        }
      }, 60);

      return () => clearTimeout(timer);
    }
  }, [selectedSection]);

  const setSelectedSection = (sec: SettingsMenuSection | null) => {
    if (onSectionChange) {
      onSectionChange(sec);
    }
    setInternalSection(sec);
  };

  const isMainSettingSection = (sec: SettingsMenuSection | null) => {
    return sec === 'background' || sec === 'kadinas_photo' || sec === 'profil_text' || sec === 'medsos_wa';
  };

  const handleSelectSection = (sec: SettingsMenuSection) => {
    setLastTouchedSection(sec);
    setSelectedSection(sec);

    setTimeout(() => {
      const el = document.getElementById('settings-hero-header') || document.getElementById('settings-detail-section') || document.getElementById('pengaturan-section');
      if (el) {
        const rect = el.getBoundingClientRect();
        const offset = 90;
        const targetY = window.pageYOffset + rect.top - offset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }, 80);
  };

  const handleBackToSettingsMenu = () => {
    setSelectedSection(null);
  };

  const getHeaderTitleAndDesc = (section: SettingsMenuSection | null) => {
    switch (section) {
      case 'background':
        return {
          title: 'Pengaturan Background',
          desc: 'Upload berkas foto & memilih berkas video MP4 latar beranda live.',
          badge: 'MENU UTAMA 1/4',
        };
      case 'kadinas_photo':
        return {
          title: 'Pengaturan Foto Kadinas',
          desc: 'Perbarui foto resmi Ibu Kepala Dinas Sosial Provinsi Jawa Barat.',
          badge: 'MENU UTAMA 2/4',
        };
      case 'profil_text':
        return {
          title: 'Pengaturan Isi Halaman Profil',
          desc: 'Ubah Nama Kadinas, Jabatan, Sambutan, & Kalimat Profil.',
          badge: 'MENU UTAMA 3/4',
        };
      case 'medsos_wa':
        return {
          title: 'Pengaturan Media Sosial Resmi',
          desc: 'Atur 7 link media sosial & channel resmi Dinas Sosial Provinsi Jawa Barat.',
          badge: 'MENU UTAMA 4/4',
        };
      case 'security':
        return {
          title: 'Informasi Sistem Keamanan',
          desc: 'Informasi protokol keamanan, privasi data, dan sistem enkripsi.',
          badge: 'INFORMASI WEBSITE 1/8',
        };
      case 'smart_card':
        if (session?.role !== 'developer' && !session?.isDeveloper) {
          return {
            title: 'Smart Acces Card',
            desc: 'Tampilan visual kartu fisik resmi dan panduan penggunaan Smart Access Card.',
            badge: 'VISUAL & PANDUAN',
          };
        }
        return {
          title: 'Smart Access Card & Link Vercel (QR & NFC)',
          desc: 'Pengaturan & pemrograman Smart Card, generator link auto-login resmi Vercel, serta payload NFC Mifare 13,56 MHz.',
          badge: 'MENU PENGEMBANG',
        };
      case 'languages':
        return {
          title: 'Informasi Bahasa Pemrograman',
          desc: 'Informasi seluruh bahasa pemrograman & engine yang digunakan dalam website ini secara komprehensif.',
          badge: 'INFORMASI WEBSITE 3/8',
        };
      case 'libraries':
        return {
          title: 'Informasi Pustaka ( Library )',
          desc: 'Daftar pustaka NPM, SDK, & framework UI/UX terdaftar di PSKS Jabar.',
          badge: 'INFORMASI WEBSITE 4/8',
        };
      case 'database':
        return {
          title: 'Informasi Database Supabase Cloud',
          desc: 'Informasi penyimpanan Supabase Cloud PostgreSQL 500 MB, sinyal realtime & estimasi 500.000 data.',
          badge: 'INFORMASI WEBSITE 5/8',
        };
      case 'ai_assistant':
        return {
          title: 'Informasi Asisten AI Gemini 3.8 Flash',
          desc: 'Modul Asisten Kecerdasan Buatan Google Gemini 3.8 Flash terintegrasi server proxy.',
          badge: 'INFORMASI WEBSITE 6/8',
        };
      case 'team':
        return {
          title: 'Informasi Tim Pengembang',
          desc: 'Informasi susunan 6 divisi spesialisasi tim perancang & pengembang PSKS Jabar.',
          badge: 'INFORMASI WEBSITE 7/8',
        };
      case 'developer':
        return {
          title: 'Informasi Developer / Pengembang',
          desc: 'Profil Lead System Architect & Sole Fullstack Developer Ilham Fazril.',
          badge: 'INFORMASI WEBSITE 8/8',
        };
      case 'all':
        return {
          title: 'Pengaturan & Informasi Sistem Lengkap',
          desc: 'Menampilkan seluruh modul pengaturan dan dokumentasi sistem secara berurutan.',
          badge: 'SEMUA MODUL',
        };
      default:
        if (viewFilter === 'info_only') {
          return {
            title: 'Informasi Website',
            desc: 'Pusat informasi lengkap spesifikasi keamanan 18 lapis, smart access card, bahasa pemrograman, pustaka, database Supabase, AI, dan pengembang.',
            badge: 'FITUR 15 • KONTROL PUSAT',
          };
        }
        return {
          title: 'Pengaturan',
          desc: 'Modul pengontrolan pusat yang dikhususkan untuk konfigurasi latar belakang, foto pejabat resmi, media sosial, dan saklar sistem.',
          badge: 'OTORITAS TINGKAT TINGGI',
        };
    }
  };

  const currentHeaderInfo = getHeaderTitleAndDesc(selectedSection);

  // States for Accordions/Filters in Language & Library sections
  const [openSecurityIndex, setOpenSecurityIndex] = useState<number | null>(null);
  const [langSearch, setLangSearch] = useState('');
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [libCategory, setLibCategory] = useState<'all' | 'ui' | 'cloud' | 'ai_gis' | 'security'>('all');
  const [libSearch, setLibSearch] = useState('');
  const [expandedLib, setExpandedLib] = useState<string | null>(null);

  // Dedicated Background Change Success Popup Modal State
  const [bgChangeSuccessModal, setBgChangeSuccessModal] = useState<boolean>(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setFormData(appSettings || DEFAULT_APP_SETTINGS);
  }, [appSettings]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen && !inline) return null;

  const triggerAutoSave = (newData: AppSettings, immediate = false, isBgChange = false) => {
    setFormData(newData);

    if (isBgChange) {
      setBgChangeSuccessModal(true);
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const executeSave = async () => {
      try {
        setIsSaving(true);
        await onSaveSettings(newData);
        setSaveSuccessMsg('Perubahan berhasil tersimpan otomatis di database (Realtime Jabar)!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } catch (err) {
        console.error('Auto save error:', err);
      } finally {
        setIsSaving(false);
      }
    };

    if (immediate) {
      executeSave();
    } else {
      saveTimeoutRef.current = setTimeout(executeSave, 400);
    }
  };

  const handleResetDefault = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan semua pengaturan ke standar default awal PSKS JABAR?')) {
      triggerAutoSave(DEFAULT_APP_SETTINGS, true);
    }
  };

  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 720;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'bgVideoUrl' | 'bgPhotoUrl' | 'kadinasPhotoUrl' | 'logoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 35 * 1024 * 1024) {
      alert('Ukuran berkas terlalu besar. Maksimal 35MB.');
      return;
    }

    if (targetField === 'bgVideoUrl') {
      try {
        setVideoUploadProgress(15);
        await uploadVideoChunksToFirestore(file, (pct) => setVideoUploadProgress(pct));
        setSaveSuccessMsg('✅ Video Latar Belakang Berhasil Diupload & Tersinkron Realtime ke Semua Perangkat!');
        setBgChangeSuccessModal(true);
        setTimeout(() => setVideoUploadProgress(null), 3000);
      } catch (err: any) {
        console.warn('Video chunks upload warning:', err);
        setVideoUploadProgress(null);
      }
    }

    if (targetField === 'bgPhotoUrl' || targetField === 'kadinasPhotoUrl' || targetField === 'logoUrl') {
      try {
        const compressedBase64 = await compressImageFile(file);
        const isBg = targetField === 'bgPhotoUrl';
        triggerAutoSave({ ...formData, [targetField]: compressedBase64 }, true, isBg);
        return;
      } catch (err) {
        console.warn('Image compression fallback:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const isBg = targetField === 'bgPhotoUrl';
        triggerAutoSave({ ...formData, [targetField]: result }, true, isBg);
      }
    };
    reader.readAsDataURL(file);
  };

  const content = (
    <div
      className={`relative w-full ${
        inline ? 'max-w-none shadow-none border-0' : 'max-w-5xl max-h-[90vh] shadow-2xl rounded-3xl border-2 border-[#d4af37]'
      } bg-slate-50 overflow-hidden flex flex-col font-sans text-slate-800`}
    >
      {/* TOP FLOATING NOTIFICATION TOAST */}
      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white px-6 py-3 text-xs font-black flex items-center justify-between shrink-0 animate-fadeIn z-50 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-white hover:opacity-80 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* HERO HEADER BOX */}
        <div id="settings-hero-header" className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <OfficialPsksLogo logoUrl={formData.logoUrl || appSettings?.logoUrl} sizeClassName="w-10 h-10 sm:w-11 sm:h-11" />
                <div className="inline-flex items-center gap-2 bg-[#043e2e] border border-[#d4af37]/60 px-3 py-1 rounded-full text-[11px] font-black text-[#d4af37]">
                  <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{currentHeaderInfo.badge}</span>
                </div>
              </div>
              {!inline && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/80 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 transition-all cursor-pointer shadow-md"
                  title="Tutup Panel Pengaturan"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {currentHeaderInfo.title}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-2xl leading-relaxed">
              {currentHeaderInfo.desc}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* IF NO SPECIFIC SECTION IS SELECTED: DISPLAY THE 2 CARDS NAVIGATION SECTIONS */}
        {/* ========================================================================= */}
        {selectedSection === null && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* SECTION 1: MENU UTAMA PENGATURAN (4 CARDS) */}
            {viewFilter !== 'info_only' && (
              <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 p-4 px-6 text-white border-b-2 border-[#d4af37] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#d4af37] text-[#043e2e] font-black shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      MENU UTAMA PENGATURAN
                    </h3>
                    <p className="text-xs text-emerald-200/90 font-medium">
                      Konfigurasi visual, profil, kontak & saklar
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-[#d4af37] text-[#043e2e] px-3 py-1 rounded-full shadow-sm">
                  4 MENU
                </span>
              </div>

              <div className="p-3.5 sm:p-6 grid grid-cols-1 gap-2.5 sm:gap-4">
                {/* CARD 1: BACKGROUND */}
                <div
                  id="btn-menu-background"
                  onClick={() => handleSelectSection('background')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-[#d4af37] hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-[#d4af37] font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Background
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-amber-100 text-amber-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-amber-300 whitespace-nowrap">
                          FOTO & VIDEO
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Upload berkas foto & memilih berkas video MP4 latar beranda live.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 2: FOTO KADINAS */}
                <div
                  id="btn-menu-kadinas_photo"
                  onClick={() => handleSelectSection('kadinas_photo')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-[#d4af37] hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-[#d4af37] font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Foto Kadinas
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-amber-100 text-amber-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-amber-300 whitespace-nowrap">
                          PEJABAT RESMI
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Perbarui foto resmi Ibu Kepala Dinas Sosial Provinsi Jawa Barat.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 3: ISI HALAMAN PROFIL */}
                <div
                  id="btn-menu-profil_text"
                  onClick={() => handleSelectSection('profil_text')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-[#d4af37] hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-[#d4af37] font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Isi Halaman Profil
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-amber-100 text-amber-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-amber-300 whitespace-nowrap">
                          TEKS & SAMBUTAN
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Ubah Nama Kadinas, Jabatan, Sambutan, & Kalimat Profil.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 4: MEDSOS & WHATSAPP */}
                <div
                  id="btn-menu-medsos_wa"
                  onClick={() => handleSelectSection('medsos_wa')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-[#d4af37] hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-[#d4af37] font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Media Sosial Resmi
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-amber-100 text-amber-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-amber-300 whitespace-nowrap">
                          KONTAK SISTEM
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Atur 7 tautan media sosial & channel resmi Dinas Sosial Provinsi Jawa Barat.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </div>
              </div>
            )}

            {/* SECTION 2: INFORMASI WEBSITE (8 MENU) */}
            {viewFilter !== 'settings_only' && (
              <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 p-4 px-6 text-white border-b-2 border-[#d4af37] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-700 text-white font-black shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      INFORMASI WEBSITE
                    </h3>
                    <p className="text-xs text-emerald-200/90 font-medium">
                      Informasi riwayat log, keamanan, smart card, database & pengembang
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-emerald-400 text-slate-950 px-3 py-1 rounded-full shadow-sm">
                  8 MENU
                </span>
              </div>

              <div className="p-3.5 sm:p-6 grid grid-cols-1 gap-2.5 sm:gap-4">
                {/* CARD 5: SISTEM KEAMANAN */}
                <div
                  id="btn-menu-security"
                  onClick={() => handleSelectSection('security')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-emerald-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Sistem Keamanan
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap">
                          ENKRIPSI & PROTEKSI
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Informasi protokol keamanan, privasi data, dan sistem enkripsi.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 6: SMART ACCESS CARD */}
                <div
                  id="btn-menu-smart_card"
                  onClick={() => handleSelectSection('smart_card')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-emerald-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          {session?.role !== 'developer' && !session?.isDeveloper
                            ? 'Smart Acces Card'
                            : 'Smart Access Card & Link Vercel'}
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap">
                          {session?.role !== 'developer' && !session?.isDeveloper
                            ? 'VISUAL & PANDUAN'
                            : 'VERCEL, QR & NFC'}
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        {session?.role !== 'developer' && !session?.isDeveloper
                          ? 'Tampilan visual kartu fisik resmi dan panduan penggunaan Smart Access Card.'
                          : 'Pengaturan & pemrograman smart card, tautan bypass Vercel resmi, token Superadmin & Developer.'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 7: BAHASA PEMROGRAMAN */}
                <div
                  id="btn-menu-languages"
                  onClick={() => handleSelectSection('languages')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-emerald-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <Code2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Bahasa Pemrograman
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap">
                          TECH STACK
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Informasi seluruh bahasa pemrograman & engine yang digunakan dalam website.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 8: PUSTAKA LIBRARY */}
                <div
                  id="btn-menu-libraries"
                  onClick={() => handleSelectSection('libraries')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-emerald-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Pustaka ( Library )
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap">
                          FRAMEWORK & SDK
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Informasi seluruh pustaka, framework, & modul dependensi.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 9: DATABASE */}
                <div
                  id="btn-menu-database"
                  onClick={() => handleSelectSection('database')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-emerald-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <Database className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Database
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap">
                          SUPABASE
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Informasi infrastruktur basis data dan sinkronisasi real-time.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 10: ASISTEN AI */}
                <div
                  id="btn-menu-ai_assistant"
                  onClick={() => handleSelectSection('ai_assistant')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-amber-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Asisten AI
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-purple-100 text-purple-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-purple-300 whitespace-nowrap">
                          GEMINI 3.8
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Informasi modul Asisten AI Google Gemini 3.8 Flash terintegrasi.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 11: TIM PENGEMBANG */}
                <div
                  id="btn-menu-team"
                  onClick={() => handleSelectSection('team')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-emerald-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Tim Pengembang
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap">
                          DINSOS JABAR
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Daftar susunan tim perancang UI/UX dan pengembang sistem.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* CARD 12: DEVELOPER */}
                <div
                  id="btn-menu-developer"
                  onClick={() => handleSelectSection('developer')}
                  className="group p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#043e2e] text-emerald-300 font-black group-hover:scale-105 transition-transform shrink-0 shadow-md">
                      <Code className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <h4 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-[#043e2e] truncate">
                          Developer
                        </h4>
                        <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-300 whitespace-nowrap">
                          CORE LEAD
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Informasi kontak teknis developer utama & pemeliharaan sistem.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </div>
            </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* EDITING FORMS & DETAIL PANELS (WHEN A CARD OR "ALL" IS SELECTED) */}
        {/* ========================================================================= */}
        {selectedSection !== null && (
          <div id="settings-detail-section" className="space-y-8 animate-fadeIn">

            {/* 1. BACKGROUND SECTION */}
            {(selectedSection === 'background' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#043e2e] text-[#d4af37] shadow-sm">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        PENGATURAN BACKGROUND BERANDA
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Pilih mode latar belakang portal beranda (Mode Video Eco Office MP4 / Mode Foto Static) serta upload berkas secara langsung.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200 uppercase">
                    {formData.bgMode === 'video' ? 'Mode Video Active' : 'Mode Foto Active'}
                  </span>
                </div>

                {/* MODE SELECTION CARDS */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    1. Pilih Mode Latar Belakang Utama
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => triggerAutoSave({ ...formData, bgMode: 'video' }, true)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                        formData.bgMode === 'video'
                          ? 'border-[#043e2e] bg-emerald-50/90 text-[#043e2e] shadow-md ring-2 ring-[#d4af37]/50'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${formData.bgMode === 'video' ? 'bg-[#043e2e] text-[#d4af37]' : 'bg-slate-100 text-slate-500'}`}>
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black">Mode Video Eco Office</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Memutar video latar belakang loop bergerak di beranda</p>
                          </div>
                        </div>
                        {formData.bgMode === 'video' && (
                          <span className="p-1 rounded-full bg-[#043e2e] text-[#d4af37]">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerAutoSave({ ...formData, bgMode: 'photo' }, true)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                        formData.bgMode === 'photo'
                          ? 'border-[#043e2e] bg-emerald-50/90 text-[#043e2e] shadow-md ring-2 ring-[#d4af37]/50'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${formData.bgMode === 'photo' ? 'bg-[#043e2e] text-[#d4af37]' : 'bg-slate-100 text-slate-500'}`}>
                            <ImageIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black">Mode Foto Static</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Menampilkan foto gambar statis resolusi tinggi di beranda</p>
                          </div>
                        </div>
                        {formData.bgMode === 'photo' && (
                          <span className="p-1 rounded-full bg-[#043e2e] text-[#d4af37]">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* FORM INPUTS & UPLOAD BUTTONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* VIDEO CONFIG & PREVIEW */}
                  <div className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${formData.bgMode === 'video' ? 'bg-slate-50 border-[#043e2e]/30' : 'bg-white border-slate-200 opacity-75'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#043e2e]" />
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Konfigurasi Video Background (MP4)
                        </label>
                      </div>
                      {formData.bgMode === 'video' && (
                        <span className="text-[10px] font-black bg-[#043e2e] text-[#d4af37] px-2.5 py-0.5 rounded-md">AKTIF</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Tautan / URL Video</label>
                        <input
                          type="text"
                          value={formData.bgVideoUrl || ''}
                          onChange={(e) => triggerAutoSave({ ...formData, bgVideoUrl: e.target.value })}
                          placeholder="https://domain.com/video.mp4"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">Atau upload dari komputer/HP:</span>
                        <label className="px-3.5 py-2 rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border border-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{videoUploadProgress !== null ? `Sinkronisasi... ${videoUploadProgress}%` : 'Upload Video File'}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/*"
                            disabled={videoUploadProgress !== null}
                            onChange={(e) => handleFileUpload(e, 'bgVideoUrl')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {videoUploadProgress !== null && (
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-emerald-500 via-amber-400 to-[#d4af37] h-full transition-all duration-300 rounded-full"
                            style={{ width: `${videoUploadProgress}%` }}
                          />
                        </div>
                      )}

                      {formData.bgVideoUrl && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Live Preview Video:</span>
                          <div className="relative rounded-xl overflow-hidden border-2 border-[#d4af37] bg-slate-950 shadow-sm max-h-48">
                            <video
                              src={formData.bgVideoUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Playing MP4 Preview</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PHOTO CONFIG & PREVIEW */}
                  <div className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${formData.bgMode === 'photo' ? 'bg-slate-50 border-[#043e2e]/30' : 'bg-white border-slate-200 opacity-75'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#043e2e]" />
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Konfigurasi Foto Background Static
                        </label>
                      </div>
                      {formData.bgMode === 'photo' && (
                        <span className="text-[10px] font-black bg-[#043e2e] text-[#d4af37] px-2.5 py-0.5 rounded-md">AKTIF</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Tautan / URL Foto Static</label>
                        <input
                          type="text"
                          value={formData.bgPhotoUrl || ''}
                          onChange={(e) => triggerAutoSave({ ...formData, bgPhotoUrl: e.target.value })}
                          placeholder="https://domain.com/background.jpg"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">Atau upload dari komputer/HP:</span>
                        <label className="px-3.5 py-2 rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border border-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Foto File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'bgPhotoUrl')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {formData.bgPhotoUrl && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Live Preview Foto Static:</span>
                          <div className="relative rounded-xl overflow-hidden border-2 border-[#d4af37] bg-slate-900 shadow-sm max-h-48">
                            <img
                              src={formData.bgPhotoUrl}
                              alt="Preview Background Static"
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-[#d4af37] flex items-center gap-1.5">
                              <ImageIcon className="w-3 h-3 text-[#d4af37]" />
                              <span>Static Image Loaded</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1.5. LOGO RESMI PSKS JABAR (PERMANEN FIRESTORE) */}
            {(selectedSection === 'kadinas_photo' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#043e2e] text-[#d4af37]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        LOGO RESMI PSKS JAWA BARAT
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        URL permanen logo resmi yang tersimpan di Firestore dengan render presisi bulatan penuh (tanpa background bocor).
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full border border-emerald-200">
                    Logo Resmi
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">URL Logo Resmi PSKS</label>
                      <input
                        type="text"
                        value={formData.logoUrl || ''}
                        onChange={(e) => triggerAutoSave({ ...formData, logoUrl: e.target.value })}
                        placeholder="https://... atau data image permanen"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <label className="px-4 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border border-[#d4af37] text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logoUrl')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                    <OfficialPsksLogo logoUrl={formData.logoUrl} sizeClassName="w-16 h-16" />
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Preview Logo Resmi PSKS Jabar</span>
                      <span className="text-xs text-emerald-900 font-bold mt-0.5 block">Format: aspect-square rounded-full object-cover</span>
                      <span className="text-[11px] text-slate-500 font-medium">Bentuk bulat sempurna, ring emas dinas, background transparan bersih.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FOTO KADINAS SECTION */}
            {(selectedSection === 'kadinas_photo' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#043e2e] text-[#d4af37]">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        PENGATURAN FOTO RESMI KEPALA DINAS SOSIAL
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Perbarui tautan foto resmi Ibu Kepala Dinas Sosial Provinsi Jawa Barat atau upload langsung dari perangkat.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                    Pejabat Resmi
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">URL Foto Resmi Kepala Dinas</label>
                      <input
                        type="text"
                        value={formData.kadinasPhotoUrl || ''}
                        onChange={(e) => triggerAutoSave({ ...formData, kadinasPhotoUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <label className="px-4 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border border-[#d4af37] text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto Kadinas</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'kadinasPhotoUrl')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {formData.kadinasPhotoUrl && (
                    <div className="flex items-center gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                      <img
                        src={formData.kadinasPhotoUrl}
                        alt="Preview Kadinas"
                        className="w-16 h-20 object-cover rounded-xl border-2 border-[#d4af37] shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">Preview Foto Resmi Kadinas</span>
                        <span className="text-xs text-emerald-900 font-bold mt-0.5 block">{formData.kadinasName || 'Kepala Dinas Sosial Jabar'}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{formData.profileSubtitle || 'Dinas Sosial Provinsi Jawa Barat'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. ISI HALAMAN PROFIL SECTION WITH LIVE PREVIEW */}
            {(selectedSection === 'profil_text' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#043e2e] text-[#d4af37]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        PENGATURAN TEKS & SAMBUTAN HALAMAN PROFIL
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Atur data identitas, nama, serta kalimat sambutan resmi Kepala Dinas Sosial dengan Live Preview interaktif.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Auto-Save Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: EDITABLE INPUT FIELDS */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap & Gelar Kadinas</label>
                        <input
                          type="text"
                          value={formData.kadinasName || ''}
                          onChange={(e) => triggerAutoSave({ ...formData, kadinasName: e.target.value })}
                          placeholder="Noneng Komara Nengsih, S.E., M.A.P."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Jabatan / Subtitle Official</label>
                        <input
                          type="text"
                          value={formData.profileSubtitle || ''}
                          onChange={(e) => triggerAutoSave({ ...formData, profileSubtitle: e.target.value })}
                          placeholder="Kepala Dinas Sosial Provinsi Jawa Barat"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Salam Pembuka</label>
                        <input
                          type="text"
                          value={formData.profileGreeting || ''}
                          onChange={(e) => triggerAutoSave({ ...formData, profileGreeting: e.target.value })}
                          placeholder="Assalamualaikum Wr. Wb."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Salam Penutup</label>
                        <input
                          type="text"
                          value={formData.profileClosing || ''}
                          onChange={(e) => triggerAutoSave({ ...formData, profileClosing: e.target.value })}
                          placeholder="Wassalamualaikum Wr. Wb."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Isi Pesan Sambutan (Multiline Text)</label>
                      <textarea
                        rows={7}
                        value={formData.profileBody || ''}
                        onChange={(e) => triggerAutoSave({ ...formData, profileBody: e.target.value })}
                        placeholder="Tuliskan kalimat sambutan resmi di sini..."
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#d4af37] leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: LIVE PREVIEW BOX */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-[#043e2e] to-slate-900 p-4 sm:p-5 rounded-3xl border-2 border-[#d4af37] text-white space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                          LIVE PREVIEW HALAMAN PROFIL
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-[#d4af37] text-slate-950 px-2 py-0.5 rounded-md">
                        REALTIME
                      </span>
                    </div>

                    {/* PREVIEW CONTAINER */}
                    <div className="bg-white/95 text-slate-800 p-4 rounded-2xl space-y-3.5 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={
                              formData.kadinasPhotoUrl &&
                              formData.kadinasPhotoUrl !== 'LOCAL_STORAGE_SAVED_PHOTO' &&
                              !formData.kadinasPhotoUrl.startsWith('C:') &&
                              !formData.kadinasPhotoUrl.startsWith('file:') &&
                              !formData.kadinasPhotoUrl.includes('Users\\')
                                ? formData.kadinasPhotoUrl
                                : OFFICIAL_KADINAS_PHOTO
                            }
                            alt="Kadinas"
                            className="w-14 h-16 object-cover rounded-xl border-2 border-[#d4af37] shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = OFFICIAL_KADINAS_PHOTO;
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-0.5 rounded-full border border-amber-300">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-300" />
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md uppercase tracking-wider block w-max mb-1 border border-amber-200">
                            Profil Resmi Pimpinan
                          </span>
                          <h4 className="text-xs font-black text-[#043e2e] leading-tight">
                            {formData.kadinasName || 'Noneng Komara Nengsih, S.E., M.A.P.'}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            {formData.profileSubtitle || 'Kepala Dinas Sosial Provinsi Jawa Barat'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200 text-left text-[11px] leading-relaxed">
                        {formData.profileGreeting && (
                          <p className="font-black text-[#043e2e] text-xs">
                            {formData.profileGreeting}
                          </p>
                        )}

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5 text-slate-700 text-[10px] italic">
                          {(formData.profileBody || '')
                            .split('\n')
                            .filter((p) => p.trim().length > 0)
                            .map((para, pIdx) => (
                              <p key={pIdx}>{para}</p>
                            ))}
                        </div>

                        {formData.profileClosing && (
                          <p className="font-bold text-[#043e2e] italic flex items-center gap-1.5 pt-1">
                            <span className="w-4 h-0.5 bg-[#d4af37] rounded-full inline-block" />
                            {formData.profileClosing}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MEDSOS SECTION */}
            {(selectedSection === 'medsos_wa' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#043e2e] text-[#d4af37]">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        PENGATURAN MEDIA SOSIAL RESMI
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Atur 7 tautan media sosial & channel resmi Dinas Sosial Provinsi Jawa Barat.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
                    Kontak Sistem
                  </span>
                </div>

                {/* 7 SOSMED LINKS */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    7 Tautan Media Sosial Resmi
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'whatsapp', label: '1. WhatsApp Channel / Admin', icon: Phone, ph: 'https://wa.me/...' },
                      { key: 'instagram', label: '2. Instagram Resmi (@dinsos.jabar)', icon: Instagram, ph: 'https://www.instagram.com/dinsos.jabar' },
                      { key: 'youtube', label: '3. YouTube TV (Dinsos Jabar TV)', icon: Youtube, ph: 'https://youtube.com/@dinsosjabartv' },
                      { key: 'facebook', label: '4. Halaman Facebook Resmi', icon: Facebook, ph: 'https://facebook.com/...' },
                      { key: 'tiktok', label: '5. TikTok Resmi (@dinsos.jabar)', icon: Video, ph: 'https://tiktok.com/@dinsos.jabar' },
                      { key: 'email', label: '6. Email Official / Mailto', icon: AtSign, ph: 'mailto:dinsos@jabarprov.go.id' },
                      { key: 'x', label: '7. X / Twitter (@dinsosjabar)', icon: Twitter, ph: 'https://x.com/dinsosjabar' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-[#043e2e]" />
                            <span>{item.label}</span>
                          </label>
                          <input
                            type="text"
                            value={(formData.socialLinks as any)?.[item.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              triggerAutoSave({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, [item.key]: val },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#d4af37]"
                            placeholder={item.ph}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. SISTEM KEAMANAN SECTION */}
            {(selectedSection === 'security' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#043e2e] text-emerald-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        SPESIFIKASI & INFRASTRUKTUR SISTEM KEAMANAN (COMPREHENSIVE)
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        18 Lapisan Proteksi Keamanan Terenkripsi, Kepatuhan UU PDP No. 27/2022, Audit Forensik BSSN, & Hardening Server Diskominfo.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
                    18 Lapisan Proteksi Aktif
                  </span>
                </div>

                {/* 18 ACCORDION SECURITY MODULES (BERJEJER KEBAWAH) */}
                <div className="space-y-3.5">
                  {[
                    {
                      id: 'privacy_masking',
                      num: '1',
                      title: '1. PRIVACY MASKING NIK & DATA PRIBADI (UU PDP NO. 27/2022)',
                      badge: 'UU PDP COMPLIANCE',
                      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      headerBg: 'bg-gradient-to-r from-emerald-950/10 via-emerald-900/5 to-slate-900/5 border-emerald-300/60',
                      icon: Eye,
                      iconColor: 'text-emerald-600',
                      accentBox: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 font-mono text-[11px]',
                      desc: 'Algoritma penyamaran data pribadi otomatis pada tabel publik guna melindungi kerahasiaan identitas kependudukan aparatur dan anggota pilar sesuai UU Perlindungan Data Pribadi.',
                      details: [
                        'Masking NIK 16 digit otomatis untuk publik/tamu: 6 digit awal & 4 digit akhir ditampilkan, 6 digit tengah disamarkan (contoh: 320428******0001).',
                        'Masking Nomor Telepon/HP: disamarkan bagian tengahnya (contoh: 0812****7890) untuk mencegah spamming dan profiling.',
                        'Masking Alamat Email resmi kedinasan pada tampilan publik.',
                        'Data asli hanya dapat didekripsi dan dibuka secara utuh oleh akun Admin Daerah, Superadmin, atau Developer dengan sesi terverifikasi.',
                      ],
                      tags: ['UU PDP No. 27/2022', 'Data Anonymization', 'PII Masking', 'Role Unmasking'],
                      codePreview: 'maskNIK("3204281234560001") -> "320428******0001" | maskPhone("081234567890") -> "0812****7890"',
                    },
                    {
                      id: 'smart_gate',
                      num: '2',
                      title: '2. SMART SECURITY GATE MODAL',
                      badge: 'GATEWAY INTERCEPTOR',
                      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
                      headerBg: 'bg-gradient-to-r from-amber-950/10 via-amber-900/5 to-slate-900/5 border-amber-300/60',
                      icon: Lock,
                      iconColor: 'text-amber-600',
                      accentBox: 'bg-slate-900 border-amber-500/50 text-amber-100',
                      desc: 'Mekanisme pintu gerbang modal keamanan pintar yang secara otomatis memverifikasi identitas pengguna dan mencegah rute privat diakses tanpa izin otorisasi yang sah.',
                      details: [
                        'Pencegatan otomatis pada rute sensitif sebelum merender halaman privat.',
                        'Dukungan challenge otorisasi 2-Langkah bagi Superadmin & Admin Wilayah.',
                        'Visual dialog modal terlindungi dengan backdrop blur 12px dan deteksi timeout otomatis.',
                      ],
                      tags: ['Route Interceptor', '2FA Challenge', 'Modal Shield'],
                    },
                    {
                      id: 'captcha',
                      num: '3',
                      title: '3. VISUAL INTERACTIVE CAPTCHA',
                      badge: 'ANTI-BOT DEFENSE',
                      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      headerBg: 'bg-gradient-to-r from-emerald-950/10 via-emerald-900/5 to-slate-900/5 border-emerald-300/60',
                      icon: Puzzle,
                      iconColor: 'text-emerald-600',
                      accentBox: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100',
                      desc: 'Teka-teki verifikasi manusia berbasis pola visual dan tantangan logika interaktif untuk menghentikan serangan bot dan otomatisasi login.',
                      details: [
                        'Verifikasi acak matematika dan ekstraksi visual real-time.',
                        'Eksekusi murni di sisi Client & Server tanpa ketergantungan API pihak ketiga (Zero Downtime).',
                        'Mencegah manipulasi formulir publik, pendaftaran palsu, dan spamming laporan.',
                      ],
                      tags: ['Zero 3rd-Party Latency', 'Math Logic Challenge', 'Bot Inhibitor'],
                    },
                    {
                      id: 'bcrypt_sha256',
                      num: '4',
                      title: '4. ENKRIPSI KRIPTOGRAFI PASSWORD (BCRYPT / SHA-256 HASHING)',
                      badge: 'ONE-WAY CRYPTO HASH',
                      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
                      headerBg: 'bg-gradient-to-r from-blue-950/10 via-blue-900/5 to-slate-900/5 border-blue-300/60',
                      icon: Key,
                      iconColor: 'text-blue-600',
                      accentBox: 'bg-slate-950 border-blue-500/50 text-blue-200 font-mono text-[11px]',
                      desc: 'Skema keamanan kredensial dengan pengacakan kriptografi standar militer untuk menjamin kata sandi tidak dapat diretas walaupun database diekstraksi.',
                      details: [
                        'BcryptJS dengan Cost Factor (Salt Rounds) = 10 untuk pencegahan serangan Rainbow Table dan GPU cracking.',
                        'Integrasi SHA-256 Digest Hashing sebagai penanda integritas berkas & otentikasi kunci otorisasi.',
                        'Zero Plaintext Storage: Kata sandi asli tidak pernah disimpan dalam format teks mentah di penyimpanan lokal maupun cloud.',
                      ],
                      tags: ['Bcrypt Cost: 10', 'SHA-256 Digest', 'Salted Hash'],
                      codePreview: '$2a$10$e8XkP12qM9zL9A3vK7... [ENCRYPTED DIGEST]',
                    },
                    {
                      id: 'password_policy',
                      num: '5',
                      title: '5. KEBIJAKAN KATA SANDI KETAT (MINIMAL 12 KARAKTER KOMBINASI)',
                      badge: 'STRONG PASSWORD ENFORCEMENT',
                      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                      headerBg: 'bg-gradient-to-r from-indigo-950/10 via-indigo-900/5 to-slate-900/5 border-indigo-300/60',
                      icon: KeyRound,
                      iconColor: 'text-indigo-600',
                      accentBox: 'bg-slate-950 border-indigo-500/50 text-indigo-200 font-mono text-[11px]',
                      desc: 'Standar kekuatan kata sandi akun administratif tingkat provinsi dan kabupaten/kota yang mewajibkan entropi tinggi sesuai standar keamanan Diskominfo.',
                      details: [
                        'Wajib panjang minimal 12 karakter untuk seluruh akun Admin Daerah dan Superadmin.',
                        'Wajib memuat kombinasi huruf besar (A-Z), huruf kecil (a-z), dan karakter angka (0-9).',
                        'Pencegahan penggunaan kata sandi umum atau default (anti-dictionary attack).',
                        'Validasi regex ketat saat penambahan akun baru dan saat pergantian password di Manajemen Akun Admin.',
                      ],
                      tags: ['Min 12 Chars', 'Uppercase & Lowercase', 'Numeric Enforced', 'High Entropy'],
                      codePreview: 'REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{12,}$/ (Enforced in AdminManagement)',
                    },
                    {
                      id: 'rate_limiting',
                      num: '6',
                      title: '6. RATE LIMITING AUTHENTICATION & PEMBEKUAN AKUN',
                      badge: 'BRUTE FORCE PROTECTION',
                      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
                      headerBg: 'bg-gradient-to-r from-rose-950/10 via-rose-900/5 to-slate-900/5 border-rose-300/60',
                      icon: Clock,
                      iconColor: 'text-rose-600',
                      accentBox: 'bg-rose-950/90 border-rose-500/50 text-rose-100',
                      desc: 'Mekanisme pertahanan aktif ganda (server-side & client-side) yang membatasi frekuensi percobaan login berulang dan memblokir IP penyerang.',
                      details: [
                        'Server-Side Rate Limiter: Maksimal 15 percobaan akses per menit per IP address di endpoint /api/auth/verify-qr (HTTP 429 Too Many Requests).',
                        'Ambang batas login antarmuka: Maksimal 3x salah password berturut-turut memicu cooldown 30 detik (berlipat ganda 2x jika diulang).',
                        'Logging IP Address dan riwayat kegagalan login untuk analisis insiden forensik.',
                      ],
                      tags: ['Server Rate Limiter: 15/min', 'Max Retries: 3', 'Cooldown: 30s', 'Anti Brute-Force'],
                    },
                    {
                      id: 'ai_rate_limiting',
                      num: '7',
                      title: '7. AI CHATBOT ANTI-SPAM & QUOTA PROTECTION LIMITER',
                      badge: 'AI DOS MITIGATION',
                      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
                      headerBg: 'bg-gradient-to-r from-purple-950/10 via-purple-900/5 to-slate-900/5 border-purple-300/60',
                      icon: Sparkles,
                      iconColor: 'text-purple-600',
                      accentBox: 'bg-purple-950/90 border-purple-500/50 text-purple-100',
                      desc: 'Pembatasan frekuensi pertanyaan pada asisten AI Gemini 3.8 Flash guna mencegah spamming bot, eksploitasi kuota API, dan serangan denial of service.',
                      details: [
                        'Server Rate Limiter: Maksimal 30 permintaan per menit per IP address pada endpoint /api/ai/chat.',
                        'Respons ramah pengguna (HTTP 429) dengan pesan jeda pemulihan kuota saat terdeteksi spamming.',
                        'Isolasi kunci API rahasia (Gemini API Key) 100% pada sisi server (Zero Client Leakage).',
                      ],
                      tags: ['AI Limiter: 30 req/min', 'API Key Server-Side', 'Quota Shield'],
                    },
                    {
                      id: 'rbac',
                      num: '8',
                      title: '8. ROLE-BASED ACCESS CONTROL (RBAC)',
                      badge: '3-TIER PRIVILEGE',
                      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
                      headerBg: 'bg-gradient-to-r from-purple-950/10 via-purple-900/5 to-slate-900/5 border-purple-300/60',
                      icon: Users,
                      iconColor: 'text-purple-600',
                      accentBox: 'bg-slate-900 border-purple-500/50 text-purple-100',
                      desc: 'Struktur hierarki pembagian wewenang yang mengisolasi fungsi aplikasi sesuai tingkatan tanggung jawab masing-masing instansi.',
                      details: [
                        'Tingkat 1 - User Publik: Hanya dapat membaca profil, melihat data berstatus tersaring, & mengirim laporan.',
                        'Tingkat 2 - Admin Wilayah: Akses verifikasi data PSKS Kabupaten/Kota dan pengelolaan anggota lokal.',
                        'Tingkat 3 - Superadmin / Developer: Otoritas penuh sistem, konfigurasi Firestore, manajemen kredensial 27 kab/kota, & saklar maintenance.',
                      ],
                      tags: ['Publik', 'Admin Wilayah', 'Superadmin / Developer'],
                    },
                    {
                      id: 'inactivity_timeout',
                      num: '9',
                      title: '9. INACTIVITY IDLE TIMEOUT 30 MENIT & 24-HOUR EXPIRY',
                      badge: 'DUAL SESSION LIFETIME',
                      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
                      headerBg: 'bg-gradient-to-r from-cyan-950/10 via-cyan-900/5 to-slate-900/5 border-cyan-300/60',
                      icon: Hourglass,
                      iconColor: 'text-cyan-600',
                      accentBox: 'bg-cyan-950/90 border-cyan-500/50 text-cyan-100',
                      desc: 'Protokol perlindungan sesi ganda yang mengunci sesi saat ditinggalkan tanpa aktivitas dan membatasi masa berlaku absolut 24 jam.',
                      details: [
                        'Inactivity Auto-Logout: Sistem secara aktif memantau interaksi (klik, ketikan, scroll, sentuhan). Jika tidak ada aktivitas selama 30 menit, sesi otomatis terkunci demi mencegah penyalahgunaan komputer kantor yang ditinggalkan.',
                        'Absolute Session Expiry: Masa berlaku maksimal sesi login dibatasi tepat 24 jam (86.400 detik).',
                        'Pembersihan kredensial sesi lokal dan redirect aman kembali ke gerbang login.',
                      ],
                      tags: ['Idle Timeout: 30 Min', 'Max Session: 24 Hours', 'Auto-Lockout', 'Diskominfo Audit'],
                    },
                    {
                      id: 'session_enforcement',
                      num: '10',
                      title: '10. SINGLE SESSION ENFORCEMENT',
                      badge: '1-DEVICE CONCURRENCY',
                      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
                      headerBg: 'bg-gradient-to-r from-amber-950/10 via-orange-900/5 to-slate-900/5 border-orange-300/60',
                      icon: Laptop,
                      iconColor: 'text-amber-600',
                      accentBox: 'bg-slate-900 border-orange-500/50 text-amber-100',
                      desc: 'Kebijakan tunggal perangkat yang menjamin satu akun hanya aktif di satu komputer/browser pada saat yang bersamaan.',
                      details: [
                        'Deteksi pembukaan akun secara bersamaan di lokasi atau peramban yang berbeda.',
                        'Pencabutan sesi lama secara instan begitu sesi baru berhasil melakukan otentikasi.',
                        'Mencegah praktik Account Sharing tak berizin antar operator lapangan.',
                      ],
                      tags: ['Device Binding', 'Instant Invalidation', 'Anti-Concurrent'],
                    },
                    {
                      id: 'csrf_origin',
                      num: '11',
                      title: '11. STRICT ORIGIN & CSRF (CROSS-SITE REQUEST FORGERY) DEFENSE',
                      badge: 'ORIGIN / HOST VALIDATION',
                      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
                      headerBg: 'bg-gradient-to-r from-teal-950/10 via-teal-900/5 to-slate-900/5 border-teal-300/60',
                      icon: Shield,
                      iconColor: 'text-teal-600',
                      accentBox: 'bg-slate-950 border-teal-500/50 text-teal-200 font-mono text-[11px]',
                      desc: 'Middleware verifikasi ketat pada sisi server Express untuk memvalidasi asal domain permintaan data dan menangkal serangan pemalsuan request lintas situs.',
                      details: [
                        'Pengecekan header Origin, Referer, dan Host pada seluruh endpoint mutasi data (POST, PUT, DELETE, PATCH).',
                        'Penolakan instan (HTTP 403 Forbidden) bagi request yang dikirimkan dari domain asing atau script pihak ketiga di luar infrastruktur Jawa Barat.',
                        'Proteksi CORS terisolasi khusus lingkungan produksi Cloud Run.',
                      ],
                      tags: ['Origin Handshake', 'CSRF Blocker', 'Host Validation', 'HTTP 403 Defense'],
                      codePreview: 'req.headers.origin !== host -> res.status(403).json({ error: "Invalid Origin (CSRF)" })',
                    },
                    {
                      id: 'security_headers_csp',
                      num: '12',
                      title: '12. HTTP SECURITY HEADERS, CSP, & HSTS (OWASP TOP 10)',
                      badge: 'HARDENED HEADERS',
                      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
                      headerBg: 'bg-gradient-to-r from-blue-950/10 via-slate-900/5 to-slate-900/5 border-blue-300/60',
                      icon: Terminal,
                      iconColor: 'text-blue-600',
                      accentBox: 'bg-slate-950 border-blue-500/50 text-blue-200 font-mono text-[11px]',
                      desc: 'Kumpulan header keamanan protokol HTTP standar BSSN & OWASP untuk memperkuat pertahanan browser dari penyusupan konten liar.',
                      details: [
                        'Content-Security-Policy (CSP): Membatasi eksekusi resource skrip, gambar, dan frame hanya dari domain resmi tepercaya.',
                        'Strict-Transport-Security (HSTS): Memaksa seluruh lalu lintas komunikasi terenkripsi HTTPS (max-age=31536000; includeSubDomains; preload).',
                        'X-Content-Type-Options: nosniff (mencegah eksploitasi MIME-type sniffing).',
                        'X-XSS-Protection: 1; mode=block & Referrer-Policy: strict-origin-when-cross-origin.',
                        'Permissions-Policy: camera=(self), geolocation=(self), microphone=() (pembatasan hak akses perangkat).',
                      ],
                      tags: ['CSP Strict', 'HSTS Preload', 'nosniff', 'Permissions-Policy'],
                      codePreview: 'Strict-Transport-Security: max-age=31536000 | X-Content-Type-Options: nosniff | CSP: default-src \'self\'',
                    },
                    {
                      id: 'body_size_dos',
                      num: '13',
                      title: '13. REQUEST BODY SIZE LIMITER & ANTI-DOS BUFFER PROTECTION',
                      badge: 'PAYLOAD BUFFER SHIELD',
                      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
                      headerBg: 'bg-gradient-to-r from-rose-950/10 via-slate-900/5 to-slate-900/5 border-rose-300/60',
                      icon: HardDrive,
                      iconColor: 'text-rose-600',
                      accentBox: 'bg-slate-950 border-rose-500/50 text-rose-200 font-mono text-[11px]',
                      desc: 'Pembatasan kapasitas muatan paket data masuk ke server Express guna melindungi alokasi memori RAM (Node.js Heap) dari serangan Buffer Exhaustion DoS.',
                      details: [
                        'Batas maksimal muatan JSON diatur ketat maksimal 5MB per request.',
                        'Graceful JSON Parse Error Handler: Menangani error sintaksis secara aman tanpa mengekspos stack trace internal ke publik (Anti-Information Disclosure).',
                      ],
                      tags: ['Max Body: 5MB', 'Anti-Buffer Exhaustion', 'Graceful Error Handler'],
                      codePreview: 'express.json({ limit: "5mb" }) + Graceful Error Handler (HTTP 400 Bad Request)',
                    },
                    {
                      id: 'csv_formula_injection',
                      num: '14',
                      title: '14. SANITASI ANTI-CSV & FORMULA INJECTION EXCEL EXPORT',
                      badge: 'SPREADSHEET DEFENSE',
                      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      headerBg: 'bg-gradient-to-r from-emerald-950/10 via-green-900/5 to-slate-900/5 border-emerald-300/60',
                      icon: FileText,
                      iconColor: 'text-emerald-600',
                      accentBox: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 font-mono text-[11px]',
                      desc: 'Filter sanitasi khusus pada modul ekspor data spreadsheet (XLSX/CSV) guna melindungi komputer aparatur dari eksploitasi rumus berbahaya saat membuka berkas di Excel.',
                      details: [
                        'Sanitasi sel otomatis: Menetralkan karakter berbahaya pembuka formula seperti `=`, `+`, `-`, `@`, `tab`, atau `newline`.',
                        'Karakter berisiko di-escape dengan tanda kutip tunggal (`\') sehingga Excel memperlakukannya murni sebagai teks tanpa mengeksekusi DDE / formula sistem.',
                      ],
                      tags: ['Anti-CSV Injection', 'Formula Neutralization', 'Excel Security Standard'],
                      codePreview: 'sanitizeCellForExcel("=cmd|\' /C calc\'!A0") -> "\'=cmd|\' /C calc\'!A0" (Safe String)',
                    },
                    {
                      id: 'immutable_audit_logs',
                      num: '15',
                      title: '15. IMMUTABLE AUDIT TRAIL FORENSIK (WRITE-ONLY LOGS)',
                      badge: 'FORENSIC INTEGRITY',
                      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
                      headerBg: 'bg-gradient-to-r from-amber-950/10 via-slate-900/5 to-slate-900/5 border-amber-300/60',
                      icon: Activity,
                      iconColor: 'text-amber-600',
                      accentBox: 'bg-slate-950 border-amber-500/50 text-amber-200 font-mono text-[11px]',
                      desc: 'Aturan integritas log audit aktivitas forensik yang dikunci secara permanen di database Supabase untuk memenuhi standar audit BSSN.',
                      details: [
                        'Sifat Log Append-Only: Catatan riwayat aktivitas di `system_logs` HANYA dapat ditambah (create) dan dibaca (read).',
                        'Dilarang Keras Update & Delete: Aturan Firestore `allow update, delete: if false;` memastikan jejak digital perubahan data tidak dapat dihapus atau dimanipulasi oleh siapa pun.',
                      ],
                      tags: ['BSSN Forensic Standard', 'Append-Only Log', 'No-Delete Rule', 'Tamper-Proof'],
                      codePreview: 'match /system_logs/{logId} { allow read, create: if true; allow update, delete: if false; }',
                    },
                    {
                      id: 'barcode_auth',
                      num: '16',
                      title: '16. CARD-BASED ENCRYPTED BARCODE & QR AUTHENTICATION',
                      badge: 'DIGITAL BARCODE ID',
                      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
                      headerBg: 'bg-gradient-to-r from-teal-950/10 via-teal-900/5 to-slate-900/5 border-teal-300/60',
                      icon: QrCode,
                      iconColor: 'text-teal-600',
                      accentBox: 'bg-teal-950/90 border-teal-500/50 text-teal-100',
                      desc: 'Otentikasi keanggotaan PSKS melalui pemindaian Kartu Anggota Digital ber-Barcode / QR Code dengan token terenkripsi dan verifikasi server otoritatif.',
                      details: [
                        'Pencetakan Barcode / QR Unik yang memuat hash verifikasi identitas resmi (Superadmin & Developer).',
                        'Server-Side QR Verification: Verifikasi token QR dilakukan secara otoritatif pada sisi server Express untuk memvalidasi tanda tangan kriptografi fisik.',
                        'Live Stream Camera Only: Pemindaian wajib menggunakan kamera aktif atau tap NFC fisik (pencegahan pemalsuan dari unggah tangkapan layar galeri).',
                      ],
                      tags: ['Server QR Verification', 'Camera Live Stream', 'Cryptographic Token', 'Tamper-Proof ID'],
                    },
                    {
                      id: 'smart_card_auth',
                      num: '17',
                      title: '17. SMART ACCESS CARD AUTHENTICATION (NFC MIFARE 13,56 MHz)',
                      badge: 'NFC HARDWARE TOKEN',
                      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      headerBg: 'bg-gradient-to-r from-emerald-950/10 via-emerald-900/5 to-slate-900/5 border-emerald-300/60',
                      icon: Radio,
                      iconColor: 'text-emerald-600',
                      accentBox: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100',
                      desc: 'Otentikasi fisik nirkabel contactless berbasis Smart Access Card dengan microchip Mifare 13,56 MHz untuk login instan Superadmin dan Developer tanpa mengetik kredensial manual.',
                      details: [
                        'Contactless Fast Tap: Menempelkan (TAP) fisik Smart Card langsung ke sensor NFC smartphone, tablet, atau USB Card Reader PC untuk login dalam < 0.5 detik.',
                        'UID Hardware Handshake: Sistem memvalidasi Unique Hardware Identifier (UID) chip kartu bersama cryptographic signature resmi yang terdaftar di database Jawa Barat.',
                        'Hardware Requirements: Mengharuskan perangkat memiliki fitur sensor NFC aktif atau terhubung dengan perangkat pembaca NFC eksternal.',
                      ],
                      tags: ['NFC 13.56 MHz Mifare', 'Contactless Tap', 'Zero-Password Login', 'Hardware Token'],
                      codePreview: 'NFC_HANDSHAKE: [MIFARE_UID:04:A2:3F:8C:91] -> FREQ: 13.56MHz -> AUTH_GRANTED_SUPERADMIN',
                    },
                    {
                      id: 'xss_mitigation',
                      num: '18',
                      title: '18. MITIGASI XSS & SANITASI INPUT PESAN PUBLIK',
                      badge: 'DOM SANITIZER',
                      badgeColor: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
                      headerBg: 'bg-gradient-to-r from-fuchsia-950/10 via-pink-900/5 to-slate-900/5 border-fuchsia-300/60',
                      icon: ShieldOff,
                      iconColor: 'text-fuchsia-600',
                      accentBox: 'bg-fuchsia-950/90 border-fuchsia-500/50 text-fuchsia-100 font-mono text-[11px]',
                      desc: 'Penyaringan menyeluruh pada seluruh form input pesan, aspirasi publik, dan tampilan teks untuk menetralkan potensi injeksi skrip berbahaya (Stored & Reflected XSS).',
                      details: [
                        'Sanitasi otomatis pada form pengaduan masyarakat: Menyaring dan membersihkan tag `<script>`, `<iframe>`, `javascript:`, serta atribut event listener inline (`onload`, `onerror`).',
                        'HTML Entity Encoding untuk seluruh input teks bebas sebelum dirender ke Document Object Model (DOM).',
                        'Dukungan proteksi ganda bersama header Content Security Policy (CSP) server.',
                      ],
                      tags: ['DOM Sanitizer', 'Tag Stripper', 'HTML Encoding', 'CSP Co-Defense'],
                      codePreview: 'stripDangerousTags("<script>alert(\'xss\')</script>Halo") -> "Halo" (Clean Text)',
                    },
                  ].map((secItem, idx) => {
                    const IconComp = secItem.icon;
                    const isOpen = openSecurityIndex === idx;

                    return (
                      <div
                        key={secItem.id}
                        className={`rounded-2xl border-2 transition-all overflow-hidden ${
                          isOpen
                            ? 'border-[#043e2e] shadow-md bg-white ring-2 ring-[#d4af37]/30'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                        }`}
                      >
                        {/* ACCORDION HEADER (CLICK TO TOGGLE) */}
                        <button
                          type="button"
                          onClick={() => setOpenSecurityIndex(isOpen ? null : idx)}
                          className={`w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${secItem.headerBg}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-200 ${secItem.iconColor}`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide">
                                  {secItem.title}
                                </h4>
                                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${secItem.badgeColor}`}>
                                  {secItem.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                {secItem.desc}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                              {isOpen ? 'Sembunyikan' : 'Buka Penjelasan'}
                            </span>
                            <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </button>

                        {/* ACCORDION CONTENT EXPANDED */}
                        {isOpen && (
                          <div className="p-5 border-t border-slate-200 bg-white space-y-4 animate-fadeIn">
                            {/* DESCRIPTION BOX WITH DISTINCT STYLING */}
                            <div className={`p-4 rounded-2xl border shadow-inner ${secItem.accentBox}`}>
                              <p className="text-xs font-semibold leading-relaxed">
                                {secItem.desc}
                              </p>

                              {secItem.codePreview && (
                                <div className="mt-2.5 p-2.5 rounded-xl bg-black/50 border border-white/20 font-mono text-[10px] text-amber-300 break-all">
                                  {secItem.codePreview}
                                </div>
                              )}
                            </div>

                            {/* DETAILS LIST */}
                            <div className="space-y-2">
                              <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Poin Kunci Pelaksanaan & Spesifikasi Teknis:</span>
                              </h5>
                              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                {secItem.details.map((detailText, dIdx) => (
                                  <li
                                    key={dIdx}
                                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium flex items-start gap-2 shadow-2xs"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#043e2e] mt-1.5 shrink-0" />
                                    <span>{detailText}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* TAGS FOOTER */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Tags Infrastruktur:
                              </span>
                              {secItem.tags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5B. SMART ACCESS CARD SECTION (BARU) */}
            {(selectedSection === 'smart_card' || selectedSection === 'all') && (
              <SmartAccessCardSection session={session} />
            )}

            {/* 6. BAHASA PEMROGRAMAN SECTION */}
            {(selectedSection === 'languages' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#043e2e] text-emerald-300">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        SPESIFIKASI BAHASA PEMROGRAMAN & STANDARD KODE
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Daftar 6 bahasa pemrograman & format data yang digunakan di PSKS JABAR.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
                    6 Standard Specs
                  </span>
                </div>

                {/* SEARCH */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#043e2e]" />
                    Filter Bahasa / Format Data
                  </span>
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Cari nama bahasa..."
                    className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* LIST BAHASA */}
                <div className="space-y-4">
                  {[
                    {
                      id: 'ts',
                      name: 'TypeScript 5.7',
                      role: 'Bahasa Utama Frontend & Server Proxy',
                      level: 'Utama (Core Standard)',
                      badgeBg: 'bg-blue-600 text-white',
                      desc: 'Bahasa utama berskala produksi dengan sistem tipe statis (strict type checking), generics, dan interface yang digunakan di seluruh komponen React dan Express server.ts.',
                      useCases: [
                        'Komponen React (/src/components/*.tsx)',
                        'Express Server Proxy (/server.ts)',
                        'Definisi Tipe Data Global (/src/types.ts)',
                        'Firestore SDK Rules & Model Integration',
                      ],
                      codeSnippet: `interface PillarMember {\n  id: string;\n  name: string;\n  pillarType: 'PKH' | 'TKSK' | 'Karang Taruna' | 'Tagana';\n  verified: boolean;\n}`,
                      icon: FileCode2,
                    },
                    {
                      id: 'jsx',
                      name: 'HTML5 & JSX (React UI Declarative)',
                      role: 'Struktur Tampilan & Deklaratif UI',
                      level: 'Utama (Core Standard)',
                      badgeBg: 'bg-amber-600 text-white',
                      desc: 'Sintaks deklaratif HTML5 yang diperluas dengan JSX untuk membangun hierarki komponen modular, atribut aksesibilitas, modal popup, serta navigasi reaktif.',
                      useCases: [
                        'Satu Halaman Utama (/src/App.tsx)',
                        'Sistem Modal Popup & Gate Verification',
                        'Aksesibilitas W3C & Responsif Flexbox/Grid',
                        'Komponen Widget Interaktif',
                      ],
                      codeSnippet: `<div className="p-6 rounded-2xl bg-white border shadow-md">\n  <h3 className="text-lg font-black text-[#043e2e]">10 Pilar PSKS</h3>\n</div>`,
                      icon: Layout,
                    },
                    {
                      id: 'css',
                      name: 'CSS3 & Tailwind CSS v4 Engine',
                      role: 'Sistem Styling & Desain Mewah',
                      level: 'Utama (Core Standard)',
                      badgeBg: 'bg-teal-600 text-white',
                      desc: 'Sintaks CSS3 modern dengan Tailwind CSS v4 @import directive engine untuk mewarnai tema Emas Jawa Barat (#d4af37), Hijau Dinsos (#043e2e), serta animasi micro-interaction.',
                      useCases: [
                        'Entry Styling Global (/src/index.css)',
                        'Aturan Gradien Emas & Emerald Glow',
                        'Pengaturan Glassmorphism & Backdrop Blur',
                        'Utility Classes Responsif (sm, md, lg, xl)',
                      ],
                      codeSnippet: `@import "tailwindcss";\n\n@layer utilities {\n  .gold-gradient { background: linear-gradient(135deg, #043e2e, #d4af37); }\n}`,
                      icon: Palette,
                    },
                    {
                      id: 'js',
                      name: 'JavaScript (ES2024 / Node.js ESM)',
                      role: 'Execution Runtime & Module System',
                      level: 'Infrastruktur Engine',
                      badgeBg: 'bg-yellow-500 text-slate-950',
                      desc: 'Standar eksekusi skrip ES2024 dengan dukungan async/await, promise pipeline, dynamic import, dan struktur ES Modules native.',
                      useCases: [
                        'Bundel Server Node.js (dist/server.cjs)',
                        'Vite Development HMR Engine',
                        'Operasi Asinkron & Fetch API',
                        'Helper Utility Functions',
                      ],
                      codeSnippet: `export const formatTimestamp = (date: Date): string => {\n  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(date);\n};`,
                      icon: Zap,
                    },
                    {
                      id: 'json',
                      name: 'JSON & GeoJSON Standard',
                      role: 'Serialisasi Data & Spasial GIS',
                      level: 'Format Data',
                      badgeBg: 'bg-emerald-700 text-white',
                      desc: 'Format pertukaran data standar untuk menyimpan metadata aplikasi, konfigurasi package.json, schema Firestore, serta koordinat GeoJSON 27 Kab/Kota se-Jawa Barat.',
                      useCases: [
                        'Metadata Aplikasi (/metadata.json)',
                        'Konfigurasi Dependensi (/package.json)',
                        'Data Koordinat Spasial Peta 27 Kab/Kota',
                        'Simpanan Konfigurasi Pengaturan Admin',
                      ],
                      codeSnippet: `{\n  "name": "PSKS Jabar",\n  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]\n}`,
                      icon: Database,
                    },
                    {
                      id: 'md',
                      name: 'Markdown (GFM - GitHub Flavored)',
                      role: 'Dokumentasi & Prompt AI System',
                      level: 'Dokumentasi',
                      badgeBg: 'bg-slate-700 text-white',
                      desc: 'Format teks terstruktur untuk menginstruksikan Asisten AI Gemini seputar 10 Pilar PSKS, dokumentasi penggunaan, serta aturan keamanan sistem.',
                      useCases: [
                        'Aturan System Instructions AGENTS.md & GEMINI.md',
                        'Respons Markdown Asisten AI PSKS JABAR',
                        'Panduan Integrasi Pengembang',
                        'Aturan Firebase & Rules Specification',
                      ],
                      codeSnippet: `# PSKS Jabar Systems\n\n- **Role**: Admin, Petugas, User\n- **Database**: Firestore Realtime`,
                      icon: BookOpen,
                    },
                  ]
                    .filter(
                      (item) =>
                        !langSearch ||
                        item.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                        item.role.toLowerCase().includes(langSearch.toLowerCase())
                    )
                    .map((item) => {
                      const Icon = item.icon;
                      const isExpanded = expandedLang === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-2xs ${
                            isExpanded ? 'border-[#d4af37] ring-2 ring-[#d4af37]/20' : 'border-slate-200'
                          }`}
                        >
                          <div
                            onClick={() => setExpandedLang(isExpanded ? null : item.id)}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-slate-50/80 hover:bg-slate-100/80"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-2xl bg-[#043e2e] text-[#d4af37] font-black shrink-0 shadow-md">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-sm text-slate-900 m-0">{item.name}</h4>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${item.badgeBg}`}>
                                    {item.level}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5 font-semibold">{item.role}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                                Active
                              </span>
                              <button type="button" className="p-1.5 rounded-xl bg-slate-200 text-slate-700">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">{item.desc}</p>
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                                  Penggunaan Utama
                                </span>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 m-0 p-0 list-none">
                                  {item.useCases.map((uc, uIdx) => (
                                    <li key={uIdx} className="text-xs text-slate-800 font-bold flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                      <Star className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                      <span>{uc}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-slate-950 rounded-xl p-3 text-emerald-300 font-mono text-xs overflow-x-auto">
                                <pre>{item.codeSnippet}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 7. PUSTAKA LIBRARY SECTION */}
            {(selectedSection === 'libraries' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#043e2e] text-emerald-300">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        DAFTAR PUSTAKA NPM & SDK TERDAFTAR (12 PACKAGES)
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Seluruh modul pustaka eksternal terintegrasi dalam package.json.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
                    Framework & SDK
                  </span>
                </div>

                {/* CATEGORY & SEARCH */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                    {[
                      { id: 'all', label: 'Semua (12)' },
                      { id: 'ui', label: 'UI & Animasi' },
                      { id: 'cloud', label: 'Cloud & Database' },
                      { id: 'ai_gis', label: 'AI & Map GIS' },
                      { id: 'security', label: 'Keamanan & Build' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setLibCategory(cat.id as any)}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                          libCategory === cat.id ? 'bg-[#043e2e] text-[#d4af37]' : 'bg-white text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                    placeholder="Cari nama pustaka..."
                    className="w-full sm:w-56 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* LIST PUSTAKA */}
                <div className="space-y-4">
                  {[
                    {
                      id: 'react',
                      name: 'React v19.0.0 & React DOM',
                      cat: 'ui',
                      version: 'v19.0.0',
                      purpose: 'Core UI Framework & Virtual DOM Rendering Engine',
                      cmd: 'npm i react react-dom',
                      features: ['React Hooks', 'Suspense & Concurrent Mode', 'Virtual DOM Diffing Engine', 'Component State Management'],
                    },
                    {
                      id: 'firebase',
                      name: 'Firebase Client SDK v12.1.0',
                      cat: 'cloud',
                      version: 'v12.1.0',
                      purpose: 'Supabase Realtime Listener & Auth Integration',
                      cmd: 'npm i firebase',
                      features: ['NoSQL Document Storage', 'onSnapshot Realtime Listener', 'Firebase Auth Engine', 'Cross-Device State Sync'],
                    },
                    {
                      id: 'gemini',
                      name: '@google/genai SDK v3.6.0',
                      cat: 'ai_gis',
                      version: 'v3.6.0',
                      purpose: 'Integrasi Asisten AI Gemini Server-side Proxy',
                      cmd: 'npm i @google/genai',
                      features: ['10 Pilar PSKS Knowledge Prompt', 'Model Alias gemini-3.8-flash', 'Express Proxy Integration', 'Structured Responses'],
                    },
                    {
                      id: 'leaflet',
                      name: 'Leaflet GIS v1.9.4 & React-Leaflet',
                      cat: 'ai_gis',
                      version: 'v1.9.4',
                      purpose: 'Peta Interaktif Spasial 27 Kabupaten/Kota Se-Jawa Barat',
                      cmd: 'npm i leaflet react-leaflet @types/leaflet',
                      features: ['Custom Marker Pins 10 Pilar', 'Polygon Layer 27 Kab/Kota', 'TileLayer OpenStreetMap', 'Responsive Map Canvas'],
                    },
                    {
                      id: 'express',
                      name: 'Express.js v4.21.2 Proxy Server',
                      cat: 'security',
                      version: 'v4.21.2',
                      purpose: 'Node.js Express Backend Proxy untuk Sembunyikan API Key',
                      cmd: 'npm i express cors',
                      features: ['API Route Proxy /api/chat', 'Port Binding 3000 (0.0.0.0)', 'Middleware CORS & JSON Body', 'API Key Protection'],
                    },
                    {
                      id: 'motion',
                      name: 'Motion (Framer Motion Engine) v12.4.7',
                      cat: 'ui',
                      version: 'v12.4.7',
                      purpose: 'Animasi Micro-Interactions, Modal Transitions & Page Fade',
                      cmd: 'npm i motion',
                      features: ['AnimatePresence Modal Transitions', 'Layout Animations', 'Spring Physics Smooth Scrolling', 'Gesture Support'],
                    },
                    {
                      id: 'lucide',
                      name: 'Lucide React Icons v0.475.0',
                      cat: 'ui',
                      version: 'v0.475.0',
                      purpose: 'Koleksi Ikon Vektor Dinsos, Navigasi, & Widget',
                      cmd: 'npm i lucide-react',
                      features: ['Vector SVG Clean Scaling', 'Ikon 10 Pilar PSKS', 'Aksesibilitas Label', 'Tree-shakeable'],
                    },
                    {
                      id: 'qr',
                      name: 'HTML5 QRCode Scanner v2.3.8',
                      cat: 'ai_gis',
                      version: 'v2.3.8',
                      purpose: 'Pemindai Kamera QR Code Digital Member Card PSKS',
                      cmd: 'npm i html5-qrcode',
                      features: ['Realtime Camera Scanner', 'QR Code Verifier Token', 'Autofocus & Camera Switch', 'Instant Verification'],
                    },
                    {
                      id: 'bcrypt',
                      name: 'BcryptJS v3.0.2 Security Enkripsi',
                      cat: 'security',
                      version: 'v3.0.2',
                      purpose: 'Enkripsi One-Way Hash Passcode Gate & Salt Rounds',
                      cmd: 'npm i bcryptjs',
                      features: ['SHA-256 Salted Hash', '10 Salt Rounds Security', 'Zero Plaintext Storage', 'Gate Password Verification'],
                    },
                    {
                      id: 'vite',
                      name: 'Vite v6.1.0 Development Build Tool',
                      cat: 'security',
                      version: 'v6.1.0',
                      purpose: 'Fast Development Server & Asset Bundler Engine',
                      cmd: 'npm i -D vite @vitejs/plugin-react',
                      features: ['Lightning Fast HMR', 'ESBuild Fast Compilation', 'Production Asset Bundler', 'CSS Tailwind Integration'],
                    },
                    {
                      id: 'esbuild',
                      name: 'ESBuild Bundler Engine v0.25.0',
                      cat: 'security',
                      version: 'v0.25.0',
                      purpose: 'Kompilasi Server TypeScript ke Single CJS Bundle',
                      cmd: 'npm i -D esbuild',
                      features: ['Single File Output dist/server.cjs', 'Bypass ESM Relative Paths', 'High Speed Compilation', 'Sourcemap Generation'],
                    },
                    {
                      id: 'tsx',
                      name: 'TSX Node Execution Runtime v4.19.2',
                      cat: 'security',
                      version: 'v4.19.2',
                      purpose: 'Eksekusi Langsung File server.ts Mode Dev Server',
                      cmd: 'npm i -D tsx',
                      features: ['Direct TypeScript Execution', 'Zero-config Dev Boot', 'Fast Hot-Reloading', 'Native ESM Resolution'],
                    },
                  ]
                    .filter((item) => {
                      const matchCat = libCategory === 'all' || item.cat === libCategory;
                      const matchSearch =
                        !libSearch ||
                        item.name.toLowerCase().includes(libSearch.toLowerCase()) ||
                        item.purpose.toLowerCase().includes(libSearch.toLowerCase());
                      return matchCat && matchSearch;
                    })
                    .map((item) => {
                      const isExpanded = expandedLib === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-2xs ${
                            isExpanded ? 'border-[#d4af37] ring-2 ring-[#d4af37]/20' : 'border-slate-200'
                          }`}
                        >
                          <div
                            onClick={() => setExpandedLib(isExpanded ? null : item.id)}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-slate-50/80 hover:bg-slate-100/80"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-2xl bg-[#043e2e] text-[#d4af37] font-black shrink-0 shadow-md">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-sm text-slate-900 m-0">{item.name}</h4>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                    {item.version}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5 font-semibold">{item.purpose}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="text-[10px] font-extrabold text-[#043e2e] bg-amber-100 px-2.5 py-1 rounded-xl">
                                Installed
                              </span>
                              <button type="button" className="p-1.5 rounded-xl bg-slate-200 text-slate-700">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                                  Fitur & Kapabilitas Utama
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {item.features.map((ft, fIdx) => (
                                    <div key={fIdx} className="text-xs text-slate-800 font-bold flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>{ft}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-slate-950 rounded-xl p-3 text-amber-300 font-mono text-xs">
                                <span className="text-slate-500 block text-[10px]">Perintah Instalasi CLI:</span>
                                <code>{item.cmd}</code>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 8. DATABASE SECTION */}
            {(selectedSection === 'database' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-6 shadow-sm">
                {/* SECTION HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#043e2e] text-[#d4af37] shadow-sm shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                        DATABASE INFRASTRUCTURE &amp; CLOUD STORAGE
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Penyimpanan Utama Berbasis Supabase Cloud PostgreSQL &amp; JSONB dengan Sinkronisasi Sinyal Realtime.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
                      <span>SUPABASE JS v2.49.1</span>
                    </span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                      500 MB Storage (500.000 KB)
                    </span>
                  </div>
                </div>

                {/* HERO BANNER: SUPABASE & LIVE SIGNAL CONNECTION ANIMATION */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#043e2e] border-2 border-[#d4af37]/60 text-white shadow-xl space-y-6 relative overflow-hidden">
                  {/* BACKGROUND GLOW ACCENTS */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                  {/* TOP BRANDING & ANIMATED SIGNAL INDICATOR */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
                    {/* LOGO & BRANDING */}
                    <div className="flex items-center gap-4">
                      {/* SUPABASE SVG LOGO */}
                      <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-inner flex items-center justify-center shrink-0">
                        <svg className="w-10 h-10" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M63.7076 110.284C60.848 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0632L99.1934 40.0632C106.007 40.0632 110.015 47.7871 105.748 53.1118L63.7076 110.284Z" fill="#3ECF8E"/>
                          <path d="M45.317 2.71603C48.1766 -0.885144 53.9744 1.08779 54.0433 5.68593L55.0508 72.9368H9.8312C3.01736 72.9368 -0.990886 65.2129 3.27648 59.8882L45.317 2.71603Z" fill="#3ECF8E" fillOpacity="0.7"/>
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black tracking-wide text-white">
                            Disimpan di SUPABASE
                          </h4>
                          <span className="text-[10px] font-extrabold bg-[#3ECF8E] text-slate-950 px-2.5 py-0.5 rounded-md uppercase font-mono shadow-sm">
                            POSTGRESQL CLOUD
                          </span>
                        </div>
                        <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                          Supabase Managed PostgreSQL &amp; High-Speed JSONB Realtime Database
                        </p>
                      </div>
                    </div>

                    {/* ANIMATED SIGNAL CONNECTION BOX */}
                    <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-emerald-500/50 flex items-center gap-3 shadow-md">
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        <Wifi className="w-5 h-5 text-emerald-400 absolute animate-pulse opacity-90" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-300 tracking-wide uppercase">
                            SINYAL TERHUBUNG
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Supabase Channels &bull; Latency &lt; 40ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PROJECT & CAPACITY METRICS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider block">
                        Project ID Supabase Cloud
                      </span>
                      <span className="text-xs font-mono font-black text-white truncate block" title="zwjbjmafxixudhlvaxef">
                        zwjbjmafxixudhlvaxef
                      </span>
                      <span className="text-[9px] font-mono text-emerald-300/90 truncate block" title="zwjbjmafxixudhlvaxef.supabase.co">
                        Host: zwjbjmafxixudhlv...
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider block">
                        Kapasitas Kuota Total
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-300 block">
                        500 MB ( 500.000 KB )
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 block">
                        Status Quota: 100% Active &amp; Ready
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider block">
                        Estimasi Kapasitas Data
                      </span>
                      <span className="text-xs font-mono font-black text-amber-300 block">
                        {storageMetrics.totalDocuments.toLocaleString('id-ID')} Data Terdata
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 block">
                        Sisa Kuota: &plusmn; {storageMetrics.remainingEstimatedDocs.toLocaleString('id-ID')} Data Tabel
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider block">
                        Sistem Sinkronisasi Data
                      </span>
                      <span className="text-xs font-mono font-black text-cyan-300 block">
                        Realtime Channel + Fast Poll
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 block">
                        Method: Supabase Rest &amp; WS
                      </span>
                    </div>
                  </div>

                  {/* VISUAL CAPACITY GAUGE BAR */}
                  <div className="space-y-2 pt-1 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-[#d4af37]" />
                        <span>Visualisasi Kuota Ruang Penyimpanan Supabase Cloud (500 MB)</span>
                      </span>
                      <span className="font-mono text-emerald-300 text-xs">
                        {storageMetrics.formattedDisplay}
                      </span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-slate-800 border border-white/10 p-0.5 overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#d4af37] transition-all duration-1000 shadow-sm relative"
                        style={{ width: `${Math.max(storageMetrics.usagePercentage, 0.8)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 REALTIME SUMMARY BENTO CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CARD 1: TOTAL STORAGE TERPAKAI */}
                  <div className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 hover:border-[#043e2e] transition-all shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-[#043e2e] text-[#d4af37] shadow-xs">
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Penyimpanan Terpakai
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            Total Digunakan (Realtime)
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300">
                        {storageMetrics.usagePercentage < 0.01 ? '0.03%' : `${storageMetrics.usagePercentage.toFixed(2)}%`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                          {storageMetrics.totalMB < 0.01 ? (storageMetrics.totalKB / 1024).toFixed(3) : storageMetrics.totalMB.toFixed(2)}
                        </span>
                        <span className="text-sm font-black text-slate-600">MB</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Setara dengan <strong className="text-slate-800 font-mono">{storageMetrics.totalKB.toFixed(1)} KB</strong> ({storageMetrics.totalBytes.toLocaleString('id-ID')} Bytes) dari 500 MB.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Porsi Pemakaian</span>
                        <span className="font-mono text-emerald-800 font-black">
                          {storageMetrics.usagePercentage < 0.01 ? '0.03%' : `${storageMetrics.usagePercentage.toFixed(2)}%`} dari 500 MB
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.max(storageMetrics.usagePercentage, 1)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: TOTAL SISA RUANG PENYIMPANAN */}
                  <div className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-emerald-800 text-white shadow-xs">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Sisa Ruang Bebas
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            Total Sisa Penyimpanan
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-teal-100 text-teal-900 px-2 py-0.5 rounded-lg border border-teal-300">
                        {storageMetrics.remainingPercentage.toFixed(2)}% BEBAS
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
                          {storageMetrics.remainingMB.toFixed(2)}
                        </span>
                        <span className="text-sm font-black text-slate-600">MB</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Tersisa <strong className="text-emerald-800 font-mono">{storageMetrics.remainingKB.toLocaleString('id-ID', { maximumFractionDigits: 0 })} KB</strong> ruang kosong siap tampung data baru.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Ketersediaan Ruang</span>
                        <span className="font-mono text-emerald-800 font-black">100% Kuota Sangat Lapang</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${Math.max(storageMetrics.remainingPercentage, 99)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: TOTAL DATA AKTIF & ESTIMASI KAPASITAS */}
                  <div className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 hover:border-amber-500 transition-all shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-xs">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Total Rekaman Data
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            Volume Data &amp; Daya Tampung
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-300">
                        7 MODUL AKTIF
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                          {storageMetrics.totalDocuments.toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm font-black text-slate-600">Dokumen</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Sanggup menampung &plusmn; <strong className="text-slate-800 font-mono">{storageMetrics.remainingEstimatedDocs.toLocaleString('id-ID')}</strong> rekaman data tabel lagi.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Rasio Efisiensi</span>
                        <span className="font-mono text-slate-800 font-black">&plusmn; 1 KB per Dokumen Tabel</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SPECIAL NOTE HIGHLIGHT CALLOUT BOX */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-emerald-50 to-slate-50 border-2 border-[#d4af37] shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-[#043e2e] text-[#d4af37] border border-[#d4af37]/40 shadow-sm shrink-0">
                      <Sparkles className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black bg-[#043e2e] text-[#d4af37] px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-[#d4af37]/30">
                          PERHITUNGAN KAPASITAS REKAM DATA
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          Analisis Efisiensi Penyimpanan 500 MB Supabase Cloud
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-extrabold leading-relaxed pt-1">
                        &quot;Note: 1 Data tabel berukuran sedang hanya menghabiskan sekitar 1 KB (kilobyte) saja, jadi 500 MB cukup untuk menampung kurang lebih 500.000 data Tabel berukuran sedang.&quot;
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-semibold text-slate-700 border-t border-amber-300/60">
                    <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 KB = 1 Data Tabel Ukuran Sedang</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 MB = &plusmn; 1.000 Data Tabel</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>500 MB = &plusmn; 500.000 Data Tabel</span>
                    </div>
                  </div>
                </div>

                {/* DETAILED SECTION: PENGGUNAAN DATABASE SECARA REALTIME PER BAGIAN */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <span>FUNGSI &amp; RINCIAN PENGGUNAAN DATABASE REALTIME PER BAGIAN</span>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                          {storageMetrics.sections.length} KATEGORI
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Database ini digunakan untuk 7 modul utama berikut. Seluruh data dihitung dan disinkronkan secara presisi dan realtime.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>Live Supabase Channel State</span>
                    </div>
                  </div>

                  {/* LIST OF 7 DETAILED SECTIONS */}
                  <div className="space-y-3">
                    {storageMetrics.sections.map((sec, idx) => {
                      const IconComp = sec.icon;
                      return (
                        <div
                          key={sec.id}
                          className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-[#043e2e] transition-all shadow-xs space-y-3"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            {/* LEFT: TITLE, ICON, & PURPOSE */}
                            <div className="flex items-start gap-3.5 flex-1">
                              <div className="p-3 rounded-2xl bg-[#043e2e] text-[#d4af37] shadow-xs shrink-0 mt-0.5">
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-400 font-mono">
                                    0{idx + 1}.
                                  </span>
                                  <h5 className="text-sm font-black text-slate-900">
                                    {sec.title}
                                  </h5>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${sec.badgeColor}`}>
                                    {sec.badge}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                    {sec.collection}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                  {sec.purpose}
                                </p>
                              </div>
                            </div>

                            {/* RIGHT: REALTIME METRICS BADGES & STATS */}
                            <div className="flex items-center gap-3 self-start lg:self-center shrink-0 flex-wrap bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                              <div className="text-center px-2.5 py-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Dokumen
                                </span>
                                <span className="text-xs font-black font-mono text-slate-900">
                                  {sec.count.toLocaleString('id-ID')}
                                </span>
                              </div>

                              <div className="h-7 w-px bg-slate-200" />

                              <div className="text-center px-2.5 py-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Ukuran Data
                                </span>
                                <span className="text-xs font-black font-mono text-emerald-800">
                                  {sec.kb < 1 ? `${sec.bytes} B` : `${sec.kb.toFixed(2)} KB`}
                                </span>
                              </div>

                              <div className="h-7 w-px bg-slate-200" />

                              <div className="text-center px-2.5 py-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Beban Kuota 500 MB
                                </span>
                                <span className="text-xs font-black font-mono text-emerald-700">
                                  {sec.percentOfQuota < 0.01 ? '< 0.01%' : `${sec.percentOfQuota.toFixed(2)}%`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* MINI PROGRESS BAR FOR SECTION */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 flex-wrap gap-1">
                              <span className="flex items-center gap-1.5 text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Konsumsi Data: <strong className="text-slate-800 font-mono">{sec.mb < 0.001 ? (sec.kb / 1024).toFixed(4) : sec.mb.toFixed(3)} MB</strong></span>
                              </span>
                              <span className="font-mono text-emerald-800 font-bold">
                                Beban Kuota: {sec.percentOfQuota < 0.01 ? '< 0.01%' : `${sec.percentOfQuota.toFixed(3)}%`} dari 500 MB
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.max(sec.percentOfQuota * 10, 1.5)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FEATURE CARDS GRID: 4 KEUNGGULAN UTAMA SUPABASE CLOUD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-[#043e2e] transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#043e2e] text-[#d4af37]">
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h5 className="text-xs font-black text-slate-900">Supabase Client SDK</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      Terintegrasi penuh dengan Supabase Client SDK v2.49.1 untuk autentikasi dan kueri PostgreSQL cepat.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-[#043e2e] transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#043e2e] text-[#d4af37]">
                        <Database className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-black text-slate-900">Supabase Cloud 500 MB</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      Kapasitas 500 MB penyimpanan PostgreSQL &amp; JSONB sanggup menampung hingga 500 Ribu rekaman data.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-[#043e2e] transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#043e2e] text-[#d4af37]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-black text-slate-900">Sinyal Live Realtime</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      Sinyal channel <code className="text-emerald-800 font-mono text-[10px]">postgres_changes</code> menyebarkan perubahan data otomatis tanpa reload browser.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-[#043e2e] transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#043e2e] text-[#d4af37]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-black text-slate-900">Row Level Security (RLS)</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      Proteksi keamanan tingkat baris PostgreSQL memisahkan hak akses Public, Admin Wilayah &amp; Superadmin.
                    </p>
                  </div>
                </div>

                {/* KOLEKSI TABEL SUPABASE AKTIF LIST */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Tabel Supabase Utama Terhubung (Realtime Tables):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[
                      { name: 'psks_records', label: 'Data 10 Pilar PSKS' },
                      { name: 'admin_accounts', label: 'Kredensial 27 Kab/Kota' },
                      { name: 'app_settings', label: 'Konfigurasi & Latar' },
                      { name: 'admin_messages', label: 'Kotak Masuk Wilayah' },
                      { name: 'system_logs', label: 'Audit Trail Keamanan' },
                    ].map((col, cIdx) => (
                      <div key={cIdx} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-mono font-black text-emerald-800 block truncate">
                          {col.name}
                        </span>
                        <span className="text-[9px] font-medium text-slate-500 block">
                          {col.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8.5. ASISTEN AI SECTION */}
            {(selectedSection === 'ai_assistant' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-6 shadow-sm animate-fadeIn">
                {/* SECTION HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#043e2e] to-purple-900 text-amber-300 shadow-md shrink-0">
                      <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                        ASISTEN KECERDASAN BUATAN GOOGLE GEMINI 3.8 FLASH
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Modul AI Generatif Cerdas Terintegrasi Server Proxy untuk Konsultasi Data &amp; Layanan Sosial Jawa Barat.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-300 shadow-2xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>GEMINI 3.8 FLASH ENGINE</span>
                    </span>
                  </div>
                </div>

                {/* HERO BANNER: GEMINI 3.8 FLASH SPECIFICATION */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-[#043e2e] border-2 border-purple-500/60 text-white shadow-xl space-y-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-400/50 shadow-inner flex items-center justify-center shrink-0">
                        <Sparkles className="w-9 h-9 text-amber-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black tracking-wide text-white">
                            Google Gemini 3.8 Flash
                          </h4>
                          <span className="text-[10px] font-extrabold bg-gradient-to-r from-purple-500 to-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md uppercase font-mono shadow-sm">
                            NEXT-GEN AI MODEL
                          </span>
                        </div>
                        <p className="text-xs text-purple-200/90 font-medium mt-0.5">
                          Layanan Kecerdasan Buatan Multi-Modal dengan Latensi Respon Super Cepat &lt; 1 Detik
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-purple-500/50 flex items-center gap-3 shadow-md">
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                      <div>
                        <span className="text-xs font-black text-amber-300 tracking-wide uppercase block">
                          SERVER PROXY SECURE ROUTE
                        </span>
                        <span className="text-[10px] font-mono text-slate-300 block">
                          Endpoint: /api/chat &bull; API Key Protected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 CARDS MATRIX SUMMARY */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">
                        Versi Model AI
                      </span>
                      <span className="text-xs font-mono font-black text-white block">
                        Gemini 3.8 Flash
                      </span>
                      <span className="text-[9px] font-medium text-slate-300 block">
                        Google GenAI SDK Engine
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">
                        Kecepatan Respon
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-300 block">
                        &lt; 800ms Average Latency
                      </span>
                      <span className="text-[9px] font-medium text-slate-300 block">
                        High Throughput Token Stream
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">
                        Batas Jendela Konteks
                      </span>
                      <span className="text-xs font-mono font-black text-purple-300 block">
                        1.000.000+ Tokens
                      </span>
                      <span className="text-[9px] font-medium text-slate-300 block">
                        Pemrosesan Dokumen Luas
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider block">
                        Pengetahuan Terintegrasi
                      </span>
                      <span className="text-xs font-mono font-black text-cyan-300 block">
                        10 Pilar PSKS &amp; 27 Kab/Kota
                      </span>
                      <span className="text-[9px] font-medium text-slate-300 block">
                        Custom System Instruction
                      </span>
                    </div>
                  </div>
                </div>

                {/* DETAILED FEATURES GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-purple-600 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#043e2e] text-amber-300">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-black text-slate-900">Keamanan API Key Server-Side</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      Permintaan AI diproses sepenuhnya melalui server proxy Express (<code className="text-purple-800 font-mono text-[10px]">/api/chat</code>). Kunci rahasia API Key tidak pernah terkespos di browser pengguna.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-purple-600 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#043e2e] text-amber-300">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-black text-slate-900">Knowledge Base PSKS Jabar</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      Dibekali instruksi sistem khusus mengenai regulasi sosial, profil 10 Pilar PSKS (PKH, TKSK, Karang Taruna, Tagana, dll), serta data 27 Kab/Kota Jawa Barat.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-purple-600 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#043e2e] text-amber-300">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-black text-slate-900">Widget Interaktif Melayang</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      Widget obrolan AI melayang yang dapat dibuka kapan saja dari pojok kanan bawah layar untuk konsultasi cepat seputar layanan sosial.
                    </p>
                  </div>
                </div>

                {/* FITUR & DOKUMENTASI INTERAKSI AI */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/10 via-slate-900/5 to-amber-950/10 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Fitur Unggulan Asisten AI Gemini 3.8 Flash PSKS JABAR:</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Konsultasi Syarat &amp; Prosedur Pendaftaran 10 Pilar PSKS</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Panduan Tugas Pokok &amp; Fungsi Pendamping Sosial Jabar</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Penjelasan Alur Pengajuan Bantuan Sosial Dinas Sosial Jabar</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Dukungan Quick Prompt &amp; Salin Jawaban AI Instan</span>
                    </div>
                  </div>
                </div>

                {/* REALTIME FIRESTORE BRAIN & VOCABULARY CONTROL SYSTEM */}
                <AIBrainFirestoreManager />
              </div>
            )}

            {/* 9. TIM PENGEMBANG SECTION */}
            {(selectedSection === 'team' || selectedSection === 'all') && (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#043e2e] to-emerald-800 text-[#d4af37] shadow-md shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                        STRUKTUR TIM PENGEMBANG & SPESIALISASI SISTEM
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Susunan 6 Divisi Tim Perancang, Pemrograman, Data, Keamanan & AI PSKS Jabar.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-2xs self-start sm:self-center">
                    6 Divisi Tim
                  </span>
                </div>

                {/* VERTIKAL STACKED CARDS FOR THE 6 TEAMS (ALWAYS OPEN) */}
                <div className="space-y-5">
                  {[
                    {
                      id: 'kreatif',
                      title: 'Tim Perancang & Kreatif',
                      badge: '4 SPESIALISASI',
                      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
                      headerBg: 'bg-gradient-to-r from-amber-950/15 via-emerald-950/10 to-slate-900/5 border-amber-300/60',
                      icon: Palette,
                      iconColor: 'text-amber-600',
                      accentBox: 'bg-slate-900 border-amber-500/50 text-amber-100',
                      desc: 'Divisi perancangan visual antarmuka, ilustrasi grafis, animasi pergerakan mikro, dan komunikasi pesan.',
                      members: [
                        { role: 'UI / UX Designer', name: 'Ilham Fazril', tag: 'Visual Architecture & Prototyping' },
                        { role: 'Graphic Designer / Illustrator', name: 'Ilham Fazril', tag: 'Vector Assets & Brand System' },
                        { role: 'Motion Designer', name: 'Ilham Fazril', tag: 'Framer & CSS Micro-Interactions' },
                        { role: 'Content Writer / Copywriter', name: 'Ilham Fazril', tag: 'Technical & User Experience Copy' },
                      ],
                    },
                    {
                      id: 'ux_khusus',
                      title: 'Tim Pengalaman Pengguna Khusus',
                      badge: '2 SPESIALISASI',
                      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
                      headerBg: 'bg-gradient-to-r from-teal-950/15 via-emerald-950/10 to-slate-900/5 border-teal-300/60',
                      icon: Layers,
                      iconColor: 'text-teal-600',
                      accentBox: 'bg-teal-950/90 border-teal-500/50 text-teal-100',
                      desc: 'Divisi pengorganisasian taksonomi data, struktur hirarki peta situs, serta alur navigasi pengguna.',
                      members: [
                        { role: 'Information Architect', name: 'Ilham Fazril', tag: 'Site Taxonomy & Data Mapping' },
                        { role: 'Interaction Designer', name: 'Ilham Fazril', tag: 'Behavioral Flow & Touch Mechanics' },
                      ],
                    },
                    {
                      id: 'developer',
                      title: 'Tim Pemrograman ( Developer )',
                      badge: '3 SPESIALISASI',
                      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
                      headerBg: 'bg-gradient-to-r from-blue-950/15 via-indigo-950/10 to-slate-900/5 border-blue-300/60',
                      icon: Code2,
                      iconColor: 'text-blue-600',
                      accentBox: 'bg-slate-950 border-blue-500/50 text-blue-200 font-mono text-[11px]',
                      desc: 'Divisi penulisan kode program utama, arsitektur React 19, server proxy Express, dan logika bisnis.',
                      members: [
                        { role: 'Front-End Developer', name: 'Ilham Fazril', tag: 'React 19, TypeScript & Tailwind CSS' },
                        { role: 'Back-End Developer', name: 'Ilham Fazril', tag: 'Express Proxy, Node.js & REST API' },
                        { role: 'Full-Stack Developer', name: 'Ilham Fazril', tag: 'End-to-End Core Codebase Architect' },
                      ],
                    },
                    {
                      id: 'testing_maintenance',
                      title: 'Tim Pengujian & Pemeliharaan',
                      badge: '3 SPESIALISASI',
                      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
                      headerBg: 'bg-gradient-to-r from-purple-950/15 via-fuchsia-950/10 to-slate-900/5 border-purple-300/60',
                      icon: MonitorCheck,
                      iconColor: 'text-purple-600',
                      accentBox: 'bg-purple-950/90 border-purple-500/50 text-purple-100',
                      desc: 'Divisi penjaminan mutu perangkat lunak, pengujian beban otomatis, integrasi CI/CD, dan optimasi SEO.',
                      members: [
                        { role: 'QA ( Quality Assurance ) Tester', name: 'Ilham Fazril', tag: 'Unit Testing & Bug Isolation' },
                        { role: 'DevOps Engineer', name: 'Ilham Fazril', tag: 'Containerization & Cloud Deployment' },
                        { role: 'SEO & Content Specialist', name: 'Ilham Fazril', tag: 'Core Web Vitals & Search Indexing' },
                      ],
                    },
                    {
                      id: 'data_security',
                      title: 'Tim Data & Keamanan ( CyberSecurity )',
                      badge: '3 SPESIALISASI',
                      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
                      headerBg: 'bg-gradient-to-r from-rose-950/15 via-red-950/10 to-slate-900/5 border-rose-300/60',
                      icon: ShieldCheck,
                      iconColor: 'text-rose-600',
                      accentBox: 'bg-rose-950/90 border-rose-500/50 text-rose-100',
                      desc: 'Divisi analisis statistik NoSQL, pemodelan data 27 Kabupaten/Kota, dan enkripsi pertahanan siber.',
                      members: [
                        { role: 'Data Analyst / Data Scientist', name: 'Ilham Fazril', tag: 'Regional PSKS Analytics & Modeling' },
                        { role: 'CyberSecurity Specialist', name: 'Ilham Fazril', tag: 'Bcrypt Hash & Firestore Shielding' },
                        { role: 'Database Administrator ( DBA )', name: 'Ilham Fazril', tag: 'Supabase Realtime DB Ops' },
                      ],
                    },
                    {
                      id: 'ai_automation',
                      title: 'Tim Kecerdasan Buatan ( AI ) & Otomatisasi',
                      badge: '1 SPESIALISASI',
                      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      headerBg: 'bg-gradient-to-r from-emerald-950/15 via-cyan-950/10 to-slate-900/5 border-emerald-300/60',
                      icon: Sparkles,
                      iconColor: 'text-emerald-600',
                      accentBox: 'bg-slate-900 border-emerald-500/50 text-emerald-100',
                      desc: 'Divisi perancangan prompt AI, integrasi model Google Gemini 2.5 Flash, dan otomatisasi asisten cerdas.',
                      members: [
                        { role: 'Prompt Engineer', name: 'Ilham Fazril', tag: 'Gemini AI Assistant & Knowledge Agent' },
                      ],
                    },
                  ].map((teamCat) => {
                    const CatIcon = teamCat.icon;

                    return (
                      <div
                        key={teamCat.id}
                        className="rounded-2xl border-2 border-[#043e2e] shadow-md bg-white ring-2 ring-[#d4af37]/30 overflow-hidden"
                      >
                        {/* CATEGORY HEADER (ALWAYS VISIBLE, NOT A BUTTON) */}
                        <div className={`p-4 flex items-center justify-between gap-3 ${teamCat.headerBg}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-slate-200 ${teamCat.iconColor}`}>
                              <CatIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900 tracking-wide">
                                  {teamCat.title}
                                </h4>
                                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${teamCat.badgeColor}`}>
                                  {teamCat.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                {teamCat.desc}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CATEGORY CONTENT ALWAYS OPEN */}
                        <div className="p-5 border-t border-slate-200 bg-white space-y-4">
                          {/* DESCRIPTION BOX */}
                          <div className={`p-3.5 rounded-xl border shadow-inner ${teamCat.accentBox}`}>
                            <p className="text-xs font-semibold leading-relaxed">
                              {teamCat.desc}
                            </p>
                          </div>

                          {/* ROLES LIST (STACKED VERTICALLY BERJEJER KEBAWAH) */}
                          <div className="space-y-2.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Daftar Anggota & Peran Divisi:
                            </span>
                            {teamCat.members.map((mbr, mIdx) => (
                              <div
                                key={mIdx}
                                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs group"
                              >
                                {/* ROLE & TITLE */}
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-[#043e2e] text-[#d4af37] font-black text-xs flex items-center justify-center shrink-0 border border-[#d4af37]/40 shadow-sm group-hover:scale-105 transition-transform">
                                    IF
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-extrabold text-slate-900 group-hover:text-[#043e2e]">
                                      {mbr.role}
                                    </h5>
                                    <span className="text-[10px] font-medium text-slate-500">
                                      {mbr.tag}
                                    </span>
                                  </div>
                                </div>

                                {/* PERSON NAME & VERIFIED BADGE */}
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <div className="px-3 py-1 rounded-xl bg-white border border-emerald-300 shadow-2xs flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-xs font-black text-slate-900">
                                      {mbr.name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-black bg-[#043e2e] text-[#d4af37] px-2 py-1 rounded-lg border border-[#d4af37]/30">
                                    LEAD
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 10. DEVELOPER SECTION */}
            {(selectedSection === 'developer' || selectedSection === 'all') && (
              <div className="bg-gradient-to-br from-slate-950 via-[#043e2e] to-slate-950 rounded-3xl border-2 border-[#d4af37] p-6 sm:p-8 text-white space-y-8 shadow-2xl relative overflow-hidden">
                {/* BACKGROUND GLOW ACCENTS */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* SECTION HEADER BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-amber-200 text-[#043e2e] font-black shadow-lg shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-amber-300 uppercase tracking-wider">
                        PROFIL LEAD DEVELOPER & SYSTEM ARCHITECT
                      </h3>
                      <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                        Arsitek Utama &amp; Pengembang Kode Program Sistem Informasi PSKS Provinsi Jawa Barat.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[10px] font-black bg-gradient-to-r from-[#d4af37] to-amber-300 text-slate-950 px-3.5 py-1.5 rounded-xl uppercase tracking-wider font-mono shadow-md border border-amber-200">
                      LEAD SYSTEM ARCHITECT
                    </span>
                  </div>
                </div>

                {/* DEVELOPER MAIN IDENTITY CARD */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border-2 border-[#d4af37]/40 shadow-xl relative z-10 space-y-6">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
                    {/* AVATAR & BASIC INFO */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                      {/* AVATAR BADGE WITH GLOW */}
                      <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#d4af37] via-amber-300 to-emerald-400 p-1 shadow-2xl">
                          <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center border-2 border-[#d4af37] space-y-0.5">
                            <span className="text-2xl font-black text-[#d4af37] tracking-widest font-mono">
                              IF
                            </span>
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                              DEV
                            </span>
                          </div>
                        </div>
                        <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black border-2 border-slate-950 shadow-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>VERIFIED</span>
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>FULL STACK DEVELOPER &amp; Creator</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-wide">
                          Ilham Fazril
                        </h2>
                        <p className="text-xs text-emerald-200/90 font-semibold max-w-lg">
                          FULL STACK DEVELOPER — Perancang Arsitektur Kode, Keamanan Siber, Integrasi NoSQL Realtime, Asisten AI Gemini 3.8 Flash, dan Pengembang Antarmuka PSKS Jabar.
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5 text-xs text-slate-300 font-medium pt-1">
                          <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-xl border border-white/10 text-emerald-300 font-semibold">
                            <Mail className="w-4 h-4 text-[#d4af37]" />
                            ilhamfazril042@gmail.com
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-xl border border-white/10 text-amber-200 font-semibold">
                            <Briefcase className="w-4 h-4 text-[#d4af37]" />
                            Dinas Sosial Provinsi Jawa Barat
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-xl border border-white/10 text-cyan-200 font-semibold">
                            <MapPin className="w-4 h-4 text-[#d4af37]" />
                            Cimahi, Jawa Barat
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DEV STATUS METRICS BADGE */}
                    <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-[#043e2e] to-slate-950 border border-emerald-500/40 space-y-2 text-center lg:text-right shrink-0 shadow-lg">
                      <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">
                        STATUS PENGEMBANGAN SISTEM
                      </span>
                      <span className="text-xs font-black text-white block">
                        100% Native Production Build
                      </span>
                      <div className="flex items-center justify-center lg:justify-end gap-1.5 pt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-emerald-300">
                          Active Maintainer &bull; Single Architect
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QUICK STATS COUNTER BAR (6 REKAP KAPABILITAS) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-white/10">
                    {[
                      { num: '27', label: 'Kab/Kota Jabar', sub: 'Spasial GIS GeoJSON' },
                      { num: '10', label: 'Pilar PSKS', sub: 'Infrastruktur Data' },
                      { num: '100%', label: 'Type-Safe', sub: 'TypeScript Clean Code' },
                      { num: '< 40ms', label: 'Realtime Sync', sub: 'Supabase Cloud' },
                      { num: '500 Ribu', label: 'Kapasitas Data', sub: '500 MB Storage Limit' },
                      { num: '6', label: 'Divisi Spesialis', sub: 'Single-Handed Dev' },
                    ].map((st, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-center space-y-0.5 hover:border-[#d4af37]/50 transition-all">
                        <span className="text-base font-black text-amber-300 font-mono block">
                          {st.num}
                        </span>
                        <span className="text-[10px] font-black text-white block truncate">
                          {st.label}
                        </span>
                        <span className="text-[8px] font-medium text-slate-400 block truncate">
                          {st.sub}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EXTENSIVE ACHIEVEMENTS SECTION (PENCAPAIAN LENGKAP DENGAN GRADASI BERBAGAI KATEGORI) */}
                <div className="space-y-6 relative z-10 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <h4 className="text-sm font-black text-amber-300 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#d4af37]" />
                      <span>PORTOFOLIO &amp; REKAP PENCAPAIAN INTEGRASI SISTEM (20 PENCAPAIAN UTAMA)</span>
                    </h4>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-500/40">
                      20 Milestone Terverifikasi
                    </span>
                  </div>

                  {/* CATEGORIZED ACHIEVEMENTS GRID */}
                  <div className="space-y-6">
                    {[
                      {
                        category: '1. ARSITEKTUR BACKEND, DATABASE & CLOUD INFRASTRUCTURE',
                        badge: 'INFRASTRUCTURE & DATABASE',
                        badgeStyle: 'bg-emerald-900/80 text-emerald-200 border-emerald-500/50',
                        gradient: 'from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500/50',
                        icon: Database,
                        iconColor: 'text-emerald-400 bg-emerald-950 border-emerald-500/40',
                        items: [
                          {
                            title: 'Server Proxy Security Express.js',
                            desc: 'Perancangan server proxy Express terenkripsi di port 3000 untuk menyembunyikan API key Google Gemini dan mengamankan permintaan API dari eksposur browser.',
                            tag: 'Security Proxy',
                          },
                          {
                            title: 'Realtime Supabase Cloud PostgreSQL Sync',
                            desc: 'Arsitektur database terdistribusi Supabase Cloud PostgreSQL & JSONB dengan latensi kurang dari 40ms menggunakan channels realtime dan REST adaptif dua arah.',
                            tag: 'PostgreSQL Sync',
                          },
                          {
                            title: 'Akses Multi-Tier & Role Gate RBAC',
                            desc: 'Sistem proteksi tiga tingkat hak akses yang memisahkan batasan fitur User Publik, Admin Wilayah 27 Kab/Kota, dan Superadmin Dinsos Jabar.',
                            tag: 'RBAC Shield',
                          },
                          {
                            title: 'Optimasi Efisiensi Ruang 500 MB Storage',
                            desc: 'Skema data presisi tinggi di mana 1 KB menampung 1 data tabel sedang, memungkinkan kapasitas hingga 500.000 data terenkripsi dalam 500 MB storage.',
                            tag: 'Storage Opt',
                          },
                        ],
                      },
                      {
                        category: '2. PEMETAAN SPASIAL GIS & VISUALISASI WILAYAH JAWA BARAT',
                        badge: 'GIS & REGIONAL MAPPING',
                        badgeStyle: 'bg-amber-900/80 text-amber-200 border-amber-500/50',
                        gradient: 'from-amber-950/80 via-slate-900 to-slate-950 border-amber-500/50',
                        icon: Globe,
                        iconColor: 'text-amber-400 bg-amber-950 border-amber-500/40',
                        items: [
                          {
                            title: 'Peta Spasial GIS 27 Kabupaten/Kota',
                            desc: 'Integrasi mesin pemetaan geografis Leaflet interaktif yang mencakup seluruh 27 Kabupaten/Kota se-Jawa Barat secara presisi.',
                            tag: 'Leaflet GIS',
                          },
                          {
                            title: 'Rendering Polygon Wilayah GeoJSON',
                            desc: 'Visualisasi garis batas wilayah administratif GeoJSON interaktif dengan efek highlight hover dan data statistik wilayah terintegrasi.',
                            tag: 'GeoJSON Polygon',
                          },
                          {
                            title: 'Marker Clustered Anggota 10 Pilar PSKS',
                            desc: 'Penataan penanda lokasi spasial berdasar koordinat latitude/longitude untuk pemetaan sebaran pilar sosial di tiap wilayah.',
                            tag: 'Spatial Marker',
                          },
                          {
                            title: 'Filter & Visualisasi Data Statistik Regional',
                            desc: 'Mesin agregasi data wilayah yang menampilkan ringkasan statistik real-time anggota PSKS dan status verifikasi per kabupaten/kota.',
                            tag: 'Regional Analytics',
                          },
                        ],
                      },
                      {
                        category: '3. KEAMANAN SIBER, ENKRIPSI & OTENTIKASI DIGITAL',
                        badge: 'CYBERSECURITY & AUTH',
                        badgeStyle: 'bg-rose-900/80 text-rose-200 border-rose-500/50',
                        gradient: 'from-rose-950/80 via-slate-900 to-slate-950 border-rose-500/50',
                        icon: ShieldCheck,
                        iconColor: 'text-rose-400 bg-rose-950 border-rose-500/40',
                        items: [
                          {
                            title: 'Digital Barcode Member Card Generator',
                            desc: 'Sistem pembuatan Kartu Tanda Anggota (KTA) Digital resmi ber-Barcode / QR Code terenkripsi untuk otentikasi keanggotaan PSKS.',
                            tag: 'Digital KTA',
                          },
                          {
                            title: 'Pemindai Kamera QR Code Realtime',
                            desc: 'Pengembangan modul scanner kamera HTML5 langsung dari perangkat untuk melakukan verifikasi keaslian KTA Digital secara instan.',
                            tag: 'HTML5 Scanner',
                          },
                          {
                            title: 'Enkripsi Passcode BcryptJS 10-Salt',
                            desc: 'Sistem keamanan pintu gerbang (gate passcode) dengan hashing siber BcryptJS 10 salt rounds tanpa penyimpanan teks polos.',
                            tag: 'Bcrypt Encryption',
                          },
                          {
                            title: 'Saklar Darurat Maintenance Shutoff System',
                            desc: 'Pengendalian saklar penghentian layanan darurat secara selektif per tingkatan pengguna (Publik, Admin Wilayah, Superadmin).',
                            tag: 'Emergency Shutoff',
                          },
                        ],
                      },
                      {
                        category: '4. ANTARMUKA UI/UX, ANIMASI MIKRO & PUSAT KONTROL',
                        badge: 'UI/UX & CONTROL PANEL',
                        badgeStyle: 'bg-teal-900/80 text-teal-200 border-teal-500/50',
                        gradient: 'from-teal-950/80 via-slate-900 to-slate-950 border-teal-500/50',
                        icon: Palette,
                        iconColor: 'text-teal-400 bg-teal-950 border-teal-500/40',
                        items: [
                          {
                            title: 'Master Design System Dinsos Jabar',
                            desc: 'Penerapan palet warna resmi Hijau Botol (#043e2e) dan Emas (#d4af37) dengan kontras tinggi serta tipografi profesional.',
                            tag: 'Brand Identity',
                          },
                          {
                            title: 'Animasi Micro-Interactions Motion Engine',
                            desc: 'Penerapan animasi transisi mulus menggunakan Motion v12 (Framer Motion) untuk pengalaman penggunaan antarmuka yang reaktif.',
                            tag: 'Framer Motion',
                          },
                          {
                            title: 'Pusat Developer Control Panel 10 Modul',
                            desc: 'Panel pusat informasi pengembang komprehensif yang merangkum instruksi, bahasa, pustaka, keamanan, hingga susunan 6 divisi tim.',
                            tag: 'Dev Control Panel',
                          },
                          {
                            title: 'Layout Responsive Cross-Platform Adaptive',
                            desc: 'Penyesuaian antarmuka presisi untuk tampilan Desktop layar lebar, Tablet, hingga perangkat HP Mobile dengan touch target 44px+.',
                            tag: 'Adaptive Layout',
                          },
                        ],
                      },
                      {
                        category: '5. KECERDASAN BUATAN (AI), BUNDLING & EMBEDDED TOOLS',
                        badge: 'AI & SYSTEM BUNDLING',
                        badgeStyle: 'bg-purple-900/80 text-purple-200 border-purple-500/50',
                        gradient: 'from-purple-950/80 via-slate-900 to-slate-950 border-purple-500/50',
                        icon: Sparkles,
                        iconColor: 'text-purple-400 bg-purple-950 border-purple-500/40',
                        items: [
                          {
                            title: 'Asisten Pintar Google Gemini 3.8 Flash AI',
                            desc: 'Integrasi modul asisten kecerdasan buatan Gemini 3.8 Flash untuk membantu pengguna memahami informasi PSKS & panduan sosial secara cerdas & cepat.',
                            tag: 'Gemini 3.8 Flash',
                          },
                          {
                            title: 'Single Bundle ESBuild Server Engine',
                            desc: 'Kompilasi otomatis server TypeScript menjadi dist/server.cjs bundled CommonJS guna menghindari konflik runtime ES Module Node.',
                            tag: 'ESBuild Engine',
                          },
                          {
                            title: 'Strict Type-Safety TypeScript Standards',
                            desc: 'Penulisan kode program berstandar tinggi dengan 100% tipe data TypeScript eksplisit tanpa adanya kebocoran any type.',
                            tag: 'TypeScript Clean',
                          },
                          {
                            title: 'Sistem Auto-Save Realtime & Export Data',
                            desc: 'Fitur penyimpanan otomatis perubahan data ke cloud secara instan disertai kemampuan cetak laporan resmi.',
                            tag: 'Auto-Save & Export',
                          },
                        ],
                      },
                    ].map((catGroup, cIdx) => {
                      const GroupIcon = catGroup.icon;

                      return (
                        <div
                          key={cIdx}
                          className={`p-5 rounded-3xl bg-gradient-to-br ${catGroup.gradient} border shadow-xl space-y-4`}
                        >
                          {/* CATEGORY TITLE BAR */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border ${catGroup.iconColor}`}>
                                <GroupIcon className="w-5 h-5" />
                              </div>
                              <h5 className="text-xs font-black text-white uppercase tracking-wider">
                                {catGroup.category}
                              </h5>
                            </div>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider self-start sm:self-center ${catGroup.badgeStyle}`}>
                              {catGroup.badge}
                            </span>
                          </div>

                          {/* 4 CARDS GRID PER CATEGORY */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {catGroup.items.map((item, iIdx) => (
                              <div
                                key={iIdx}
                                className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1.5 hover:border-[#d4af37]/60 transition-all group shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h6 className="text-xs font-black text-amber-300 group-hover:text-white transition-colors">
                                    {item.title}
                                  </h6>
                                  <span className="text-[8px] font-mono font-bold bg-white/10 text-emerald-300 px-2 py-0.5 rounded-md shrink-0 border border-white/10">
                                    {item.tag}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                  {item.desc}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ACTION FOOTER */}
            {(isMainSettingSection(selectedSection) || !inline) && (
              <div id="settings-action-footer" className="p-6 bg-white rounded-3xl border-2 border-slate-200 flex flex-col items-start gap-4 shadow-sm">
                {/* SHOW AUTOSAVE BADGE ONLY FOR 4 MAIN SETTINGS SECTIONS */}
                {isMainSettingSection(selectedSection) && (
                  <div className="px-5 py-3 rounded-2xl text-xs font-black bg-emerald-900 text-emerald-200 border border-emerald-500 flex items-center gap-2 shadow-sm">
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>
                      {isSaving ? 'Menyimpan Perubahan ke Database...' : 'Sistem Auto-Save Realtime Aktif'}
                    </span>
                  </div>
                )}

                {/* BOTTOM LEFT BUTTON: KEMBALI KE MENU PENGATURAN (ONLY IN MODAL MODE TO PREVENT DUPLICATES IN INLINE PAGE) */}
                {!inline && (
                  <button
                    type="button"
                    onClick={handleBackToSettingsMenu}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border-2 border-[#d4af37] font-extrabold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#d4af37]" />
                    <span>← Menu Pengaturan</span>
                  </button>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL POP UP: BACKGROUND BERHASIL DIUBAH */}
      {/* ========================================================================= */}
      {bgChangeSuccessModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#043e2e] max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-center animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                🎉 Background Berhasil Diubah!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Latar belakang portal telah sukses diperbarui dan disinkronkan secara <strong>realtime</strong> ke seluruh pengguna PSKS Jabar di 27 Kabupaten/Kota.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Sinkronisasi Global 100% Aktif</span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setBgChangeSuccessModal(false)}
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

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {content}
    </div>
  );
};
