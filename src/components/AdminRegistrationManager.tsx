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
      className="py-4 sm:py-8 font-sans"
    >
      {/* Decorative Gold Header Divider */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />
        <div className="absolute bg-[#043e2e] border-2 border-[#d4af37] text-amber-300 px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2">
          <Inbox className="w-4 h-4 text-amber-300 animate-bounce" />
          <span>VERIFIKASI PENDAFTARAN 10 PILAR PSKS</span>
        </div>
      </div>

      {/* Hero Header Box */}
      <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-400/40 px-3.5 py-1 rounded-full text-[11px] font-black text-amber-300 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>OTORITAS ADMIN DAERAH • {adminWilayah.toUpperCase()}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Terima Pendaftaran 10 Pilar PSKS
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-3xl leading-relaxed">
              Pusat verifikasi berkas pendaftaran mandiri dari anggota/organisasi 10 Pilar Potensi dan Sumber Kesejahteraan Sosial untuk wilayah{' '}
              <strong className="text-amber-300 font-black">{adminWilayah}</strong>.
            </p>
          </div>

          {/* Wilayah Badge Card */}
          <div className="bg-black/30 border border-emerald-400/30 rounded-2xl p-4 shrink-0 text-center md:text-right">
            <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wider">
              Wilayah Tugas
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
              {adminWilayah}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 font-semibold flex items-center justify-center md:justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{totalPending} Ajuan Perlu Tindakan</span>
            </div>
          </div>
        </div>

        {/* Global Stats Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-800/60">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-bold mb-1">
              <span>Total Semua Ajuan</span>
              <Layers className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-black text-white">{totalSubmissions}</div>
          </div>

          <div className="bg-amber-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-amber-400/30">
            <div className="flex items-center justify-between text-xs text-amber-200 font-bold mb-1">
              <span>Menunggu Verifikasi</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{totalPending}</div>
          </div>

          <div className="bg-emerald-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-emerald-400/30">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-bold mb-1">
              <span>Telah Disetujui</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{totalApproved}</div>
          </div>

          <div className="bg-rose-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-rose-400/30">
            <div className="flex items-center justify-between text-xs text-rose-200 font-bold mb-1">
              <span>Ditolak</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-300">{totalRejected}</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: GRID 10 BUTTON PILAR PSKS (MODERN & ELEGAN) */}
      {/* ========================================================================= */}
      {activePillarGrid === null ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#043e2e] uppercase tracking-tight flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <span>Pilih 10 Pilar PSKS Untuk Verifikasi Ajuan</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Klik salah satu pilar di bawah untuk membuka tabel dan memproses ajuan pendaftaran.
              </p>
            </div>
          </div>

          {/* 10 Pillar Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                  className={`group text-left bg-white rounded-3xl p-5 border-2 transition-all duration-300 shadow-md hover:shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1 ${
                    hasPending
                      ? 'border-amber-400 hover:border-amber-500 ring-2 ring-amber-400/20'
                      : 'border-slate-200 hover:border-emerald-600'
                  }`}
                >
                  {/* Top Accent Pill Indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#043e2e] to-[#085a43] text-white flex items-center justify-center text-xl shadow-md border border-amber-400/30 group-hover:scale-110 transition-transform">
                      {pilar.icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                      Pilar {index + 1}
                    </span>
                  </div>

                  {/* Pillar Title */}
                  <div className="mb-4">
                    <h4 className="text-sm sm:text-base font-black text-[#043e2e] group-hover:text-emerald-700 transition-colors leading-tight">
                      {pilar.short}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-snug mt-1 line-clamp-2">
                      {pilar.label}
                    </p>
                  </div>

                  {/* Status Badges Group */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
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
        /* TAMPILAN 2: TABEL AJUAN PENDAFTARAN PILAR YANG DIPILIH */
        /* ========================================================================= */
        <div className="space-y-6 animate-fadeIn">
          {/* Top Bar for Selected Pillar with Back Button */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setActivePillarGrid(null)}
                className="bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-extrabold text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all shadow-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer border border-[#d4af37]/40 active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                <span>Kembali<span className="hidden sm:inline"> Ke 10 Pilar PSKS</span></span>
              </button>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg">{activePillarInfo?.icon}</span>
                  <h3 className="text-sm sm:text-lg font-black text-[#043e2e] uppercase leading-tight">
                    Tabel Pengajuan: {activePillarInfo?.label}
                  </h3>
                </div>
                <p className="text-[10.5px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                  Wilayah: <strong>{adminWilayah}</strong> • {filteredSubmissions.length} pengajuan ditampilkan
                </p>
              </div>
            </div>

            {/* Status Filter Tab Pills */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-[11px] sm:text-xs font-bold shrink-0 self-start md:self-auto flex-wrap gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setSelectedStatus('ALL')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedStatus === 'ALL'
                    ? 'bg-[#043e2e] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({regionSubmissions.filter((s) => s.pillarId === activePillarGrid).length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('PENDING')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedStatus === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menunggu ({pillarStats[activePillarGrid]?.pending || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('APPROVED')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedStatus === 'APPROVED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disetujui ({pillarStats[activePillarGrid]?.approved || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('REJECTED')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedStatus === 'REJECTED'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ditolak ({pillarStats[activePillarGrid]?.rejected || 0})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Cari nama, NIK, atau kecamatan pada pengajuan ${activePillarInfo?.short}...`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e] focus:bg-white transition-all shadow-xs font-medium"
              />
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-4">
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
              <div className="overflow-x-auto">
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
                              Akun: <strong className="text-slate-600">{sub.submittedByName}</strong>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-black text-slate-900 text-sm">
                              {sub.nama || sub.recordData.nama}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              NIK: {sub.nik || sub.recordData.nik || '-'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {sub.wilayah}
                            </div>
                            <div className="text-xs text-slate-500">
                              Kec. {sub.kec || sub.recordData.kec || '-'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-slate-700">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{sub.hp || sub.recordData.hp || '-'}</span>
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
            )}
          </div>

          {/* Bottom Back to 10 Pillars Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActivePillarGrid(null)}
              className="bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[#d4af37]/40"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>&larr; Kembali Ke Pilihan 10 Pilar PSKS</span>
            </button>
            <div className="text-xs text-slate-500 font-semibold">
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
                    <span className="font-black text-slate-900">{selectedSubmissionForDetail.nama || selectedSubmissionForDetail.recordData.nama}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">NIK / Nomor Registrasi</span>
                    <span className="font-mono font-bold text-slate-900">{selectedSubmissionForDetail.nik || selectedSubmissionForDetail.recordData.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Wilayah Kabupaten/Kota</span>
                    <span className="font-bold text-slate-900">{selectedSubmissionForDetail.wilayah}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Kecamatan</span>
                    <span className="font-bold text-slate-900">{selectedSubmissionForDetail.kec || selectedSubmissionForDetail.recordData.kec || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Nomor Handphone</span>
                    <span className="font-mono font-bold text-slate-900">{selectedSubmissionForDetail.hp || selectedSubmissionForDetail.recordData.hp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Jenis Kelamin</span>
                    <span className="font-bold text-slate-900">{selectedSubmissionForDetail.recordData.jenisKelamin || '-'}</span>
                  </div>
                  {selectedSubmissionForDetail.recordData.pendidikan && (
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">Pendidikan</span>
                      <span className="font-bold text-slate-900">{selectedSubmissionForDetail.recordData.pendidikan}</span>
                    </div>
                  )}
                  {selectedSubmissionForDetail.recordData.noTglSertifikasi && (
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
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-end gap-2">
              {selectedSubmissionForDetail.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionToReject(selectedSubmissionForDetail);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-sm transition-all"
                  >
                    Tolak Pengajuan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionToApprove(selectedSubmissionForDetail)}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui & Terbitkan Rekap</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionForDetail(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
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
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-600 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Setujui Pendaftaran Anggota?
              </h3>
              <p className="text-xs text-slate-600">
                Pendaftaran atas nama <strong>{submissionToApprove.nama || submissionToApprove.recordData.nama}</strong> ({submissionToApprove.wilayah}) akan disahkan dan langsung dimasukkan ke tabel resmi pilar <strong>{PILLARS_CONFIG[submissionToApprove.pillarId]?.title}</strong>.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubmissionToApprove(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-md transition-all"
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
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-600 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-300 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Tolak Pengajuan Pendaftaran?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Pemohon: <strong>{submissionToReject.nama || submissionToReject.recordData.nama}</strong>
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

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubmissionToReject(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md transition-all"
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
