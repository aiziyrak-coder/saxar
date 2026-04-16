import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
          <div className="min-h-[400px] flex items-center justify-center p-8 bg-white/70 border border-emerald-200/60">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Xatolik yuz berdi</h2>
            <p className="text-slate-600 mb-2 text-sm">
              Sahifa yuklanishi yoki ma&apos;lumotlar ko&apos;rinishi buzilgan bo&apos;lishi mumkin. Qayta yuklash odatda muammoni bartaraf etadi.
            </p>
            <p className="text-slate-500 mb-4 text-xs break-words">
              {this.state.error.message}
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Qayta yuklash
            </Button>
            <button
              type="button"
              className="mt-3 block mx-auto text-sm text-slate-600 hover:text-slate-900"
              onClick={this.handleRetry}
            >
              Shu sahifada qayta urinish
            </button>
            <button
              type="button"
              className="mt-2 block mx-auto text-sm text-slate-600 hover:text-slate-900"
              onClick={() => (window.location.href = '/')}
            >
              Bosh sahifaga
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
