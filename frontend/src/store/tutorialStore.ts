import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@drivewise:tutorial_dismissed';

interface TutorialState {
  dismissed: boolean;
  isLoaded: boolean;
  /** Incrémenté à chaque « Revoir le tutoriel » pour forcer le ré-affichage,
   *  même si `dismissed` ne change pas (ex. user avait juste cliqué « Passer »). */
  replayCount: number;
  hydrate: () => Promise<void>;
  dismiss: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  dismissed: false,
  isLoaded: false,
  replayCount: 0,

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
    set({ dismissed: false, replayCount: get().replayCount + 1 });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
}));

export default useTutorialStore;
