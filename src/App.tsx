/* App.tsx */
import { useEffect } from 'react';
import { AppRouter } from './router/routes';
import { ThemeProvider } from './providers/ThemeProvider';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './providers/ErrorBoundary';
import { useAuthStore } from './stores/authStore';
import { isSupabaseConfigured } from './config/supabase';


function App() {
  const loadSession = useAuthStore((state) => state.loadSession);

  if (import.meta.env.PROD && !isSupabaseConfigured()) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.5rem', background: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px' }}>
          <h1 style={{ marginBottom: '0.75rem' }}>Shop KhattaBook is not configured</h1>
          <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before deploying. Production never uses browser-local storage as its data source.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
