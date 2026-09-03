import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Trash2,
  Calendar,
  User,
  ArrowLeft,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  Building2,
  Info,
} from 'lucide-react';
import { SystemLog, UserSession, PillarId } from '../types';
import { getLocalLogs, autoPurgeOldLogs, formatRelativeTime, sanitizeLogEntries } from '../lib/activityLogger';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JABAR_REGIONS, PILLARS_CONFIG } from '../data/initialData';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
}

type ActiveCategory = 'PSKS' | 'ADMIN_ACCOUNT';

// 10 Official PSKS Pillars defined in Dinsos Jawa Barat system
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
  { id: 'slrt_puskesos', title: 'SLRT / PUSKESOS', shortName: 'Sistem Layanan & Rujukan Terpadu' },
];

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('PSKS');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedWilayah, setSelectedWilayah] = useState<string>('ALL');
  const [selectedPillar, setSelectedPillar] = useState<string>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from Firestore system_logs
      let firestoreLogs: SystemLog[] = [];
      try {
        const q = query(
          collection(db, 'system_logs'),
          orderBy('createdAt', 'desc'),
          limit(200)
        );
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          firestoreLogs.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
      } catch (err) {
        console.warn('Fallback to local storage logs:', err);
      }

      const rawLogs = firestoreLogs.length > 0 ? firestoreLogs : getLocalLogs();

      // STRICT SANITIZATION: Eliminate 'Tamu Publik', 'user' role, corrupt entries, and developer logs
      const cleanLogs = sanitizeLogEntries(rawLogs);

      // Normalize category if missing in legacy records
      const normalized = cleanLogs.map((l) => {
        if (!l.category) {
          if (l.targetCollection === 'admin_accounts' || l.details?.toLowerCase().includes('akun admin')) {
            return { ...l, category: 'ADMIN_ACCOUNT' as const };
          }
          return { ...l, category: 'PSKS' as const };
        }
        return l;
      });

      // Save sanitized state back to local storage
      try {
        localStorage.setItem('psks_system_logs', JSON.stringify(normalized));
      } catch {}

      setLogs(normalized);
    } catch (e) {
      console.error('Error fetching logs:', e);
      setLogs(getLocalLogs());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      autoPurgeOldLogs().catch(() => {});
    }
  }, [isOpen]);

  // Counts for each category
  const psksLogsCount = useMemo(() => {
    return logs.filter((l) => l.category === 'PSKS' || l.targetCollection === 'psks_records').length;
  }, [logs]);

  const adminLogsCount = useMemo(() => {
    return logs.filter((l) => l.category === 'ADMIN_ACCOUNT' || l.targetCollection === 'admin_accounts').length;
  }, [logs]);

  // Filter logs for the active category
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Filter by category (PSKS vs Akun Admin)
      const isPsksCategory = log.category === 'PSKS' || log.targetCollection === 'psks_records';
      const isAdminCategory = log.category === 'ADMIN_ACCOUNT' || log.targetCollection === 'admin_accounts';

      if (activeCategory === 'PSKS' && !isPsksCategory) return false;
      if (activeCategory === 'ADMIN_ACCOUNT' && !isAdminCategory) return false;

      // 2. Filter by search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const actor = (log.actorName || '').toLowerCase();
        const wil = (log.actorWilayah || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const targetName = (log.targetName || '').toLowerCase();
        const targetPillar = (log.targetPillar || '').toLowerCase();
        const targetId = (log.targetId || '').toLowerCase();

        const matches =
          actor.includes(q) ||
          wil.includes(q) ||
          details.includes(q) ||
          targetName.includes(q) ||
          targetPillar.includes(q) ||
          targetId.includes(q);

        if (!matches) return false;
      }

      // 3. Filter by Action type
      if (selectedAction !== 'ALL') {
        if (log.actionType !== selectedAction) return false;
      }

      // 4. Filter by Wilayah
      if (selectedWilayah !== 'ALL') {
        const wilLower = selectedWilayah.toLowerCase().trim();
        const logWil = (log.actorWilayah || log.targetWilayah || '').toLowerCase().trim();
        if (!logWil.includes(wilLower)) return false;
      }

      // 5. Filter by Pillar (for PSKS)
      if (activeCategory === 'PSKS' && selectedPillar !== 'ALL') {
        const pilarObj = OFFICIAL_PILLARS.find((p) => p.id === selectedPillar || p.title === selectedPillar);
        const pilarIdLower = (pilarObj?.id || selectedPillar).toLowerCase();
        const pilarTitleLower = (pilarObj?.title || selectedPillar).toLowerCase();
        const pilarShortLower = (pilarObj?.shortName || '').toLowerCase();

        const logPillar = (log.targetPillar || '').toLowerCase();
        const logDetails = (log.details || '').toLowerCase();
        const logTargetId = (log.targetId || '').toLowerCase();

        const match =
          logPillar.includes(pilarIdLower) ||
          logPillar.includes(pilarTitleLower) ||
          logDetails.includes(pilarIdLower) ||
          logDetails.includes(pilarTitleLower) ||
          (pilarShortLower && logDetails.includes(pilarShortLower)) ||
          logTargetId.startsWith(pilarIdLower);

        if (!match) {
          return false;
        }
      }

      return true;
    });
  }, [logs, activeCategory, searchQuery, selectedAction, selectedWilayah, selectedPillar]);

  if (!isOpen) return null;

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
      case 'SET':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'TAMBAH DATA',
          verb: 'menambahkan',
        };
      case 'UPDATE':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          label: 'UBAH DATA',
          verb: 'mengubah',
        };
      case 'DELETE':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          label: 'HAPUS DATA',
          verb: 'menghapus',
        };
      default:
        return {
          bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          dot: 'bg-slate-400',
          label: actionType,
          verb: 'memodifikasi',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden text-slate-100 animate-fadeIn">
      {/* 1. TOP HEADER BAR (FULL SCREEN CONTROL - FULLY RESPONSIVE) */}
      <header className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 border-b-2 border-[#d4af37]/80 px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between shrink-0 shadow-xl z-20 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-400/40 transition-all font-bold text-xs sm:text-sm cursor-pointer shadow-md active:scale-95 group shrink-0"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="h-6 w-px bg-slate-700/80 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#043e2e] to-slate-900 text-amber-300 border border-[#d4af37] flex items-center justify-center shadow-lg shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-xs sm:text-base md:text-lg font-black text-white tracking-wide truncate">
                  RIWAYAT AKTIVITAS & AUDIT TRAIL
                </h1>
                <span className="bg-amber-400 text-slate-950 text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider hidden md:inline-block shadow-sm">
                  FULL SCREEN CONSOLE
                </span>
              </div>
              <p className="text-[9px] sm:text-xs text-emerald-200/90 font-medium truncate hidden xs:block">
                Pencatatan mutasi realtime 10 Pilar PSKS dan perubahan Akun Admin Wilayah
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 hover:text-amber-200 border border-[#d4af37]/50 font-bold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
            title="Segarkan Log Real-Time"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-600/50 transition-all cursor-pointer shadow-md active:scale-95"
            title="Tutup Halaman Penuh"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* 2. CATEGORY TABS BAR (2 KATEGORI: DATA PSKS & AKUN ADMIN) */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 md:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto">
          {/* TAB 1: RIWAYAT DATA PSKS */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('PSKS');
              setSelectedPillar('ALL');
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeCategory === 'PSKS'
                ? 'bg-gradient-to-r from-[#043e2e] to-[#085a43] text-amber-300 border border-[#d4af37] shadow-lg scale-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span className="truncate">Data PSKS</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
                activeCategory === 'PSKS'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {psksLogsCount}
            </span>
          </button>

          {/* TAB 2: RIWAYAT AKUN ADMIN */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('ADMIN_ACCOUNT');
              setSelectedPillar('ALL');
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeCategory === 'ADMIN_ACCOUNT'
                ? 'bg-gradient-to-r from-[#043e2e] to-[#085a43] text-amber-300 border border-[#d4af37] shadow-lg scale-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span className="truncate">Akun Admin</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
                activeCategory === 'ADMIN_ACCOUNT'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {adminLogsCount}
            </span>
          </button>
        </div>

        {/* Category Description Banner */}
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-slate-300 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />
          <span className="leading-snug">
            {activeCategory === 'PSKS'
              ? 'Pencatatan mutasi tambah, ubah, dan hapus data anggota 10 Pilar PSKS oleh Admin Wilayah & Superadmin'
              : 'Pencatatan pembuatan akun baru, pembaruan hak akses, dan penghapusan akun admin wilayah oleh Superadmin'}
          </span>
        </div>
      </div>

      {/* 3. FILTER & SEARCH CONTROLS BAR (RESPONSIVE GRID / FLEX) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 md:px-8 py-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeCategory === 'PSKS'
                ? 'Cari nama anggota, admin pengubah, wilayah, atau pilar...'
                : 'Cari nama admin pengubah, nama akun target, wilayah...'
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-7 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/40 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-normal hidden xs:inline">Aksi:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-transparent border-0 font-extrabold text-amber-300 outline-none cursor-pointer text-xs w-full sm:w-auto"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Aksi</option>
              <option value="CREATE" className="bg-slate-900 text-emerald-400">TAMBAH (CREATE)</option>
              <option value="UPDATE" className="bg-slate-900 text-amber-400">UBAH (UPDATE)</option>
              <option value="DELETE" className="bg-slate-900 text-rose-400">HAPUS (DELETE)</option>
            </select>
          </div>

          {/* Wilayah Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-normal hidden xs:inline">Wilayah:</span>
            <select
              value={selectedWilayah}
              onChange={(e) => setSelectedWilayah(e.target.value)}
              className="bg-transparent border-0 font-extrabold text-emerald-300 outline-none cursor-pointer text-xs w-full sm:w-auto max-w-[140px] truncate"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Wilayah</option>
              {JABAR_REGIONS.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Pillar Filter (10 Official PSKS Pillars) */}
          {activeCategory === 'PSKS' && (
            <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-300">
              <FolderKanban className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="text-slate-400 font-normal hidden xs:inline">Pilar:</span>
              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value)}
                className="bg-transparent border-0 font-extrabold text-[#d4af37] outline-none cursor-pointer text-xs w-full sm:w-auto max-w-[180px] truncate"
              >
                <option value="ALL" className="bg-slate-900 text-white">Semua 10 Pilar PSKS</option>
                {OFFICIAL_PILLARS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. MAIN AUDIT LOGS DISPLAY LIST (FULL SCREEN SCROLLABLE VIEW) */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-950 space-y-3.5">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-center">
            <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
            <p className="text-sm font-bold text-slate-300">Mengambil seluruh catatan log aktivitas real-time...</p>
            <span className="text-xs text-slate-500">Memeriksa sinkronisasi data valid Firestore</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800/80 text-amber-400 flex items-center justify-center mb-3 border border-amber-400/20">
              <History className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-sm sm:text-lg font-bold text-white mb-1">
              Tidak Ada Catatan Riwayat Aktivitas
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedAction !== 'ALL' || selectedWilayah !== 'ALL' || selectedPillar !== 'ALL'
                ? 'Tidak ditemukan riwayat yang cocok dengan kata kunci pencarian atau filter yang dipilih.'
                : activeCategory === 'PSKS'
                ? 'Belum ada mutasi penambahan, pembaruan, atau penghapusan data anggota 10 Pilar PSKS oleh Admin.'
                : 'Belum ada catatan pembuatan, pengubahan, atau penghapusan akun admin wilayah oleh Superadmin.'}
            </p>
            {(searchQuery || selectedAction !== 'ALL' || selectedWilayah !== 'ALL' || selectedPillar !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedAction('ALL');
                  setSelectedWilayah('ALL');
                  setSelectedPillar('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-bold text-xs border border-[#d4af37]/40 cursor-pointer transition-all"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log, index) => {
              const actionMeta = getActionBadge(log.actionType);
              const isSuperadmin = log.actorRole === 'superadmin';

              return (
                <div
                  key={log.id || `log-${index}`}
                  className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/90 rounded-2xl border border-slate-800 hover:border-[#d4af37]/70 p-3.5 sm:p-5 shadow-lg transition-all hover:shadow-2xl group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    {/* LEFT SECTION: ACTION, ACTOR & NARRATIVE */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Action Type Badge Tag */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div
                          className={`px-2 sm:px-3 py-1 rounded-xl border text-[9px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm whitespace-nowrap ${actionMeta.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${actionMeta.dot} animate-pulse`} />
                          <span>{actionMeta.label}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          #{filteredLogs.length - index}
                        </span>
                      </div>

                      {/* Main Log Narrative */}
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* 1. Who Modified (Siapa yang mengubah) */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">Pengubah:</span>
                          <span className="inline-flex items-center gap-1 bg-[#043e2e] text-amber-300 border border-[#d4af37]/40 px-2 sm:px-2.5 py-0.5 rounded-lg text-xs font-extrabold shadow-xs max-w-full truncate">
                            <User className="w-3 h-3 text-amber-300 shrink-0" />
                            <span className="truncate">{log.actorName || 'Admin'}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0">
                            <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span>{log.actorWilayah || 'Jawa Barat'}</span>
                          </span>

                          <span
                            className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                              isSuperadmin
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                : 'bg-blue-400/20 text-blue-300 border-blue-400/40'
                            }`}
                          >
                            {isSuperadmin ? 'Superadmin Pusat' : 'Admin Wilayah'}
                          </span>
                        </div>

                        {/* 2. What was Modified (Apa yang telah dirubah) */}
                        <div className="bg-slate-950/90 p-2.5 sm:p-3 rounded-xl border border-slate-800 text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed shadow-inner break-words whitespace-normal">
                          {log.details}
                        </div>

                        {/* 3. Metadata Tags (Pilar, Target, ID) */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 text-[10px] sm:text-[11px]">
                          {log.targetPillar && (
                            <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-md font-extrabold text-[9px] sm:text-[10px] max-w-full truncate">
                              <FolderKanban className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">Pilar {log.targetPillar}</span>
                            </span>
                          )}

                          {log.targetName && (
                            <span className="inline-flex items-center gap-1 bg-slate-800 text-amber-200 border border-slate-700 px-2 py-0.5 rounded-md font-bold text-[9px] sm:text-[10px] max-w-full truncate">
                              <span className="truncate">Objek: {log.targetName}</span>
                            </span>
                          )}

                          {log.targetId && (
                            <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                              ID: {log.targetId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SECTION: EXACT TIME (Waktu Tepat Dirubahnya) */}
                    <div className="md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80 flex md:flex-col items-center md:items-end justify-between gap-1.5 pl-0 md:pl-3">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 rounded-xl shrink-0">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                        <span>{formatRelativeTime(log.createdAt || 0)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-400 shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. FULL SCREEN FOOTER TELEMETRY & AUTO PURGE STATS */}
      <footer className="bg-slate-950 border-t border-slate-800 px-3 sm:px-6 md:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          <span>
            Menampilkan <strong className="text-white">{filteredLogs.length}</strong> catatan dari total{' '}
            <strong className="text-amber-300">{logs.length}</strong> log audit aktivitas
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400" />
            Batch-Write Mode Hemat
          </span>
          <span className="inline-flex items-center gap-1">
            <History className="w-3 h-3 text-amber-400" />
            Auto-Purge 30 Hari Aktif
          </span>
        </div>
      </footer>
    </div>
  );
};
