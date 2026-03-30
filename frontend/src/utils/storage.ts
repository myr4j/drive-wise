import { Driver } from '@/types/api';

// In-memory storage (for development)
// Note: AsyncStorage is not available in Expo SDK 54 without expo-secure-store
const memoryStore: Record<string, string> = {};

const KEYS = {
  AUTH_TOKEN: '@drivewise:auth_token',
  DRIVER_DATA: '@drivewise:driver_data',
  ACTIVE_SHIFT: '@drivewise:active_shift',
};

/**
 * Driver Storage (in-memory for development)
 */
export const driverStorage = {
  /**
   * Save driver data
   */
  setDriver: async (driver: Driver): Promise<void> => {
    try {
      memoryStore[KEYS.DRIVER_DATA] = JSON.stringify(driver);
    } catch (error) {
      console.error('Error saving driver data:', error);
    }
  },

  /**
   * Get driver data
   */
  getDriver: async (): Promise<Driver | null> => {
    try {
      const data = memoryStore[KEYS.DRIVER_DATA];
      return data ? (JSON.parse(data) as Driver) : null;
    } catch (error) {
      console.error('Error getting driver data:', error);
      return null;
    }
  },

  /**
   * Clear driver data
   */
  clearDriver: async (): Promise<void> => {
    try {
      delete memoryStore[KEYS.DRIVER_DATA];
    } catch (error) {
      console.error('Error clearing driver data:', error);
    }
  },
};

/**
 * Clear all stored data (logout)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    Object.values(KEYS).forEach((key) => {
      delete memoryStore[key];
    });
  } catch (error) {
    console.error('Error clearing all storage:', error);
  }
};

export default {
  driver: driverStorage,
  clearAll: clearAllStorage,
};
