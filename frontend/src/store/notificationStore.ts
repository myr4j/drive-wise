import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@drivewise:notification_prefs';

export interface NotificationPrefs {
  notificationsEnabled: boolean;
  quietMode: boolean;
  sessionStartEnabled: boolean;
  sessionStartHour: number;
  sessionStartMinute: number;
  sessionEndEnabled: boolean;
  sessionEndThresholdHours: number;
}

interface NotificationState extends NotificationPrefs {
  isLoaded: boolean;
  setPrefs: (prefs: Partial<NotificationPrefs>) => Promise<void>;
  loadPrefs: () => Promise<void>;
}

const DEFAULT_PREFS: NotificationPrefs = {
  notificationsEnabled: true,
  quietMode: false,
  sessionStartEnabled: false,
  sessionStartHour: 8,
  sessionStartMinute: 0,
  sessionEndEnabled: true,
  sessionEndThresholdHours: 10,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...DEFAULT_PREFS,
  isLoaded: false,

  setPrefs: async (prefs) => {
    set(prefs);
    try {
      const current = get();
      const toSave: NotificationPrefs = {
        notificationsEnabled: current.notificationsEnabled,
        quietMode: current.quietMode,
        sessionStartEnabled: current.sessionStartEnabled,
        sessionStartHour: current.sessionStartHour,
        sessionStartMinute: current.sessionStartMinute,
        sessionEndEnabled: current.sessionEndEnabled,
        sessionEndThresholdHours: current.sessionEndThresholdHours,
        ...prefs,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  },

  loadPrefs: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored) as Partial<NotificationPrefs>;
        set({ ...DEFAULT_PREFS, ...prefs, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));

export default useNotificationStore;
