/* auth/repositories/authRepository.ts */
import type { User } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  signUp(email: string, password: string, fullName: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User | void>;
  sendOtp(phone: string): Promise<{ success: boolean; message: string; mockOtp?: string }>;
  verifyOtp(phone: string, otp: string): Promise<User>;
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

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; mockOtp?: string }> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) throw error;
    return { success: true, message: 'OTP sent to mobile successfully' };
  }

  async verifyOtp(phone: string, otp: string): Promise<User> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    if (error || !data.user) throw error || new Error('Invalid OTP');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      id: data.user.id,
      email: data.user.email || `${phone}@phone.khattabook.local`,
      phone,
      fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Merchant',
      avatarUrl: profile?.avatar_url || '',
    };
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
    // Mock Google OAuth for local/demo mode.
    // Simulates the 1-second redirect delay of a real OAuth flow.
    await new Promise((r) => setTimeout(r, 900));

    const MOCK_GOOGLE_EMAIL = 'demo.merchant@gmail.com';
    const MOCK_GOOGLE_NAME  = 'Demo Merchant';
    const MOCK_AVATAR       = `https://ui-avatars.com/api/?name=Demo+Merchant&background=4285F4&color=fff&size=128&bold=true&rounded=true`;

    // Find or create the mock Google profile
    let profile: any = await LocalStorageDB.selectOne(
      'profiles',
      (p: any) => p.email === MOCK_GOOGLE_EMAIL
    );

    if (!profile) {
      profile = await LocalStorageDB.insert('profiles', {
        email:     MOCK_GOOGLE_EMAIL,
        full_name: MOCK_GOOGLE_NAME,
        avatar_url: MOCK_AVATAR,
        provider:  'google',
        password:  '__google_oauth__',
      });
    }

    const user: User = {
      id:        profile.id,
      email:     profile.email,
      fullName:  profile.full_name,
      avatarUrl: profile.avatar_url,
    };

    localStorage.setItem(this.activeUserKey, JSON.stringify(user));
    return user;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.activeUserKey);
  }

  private mockOtps: Record<string, string> = {};

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; mockOtp?: string }> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    // Generate realistic 6-digit OTP
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.mockOtps[cleanPhone] = randomOtp;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`khatta_otp_${cleanPhone}`, randomOtp);
    }
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      message: `OTP sent to +91 ${cleanPhone}`,
      mockOtp: randomOtp,
    };
  }

  async verifyOtp(phone: string, otp: string): Promise<User> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`khatta_otp_${cleanPhone}`) : null;
    const validOtp = this.mockOtps[cleanPhone] || stored || '123456';

    if (otp.trim() !== validOtp && otp.trim() !== '123456') {
      throw new Error('Invalid OTP code. Please check your SMS and try again.');
    }

    let profile: any = await LocalStorageDB.selectOne('profiles', (p: any) => p.phone === cleanPhone || p.email === `${cleanPhone}@khatta.in`);

    if (!profile) {
      profile = await LocalStorageDB.insert('profiles', {
        email: `${cleanPhone}@khatta.in`,
        phone: cleanPhone,
        full_name: `Merchant ${cleanPhone.slice(-4)}`,
        password: 'phone_otp_user',
      });
    }

    const user: User = {
      id: profile.id,
      email: profile.email,
      phone: cleanPhone,
      fullName: profile.full_name,
    };

    localStorage.setItem(this.activeUserKey, JSON.stringify(user));
    return user;
  }

  async resetPassword(email: string): Promise<void> {
    void email;
    // In local mode, simulate email dispatch with realistic delay
    await new Promise(resolve => setTimeout(resolve, 400));
  }
}
