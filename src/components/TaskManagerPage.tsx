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
  Image as ImageIcon,
  ZoomIn,
  Award,
} from 'lucide-react';

interface TaskManagerPageProps {
  session?: UserSession;
  submissions: PillarRegistrationSubmission[];
  adminAccounts?: AdminAccount[];
  onBackToHome: () => void;
  onApproveSubmission: (submission: PillarRegistrationSubmission, adminNotes?: string) => void;
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

export type SuperadminSubmissionStatus =
  | 'DISETUJUI_WILAYAH' // Sudah disetujui Admin Wilayah, siap disahkan & diterima Superadmin
  | 'PENDING'           // Belum diperiksa/diverifikasi oleh Admin Wilayah
  | 'SAH_TERDAFTAR'     // Resmi sah dan diterima sebagai anggota 10 Pilar PSKS
  | 'REJECTED';         // Ditolak

export const normalizeSuperadminStatus = (status?: string): SuperadminSubmissionStatus => {
  if (!status) return 'PENDING';
  const s = status.toUpperCase().trim();
  if (
    s === 'DISETUJUI_WILAYAH' ||
    (s.includes('WILAYAH') && s.includes('SETUJU')) ||
    s.includes('MENUNGGU_PENGESAHAN')
  ) {
    return 'DISETUJUI_WILAYAH';
  }
  if (
    s === 'SAH_TERDAFTAR' ||
    s === 'APPROVED' ||
    s === 'ACC' ||
    s.includes('SAH') ||
    s.includes('DITERIMA')
  ) {
    return 'SAH_TERDAFTAR';
  }
  if (
    s.includes('TOLAK') ||
    s.includes('REJECT') ||
    s.includes('BATAL') ||
    s.includes('DITOLAK')
  ) {
    return 'REJECTED';
  }
  return 'PENDING';
};

export const normalizeStatus = (status?: string): 'PENDING' | 'APPROVED' | 'REJECTED' => {
  const s = normalizeSuperadminStatus(status);
  if (s === 'SAH_TERDAFTAR') return 'APPROVED';
  if (s === 'REJECTED') return 'REJECTED';
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
  const [regionStatusFilter, setRegionStatusFilter] = useState<'ALL' | 'HAS_DISETUJUI_WILAYAH' | 'HAS_PENDING' | 'COMPLETED' | 'EMPTY'>('ALL');

  // Filters for Level 3 (Submissions Table)
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('ALL');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');

  // Modals & Selections
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [selectedDetailSub, setSelectedDetailSub] = useState<PillarRegistrationSubmission | null>(null);
  const [subToApproveDirect, setSubToApproveDirect] = useState<PillarRegistrationSubmission | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [subToReject, setSubToReject] = useState<PillarRegistrationSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showGlobalApproveModal, setShowGlobalApproveModal] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; filename?: string; sizeKb?: number } | null>(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

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
      { id: 'slrt_puskesos', label: 'SLRT_PUSKESOS', short: 'SLRT_PUSKESOS', icon: '🛡️', color: 'from-cyan-800 to-blue-900', border: 'border-cyan-500' },
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

  // Global Submissions Stats for 2-Tier Workflow
  const globalTotal = submissions.length;
  const globalDisetujuiWilayah = submissions.filter((s) => normalizeSuperadminStatus(s.status) === 'DISETUJUI_WILAYAH').length;
  const globalPendingWilayah = submissions.filter((s) => normalizeSuperadminStatus(s.status) === 'PENDING').length;
  const globalSah = submissions.filter((s) => normalizeSuperadminStatus(s.status) === 'SAH_TERDAFTAR').length;
  const globalRejected = submissions.filter((s) => normalizeSuperadminStatus(s.status) === 'REJECTED').length;

  // 28 Wilayah Jawa Barat Statistics (Prov. Jabar + 27 Kab/Kota)
  const regionStats = useMemo(() => {
    const stats: Record<string, {
      total: number;
      disetujuiWilayah: number;
      pendingWilayah: number;
      sahTerdaftar: number;
      rejected: number;
    }> = {};

    ALL_REGIONS.forEach((reg) => {
      stats[reg] = { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
    });

    submissions.forEach((sub) => {
      const reg = resolveSubmissionRegion(sub);
      if (!stats[reg]) {
        stats[reg] = { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
      }
      const st = normalizeSuperadminStatus(sub.status);
      stats[reg].total += 1;
      if (st === 'DISETUJUI_WILAYAH') stats[reg].disetujuiWilayah += 1;
      if (st === 'PENDING') stats[reg].pendingWilayah += 1;
      if (st === 'SAH_TERDAFTAR') stats[reg].sahTerdaftar += 1;
      if (st === 'REJECTED') stats[reg].rejected += 1;
    });

    return stats;
  }, [submissions]);

  // Filtered Regions list
  const filteredRegions = useMemo(() => {
    return ALL_REGIONS.filter((reg) => {
      const q = regionSearchTerm.toLowerCase().trim();
      const matchSearch = !q || reg.toLowerCase().includes(q);
      const stat = regionStats[reg] || { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };

      let matchStatus = true;
      if (regionStatusFilter === 'HAS_DISETUJUI_WILAYAH') {
        matchStatus = stat.disetujuiWilayah > 0;
      } else if (regionStatusFilter === 'HAS_PENDING') {
        matchStatus = stat.pendingWilayah > 0;
      } else if (regionStatusFilter === 'COMPLETED') {
        matchStatus = stat.disetujuiWilayah === 0 && stat.pendingWilayah === 0 && stat.sahTerdaftar > 0;
      } else if (regionStatusFilter === 'EMPTY') {
        matchStatus = stat.total === 0;
      }

      return matchSearch && matchStatus;
    });
  }, [regionSearchTerm, regionStatusFilter, regionStats]);

  // Pillar statistics for selected region
  const selectedRegionPillarStats = useMemo(() => {
    if (!selectedRegion) return {};
    const stats: Record<string, {
      total: number;
      disetujuiWilayah: number;
      pendingWilayah: number;
      sahTerdaftar: number;
      rejected: number;
    }> = {};

    tenPillars.forEach((p) => {
      stats[p.id] = { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
    });

    submissions.forEach((sub) => {
      const subReg = resolveSubmissionRegion(sub);
      if (isSameWilayah(subReg, selectedRegion)) {
        const pillarKey = resolveSubmissionPillar(sub.pillarId || sub.recordData?.pillarId);
        if (!stats[pillarKey]) {
          stats[pillarKey] = { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
        }
        const st = normalizeSuperadminStatus(sub.status);
        stats[pillarKey].total += 1;
        if (st === 'DISETUJUI_WILAYAH') stats[pillarKey].disetujuiWilayah += 1;
        if (st === 'PENDING') stats[pillarKey].pendingWilayah += 1;
        if (st === 'SAH_TERDAFTAR') stats[pillarKey].sahTerdaftar += 1;
        if (st === 'REJECTED') stats[pillarKey].rejected += 1;
      }
    });

    return stats;
  }, [selectedRegion, tenPillars, submissions]);

  // Submissions list for Level 3 with Automatic Priority Sorting
  const level3Submissions = useMemo(() => {
    if (!selectedRegion || !selectedPillar) return [];
    const filtered = submissions.filter((sub) => {
      const subReg = resolveSubmissionRegion(sub);
      const matchRegion = isSameWilayah(subReg, selectedRegion);
      const subPillar = resolveSubmissionPillar(sub.pillarId || sub.recordData?.pillarId);
      const matchPillar = subPillar === selectedPillar.toLowerCase().trim();

      const st = normalizeSuperadminStatus(sub.status);
      const matchStatus = tableStatusFilter === 'ALL' || st === tableStatusFilter;
      const q = tableSearchTerm.toLowerCase().trim();
      const safeNama = sub.nama || sub.recordData?.nama || '';
      const safeNik = sub.nik || sub.recordData?.nik || '';
      const safeKec = sub.kec || sub.recordData?.kec || '';
      const safeHp = sub.hp || sub.recordData?.hp || '';

      const matchSearch =
        !q ||
        safeNama.toLowerCase().includes(q) ||
        safeNik.toLowerCase().includes(q) ||
        safeKec.toLowerCase().includes(q) ||
        safeHp.toLowerCase().includes(q) ||
        (sub.submittedByName || '').toLowerCase().includes(q) ||
        (sub.submittedByUsername || '').toLowerCase().includes(q);

      return matchRegion && matchPillar && matchStatus && matchSearch;
    });

    // Otomatis tersortir berdasarkan alur 2-Tier:
    // Priority 1: DISETUJUI_WILAYAH (Rekomendasi Admin Wilayah, sudah siap disahkan Superadmin)
    // Priority 2: PENDING (Masih menunggu verifikasi berkas oleh Admin Wilayah)
    // Priority 3: SAH_TERDAFTAR (Sudah sah & resmi diterima)
    // Priority 4: REJECTED (Ditolak)
    // Secondary: submittedAt (Terbaru di atas)
    return [...filtered].sort((a, b) => {
      const rankMap: Record<SuperadminSubmissionStatus, number> = {
        DISETUJUI_WILAYAH: 1,
        PENDING: 2,
        SAH_TERDAFTAR: 3,
        REJECTED: 4,
      };
      const rankA = rankMap[normalizeSuperadminStatus(a.status)] || 99;
      const rankB = rankMap[normalizeSuperadminStatus(b.status)] || 99;
      if (rankA !== rankB) return rankA - rankB;

      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
    });
  }, [selectedRegion, selectedPillar, submissions, tableStatusFilter, tableSearchTerm]);

  // Manual Sync trigger
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      triggerSuccessBanner('Data Pengesahan & Penerimaan Anggota telah tersinkronisasi realtime.');
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
    onApproveSubmission(
      sub,
      approvalNotes || 'Telah disahkan dan diterima secara resmi sebagai anggota 10 Pilar PSKS Jawa Barat.'
    );
    setSubToApproveDirect(null);
    setApprovalNotes('');
    setSelectedDetailSub(null);
    const safeName = sub.nama || sub.recordData?.nama || 'Pemohon';
    const safeRegion = sub.wilayah || sub.recordData?.wilayah || resolveSubmissionRegion(sub);
    triggerSuccessBanner(`Pendaftaran ${safeName} (${safeRegion}) BERHASIL DISAHKAN & DITERIMA SECARA RESMI!`);
  };

  const executeRejectDirect = () => {
    if (!subToReject) return;
    onRejectSubmission(subToReject.id, rejectReason || 'Pengesahan ditolak oleh Superadmin Dinsos Jabar.');
    const safeName = subToReject.nama || subToReject.recordData?.nama || 'Pemohon';
    setSubToReject(null);
    setRejectReason('');
    setSelectedDetailSub(null);
    triggerSuccessBanner(`Pendaftaran ${safeName} telah DITOLAK.`);
  };

  const handleExecuteBatchApprove = () => {
    if (onBatchApproveSubmissions && selectedSubmissionIds.length > 0) {
      onBatchApproveSubmissions(selectedSubmissionIds);
      triggerSuccessBanner(`${selectedSubmissionIds.length} pengajuan pendaftaran berhasil disahkan & diterima sekaligus!`);
      setSelectedSubmissionIds([]);
      setShowBatchModal(false);
    }
  };

  const handleApproveAllPendingInRegion = () => {
    if (!selectedRegion || !onBatchApproveSubmissions) return;
    // Sahkan seluruh ajuan di wilayah yang berstatus DISETUJUI_WILAYAH (atau PENDING)
    const targetInRegion = submissions
      .filter((s) => {
        const matchReg = isSameWilayah(resolveSubmissionRegion(s), selectedRegion);
        const st = normalizeSuperadminStatus(s.status);
        return matchReg && (st === 'DISETUJUI_WILAYAH' || st === 'PENDING');
      })
      .map((s) => s.id);

    if (targetInRegion.length === 0) {
      alert(`Tidak ada ajuan yang memerlukan pengesahan di wilayah ${selectedRegion}.`);
      return;
    }

    if (window.confirm(`Yakin ingin mengesahkan & menerima seluruh (${targetInRegion.length}) ajuan di ${selectedRegion}?`)) {
      onBatchApproveSubmissions(targetInRegion);
      triggerSuccessBanner(`${targetInRegion.length} ajuan di ${selectedRegion} telah resmi disahkan & diterima!`);
    }
  };

  const handleApproveAllGlobalPending = () => {
    if (!onBatchApproveSubmissions) return;
    // Sahkan semua ajuan yang sudah disetujui wilayah (rekomendasi siap disahkan)
    const allApprovedWilayahIds = submissions
      .filter((s) => normalizeSuperadminStatus(s.status) === 'DISETUJUI_WILAYAH')
      .map((s) => s.id);

    if (allApprovedWilayahIds.length === 0) {
      alert('Tidak ada ajuan yang menunggu pengesahan rekomendasi wilayah saat ini.');
      return;
    }

    onBatchApproveSubmissions(allApprovedWilayahIds);
    setShowGlobalApproveModal(false);
    triggerSuccessBanner(`Seluruh (${allApprovedWilayahIds.length}) rekomendasi admin wilayah se-Jawa Barat telah resmi disahkan & diterima!`);
  };

  const activePillarInfo = tenPillars.find((p) => p.id === selectedPillar);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-6">

        {/* Action Success Toast */}
        {actionSuccessMsg && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#0f2b5c] text-amber-300 px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#d4af37] flex items-center gap-3 animate-slideIn text-xs sm:text-sm font-black">
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
            <div className="inline-flex items-center gap-2 bg-[#0f2b5c] text-amber-300 px-3.5 py-2 rounded-xl text-xs font-black shadow-xs">
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
              className="bg-slate-50 hover:bg-blue-50 border border-slate-300/80 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0f2b5c] flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isSyncing ? 'animate-spin' : ''}`} />
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
                  viewMode === 'REGION_GRID' ? 'text-[#0f2b5c] font-black' : 'text-slate-500 hover:text-blue-800 underline decoration-dotted'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>27 Kabupaten/Kota</span>
              </button>

              {selectedRegion && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <button
                    type="button"
                    onClick={viewMode === 'SUBMISSION_TABLE' ? handleBackToPillars : undefined}
                    className={`flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'PILLAR_GRID' ? 'text-[#0f2b5c] font-black' : 'text-slate-500 hover:text-blue-800 underline decoration-dotted'
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
                  <span className="text-blue-900 font-black flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
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
                  className="text-xs font-bold text-[#0f2b5c] hover:text-[#143b7d] px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Sebelumnya</span>
                </button>
              )}

              {viewMode === 'SUBMISSION_TABLE' && (
                <button
                  type="button"
                  onClick={handleBackToPillars}
                  className="text-xs font-bold text-[#0f2b5c] hover:text-[#143b7d] px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
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
              <div className="bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 bg-blue-950/90 border border-blue-400/50 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>PUSAT PENGESAHAN & PENERIMAAN ANGGOTA 10 PILAR PSKS JAWA BARAT</span>
                    </div>

                    {globalDisetujuiWilayah > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowGlobalApproveModal(true)}
                        className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 hover:shadow-lg"
                      >
                        <CheckCheck className="w-4 h-4 text-slate-950" />
                        <span>Sahkan Semua ({globalDisetujuiWilayah}) Rekomendasi Wilayah Se-Jabar</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight">
                      Pengesahan & Penerimaan Anggota 10 Pilar PSKS Se-Jawa Barat
                    </h1>
                    <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-3xl leading-relaxed mt-1">
                      Pantau ajuan yang telah ditinjau dan direkomendasikan oleh Admin Wilayah masing-masing (Tier 1). Berikan pengesahan resmi tingkat Provinsi (Tier 2) agar anggota sah terdaftar secara resmi di database 10 Pilar PSKS Jawa Barat.
                    </p>
                  </div>

                  {/* 5 Primary Global Metrics: Total, Disetujui Wilayah, Menunggu Wilayah, Sah Terdaftar, Ditolak */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-blue-800/60">
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-white/10">
                      <div className="flex items-center justify-between text-xs text-blue-200 font-bold mb-1">
                        <span>Total Masuk</span>
                        <Layers className="w-4 h-4 text-blue-300" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{globalTotal}</div>
                      <div className="text-[10px] text-blue-200/80 font-medium mt-0.5">Seluruh Ajuan Se-Jabar</div>
                    </div>

                    <div className="bg-emerald-500/20 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-emerald-400/40 relative overflow-hidden">
                      {globalDisetujuiWilayah > 0 && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white"></span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-emerald-200 font-bold mb-1">
                        <span>⭐ Siap Disahkan</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-300">{globalDisetujuiWilayah}</div>
                      <div className="text-[10px] text-emerald-200/80 font-medium mt-0.5">Rekomendasi Admin Wilayah</div>
                    </div>

                    <div className="bg-amber-500/20 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-amber-400/40">
                      <div className="flex items-center justify-between text-xs text-amber-200 font-bold mb-1">
                        <span>⏳ Menunggu Wilayah</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-300">{globalPendingWilayah}</div>
                      <div className="text-[10px] text-amber-200/80 font-medium mt-0.5">Belum ditinjau admin wilayah</div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-blue-400/40">
                      <div className="flex items-center justify-between text-xs text-blue-200 font-bold mb-1">
                        <span>🏛️ Sah Terdaftar</span>
                        <Award className="w-4 h-4 text-blue-300" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-blue-200">{globalSah}</div>
                      <div className="text-[10px] text-blue-200/80 font-medium mt-0.5">Resmi disahkan Provinsi</div>
                    </div>

                    <div className="bg-rose-500/20 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-rose-400/40 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-xs text-rose-200 font-bold mb-1">
                        <span>❌ Ditolak</span>
                        <XCircle className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-rose-300">{globalRejected}</div>
                      <div className="text-[10px] text-rose-200/80 font-medium mt-0.5">Berkas tidak memenuhi syarat</div>
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c] focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'ALL' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({ALL_REGIONS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('HAS_DISETUJUI_WILAYAH')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'HAS_DISETUJUI_WILAYAH' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Siap Disahkan ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('HAS_PENDING')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'HAS_PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending Wilayah
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionStatusFilter('COMPLETED')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      regionStatusFilter === 'COMPLETED' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Selesai (Sah)
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
                  const stat = regionStats[reg] || { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
                  const adminAcc = adminByWilayah.get(normalizeWilayah(reg));
                  const hasDisetujuiWilayah = stat.disetujuiWilayah > 0;
                  const hasPendingWilayah = stat.pendingWilayah > 0;

                  return (
                    <div
                      key={reg}
                      onClick={() => handleSelectRegion(reg)}
                      className={`group bg-white rounded-2xl p-5 border-2 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        hasDisetujuiWilayah
                          ? 'border-emerald-500 hover:border-emerald-600 hover:-translate-y-1 ring-2 ring-emerald-400/20'
                          : hasPendingWilayah
                          ? 'border-amber-400 hover:border-amber-500 hover:-translate-y-1'
                          : stat.sahTerdaftar > 0
                          ? 'border-blue-200 hover:border-blue-400 hover:-translate-y-1'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top status indicator bar */}
                      <div
                        className={`h-1.5 w-full absolute top-0 left-0 ${
                          hasDisetujuiWilayah
                            ? 'bg-emerald-500'
                            : hasPendingWilayah
                            ? 'bg-amber-400'
                            : stat.sahTerdaftar > 0
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}
                      />

                      {/* Sensor Monitor Lampu Bulat di Pojok Kanan Atas Kolom */}
                      {hasDisetujuiWilayah ? (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10" title={`Sensor Monitor: ${stat.disetujuiWilayah} berkas siap disahkan`}>
                          <span className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-md"></span>
                          </span>
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            {stat.disetujuiWilayah} Siap Sahkan
                          </span>
                        </div>
                      ) : hasPendingWilayah ? (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10" title={`Sensor Monitor: ${stat.pendingWilayah} berkas menunggu verifikasi wilayah`}>
                          <span className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-white shadow-md"></span>
                          </span>
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            {stat.pendingWilayah} Belum Verif
                          </span>
                        </div>
                      ) : null}

                      <div>
                        {/* Card Header: Title & Info */}
                        <div className="flex items-start justify-between gap-2 mb-2 pr-28">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2b5c] flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
                              <MapPin className="w-4 h-4 text-blue-800" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-[#0f2b5c] transition-colors leading-tight">
                              {reg}
                            </h3>
                          </div>
                        </div>

                        {/* Admin Wilayah Info */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Admin Wilayah: {adminAcc ? (adminAcc.namaAdmin || adminAcc.username) : 'Belum ditugaskan'}</span>
                        </div>
                      </div>

                      {/* Stats Pills: Total, Siap Sahkan, Belum Verif, Sah, Ditolak & Click CTA */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col justify-between gap-2">
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold flex-wrap">
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Total: <strong className="text-slate-900">{stat.total}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md ${
                            hasDisetujuiWilayah
                              ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300'
                              : 'text-slate-500 bg-slate-50'
                          }`}>
                            Siap Sahkan: <strong>{stat.disetujuiWilayah}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md ${
                            hasPendingWilayah
                              ? 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300'
                              : 'text-slate-500 bg-slate-50'
                          }`}>
                            Pending: <strong>{stat.pendingWilayah}</strong>
                          </span>
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            Sah: <strong>{stat.sahTerdaftar}</strong>
                          </span>
                          {stat.rejected > 0 && (
                            <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md border border-rose-300">
                              Ditolak: <strong>{stat.rejected}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1 text-xs font-black text-[#0f2b5c] group-hover:translate-x-1 transition-transform pt-1">
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
              <div className="bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] rounded-3xl p-6 sm:p-7 text-white border-2 border-[#d4af37] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>WILAYAH PENGESAHAN KABUPATEN / KOTA</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">{selectedRegion}</h2>
                  <p className="text-xs sm:text-sm text-emerald-100">
                    Pilih salah satu pilar di bawah ini untuk melihat berkas pendaftaran yang sudah direkomendasikan Admin Wilayah dan sahkan penerimaan anggotanya.
                  </p>

                  {/* Regional Realtime Stats Breakdown */}
                  {(() => {
                    const rStat = regionStats[selectedRegion] || { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
                    return (
                      <div className="flex items-center gap-2 pt-2 flex-wrap text-xs font-bold">
                        <span className="bg-white/15 px-2.5 py-1 rounded-lg border border-white/20">
                          Total: <strong className="text-white font-black">{rStat.total}</strong>
                        </span>
                        <span className="bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-400/40 text-emerald-200">
                          Siap Disahkan: <strong className="text-emerald-300 font-black">{rStat.disetujuiWilayah}</strong>
                        </span>
                        <span className="bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-400/40 text-amber-200">
                          Pending Wilayah: <strong className="text-amber-300 font-black">{rStat.pendingWilayah}</strong>
                        </span>
                        <span className="bg-blue-500/25 px-2.5 py-1 rounded-lg border border-blue-400/40 text-blue-200">
                          Sah Terdaftar: <strong className="text-blue-200 font-black">{rStat.sahTerdaftar}</strong>
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
                    className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Sahkan Semua Rekomendasi di {selectedRegion}</span>
                  </button>
                </div>
              </div>

              {/* 10 Pillars Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {tenPillars.map((pilar) => {
                  const stat = selectedRegionPillarStats[pilar.id] || { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
                  const hasDisetujuiWilayah = stat.disetujuiWilayah > 0;
                  const hasPendingWilayah = stat.pendingWilayah > 0;

                  return (
                    <div
                      key={pilar.id}
                      onClick={() => handleSelectPillar(pilar.id)}
                      className={`group bg-white rounded-2xl p-4 border-2 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        hasDisetujuiWilayah
                          ? 'border-emerald-500 hover:border-emerald-600 hover:-translate-y-1 ring-2 ring-emerald-400/20'
                          : hasPendingWilayah
                          ? 'border-amber-400 hover:border-amber-500 hover:-translate-y-1'
                          : stat.sahTerdaftar > 0
                          ? 'border-blue-200 hover:border-blue-400 hover:-translate-y-1'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Monitor Sensor Lampu Bulat di Pojok Kanan Atas Kolom Pilar */}
                      {hasDisetujuiWilayah ? (
                        <div className="absolute top-3 right-3 flex items-center gap-1 z-10" title={`Sensor Monitor: ${stat.disetujuiWilayah} rekomendasi siap disahkan`}>
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white shadow-xs"></span>
                          </span>
                          <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                            {stat.disetujuiWilayah} Siap Sah
                          </span>
                        </div>
                      ) : hasPendingWilayah ? (
                        <div className="absolute top-3 right-3 flex items-center gap-1 z-10" title={`Sensor Monitor: ${stat.pendingWilayah} berkas pending wilayah`}>
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border border-white shadow-xs"></span>
                          </span>
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                            {stat.pendingWilayah}
                          </span>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-1.5 pr-14">
                          <span className="text-2xl p-2 bg-slate-100 rounded-xl">{pilar.icon}</span>
                        </div>

                        <div>
                          <div className="text-[10px] font-black text-blue-900 uppercase tracking-wide">
                            PILAR {pilar.short}
                          </div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-[#0f2b5c] leading-snug line-clamp-2">
                            {pilar.label}
                          </h4>
                        </div>
                      </div>

                      {/* Pillar Metrics: Total, Siap Sahkan, Pending, Sah, Ditolak */}
                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px]">
                        <div className="flex items-center gap-1 font-bold flex-wrap">
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            Total: <strong className="text-slate-900">{stat.total}</strong>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            hasDisetujuiWilayah
                              ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300'
                              : 'text-slate-500 bg-slate-50'
                          }`}>
                            Siap: <strong>{stat.disetujuiWilayah}</strong>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            hasPendingWilayah
                              ? 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300'
                              : 'text-slate-400 bg-slate-50'
                          }`}>
                            Pending: <strong>{stat.pendingWilayah}</strong>
                          </span>
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            Sah: <strong>{stat.sahTerdaftar}</strong>
                          </span>
                        </div>
                        <span className="text-[#0f2b5c] font-black flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
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
                  <span className="text-3xl p-2.5 bg-blue-50 text-blue-900 rounded-2xl border border-blue-200">
                    {activePillarInfo.icon}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="text-slate-700 font-bold">{selectedRegion}</span>
                      <span>•</span>
                      <span className="text-blue-900 font-black">Pilar {activePillarInfo.short}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      Pengesahan: {activePillarInfo.label}
                    </h2>
                    {/* Live Pillar Stats Pill */}
                    {(() => {
                      const pStat = selectedRegionPillarStats[selectedPillar] || { total: 0, disetujuiWilayah: 0, pendingWilayah: 0, sahTerdaftar: 0, rejected: 0 };
                      return (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[11px] font-bold">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            Total: <strong className="text-slate-900">{pStat.total}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded border ${
                            pStat.disetujuiWilayah > 0
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            Siap Disahkan: <strong className={pStat.disetujuiWilayah > 0 ? 'text-emerald-950' : 'text-slate-700'}>{pStat.disetujuiWilayah}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded border ${
                            pStat.pendingWilayah > 0
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            Pending Wilayah: <strong className={pStat.pendingWilayah > 0 ? 'text-amber-950' : 'text-slate-700'}>{pStat.pendingWilayah}</strong>
                          </span>
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                            Sah Terdaftar: <strong className="text-blue-950">{pStat.sahTerdaftar}</strong>
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
                      <span>Sahkan {selectedSubmissionIds.length} Terpilih (Batch)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Priority Sorting Notification Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-blue-900 font-medium">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Urutan Otomatis:</strong> Ajuan yang telah diverifikasi & direkomendasikan oleh Admin Wilayah (<strong>Siap Disahkan ⭐</strong>) otomatis ditempatkan di urutan teratas untuk mempercepat proses pengesahan.
                </span>
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c] focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'ALL' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('DISETUJUI_WILAYAH')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'DISETUJUI_WILAYAH' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Siap Disahkan ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending Wilayah
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatusFilter('SAH_TERDAFTAR')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tableStatusFilter === 'SAH_TERDAFTAR' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sah Terdaftar 🏛️
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
                      Belum ada ajuan pendaftaran untuk pilar ini di {selectedRegion} yang sesuai dengan filter yang dipilih.
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
                              className="rounded-sm text-[#0f2b5c] focus:ring-[#0f2b5c] cursor-pointer"
                            />
                          </th>
                          <th className="p-3 text-center">Berkas Foto</th>
                          <th className="p-3">Nama Pemohon & NIK</th>
                          <th className="p-3">Kecamatan / Wilayah</th>
                          <th className="p-3">Kontak / HP</th>
                          <th className="p-3">Waktu Pengajuan</th>
                          <th className="p-3 text-center">Status & Alur Verifikasi</th>
                          <th className="p-3 text-center">Aksi Pengesahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {level3Submissions.map((sub) => {
                          const st = normalizeSuperadminStatus(sub.status);
                          const isSelected = selectedSubmissionIds.includes(sub.id);
                          const photoData = sub.berkasFotoUrl || sub.recordData?.berkasFotoUrl;

                          return (
                            <tr
                              key={sub.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                isSelected ? 'bg-blue-50/40' : st === 'DISETUJUI_WILAYAH' ? 'bg-emerald-50/20' : ''
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
                                  className="rounded-sm text-[#0f2b5c] focus:ring-[#0f2b5c] cursor-pointer"
                                />
                              </td>

                              {/* Foto Berkas Preview */}
                              <td className="p-3 text-center">
                                {photoData ? (
                                  <button
                                    type="button"
                                    onClick={() => setZoomPhotoUrl(photoData)}
                                    title="Klik untuk memperbesar foto berkas"
                                    className="group/img relative inline-block rounded-xl overflow-hidden border-2 border-emerald-400 shadow-xs hover:scale-105 transition-transform cursor-pointer"
                                  >
                                    <img
                                      src={photoData}
                                      alt="Berkas"
                                      className="w-12 h-12 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                      <ZoomIn className="w-4 h-4 text-white" />
                                    </div>
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400" title="Tidak ada foto berkas">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                )}
                              </td>

                              <td className="p-3">
                                <div className="font-black text-slate-900 text-xs sm:text-sm">{sub.nama || sub.recordData?.nama || 'Pemohon PSKS'}</div>
                                <div className="text-[11px] text-slate-500 font-mono">NIK: {sub.nik || sub.recordData?.nik || '-'}</div>
                                {sub.submittedByRole === 'admin' && (
                                  <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-black text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                    <span>Diajukan Admin Wilayah</span>
                                  </div>
                                )}
                              </td>

                              <td className="p-3">
                                <div className="text-slate-800 font-bold">{sub.kec || sub.recordData?.kec || 'Kecamatan Belum Diisi'}</div>
                                <div className="text-[11px] text-slate-500">{resolveSubmissionRegion(sub)}</div>
                              </td>

                              <td className="p-3">
                                <div className="text-slate-800 font-bold flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{sub.hp || sub.recordData?.hp || '-'}</span>
                                </div>
                              </td>

                              <td className="p-3 text-[11px] text-slate-500">
                                {sub.submittedAtFormatted || sub.submittedAt || '-'}
                              </td>

                              {/* 2-Tier Status Indicator */}
                              <td className="p-3 text-center">
                                {st === 'DISETUJUI_WILAYAH' && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>{sub.submittedByRole === 'admin' ? 'Diajukan Admin Wilayah (Siap Sahkan)' : 'Rekomendasi Wilayah (Siap Sahkan)'}</span>
                                    </span>
                                    <div className="text-[9px] text-emerald-700 font-bold">
                                      {sub.submittedByRole === 'admin' ? 'Pengajuan Admin Wilayah • Menunggu Superadmin' : 'Tier 1 Selesai • Menunggu Tier 2'}
                                    </div>
                                  </div>
                                )}

                                {st === 'SAH_TERDAFTAR' && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                                      <Award className="w-3 h-3 text-blue-600" />
                                      <span>Sah Resmi Terdaftar</span>
                                    </span>
                                    <div className="text-[9px] text-blue-700 font-bold">Telah Disahkan Provinsi</div>
                                  </div>
                                )}

                                {st === 'PENDING' && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Menunggu Verif Wilayah</span>
                                    </span>
                                    <div className="text-[9px] text-amber-700 font-medium">Belum ditinjau Admin Wilayah</div>
                                  </div>
                                )}

                                {st === 'REJECTED' && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      <span>Ditolak</span>
                                    </span>
                                    <div className="text-[9px] text-rose-700 font-medium">Tidak memenuhi syarat</div>
                                  </div>
                                )}
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {/* View detail */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailSub(sub)}
                                    title="Lihat Detail Berkas Lengkap"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Approve / Sahkan direct */}
                                  {st !== 'SAH_TERDAFTAR' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubToApproveDirect(sub);
                                        setApprovalNotes('');
                                      }}
                                      title={st === 'DISETUJUI_WILAYAH' ? 'Sahkan & Terima Anggota' : 'Sahkan Langsung'}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shadow-xs ${
                                        st === 'DISETUJUI_WILAYAH'
                                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                          : 'bg-blue-700 hover:bg-blue-800 text-white'
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{st === 'DISETUJUI_WILAYAH' ? 'Sahkan' : 'Sahkan'}</span>
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
        {/* MODAL: LIHAT DETAIL BERKAS PENDAFTARAN LENGKAP DENGAN 2-TIER TRACKING */}
        {/* ===================================================================== */}
        {selectedDetailSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[#d4af37] relative my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold border border-blue-200">
                    <User className="w-5 h-5 text-blue-800" />
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

              {/* Berkas Foto Card with Zoom preview */}
              {(selectedDetailSub.berkasFotoUrl || selectedDetailSub.recordData?.berkasFotoUrl) && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lampiran Berkas Foto Pemohon</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomPhotoUrl(selectedDetailSub.berkasFotoUrl || selectedDetailSub.recordData?.berkasFotoUrl || null)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Perbesar Foto</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedDetailSub.berkasFotoUrl || selectedDetailSub.recordData?.berkasFotoUrl}
                      alt="Berkas Foto Pemohon"
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-300 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setZoomPhotoUrl(selectedDetailSub.berkasFotoUrl || selectedDetailSub.recordData?.berkasFotoUrl || null)}
                    />
                    <div className="text-xs space-y-1 text-slate-600">
                      <div className="font-bold text-slate-900">
                        {selectedDetailSub.recordData?.berkasFotoNama || 'Dokumen Persyaratan PSKS'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ukuran: {selectedDetailSub.recordData?.berkasFotoSize ? `${(selectedDetailSub.recordData.berkasFotoSize / 1024).toFixed(1)} KB` : 'Terkonversi WebP Kompresi'}
                      </div>
                      <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block border border-emerald-200">
                        ✓ Lolos Validasi Klien Aman Firebase
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Nama Lengkap</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{selectedDetailSub.nama || selectedDetailSub.recordData?.nama || 'Pemohon PSKS'}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">NIK / No. KTP</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">{selectedDetailSub.nik || selectedDetailSub.recordData?.nik || '-'}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Kabupaten / Kota</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedDetailSub.wilayah || selectedDetailSub.recordData?.wilayah || resolveSubmissionRegion(selectedDetailSub)}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Kecamatan</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedDetailSub.kec || selectedDetailSub.recordData?.kec || '-'}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Nomor HP / WhatsApp</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedDetailSub.hp || selectedDetailSub.recordData?.hp || '-'}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Status Saat Ini</div>
                  <div className="font-black text-slate-900 mt-0.5 uppercase">{normalizeSuperadminStatus(selectedDetailSub.status)}</div>
                </div>
              </div>

              {/* 2-Tier Approval Flow Card in Modal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Riwayat & Alur Persetujuan Bertingkat:
                </div>

                <div className="space-y-2 text-xs">
                  {/* Tier 1: Admin Wilayah */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      selectedDetailSub.verifiedWilayahAt
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedDetailSub.verifiedWilayahAt ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-slate-900">
                        {selectedDetailSub.submittedByRole === 'admin'
                          ? `Pengajuan Resmi Admin Wilayah (${selectedDetailSub.wilayah})`
                          : `Tier 1: Verifikasi Berkas Wilayah (${selectedDetailSub.wilayah})`}
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {selectedDetailSub.submittedByRole === 'admin'
                          ? `Diajukan langsung oleh Admin Wilayah: ${selectedDetailSub.submittedByName || 'Admin Wilayah'} (${selectedDetailSub.submittedAtFormatted || selectedDetailSub.submittedAt || '-'}), diteruskan ke Superadmin & Developer untuk persetujuan.`
                          : (selectedDetailSub.verifiedWilayahAt
                            ? `Disetujui oleh: ${selectedDetailSub.verifiedWilayahBy || 'Admin Wilayah'} (${selectedDetailSub.verifiedWilayahAtFormatted || selectedDetailSub.verifiedWilayahAt})`
                            : 'Belum diverifikasi oleh Admin Wilayah setempat.')}
                      </div>
                      {selectedDetailSub.catatanWilayah && (
                        <div className="text-[11px] text-slate-700 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200">
                          <strong>Catatan Wilayah:</strong> {selectedDetailSub.catatanWilayah}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tier 2: Superadmin Pengesahan */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      selectedDetailSub.approvedProvinsiAt
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {selectedDetailSub.approvedProvinsiAt ? <Award className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-slate-900">
                        Tier 2: Pengesahan & Penerimaan Anggota (Tingkat Provinsi)
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {selectedDetailSub.approvedProvinsiAt
                          ? `Disahkan oleh Superadmin (${selectedDetailSub.approvedProvinsiAtFormatted || selectedDetailSub.approvedProvinsiAt})`
                          : 'Menunggu pengesahan akhir Superadmin Provinsi Jawa Barat.'}
                      </div>
                      {selectedDetailSub.catatanProvinsi && (
                        <div className="text-[11px] text-slate-700 bg-blue-50 p-2 rounded-lg mt-1 border border-blue-200">
                          <strong>Catatan Pengesahan:</strong> {selectedDetailSub.catatanProvinsi}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDetailSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Tutup
                </button>

                {normalizeSuperadminStatus(selectedDetailSub.status) !== 'SAH_TERDAFTAR' && (
                  <button
                    type="button"
                    onClick={() => {
                      const sub = selectedDetailSub;
                      setSelectedDetailSub(null);
                      setSubToApproveDirect(sub);
                      setApprovalNotes('');
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Sahkan & Terima Anggota Sekarang</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: KONFIRMASI PENGESAHAN (APPROVE DIRECT) */}
        {/* ===================================================================== */}
        {subToApproveDirect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-emerald-500 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Sahkan & Terima Anggota Ini?</h3>
              <p className="text-xs text-slate-600 leading-relaxed text-left">
                Anda akan mengesahkan secara resmi pendaftaran <strong>{subToApproveDirect.nama || subToApproveDirect.recordData?.nama || 'Pemohon'}</strong> ({subToApproveDirect.wilayah || subToApproveDirect.recordData?.wilayah || resolveSubmissionRegion(subToApproveDirect)}) pada <strong>Pilar {subToApproveDirect.pillarId?.toUpperCase()}</strong>.
              </p>

              <div className="text-left">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Pengesahan Provinsi (Opsional):
                </label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Contoh: Berkas telah lengkap dan disahkan oleh Dinsos Jabar..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubToApproveDirect(null);
                    setApprovalNotes('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => executeApproveDirect(subToApproveDirect)}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 shadow-md cursor-pointer"
                >
                  Ya, Sahkan & Terima
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
                  <p className="text-xs text-slate-500">{subToReject.nama || subToReject.recordData?.nama || 'Pemohon'} • {subToReject.wilayah || subToReject.recordData?.wilayah || resolveSubmissionRegion(subToReject)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan (Wajib Diisi):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Berkas NIK tidak valid / Foto berkas blur atau tidak sesuai..."
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
              <h3 className="text-lg font-black text-slate-900">Sahkan {selectedSubmissionIds.length} Data Terpilih?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh {selectedSubmissionIds.length} pengajuan pendaftaran yang Anda centang akan disahkan sekaligus sebagai anggota resmi di tingkat Provinsi Jawa Barat.
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
                  Ya, Sahkan Semua
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
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-emerald-500 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Sahkan Seluruh ({globalDisetujuiWilayah}) Rekomendasi Wilayah Se-Jabar?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan mengesahkan secara massal seluruh ajuan yang telah diverifikasi & disetujui oleh Admin Wilayah (Tier 1) di 27 Kabupaten/Kota se-Jawa Barat.
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
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md cursor-pointer"
                >
                  Ya, Sahkan Se-Jabar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: ZOOM FOTO BERKAS PERSYARATAN FULLSCREEN */}
        {/* ===================================================================== */}
        {zoomPhotoUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer"
            onClick={() => setZoomPhotoUrl(null)}
          >
            <div
              className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold">Foto Berkas Persyaratan Pendaftaran</span>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomPhotoUrl(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center bg-black/40 max-h-[75vh] overflow-auto">
                <img
                  src={zoomPhotoUrl}
                  alt="Dokumen Berkas Persyaratan"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
                />
              </div>
              <div className="p-3 bg-slate-950/90 border-t border-white/10 text-center text-xs text-slate-400 flex items-center justify-between px-6">
                <span>Format terkompresi WebP (Aman memori Firebase)</span>
                <button
                  type="button"
                  onClick={() => setZoomPhotoUrl(null)}
                  className="text-white font-bold hover:underline cursor-pointer"
                >
                  Tutup Tampilan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
