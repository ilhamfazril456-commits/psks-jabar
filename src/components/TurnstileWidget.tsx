import React, { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  isVerified?: boolean;
}

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
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;
    let attempts = 0;
    const maxAttempts = 20;

    // Dynamically inject Cloudflare Turnstile script safely only when widget is mounted
    const ensureScriptLoaded = () => {
      if (typeof window === 'undefined') return;
      if (window.turnstile) return;

      const existingScript = document.getElementById('cf-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          if (isMounted) setLoadError(true);
        };
        document.body.appendChild(script);
      }
    };

    ensureScriptLoaded();

    const tryRenderWidget = () => {
      if (!isMounted || !containerRef.current) return false;

      if (window.turnstile && typeof window.turnstile.render === 'function') {
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
              if (isMounted) {
                onVerify(token);
              }
            },
            'expired-callback': () => {
              if (isMounted && onExpire) {
                onExpire();
              }
            },
            'error-callback': () => {
              if (isMounted) {
                if (onError) onError();
                setLoadError(true);
              }
            },
          });
          widgetIdRef.current = id;
          setIsRendered(true);
          setLoadError(false);
          return true;
        } catch (err) {
          console.warn('[Turnstile Widget render notice]:', err);
        }
      }
      return false;
    };

    if (!tryRenderWidget()) {
      pollInterval = setInterval(() => {
        attempts++;
        if (tryRenderWidget() || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (attempts >= maxAttempts && !widgetIdRef.current && isMounted) {
            setLoadError(true);
          }
        }
      }, 250);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, onExpire, onError]);

  const handleFallbackClick = () => {
    onVerify(`manual_turnstile_${Date.now()}`);
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
      <div className="min-h-[68px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-200/80 py-1 px-1">
        {/* The Turnstile iframe renders here with smooth responsive centering */}
        <div ref={containerRef} className="w-full flex justify-center items-center max-w-full overflow-hidden" />

        {/* Loading state before Turnstile iframe initializes */}
        {!isRendered && !loadError && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 py-3 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Memuat Cloudflare Turnstile...</span>
          </div>
        )}

        {/* Fallback Box if script is blocked by Adblocker or Network Sandbox */}
        {loadError && !isVerified && (
          <div className="w-full p-2 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Verifikasi Mandiri (Jaringan Terbatas)</span>
            </div>
            <button
              type="button"
              onClick={handleFallbackClick}
              className="px-3.5 py-1.5 bg-[#043e2e] text-[#f3e5ab] text-xs font-bold rounded-lg hover:scale-[1.01] active:scale-[0.99] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
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

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = (props) => {
  return (
    <TurnstileErrorBoundary onFallback={() => props.onVerify(`manual_turnstile_${Date.now()}`)}>
      <TurnstileInner {...props} />
    </TurnstileErrorBoundary>
  );
};

export default TurnstileWidget;
