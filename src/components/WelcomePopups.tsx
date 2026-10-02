import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
  Building2,
  User,
  LogOut,
  AlertTriangle,
  UserX,
  UserCheck,
  Smartphone,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface LoginSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  nama: string;
  wilayah: string;
}

// Sound synthesis utility for smooth pleasant login success chime
// High-grade acoustic dual-tone bell chime (warm E5 -> crystal B5/E6 harmonic resolution)
const playLoginSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Master filter to smooth out high frequencies and eliminate speaker crackling
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.connect(ctx.destination);

    // Master gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.14, now);
    masterGain.connect(filter);

    // Harmonic bell pair: Warm E5 (659.25 Hz) followed by uplifting B5 (987.77 Hz)
    const tones = [
      { freq: 659.25, time: now, duration: 0.55, gainLevel: 0.16 },
      { freq: 987.77, time: now + 0.11, duration: 0.85, gainLevel: 0.22 },
      // Subtle overtone for air and warmth (E6 harmonic)
      { freq: 1318.51, time: now + 0.11, duration: 0.70, gainLevel: 0.06 },
    ];

    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, tone.time);

      // Smooth envelope: soft attack (18ms) to prevent harsh click, natural exponential decay
      noteGain.gain.setValueAtTime(0.0001, tone.time);
      noteGain.gain.linearRampToValueAtTime(tone.gainLevel, tone.time + 0.018);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, tone.time + tone.duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(tone.time);
      osc.stop(tone.time + tone.duration + 0.05);
    });

    // Clean up audio context after playback completes
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 1200);
  } catch {}
};

// Sound synthesis utility for radar sensor warning "tut - tut - tut"
const playRadarWarningSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 4 sharp radar warning pulses: "tut - tut - tut - tut"
    const pulses = [0, 0.16, 0.32, 0.48];
    const freq = 880; // A5 sharp radar pulse

    pulses.forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + offset);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.22, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  } catch {}
};

export const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({
  isOpen,
  onClose,
  role,
  nama,
  wilayah,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
      return;
    }

    setIsExiting(false);
    playLoginSuccessChime();

    // Auto-dismiss after exactly 1.5 seconds (1500ms) with 200ms graceful exit
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
        setIsExiting(false);
      }, 200);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getRoleLabel = (r: string, name?: string) => {
    const rLower = (r || '').toLowerCase().trim();
    const nLower = (name || '').toLowerCase().trim();
    if (rLower === 'developer') return 'DEVELOPER ADMINISTRATOR';
    if (rLower === 'superadmin') return 'SUPERADMIN PROVINSI';
    if (rLower === 'admin') return 'ADMIN WILAYAH';
    if (rLower === 'guest' || rLower === 'tamu' || nLower.includes('tamu publik')) return 'TAMU PUBLIK';
    return 'USER TERDAFTAR';
  };

  const roleLabel = getRoleLabel(role, nama);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 180);
  };

  return (
    <div
      id="login-success-top-toast"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[99999] w-[94vw] max-w-lg pointer-events-auto"
    >
      <div
        onClick={handleManualClose}
        className={`relative overflow-hidden bg-gradient-to-r from-[#03291e]/95 via-[#043e2e]/95 to-[#022319]/95 backdrop-blur-xl border-2 border-[#d4af37] rounded-2xl sm:rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.5),0_0_25px_rgba(212,175,55,0.35)] p-3 sm:p-4 text-white flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 transform ${
          isExiting
            ? 'opacity-0 -translate-y-8 scale-95'
            : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-6'
        }`}
      >
        {/* Animated Modern Glowing Checkmark Icon */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-400/30 rounded-full animate-ping opacity-60" />
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 via-emerald-600 to-[#043e2e] rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.6)] border border-emerald-300">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline
                points="20 6 9 17 4 12"
                className="animate-[dash_0.6s_ease-in-out_forwards]"
                style={{ strokeDasharray: 24, strokeDashoffset: 0 }}
              />
            </svg>
          </div>
        </div>

        {/* Middle Notification Text Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-[#d4af37]/20 text-amber-300 border border-[#d4af37]/50 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>{roleLabel}</span>
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight m-0 mt-0.5 truncate drop-shadow-sm">
            {roleLabel === 'TAMU PUBLIK' ? 'Akses Masuk Berhasil!' : 'Login Berhasil!'}
          </h4>

          <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-0.5 font-medium truncate">
            <span className="text-amber-300 font-bold truncate">{nama}</span>
            <span className="text-emerald-400/80">•</span>
            <span className="text-slate-300 text-[11px] truncate flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
              {wilayah}
            </span>
          </div>
        </div>

        {/* Right Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleManualClose();
          }}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 text-emerald-200 hover:text-white transition-all cursor-pointer shrink-0 border border-white/15"
          title="Tutup Notifikasi"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bottom Smooth 1.5s Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] via-emerald-400 to-[#d4af37]"
            style={{
              animation: 'progress_linear 1.5s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface WelcomeRegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGuest: boolean;
  wilayah: string;
  role?: string;
  nama?: string;
}

export const WelcomeRegionModal: React.FC<WelcomeRegionModalProps> = ({
  isOpen,
  onClose,
  isGuest,
  wilayah,
  role,
  nama,
}) => {
  if (!isOpen) return null;

  const displayRoleLabel =
    role === 'developer'
      ? 'HAK AKSES DEVELOPER'
      : role === 'superadmin'
      ? 'HAK AKSES SUPERADMIN'
      : role === 'admin'
      ? 'HAK AKSES ADMIN WILAYAH'
      : 'AKSES PUBLIK (TAMU)';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-[#d4af37] rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(212,175,55,0.35)] overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 mb-5 bg-gradient-to-tr from-[#043e2e] to-emerald-950 border-2 border-[#d4af37] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
          {isGuest ? (
            <Building2 className="w-8 h-8 text-[#d4af37]" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          )}
        </div>

        {/* Role/Portal Pill */}
        <div className="inline-flex items-center gap-1.5 bg-[#d4af37]/15 border border-[#d4af37]/50 text-[#f3e5ab] text-xs font-bold px-3.5 py-1 rounded-full mb-4 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{displayRoleLabel}</span>
        </div>

        {/* Main Text required by prompt */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-inner">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug mb-2">
            {isGuest ? (
              <span>Selamat datang di halaman website wilayah <span className="text-[#f3e5ab] font-extrabold underline decoration-[#d4af37] underline-offset-4">{wilayah}</span></span>
            ) : (
              <span>Selamat datang di hak akses wilayah <span className="text-[#f3e5ab] font-extrabold underline decoration-[#d4af37] underline-offset-4">{wilayah}</span></span>
            )}
          </h3>

          {!isGuest && nama && (
            <p className="text-xs text-emerald-400 font-semibold mt-2 flex items-center justify-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Pengguna: {nama}</span>
            </p>
          )}

          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Sistem Informasi Potensi dan Sumber Kesejahteraan Sosial (PSKS) Dinas Sosial Provinsi Jawa Barat.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#b8901c] hover:brightness-110 text-[#043e2e] font-black text-sm py-3.5 px-6 rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Masuk ke Halaman Utama</span>
          <Sparkles className="w-4 h-4 text-[#043e2e]" />
        </button>
      </div>
    </div>
  );
};

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.3)] transform transition-all scale-100">
        <div className="mx-auto w-16 h-16 mb-4 bg-gradient-to-tr from-amber-950 to-red-950 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-lg">
          <LogOut className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 leading-snug">
          Apakah anda yakin ingin keluar?
        </h3>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Sesi otorisasi Anda akan diakhiri dan sistem akan dikembalikan ke gerbang awal.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:brightness-110 text-white font-extrabold text-sm py-3.5 px-6 rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Ya, saya akan keluar</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm py-3 px-6 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
};

interface LogoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutSuccessModal: React.FC<LogoutSuccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 750);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-[#d4af37] rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all transform scale-100">
        <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#d4af37]/20 rounded-full animate-ping opacity-75" />
          <div className="relative w-14 h-14 bg-slate-950 border-2 border-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.5)]">
            <CheckCircle2 className="w-8 h-8 text-[#d4af37]" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
          Berhasil Keluar Dari Akun
        </h3>

        <p className="text-xs text-slate-400 mb-4">
          Mengarahkan Anda kembali ke gerbang awal... (klik untuk lanjut)
        </p>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#b8901c] via-amber-400 to-[#d4af37] h-full w-full animate-[progress_0.75s_linear]" />
        </div>
      </div>
    </div>
  );
};

interface AdminRegisteredModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  wilayah: string;
  role?: string;
}

export const AdminRegisteredModal: React.FC<AdminRegisteredModalProps> = ({
  isOpen,
  onClose,
  username,
  wilayah,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-400/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(16,185,129,0.4)] transition-all transform scale-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping opacity-75" />
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full blur-md opacity-60 animate-pulse" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>PENDAFTARAN AKUN BERHASIL</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Akun Telah Berhasil Didaftarkan!
        </h3>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
          Username <strong className="text-emerald-300 font-mono">[{username}]</strong> ({wilayah}) telah berhasil terdaftar dan aktif secara global.
        </p>

        {/* Fast Progress Bar 2s */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 h-full w-full animate-[progress_2s_linear]" />
        </div>
      </div>
    </div>
  );
};

interface AdminAlreadyExistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export const AdminAlreadyExistsModal: React.FC<AdminAlreadyExistsModalProps> = ({
  isOpen,
  onClose,
  username,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.5)] transition-all transform scale-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)]">
            <AlertTriangle className="w-9 h-9 text-amber-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>PENDAFTARAN DIBATALKAN - AKUN GANDA</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Akun Sudah Terdaftar!
        </h3>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 mb-6 text-center text-xs leading-relaxed">
          <p className="text-amber-300 font-extrabold text-sm mb-2">
            Username: '<span className="text-white font-mono">{username}</span>'
          </p>
          <p className="text-slate-300">
            Username ini <strong className="text-amber-400">sudah terdaftar dan berstatus aktif</strong> dalam sistem. Pendaftaran dibatalkan untuk mencegah pendaftaran akun ganda.
          </p>
          <p className="text-slate-400 text-[11px] mt-2 italic border-t border-slate-800 pt-2">
            💡 Catatan: Jika ingin mendaftarkan ulang username ini, pastikan akun lama telah dihapus terlebih dahulu dari database.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          Saya Mengerti & Tutup
        </button>
      </div>
    </div>
  );
};

interface AdminEditedModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  wilayah: string;
}

export const AdminEditedModal: React.FC<AdminEditedModalProps> = ({
  isOpen,
  onClose,
  username,
  wilayah,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.4)] transition-all transform scale-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Yellow Checkmark Badge */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-ping opacity-75" />
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full blur-md opacity-60 animate-pulse" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-amber-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)]">
            <CheckCircle2 className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>PERUBAHAN AKUN BERHASIL</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Akun Tersebut Berhasil Diedit!
        </h3>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
          Data kredensial untuk <strong className="text-amber-300 font-mono">[{username}]</strong> ({wilayah}) telah diperbarui.
        </p>

        {/* Fast Progress Bar 1s */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400 h-full w-full animate-[progress_1s_linear]" />
        </div>
      </div>
    </div>
  );
};

interface AdminDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
  wilayah: string;
}

export const AdminDeleteConfirmModal: React.FC<AdminDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  username,
  wilayah,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(239,68,68,0.5)] transition-all transform scale-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
          title="Batal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)]">
            <UserX className="w-9 h-9 text-red-500" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/60 text-red-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>PERINGATAN OTORITAS TINGGI</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Hapus Akun Admin?
        </h3>

        <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-4 mb-6 text-center text-xs leading-relaxed">
          <p className="text-amber-300 font-extrabold text-sm mb-1">
            Akun: '{username}'
          </p>
          <p className="text-emerald-300 font-bold mb-2">
            Wilayah: {wilayah}
          </p>
          <p className="text-slate-300">
            Apakah Anda benar-benar yakin ingin MENGHAPUS akun ini? Tindakan ini akan menghapus kredensial secara permanen dari Tabel & Database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3.5 px-4 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            🔒 Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:brightness-110 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            🗑️ Ya, Hapus Permanen
          </button>
        </div>
      </div>
    </div>
  );
};

interface AdminDeletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  wilayah: string;
}

export const AdminDeletedModal: React.FC<AdminDeletedModalProps> = ({
  isOpen,
  onClose,
  username,
  wilayah,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 1800);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.5)] transition-all transform scale-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)]">
            <UserX className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/60 text-red-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>AKUN BERHASIL DIHAPUS</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-1 leading-snug drop-shadow-md">
          Akun Admin Dihapus!
        </h3>

        <p className="text-xs text-amber-300 font-bold mb-3">
          Akun '<span className="text-white">{username}</span>' ({wilayah})
        </p>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed font-medium">
          Data kredensial admin bersangkutan telah dihapus secara permanen dari tabel dan Database Sistem.
        </p>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-xl transition-all cursor-pointer"
        >
          Tutup & Lanjutkan
        </button>
      </div>
    </div>
  );
};

interface AccountDeletedRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDeletedRemoteModal: React.FC<AccountDeletedRemoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Trigger intense sensory vibration + radar audio "tut-tut-tut"
    playRadarWarningSound();
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 450, 100, 600]);
      }
    } catch {}

    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(239,68,68,0.5)] transition-all transform scale-100"
      >
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)]">
            <UserX className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/60 text-red-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>AKUN DIHAPUS PENGELOLA PUSAT</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Akun Telah Dihapus!
        </h3>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed font-medium">
          Akun Anda telah dihapus dari Fitur Pengelola Pusat Akun. Sesi otorisasi diakhiri dan ditendang keluar secara realtime.
        </p>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 h-full w-full animate-[progress_2.5s_linear]" />
        </div>
      </div>
    </div>
  );
};

interface AccountEditedRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountEditedRemoteModal: React.FC<AccountEditedRemoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Trigger sensory feedback (vibration + sound)
    playRadarWarningSound();
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([250, 80, 250, 80, 400]);
      }
    } catch {}

    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.5)] transition-all transform scale-100"
      >
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)]">
            <UserCheck className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>PASSWORD / DATA DIUBAH</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Akun Telah Diedit!
        </h3>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed font-medium">
          Password atau rincian akun Anda telah diubah oleh Superadmin/Developer. Sesi ditendang keluar secara realtime demi keamanan. Silakan login kembali dengan kredensial baru.
        </p>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 h-full w-full animate-[progress_2.5s_linear]" />
        </div>
      </div>
    </div>
  );
};

interface AccountFrozenRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountFrozenRemoteModal: React.FC<AccountFrozenRemoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Play radar alarm + vibrate
    playRadarWarningSound();
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500, 100, 800]);
      }
    } catch {}

    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-cyan-950 to-slate-950 border-2 border-cyan-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(6,182,212,0.5)] transition-all transform scale-100"
      >
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-cyan-500/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)]">
            <Lock className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>AKUN TELAH DIBEKUKAN</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Akses Akun Dibekukan!
        </h3>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed font-medium">
          Akses akun Anda telah dibekukan sementara oleh Superadmin/Developer. Anda telah ditendang keluar secara realtime. Silakan hubungi pengelola pusat untuk pembukaan blokir.
        </p>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-600 via-sky-400 to-indigo-500 h-full w-full animate-[progress_3s_linear]" />
        </div>
      </div>
    </div>
  );
};

interface MultipleSessionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultipleSessionWarningModal: React.FC<MultipleSessionWarningModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(8);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(8);
      return;
    }

    // Play radar sensor warning sound "tut - tut - tut"
    playRadarWarningSound();

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && timeLeft === 0) {
      onClose();
    }
  }, [isOpen, timeLeft, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_70px_rgba(239,68,68,0.6)] transition-all transform scale-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
          title="Tutup & Keluar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Smartphone Alert Icon */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)]">
            <Smartphone className="w-9 h-9 text-red-500" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/60 text-red-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>DETEKSI LOGIN PERANGKAT LAIN</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug drop-shadow-md">
          Akun telah diloginkan di perangkat lain
        </h3>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5 text-left text-xs leading-relaxed">
          <p className="text-amber-300 font-bold mb-1">
            Silahkan login ulang / harap melapor jika terjadi ada aktivitas yang tidak wajar
          </p>
          <p className="text-slate-400">
            Sistem mendeteksi bahwa akun ini baru saja diakses menggunakan kredensial yang sama pada browser/perangkat berbeda. Demi keamanan data, sesi di perangkat ini dihentikan.
          </p>
        </div>

        {/* Progress Bar 8 Seconds */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-gradient-to-r from-red-600 via-amber-500 to-red-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 8) * 100}%` }}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Kembali ke Gerbang Awal ({timeLeft}s)</span>
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// REGISTER SUCCESS MODAL (Pop-up Centang Hijau Minimalis & Modern)
// =========================================================================
interface RegisterSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  wilayah: string;
}

export const RegisterSuccessModal: React.FC<RegisterSuccessModalProps> = ({
  isOpen,
  onClose,
  username,
  wilayah,
}) => {
  // Do NOT auto-dismiss: keep open until the user manually clicks "Masuk Ke Akun"
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl border-2 border-emerald-400/80 rounded-3xl p-6 sm:p-7 text-center shadow-[0_20px_60px_rgba(4,62,46,0.35)] transform transition-all scale-100 overflow-hidden"
      >
        {/* Close "X" Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Subtle Ambient Emerald Corner Sheen */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-teal-300/20 rounded-full blur-2xl pointer-events-none" />

        {/* Clean Fresh Distinct Green Checkmark Animated Circle */}
        <div className="relative mx-auto w-16 h-16 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl animate-ping opacity-60" />
          <div className="relative w-14 h-14 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 text-white transform -rotate-3 hover:rotate-0 transition-transform">
            <svg
              className="w-8 h-8 text-white drop-shadow-sm"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Minimal Pill Badge */}
        <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black px-3 py-0.5 rounded-full mb-2 uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>SUKSES TERDAFTAR</span>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-black text-[#043e2e] tracking-tight mb-1">
          Pendaftaran Akun Berhasil!
        </h3>

        <p className="text-xs text-slate-600 font-medium leading-snug mb-1">
          Silahkan Masukkan Akun nya!
        </p>

        {/* Account Info Pill */}
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-3 py-2 my-2.5 flex items-center justify-center gap-2 text-xs text-slate-800 font-bold shadow-2xs">
          <span className="text-emerald-800 font-black">@{username}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 text-[11px] truncate">{wilayah}</span>
        </div>

        {/* Direction Notice */}
        <p className="text-[11px] text-slate-500 font-semibold mb-4 leading-relaxed">
          Akun Anda telah aktif secara otomatis. Klik tombol di bawah untuk melanjutkan ke form login.
        </p>

        <button
          onClick={onClose}
          type="button"
          className="w-full py-3 bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] hover:brightness-110 text-[#d4af37] font-black rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-[#d4af37]/30"
        >
          <span>Masuk Ke Akun</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
        </button>
      </div>
    </div>
  );
};


