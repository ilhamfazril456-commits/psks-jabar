import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Trash2,
  Calendar,
  User,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  Layers,
  Flame,
  Check,
  X,
  FileCheck2,
  UserX,
  FileText,
  Settings,
  Database,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  UserCheck,
  Info,
} from 'lucide-react';
import { SystemLog, UserSession } from '../types';
import {
  getLocalLogs,
  autoPurgeOldLogs,
  clearAllSystemLogs,
  deleteLogById,
  deleteLogsByCategory,
  isLogInCategory,
  formatRelativeTime,
  recordSystemActivity,
} from '../lib/activityLogger';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JABAR_REGIONS } from '../data/initialData';
import { BackToHomeButton } from './BackToHomeButton';

interface ActivityLogPageProps {
  session: UserSession;
  onBackToHome: () => void;
}

type ActiveCategory = 'VERIFIKASI' | 'PSKS' | 'ADMIN_ACCOUNT' | 'SYSTEM';
type ViewLevel = 'CATEGORY_MENU' | 'DETAIL_TABLE';

const OFFICIAL_PILLARS = [
  { id: 'peksos', title: 'PEKSOS PROFESIONAL', shortName: 'Pekerja Sosial Profesional' },
  { id: 'psm', title: 'PSM', shortName: 'Pekerja Sosial Masyarakat' },
  { id: 'tagana', title: 'TAGANA', shortName: 'Taruna Siaga Bencana' },
  { id: 'lks', title: 'LKS', shortName: 'Lembaga Kesejahteraan Sosial' },
  { id: 'karangtaruna', title: 'KARANG TARUNA', shortName: 'Gerakan Pemuda Karang Taruna' },
  { id: 'lk3', title: 'LK3', shortName: 'Lembaga Konsultasi Kesejahteraan Keluarga' },
  { id: 'pensos', title: 'PENSOS', shortName: 'Penyuluh Sosial Masyarakat' },
  { id: 'tksk', title: 'TKSK', shortName: 'Tenaga Kesejahteraan Sosial Kecamatan' },
  { id: 'badanusaha', title: 'BADAN USAHA', shortName: 'KUBE & Badan Usaha Sosial' },
  { id: 'slrt_puskesos', title: 'SLRT PUSKESOS', shortName: 'Sistem Layanan & Rujukan Terpadu' },
];

export const ActivityLogPage: React.FC<ActivityLogPageProps> = ({
  session,
  onBackToHome,
}) => {
  // Navigation Hierarchy Level:
  // Level 1: 'CATEGORY_MENU' (4 Kolom Fitur Utama)
  // Level 2: 'DETAIL_TABLE' (Tabel Rincian Kategori Terpilih)
  const [viewLevel, setViewLevel] = useState<ViewLevel>('CATEGORY_MENU');
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('VERIFIKASI');

  const [logs, setLogs] = useState<SystemLog[]>(() => getLocalLogs());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedWilayah, setSelectedWilayah] = useState<string>('ALL');
  const [selectedPillar, setSelectedPillar] = useState<string>('ALL');

  // Purge & Clear State
  const [isPurging30Days, setIsPurging30Days] = useState<boolean>(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  // Clear All Modal States
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [showClearSuccessModal, setShowClearSuccessModal] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [clearedLogsCount, setClearedLogsCount] = useState<number>(0);

  // Per-Category Clear Modal States
  const [categoryToDelete, setCategoryToDelete] = useState<ActiveCategory | null>(null);
  const [showClearCategoryConfirmModal, setShowClearCategoryConfirmModal] = useState<boolean>(false);
  const [isClearingCategory, setIsClearingCategory] = useState<boolean>(false);
  const [clearedCategoryName, setClearedCategoryName] = useState<string>('');

  // Fetch / Sync logs from Firestore real-time
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const logsRef = collection(db, 'system_logs');
      const q = query(logsRef, orderBy('createdAt', 'desc'), limit(400));
      const snap = await getDocs(q);

      let fetchedList: SystemLog[] = [];
      if (!snap.empty) {
        snap.forEach((docSnap) => {
          const data = docSnap.data() as SystemLog;
          const isDev =
            (data.actorRole as string) === 'developer' ||
            (data.actorName || '').toLowerCase().includes('ilham') ||
            (data.actorName || '').toLowerCase().includes('developer');
          if (!isDev) {
            fetchedList.push({ ...data, id: docSnap.id });
          }
        });
        // Sync local storage to match cloud
        try {
          localStorage.setItem('psks_system_logs', JSON.stringify(fetchedList));
        } catch {}
      } else {
        // If Firestore collection is empty, check local storage (which might also be empty or wiped)
        fetchedList = getLocalLogs();
      }

      const sorted = fetchedList.sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );

      const normalized = sorted.map((l) => {
        if (!l.category) {
          if (l.actionType === 'APPROVE' || l.actionType === 'REJECT' || l.targetCollection === 'registration_submissions') {
            return { ...l, category: 'VERIFIKASI' as const };
          }
          if (l.targetCollection === 'admin_accounts' || l.details?.toLowerCase().includes('akun admin')) {
            return { ...l, category: 'ADMIN_ACCOUNT' as const };
          }
          return { ...l, category: 'PSKS' as const };
        }
        return l;
      });

      setLogs(normalized);
    } catch (e) {
      console.error('Error fetching logs:', e);
      setLogs(getLocalLogs());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    autoPurgeOldLogs().catch(() => {});

    try {
      const logsRef = collection(db, 'system_logs');
      const q = query(logsRef, orderBy('createdAt', 'desc'), limit(400));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // When firestore logs collection is empty (e.g. wiped/cleared), set state to empty and clear localStorage
            setLogs([]);
            try {
              localStorage.setItem('psks_system_logs', JSON.stringify([]));
            } catch {}
          } else {
            const firestoreLogs: SystemLog[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as SystemLog;
              const isDev =
                (data.actorRole as string) === 'developer' ||
                (data.actorName || '').toLowerCase().includes('ilham') ||
                (data.actorName || '').toLowerCase().includes('developer');
              if (!isDev) {
                firestoreLogs.push({ ...data, id: docSnap.id });
              }
            });

            // Update local storage to match authoritative Firestore
            try {
              localStorage.setItem('psks_system_logs', JSON.stringify(firestoreLogs));
            } catch {}

            const sorted = firestoreLogs.sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            );

            const normalized = sorted.map((l) => {
              if (!l.category) {
                if (l.actionType === 'APPROVE' || l.actionType === 'REJECT' || l.targetCollection === 'registration_submissions') {
                  return { ...l, category: 'VERIFIKASI' as const };
                }
                if (l.targetCollection === 'admin_accounts' || l.details?.toLowerCase().includes('akun admin')) {
                  return { ...l, category: 'ADMIN_ACCOUNT' as const };
                }
                return { ...l, category: 'PSKS' as const };
              }
              return l;
            });

            setLogs(normalized);
          }
        },
        (error) => {
          console.warn('[ActivityLogPage] Snapshot listener notice:', error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error('[ActivityLogPage] Listener setup error:', e);
    }
  }, []);

  // Handler: Uji Pembersihan Otomatis 30 Hari
  const handleManual30DayPurge = async () => {
    setIsPurging30Days(true);
    try {
      const purged = await autoPurgeOldLogs();
      fetchLogs();
      setPurgeFeedback(
        purged > 0
          ? `✅ Berhasil membersihkan ${purged} log yang berusia lebih dari 30 hari.`
          : '✅ Sistem bersih! Tidak ada log berusia lebih dari 30 hari.'
      );
      setTimeout(() => setPurgeFeedback(null), 4000);
    } catch (e) {
      setPurgeFeedback('⚠️ Gagal menjalankan pengecekan pembersihan log.');
      setTimeout(() => setPurgeFeedback(null), 3000);
    } finally {
      setIsPurging30Days(false);
    }
  };

  // Handler: Hapus Seluruh Riwayat Aktivitas Secara Instan
  const handleConfirmClearAllLogs = async () => {
    setIsClearingAll(true);
    try {
      const currentCount = logs.length;
      await clearAllSystemLogs();

      // Clear local state immediately for instant real-time feedback
      setLogs([]);
      setClearedLogsCount(currentCount);

      // Close confirm popup and show success popup
      setShowClearConfirmModal(false);
      setShowClearSuccessModal(true);
    } catch (err) {
      console.error('Failed to clear logs:', err);
      alert('⚠️ Gagal menghapus seluruh riwayat aktivitas. Silakan coba kembali.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Handler: Hapus Log Tunggal (Per Baris)
  const handleDeleteSingleLog = async (logId: string) => {
    if (!logId) return;
    try {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      await deleteLogById(logId);
    } catch (e) {
      console.error('Failed to delete single log:', e);
    }
  };

  // Handler: Buka Modal Konfirmasi Hapus Per Kategori
  const handleRequestClearCategory = (cat: ActiveCategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCategoryToDelete(cat);
    setShowClearCategoryConfirmModal(true);
  };

  // Handler: Eksekusi Hapus Riwayat Khusus Kategori Terpilih
  const handleConfirmClearCategory = async () => {
    if (!categoryToDelete) return;
    setIsClearingCategory(true);
    try {
      const categoryLogs = logs.filter((l) => isLogInCategory(l, categoryToDelete));
      const idsToDelete = categoryLogs.map((l) => l.id).filter(Boolean) as string[];
      const count = idsToDelete.length;

      // Filter local state immediately for instant feedback
      setLogs((prev) => prev.filter((l) => !isLogInCategory(l, categoryToDelete)));

      // Delete ONLY this category from storage & Firestore
      await deleteLogsByCategory(categoryToDelete, idsToDelete);

      setClearedLogsCount(count);
      setClearedCategoryName(getCategoryTitle(categoryToDelete));
      setShowClearCategoryConfirmModal(false);
      setShowClearSuccessModal(true);
    } catch (e) {
      console.error('Failed to clear category logs:', e);
      alert('⚠️ Gagal menghapus riwayat kategori. Silakan coba lagi.');
    } finally {
      setIsClearingCategory(false);
    }
  };

  // Detailed Counts for each category
  const categoryCounts = useMemo(() => {
    let all = 0;
    let verifikasi = 0;
    let verifikasiDiterima = 0;
    let verifikasiDitolak = 0;

    let psks = 0;
    let psksTambah = 0;
    let psksUbah = 0;
    let psksHapus = 0;

    let admin = 0;
    let adminTambah = 0;
    let adminUbah = 0;
    let adminHapus = 0;

    let system = 0;
    let systemClear = 0;
    let systemConfig = 0;

    logs.forEach((l) => {
      const isDev =
        (l.actorRole as string) === 'developer' ||
        (l.actorName || '').toLowerCase().includes('ilham') ||
        (l.actorName || '').toLowerCase().includes('developer');
      if (isDev) return;

      all++;
      const details = (l.details || '').toLowerCase();
      const act = (l.actionType || '').toUpperCase();

      const isVerif =
        l.category === 'VERIFIKASI' ||
        act === 'APPROVE' ||
        act === 'REJECT' ||
        l.targetCollection === 'registration_submissions' ||
        details.includes('menerima') ||
        details.includes('menolak');

      const isPsks =
        (l.category === 'PSKS' || l.targetCollection === 'psks_records') &&
        !isVerif;

      const isAdmin =
        l.category === 'ADMIN_ACCOUNT' ||
        l.targetCollection === 'admin_accounts' ||
        details.includes('akun admin');

      const isSys =
        l.category === 'SYSTEM' ||
        act === 'CLEAR' ||
        l.targetCollection === 'system_logs' ||
        l.targetCollection === 'app_settings';

      if (isVerif) {
        verifikasi++;
        if (act === 'APPROVE' || details.includes('menerima') || details.includes('menyetujui')) {
          verifikasiDiterima++;
        } else if (act === 'REJECT' || details.includes('menolak')) {
          verifikasiDitolak++;
        }
      }

      if (isPsks) {
        psks++;
        if (act === 'CREATE' || act === 'SET' || details.includes('menambahkan')) psksTambah++;
        else if (act === 'UPDATE' || details.includes('mengubah') || details.includes('memperbarui')) psksUbah++;
        else if (act === 'DELETE' || details.includes('menghapus')) psksHapus++;
      }

      if (isAdmin) {
        admin++;
        if (act === 'CREATE' || details.includes('menambahkan')) adminTambah++;
        else if (act === 'UPDATE' || details.includes('mengubah') || details.includes('memperbarui') || details.includes('password')) adminUbah++;
        else if (act === 'DELETE' || details.includes('menghapus')) adminHapus++;
      }

      if (isSys) {
        system++;
        if (act === 'CLEAR' || details.includes('membersihkan')) systemClear++;
        else systemConfig++;
      }
    });

    return {
      all,
      verifikasi,
      verifikasiDiterima,
      verifikasiDitolak,
      psks,
      psksTambah,
      psksUbah,
      psksHapus,
      admin,
      adminTambah,
      adminUbah,
      adminHapus,
      system,
      systemClear,
      systemConfig,
    };
  }, [logs]);

  // Navigate to Level 2 (Category detail table)
  const handleSelectCategory = (cat: ActiveCategory) => {
    setActiveCategory(cat);
    setSelectedAction('ALL');
    setSelectedWilayah('ALL');
    setSelectedPillar('ALL');
    setSearchQuery('');
    setViewLevel('DETAIL_TABLE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back to Level 1 (4-Column Feature Selection)
  const handleBackToCategories = () => {
    setViewLevel('CATEGORY_MENU');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter logs for the active view
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const isDev =
        (log.actorRole as string) === 'developer' ||
        (log.actorName || '').toLowerCase().includes('ilham') ||
        (log.actorName || '').toLowerCase().includes('developer');
      if (isDev) return false;

      const details = (log.details || '').toLowerCase();
      const act = (log.actionType || '').toUpperCase();

      // 1. Filter by category
      const isVerif =
        log.category === 'VERIFIKASI' ||
        act === 'APPROVE' ||
        act === 'REJECT' ||
        log.targetCollection === 'registration_submissions' ||
        details.includes('menerima') ||
        details.includes('menolak');

      const isPsks =
        (log.category === 'PSKS' || log.targetCollection === 'psks_records') &&
        !isVerif;

      const isAdmin =
        log.category === 'ADMIN_ACCOUNT' ||
        log.targetCollection === 'admin_accounts' ||
        details.includes('akun admin');

      const isSys =
        log.category === 'SYSTEM' ||
        act === 'CLEAR' ||
        log.targetCollection === 'system_logs' ||
        log.targetCollection === 'app_settings';

      if (activeCategory === 'VERIFIKASI' && !isVerif) return false;
      if (activeCategory === 'PSKS' && !isPsks) return false;
      if (activeCategory === 'ADMIN_ACCOUNT' && !isAdmin) return false;
      if (activeCategory === 'SYSTEM' && !isSys) return false;

      // 2. Category Specific Actions
      if (activeCategory === 'VERIFIKASI') {
        const isApproved = act === 'APPROVE' || details.includes('menerima') || details.includes('menyetujui');
        const isRejected = act === 'REJECT' || details.includes('menolak');

        if (selectedAction === 'APPROVE' && !isApproved) return false;
        if (selectedAction === 'REJECT' && !isRejected) return false;
      } else if (selectedAction !== 'ALL') {
        if (selectedAction === 'CREATE' && act !== 'CREATE' && act !== 'SET' && !details.includes('menambahkan')) return false;
        if (selectedAction === 'UPDATE' && act !== 'UPDATE' && !details.includes('mengubah') && !details.includes('memperbarui')) return false;
        if (selectedAction === 'DELETE' && act !== 'DELETE' && !details.includes('menghapus')) return false;
        if (selectedAction === 'CLEAR' && act !== 'CLEAR' && !details.includes('membersihkan')) return false;
      }

      // 3. Filter by search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const actor = (log.actorName || '').toLowerCase();
        const wil = (log.actorWilayah || '').toLowerCase();
        const det = (log.details || '').toLowerCase();
        const targetName = (log.targetName || '').toLowerCase();
        const targetPillar = (log.targetPillar || '').toLowerCase();
        const targetId = (log.targetId || '').toLowerCase();
        const time = (log.timestamp || '').toLowerCase();

        const matches =
          actor.includes(q) ||
          wil.includes(q) ||
          det.includes(q) ||
          targetName.includes(q) ||
          targetPillar.includes(q) ||
          targetId.includes(q) ||
          time.includes(q);

        if (!matches) return false;
      }

      // 4. Filter by Wilayah
      if (selectedWilayah !== 'ALL') {
        const wil = (log.actorWilayah || log.targetWilayah || '').toLowerCase();
        const filterW = selectedWilayah.toLowerCase();
        if (!wil.includes(filterW) && !filterW.includes(wil)) {
          return false;
        }
      }

      // 5. Filter by Pillar
      if (selectedPillar !== 'ALL') {
        const pilar = (log.targetPillar || '').toLowerCase();
        const match =
          pilar === selectedPillar.toLowerCase() ||
          pilar.includes(selectedPillar.toLowerCase()) ||
          details.includes(selectedPillar.toLowerCase());

        if (!match) {
          return false;
        }
      }

      return true;
    });
  }, [logs, activeCategory, searchQuery, selectedAction, selectedWilayah, selectedPillar]);

  // Action badge styling helper for clean light mode
  const getActionBadge = (log: SystemLog) => {
    const act = (log.actionType || '').toUpperCase();
    const details = (log.details || '').toLowerCase();

    if (act === 'APPROVE' || details.includes('menerima') || details.includes('menyetujui')) {
      return {
        bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        dot: 'bg-emerald-600',
        icon: FileCheck2,
        label: 'DITERIMA',
      };
    }
    if (act === 'REJECT' || details.includes('menolak')) {
      return {
        bg: 'bg-rose-100 text-rose-950 border-rose-300',
        dot: 'bg-rose-600',
        icon: UserX,
        label: 'DITOLAK',
      };
    }
    if (act === 'CREATE' || act === 'SET' || details.includes('menambahkan')) {
      return {
        bg: 'bg-teal-100 text-teal-950 border-teal-300',
        dot: 'bg-teal-600',
        icon: CheckCircle2,
        label: 'TAMBAH DATA',
      };
    }
    if (act === 'UPDATE' || details.includes('mengubah') || details.includes('memperbarui')) {
      return {
        bg: 'bg-amber-100 text-amber-950 border-amber-300',
        dot: 'bg-amber-500',
        icon: RefreshCw,
        label: 'UBAH DATA',
      };
    }
    if (act === 'DELETE' || details.includes('menghapus')) {
      return {
        bg: 'bg-rose-100 text-rose-950 border-rose-300',
        dot: 'bg-rose-600',
        icon: Trash2,
        label: 'HAPUS DATA',
      };
    }
    if (act === 'CLEAR' || details.includes('membersihkan riwayat')) {
      return {
        bg: 'bg-orange-100 text-orange-950 border-orange-300',
        dot: 'bg-orange-600',
        icon: Database,
        label: 'BERSIHKAN LOG',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-500',
      icon: History,
      label: act || 'AKTIVITAS',
    };
  };

  const getCategoryTitle = (cat: ActiveCategory) => {
    switch (cat) {
      case 'VERIFIKASI':
        return 'Pendaftaran & Verifikasi';
      case 'PSKS':
        return 'Data 10 Pilar PSKS';
      case 'ADMIN_ACCOUNT':
        return 'Akun Admin';
      case 'SYSTEM':
        return 'Sistem';
      default:
        return 'Riwayat Aktivitas';
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-[90vh] py-4 sm:py-8 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ========================================================================= */}
        {/* 1. TOP NAVIGATION & DYNAMIC BREADCRUMB */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            {viewLevel === 'CATEGORY_MENU' ? (
              <BackToHomeButton onClick={onBackToHome} id="btn-back-top-activity-log" />
            ) : (
              <button
                type="button"
                id="btn-back-top-to-category-menu"
                onClick={handleBackToCategories}
                className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#043e2e] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 font-black text-xs sm:text-sm rounded-xl shadow-md border border-[#d4af37]/60 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-amber-300" />
                <span>Kembali ke 4 Kategori Riwayat</span>
              </button>
            )}
          </div>

          {/* Quick Actions & Role Badge */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-bold text-xs border border-[#d4af37]/40 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="Segarkan data riwayat secara realtime"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Segarkan</span>
            </button>

            {viewLevel === 'DETAIL_TABLE' ? (
              <button
                type="button"
                id="btn-hapus-riwayat-kategori"
                onClick={() => handleRequestClearCategory(activeCategory)}
                disabled={filteredLogs.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs border border-rose-400 shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                title={`Hapus riwayat khusus kategori ${getCategoryTitle(activeCategory)}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Riwayat {getCategoryTitle(activeCategory)}</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-hapus-riwayat-aktivitas"
                onClick={() => setShowClearConfirmModal(true)}
                disabled={logs.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs border border-rose-400 shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                title="Hapus seluruh riwayat aktivitas dari semua 4 kategori"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Seluruh Riwayat ({logs.length})</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300/80 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#043e2e]">
              <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="uppercase font-black">{session.role}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Breadcrumbs for Hierarchical Navigation */}
        {viewLevel === 'DETAIL_TABLE' && (
          <nav aria-label="Navigasi Riwayat Aktivitas" className="text-xs font-bold text-slate-700 bg-white/95 border border-slate-300/80 px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 flex-wrap animate-fadeIn">
            <span
              onClick={handleBackToCategories}
              className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-800 cursor-pointer underline decoration-dotted"
            >
              <History className="w-3.5 h-3.5 text-emerald-700" />
              <span>4 Kategori Riwayat</span>
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <span className="flex items-center gap-1.5 text-[#043e2e] font-black bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              <span>{getCategoryTitle(activeCategory)}</span>
            </span>
          </nav>
        )}

        {/* ========================================================================= */}
        {/* 2. HERO HEADER BOX */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] p-5 sm:p-7 rounded-3xl text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#d4af37]/20 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/50 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {viewLevel === 'CATEGORY_MENU'
                      ? '4 KATEGORI UTAMA PENYORTIRAN RIWAYAT'
                      : `TABEL RIWAYAT • ${getCategoryTitle(activeCategory).toUpperCase()}`}
                  </span>
                </span>

                <span className="text-[10px] font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Auto-Purge 30 Hari Aktif</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2 leading-tight">
                {viewLevel === 'CATEGORY_MENU' ? (
                  <span>Riwayat Aktivitas & Perubahan Sistem</span>
                ) : (
                  <span>Riwayat {getCategoryTitle(activeCategory)}</span>
                )}
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse hidden sm:inline-block" />
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                {viewLevel === 'CATEGORY_MENU'
                  ? 'Pilih salah satu dari 4 kategori fitur di bawah untuk menyortir dan meninjau audit trail secara terstruktur dan mendalam.'
                  : `Menampilkan seluruh rekam jejak audit untuk kategori ${getCategoryTitle(activeCategory)}. Seluruh tindakan dicatat secara instan dan akurat.`}
              </p>
            </div>

            {/* Quick Stats Counter */}
            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-700/60 p-2.5 rounded-2xl shrink-0 self-start md:self-auto">
              <div className="px-3.5 py-2 bg-[#043e2e] rounded-xl border border-[#d4af37]/50 text-center">
                <span className="text-[9px] font-bold text-emerald-200 uppercase block">Total Log</span>
                <span className="text-xl font-black text-amber-300">{logs.length}</span>
              </div>
              <div className="px-3.5 py-2 bg-emerald-900/50 rounded-xl border border-emerald-600/40 text-center">
                <span className="text-[9px] font-bold text-emerald-200 uppercase block">
                  {viewLevel === 'CATEGORY_MENU' ? '4 Kategori' : 'Tampil'}
                </span>
                <span className="text-xl font-black text-white">
                  {viewLevel === 'CATEGORY_MENU' ? '4' : filteredLogs.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PURGE FEEDBACK NOTIFICATION */}
        {purgeFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border-2 border-emerald-400 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{purgeFeedback}</span>
            </div>
            <button
              onClick={() => setPurgeFeedback(null)}
              className="text-emerald-800 hover:text-emerald-950 font-black cursor-pointer px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 1: 4 KOLOM FITUR UTAMA PENYORTIRAN RIWAYAT AKTIVITAS */}
        {/* ========================================================================= */}
        {viewLevel === 'CATEGORY_MENU' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-[#043e2e] uppercase tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <span>Pilih Kategori Riwayat Aktivitas</span>
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Pilih salah satu dari 4 modul berikut untuk membuka tabel data audit aktivitas yang spesifik:
              </p>
            </div>

            {/* Grid 4 Kolom Fitur Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

              {/* KOLOM 1: Pendaftaran & Verifikasi */}
              <div
                id="btn-cat-pendaftaran-verifikasi"
                role="button"
                tabIndex={0}
                onClick={() => handleSelectCategory('VERIFIKASI')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectCategory('VERIFIKASI');
                  }
                }}
                className="group text-left bg-gradient-to-b from-white to-emerald-50/40 rounded-3xl p-6 border-2 border-emerald-200 hover:border-emerald-600 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 to-teal-600" />

                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#043e2e] to-emerald-800 text-amber-300 flex items-center justify-center text-2xl shadow-md border border-amber-400/30 group-hover:scale-110 transition-transform">
                      <FileCheck2 className="w-7 h-7 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider">
                      Modul 1
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#043e2e] group-hover:text-emerald-700 transition-colors leading-tight">
                    Pendaftaran & Verifikasi
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    Rekam jejak persetujuan (Acc) dan penolakan berkas pendaftaran calon anggota 10 Pilar PSKS oleh Admin Wilayah.
                  </p>
                </div>

                <div className="space-y-3 pt-5 mt-4 border-t border-emerald-100">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Total Riwayat:</span>
                    <span className="font-black text-[#043e2e] text-base">{categoryCounts.verifikasi}</span>
                  </div>

                  {/* Sub-status khusus diterima & ditolak */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-black text-center">
                    <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-950 border border-emerald-300">
                      <div className="text-[10px] text-emerald-800 font-bold">✅ Diterima</div>
                      <div className="text-sm mt-0.5">{categoryCounts.verifikasiDiterima}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-100/80 text-rose-950 border border-rose-300">
                      <div className="text-[10px] text-rose-800 font-bold">❌ Ditolak</div>
                      <div className="text-sm mt-0.5">{categoryCounts.verifikasiDitolak}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-emerald-100/60 mt-1">
                    <span className="flex items-center gap-1 text-xs font-black text-emerald-800 group-hover:text-emerald-950">
                      <span>Buka Rincian</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                    <button
                      type="button"
                      id="btn-clear-cat-verifikasi"
                      onClick={(e) => handleRequestClearCategory('VERIFIKASI', e)}
                      disabled={categoryCounts.verifikasi === 0}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Hapus riwayat khusus kategori Pendaftaran & Verifikasi saja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Kategori</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KOLOM 2: Data 10 Pilar PSKS */}
              <div
                id="btn-cat-data-10-pilar"
                role="button"
                tabIndex={0}
                onClick={() => handleSelectCategory('PSKS')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectCategory('PSKS');
                  }
                }}
                className="group text-left bg-gradient-to-b from-white to-teal-50/40 rounded-3xl p-6 border-2 border-teal-200 hover:border-teal-600 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-600 to-emerald-700" />

                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-900 to-emerald-950 text-amber-300 flex items-center justify-center text-2xl shadow-md border border-amber-400/30 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-black text-teal-950 bg-teal-100 border border-teal-300 px-3 py-1 rounded-full uppercase tracking-wider">
                      Modul 2
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#043e2e] group-hover:text-teal-700 transition-colors leading-tight">
                    Data 10 Pilar PSKS
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    Rekam jejak penambahan anggota baru, pembaruan data, dan penghapusan data anggota resmi pada 10 Pilar PSKS.
                  </p>
                </div>

                <div className="space-y-3 pt-5 mt-4 border-t border-teal-100">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Total Riwayat:</span>
                    <span className="font-black text-[#043e2e] text-base">{categoryCounts.psks}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-black text-center">
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-900 border border-teal-200">
                      <div className="text-[9px] text-teal-700 font-bold">Tambah</div>
                      <div className="text-xs mt-0.5">{categoryCounts.psksTambah}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                      <div className="text-[9px] text-amber-700 font-bold">Ubah</div>
                      <div className="text-xs mt-0.5">{categoryCounts.psksUbah}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
                      <div className="text-[9px] text-rose-700 font-bold">Hapus</div>
                      <div className="text-xs mt-0.5">{categoryCounts.psksHapus}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-teal-100/60 mt-1">
                    <span className="flex items-center gap-1 text-xs font-black text-teal-800 group-hover:text-teal-950">
                      <span>Buka Rincian</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                    <button
                      type="button"
                      id="btn-clear-cat-psks"
                      onClick={(e) => handleRequestClearCategory('PSKS', e)}
                      disabled={categoryCounts.psks === 0}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Hapus riwayat khusus kategori Data 10 Pilar PSKS saja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Kategori</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KOLOM 3: Akun Admin */}
              <div
                id="btn-cat-akun-admin"
                role="button"
                tabIndex={0}
                onClick={() => handleSelectCategory('ADMIN_ACCOUNT')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectCategory('ADMIN_ACCOUNT');
                  }
                }}
                className="group text-left bg-gradient-to-b from-white to-blue-50/40 rounded-3xl p-6 border-2 border-blue-200 hover:border-blue-600 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 to-indigo-800" />

                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-950 to-indigo-900 text-amber-300 flex items-center justify-center text-2xl shadow-md border border-amber-400/30 group-hover:scale-110 transition-transform">
                      <Shield className="w-7 h-7 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-black text-blue-950 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full uppercase tracking-wider">
                      Modul 3
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#043e2e] group-hover:text-blue-700 transition-colors leading-tight">
                    Akun Admin
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    Rekam jejak pembuatan akun admin baru, pembaruan password, dan hak akses admin wilayah 27 Kab/Kota.
                  </p>
                </div>

                <div className="space-y-3 pt-5 mt-4 border-t border-blue-100">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Total Riwayat:</span>
                    <span className="font-black text-[#043e2e] text-base">{categoryCounts.admin}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-black text-center">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                      <div className="text-[10px] text-blue-700 font-bold">Tambah Akun</div>
                      <div className="text-sm mt-0.5">{categoryCounts.adminTambah}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200">
                      <div className="text-[10px] text-indigo-700 font-bold">Ubah Akun</div>
                      <div className="text-sm mt-0.5">{categoryCounts.adminUbah}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-blue-100/60 mt-1">
                    <span className="flex items-center gap-1 text-xs font-black text-blue-800 group-hover:text-blue-950">
                      <span>Buka Rincian</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                    <button
                      type="button"
                      id="btn-clear-cat-admin"
                      onClick={(e) => handleRequestClearCategory('ADMIN_ACCOUNT', e)}
                      disabled={categoryCounts.admin === 0}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Hapus riwayat khusus kategori Akun Admin saja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Kategori</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KOLOM 4: Sistem */}
              <div
                id="btn-cat-sistem"
                role="button"
                tabIndex={0}
                onClick={() => handleSelectCategory('SYSTEM')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectCategory('SYSTEM');
                  }
                }}
                className="group text-left bg-gradient-to-b from-white to-amber-50/40 rounded-3xl p-6 border-2 border-amber-200 hover:border-amber-600 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 to-orange-700" />

                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-900 to-yellow-950 text-amber-300 flex items-center justify-center text-2xl shadow-md border border-amber-400/30 group-hover:scale-110 transition-transform">
                      <Settings className="w-7 h-7 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-black text-amber-950 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full uppercase tracking-wider">
                      Modul 4
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#043e2e] group-hover:text-amber-700 transition-colors leading-tight">
                    Sistem
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    Rekam jejak pembersihan seluruh riwayat aktivitas, konfigurasi global, floating WA, & pengumuman darurat.
                  </p>
                </div>

                <div className="space-y-3 pt-5 mt-4 border-t border-amber-100">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Total Riwayat:</span>
                    <span className="font-black text-[#043e2e] text-base">{categoryCounts.system}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-black text-center">
                    <div className="p-2 rounded-xl bg-orange-50 text-orange-900 border border-orange-200">
                      <div className="text-[10px] text-orange-700 font-bold">Bersihkan Log</div>
                      <div className="text-sm mt-0.5">{categoryCounts.systemClear}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                      <div className="text-[10px] text-amber-700 font-bold">Konfigurasi</div>
                      <div className="text-sm mt-0.5">{categoryCounts.systemConfig}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-amber-100/60 mt-1">
                    <span className="flex items-center gap-1 text-xs font-black text-amber-800 group-hover:text-amber-950">
                      <span>Buka Rincian</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                    <button
                      type="button"
                      id="btn-clear-cat-sistem"
                      onClick={(e) => handleRequestClearCategory('SYSTEM', e)}
                      disabled={categoryCounts.system === 0}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Hapus riwayat khusus kategori Sistem saja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Kategori</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: DATA TABEL RIWAYAT KATEGORI TERPILIH DENGAN FILTER SPESIFIK */}
        {/* ========================================================================= */}
        {viewLevel === 'DETAIL_TABLE' && (
          <div className="space-y-5 animate-fadeIn">

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Cari riwayat ${getCategoryTitle(activeCategory)}...`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e] focus:bg-white transition-all font-medium"
                  />
                </div>

                {/* Filter Actions Pills */}
                {activeCategory === 'VERIFIKASI' ? (
                  /* Khusus Pendaftaran & Verifikasi: Cukup Diterima & Ditolak */
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0 self-start md:self-auto flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAction('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'ALL'
                          ? 'bg-[#043e2e] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua Status ({categoryCounts.verifikasi})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('APPROVE')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'APPROVE'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ✅ Diterima ({categoryCounts.verifikasiDiterima})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('REJECT')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'REJECT'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ❌ Ditolak ({categoryCounts.verifikasiDitolak})
                    </button>
                  </div>
                ) : activeCategory === 'PSKS' ? (
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0 self-start md:self-auto flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAction('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'ALL' ? 'bg-[#043e2e] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Semua Aksi ({categoryCounts.psks})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('CREATE')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'CREATE' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Tambah ({categoryCounts.psksTambah})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('UPDATE')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'UPDATE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Ubah ({categoryCounts.psksUbah})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('DELETE')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'DELETE' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Hapus ({categoryCounts.psksHapus})
                    </button>
                  </div>
                ) : activeCategory === 'ADMIN_ACCOUNT' ? (
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0 self-start md:self-auto flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAction('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'ALL' ? 'bg-[#043e2e] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Semua ({categoryCounts.admin})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('CREATE')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'CREATE' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Tambah Akun ({categoryCounts.adminTambah})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('UPDATE')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'UPDATE' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Ubah Akun ({categoryCounts.adminUbah})
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0 self-start md:self-auto flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAction('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'ALL' ? 'bg-[#043e2e] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Semua Log Sistem ({categoryCounts.system})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('CLEAR')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedAction === 'CLEAR' ? 'bg-orange-700 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Pembersihan Log ({categoryCounts.systemClear})
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Select Filters for Region and Pillar */}
              {(activeCategory === 'VERIFIKASI' || activeCategory === 'PSKS' || activeCategory === 'ADMIN_ACCOUNT') && (
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                  {/* Wilayah Dropdown Filter */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 font-bold">Wilayah:</span>
                    <select
                      value={selectedWilayah}
                      onChange={(e) => setSelectedWilayah(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                    >
                      <option value="ALL">Semua 27 Wilayah</option>
                      {JABAR_REGIONS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pillar Dropdown Filter (For Verifikasi & PSKS) */}
                  {(activeCategory === 'VERIFIKASI' || activeCategory === 'PSKS') && (
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 font-bold">Pilar PSKS:</span>
                      <select
                        value={selectedPillar}
                        onChange={(e) => setSelectedPillar(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                      >
                        <option value="ALL">Semua 10 Pilar</option>
                        {OFFICIAL_PILLARS.map((p) => (
                          <option key={p.id} value={p.title}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reset Filters button */}
                  {(selectedAction !== 'ALL' || selectedWilayah !== 'ALL' || selectedPillar !== 'ALL' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAction('ALL');
                        setSelectedWilayah('ALL');
                        setSelectedPillar('ALL');
                        setSearchQuery('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-black cursor-pointer underline ml-auto"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TABEL LOG AKTIVITAS */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md overflow-hidden">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center border-2 border-slate-200">
                    <History className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800">
                      Tidak Ada Data Riwayat Ditemukan
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {searchQuery || selectedAction !== 'ALL' || selectedWilayah !== 'ALL' || selectedPillar !== 'ALL'
                        ? 'Tidak ada log aktivitas yang cocok dengan filter atau pencarian Anda.'
                        : `Belum ada catatan log audit untuk kategori ${getCategoryTitle(activeCategory)}.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToCategories}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke 4 Kategori Riwayat</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#043e2e] text-white border-b-2 border-[#d4af37]">
                      <tr>
                        <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap">No</th>
                        <th className="py-3.5 px-3 font-bold whitespace-nowrap">Waktu Aktivitas</th>
                        <th className="py-3.5 px-3 font-bold whitespace-nowrap">Petugas / Otoritas</th>
                        <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Jenis Aksi / Status</th>
                        <th className="py-3.5 px-3 font-bold whitespace-nowrap">Sasaran Data</th>
                        <th className="py-3.5 px-4 font-bold">Rincian Lengkap</th>
                        <th className="py-3.5 px-3 font-bold text-center w-16 whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredLogs.map((log, index) => {
                        const badge = getActionBadge(log);
                        const BadgeIcon = badge.icon;
                        const relTime = formatRelativeTime(log.createdAt || Date.now());

                        return (
                          <tr key={log.id || `log-${index}`} className="hover:bg-amber-50/40 transition-colors">
                            <td className="py-3.5 px-3 font-bold text-center text-slate-500">
                              {index + 1}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{log.timestamp || 'Baru Saja'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{relTime}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <div className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{log.actorName || 'Petugas'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                <span className="uppercase text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-mono font-bold">
                                  {log.actorRole}
                                </span>
                                <span>• {log.actorWilayah || 'Jawa Barat'}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${badge.bg}`}>
                                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                                <BadgeIcon className="w-3.5 h-3.5" />
                                <span>{badge.label}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900">
                                {log.targetName || log.targetPillar || '-'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {log.targetPillar && log.targetPillar !== log.targetName ? log.targetPillar : ''}
                                {log.targetWilayah ? ` (${log.targetWilayah})` : ''}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-xs font-medium text-slate-700 leading-relaxed max-w-md">
                              {log.details || '-'}
                            </td>

                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleLog(log.id)}
                                title="Hapus baris riwayat ini"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. BOTTOM NAVIGATION BAR */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          {viewLevel === 'CATEGORY_MENU' ? (
            <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-activity-log" />
          ) : (
            <button
              type="button"
              id="btn-back-bottom-to-category-menu"
              onClick={handleBackToCategories}
              className="px-5 py-3 bg-gradient-to-r from-[#043e2e] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 font-black text-xs sm:text-sm rounded-2xl shadow-md border border-[#d4af37]/60 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>Kembali ke 4 Kategori Riwayat</span>
            </button>
          )}

          <div className="text-xs text-slate-500 font-semibold">
            <span>Dinas Sosial Provinsi Jawa Barat • Audit Trail Terverifikasi</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS RIWAYAT KHUSUS 1 KATEGORI */}
      {/* ========================================================================= */}
      {showClearCategoryConfirmModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-600 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center border-2 border-rose-300">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Hapus Riwayat Kategori {getCategoryTitle(categoryToDelete)}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini <strong>HANYA akan menghapus log audit pada modul {getCategoryTitle(categoryToDelete)}</strong> secara permanen dari database.
              </p>
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-left text-[11px] text-emerald-950 font-semibold space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-black">
                  <Shield className="w-3.5 h-3.5" />
                  <span>3 Kategori Lainnya 100% Aman</span>
                </div>
                <p className="text-slate-600 font-normal">
                  Log pada 3 kategori lainnya tidak akan terhapus dan tetap tersimpan utuh di sistem.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearCategoryConfirmModal(false);
                  setCategoryToDelete(null);
                }}
                disabled={isClearingCategory}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCategory}
                disabled={isClearingCategory}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearingCategory ? 'Menghapus...' : 'Ya, Hapus Kategori Ini'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS SELURUH RIWAYAT AKTIVITAS */}
      {/* ========================================================================= */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-600 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center border-2 border-rose-300">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Peringatan: Hapus Semua 4 Kategori Riwayat?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan <strong>menghapus seluruh log audit riwayat aktivitas ({logs.length} data)</strong> dari keempat kategori secara instan dan permanen dari database Cloud Firestore.
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-left text-[11px] text-rose-900 font-medium">
                ⚠️ Catatan: Riwayat yang sudah dihapus tidak dapat dipulihkan kembali. Pastikan Anda telah mengonfirmasi tindakan ini.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                disabled={isClearingAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllLogs}
                disabled={isClearingAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearingAll ? 'Menghapus...' : 'Ya, Hapus Semua'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SUKSES HAPUS RIWAYAT AKTIVITAS */}
      {/* ========================================================================= */}
      {showClearSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-600 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                Riwayat Aktivitas Berhasil Dihapus!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {clearedCategoryName ? (
                  <>
                    Riwayat audit untuk kategori <strong>{clearedCategoryName}</strong> ({clearedLogsCount} data) telah berhasil dihapus secara permanen. 3 kategori lainnya tetap aman dan utuh.
                  </>
                ) : (
                  <>
                    Seluruh rekam jejak audit aktivitas ({clearedLogsCount} data) telah berhasil dibersihkan secara instan dari database.
                  </>
                )}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearSuccessModal(false);
                  setClearedCategoryName('');
                }}
                className="w-full px-5 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-black text-xs cursor-pointer shadow-md transition-all"
              >
                Tutup & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
