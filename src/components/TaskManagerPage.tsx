import React, { useState, useMemo, useEffect } from 'react';
import {
  AdminAccount,
  PillarRegistrationSubmission,
  UserSession,
} from '../types';
import { JABAR_REGIONS, PILLARS_CONFIG } from '../data/initialData';
import { BackToHomeButton } from './BackToHomeButton';
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  Layers,
  MapPin,
  Phone,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  CheckCheck,
  SlidersHorizontal,
  Sparkles,
  Info,
  Send,
  FileText,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface TaskManagerPageProps {
  session?: UserSession;
  submissions: PillarRegistrationSubmission[];
  adminAccounts?: AdminAccount[];
  onBackToHome: () => void;
  onApproveSubmission: (submission: PillarRegistrationSubmission) => void;
  onRejectSubmission: (submissionId: string, notes?: string) => void;
  onBatchApproveSubmissions?: (submissionIds: string[]) => void;
}

type VerificationViewMode = 'REGION_GRID' | 'PILLAR_GRID' | 'SUBMISSION_TABLE';

export const ALL_REGIONS: string[] = JABAR_REGIONS;

export const normalizeWilayah = (w?: string): string => {
  if (!w) return '';
  return w
    .toLowerCase()
    .replace(/^kabupaten\s+/i, 'kab. ')
    .replace(/^kab\s+/i, 'kab. ')
    .replace(/^kota\s+/i, 'kota ')
    .replace(/^provinsi\s+/i, 'prov. ')
    .replace(/^prov\s+/i, 'prov. ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const isSameWilayah = (w1?: string, w2?: string): boolean => {
  if (!w1 || !w2) return false;
  const n1 = normalizeWilayah(w1);
  const n2 = normalizeWilayah(w2);
  if (n1 === n2) return true;

  // Handle Prov. Jabar aliases
  const isJabar1 = /^(prov\.|provinsi|jabar|jawa barat|tingkat provinsi|pusat|semua wilayah)$/i.test(n1);
  const isJabar2 = /^(prov\.|provinsi|jabar|jawa barat|tingkat provinsi|pusat|semua wilayah)$/i.test(n2);
  if (isJabar1 && isJabar2) return true;

  const clean1 = n1.replace(/^(kab\.|kota|prov\.)\s*/, '').trim();
  const clean2 = n2.replace(/^(kab\.|kota|prov\.)\s*/, '').trim();

  if (clean1 === clean2) {
    const isKota1 = n1.startsWith('kota');
    const isKota2 = n2.startsWith('kota');
    const isKab1 = n1.startsWith('kab.');
    const isKab2 = n2.startsWith('kab.');

    if (isKota1 && isKab2) return false;
    if (isKab1 && isKota2) return false;
    return true;
  }

  return false;
};

export const resolveSubmissionRegion = (sub: PillarRegistrationSubmission): string => {
  const extra = (sub.recordData || {}) as Record<string, any>;
  const candidates = [
    sub.wilayah,
    sub.recordData?.wilayah,
    extra.kab_kota,
    extra.kabupaten,
    extra.kota,
    sub.recordData?.alamat,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const rawTrimmed = raw.trim();
    if (!rawTrimmed) continue;

    // 1. Direct matching with ALL_REGIONS
    const exact = ALL_REGIONS.find((r) => isSameWilayah(r, rawTrimmed));
    if (exact) return exact;

    // 2. Normalized match
    const norm = normalizeWilayah(rawTrimmed);
    const normMatch = ALL_REGIONS.find((r) => normalizeWilayah(r) === norm);
    if (normMatch) return normMatch;

    // 3. Substring search (sorted by length desc to match 'Kab. Bandung Barat' before 'Kab. Bandung')
    const sorted = [...ALL_REGIONS].sort((a, b) => b.length - a.length);
    for (const reg of sorted) {
      const cleanReg = reg.replace(/^(kab\.|kota|prov\.)\s*/i, '').toLowerCase().trim();
      if (norm.includes(cleanReg)) {
        if (norm.startsWith('kota') && reg.startsWith('Kota')) return reg;
        if (norm.startsWith('kab.') && reg.startsWith('Kab.')) return reg;
        if (!norm.startsWith('kota') && !norm.startsWith('kab.')) return reg;
      }
    }

    if (/jabar|jawa barat|prov|pusat/i.test(norm)) {
      return 'Prov. Jabar';
    }
  }

  // Fallback to Prov. Jabar
  return 'Prov. Jabar';
};

export const resolveSubmissionPillar = (rawId?: string): string => {
  if (!rawId) return 'peksos';
  const s = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('peksos')) return 'peksos';
  if (s.includes('psm')) return 'psm';
  if (s.includes('tagana')) return 'tagana';
  if (s.includes('lks')) return 'lks';
  if (s.includes('karang') || s.includes('taruna') || s === 'kt') return 'karangtaruna';
  if (s.includes('lk3')) return 'lk3';
  if (s.includes('pensos') || s.includes('penyuluh')) return 'pensos';
  if (s.includes('tksk')) return 'tksk';
  if (s.includes('badan') || s.includes('usaha') || s.includes('kube')) return 'badanusaha';
  if (s.includes('slrt') || s.includes('puskesos')) return 'slrt_puskesos';
  return 'peksos';
};

export const normalizeStatus = (status?: string): 'PENDING' | 'APPROVED' | 'REJECTED' => {
  if (!status) return 'PENDING';
  const s = status.toUpperCase().trim();
  if (s.includes('PEND') || s.includes('MENUNGGU') || s.includes('BARU') || s.includes('BELUM')) return 'PENDING';
  if (s.includes('APP') || s.includes('ACC') || s.includes('SETUJU') || s.includes('TERIMA') || s.includes('SELESAI')) return 'APPROVED';
  if (s.includes('REJ') || s.includes('TOLAK') || s.includes('BATAL')) return 'REJECTED';
  return 'PENDING';
};

export const TaskManagerPage: React.FC<TaskManagerPageProps> = ({
  session,
  submissions,
  adminAccounts = [],
  onBackToHome,
  onApproveSubmission,
  onRejectSubmission,
  onBatchApproveSubmissions,
}) => {
  // Navigation State (3-Level Hierarchy)
  const [viewMode, setViewMode] = useState<VerificationViewMode>('REGION_GRID');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  // Filters for Level 1 (Regions)
  const [regionSearchTerm, setRegionSearchTerm] = useState<string>('');
  const [regionStatusFilter, setRegionStatusFilter] = useState<'ALL' | 'HAS_PENDING' | 'COMPLETED' | 'EMPTY'>('ALL');

  // Filters for Level 3 (Submissions Table)
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('ALL');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');

  // Modals & Selections
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [selectedDetailSub, setSelectedDetailSub] = useState<PillarRegistrationSubmission | null>(null);
  const [subToApproveDirect, setSubToApproveDirect] = useState<PillarRegistrationSubmission | null>(null);
  const [subToReject, setSubToReject] = useState<PillarRegistrationSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showGlobalApproveModal, setShowGlobalApproveModal] = useState<boolean>(false);

  // Realtime Sync Status
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const triggerSuccessBanner = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // 10 Pillars Definition
  const tenPillars = useMemo(() => {
    return [
      { id: 'peksos', label: 'Pekerja Sosial Profesional', short: 'PEKSOS', icon: '👨‍👩‍👧‍👦', color: 'from-emerald-800 to-teal-900', border: 'border-emerald-500' },
      { id: 'psm', label: 'Pekerja Sosial Masyarakat', short: 'PSM', icon: '🤝', color: 'from-amber-700 to-amber-900', border: 'border-amber-500' },
      { id: 'tagana', label: 'Taruna Siaga Bencana', short: 'TAGANA', icon: '🌋', color: 'from-rose-800 to-red-950', border: 'border-rose-500' },
      { id: 'lks', label: 'Lembaga Kesejahteraan Sosial', short: 'LKS', icon: '🏢', color: 'from-blue-800 to-indigo-950', border: 'border-blue-500' },
      { id: 'karangtaruna', label: 'Gerakan Karang Taruna', short: 'KARANG TARUNA', icon: '🦅', color: 'from-amber-600 to-yellow-800', border: 'border-yellow-500' },
      { id: 'lk3', label: 'Lembaga Konsultasi KS Keluarga', short: 'LK3', icon: '⚖️', color: 'from-purple-800 to-indigo-900', border: 'border-purple-500' },
      { id: 'pensos', label: 'Penyuluh Sosial Masyarakat', short: 'PENSOS', icon: '📢', color: 'from-pink-800 to-rose-900', border: 'border-pink-500' },
      { id: 'tksk', label: 'Tenaga KS Kecamatan', short: 'TKSK', icon: '💼', color: 'from-teal-800 to-emerald-950', border: 'border-teal-500' },
      { id: 'badanusaha', label: 'Badan Usaha / KUBE', short: 'BADAN USAHA', icon: '🏪', color: 'from-emerald-700 to-green-900', border: 'border-green-500' },
      { id: 'slrt_puskesos', label: 'SLRT / Puskesos', short: 'SLRT / PUSKESOS', icon: '🛡️', color: 'from-cyan-800 to-blue-900', border: 'border-cyan-500' },
    ];
  }, []);

  // Map of Admin Wilayah account by region
  const adminByWilayah = useMemo(() => {
    const map = new Map<string, AdminAccount>();
    adminAccounts.forEach((acc) => {
      if (acc.wilayahTugas) {
        map.set(normalizeWilayah(acc.wilayahTugas), acc);
      }
    });
    return map;
  }, [adminAccounts]);

  // Global Submissions Stats
  const globalTotal = submissions.length;
  const globalPending = submissions.filter((s) => normalizeStatus(s.status) === 'PENDING').length;
  const globalApproved = submissions.filter((s) => normalizeStatus(s.status) === 'APPROVED').length;
  const globalRejected = submissions.filter((s) => normalizeStatus(s.status) === 'REJECTED').length;

  // 28 Wilayah Jawa Barat Statistics (Prov. Jabar + 27 Kab/Kota)
  const regionStats = useMemo(() => {
    const stats: Record<string, { total: number; pending: number; approved: number; rejected: number }> = {};
    ALL_REGIONS.forEach((reg) => {
      stats[reg] = { total: 0, pending: 0, approved: 0, rejected: 0 };
    });

    submissions.forEach((sub) => {
      const reg = resolveSubmissionRegion(sub);
      if (!stats[reg]) {
        stats[reg] = { total: 0, pending: 0, approved: 0, rejected: 0 };
      }
      const st = normalizeStatus(sub.status);
      stats[reg].total += 1;
      if (st === 'PENDING') stats[reg].pending += 1;
      if (st === 'APPROVED') stats[reg].approved += 1;
      if (st === 'REJECTED') stats[reg].rejected += 1;
    });

    return stats;
  }, [submissions]);

  // Filtered Regions list
  const filteredRegions = useMemo(() => {
    return ALL_REGIONS.filter((reg) => {
      const q = regionSearchTerm.toLowerCase().trim();
      const matchSearch = !q || reg.toLowerCase().includes(q);
      const stat = regionStats[reg] || { total: 0, pending: 0, approved: 0, rejected: 0 };

      let matchStatus = true;
      if (regionStatusFilter === 'HAS_PENDING') {
        matchStatus = stat.pending > 0;
      } else if (regionStatusFilter === 'COMPLETED') {
        matchStatus = stat.pending === 0 && stat.total > 0;
      } else if (regionStatusFilter === 'EMPTY') {
        matchStatus = stat.total === 0;
      }

      return matchSearch && matchStatus;
    });
  }, [regionSearchTerm, regionStatusFilter, regionStats]);

  // Pillar statistics for selected region
  const selectedRegionPillarStats = useMemo(() => {
    if (!selectedRegion) return {};
    const stats: Record<string, { total: number; pending: number; approved: number; rejected: number }> = {};
    tenPillars.forEach((p) => {
      stats[p.id] = { total: 0, pending: 0, approved: 0, rejected: 0 };
    });

    submissions.forEach((sub) => {
      const subReg = resolveSubmissionRegion(sub);
      if (isSameWilayah(subReg, selectedRegion)) {
        const pillarKey = resolveSubmissionPillar(sub.pillarId || sub.recordData?.pillarId);
        if (!stats[pillarKey]) {
          stats[pillarKey] = { total: 0, pending: 0, approved: 0, rejected: 0 };
        }
        const st = normalizeStatus(sub.status);
        stats[pillarKey].total += 1;
        if (st === 'PENDING') stats[pillarKey].pending += 1;
        if (st === 'APPROVED') stats[pillarKey].approved += 1;
        if (st === 'REJECTED') stats[pillarKey].rejected += 1;
      }
    });

    return stats;
  }, [selectedRegion, tenPillars, submissions]);

  // Submissions list for Level 3
  const level3Submissions = useMemo(() => {
    if (!selectedRegion || !selectedPillar) return [];
    return submissions.filter((sub) => {
      const subReg = resolveSubmissionRegion(sub);
      const matchRegion = isSameWilayah(subReg, selectedRegion);
      const subPillar = resolveSubmissionPillar(sub.pillarId || sub.recordData?.pillarId);
      const matchPillar = subPillar === selectedPillar.toLowerCase().trim();

      const st = normalizeStatus(sub.status);
      const matchStatus = tableStatusFilter === 'ALL' || st === tableStatusFilter;
      const q = tableSearchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (sub.nama || '').toLowerCase().includes(q) ||
        (sub.nik || '').toLowerCase().includes(q) ||
        (sub.kec || '').toLowerCase().includes(q) ||
        (sub.hp || '').toLowerCase().includes(q) ||
        (sub.submittedByName || '').toLowerCase().includes(q) ||
        (sub.submittedByUsername || '').toLowerCase().includes(q);

      return matchRegion && matchPillar && matchStatus && matchSearch;
    });
  }, [selectedRegion, selectedPillar, submissions, tableStatusFilter, tableSearchTerm]);

  // Manual Sync trigger
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      triggerSuccessBanner('Data Verifikasi Pendaftaran telah tersinkronisasi realtime.');
    }, 600);
  };

  // Scroll to top whenever entering a deeper or higher level in the hierarchy
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (typeof document !== 'undefined') {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [viewMode, selectedRegion, selectedPillar]);

  // Hierarchy Navigation
  const handleSelectRegion = (regionName: string) => {
    setSelectedRegion(regionName);
    setSelectedPillar(null);
    setViewMode('PILLAR_GRID');
    setSelectedSubmissionIds([]);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleSelectPillar = (pillarId: string) => {
    setSelectedPillar(pillarId);
    setViewMode('SUBMISSION_TABLE');
    setTableStatusFilter('ALL');
    setTableSearchTerm('');
    setSelectedSubmissionIds([]);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleBackToRegions = () => {
    setViewMode('REGION_GRID');
    setSelectedRegion(null);
    setSelectedPillar(null);
    setSelectedSubmissionIds([]);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleBackToPillars = () => {
    setViewMode('PILLAR_GRID');
    setSelectedPillar(null);
    setSelectedSubmissionIds([]);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Approve / Reject actions
  const executeApproveDirect = (sub: PillarRegistrationSubmission) => {
    onApproveSubmission(sub);
    setSubToApproveDirect(null);
    setSelectedDetailSub(null);
    triggerSuccessBanner(`Pendaftaran ${sub.nama} di ${sub.wilayah} BERHASIL DISETUJUI (Acc)!`);
  };

  const executeRejectDirect = () => {
    if (!subToReject) return;
    onRejectSubmission(subToReject.id, rejectReason || 'Berkas tidak memenuhi syarat.');
    setSubToReject(null);
    setRejectReason('');
    setSelectedDetailSub(null);
    triggerSuccessBanner(`Pendaftaran ${subToReject.nama} telah DITOLAK.`);
  };

  const handleExecuteBatchApprove = () => {
    if (onBatchApproveSubmissions && selectedSubmissionIds.length > 0) {
      onBatchApproveSubmissions(selectedSubmissionIds);
      triggerSuccessBanner(`${selectedSubmissionIds.length} pengajuan pendaftaran berhasil disetujui sekaligus!`);
      setSelectedSubmissionIds([]);
      setShowBatchModal(false);
    }
  };

  const handleApproveAllPendingInRegion = () => {
    if (!selectedRegion || !onBatchApproveSubmissions) return;
    const pendingInRegion = submissions
      .filter((s) => isSameWilayah(resolveSubmissionRegion(s), selectedRegion) && normalizeStatus(s.status) === 'PENDING')
      .map((s) => s.id);

    if (pendingInRegion.length === 0) {
      alert(`Tidak ada ajuan berstatus pending di wilayah ${selectedRegion}.`);
      return;
    }

    if (window.confirm(`Yakin ingin menyetujui semua (${pendingInRegion.length}) ajuan pending di ${selectedRegion}?`)) {
      onBatchApproveSubmissions(pendingInRegion);
      triggerSuccessBanner(`${pendingInRegion.length} ajuan pending di ${selectedRegion} telah disetujui!`);
    }
  };

  const handleApproveAllGlobalPending = () => {
    if (!onBatchApproveSubmissions) return;
    const allPendingIds = submissions
      .filter((s) => normalizeStatus(s.status) === 'PENDING')
      .map((s) => s.id);

    if (allPendingIds.length === 0) {
      alert('Tidak ada ajuan berstatus pending se-Jawa Barat saat ini.');
      return;
    }

    onBatchApproveSubmissions(allPendingIds);
    setShowGlobalApproveModal(false);
    triggerSuccessBanner(`Seluruh (${allPendingIds.length}) ajuan pending se-Jawa Barat telah resmi disetujui!`);
  };

  const activePillarInfo = tenPillars.find((p) => p.id === selectedPillar);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-6">

        {/* Action Success Toast */}
        {actionSuccessMsg && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#043e2e] text-amber-300 px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#d4af37] flex items-center gap-3 animate-slideIn text-xs sm:text-sm font-black">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Top Control Bar: Back Button & Realtime Sync Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'REGION_GRID' ? (
              <BackToHomeButton onClick={onBackToHome} label="Kembali ke Beranda" id="btn-back-top-task-manager" />
            ) : viewMode === 'PILLAR_GRID' ? (
              <BackToHomeButton onClick={handleBackToRegions} label="Kembali ke Halaman Sebelumnya" id="btn-back-to-previous-regions" />
            ) : (
              <BackToHomeButton onClick={handleBackToPillars} label="Kembali ke Halaman Sebelumnya" id="btn-back-to-previous-pillars" />
            )}
            <div className="inline-flex items-center gap-2 bg-[#043e2e] text-amber-300 px-3.5 py-2 rounded-xl text-xs font-black shadow-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>
                {viewMode === 'REGION_GRID'
                  ? 'Verifikasi Pendaftaran 10 Pilar PSKS'
                  : viewMode === 'PILLAR_GRID'
                  ? `Verifikasi Wilayah: ${selectedRegion}`
                  : `Verifikasi: Pilar ${activePillarInfo?.short} (${selectedRegion})`}
              </span>
            </div>
          </div>

          {/* Sync Button & Last Updated Time */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              title="Perbarui Sinkronisasi Realtime"
              className="bg-slate-50 hover:bg-emerald-50 border border-slate-300/80 px-3.5 py-2 rounded-xl text-xs font-bold text-[#043e2e] flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sinkronisasi Realtime:</span>
              <span className="font-mono text-[11px] text-slate-600 font-bold">{lastSyncTime}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PUSAT VERIFIKASI PENDAFTARAN 10 PILAR PSKS (3-LEVEL DRILLDOWN) */}
        {/* ========================================================================= */}
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumb Navigation for 3 Levels */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <nav aria-label="Navigasi Verifikasi" className="text-xs font-bold text-slate-700 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBackToRegions}
                className={`flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'REGION_GRID' ? 'text-[#043e2e] font-black' : 'text-slate-500 hover:text-emerald-800 underline decoration-dotted'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>27 Kabupaten/Kota</span>
              </button>

              {selectedRegion && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <button
                    type="button"
                    onClick={viewMode === 'SUBMISSION_TABLE' ? handleBackToPillars : undefined}
                    className={`flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'PILLAR_GRID' ? 'text-[#043e2e] font-black' : 'text-slate-500 hover:text-emerald-800 underline decoration-dotted'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{selectedRegion}</span>
                  </button>
                </>
              )}

              {selectedPillar && activePillarInfo && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-emerald-900 font-black flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span>{activePillarInfo.icon}</span>
                    <span>Pilar {activePillarInfo.short}</span>
                  </span>
                </>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {viewMode === 'PILLAR_GRID' && (
                <button
                  type="button"
                  onClick={handleBackToRegions}
                  className="text-xs font-bold text-[#043e2e] hover:text-[#065f46] px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Sebelumnya</span>
                </button>
              )}

              {viewMode === 'SUBMISSION_TABLE' && (
                <button
                  type="button"
                  onClick={handleBackToPillars}
                  className="text-xs font-bold text-[#043e2e] hover:text-[#065f46] px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Sebelumnya</span>
                </button>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* LEVEL 1: GRID 27 KABUPATEN / KOTA SE-JAWA BARAT */}
          {/* ===================================================================== */}
          {viewMode === 'REGION_GRID' && (
            <div className="space-y-6">
              {/* Header Hero Banner with Realtime Stats */}
              <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#022319] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 bg-emerald-950/90 border border-emerald-400/50 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>PUSAT VERIFIKASI PENDAFTARAN 10 PILAR PSKS JAWA BARAT</span>
                    </div>

                    {globalPending > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowGlobalApproveModal(true)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 hover:shadow-lg"
                      >
                        <CheckCheck className="w-4 h-4 text-slate-950" />
                        <span>Setujui Semua ({globalPending}) Pending Se-Jabar</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight">
                      Verifikasi & Validasi Pendaftaran 10 Pilar PSKS Se-Jawa Barat
                    </h1>
                    <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-3xl leading-relaxed mt-1">
                      Pilih Kabupaten/Kota atau Wilayah Tingkat Provinsi di bawah ini untuk memeriksa, meninjau berkas, dan menyetujui ajuan pendaftaran 10 Pilar PSKS secara real-time. Setiap persetujuan otomatis terintegrasi ke database rekapitulasi aktif wilayah.
                    </p>
                  </div>

                  {/* 4 Primary Global Metrics: Total, Acc, Pending, Ditolak */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3 border-t border-emerald-800/60">
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 border border-white/10">
                      <div className="flex items-center justify-between text-xs text-emerald-200 font-bold mb-1">
                        <span>Total Pendaftaran</span>
                        <Layers className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{globalTotal}</div>
                      <div className="text-[10px] text-emerald-300/80 font-medium mt-1">Seluruh Ajuan Masuk Se-Jabar</div>
                    </div>

                    <div className="bg-emerald-500/20 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 border border-emerald-400/40">
                      <div className="flex items-center justify-between text-xs text-emerald-200 font-bold mb-1">
                        <span>✅ Telah Disetujui (Acc)</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-300">{globalApproved}</div>
                      <div className="text-[10px] text-emerald-200/80 font-medium mt-1">Tercatat di data rekapitulasi aktif</div>
                    </div>

                    <div className="bg-amber-500/20 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 border border-amber-400/40 relative overflow-hidden">
                      {globalPending > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border border-white shadow-xs"></span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-amber-200 font-bold mb-1">
                        <span>⏳ Menunggu Verifikasi (Pending)</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-300">{globalPending}</div>
                      <div className="text-[10px] text-amber-200/80 font-medium mt-1">Perlu tinjauan dan pengesahan</div>
                    </div>

                    <div className="bg-rose-500/20 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 border border-rose-400/40 relative overflow-hidden">
                      <div className="flex items-center justify-between text-xs text-rose-200 font-bold mb-1">
                        <span>❌ Ditolak</span>
                        <XCircle className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-rose-300">{globalRejected}</div>
                      <div className="text-[10px] text-rose-200/80 font-medium mt-1">Berkas pendaftaran ditolak</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regionSearchTerm}
                    onChange={(e) => setRegionSearchTerm(e.target.value)}
                    placeholder="Cari nama Kabupaten atau Kota..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e] focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'ALL' ? 'bg-[#043e2e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({ALL_REGIONS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('HAS_PENDING')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'HAS_PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ada Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('COMPLETED')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'COMPLETED' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Selesai
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('EMPTY')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'EMPTY' ? 'bg-slate-300 text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kosong
                  </button>
                </div>
              </div>

              {/* 27 Kabupaten/Kota Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRegions.map((reg) => {
                  const stat = regionStats[reg] || { total: 0, pending: 0, approved: 0, rejected: 0 };
                  const adminAcc = adminByWilayah.get(normalizeWilayah(reg));
                  const hasPending = stat.pending > 0;

                  return (
                    <div
                      key={reg}
                      onClick={() => handleSelectRegion(reg)}
                      className={`group bg-white rounded-2xl p-5 border-2 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        hasPending
                          ? 'border-amber-400 hover:border-amber-500 hover:-translate-y-1'
                          : stat.total > 0
                          ? 'border-emerald-200 hover:border-emerald-400 hover:-translate-y-1'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top status indicator bar */}
                      <div
                        className={`h-1.5 w-full absolute top-0 left-0 ${
                          hasPending ? 'bg-amber-400' : stat.total > 0 ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                      />

                      {/* Monitor Sensor Lampu Bulat Kuning di Pojok Kanan Atas Kolom */}
                      {hasPending && (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10" title={`Sensor Monitor: ${stat.pending} berkas pending`}>
                          <span className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-white shadow-md"></span>
                          </span>
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            {stat.pending} Pending
                          </span>
                        </div>
                      )}

                      <div>
                        {/* Card Header: Title & Info */}
                        <div className="flex items-start justify-between gap-2 mb-2 pr-20">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#043e2e] flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0">
                              <MapPin className="w-4 h-4 text-emerald-800" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-[#043e2e] transition-colors leading-tight">
                              {reg}
                            </h3>
                          </div>
                        </div>

                        {/* Admin Wilayah Info */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Admin: {adminAcc ? (adminAcc.namaAdmin || adminAcc.username) : 'Belum ditugaskan'}</span>
                        </div>
                      </div>

                      {/* Stats Pills: Total, Acc, Pending, Ditolak & Click CTA */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold flex-wrap">
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Total: <strong className="text-slate-900">{stat.total}</strong>
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Acc: <strong className="text-emerald-900">{stat.approved}</strong>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              hasPending
                                ? 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300'
                                : 'text-slate-500 bg-slate-100'
                            }`}
                          >
                            Pending: <strong className={hasPending ? 'text-amber-950 font-black' : 'text-slate-700'}>{stat.pending}</strong>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              stat.rejected > 0
                                ? 'bg-rose-100 text-rose-900 font-extrabold border border-rose-300'
                                : 'text-slate-500 bg-slate-100'
                            }`}
                          >
                            Ditolak: <strong className={stat.rejected > 0 ? 'text-rose-950 font-black' : 'text-slate-700'}>{stat.rejected}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-black text-[#043e2e] group-hover:translate-x-1 transition-transform shrink-0">
                          <span>Buka 10 Pilar</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* LEVEL 2: GRID 10 PILAR PSKS DI WILAYAH TERPILIH */}
          {/* ===================================================================== */}
          {viewMode === 'PILLAR_GRID' && selectedRegion && (
            <div className="space-y-6">
              {/* Region Info Banner */}
              <div className="bg-gradient-to-r from-[#043e2e] to-[#075e46] rounded-3xl p-6 sm:p-7 text-white border-2 border-[#d4af37] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>WILAYAH TUGAS KABUPATEN / KOTA</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">{selectedRegion}</h2>
                  <p className="text-xs sm:text-sm text-emerald-100">
                    Pilih pilar di bawah ini untuk melihat daftar berkas pengajuan dan melakukan verifikasi persetujuan (Acc) atau penolakan.
                  </p>

                  {/* Regional Realtime Stats Breakdown */}
                  {(() => {
                    const rStat = regionStats[selectedRegion] || { total: 0, pending: 0, approved: 0, rejected: 0 };
                    return (
                      <div className="flex items-center gap-2 pt-2 flex-wrap text-xs font-bold">
                        <span className="bg-white/15 px-2.5 py-1 rounded-lg border border-white/20">
                          Total: <strong className="text-white font-black">{rStat.total}</strong>
                        </span>
                        <span className="bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-400/40 text-emerald-200">
                          Acc: <strong className="text-emerald-300 font-black">{rStat.approved}</strong>
                        </span>
                        <span className="bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-400/40 text-amber-200">
                          Pending: <strong className="text-amber-300 font-black">{rStat.pending}</strong>
                        </span>
                        <span className="bg-rose-500/25 px-2.5 py-1 rounded-lg border border-rose-400/40 text-rose-200">
                          Ditolak: <strong className="text-rose-300 font-black">{rStat.rejected}</strong>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Region Quick Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleApproveAllPendingInRegion}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Setujui Semua Pending di {selectedRegion}</span>
                  </button>
                </div>
              </div>

              {/* 10 Pillars Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {tenPillars.map((pilar) => {
                  const stat = selectedRegionPillarStats[pilar.id] || { total: 0, pending: 0, approved: 0, rejected: 0 };
                  const hasPending = stat.pending > 0;

                  return (
                    <div
                      key={pilar.id}
                      onClick={() => handleSelectPillar(pilar.id)}
                      className={`group bg-white rounded-2xl p-4 border-2 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        hasPending
                          ? 'border-amber-400 hover:border-amber-500 hover:-translate-y-1'
                          : stat.total > 0
                          ? 'border-emerald-200 hover:border-emerald-400 hover:-translate-y-1'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Monitor Sensor Lampu Bulat Kuning di Pojok Kanan Atas Kolom Pilar */}
                      {hasPending && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 z-10" title={`Sensor Monitor: ${stat.pending} berkas pending`}>
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border border-white shadow-xs"></span>
                          </span>
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                            {stat.pending}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-1.5 pr-14">
                          <span className="text-2xl p-2 bg-slate-100 rounded-xl">{pilar.icon}</span>
                        </div>

                        <div>
                          <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wide">
                            PILAR {pilar.short}
                          </div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-[#043e2e] leading-snug line-clamp-2">
                            {pilar.label}
                          </h4>
                        </div>
                      </div>

                      {/* Pillar Metrics: Total, Acc, Pending, Ditolak */}
                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px]">
                        <div className="flex items-center gap-1 font-bold flex-wrap">
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            Total: <strong className="text-slate-900">{stat.total}</strong>
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            Acc: <strong className="text-emerald-900">{stat.approved}</strong>
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              hasPending
                                ? 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300'
                                : 'text-slate-400 bg-slate-100'
                            }`}
                          >
                            Pending: <strong className={hasPending ? 'text-amber-950 font-black' : 'text-slate-600'}>{stat.pending}</strong>
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              stat.rejected > 0
                                ? 'bg-rose-100 text-rose-900 font-extrabold border border-rose-300'
                                : 'text-slate-400 bg-slate-100'
                            }`}
                          >
                            Ditolak: <strong className={stat.rejected > 0 ? 'text-rose-950 font-black' : 'text-slate-600'}>{stat.rejected}</strong>
                          </span>
                        </div>
                        <span className="text-[#043e2e] font-black flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* LEVEL 3: TABEL INTERAKTIF PENDAFTARAN PILAR TERPILIH DI WILAYAH TERPILIH */}
          {/* ===================================================================== */}
          {viewMode === 'SUBMISSION_TABLE' && selectedRegion && selectedPillar && activePillarInfo && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    {activePillarInfo.icon}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <span>{selectedRegion}</span>
                      <span>•</span>
                      <span className="text-emerald-800 font-black">Pilar {activePillarInfo.short}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      Daftar Pengajuan: {activePillarInfo.label}
                    </h2>
                    {/* Live Pillar Stats Pill */}
                    {(() => {
                      const pStat = selectedRegionPillarStats[selectedPillar] || { total: 0, pending: 0, approved: 0, rejected: 0 };
                      return (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[11px] font-bold">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            Total: <strong className="text-slate-900">{pStat.total}</strong>
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            Acc: <strong className="text-emerald-950">{pStat.approved}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded border ${
                            pStat.pending > 0
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            Pending: <strong className={pStat.pending > 0 ? 'text-amber-950' : 'text-slate-700'}>{pStat.pending}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded border ${
                            pStat.rejected > 0
                              ? 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            Ditolak: <strong className={pStat.rejected > 0 ? 'text-rose-950' : 'text-slate-700'}>{pStat.rejected}</strong>
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Batch Action Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedSubmissionIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBatchModal(true)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Setujui {selectedSubmissionIds.length} Terpilih (Batch)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table Search & Status Filter */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearchTerm}
                    onChange={(e) => setTableSearchTerm(e.target.value)}
                    placeholder="Cari berdasarkan Nama, NIK, No. HP, atau Kecamatan..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e] focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'ALL' ? 'bg-[#043e2e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('APPROVED')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'APPROVED' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Disetujui (Acc)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('REJECTED')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ditolak
                  </button>
                </div>
              </div>

              {/* Submissions Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {level3Submissions.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="text-base font-black text-slate-700">Tidak Ada Data Pendaftaran</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Belum ada ajuan pendaftaran untuk pilar ini di {selectedRegion} yang sesuai dengan kriteria filter.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] border-b border-slate-200 tracking-wider">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                level3Submissions.length > 0 &&
                                selectedSubmissionIds.length === level3Submissions.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubmissionIds(level3Submissions.map((s) => s.id));
                                } else {
                                  setSelectedSubmissionIds([]);
                                }
                              }}
                              className="rounded-sm text-[#043e2e] focus:ring-[#043e2e] cursor-pointer"
                            />
                          </th>
                          <th className="p-3">Nama Pemohon & NIK</th>
                          <th className="p-3">Kecamatan / Wilayah</th>
                          <th className="p-3">Kontak / HP</th>
                          <th className="p-3">Waktu Pendaftaran</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">Aksi Verifikasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {level3Submissions.map((sub) => {
                          const st = normalizeStatus(sub.status);
                          const isSelected = selectedSubmissionIds.includes(sub.id);

                          return (
                            <tr
                              key={sub.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                isSelected ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSubmissionIds((prev) => [...prev, sub.id]);
                                    } else {
                                      setSelectedSubmissionIds((prev) => prev.filter((id) => id !== sub.id));
                                    }
                                  }}
                                  className="rounded-sm text-[#043e2e] focus:ring-[#043e2e] cursor-pointer"
                                />
                              </td>

                              <td className="p-3">
                                <div className="font-black text-slate-900 text-xs sm:text-sm">{sub.nama}</div>
                                <div className="text-[11px] text-slate-500 font-mono">NIK: {sub.nik || '-'}</div>
                              </td>

                              <td className="p-3">
                                <div className="text-slate-800 font-bold">{sub.kec || 'Kecamatan Belum Diisi'}</div>
                                <div className="text-[11px] text-slate-500">{resolveSubmissionRegion(sub)}</div>
                              </td>

                              <td className="p-3">
                                <div className="text-slate-800 font-bold flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{sub.hp || '-'}</span>
                                </div>
                              </td>

                              <td className="p-3 text-[11px] text-slate-500">
                                {sub.submittedAtFormatted || sub.submittedAt || '-'}
                              </td>

                              <td className="p-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                    st === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : st === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                  }`}
                                >
                                  {st === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {st === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-600" />}
                                  {st === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                                  <span>{st === 'APPROVED' ? 'Disetujui' : st === 'REJECTED' ? 'Ditolak' : 'Pending'}</span>
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* View detail */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailSub(sub)}
                                    title="Lihat Detail Berkas"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Approve direct */}
                                  {st !== 'APPROVED' && (
                                    <button
                                      type="button"
                                      onClick={() => setSubToApproveDirect(sub)}
                                      title="Setujui (Acc)"
                                      className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer font-bold flex items-center gap-1"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Reject */}
                                  {st !== 'REJECTED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubToReject(sub);
                                        setRejectReason('');
                                      }}
                                      title="Tolak Pendaftaran"
                                      className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
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
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* MODAL: LIHAT DETAIL BERKAS PENDAFTARAN LENGKAP */}
        {/* ===================================================================== */}
        {selectedDetailSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[#d4af37] relative my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#043e2e] flex items-center justify-center font-bold">
                    <User className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Detail Berkas Pendaftaran</h3>
                    <p className="text-xs text-slate-500">Pilar {selectedDetailSub.pillarId?.toUpperCase()} • {selectedDetailSub.wilayah}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailSub(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Nama Lengkap</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{selectedDetailSub.nama}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">NIK / No. KTP</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">{selectedDetailSub.nik || '-'}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Kabupaten / Kota</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedDetailSub.wilayah}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Kecamatan</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedDetailSub.kec || '-'}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Nomor HP / WhatsApp</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedDetailSub.hp || '-'}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Status Saat Ini</div>
                  <div className="font-black text-slate-900 mt-0.5 uppercase">{normalizeStatus(selectedDetailSub.status)}</div>
                </div>
              </div>

              {/* Alamat & Catatan */}
              {selectedDetailSub.recordData?.alamat && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Alamat Domisili</div>
                  <div className="font-medium text-slate-800 mt-1">{selectedDetailSub.recordData.alamat}</div>
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDetailSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Tutup
                </button>

                {normalizeStatus(selectedDetailSub.status) !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => executeApproveDirect(selectedDetailSub)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui (Acc) Sekarang</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: KONFIRMASI APPROVE DIRECT */}
        {/* ===================================================================== */}
        {subToApproveDirect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-emerald-500 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Setujui Pendaftaran Ini?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menyetujui pengajuan pendaftaran <strong>{subToApproveDirect.nama}</strong> ({subToApproveDirect.wilayah}). Data akan otomatis ditambahkan ke database rekapitulasi 10 pilar aktif.
              </p>
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSubToApproveDirect(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => executeApproveDirect(subToApproveDirect)}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 shadow-md cursor-pointer"
                >
                  Ya, Setujui (Acc)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: TOLAK PENDAFTARAN */}
        {/* ===================================================================== */}
        {subToReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-rose-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tolak Pendaftaran</h3>
                  <p className="text-xs text-slate-500">{subToReject.nama} • {subToReject.wilayah}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan (Wajib Diisi):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Berkas NIK tidak valid / Dokumen SK belum dilampirkan..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 h-24"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubToReject(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeRejectDirect}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer"
                >
                  Tolak Berkas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: BATCH APPROVE TERPILIH */}
        {/* ===================================================================== */}
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-emerald-500 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Setujui {selectedSubmissionIds.length} Data Terpilih?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh {selectedSubmissionIds.length} pengajuan pendaftaran yang Anda centang akan disetujui sekaligus dan statusnya diperbarui secara real-time.
              </p>
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchApprove}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 shadow-md cursor-pointer"
                >
                  Ya, Setujui Semua
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: GLOBAL APPROVE SE-JAWA BARAT */}
        {/* ===================================================================== */}
        {showGlobalApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-amber-400 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
                <CheckCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Setujui Seluruh ({globalPending}) Ajuan Pending Se-Jabar?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan menyetujui seluruh pendaftaran yang berstatus <strong>Pending</strong> di seluruh 27 Kabupaten/Kota se-Jawa Barat secara massal.
              </p>
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGlobalApproveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApproveAllGlobalPending}
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md cursor-pointer"
                >
                  Ya, Setujui Se-Jabar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
