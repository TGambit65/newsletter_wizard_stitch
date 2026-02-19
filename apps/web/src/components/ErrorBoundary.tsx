import React from 'react';
import { Wand2, AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message + '\n' + error.stack;
  }
  return JSON.stringify(error, null, 2);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4">
        <div className="w-full max-w-md text-center">
          {/* Wizard icon */}
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wand2 className="w-10 h-10 text-primary-500" />
          </div>

          <AlertTriangle className="w-8 h-8 text-error mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-neutral-500 mb-6">
            The wizard stumbled on an unexpected spell. We've been notified and are looking into it.
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center mb-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reload page
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors font-medium"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to dashboard
            </a>
          </div>

          {/* Show details toggle */}
          <button
            onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            {this.state.showDetails ? 'Hide details' : 'Show technical details'}
          </button>

          {this.state.showDetails && (
            <pre className="mt-4 p-4 bg-neutral-900 text-neutral-100 rounded-xl text-xs text-left overflow-auto max-h-48 font-mono">
              {serializeError(this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
