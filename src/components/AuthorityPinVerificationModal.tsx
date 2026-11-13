import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';

interface AuthorityPinVerificationModalProps {
  role: 'superadmin' | 'developer' | 'admin';
  nama?: string;
  wilayah?: string;
  username?: string;
  userId?: string;
  method?: 'manual' | 'qr' | 'nfc';
  challengeToken?: string;
  appSettings?: AppSettings;
  onSuccess: (sessionData?: {
    sessionToken?: string;
    role?: string;
    nama?: string;
    wilayah?: string;
    username?: string;
    userId?: string;
    allowedPillars?: string[];
    pinOtoritas?: string;
  }) => void;
  onCancel: () => void;
}

export const AuthorityPinVerificationModal: React.FC<AuthorityPinVerificationModalProps> = ({
  role,
  nama,
  wilayah,
  username,
  userId,
  method = 'manual',
  challengeToken,
  appSettings,
  onSuccess,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // References to the 6 input elements for smooth auto-focus navigation
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const LOCKOUT_KEY = `psks_pin_lockout_${role}`;
  const ATTEMPTS_KEY = `psks_pin_attempts_${role}`;

  // Focus the first empty digit or first input on mount & load persistent lockout
  useEffect(() => {
    try {
      const storedLockUntil = localStorage.getItem(LOCKOUT_KEY);
      if (storedLockUntil) {
        const lockUntilMs = parseInt(storedLockUntil, 10);
        const diffSec = Math.ceil((lockUntilMs - Date.now()) / 1000);
        if (diffSec > 0) {
          setLockoutRemaining(diffSec);
          setErrorMessage(`⚠️ Sistem otorisasi dibekukan demi mencegah brute force. Coba lagi dalam ${diffSec} detik.`);
        } else {
          localStorage.removeItem(LOCKOUT_KEY);
          localStorage.removeItem(ATTEMPTS_KEY);
        }
      }
      const storedAttempts = localStorage.getItem(ATTEMPTS_KEY);
      if (storedAttempts) {
        setFailedCount(parseInt(storedAttempts, 10) || 0);
      }
    } catch {}

    const focusTimer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);
    return () => clearTimeout(focusTimer);
  }, [role]);

  // Lockout countdown timer with persistence sync
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (lockoutRemaining > 0) {
      timer = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            setErrorMessage(null);
            try {
              localStorage.removeItem(LOCKOUT_KEY);
              localStorage.removeItem(ATTEMPTS_KEY);
            } catch {}
            setFailedCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutRemaining, role]);

  const handleDigitChange = (index: number, value: string) => {
    if (lockoutRemaining > 0 || isSuccess) return;

    // Only allow numbers
    const cleanVal = value.replace(/\D/g, '');

    // Handle paste of multiple characters
    if (cleanVal.length > 1) {
      const pasteDigits = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      pasteDigits.forEach((d, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = d;
        }
      });
      setDigits(newDigits);
      setErrorMessage(null);
      const nextIndex = Math.min(index + pasteDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // If all 6 digits filled, auto-verify
      if (newDigits.every((d) => d !== '')) {
        validatePin(newDigits.join(''));
      }
      return;
    }

    const singleDigit = cleanVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance to next input if filled
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 filled
    if (singleDigit && index === 5 && newDigits.every((d) => d !== '')) {
      validatePin(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (lockoutRemaining > 0) return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous box on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullPin = digits.join('');
      if (fullPin.length === 6) {
        validatePin(fullPin);
      }
    }
  };

  const validatePin = async (pinToTest: string) => {
    if (lockoutRemaining > 0 || isVerifying || isSuccess) return;

    if (pinToTest.length !== 6) {
      setErrorMessage('Silakan masukkan 6 digit PIN lengkap.');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinToTest,
          targetRole: role,
          challengeToken,
          username,
          userId,
          nama,
          wilayah,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setIsSuccess(true);
        setErrorMessage(null);
        setIsVerifying(false);
        setFailedCount(0);

        try {
          localStorage.removeItem(LOCKOUT_KEY);
          localStorage.removeItem(ATTEMPTS_KEY);
        } catch {}

        // Store authoritative sessionToken if issued
        if (data.sessionToken) {
          try {
            sessionStorage.setItem('psks_session_token', data.sessionToken);
            localStorage.setItem('psks_session_token', data.sessionToken);
            sessionStorage.setItem('session_token', data.sessionToken);
            localStorage.setItem('session_token', data.sessionToken);
          } catch {}
        }

        // Play subtle success chime
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            [587, 880, 1174].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
              gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.07);
              gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.07 + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.09);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + i * 0.07);
              osc.stop(ctx.currentTime + i * 0.07 + 0.1);
            });
          }
        } catch (_) {}

        setTimeout(() => {
          onSuccess({
            sessionToken: data.sessionToken,
            role: data.role || role,
            nama: data.nama || nama,
            wilayah: data.wilayah || wilayah,
            username: data.username || username,
            userId: data.id || userId,
            allowedPillars: data.allowedPillars,
            pinOtoritas: data.pinOtoritas,
          });
        }, 400);
        return;
      }

      setIsVerifying(false);

      if (data.locked) {
        const lockoutSec = data.lockoutRemaining || 900;
        setLockoutRemaining(lockoutSec);
        setErrorMessage(data.message || `⚠️ Sistem dikunci selama ${Math.ceil(lockoutSec / 60)} menit karena percobaan gagal.`);
        try {
          localStorage.setItem(LOCKOUT_KEY, String(Date.now() + lockoutSec * 1000));
          localStorage.setItem(ATTEMPTS_KEY, '5');
        } catch {}
      } else {
        const newFailed = typeof data.remainingAttempts === 'number'
          ? Math.max(0, 5 - data.remainingAttempts)
          : failedCount + 1;
        setFailedCount(newFailed);
        try {
          localStorage.setItem(ATTEMPTS_KEY, String(newFailed));
        } catch {}

        if (newFailed >= 5) {
          const lockoutSec = 900;
          setLockoutRemaining(lockoutSec);
          try {
            localStorage.setItem(LOCKOUT_KEY, String(Date.now() + lockoutSec * 1000));
          } catch {}
          setErrorMessage('⚠️ 5 kali percobaan PIN salah! Sistem otorisasi dibekukan selama 15 menit.');
        } else {
          setDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
          setErrorMessage(data.message || `❌ PIN salah. Sisa kesempatan: ${Math.max(0, 5 - newFailed)} kali.`);
        }
      }
    } catch {
      setIsVerifying(false);
      setErrorMessage('❌ Gagal terhubung ke server autentikasi. Silakan periksa koneksi jaringan Anda.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validatePin(digits.join(''));
  };

  const roleLabel = role === 'developer' ? 'DEVELOPER UTAMA' : 'SUPERADMIN PROVINSI';
  const methodLabel = method === 'nfc' ? 'Tap SmartCard NFC' : method === 'qr' ? 'Scan Kartu QR' : 'Login Manual';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Pure White Minimalist Card Container */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-950/30 border border-slate-100 overflow-hidden flex flex-col my-auto transition-all transform scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-title"
      >
        {/* Subtle Decorative Top Gradient Border Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

        <div className="p-5 sm:p-7 flex flex-col items-center text-center">
          {/* Modern Minimal Shield Badge */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner border border-blue-100/60">
            {isSuccess ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600 animate-bounce" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            )}
          </div>

          {/* Clean Information & Title */}
          <h2 id="pin-modal-title" className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Verifikasi PIN Otoritas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Silakan Masukkan PIN 6 Digit
          </p>

          {/* Clean Role & Method Badges */}
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <Lock className="w-3 h-3 text-blue-600" />
              {roleLabel}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {methodLabel}
            </span>
          </div>

          {nama && (
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {nama} {wilayah ? `• ${wilayah}` : ''}
            </div>
          )}

          {/* Pure 6-Box PIN Inputs */}
          <form onSubmit={handleManualSubmit} className="w-full mt-6">
            <div className="flex justify-center items-center gap-2 sm:gap-3">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  disabled={lockoutRemaining > 0 || isVerifying || isSuccess}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoComplete="one-time-code"
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl transition-all outline-none select-none
                    ${digit 
                      ? 'bg-blue-50/70 border-2 border-blue-600 text-blue-900 shadow-sm' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-2 focus:border-blue-500 focus:shadow-md'
                    }
                    ${errorMessage && !isSuccess ? 'border-red-400 bg-red-50/40 text-red-900' : ''}
                    ${lockoutRemaining > 0 ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200' : ''}
                  `}
                />
              ))}
            </div>

            {/* Error / Lockout Status Box */}
            {lockoutRemaining > 0 ? (
              <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center gap-2 text-xs font-medium animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Sistem dibekukan: <strong>{lockoutRemaining} detik</strong>
                </span>
              </div>
            ) : errorMessage ? (
              <div className="mt-4 p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMessage}
              </div>
            ) : null}

            {/* Action Buttons: Pure, responsive, never cut off */}
            <div className="mt-6 flex flex-col gap-2 w-full">
              <button
                type="submit"
                disabled={digits.some((d) => d === '') || lockoutRemaining > 0 || isVerifying || isSuccess}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>PIN Terverifikasi!</span>
                  </>
                ) : (
                  <span>Verifikasi & Masuk</span>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isVerifying || isSuccess}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors hover:bg-slate-50 rounded-lg"
              >
                Batalkan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
