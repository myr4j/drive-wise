import { create } from 'zustand';
import { shiftsApi } from '@/services';
import { Driver } from '@/types/api';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: '@drivewise:auth_token',
  DRIVER_DATA: '@drivewise:driver_data',
};

// In-memory storage for development (Expo SDK 54 compatibility)
const memoryStore: Record<string, string> = {};

const storage = {
  getItem: async (key: string): Promise<string | null> => memoryStore[key] || null,
  setItem: async (key: string, value: string): Promise<void> => { memoryStore[key] = value; },
  removeItem: async (key: string): Promise<void> => { delete memoryStore[key]; },
};

interface AuthState {
  driver: Driver | null;
  authToken: string | null;
  isAuthenticated: boolean;
  hasConsented: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDriver: (driver: Driver, token?: string) => void;
  setConsented: () => void;
  clearDriver: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadPersistedAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  driver: null,
  authToken: null,
  isAuthenticated: false,
  hasConsented: false,
  isLoading: true,
  error: null,

  setDriver: (driver, token) => {
    const hasConsented = !!(driver.consent_at);
    console.log('[AUTH] setDriver → consent_at:', driver.consent_at, '| hasConsented:', hasConsented);
    set({ driver, authToken: token || null, isAuthenticated: true, hasConsented, error: null, isLoading: false });

    // Persist driver data
    storage.setItem(STORAGE_KEYS.DRIVER_DATA, JSON.stringify(driver));
    if (token) {
      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }

    // Cleanup orphaned shifts when user logs in
    shiftsApi.cleanupOrphanedShifts(24)
      .then((result) => {
        if (result.cleaned_count > 0) {
          console.log(`Cleaned up ${result.cleaned_count} orphaned shift(s)`);
        }
      })
      .catch((err) => console.error('Cleanup error:', err));
  },

  setConsented: () => {
    set({ hasConsented: true });
  },

  clearDriver: () => {
    storage.removeItem(STORAGE_KEYS.DRIVER_DATA);
    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    set({ driver: null, authToken: null, isAuthenticated: false, hasConsented: false, error: null, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),

  loadPersistedAuth: async () => {
    try {
      const driverData = await storage.getItem(STORAGE_KEYS.DRIVER_DATA);
      const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (driverData) {
        const driver = JSON.parse(driverData) as Driver;
        const hasConsented = !!(driver.consent_at);
        set({ driver, authToken: token, isAuthenticated: true, hasConsented, isLoading: false });
        console.log('Auth state restored from storage');
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading persisted auth:', error);
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
