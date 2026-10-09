import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

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

/**
 * Resilient ErrorBoundary
 * Menangani galat rendering dengan tenang dan stabil.
 * Mencegah loop refresh / kedipan cepat (infinite flickering loop)
 * dengan membatasi percobaan pemulihan otomatis maksimal 1 kali dan menyediakan tombol pemulihan.
 */
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
    console.error('[ErrorBoundary caught error]:', error?.message || error, error?.stack);

    // Kirim laporan galat ke server untuk diagnosa cepat
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || String(error),
          stack: error?.stack,
          componentStack: errorInfo?.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      }).catch(() => {});
    } catch {}

    // Cegah loop kedipan: HANYA coba auto-recovery 1 kali jika errorCount === 0 dengan jeda 800ms
    // Jika sudah pernah error (> 0), JANGAN di-reset otomatis agar layar TIDAK berkedip-kedip.
    if (this.state.errorCount === 0) {
      if (this.autoRecoveryTimer) clearTimeout(this.autoRecoveryTimer);
      this.autoRecoveryTimer = setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          errorCount: prev.errorCount + 1,
        }));
        if (this.props.onReset) {
          this.props.onReset();
        }
      }, 800);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Jika props atau resetKeys berubah dari luar, bersihkan error
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
    if (this.autoRecoveryTimer) clearTimeout(this.autoRecoveryTimer);
    this.setState({ hasError: false, error: null, errorCount: 0 });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      // Jika masih dalam percobaan recovery pertama, tampilkan pesan singkat tanpa kedipan
      if (this.state.errorCount === 0) {
        return (
          <div className="w-full py-4 flex items-center justify-center text-xs text-slate-500 bg-slate-50">
            <span>Memperbarui tampilan sistem...</span>
          </div>
        );
      }

      const mode = this.props.fallbackMode;

      // Inline fallback untuk widget yang terisolir
      if (mode === 'inline') {
        return (
          <div className="w-full my-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {this.props.fallbackTitle || 'Data visual sedang disinkronkan.'}
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] text-slate-400 font-mono max-w-md truncate">
                {this.state.error.message}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Muat Ulang Tampilan</span>
            </button>
          </div>
        );
      }

      // Layar Penuh / Default Fallback yang tenang, stabil, dan TIDAK BERKEDIP
      return (
        <div className="min-h-[50vh] w-full p-6 flex flex-col items-center justify-center text-center bg-slate-50/80 rounded-2xl border border-slate-200 my-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-inner">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {this.props.fallbackTitle || 'Penyelarasan Tampilan Sistem'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-3">
            Terdapat penyesuaian data baru pada tampilan ini. Sistem telah menghentikan kedipan layar secara otomatis.
          </p>
          {this.state.error?.message && (
            <div className="text-[11px] font-mono text-red-600/80 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 mb-4 max-w-lg overflow-x-auto text-left">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2b5c] text-white hover:bg-[#163a7a] text-xs font-bold cursor-pointer shadow-md transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Segarkan Komponen</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
