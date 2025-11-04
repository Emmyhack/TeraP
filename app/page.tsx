'use client';

import React, { Suspense, Component, ReactNode, useState, useEffect } from 'react';
import { useApp } from '@/stores/AppProvider';
import MainApp from '@/components/MainApp';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { EnhancedTherapyDashboard } from '@/components/enhanced/EnhancedTherapyDashboard';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode; fallback: (error: Error, reset: () => void) => ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback: (error: Error, reset: () => void) => ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('TeraP Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, () => {
        this.setState({ hasError: false, error: null });
      });
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">
          We&apos;re sorry, but there was an error loading the application.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Reload Page
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-xs text-red-600 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 text-lg">Loading TeraP Universal...</p>
        <p className="mt-2 text-gray-500 text-sm">Connecting to the decentralized wellness network</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { state } = useApp();
  const [showEnhanced, setShowEnhanced] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setShowEnhanced(urlParams.get('enhanced') === 'true');
  }, []);

  if (state.ui.isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary
      fallback={(error, reset) => <ErrorFallback error={error} resetErrorBoundary={reset} />}
    >
      <Suspense fallback={<LoadingFallback />}>
        <div className="relative">
          <MainApp />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}