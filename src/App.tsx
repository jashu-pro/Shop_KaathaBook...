/* App.tsx */
import { useEffect } from 'react';
import { AppRouter } from './router/routes';
import { ThemeProvider } from './providers/ThemeProvider';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './providers/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

function App() {
  const loadSession = useAuthStore((state) => state.loadSession);

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
