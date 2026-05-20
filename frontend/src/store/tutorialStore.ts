import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@drivewise:tutorial_dismissed';

interface TutorialState {
  dismissed: boolean;
  isLoaded: boolean;
  hydrate: () => Promise<void>;
  dismiss: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  dismissed: false,
  isLoaded: false,

  hydrate: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      set({ dismissed: value === 'true', isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  dismiss: async () => {
    set({ dismissed: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  },

  reset: async () => {
    set({ dismissed: false });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
}));

export default useTutorialStore;
