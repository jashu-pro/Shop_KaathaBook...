/* auth/repositories/authRepository.ts */
import type { User } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  signUp(email: string, password: string, fullName: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User | void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

export class SupabaseAuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || user.user_metadata?.full_name || '',
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || '',
    };
  }

  async signUp(email: string, password: string, fullName: string): Promise<User> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to sign up');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      fullName,
    };
  }

  async signIn(email: string, password: string): Promise<User> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to sign in');
    }

    // Fetch profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      id: data.user.id,
      email: data.user.email || '',
      fullName: profile?.full_name || '',
      avatarUrl: profile?.avatar_url || '',
    };
  }

  async signInWithGoogle(): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
}

export class LocalAuthRepository implements IAuthRepository {
  private activeUserKey = 'active_local_user';

  async getCurrentUser(): Promise<User | null> {
    const userStr = localStorage.getItem(this.activeUserKey);
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  async signUp(email: string, password: string, fullName: string): Promise<User> {
    const existing = await LocalStorageDB.selectOne('profiles', (p: any) => p.email === email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const newProfile = await LocalStorageDB.insert('profiles', {
      email,
      full_name: fullName,
      password, // Simple mock
    });

    const user: User = {
      id: newProfile.id,
      email: newProfile.email,
      fullName: newProfile.full_name,
    };

    localStorage.setItem(this.activeUserKey, JSON.stringify(user));
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    const profile = await LocalStorageDB.selectOne('profiles', (p: any) => p.email === email);
    if (!profile || profile.password !== password) {
      throw new Error('Invalid email or password');
    }

    const user: User = {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
    };

    localStorage.setItem(this.activeUserKey, JSON.stringify(user));
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    throw new Error('Google sign-in requires a configured Supabase project.');
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.activeUserKey);
  }

  async resetPassword(email: string): Promise<void> {
    void email;
    // In local mode, simulate email dispatch with realistic delay
    await new Promise(resolve => setTimeout(resolve, 400));
  }
}
