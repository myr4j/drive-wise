import apiClient from './api';

export interface DriverPreferences {
  driver_id: number;
  work_days: string;
  typical_start_h: number;
  typical_end_h: number;
  revenue_goal: number | null;
}

export const driverApi = {
  getPreferences: async (driverId: number): Promise<DriverPreferences> => {
    const r = await apiClient.get(`/driver/me/preferences?driver_id=${driverId}`);
    return r.data;
  },

  updatePreferences: async (driverId: number, prefs: Partial<Omit<DriverPreferences, 'driver_id'>>): Promise<void> => {
    await apiClient.put(`/driver/me/preferences?driver_id=${driverId}`, prefs);
  },

  submitFeedback: async (driverId: number | null, category: string, message: string): Promise<void> => {
    const params = driverId ? `?driver_id=${driverId}` : '';
    await apiClient.post(`/feedback/${params}`, { category, message });
  },

  rateSuggestion: async (shiftId: number, rating: 1 | -1): Promise<void> => {
    await apiClient.post(`/shift/${shiftId}/rate-suggestion?rating=${rating}`);
  },
};

export default driverApi;
