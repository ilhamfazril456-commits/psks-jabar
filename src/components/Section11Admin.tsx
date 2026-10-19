import React from 'react';
import { UserSession, PillarRegistrationSubmission, AppSettings } from '../types';
import { isSubmissionPendingSuperadmin } from '../utils/submissionStatus';
import { OfficialPsksLogo } from './OfficialPsksLogo';
import {
  Wrench,
  ArrowRight,
  Radio,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Activity,
  CheckCircle2,
  Lock,
  Sparkles,
  History,
  Users,
  ClipboardList,
  Volume2,
  MessageSquare,
  Check,
  HelpCircle,
  FileDown,
  Layers,
  UserCheck,
  Share2,
  Globe,
  Video,
  Image as ImageIcon,
  Info,
  Building2,
  Key,
} from 'lucide-react';

interface Section11AdminProps {
  session: UserSession;
  appSettings?: AppSettings;
  onOpenAccountConsole: () => void;
  onOpenMonitoringConsole: () => void;
  onOpenActivityLogConsole?: () => void;
  onOpenMaintenanceConsole: () => void;
  onOpenUserAccountConsole: () => void;
  onOpenTaskManagerConsole: () => void;
  onOpenAnnouncementConsole: () => void;
  onOpenFloatingWaConsole?: () => void;
  onOpenFaqConsole?: () => void;
  onOpenDocumentRepoConsole?: () => void;
  onOpenBackgroundLogoConsole?: () => void;
  onOpenProfileKadinasConsole?: () => void;
  onOpenSocialMediaConsole?: () => void;
  onOpenRegionalLogoConsole?: () => void;
  onOpenPinSecurityConsole?: () => void;
  onOpenWebsiteInfoConsole?: () => void;
  submissions?: PillarRegistrationSubmission[];
  pendingCount?: number;
}

export const Section11Admin: React.FC<Section11AdminProps> = ({
  session,
  appSettings,
  onOpenAccountConsole,
  onOpenMonitoringConsole,
  onOpenActivityLogConsole,
  onOpenMaintenanceConsole,
  onOpenUserAccountConsole,
  onOpenTaskManagerConsole,
  onOpenAnnouncementConsole,
  onOpenFloatingWaConsole,
  onOpenFaqConsole,
  onOpenDocumentRepoConsole,
  onOpenBackgroundLogoConsole,
  onOpenProfileKadinasConsole,
  onOpenSocialMediaConsole,
  onOpenRegionalLogoConsole,
  onOpenPinSecurityConsole,
  onOpenWebsiteInfoConsole,
  submissions = [],
  pendingCount,
}) => {
  const isMasterAdmin =
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) &&
    session.statusActive === 'SAH_TERDAFTAR';

  const pendingSuperadminCount = React.useMemo(() => {
    if (typeof pendingCount === 'number') return pendingCount;
    if (!submissions || submissions.length === 0) return 0;
    return submissions.filter(isSubmissionPendingSuperadmin).length;
  }, [submissions, pendingCount]);

  const hasPendingSuperadmin = pendingSuperadminCount > 0;

  if (!isMasterAdmin) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 my-8 sm:my-14">
      {/* Decorative Gold Divider */}
      <div className="w-full flex items-center justify-center my-4 sm:my-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
      </div>

      <div className="flex flex-col items-center text-center">
        {/* Section Heading */}
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f2b5c] tracking-tight uppercase mb-1.5 sm:mb-2">
          Kredensial & Otorisasi Sistem
        </h3>

        {/* Simple & Concise Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl mb-6 leading-relaxed">
          Pusat kendali dan otorisasi terpadu pengelolaan akun admin wilayah 27 Kab/Kota, monitoring real-time, dan pemeliharaan sistem.
        </p>

        {/* 4 Label Telemetri Sistem: Compact 2x2 grid pada HP (tidak bertingkat 4), flex row pada tablet & desktop */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm sm:max-w-none sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2.5 mb-6 sm:mb-8 text-[10px] xs:text-[11px] sm:text-xs font-bold text-slate-700 px-1 sm:px-0">
          <span className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200/90 py-1.5 sm:py-1 px-2.5 sm:px-3 rounded-lg sm:rounded-xl shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">27 Wilayah Terkoneksi</span>
          </span>
          <span className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200/90 py-1.5 sm:py-1 px-2.5 sm:px-3 rounded-lg sm:rounded-xl shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">Telemetri Real-Time</span>
          </span>
          <span className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200/90 py-1.5 sm:py-1 px-2.5 sm:px-3 rounded-lg sm:rounded-xl shadow-2xs">
            <History className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Audit Trail Terverifikasi</span>
          </span>
          <span className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200/90 py-1.5 sm:py-1 px-2.5 sm:px-3 rounded-lg sm:rounded-xl shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Proteksi Multi-Tier</span>
          </span>
        </div>

        {/* 16 FITUR KENDALI SUPERADMIN & DEVELOPER (4 PER BARIS DI LAPTOP, 2 PER BARIS DI HP) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3.5 lg:gap-4 max-w-7xl w-full mx-auto">
          
          {/* FITUR 1: MANAJEMEN AKUN ADMIN WILAYAH (Theme: Deep Emerald & Gold) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-amber-50/20 rounded-xl sm:rounded-2xl border border-amber-200/90 hover:border-amber-400/90 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#0f2b5c] via-[#d4af37] to-[#0f2b5c] absolute top-0 left-0" />
            
            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#0f2b5c] to-[#1a4a9c] text-amber-300 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-amber-400/30 shrink-0">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <span className="bg-amber-100 text-[#0f2b5c] text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-200 shadow-2xs leading-none">
                  FITUR 1
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-[#0f2b5c] mb-1 sm:mb-2 group-hover:text-[#143b7d] transition-colors leading-snug">
                Manajemen Akun Admin
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Hak khusus pemilik akun pusat untuk mengelola 27 akun admin wilayah, atur otorisasi, & reset credential.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                  <span>27 Akun Admin</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:block" />
                  <span>Otoritas & Credential</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenAccountConsole}
              className="w-full bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-emerald-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-amber-400/30"
            >
              <span className="truncate">Konsol Akun</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 2: AKUN USER (Theme: Deep Blue & Indigo) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-blue-50/30 rounded-xl sm:rounded-2xl border border-blue-200 hover:border-blue-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-700 absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-700 to-indigo-900 text-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-blue-400/30 shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
                </div>
                <span className="bg-blue-100 text-blue-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-200 shadow-2xs leading-none">
                  FITUR 2
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-blue-950 mb-1 sm:mb-2 group-hover:text-blue-800 transition-colors leading-snug">
                Verval Akun User
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Verifikasi dan validasi pendaftaran akun user baru secara realtime, terima/tolak pengajuan, kelola kredensial, dan bekukan akun.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                  <span>Verval Realtime (Terima/Tolak)</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 hidden sm:block" />
                  <span>Edit Sandi, Bekukan, & Hapus</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenUserAccountConsole}
              className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-blue-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Konsol Verval User</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 3: PEMANTAUAN ADMIN WILAYAH (Theme: Deep Teal & Marine Cyan) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-teal-50/30 rounded-xl sm:rounded-2xl border border-teal-200 hover:border-teal-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-700 absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-teal-700 to-cyan-900 text-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md relative group-hover:scale-105 transition-transform duration-300 border border-teal-400/30 shrink-0">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-teal-200" />
                  <span className="absolute top-1 right-1 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-cyan-400"></span>
                  </span>
                </div>
                <span className="bg-teal-100 text-teal-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-teal-200 shadow-2xs flex items-center gap-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse hidden sm:inline-block" />
                  FITUR 3
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-teal-950 mb-1 sm:mb-2 group-hover:text-teal-800 transition-colors leading-snug">
                Pemantauan Admin
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Radar pemantauan real-time status online, sesi aktif, & aktivitas akun admin 27 Kab/Kota.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 shrink-0" />
                  <span>Status Real-Time</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 hidden sm:block" />
                  <span>Aktivitas Live</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenMonitoringConsole}
              className="w-full bg-gradient-to-r from-teal-700 to-cyan-800 hover:from-teal-800 hover:to-cyan-900 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-teal-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Pemantauan Live</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 4: RIWAYAT AKTIVITAS (AUDIT TRAIL LOGS) (Theme: Warm Amber & Bronze) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-amber-50/30 rounded-xl sm:rounded-2xl border border-amber-300 hover:border-amber-500 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-600 absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-700 to-yellow-900 text-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-amber-400/40 shrink-0">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
                </div>
                <span className="bg-amber-100 text-amber-950 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-300 shadow-2xs leading-none">
                  FITUR 4
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-amber-950 mb-1 sm:mb-2 group-hover:text-amber-800 transition-colors leading-snug">
                Riwayat Aktivitas
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Catatan riwayat perubahan realtime data (SET/DELETE) oleh admin wilayah & superadmin ke Firestore.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  <span>Batch-Write Hemat</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:block" />
                  <span>Auto-Purge 30 Hari</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenActivityLogConsole}
              className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-amber-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-amber-400/40"
            >
              <span className="truncate">Riwayat Log</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-200 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 5: MANAJEMEN TUGAS & PENGESAHAN ANGGOTA (Theme: Deep Purple & Violet) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-purple-50/30 rounded-xl sm:rounded-2xl border border-purple-200 hover:border-purple-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-purple-600 via-fuchsia-400 to-violet-700 absolute top-0 left-0" />

            {/* Sensor Lampu di Pojok Kanan Atas Kotak Fitur (Berkedip Jika Ada Pending, Centang Jika Selesai) */}
            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20">
              {hasPendingSuperadmin ? (
                <div
                  className="relative flex items-center justify-center cursor-pointer group/sensor"
                  onClick={onOpenTaskManagerConsole}
                  title={`Sensor Status: ${pendingSuperadminCount} berkas menunggu pengesahan & penerimaan`}
                >
                  <span className="animate-ping absolute inline-flex h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-rose-500 opacity-75 duration-1000" />
                  <span className="relative inline-flex items-center justify-center rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 border-2 border-white shadow-md shadow-rose-500/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </span>
                </div>
              ) : (
                <div
                  className="inline-flex items-center justify-center rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500 text-white border-2 border-white shadow-sm"
                  title="Sensor Status: Tidak ada berkas pending (Semua selesai disahkan)"
                >
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4 pr-6 sm:pr-7">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-700 to-violet-900 text-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-purple-400/30 shrink-0">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
                </div>
                <span className="bg-purple-100 text-purple-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-purple-200 shadow-2xs leading-none">
                  FITUR 5
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-purple-950 mb-1 sm:mb-2 group-hover:text-purple-800 transition-colors leading-snug">
                Pengesahan Anggota
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pusat pengesahan akhir, persetujuan rekomendasi admin wilayah, dan penerimaan sah anggota 10 Pilar PSKS se-Jawa Barat.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 shrink-0" />
                  <span>Rekomendasi 27 Kab/Kota</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 hidden sm:block" />
                  <span>Pengesahan Sah Realtime</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenTaskManagerConsole}
              className="w-full bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-800 hover:to-violet-900 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-purple-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Pengesahan Anggota</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 6: TAMBAH PENGUMUMAN (Theme: Vivid Orange & Coral) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-orange-50/30 rounded-xl sm:rounded-2xl border border-orange-200 hover:border-orange-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-orange-600 to-red-800 text-white rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-orange-400/30 shrink-0">
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-100" />
                </div>
                <span className="bg-orange-100 text-orange-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-orange-200 shadow-2xs leading-none">
                  FITUR 6
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-orange-950 mb-1 sm:mb-2 group-hover:text-orange-800 transition-colors leading-snug">
                Tambah Pengumuman
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Siaran layar melayang 15 detik realtime, foto kompresi hemat storage, judul, narasi/link, & 27 saklar wilayah.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 shrink-0" />
                  <span>Layar Melayang 15 Detik</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0 hidden sm:block" />
                  <span>27 Saklar Publik & Admin</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenAnnouncementConsole}
              className="w-full bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-orange-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Atur Pengumuman</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 7: UBAH KONTAK FLOATING WHATSAPP (Theme: Official Emerald & Mint WA) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-emerald-50/40 rounded-xl sm:rounded-2xl border border-emerald-300 hover:border-emerald-500 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#25d366] via-emerald-400 to-[#128c7e] absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#128c7e] to-[#075e54] text-white rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-emerald-400/40 shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
                </div>
                <span className="bg-emerald-100 text-emerald-950 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-300 shadow-2xs leading-none">
                  FITUR 7
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-emerald-950 mb-1 sm:mb-2 group-hover:text-emerald-800 transition-colors leading-snug">
                Kontak Floating WA
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Penyesuaian 27 kontak WA wilayah, Superadmin Dinsos, Developer, & fitur ALL IN massal.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                  <span>27 Kontak Wilayah & Super</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:block" />
                  <span>Fitur ALL IN Massal</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenFloatingWaConsole}
              className="w-full bg-gradient-to-r from-[#128c7e] to-[#075e54] hover:from-[#0d7367] hover:to-[#04433c] text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-emerald-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Atur Kontak WA</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 8: SAKLAR MAINTENANCE SISTEM (Theme: Crimson Rose & Dark Slate Red) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-rose-50/30 rounded-xl sm:rounded-2xl border border-rose-200 hover:border-rose-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-rose-600 via-red-500 to-rose-800 absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-rose-700 to-red-950 text-rose-100 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-rose-400/30 shrink-0">
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-200" />
                </div>
                <span className="bg-rose-100 text-rose-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-rose-200 shadow-2xs leading-none">
                  FITUR 8
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-rose-950 mb-1 sm:mb-2 group-hover:text-rose-800 transition-colors leading-snug">
                Saklar Maintenance
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pusat kendali mode pemeliharaan sistem & penguncian darurat publik/admin.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 shrink-0" />
                  <span>Lockout Darurat</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 hidden sm:block" />
                  <span>Banner Pemeliharaan</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenMaintenanceConsole}
              className="w-full bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-800 hover:to-red-900 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-rose-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Maintenance</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 9: KELOLA TANYA JAWAB PORTAL (FAQ MANAGEMENT) (Theme: Deep Teal & Emerald) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-teal-50/30 rounded-xl sm:rounded-2xl border border-teal-200 hover:border-teal-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-[#128c7e] absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-teal-700 to-emerald-900 text-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-teal-400/30 shrink-0">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-200" />
                </div>
                <span className="bg-teal-100 text-teal-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-teal-200 shadow-2xs leading-none">
                  FITUR 9
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-teal-950 mb-1 sm:mb-2 group-hover:text-teal-800 transition-colors leading-snug">
                Kelola FAQ Portal
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pusat kendali tanya jawab beranda, edit redaksi, nomor prioritas, & saklar tayang publik realtime.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 shrink-0" />
                  <span>Sinkronisasi Supabase</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 hidden sm:block" />
                  <span>Saklar Tayang Publik</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenFaqConsole}
              className="w-full bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-teal-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Kelola FAQ</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 10: PUSAT UNDUH DOKUMEN & REGULASI KEDINASAN (Theme: Regal Navy & Gold) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-blue-50/30 rounded-xl sm:rounded-2xl border border-blue-300 hover:border-amber-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#0f2b5c] via-[#d4af37] to-[#1a4a9c] absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#0f2b5c] via-[#1a3a6c] to-[#091f42] text-amber-300 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-amber-400/40 shrink-0">
                  <FileDown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <span className="bg-amber-100 text-[#0f2b5c] text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-300 shadow-2xs leading-none">
                  FITUR 10
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-[#0f2b5c] mb-1 sm:mb-2 group-hover:text-blue-900 transition-colors leading-snug">
                Pusat Unduh Dokumen
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Repositori regulasi dinas, Permensos RI, Pergub Jabar, SOP 10 Pilar, & format blanko resmi ber-TTE.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-700 shrink-0" />
                  <span>10+ Dokumen & SOP Resmi</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0 hidden sm:block" />
                  <span>Unduh Real PDF Ber-TTE</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenDocumentRepoConsole}
              className="w-full bg-gradient-to-r from-[#0f2b5c] to-[#1a4a9c] hover:from-[#143b7d] hover:to-[#2257b3] text-amber-300 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-blue-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-amber-400/30"
            >
              <span className="truncate">Unduh Dokumen</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 11: UBAH BACKGROUND & LOGO RESMI PSKS (Theme: Deep Emerald & Gold) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-emerald-50/20 rounded-xl sm:rounded-2xl border border-emerald-200 hover:border-emerald-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#043e2e] via-[#d4af37] to-[#043e2e] absolute top-0 left-0" />

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#043e2e] to-[#0a523e] text-emerald-200 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-emerald-400/30 shrink-0">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <span className="bg-emerald-100 text-[#043e2e] text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-200 shadow-2xs leading-none">
                  FITUR 11
                </span>
              </div>

              <h4 className="text-[11px] sm:text-base font-black text-slate-900 mb-1 sm:mb-2 group-hover:text-[#043e2e] transition-colors leading-snug">
                Ubah Background & Logo
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Ubah latar belakang video loop/foto statis beranda utama dan logo resmi PSKS Jabar ber-TTE.
              </p>

              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                  <span>Mode Video / Foto</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:block" />
                  <span>Logo PSKS Resmi</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenBackgroundLogoConsole}
              className="w-full bg-gradient-to-r from-[#043e2e] to-[#0a523e] hover:from-[#06503c] hover:to-[#0c6149] text-[#d4af37] font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-emerald-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-[#d4af37]/40"
            >
              <span className="truncate">Ubah Background & Logo</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d4af37] group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 12: FOTO KADINAS & ISI PROFIL (Theme: Regal Navy & Gold) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-blue-50/20 rounded-xl sm:rounded-2xl border border-blue-200 hover:border-blue-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#0f2b5c] via-[#d4af37] to-[#1a4a9c] absolute top-0 left-0" />

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#0f2b5c] to-[#1a4a9c] text-amber-300 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-amber-400/30 shrink-0">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <span className="bg-amber-100 text-[#0f2b5c] text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-200 shadow-2xs leading-none">
                  FITUR 12
                </span>
              </div>

              <h4 className="text-[11px] sm:text-base font-black text-[#0f2b5c] mb-1 sm:mb-2 group-hover:text-blue-900 transition-colors leading-snug">
                Foto Kadinas & Isi Profil
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pembaruan foto resmi Kepala Dinas Sosial Jabar, nama pejabat, & naskah sambutan profil kedinasan.
              </p>

              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-700 shrink-0" />
                  <span>Foto Pejabat Resmi</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0 hidden sm:block" />
                  <span>Sambutan & Visi Misi</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenProfileKadinasConsole}
              className="w-full bg-gradient-to-r from-[#0f2b5c] to-[#153a75] hover:from-[#133773] hover:to-[#1a468d] text-amber-300 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-blue-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-amber-400/40"
            >
              <span className="truncate">Ubah Profil & Foto</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 13: UBAH MEDIA SOSIAL RESMI (Theme: Marine Cyan & Indigo) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-cyan-50/20 rounded-xl sm:rounded-2xl border border-cyan-200 hover:border-cyan-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-cyan-600 via-teal-400 to-blue-700 absolute top-0 left-0" />

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-cyan-700 to-blue-900 text-cyan-200 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-cyan-400/30 shrink-0">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-200" />
                </div>
                <span className="bg-cyan-100 text-cyan-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-cyan-200 shadow-2xs leading-none">
                  FITUR 13
                </span>
              </div>

              <h4 className="text-[11px] sm:text-base font-black text-slate-900 mb-1 sm:mb-2 group-hover:text-cyan-900 transition-colors leading-snug">
                Ubah Media Sosial
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pusat kelola 7 tautan media sosial resmi, kanal YouTube TV, IG, TikTok, & kontak dinas.
              </p>

              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-700 shrink-0" />
                  <span>7 Saluran Terhubung</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 shrink-0 hidden sm:block" />
                  <span>WA, IG, YouTube, X</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSocialMediaConsole}
              className="w-full bg-gradient-to-r from-cyan-800 to-blue-900 hover:from-cyan-900 hover:to-blue-950 text-cyan-200 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-cyan-900/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-cyan-400/40"
            >
              <span className="truncate">Ubah Media Sosial</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-200 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 14: MANAJEMEN LOGO RESMI 28 WILAYAH (Theme: Deep Blue & Gold) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-amber-50/20 rounded-xl sm:rounded-2xl border border-amber-300 hover:border-amber-500 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#0f2b5c] via-[#d4af37] to-amber-600 absolute top-0 left-0" />

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#0f2b5c] to-blue-900 text-amber-300 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-amber-400/30 shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <span className="bg-amber-100 text-amber-950 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-300 shadow-2xs leading-none">
                  FITUR 14
                </span>
              </div>

              <h4 className="text-[11px] sm:text-base font-black text-slate-900 mb-1 sm:mb-2 group-hover:text-blue-900 transition-colors leading-snug">
                Pengelolaan Logo Wilayah
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Upload & kelola 28 lambang resmi daerah (1 Pemprov & 27 Kab/Kota) beresolusi jernih & kompresi otomatis untuk plang pilar.
              </p>

              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  <span>28 Slot Wilayah Jabar</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:block" />
                  <span>Kompresi Retina ~40KB</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenRegionalLogoConsole}
              className="w-full bg-gradient-to-r from-[#0f2b5c] to-blue-900 hover:from-[#143b7d] hover:to-blue-950 text-amber-300 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-blue-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-amber-400/40"
            >
              <span className="truncate">Pengelolaan Logo Wilayah</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 15: PUSAT KEAMANAN PIN (Theme: Deep Indigo & Royal Navy) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/30 rounded-xl sm:rounded-2xl border border-indigo-300 hover:border-indigo-500 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-indigo-800 via-indigo-500 to-[#0f2b5c] absolute top-0 left-0" />

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-900 to-[#0f2b5c] text-indigo-200 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-indigo-400/30 shrink-0">
                  <Key className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                </div>
                <span className="bg-indigo-100 text-indigo-950 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-indigo-300 shadow-2xs leading-none">
                  FITUR 15
                </span>
              </div>

              <h4 className="text-[11px] sm:text-base font-black text-slate-900 mb-1 sm:mb-2 group-hover:text-indigo-950 transition-colors leading-snug">
                Pusat Keamanan PIN
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Kelola & pantau 6 digit PIN Smart Access Card Superadmin & Developer realtime ke database.
              </p>

              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
                  <span>PIN Superadmin & Dev</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 hidden sm:block" />
                  <span>Proteksi Anti-Tebak</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenPinSecurityConsole}
              className="w-full bg-gradient-to-r from-indigo-900 to-[#0f2b5c] hover:from-indigo-950 hover:to-[#143973] text-indigo-200 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-indigo-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-indigo-400/40"
            >
              <span className="truncate">Pusat Keamanan PIN</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-200 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>

          {/* FITUR 16: INFORMASI WEBSITE (Theme: Deep Emerald & Gold) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-emerald-50/30 rounded-xl sm:rounded-2xl border border-emerald-300 hover:border-emerald-500 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#043e2e] via-[#d4af37] to-teal-700 absolute top-0 left-0" />

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#043e2e] to-emerald-900 text-emerald-200 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-emerald-400/30 shrink-0">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                </div>
                <span className="bg-emerald-100 text-emerald-950 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-300 shadow-2xs leading-none">
                  FITUR 16
                </span>
              </div>

              <h4 className="text-[11px] sm:text-base font-black text-slate-900 mb-1 sm:mb-2 group-hover:text-emerald-900 transition-colors leading-snug">
                Informasi Website
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pusat informasi lengkap spesifikasi keamanan 18 lapis, smart access card, bahasa, pustaka, database, AI, & pengembang.
              </p>

              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                  <span>8 Modul Informasi</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:block" />
                  <span>Keamanan, DB & Dev</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenWebsiteInfoConsole}
              className="w-full bg-gradient-to-r from-[#043e2e] to-emerald-900 hover:from-[#06533e] hover:to-emerald-950 text-emerald-200 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-emerald-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-[#d4af37]/40"
            >
              <span className="truncate">Informasi Website</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-200 group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};


