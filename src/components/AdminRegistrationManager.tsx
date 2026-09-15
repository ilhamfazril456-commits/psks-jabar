import React, { useState, useMemo } from 'react';
import {
  PillarRegistrationSubmission,
  UserSession,
} from '../types';
import { PILLARS_CONFIG } from '../data/initialData';
import { isSameWilayah, normalizeStatus } from './TaskManagerPage';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Layers,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  AlertCircle,
  X,
  Sparkles,
  ChevronRight,
  Send,
  Check,
  ArrowLeft,
  RefreshCw,
  FolderOpen,
  LayoutList,
  Table2,
} from 'lucide-react';

interface AdminRegistrationManagerProps {
  session: UserSession;
  submissions: PillarRegistrationSubmission[];
  onApproveSubmission: (submission: PillarRegistrationSubmission) => void;
  onRejectSubmission: (submissionId: string, notes?: string) => void;
  onBackToHome?: () => void;
}

export const AdminRegistrationManager: React.FC<AdminRegistrationManagerProps> = ({
  session,
  submissions,
  onApproveSubmission,
  onRejectSubmission,
  onBackToHome,
}) => {
  // activePillarGrid: null means showing the 10 Pillar Grid Cards
  // string (e.g. 'peksos') means showing the submission table for that pillar
  const [activePillarGrid, setActivePillarGrid] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] =
    useState<PillarRegistrationSubmission | null>(null);
  const [submissionToApprove, setSubmissionToApprove] =
    useState<PillarRegistrationSubmission | null>(null);
  const [submissionToReject, setSubmissionToReject] =
    useState<PillarRegistrationSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const adminWilayah = session.wilayah || 'Semua Wilayah';
  const isAllRegionAdmin =
    adminWilayah === 'Prov. Jabar' ||
    adminWilayah === 'Semua Wilayah' ||
    session.role === 'superadmin' ||
    session.role === 'developer' ||
    Boolean(session.isDeveloper);

  // 10 Pillars Definition
  const tenPillars = useMemo(() => {
    const list = [
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
    return list;
  }, []);

  // Filter submissions for this regional admin
  const regionSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (isAllRegionAdmin) return true;
      return isSameWilayah(sub.wilayah, adminWilayah);
    });
  }, [submissions, adminWilayah, isAllRegionAdmin]);

  // Pillar statistics counts
  const pillarStats = useMemo(() => {
    const stats: Record<string, { total: number; pending: number; approved: number; rejected: number }> = {};
    tenPillars.forEach((p) => {
      stats[p.id] = { total: 0, pending: 0, approved: 0, rejected: 0 };
    });

    regionSubmissions.forEach((sub) => {
      const pKey = (sub.pillarId || '').toLowerCase().trim();
      if (!stats[pKey]) {
        stats[pKey] = { total: 0, pending: 0, approved: 0, rejected: 0 };
      }
      const st = normalizeStatus(sub.status);
      stats[pKey].total += 1;
      if (st === 'PENDING') stats[pKey].pending += 1;
      if (st === 'APPROVED') stats[pKey].approved += 1;
      if (st === 'REJECTED') stats[pKey].rejected += 1;
    });

    return stats;
  }, [tenPillars, regionSubmissions]);

  // Total statistics across all pillars for this region
  const totalSubmissions = regionSubmissions.length;
  const totalPending = regionSubmissions.filter((s) => normalizeStatus(s.status) === 'PENDING').length;
  const totalApproved = regionSubmissions.filter((s) => normalizeStatus(s.status) === 'APPROVED').length;
  const totalRejected = regionSubmissions.filter((s) => normalizeStatus(s.status) === 'REJECTED').length;

  // Submissions filtered by active selected pillar, status, and search
  const filteredSubmissions = useMemo(() => {
    if (!activePillarGrid) return [];
    return regionSubmissions.filter((sub) => {
      const matchPillar = (sub.pillarId || '').toLowerCase().trim() === activePillarGrid.toLowerCase().trim();
      const st = normalizeStatus(sub.status);
      const matchStatus =
        selectedStatus === 'ALL' || st === selectedStatus;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (sub.nama || '').toLowerCase().includes(q) ||
        (sub.nik || '').toLowerCase().includes(q) ||
        (sub.kec || '').toLowerCase().includes(q) ||
        (sub.wilayah || '').toLowerCase().includes(q) ||
        (sub.submittedByName || '').toLowerCase().includes(q);

      return matchPillar && matchStatus && matchSearch;
    });
  }, [regionSubmissions, activePillarGrid, selectedStatus, searchTerm]);

  const activePillarInfo = useMemo(() => {
    if (!activePillarGrid) return null;
    return tenPillars.find((p) => p.id === activePillarGrid) || {
      id: activePillarGrid,
      label: PILLARS_CONFIG[activePillarGrid]?.title || activePillarGrid.toUpperCase(),
      short: activePillarGrid.toUpperCase(),
      icon: '📋',
      color: 'from-emerald-800 to-teal-900',
      border: 'border-emerald-500',
    };
  }, [activePillarGrid, tenPillars]);

  const handleConfirmApprove = () => {
    if (!submissionToApprove) return;
    onApproveSubmission(submissionToApprove);
    setSubmissionToApprove(null);
    if (selectedSubmissionForDetail?.id === submissionToApprove.id) {
      setSelectedSubmissionForDetail(null);
    }
  };

  const handleConfirmReject = () => {
    if (!submissionToReject) return;
    onRejectSubmission(submissionToReject.id, rejectReason.trim());
    setSubmissionToReject(null);
    setRejectReason('');
    if (selectedSubmissionForDetail?.id === submissionToReject.id) {
      setSelectedSubmissionForDetail(null);
    }
  };

  return (
    <section
      id="terima-pendaftaran-pilar"
      className="py-2 sm:py-6 font-sans"
    >
      {/* Decorative Gold Header Divider */}
      <div className="relative flex items-center justify-center mb-4 sm:mb-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />
        <div className="absolute bg-[#043e2e] border-2 border-[#d4af37] text-amber-300 px-4 sm:px-5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2">
          <Inbox className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-300 animate-bounce" />
          <span>VERIFIKASI PENDAFTARAN 10 PILAR PSKS</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: PILIH 10 PILAR PSKS (TAMPIL KETIKA activePillarGrid === null) */}
      {/* ========================================================================= */}
      {activePillarGrid === null ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Header Box Khusus Tampilan Pilihan 10 Pilar */}
          <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-3xl p-5 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-400/40 px-3.5 py-1 rounded-full text-[11px] font-black text-amber-300 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>OTORITAS ADMIN DAERAH • {adminWilayah.toUpperCase()}</span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase">
                  Terima Pendaftaran 10 Pilar PSKS
                </h2>

                <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-3xl leading-relaxed">
                  Pusat verifikasi berkas pendaftaran mandiri dari anggota/organisasi 10 Pilar Potensi dan Sumber Kesejahteraan Sosial untuk wilayah{' '}
                  <strong className="text-amber-300 font-black">{adminWilayah}</strong>.
                </p>
              </div>

              {/* Wilayah Badge Card */}
              <div className="bg-black/30 border border-emerald-400/30 rounded-2xl p-4 shrink-0 text-left md:text-right">
                <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wider">
                  Wilayah Tugas
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
                  {adminWilayah}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 font-semibold flex items-center justify-start md:justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>{totalPending} Ajuan Perlu Tindakan</span>
                </div>
              </div>
            </div>

            {/* Global Stats Counter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-emerald-800/60">
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-emerald-200 font-bold mb-1">
                  <span>Total Semua</span>
                  <Layers className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-300" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">{totalSubmissions}</div>
              </div>

              <div className="bg-amber-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-amber-400/30">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-amber-200 font-bold mb-1">
                  <span>Menunggu</span>
                  <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-300">{totalPending}</div>
              </div>

              <div className="bg-emerald-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-emerald-400/30">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-emerald-200 font-bold mb-1">
                  <span>Disetujui</span>
                  <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-300">{totalApproved}</div>
              </div>

              <div className="bg-rose-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-rose-400/30">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-rose-200 font-bold mb-1">
                  <span>Ditolak</span>
                  <XCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-300">{totalRejected}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-xl font-black text-[#043e2e] uppercase tracking-tight flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Pilih 10 Pilar PSKS Untuk Verifikasi Ajuan</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Klik salah satu pilar di bawah untuk membuka daftar dan memproses berkas pendaftaran.
              </p>
            </div>
          </div>

          {/* 10 Pillar Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {tenPillars.map((pilar, index) => {
              const stats = pillarStats[pilar.id] || { total: 0, pending: 0, approved: 0, rejected: 0 };
              const hasPending = stats.pending > 0;

              return (
                <button
                  key={pilar.id}
                  type="button"
                  onClick={() => {
                    setActivePillarGrid(pilar.id);
                    setSelectedStatus('ALL');
                    setSearchTerm('');
                  }}
                  className={`group text-left bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1 ${
                    hasPending
                      ? 'border-amber-400 hover:border-amber-500 ring-2 ring-amber-400/20'
                      : 'border-slate-200 hover:border-emerald-600'
                  }`}
                >
                  {/* Top Accent Pill Indicator */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#043e2e] to-[#085a43] text-white flex items-center justify-center text-lg sm:text-xl shadow-md border border-amber-400/30 group-hover:scale-110 transition-transform shrink-0">
                      {pilar.icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                      Pilar {index + 1}
                    </span>
                  </div>

                  {/* Pillar Title */}
                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-sm sm:text-base font-black text-[#043e2e] group-hover:text-emerald-700 transition-colors leading-tight">
                      {pilar.short}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-snug mt-1 line-clamp-2">
                      {pilar.label}
                    </p>
                  </div>

                  {/* Status Badges Group */}
                  <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Total Ajuan:</span>
                      <span className="font-black text-slate-800">{stats.total}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] font-black text-center">
                      <div className={`p-1.5 rounded-xl border ${
                        stats.pending > 0
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        <div className="text-[9px] text-amber-700">Pending</div>
                        <div className="text-xs">{stats.pending}</div>
                      </div>

                      <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <div className="text-[9px] text-emerald-700">Diterima</div>
                        <div className="text-xs">{stats.approved}</div>
                      </div>

                      <div className="p-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                        <div className="text-[9px] text-rose-700">Ditolak</div>
                        <div className="text-xs">{stats.rejected}</div>
                      </div>
                    </div>

                    {/* Action Prompt */}
                    <div className="pt-2 flex items-center justify-between text-xs font-black text-emerald-800 group-hover:text-amber-600 transition-colors">
                      <span>Buka Tabel Ajuan</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAMPILAN 2: TABEL & KARTU AJUAN PENDAFTARAN PILAR YANG DIPILIH           */
        /* ========================================================================= */
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* Header Kontekstual Pilar Terpilih (Sangat Rapi & Padat di HP) */}
          <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              {/* Baris Navigasi Atas: Tombol Kembali + Wilayah */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActivePillarGrid(null)}
                  className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#c39e2c] active:scale-95 text-[#043e2e] font-black text-xs px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer border border-amber-200"
                >
                  <ArrowLeft className="w-4 h-4 text-[#043e2e]" />
                  <span>&larr; Kembali Ke 10 Pilar PSKS</span>
                </button>

                <div className="inline-flex items-center gap-1.5 bg-black/40 border border-emerald-400/30 px-3 py-1 rounded-full text-[11px] font-bold text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Wilayah: {adminWilayah}</span>
                </div>
              </div>

              {/* Identitas Pilar yang Sedang Dibuka */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 backdrop-blur-xs text-xl sm:text-2xl flex items-center justify-center border border-amber-400/40 shadow-sm shrink-0">
                  {activePillarInfo?.icon || '📋'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] sm:text-xs text-amber-300 font-black uppercase tracking-wider">
                    Modul Verifikasi Pendaftaran Pilar PSKS
                  </div>
                  <h2 className="text-base sm:text-2xl font-black text-white truncate leading-tight">
                    {activePillarInfo?.label || activePillarGrid}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium mt-0.5">
                    Memverifikasi berkas ajuan pendaftaran mandiri khusus anggota <strong>{activePillarInfo?.short}</strong>.
                  </p>
                </div>
              </div>

              {/* Quick Counter Khusus Pilar Ini (4 Kotak Rapi) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-white/10">
                  <div className="text-[10px] sm:text-xs text-emerald-200 font-bold">Total Ajuan</div>
                  <div className="text-lg sm:text-2xl font-black text-white">{pillarStats[activePillarGrid]?.total || 0}</div>
                </div>

                <div className={`rounded-xl p-2.5 sm:p-3 border ${
                  (pillarStats[activePillarGrid]?.pending || 0) > 0
                    ? 'bg-amber-500/25 border-amber-400/60 ring-1 ring-amber-300/40'
                    : 'bg-white/10 border-white/10'
                }`}>
                  <div className="text-[10px] sm:text-xs text-amber-200 font-bold flex items-center justify-between">
                    <span>Menunggu</span>
                    {(pillarStats[activePillarGrid]?.pending || 0) > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-amber-300">{pillarStats[activePillarGrid]?.pending || 0}</div>
                </div>

                <div className="bg-emerald-500/15 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-emerald-400/30">
                  <div className="text-[10px] sm:text-xs text-emerald-200 font-bold">Disetujui</div>
                  <div className="text-lg sm:text-2xl font-black text-emerald-300">{pillarStats[activePillarGrid]?.approved || 0}</div>
                </div>

                <div className="bg-rose-500/15 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-rose-400/30">
                  <div className="text-[10px] sm:text-xs text-rose-200 font-bold">Ditolak</div>
                  <div className="text-lg sm:text-2xl font-black text-rose-300">{pillarStats[activePillarGrid]?.rejected || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Bar: Pencarian, Tab Filter Status & Switcher Mode Tampilan HP */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-3">
            {/* Search Bar Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Cari nama, NIK, atau kecamatan...`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e] focus:bg-white transition-all shadow-xs font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Status + Mode Tampilan HP */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              {/* Tab Filter Status */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 sm:p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    selectedStatus === 'ALL'
                      ? 'bg-[#043e2e] text-amber-300 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({regionSubmissions.filter((s) => (s.pillarId || '').toLowerCase() === activePillarGrid.toLowerCase()).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    selectedStatus === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Menunggu</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                    {pillarStats[activePillarGrid]?.pending || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    selectedStatus === 'APPROVED'
                      ? 'bg-emerald-700 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Disetujui</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                    {pillarStats[activePillarGrid]?.approved || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    selectedStatus === 'REJECTED'
                      ? 'bg-rose-700 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Ditolak</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                    {pillarStats[activePillarGrid]?.rejected || 0}
                  </span>
                </button>
              </div>

              {/* Toggle Switcher Mode Tampilan Mobile: Kartu Rapi vs Tabel Data */}
              <div className="flex md:hidden items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 px-2">Mode Tampilan:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMobileViewMode('cards')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      mobileViewMode === 'cards'
                        ? 'bg-[#043e2e] text-amber-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileViewMode('table')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      mobileViewMode === 'table'
                        ? 'bg-[#043e2e] text-amber-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>Tabel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center border-2 border-slate-200">
                  <Inbox className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800">
                    Tidak Ada Pengajuan Pendaftaran Pada Pilar Ini
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {searchTerm || selectedStatus !== 'ALL'
                      ? 'Tidak ditemukan pengajuan dengan kata kunci atau filter status yang dipilih.'
                      : `Belum ada data ajuan pendaftaran ${activePillarInfo?.label} untuk wilayah ${adminWilayah}.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePillarGrid(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Pilih Pilar Lain</span>
                </button>
              </div>
            ) : (
              <>
                {/* ========================================================================= */}
                {/* 1. KHUSUS TAMPILAN HP: Kartu Pendaftar Ergonomis, Terstruktur & Sangat Rapi */}
                {/* ========================================================================= */}
                <div className={`md:hidden p-3 space-y-3.5 ${mobileViewMode === 'cards' ? 'block' : 'hidden'}`}>
                  {filteredSubmissions.map((sub, index) => {
                    const isPending = sub.status === 'PENDING';
                    const isApproved = sub.status === 'APPROVED';
                    const isRejected = sub.status === 'REJECTED';
                    const safeName = sub.nama || sub.recordData?.nama || 'Pemohon PSKS';
                    const safeNik = sub.nik || sub.recordData?.nik || '-';
                    const safeKec = sub.kec || sub.recordData?.kec || '-';
                    const safeHp = sub.hp || sub.recordData?.hp || '-';

                    return (
                      <div
                        key={sub.id}
                        className={`bg-white rounded-2xl p-4 border shadow-xs space-y-3 transition-all ${
                          isPending
                            ? 'border-amber-300 border-l-4 border-l-amber-500 bg-amber-50/20'
                            : isApproved
                            ? 'border-emerald-200 border-l-4 border-l-emerald-600 bg-emerald-50/10'
                            : 'border-rose-200 border-l-4 border-l-rose-500 bg-rose-50/10'
                        }`}
                      >
                        {/* Header Kartu: No Urut + Waktu + Status */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#043e2e] text-amber-300 text-[11px] font-black flex items-center justify-center shadow-xs shrink-0">
                              {index + 1}
                            </span>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{sub.submittedAtFormatted || 'Baru Saja'}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0">
                              <Clock className="w-2.5 h-2.5 text-amber-700 animate-pulse" />
                              <span>Menunggu</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                              <span>Diterima / Sah</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0">
                              <XCircle className="w-2.5 h-2.5 text-rose-700" />
                              <span>Ditolak</span>
                            </span>
                          )}
                        </div>

                        {/* Identitas Pemohon */}
                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-snug break-words">
                            {safeName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono mt-1">
                            <span className="font-semibold text-slate-400 text-[11px]">NIK:</span>
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {safeNik}
                            </span>
                          </div>
                        </div>

                        {/* Lokasi & Kontak */}
                        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-900">{sub.wilayah}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600">Kec. {safeKec}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-slate-600">
                            <a
                              href={safeHp !== '-' ? `tel:${safeHp}` : undefined}
                              className="flex items-center gap-1.5 font-mono text-blue-700 hover:underline font-bold"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{safeHp}</span>
                            </a>
                            <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              Oleh: <strong className="text-slate-600">{sub.submittedByName || sub.submittedByUsername || 'User'}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Alasan Penolakan jika ada */}
                        {isRejected && sub.rejectedReason && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs space-y-0.5">
                            <div className="font-bold flex items-center gap-1 text-rose-900">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Alasan Penolakan:</span>
                            </div>
                            <p className="text-rose-700 leading-relaxed">{sub.rejectedReason}</p>
                          </div>
                        )}

                        {/* Tombol Aksi HP (Touch-Friendly min 44px, 2 Baris Rapi untuk Pending) */}
                        <div className="pt-1 space-y-2">
                          {isPending && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSubmissionToApprove(sub)}
                                className="flex-1 min-h-[44px] bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all border border-emerald-500/40"
                              >
                                <Check className="w-4 h-4" />
                                <span>Terima & Sahkan</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSubmissionToReject(sub);
                                  setRejectReason('');
                                }}
                                className="min-h-[44px] px-4 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                              >
                                <X className="w-4 h-4 text-rose-600" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          )}

                          {isApproved && (
                            <div className="min-h-[40px] bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Telah Sah Terdaftar & Masuk Database</span>
                            </div>
                          )}

                          {isRejected && (
                            <div className="min-h-[40px] bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black text-rose-800">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Pengajuan Pendaftaran Ditolak</span>
                            </div>
                          )}

                          {/* Tombol Lihat Berkas Formulir Lengkap */}
                          <button
                            type="button"
                            onClick={() => setSelectedSubmissionForDetail(sub)}
                            className="w-full min-h-[42px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 shadow-xs"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                            <span>Lihat Berkas Formulir Lengkap</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ========================================================================= */}
                {/* 2. KHUSUS TAMPILAN LAPTOP/DESKTOP ATAU MODE TABEL DI HP                   */}
                {/* ========================================================================= */}
                <div className={`overflow-x-auto ${mobileViewMode === 'table' ? 'block' : 'hidden md:block'}`}>
                  {/* Prompt Geser Khusus HP jika Mode Tabel Aktif */}
                  <div className="md:hidden bg-amber-50 border-b border-amber-200 px-3.5 py-2 text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                    <span className="animate-bounce">👉</span>
                    <span>Geser tabel ke samping kanan untuk melihat kolom lengkap & tombol verifikasi</span>
                  </div>

                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#043e2e] text-white border-b-2 border-[#d4af37]">
                      <tr>
                        <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap">No</th>
                        <th className="py-3.5 px-3 font-bold whitespace-nowrap">Waktu Submit</th>
                        <th className="py-3.5 px-3 font-bold whitespace-nowrap">Identitas Pemohon / Anggota</th>
                        <th className="py-3.5 px-3 font-bold whitespace-nowrap">Kecamatan & Wilayah</th>
                        <th className="py-3.5 px-3 font-bold whitespace-nowrap">Nomor Kontak</th>
                        <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Status Ajuan</th>
                        <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredSubmissions.map((sub, index) => {
                        const isPending = sub.status === 'PENDING';
                        const isApproved = sub.status === 'APPROVED';
                        const isRejected = sub.status === 'REJECTED';
                        const safeName = sub.nama || sub.recordData?.nama || 'Pemohon PSKS';
                        const safeNik = sub.nik || sub.recordData?.nik || '-';
                        const safeKec = sub.kec || sub.recordData?.kec || '-';
                        const safeHp = sub.hp || sub.recordData?.hp || '-';

                        return (
                          <tr
                            key={sub.id}
                            className="hover:bg-amber-50/40 transition-colors"
                          >
                            <td className="py-3.5 px-3 font-bold text-center text-slate-500">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                              <div className="flex items-center gap-1.5 font-medium text-xs">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{sub.submittedAtFormatted || 'Baru Saja'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Akun: <strong className="text-slate-600">{sub.submittedByName || sub.submittedByUsername || 'User'}</strong>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <div className="font-black text-slate-900 text-sm">
                                {safeName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                NIK: {safeNik}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-800">
                                {sub.wilayah}
                              </div>
                              <div className="text-xs text-slate-500">
                                Kec. {safeKec}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-slate-700">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{safeHp}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-black">
                                  <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                                  <span>Menunggu Verifikasi</span>
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-black">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>Diterima / Sah</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-full text-xs font-black">
                                  <XCircle className="w-3 h-3 text-rose-700" />
                                  <span>Ditolak</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Button Detail */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubmissionForDetail(sub)}
                                  title="Lihat Formulir Lengkap"
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer active:scale-95"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Button Approve / Reject if Pending */}
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setSubmissionToApprove(sub)}
                                      title="Setujui Pendaftaran"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Terima</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubmissionToReject(sub);
                                        setRejectReason('');
                                      }}
                                      title="Tolak Pendaftaran"
                                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Tolak</span>
                                    </button>
                                  </>
                                )}

                                {isApproved && (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                    ✓ Tercatat Resmi
                                  </span>
                                )}

                                {isRejected && (
                                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200" title={sub.rejectedReason || 'Tanpa catatan'}>
                                    Ditolak
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Bottom Back to 10 Pillars Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActivePillarGrid(null)}
              className="w-full sm:w-auto bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#d4af37]/40 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>&larr; Kembali Ke Pilihan 10 Pilar PSKS</span>
            </button>
            <div className="text-[11px] sm:text-xs text-slate-500 font-semibold text-center sm:text-right">
              <span>PSKS JABAR Provinsi Jawa Barat • Otoritas Verifikasi Daerah</span>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL 1: DETAIL FORMULIR PENDAFTARAN LENGKAP */}
      {/* ========================================================================= */}
      {selectedSubmissionForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4af37] max-w-2xl w-full my-auto max-h-[90vh] flex flex-col text-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white p-5 sm:p-6 flex items-center justify-between border-b-2 border-[#d4af37]">
              <div>
                <span className="bg-[#d4af37] text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                  Detail Pengajuan Mandiri
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Pendaftaran {PILLARS_CONFIG[selectedSubmissionForDetail.pillarId]?.title || selectedSubmissionForDetail.pillarId.toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionForDetail(null)}
                className="text-white/80 hover:text-white bg-black/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Meta Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Status Verifikasi</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full mt-1 ${
                    selectedSubmissionForDetail.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : selectedSubmissionForDetail.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {selectedSubmissionForDetail.status === 'PENDING' && 'Menunggu Verifikasi'}
                    {selectedSubmissionForDetail.status === 'APPROVED' && 'Telah Disetujui & Masuk Rekapitulasi'}
                    {selectedSubmissionForDetail.status === 'REJECTED' && 'Ditolak'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Pengaju (User)</span>
                  <span className="font-bold text-slate-800">{selectedSubmissionForDetail.submittedByName} ({selectedSubmissionForDetail.submittedByUsername})</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Waktu Submit</span>
                  <span className="font-bold text-slate-800">{selectedSubmissionForDetail.submittedAtFormatted || '-'}</span>
                </div>
              </div>

              {/* Data Fields */}
              <div className="space-y-2">
                <h4 className="font-black text-[#043e2e] text-xs uppercase tracking-wider">
                  Rincian Data Formulir
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Nama Lengkap</span>
                    <span className="font-black text-slate-900">{selectedSubmissionForDetail.nama || selectedSubmissionForDetail.recordData?.nama || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">NIK / Nomor Registrasi</span>
                    <span className="font-mono font-bold text-slate-900">{selectedSubmissionForDetail.nik || selectedSubmissionForDetail.recordData?.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Wilayah Kabupaten/Kota</span>
                    <span className="font-bold text-slate-900">{selectedSubmissionForDetail.wilayah}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Kecamatan</span>
                    <span className="font-bold text-slate-900">{selectedSubmissionForDetail.kec || selectedSubmissionForDetail.recordData?.kec || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Nomor Handphone</span>
                    <span className="font-mono font-bold text-slate-900">{selectedSubmissionForDetail.hp || selectedSubmissionForDetail.recordData?.hp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Jenis Kelamin</span>
                    <span className="font-bold text-slate-900">{selectedSubmissionForDetail.recordData?.jenisKelamin || '-'}</span>
                  </div>
                  {selectedSubmissionForDetail.recordData?.pendidikan && (
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">Pendidikan</span>
                      <span className="font-bold text-slate-900">{selectedSubmissionForDetail.recordData.pendidikan}</span>
                    </div>
                  )}
                  {selectedSubmissionForDetail.recordData?.noTglSertifikasi && (
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">No / Tgl Sertifikasi / SK</span>
                      <span className="font-bold text-slate-900">{selectedSubmissionForDetail.recordData.noTglSertifikasi}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan Penolakan jika ada */}
              {selectedSubmissionForDetail.status === 'REJECTED' && selectedSubmissionForDetail.rejectedReason && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                  <span className="font-black block mb-1">Catatan Penolakan dari Admin:</span>
                  <p>{selectedSubmissionForDetail.rejectedReason}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-100 p-3.5 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              {selectedSubmissionForDetail.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionToReject(selectedSubmissionForDetail);
                      setRejectReason('');
                    }}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-black text-xs cursor-pointer shadow-xs transition-all active:scale-95 text-center"
                  >
                    Tolak Pengajuan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionToApprove(selectedSubmissionForDetail)}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui & Terbitkan Rekap</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionForDetail(null)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer active:scale-95 text-center"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI SETUJUI (APPROVE) */}
      {/* ========================================================================= */}
      {submissionToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-600 max-w-md w-full p-5 sm:p-6 text-center space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-emerald-300">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Setujui Pendaftaran Anggota?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pendaftaran atas nama <strong>{submissionToApprove.nama || submissionToApprove.recordData?.nama || 'Pemohon'}</strong> ({submissionToApprove.wilayah}) akan disahkan dan langsung dimasukkan ke database resmi pilar <strong>{PILLARS_CONFIG[submissionToApprove.pillarId]?.title}</strong>.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubmissionToApprove(null)}
                className="min-h-[44px] flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="min-h-[44px] flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Ya, Setujui Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONFIRMASI TOLAK (REJECT) DENGAN ALASAN */}
      {/* ========================================================================= */}
      {submissionToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-600 max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-300 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Tolak Pengajuan Pendaftaran?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Pemohon: <strong>{submissionToReject.nama || submissionToReject.recordData?.nama || 'Pemohon'}</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alasan Penolakan (Akan Dilihat Oleh Pemohon):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Berkas nomor NIK tidak valid, sertifikat belum dilampirkan..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-600 font-medium"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubmissionToReject(null)}
                className="min-h-[44px] flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="min-h-[44px] flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
