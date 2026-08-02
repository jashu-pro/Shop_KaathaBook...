/* stores/authStore.ts */
import { create } from 'zustand';
import type { User } from '../features/auth/types';
import type { Shop, CreateShopDTO } from '../features/shop/types';
import { RepositoryFactory } from '../repositories/RepositoryFactory';
import { Logger } from '../services/Logger';

interface AuthState {
  user: User | null;
  shop: Shop | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  loadSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  registerShop: (shopData: CreateShopDTO) => Promise<void>;
}

const authRepo = RepositoryFactory.getAuthRepository();
const shopRepo = RepositoryFactory.getShopRepository();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  shop: null,
  isAuthenticated: false,
  isOnboarded: false,
  isLoading: true,
  error: null,

  loadSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.getCurrentUser();
      if (user) {
        Logger.info(`AuthStore: Restored session for user ${user.email}`);
        const shop = await shopRepo.getShopByOwner(user.id);
        set({
          user,
          shop,
          isAuthenticated: true,
          isOnboarded: !!shop,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          shop: null,
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
        });
      }
    } catch (err: any) {
      Logger.error('AuthStore: Error restoring session', err);
      set({ error: err.message, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.signIn(email, password);
      Logger.info(`AuthStore: Login successful for user ${email}`);
      const shop = await shopRepo.getShopByOwner(user.id);
      set({
        user,
        shop,
        isAuthenticated: true,
        isOnboarded: !!shop,
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: Login failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.signUp(email, password, fullName);
      Logger.info(`AuthStore: Sign up successful for user ${email}`);
      set({
        user,
        shop: null,
        isAuthenticated: true,
        isOnboarded: false,
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: Sign up failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.signInWithGoogle();
      if (user) {
        Logger.info(`AuthStore: Google login successful for user ${user.email}`);
        const shop = await shopRepo.getShopByOwner(user.id);
        set({
          user,
          shop,
          isAuthenticated: true,
          isOnboarded: !!shop,
          isLoading: false,
        });
      }
    } catch (err: any) {
      Logger.error('AuthStore: Google sign in failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authRepo.signOut();
      Logger.info('AuthStore: Sign out successful');
      set({
        user: null,
        shop: null,
        isAuthenticated: false,
        isOnboarded: false,
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: Sign out failed', err);
      set({ error: err.message, isLoading: false });
    }
  },

  registerShop: async (shopData) => {
    const { user } = get();
    if (!user) {
      throw new Error('You must be logged in to register a shop');
    }
    set({ isLoading: true, error: null });
    try {
      const shop = await shopRepo.createShop(user.id, shopData);
      Logger.info(`AuthStore: Registered shop "${shop.name}" for user ${user.email}`);
      set({
        shop,
        isOnboarded: true,
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: Registering shop failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
