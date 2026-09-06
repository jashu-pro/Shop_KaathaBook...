/* stores/authStore.ts */
import { create } from 'zustand';
import type { User } from '../features/auth/types';
import type { Shop, CreateShopDTO } from '../features/shop/types';
import { RepositoryFactory } from '../repositories/RepositoryFactory';
import { Logger } from '../services/Logger';

interface AuthState {
  user: User | null;
  shop: Shop | null;
  shops: Shop[];
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
  updateShop: (updates: Partial<Shop>) => Promise<Shop>;
  switchShop: (shopId: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; mockOtp?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
}

const authRepo = RepositoryFactory.getAuthRepository();
const shopRepo = RepositoryFactory.getShopRepository();

const resolveActiveShop = (userId: string, shops: Shop[]): Shop | null => {
  if (shops.length === 0) return null;
  const storedId = localStorage.getItem(`active_shop_id_${userId}`);
  const match = shops.find((s) => s.id === storedId);
  return match || shops[0];
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  shop: null,
  shops: [],
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
        const shops = await shopRepo.getShopsByOwner(user.id);
        const shop = resolveActiveShop(user.id, shops);
        set({
          user,
          shops,
          shop,
          isAuthenticated: true,
          isOnboarded: !!shop,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          shops: [],
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
      const shops = await shopRepo.getShopsByOwner(user.id);
      const shop = resolveActiveShop(user.id, shops);
      set({
        user,
        shops,
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
        shops: [],
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
        const shops = await shopRepo.getShopsByOwner(user.id);
        const shop = resolveActiveShop(user.id, shops);
        set({
          user,
          shops,
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

  sendOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authRepo.sendOtp(phone);
      Logger.info(`AuthStore: Sent OTP to phone ${phone}`);
      set({ isLoading: false });
      return res;
    } catch (err: any) {
      Logger.error('AuthStore: Send OTP failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  loginWithOtp: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.verifyOtp(phone, otp);
      Logger.info(`AuthStore: Mobile OTP login successful for phone ${phone}`);
      const shops = await shopRepo.getShopsByOwner(user.id);
      const shop = resolveActiveShop(user.id, shops);
      set({
        user,
        shops,
        shop,
        isAuthenticated: true,
        isOnboarded: !!shop,
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: OTP verification failed', err);
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
        shops: [],
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
    const { user, shops } = get();
    if (!user) {
      throw new Error('You must be logged in to register a shop');
    }
    set({ isLoading: true, error: null });
    try {
      const newShop = await shopRepo.createShop(user.id, shopData);
      Logger.info(`AuthStore: Registered shop "${newShop.name}" for user ${user.email}`);
      localStorage.setItem(`active_shop_id_${user.id}`, newShop.id);
      set({
        shops: [...shops, newShop],
        shop: newShop,
        isOnboarded: true,
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: Registering shop failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateShop: async (updates) => {
    const { shop, shops } = get();
    if (!shop) {
      throw new Error('No active shop found to update');
    }
    set({ isLoading: true, error: null });
    try {
      const updated = await shopRepo.updateShop(shop.id, updates);
      Logger.info(`AuthStore: Updated shop "${updated.name}"`);
      const updatedShops = shops.map((s) => (s.id === updated.id ? updated : s));
      set({
        shops: updatedShops,
        shop: updated,
        isLoading: false,
      });
      return updated;
    } catch (err: any) {
      Logger.error('AuthStore: Updating shop failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  switchShop: async (shopId: string) => {
    const { user, shops } = get();
    if (!user) {
      throw new Error('You must be logged in to switch shops');
    }
    let targetShop = shops.find((s) => s.id === shopId);
    if (!targetShop) {
      const fetched = await shopRepo.getShopById(shopId);
      if (fetched) {
        targetShop = fetched;
      }
    }
    if (!targetShop) {
      throw new Error('Shop not found');
    }
    localStorage.setItem(`active_shop_id_${user.id}`, targetShop.id);
    Logger.info(`AuthStore: Switched active shop to "${targetShop.name}" (${targetShop.id})`);
    set({
      shop: targetShop,
      isOnboarded: true,
    });
  },
}));
