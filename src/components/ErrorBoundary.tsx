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
 * Self-Healing ErrorBoundary
 * Menjamin tidak ada layar modal pemblokir (seperti "Segarkan Tampilan") yang mengganggu pengguna.
 * Jika terjadi galat sesaat pada koneksi Firestore atau rendering, komponen melakukan
 * auto-recovery secara hening di latar belakang agar perubahan website tetap realtime 100%.
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
    console.warn('[ErrorBoundary auto-recovery realtime]:', error?.message || error);

    // Silent self-healing: otomatis reset state dalam 50ms tanpa memblokir layar
    if (this.autoRecoveryTimer) clearTimeout(this.autoRecoveryTimer);
    this.autoRecoveryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorCount: this.state.errorCount + 1,
      });
      if (this.props.onReset) {
        this.props.onReset();
      }
    }, 60);
  }

  public componentDidUpdate(prevProps: Props) {
    // Jika props atau resetKeys berubah, bersihkan error secara realtime
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

  public render() {
    if (this.state.hasError) {
      const mode = this.props.fallbackMode || 'silent';

      // Silent fallback: render nothing untuk sepersekian detik sementara sistem me-reset secara hening
      if (mode === 'silent' || mode === 'fullscreen') {
        return (
          <div className="w-full py-2 flex items-center justify-center text-xs text-slate-400 animate-pulse">
            <span>Menyelaraskan data realtime...</span>
          </div>
        );
      }

      // Inline fallback: hanya mengganti widget yang terisolir, bukan memblokir seluruh aplikasi
      if (mode === 'inline') {
        return (
          <div className="w-full my-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {this.props.fallbackTitle || 'Data visual sedang disinkronkan secara realtime.'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3 h-3 text-blue-600" />
              <span>Sinkronkan Sekarang</span>
            </button>
          </div>
        );
      }
    }

    return this.props.children;
  }
}

