/* features/auth/pages/AuthCallback.tsx */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const loadSession = useAuthStore((state) => state.loadSession);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        await loadSession();
        const { isAuthenticated, isOnboarded } = useAuthStore.getState();
        if (isAuthenticated) {
          if (!isOnboarded) {
            navigate('/shop-setup', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [loadSession, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '1rem' }} />
      <p style={{ color: 'var(--text-body)', fontWeight: 600 }}>Authenticating merchant session...</p>
    </div>
  );
};

export default AuthCallback;
