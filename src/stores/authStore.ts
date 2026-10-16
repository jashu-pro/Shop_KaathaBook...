/* stores/authStore.ts */
import { create } from 'zustand';
import type { User } from '../features/auth/types';
import type { Shop, CreateShopDTO, ShopRegistrationRequest } from '../features/shop/types';
import { RepositoryFactory } from '../repositories/RepositoryFactory';
import { Logger } from '../services/Logger';

interface AuthState {
  user: User | null;
  shop: Shop | null;
  shops: Shop[];
  registrationRequest: ShopRegistrationRequest | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  loadSession: () => Promise<void>;
  refreshShopStatus: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: (selectedEmail?: string, selectedName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  registerShop: (shopData: CreateShopDTO) => Promise<void>;
  updateShop: (updates: Partial<Shop>) => Promise<Shop>;
  switchShop: (shopId: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; mockOtp?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; message: string; mockOtp?: string }>;
  loginWithEmailOtp: (email: string, otp: string) => Promise<void>;
  clearError: () => void;
}

const authRepo = RepositoryFactory.getAuthRepository();
const shopRepo = RepositoryFactory.getShopRepository();

const isShopActive = (s: Shop | null): boolean => {
  return !!s && s.status === 'active';
};

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
  registrationRequest: null,
  isAuthenticated: false,
  isOnboarded: false,
  isLoading: true,
  error: null,
  clearError: () => set({ error: null }),

  loadSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.getCurrentUser();
      if (user) {
        Logger.info(`AuthStore: Restored session for user ${user.email}`);
        const shops = await shopRepo.getShopsByOwner(user.id);
        const shop = resolveActiveShop(user.id, shops);
        let registrationRequest: ShopRegistrationRequest | null = null;
        if (shop) {
          registrationRequest = await shopRepo.getRegistrationRequestByShopId(shop.id);
        } else {
          registrationRequest = await shopRepo.getRegistrationRequestByOwner(user.id);
        }

        set({
          user,
          shops,
          shop,
          registrationRequest,
          isAuthenticated: true,
          isOnboarded: isShopActive(shop),
          isLoading: false,
        });
      } else {
        set({
          user: null,
          shops: [],
          shop: null,
          registrationRequest: null,
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

  refreshShopStatus: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const shops = await shopRepo.getShopsByOwner(user.id);
      const activeShop = resolveActiveShop(user.id, shops);
      let registrationRequest: ShopRegistrationRequest | null = null;
      if (activeShop) {
        registrationRequest = await shopRepo.getRegistrationRequestByShopId(activeShop.id);
      } else {
        registrationRequest = await shopRepo.getRegistrationRequestByOwner(user.id);
      }

      set({
        shops,
        shop: activeShop,
        registrationRequest,
        isOnboarded: isShopActive(activeShop),
      });
    } catch (err: any) {
      Logger.error('AuthStore: refreshShopStatus failed', err);
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.signIn(email, password);
      Logger.info(`AuthStore: Login successful for user ${email}`);
      const shops = await shopRepo.getShopsByOwner(user.id);
      const shop = resolveActiveShop(user.id, shops);
      let registrationRequest: ShopRegistrationRequest | null = null;
      if (shop) {
        registrationRequest = await shopRepo.getRegistrationRequestByShopId(shop.id);
      }

      set({
        user,
        shops,
        shop,
        registrationRequest,
        isAuthenticated: true,
        isOnboarded: isShopActive(shop),
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
        registrationRequest: null,
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

  signInWithGoogle: async (selectedEmail?: string, selectedName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.signInWithGoogle(selectedEmail, selectedName);
      if (user) {
        Logger.info(`AuthStore: Google login successful for user ${user.email}`);
        const shops = await shopRepo.getShopsByOwner(user.id);
        const shop = resolveActiveShop(user.id, shops);
        let registrationRequest: ShopRegistrationRequest | null = null;
        if (shop) {
          registrationRequest = await shopRepo.getRegistrationRequestByShopId(shop.id);
        }

        set({
          user,
          shops,
          shop,
          registrationRequest,
          isAuthenticated: true,
          isOnboarded: isShopActive(shop),
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
      let registrationRequest: ShopRegistrationRequest | null = null;
      if (shop) {
        registrationRequest = await shopRepo.getRegistrationRequestByShopId(shop.id);
      }

      set({
        user,
        shops,
        shop,
        registrationRequest,
        isAuthenticated: true,
        isOnboarded: isShopActive(shop),
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: OTP verification failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  sendEmailOtp: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authRepo.sendEmailOtp(email);
      Logger.info(`AuthStore: Sent OTP to email ${email}`);
      set({ isLoading: false });
      return res;
    } catch (err: any) {
      Logger.error('AuthStore: Send Email OTP failed', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  loginWithEmailOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepo.verifyEmailOtp(email, otp);
      Logger.info(`AuthStore: Email OTP login successful for email ${email}`);
      const shops = await shopRepo.getShopsByOwner(user.id);
      const shop = resolveActiveShop(user.id, shops);
      let registrationRequest: ShopRegistrationRequest | null = null;
      if (shop) {
        registrationRequest = await shopRepo.getRegistrationRequestByShopId(shop.id);
      }

      set({
        user,
        shops,
        shop,
        registrationRequest,
        isAuthenticated: true,
        isOnboarded: isShopActive(shop),
        isLoading: false,
      });
    } catch (err: any) {
      Logger.error('AuthStore: Email OTP verification failed', err);
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
        registrationRequest: null,
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
      const registrationRequest = await shopRepo.getRegistrationRequestByShopId(newShop.id);
      Logger.info(`AuthStore: Registered shop "${newShop.name}" for user ${user.email} (Status: ${newShop.status})`);
      localStorage.setItem(`active_shop_id_${user.id}`, newShop.id);
      
      set({
        shops: [...shops, newShop],
        shop: newShop,
        registrationRequest,
        isOnboarded: isShopActive(newShop),
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
        isOnboarded: isShopActive(updated),
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
    
    let registrationRequest: ShopRegistrationRequest | null = null;
    if (targetShop) {
      registrationRequest = await shopRepo.getRegistrationRequestByShopId(targetShop.id);
    }

    set({
      shop: targetShop,
      registrationRequest,
      isOnboarded: isShopActive(targetShop),
    });
  },
}));
