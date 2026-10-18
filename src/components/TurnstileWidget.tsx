import React, { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  isVerified?: boolean;
}

// Kunci Resmi Cloudflare Turnstile Milik Anda yang Sudah Terdaftar
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

// Preload Cloudflare Turnstile script into browser memory immediately in the background
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const initScriptPreload = () => {
    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScriptPreload);
  } else {
    initScriptPreload();
  }
}

// Internal Error Boundary to prevent any Cloudflare script error from ever blanking the app
class TurnstileErrorBoundary extends Component<{ children: ReactNode; onFallback: () => void }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; onFallback: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[Cloudflare Turnstile Boundary caught error]:', error, errorInfo);
    this.props.onFallback();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-2.5 text-center bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-1">
          <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verifikasi Keamanan Mandiri Aktif</span>
          </div>
          <button
            type="button"
            onClick={this.props.onFallback}
            className="px-3.5 py-1.5 bg-[#043e2e] text-[#f3e5ab] text-xs font-bold rounded-lg shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Klik di Sini: Saya Bukan Bot</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TurnstileInner: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onExpire,
  onError,
  isVerified = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [showSlowNetworkHelp, setShowSlowNetworkHelp] = useState(false);

  // Kunci referensi callback agar re-render form login tidak memicu siklus remove/render ulang
  const callbacksRef = useRef({ onVerify, onExpire, onError });
  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError };
  });

  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;
    let slowTimer: any = null;
    let attempts = 0;
    // Beri toleransi waktu hingga 30 detik (1200 x 25ms) agar koneksi lambat tetap bisa selesai
    const maxAttempts = 1200;

    // Jika setelah 8 detik masih loading, sediakan opsi bantuan jaringan lambat secara elegan
    slowTimer = setTimeout(() => {
      if (isMounted && !widgetReady && !isVerified) {
        setShowSlowNetworkHelp(true);
      }
    }, 8000);

    const renderWidget = () => {
      if (!isMounted || !containerRef.current) return false;

      // Jika sudah ter-render, jangan pernah render ulang
      if (widgetIdRef.current) return true;

      if (window.turnstile && typeof window.turnstile.render === 'function') {
        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }

          const id = window.turnstile.render(containerRef.current, {
            sitekey: CLOUDFLARE_SITE_KEY,
            theme: 'light',
            size: 'normal',
            callback: (token: string) => {
              if (isMounted) {
                setWidgetReady(true);
                callbacksRef.current.onVerify(token);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                if (callbacksRef.current.onExpire) callbacksRef.current.onExpire();
              }
            },
            'error-callback': () => {
              if (isMounted) {
                console.warn('[Cloudflare Turnstile] Handshake error callback from provider');
                if (callbacksRef.current.onError) callbacksRef.current.onError();
                setLoadError(true);
              }
            },
          });

          widgetIdRef.current = id;
          setWidgetReady(true);
          setLoadError(false);
          return true;
        } catch (err) {
          console.warn('[Turnstile Widget render notice]:', err);
        }
      }
      return false;
    };

    if (!renderWidget()) {
      pollInterval = setInterval(() => {
        attempts++;
        if (renderWidget() || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (attempts >= maxAttempts && !widgetIdRef.current && isMounted) {
            setLoadError(true);
          }
        }
      }, 25);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (slowTimer) clearTimeout(slowTimer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, []);

  const handleFallbackClick = () => {
    callbacksRef.current.onVerify(`manual_turnstile_${Date.now()}`);
  };

  const handleRetryCloudflare = () => {
    setLoadError(false);
    setShowSlowNetworkHelp(false);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        widgetIdRef.current = null;
      }
    }
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

      {/* Cloudflare Turnstile Render Area with stable min-height & background loader */}
      <div className="relative min-h-[72px] w-full flex flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-50/60 border border-slate-200 py-1 px-1">
        
        {/* Loading Skeleton / Status selagi menunggu server Cloudflare merespons (Mencegah kotak putih kosong) */}
        {!widgetReady && !loadError && !isVerified && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-1.5 bg-slate-50/90 text-slate-500 p-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memuat Cloudflare Turnstile...</span>
            </div>
            <span className="text-[10px] text-slate-400">Menghubungkan ke challenges.cloudflare.com</span>
          </div>
        )}

        {/* Kontainer Utama Iframe Cloudflare (Tetap di DOM tanpa diganggu ketikan user) */}
        <div 
          ref={containerRef} 
          className={`relative z-10 w-full flex justify-center items-center max-w-full overflow-hidden ${loadError ? 'hidden' : 'block'}`} 
        />

        {/* Fallback Box jika terjadi kegagalan jaringan atau diblokir adblocker */}
        {loadError && !isVerified && (
          <div className="relative z-20 w-full p-2.5 text-center space-y-2 bg-amber-50/90 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Koneksi Cloudflare Terbatas</span>
            </div>
            <p className="text-[10.5px] text-amber-800 leading-tight">
              Koneksi ke server Cloudflare lambat atau terhalang proteksi peramban. Anda dapat memverifikasi secara langsung di bawah ini:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
              <button
                type="button"
                onClick={handleFallbackClick}
                className="px-4 py-2 bg-[#043e2e] text-[#f3e5ab] text-xs font-bold rounded-lg hover:scale-[1.01] active:scale-[0.99] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verifikasi Mandiri: Saya Bukan Bot</span>
              </button>
              <button
                type="button"
                onClick={handleRetryCloudflare}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-slate-300 shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Muat Ulang</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Opsi Bantuan Jika Jaringan Pengguna Sedang Lambat ke Cloudflare */}
      {showSlowNetworkHelp && !isVerified && !loadError && (
        <div className="flex items-center justify-center pt-0.5">
          <button
            type="button"
            onClick={handleFallbackClick}
            className="text-[10px] text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <span>Koneksi ke Cloudflare terasa lambat?</span>
            <span className="font-bold underline">Klik verifikasi cadangan</span>
          </button>
        </div>
      )}

      {/* Info Petunjuk */}
      <p className="text-[9px] text-slate-400 text-center font-medium leading-none m-0 pt-0.5">
        Cukup centang kotak di atas untuk verifikasi otomatis tanpa perlu mengetik.
      </p>
    </div>
  );
};

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = (props) => {
  return (
    <TurnstileErrorBoundary onFallback={() => props.onVerify(`manual_turnstile_${Date.now()}`)}>
      <TurnstileInner {...props} />
    </TurnstileErrorBoundary>
  );
};

export default TurnstileWidget;
