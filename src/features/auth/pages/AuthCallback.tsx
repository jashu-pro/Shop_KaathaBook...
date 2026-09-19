/* features/auth/pages/AuthCallback.tsx */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../config/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const loadSession = useAuthStore((state) => state.loadSession);
  const [statusMessage, setStatusMessage] = useState('Connecting your Google account...');

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      try {
        if (supabase) {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          if (code) {
            setStatusMessage('Verifying Google authorization code...');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.warn('exchangeCodeForSession info:', exchangeError.message);
            }
          }

          // Let Supabase process session tokens
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const u = session.user;
            const fullName = u.user_metadata?.full_name || u.user_metadata?.name || '';
            const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture || '';
            setStatusMessage(`Google account linked: ${u.email}`);

            // Ensure profile exists in profiles table
            await supabase.from('profiles').upsert({
              id: u.id,
              email: u.email || '',
              full_name: fullName,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          }
        }

        await loadSession();
        if (!isMounted) return;

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
        console.error('OAuth Callback processing error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [loadSession, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div className="spinner" style={{ width: '44px', height: '44px', borderWidth: '3.5px', marginBottom: '1.25rem', borderColor: 'rgba(66, 133, 244, 0.2)', borderTopColor: '#4285F4' }} />
      <h3 style={{ color: 'var(--text-heading)', fontWeight: '700', fontSize: '1.2rem', marginBottom: '0.4rem' }}>
        Google Sign-In
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
        {statusMessage}
      </p>
    </div>
  );
};

export default AuthCallback;
