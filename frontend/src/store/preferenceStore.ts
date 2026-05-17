import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverApi, DriverPreferences } from '@/services/driver';

const STORAGE_KEY = '@drivewise:driver_prefs';

const DEFAULTS: Omit<DriverPreferences, 'driver_id'> = {
  work_days: '1,2,3,4,5',
  typical_start_h: 8,
  typical_end_h: 18,
  revenue_goal: null,
};

interface PreferenceState extends Omit<DriverPreferences, 'driver_id'> {
  isLoaded: boolean;
  load: (driverId: number) => Promise<void>;
  update: (driverId: number, prefs: Partial<Omit<DriverPreferences, 'driver_id'>>) => Promise<void>;
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  ...DEFAULTS,
  isLoaded: false,

  load: async (driverId) => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        set({ ...JSON.parse(cached), isLoaded: true });
      }
      const remote = await driverApi.getPreferences(driverId);
      const { driver_id: _, ...prefs } = remote;
      set({ ...prefs, isLoaded: true });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      set({ isLoaded: true });
    }
  },

  update: async (driverId, prefs) => {
    set(prefs);
    try {
      await driverApi.updatePreferences(driverId, prefs);
      const current = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        work_days: current.work_days,
        typical_start_h: current.typical_start_h,
        typical_end_h: current.typical_end_h,
        revenue_goal: current.revenue_goal,
        ...prefs,
      }));
    } catch {}
  },
}));

export default usePreferenceStore;
