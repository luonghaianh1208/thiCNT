import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
          <div className="card-tech bg-white max-w-lg p-10 text-center">
            <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-2xl font-black text-brand-red mb-4 font-ui uppercase">Đã xảy ra lỗi</h1>
            <p className="text-slate-500 font-semibold mb-8 font-ui">
              Rất tiếc, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left">
              <p className="text-xs font-mono text-slate-400 break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="btn-cyber bg-brand-blue text-white h-14 px-8 mx-auto"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryClass;
