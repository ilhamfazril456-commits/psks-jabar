import React, { useState, useMemo } from 'react';
import {
  PillarRegistrationSubmission,
  UserSession,
  PillarId,
} from '../types';
import { PILLARS_CONFIG, KAB_KOTA_ONLY } from '../data/initialData';
import { BackToHomeButton } from './BackToHomeButton';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Calendar,
  Phone,
  User,
  MapPin,
  Eye,
  X,
  FileText,
  Building2,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

interface UserRegistrationHistoryPageProps {
  session: UserSession;
  submissions: PillarRegistrationSubmission[];
  onBackToHome: () => void;
  onNavigateToPillar?: (pillarId: PillarId) => void;
}

export const UserRegistrationHistoryPage: React.FC<UserRegistrationHistoryPageProps> = ({
  session,
  submissions,
  onBackToHome,
  onNavigateToPillar,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<PillarRegistrationSubmission | null>(null);

  // Get local IDs submitted by this browser session
  const localSubmissionIds = useMemo(() => {
    try {
      const raw = localStorage.getItem('psks_my_submission_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  // Filter submissions that belong strictly to the current user or this browser session
  const userSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. If user is logged in as 'user', match by ID, username, name, or locally saved submission IDs
      if (session.role === 'user') {
        const matchUserId = Boolean(session.userId && sub.submittedByUserId === session.userId);
        const matchUsername = Boolean(
          session.username &&
            (sub.submittedByUsername || '').toLowerCase().trim() === session.username.toLowerCase().trim()
        );
        const matchName = Boolean(
          session.nama &&
            (sub.submittedByName || '').toLowerCase().trim() === session.nama.toLowerCase().trim()
        );
        const matchLocalId = localSubmissionIds.includes(sub.id);

        if (matchUserId || matchUsername || matchName || matchLocalId) return true;
        return false;
      }

      // 2. If user is admin/superadmin/developer accessing user history mode, show their submitted items
      if (session.role === 'admin' || session.role === 'superadmin' || session.role === 'developer') {
        const matchLocalId = localSubmissionIds.includes(sub.id);
        const matchUserId = Boolean(session.userId && sub.submittedByUserId === session.userId);
        const matchName = Boolean(
          session.nama &&
            (sub.submittedByName || '').toLowerCase().trim() === session.nama.toLowerCase().trim()
        );
        if (matchLocalId || matchUserId || matchName) return true;
        return false;
      }

      // 3. Guest / Tamu Publik: ONLY match submissions submitted from this local browser session
      if (localSubmissionIds.includes(sub.id)) return true;

      // Never expose other users' submissions to public guest
      return false;
    });
  }, [submissions, session, localSubmissionIds]);

  // Display submissions filtered strictly from user's own submissions
  const displaySubmissions = useMemo(() => {
    const pool = userSubmissions;

    return pool.filter((sub) => {
      // Filter status
      if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;

      // Filter search
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const nama = (sub.nama || sub.recordData?.nama || '').toLowerCase();
        const nik = (sub.nik || sub.recordData?.nik || '').toLowerCase();
        const wilayah = (sub.wilayah || '').toLowerCase();
        const kec = (sub.kec || sub.recordData?.kec || '').toLowerCase();
        const pilar = (PILLARS_CONFIG[sub.pillarId]?.title || sub.pillarId).toLowerCase();
        const id = (sub.id || '').toLowerCase();

        return (
          nama.includes(q) ||
          nik.includes(q) ||
          wilayah.includes(q) ||
          kec.includes(q) ||
          pilar.includes(q) ||
          id.includes(q)
        );
      }

      return true;
    });
  }, [userSubmissions, statusFilter, searchTerm]);

  // Statistics counters strictly for this user's submissions
  const stats = useMemo(() => {
    const total = userSubmissions.length;
    const pending = userSubmissions.filter((s) => s.status === 'PENDING').length;
    const approved = userSubmissions.filter((s) => s.status === 'APPROVED').length;
    const rejected = userSubmissions.filter((s) => s.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [userSubmissions]);

  const formatFullDate = (dateStr?: string | number) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/90 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. TOP NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-top-user-reg-history" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>PORTAL PENDAFTARAN MANDIRI</span>
            </span>
          </div>
        </div>

        {/* 2. HERO HEADER BANNER */}
        <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-400/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <span>MONITORING STATUS PENDAFTARAN 10 PILAR PSKS JAWA BARAT</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/40 px-3 py-1 rounded-full text-xs font-bold text-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Privasi Akun Terproteksi (Hanya Pengajuan Anda)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight">
              Riwayat Pengajuan Pendaftaran
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-3xl leading-relaxed">
              Pantau rekam jejak dan status verifikasi berkas formulir pendaftaran 10 Pilar PSKS milik akun/perangkat Anda. Demi menjaga keamanan dan kerahasiaan identitas, data pendaftaran bersifat privat dan hanya dapat diakses oleh pemohon yang bersangkutan.
            </p>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-emerald-800/60">
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
                <div className="flex items-center justify-between text-xs text-emerald-200 font-bold mb-1">
                  <span>Total Pengajuan</span>
                  <ClipboardList className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total}</div>
              </div>

              <div className="bg-amber-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-amber-400/30">
                <div className="flex items-center justify-between text-xs text-amber-200 font-bold mb-1">
                  <span>⏳ Menunggu Verifikasi</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">{stats.pending}</div>
              </div>

              <div className="bg-emerald-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-emerald-400/30">
                <div className="flex items-center justify-between text-xs text-emerald-200 font-bold mb-1">
                  <span>✅ Diterima (Acc)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-300">{stats.approved}</div>
              </div>

              <div className="bg-rose-500/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-rose-400/30">
                <div className="flex items-center justify-between text-xs text-rose-200 font-bold mb-1">
                  <span>❌ Ditolak</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-300">{stats.rejected}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SEARCH & FILTER CONTROLS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIK, pilar, atau nomor registrasi..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#043e2e] focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0 self-start md:self-auto flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#043e2e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⏳ Menunggu ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✅ Diterima ({stats.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ❌ Ditolak ({stats.rejected})
            </button>
          </div>
        </div>

        {/* 4. SUBMISSIONS LIST / CARDS */}
        <div className="space-y-4">
          {displaySubmissions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center border-2 border-emerald-200">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">
                  Belum Ada Riwayat Pengajuan
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'Tidak ada data pengajuan yang sesuai dengan kriteria filter atau pencarian Anda.'
                    : 'Anda belum mengajukan pendaftaran ke salah satu dari 10 Pilar PSKS. Buka salah satu kartu pilar di Beranda untuk mendaftar mandiri.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#065e44] text-amber-300 text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-300" />
                <span>Buka 10 Pilar di Beranda</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displaySubmissions.map((sub, index) => {
                const isPending = sub.status === 'PENDING';
                const isApproved = sub.status === 'APPROVED';
                const isRejected = sub.status === 'REJECTED';
                const pilarInfo = PILLARS_CONFIG[sub.pillarId] || {
                  id: sub.pillarId,
                  title: sub.pillarId.toUpperCase(),
                  shortName: sub.pillarId.toUpperCase(),
                  icon: '📋',
                };

                return (
                  <div
                    key={sub.id}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-sm hover:shadow-md relative overflow-hidden ${
                      isPending
                        ? 'border-amber-300 ring-2 ring-amber-400/20'
                        : isApproved
                        ? 'border-emerald-300 ring-2 ring-emerald-400/20'
                        : 'border-rose-300 ring-2 ring-rose-400/20'
                    }`}
                  >
                    {/* Top Status Banner Line */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-2 ${
                        isPending
                          ? 'bg-amber-400'
                          : isApproved
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                      {/* Left: Pillar & Applicant Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl">{pilarInfo.icon}</span>
                          <span className="text-xs font-black text-[#043e2e] uppercase bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            Pilar {pilarInfo.title}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ID: {sub.id}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900">
                            {sub.nama || sub.recordData?.nama || 'Pemohon'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1 font-medium">
                            <span className="flex items-center gap-1 font-mono">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              NIK: {sub.nik || sub.recordData?.nik || '-'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-600" />
                              {sub.wilayah} • Kec. {sub.kec || sub.recordData?.kec || '-'}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {sub.hp || sub.recordData?.hp || '-'}
                            </span>
                          </div>
                        </div>

                        {/* Timing details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">
                              📅 Waktu Pengajuan
                            </span>
                            <span className="font-bold text-slate-800">
                              {sub.submittedAtFormatted || formatFullDate(sub.submittedAt)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">
                              {isPending && '⏳ Status Pemeriksaan'}
                              {isApproved && '✅ Waktu Disetujui (Acc)'}
                              {isRejected && '❌ Waktu Penolakan'}
                            </span>
                            <span className={`font-bold ${
                              isPending
                                ? 'text-amber-800 font-black'
                                : isApproved
                                ? 'text-emerald-800'
                                : 'text-rose-800'
                            }`}>
                              {isPending && 'Dalam Antrean Petugas Admin Wilayah'}
                              {isApproved && (formatFullDate(sub.reviewedAt) || 'Telah Diverifikasi')}
                              {isRejected && (formatFullDate(sub.reviewedAt) || 'Telah Diperiksa')}
                            </span>
                            {sub.reviewedBy && (
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Oleh: <strong>{sub.reviewedBy}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rejection Notes Banner */}
                        {isRejected && sub.reviewNotes && (
                          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 text-rose-900 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-black text-rose-950">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Alasan Penolakan Administrasi:</span>
                            </div>
                            <p className="font-medium pl-5">{sub.reviewNotes}</p>
                          </div>
                        )}

                        {/* Approval Success Banner */}
                        {isApproved && (
                          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 text-emerald-900 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold">
                              Selamat! Data Anda telah resmi disahkan dan tercantum di Rekapitulasi Data {pilarInfo.title} wilayah {sub.wilayah}.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Status Pill & Action */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t sm:border-t-0 border-slate-100">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 px-4 py-2 rounded-2xl text-xs font-black shadow-xs">
                            <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                            <span>Menunggu Persetujuan</span>
                          </span>
                        )}

                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 px-4 py-2 rounded-2xl text-xs font-black shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Diterima / Disetujui</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-950 border border-rose-300 px-4 py-2 rounded-2xl text-xs font-black shadow-xs">
                            <XCircle className="w-4 h-4 text-rose-700" />
                            <span>Pengajuan Ditolak</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(sub)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#043e2e] text-white font-black text-xs shadow-sm transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>Lihat Salinan Berkas</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. BOTTOM NAVIGATION BAR */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-user-reg-history" />
          <div className="text-xs text-slate-500 font-semibold">
            <span>Dinas Sosial Provinsi Jawa Barat • Sistem Informasi PSKS</span>
          </div>
        </div>

      </div>

      {/* MODAL SALINAN BERKAS PENDAFTARAN */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4af37] max-w-2xl w-full my-auto max-h-[90vh] flex flex-col text-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white p-5 sm:p-6 flex items-center justify-between border-b-2 border-[#d4af37]">
              <div>
                <span className="bg-[#d4af37] text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                  Bukti Tanda Terima Pendaftaran Mandiri
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Formulir {PILLARS_CONFIG[selectedSubmission.pillarId]?.title || selectedSubmission.pillarId.toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="text-white/80 hover:text-white bg-black/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Status Verifikasi</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full mt-1 ${
                    selectedSubmission.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : selectedSubmission.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {selectedSubmission.status === 'PENDING' && '⏳ Menunggu Persetujuan Admin Wilayah'}
                    {selectedSubmission.status === 'APPROVED' && '✅ Telah Disahkan Masuk Database'}
                    {selectedSubmission.status === 'REJECTED' && '❌ Berkas Ditolak'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">ID Pendaftaran</span>
                  <span className="font-mono font-bold text-slate-800">{selectedSubmission.id}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Waktu Pengajuan</span>
                  <span className="font-bold text-slate-800">{selectedSubmission.submittedAtFormatted || formatFullDate(selectedSubmission.submittedAt)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-[#043e2e] text-xs uppercase tracking-wider">
                  Rincian Data Isian Pemohon
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Nama Lengkap</span>
                    <span className="font-black text-slate-900">{selectedSubmission.nama || selectedSubmission.recordData?.nama}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">NIK</span>
                    <span className="font-mono font-bold text-slate-900">{selectedSubmission.nik || selectedSubmission.recordData?.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Kabupaten / Kota</span>
                    <span className="font-bold text-slate-900">{selectedSubmission.wilayah}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Kecamatan</span>
                    <span className="font-bold text-slate-900">{selectedSubmission.kec || selectedSubmission.recordData?.kec || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Nomor Handphone</span>
                    <span className="font-mono font-bold text-slate-900">{selectedSubmission.hp || selectedSubmission.recordData?.hp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Jenis Kelamin</span>
                    <span className="font-bold text-slate-900">{selectedSubmission.recordData?.jenisKelamin || '-'}</span>
                  </div>
                </div>
              </div>

              {selectedSubmission.status === 'REJECTED' && selectedSubmission.reviewNotes && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                  <span className="font-black block mb-1">Catatan Penolakan Admin:</span>
                  <p>{selectedSubmission.reviewNotes}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
