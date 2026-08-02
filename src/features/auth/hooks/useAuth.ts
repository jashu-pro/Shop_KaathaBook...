/* auth/hooks/useAuth.ts */
import { useAuthStore } from '../../../stores/authStore';

export const useAuth = () => {
  const {
    user,
    shop,
    isAuthenticated,
    isOnboarded,
    isLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  } = useAuthStore();

  return {
    user,
    shop,
    isAuthenticated,
    isOnboarded,
    isLoading,
    error,
    login: signIn,
    signup: signUp,
    loginWithGoogle: signInWithGoogle,
    logout: signOut,
  };
};
