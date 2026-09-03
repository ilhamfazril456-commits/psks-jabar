import React from 'react';
import { UserSession } from '../types';
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
} from 'lucide-react';

interface Section11AdminProps {
  session: UserSession;
  onOpenAccountConsole: () => void;
  onOpenMonitoringConsole: () => void;
  onOpenActivityLogConsole?: () => void;
  onOpenMaintenanceConsole: () => void;
  onOpenUserAccountConsole: () => void;
  onOpenTaskManagerConsole: () => void;
  onOpenAnnouncementConsole: () => void;
  onOpenFloatingWaConsole?: () => void;
}

export const Section11Admin: React.FC<Section11AdminProps> = ({
  session,
  onOpenAccountConsole,
  onOpenMonitoringConsole,
  onOpenActivityLogConsole,
  onOpenMaintenanceConsole,
  onOpenUserAccountConsole,
  onOpenTaskManagerConsole,
  onOpenAnnouncementConsole,
  onOpenFloatingWaConsole,
}) => {
  const isMasterAdmin =
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) &&
    session.statusActive === 'SAH_TERDAFTAR';

  if (!isMasterAdmin) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 my-12 sm:my-16">
      {/* Decorative Gold Divider with Center Emblem */}
      <div className="relative flex items-center justify-center my-8">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
        <div className="absolute bg-[#043e2e] border-2 border-[#d4af37] text-amber-300 px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>PUSAT KONTROL OTORITAS PUSAT</span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        {/* Category Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-950/10 border border-emerald-900/20 text-[#043e2e] text-xs font-black px-4 py-1.5 rounded-full mb-3 shadow-xs">
          <KeyRound className="w-4 h-4 text-[#d4af37]" />
          <span>KREDENSIAL & HAK AKSES PUSAT</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        </div>

        {/* Section Heading */}
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#043e2e] tracking-tight uppercase">
          Kredensial & Otorisasi Sistem
        </h3>

        {/* Section Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-3xl mt-2 mb-6 leading-relaxed">
          Pusat Kendali Utama untuk Pengelolaan Akun Admin Wilayah 27 Kabupaten/Kota, Pemantauan Sinyal Kehadiran Real-Time, Riwayat Aktivitas Perubahan Data, dan Saklar Proteksi Pemeliharaan Sistem.
        </p>

        {/* System Telemetry Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10 text-xs font-bold text-slate-700">
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            27 Wilayah Terkoneksi
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-xs">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            Telemetri Real-Time
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-xs">
            <History className="w-3.5 h-3.5 text-amber-600" />
            Audit Trail Terverifikasi
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-xs">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            Proteksi Multi-Tier
          </span>
        </div>

        {/* 8 FEATURE CARDS (SIDE BY SIDE ON RESPONSIVE BENTO GRID) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 max-w-7xl w-full mx-auto">
          
          {/* FITUR 1: MANAJEMEN AKUN ADMIN WILAYAH (Theme: Deep Emerald & Gold) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-amber-50/20 rounded-xl sm:rounded-2xl border border-amber-200/90 hover:border-amber-400/90 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#043e2e] via-[#d4af37] to-[#043e2e] absolute top-0 left-0" />
            
            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#043e2e] to-[#085a43] text-amber-300 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-amber-400/30 shrink-0">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <span className="bg-amber-100 text-[#043e2e] text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-200 shadow-2xs leading-none">
                  FITUR 1
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-[#043e2e] mb-1 sm:mb-2 group-hover:text-[#065e44] transition-colors leading-snug">
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
              className="w-full bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-emerald-950/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer border border-amber-400/30"
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
                Akun User
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pusat data & manajemen seluruh akun user terdaftar, ganti kata sandi, status aktif, dan bekukan akun.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                  <span>Semua Akun Terdaftar</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 hidden sm:block" />
                  <span>Edit, Bekukan, & Hapus</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenUserAccountConsole}
              className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-blue-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Konsol User</span>
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

        </div>

        {/* BARIS KEDUA: FITUR 5 S/D FITUR 8 (RATA KIRI, UKURAN SAMA & RESPONSIF) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 max-w-7xl w-full mx-auto mt-2 sm:mt-4 lg:mt-6">
          
          {/* FITUR 5: MANAJEMEN TUGAS (Theme: Deep Purple & Violet) */}
          <div className="group relative bg-gradient-to-b from-white via-slate-50/50 to-purple-50/30 rounded-xl sm:rounded-2xl border border-purple-200 hover:border-purple-400 p-2.5 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left overflow-hidden hover:-translate-y-1">
            {/* Top Accent Gradient Bar */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-purple-600 via-fuchsia-400 to-violet-700 absolute top-0 left-0" />

            <div>
              {/* Icon Box & Badge Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-700 to-violet-900 text-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-purple-400/30 shrink-0">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
                </div>
                <span className="bg-purple-100 text-purple-900 text-[7px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider border border-purple-200 shadow-2xs leading-none">
                  FITUR 5
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-[11px] sm:text-base font-black text-purple-950 mb-1 sm:mb-2 group-hover:text-purple-800 transition-colors leading-snug">
                Verifikasi Pendaftaran
              </h4>
              <p className="text-[9px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Pusat verifikasi dan persetujuan (Acc) ajuan pendaftaran 10 pilar PSKS 27 Kab/Kota secara realtime.
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 pt-2 border-t border-slate-100 hidden xs:block">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 shrink-0" />
                  <span>Ajuan 27 Kab/Kota</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 hidden sm:block" />
                  <span>Verifikasi 10 Pilar Realtime</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenTaskManagerConsole}
              className="w-full bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-800 hover:to-violet-900 text-white font-extrabold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-purple-700/20 transition-all duration-200 flex items-center justify-between group/btn text-[9px] sm:text-xs tracking-wide cursor-pointer"
            >
              <span className="truncate">Verifikasi Pendaftaran</span>
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

        </div>
      </div>
    </section>
  );
};


