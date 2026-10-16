import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  isVerified?: boolean;
}

// Kang Ilham's Official Cloudflare Turnstile Site Key
export const CLOUDFLARE_SITE_KEY = '0x4AAAAAAFYHSeNPeQmA14PB';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onExpire,
  onError,
  isVerified = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let checkInterval: any = null;
    let attempts = 0;
    const maxAttempts = 25; // 5 seconds polling

    const tryRender = () => {
      if (typeof window !== 'undefined' && window.turnstile && containerRef.current) {
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: CLOUDFLARE_SITE_KEY,
            theme: 'light',
            size: 'flexible',
            callback: (token: string) => {
              onVerify(token);
            },
            'expired-callback': () => {
              if (onExpire) onExpire();
            },
            'error-callback': () => {
              if (onError) onError();
            },
          });
          widgetIdRef.current = id;
          setIsRendered(true);
          setLoadError(false);
          return true;
        } catch (e) {
          console.warn('[Turnstile Render Warning]:', e);
        }
      }
      return false;
    };

    if (!tryRender()) {
      checkInterval = setInterval(() => {
        attempts++;
        if (tryRender() || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          if (attempts >= maxAttempts && !widgetIdRef.current) {
            setLoadError(true);
          }
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, onExpire, onError]);

  // Fallback handler if Cloudflare CDN is blocked by strict client adblocker
  const handleManualFallbackVerify = () => {
    const dummyToken = `manual_turnstile_${Date.now()}`;
    onVerify(dummyToken);
  };

  return (
    <div className="w-full bg-slate-50/95 border border-slate-300 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-1.5 transition-all">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between text-[10px] font-black">
        <span className="text-[#043e2e] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Verifikasi Keamanan</span>
        </span>
        <span className="text-[9px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Cloudflare Turnstile
        </span>
      </div>

      {/* Cloudflare Turnstile Render Area */}
      <div className="min-h-[68px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-200/80 py-1 px-0.5">
        {/* The Turnstile iframe renders here with smooth responsive centering */}
        <div ref={containerRef} className="w-full flex justify-center items-center max-w-full overflow-hidden" />

        {/* Loading state before Turnstile iframe initializes */}
        {!isRendered && !loadError && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 py-3 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Memuat verifikasi keamanan...</span>
          </div>
        )}

        {/* Fallback Box if script blocked by Adblocker/Offline */}
        {loadError && !isVerified && (
          <div className="w-full p-2 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Verifikasi Mandiri (Jaringan Terbatas)</span>
            </div>
            <button
              type="button"
              onClick={handleManualFallbackVerify}
              className="px-3 py-1.5 bg-[#0f2b5c] text-white text-xs font-bold rounded-xl hover:bg-[#143b7d] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Klik di Sini: Saya Bukan Bot</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[9px] text-slate-400 text-center font-medium leading-none m-0 pt-0.5">
        Cukup centang kotak di atas untuk verifikasi otomatis tanpa perlu mengetik.
      </p>
    </div>
  );
};
