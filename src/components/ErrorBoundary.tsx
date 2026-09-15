import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMode?: 'fullscreen' | 'inline' | 'silent';
  onReset?: () => void;
  resetKeys?: any[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private autoRecoveryTimer: any = null;

  public state: State = {
    hasError: false,
    error: null,
    errorCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ErrorBoundary caught non-blocking component error]:', error?.message || error);
    
    // Auto-recovery mechanism: if this is the first error instance, attempt a silent self-healing reset
    if (this.state.errorCount < 1) {
      if (this.autoRecoveryTimer) clearTimeout(this.autoRecoveryTimer);
      this.autoRecoveryTimer = setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          errorCount: prev.errorCount + 1,
        }));
      }, 300);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // If resetKeys changed (e.g. data or tab updated), automatically clear any transient error
    if (this.state.hasError && this.props.resetKeys && prevProps.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys?.[idx]
      );
      if (hasChanged) {
        this.setState({ hasError: false, error: null, errorCount: 0 });
      }
    }
  }

  public componentWillUnmount() {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    try {
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const mode = this.props.fallbackMode || 'fullscreen';

      // Silent fallback: render nothing while recovering
      if (mode === 'silent') {
        return null;
      }

      // Inline fallback: only replace the isolated widget (e.g. chart/map), rest of app stays intact!
      if (mode === 'inline') {
        return (
          <div className="w-full my-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                {this.props.fallbackTitle || 'Tampilan Grafis Sedang Diselaraskan'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Pembaruan data visual sedang disegarkan secara otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Segarkan Bagian Ini</span>
            </button>
          </div>
        );
      }

      // Fullscreen / Modal fallback (only for critical unhandled root crashes)
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 text-white select-none">
          <div className="max-w-md w-full bg-[#06152d] border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
              <RefreshCw className="w-7 h-7 animate-spin-slow" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                {this.props.fallbackTitle || 'Aplikasi PSKS Jawa Barat'}
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Menyegarkan tampilan sistem. Silakan klik tombol di bawah untuk melanjutkan aktivitas Anda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#043e2e] font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Segarkan Tampilan</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
