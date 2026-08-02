/* providers/ErrorBoundary.tsx */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Logger } from '../services/Logger';

interface Props {
  children: ReactNode;
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
    Logger.error('ErrorBoundary: Caught uncaught React error', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'sans-serif'
        }}>
          <div className="glass-panel glass-card" style={{ maxWidth: '480px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Something went wrong</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
              We encountered an unexpected error. Please refresh the page or try again. If the issue persists, contact support.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0c1220',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn btn-secondary"
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#334155',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
            {this.state.error && (
              <pre style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.75rem',
                color: '#64748b',
                overflowX: 'auto'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
