/* features/admin/hooks/useAdminAuth.ts */
import { useState, useEffect, useCallback } from 'react';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { supabase } from '../../../config/supabase';

const adminRepo = RepositoryFactory.getAdminRepository();

export interface AdminAuthState {
  isAdmin: boolean;
  role: string | null;
  loading: boolean;
  adminEmail: string | null;
}

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAdmin: false,
    role: null,
    loading: true,
    adminEmail: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      // 1. If Supabase is present, check current user
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const authRes = await adminRepo.verifyAdminAuthorization();
          if (authRes.isAdmin) {
            setAuthState({
              isAdmin: true,
              role: authRes.role || 'super_admin',
              loading: false,
              adminEmail: user.email || null,
            });
            return;
          }
        }
      }

      // 2. Local demo session (only when Supabase is not configured)
      const localAdminSession = supabase ? null : localStorage.getItem('shop_khattabook_admin_session');
      if (localAdminSession) {
        try {
          const parsed = JSON.parse(localAdminSession);
          if (parsed?.isAdmin) {
            setAuthState({
              isAdmin: true,
              role: parsed.role || 'super_admin',
              loading: false,
              adminEmail: parsed.email || 'admin@khattabook.com',
            });
            return;
          }
        } catch {}
      }

      setAuthState({
        isAdmin: false,
        role: null,
        loading: false,
        adminEmail: null,
      });
    } catch {
      setAuthState({
        isAdmin: false,
        role: null,
        loading: false,
        adminEmail: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginAsAdmin = async (email: string, pass: string): Promise<boolean> => {
    // SECURITY: We never transmit passwords outside Supabase Auth
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (!error && data.user) {
          const verify = await adminRepo.verifyAdminAuthorization();
          if (verify.isAdmin) {
            setAuthState({
              isAdmin: true,
              role: verify.role || 'super_admin',
              loading: false,
              adminEmail: data.user.email || email,
            });
            return true;
          }
        }
        // Signed in but not an admin: don't leave a merchant session behind.
        if (!error && data.user) await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase admin login error:', err);
      }
      // With Supabase configured, admin access comes only from Supabase Auth
      // plus a platform_admins row. There is no client-side fallback.
      return false;
    }

    // Local demo mode only: all data lives in this browser, so there is
    // nothing to protect. Never reachable when Supabase is configured.
    if (email.trim() && pass.length >= 6) {
      localStorage.setItem('shop_khattabook_admin_session', JSON.stringify({
        isAdmin: true,
        email: email.trim(),
        role: 'super_admin',
        timestamp: new Date().toISOString(),
      }));
      setAuthState({
        isAdmin: true,
        role: 'super_admin',
        loading: false,
        adminEmail: email.trim(),
      });
      return true;
    }

    return false;
  };

  const logoutAdmin = async () => {
    localStorage.removeItem('shop_khattabook_admin_session');
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setAuthState({
      isAdmin: false,
      role: null,
      loading: false,
      adminEmail: null,
    });
  };

  return {
    ...authState,
    checkAuth,
    loginAsAdmin,
    logoutAdmin,
  };
}
