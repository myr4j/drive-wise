import apiClient from './api';
import {
  DriverRegisterRequest,
  DriverLoginRequest,
  PasswordResetRequest,
  DriverResponse,
  DriverLoginResponse,
} from '@/types/api';

export const authApi = {
  /**
   * Register a new driver
   */
  register: async (data: DriverRegisterRequest): Promise<DriverResponse> => {
    const response = await apiClient.post<DriverResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login driver
   */
  login: async (data: DriverLoginRequest): Promise<DriverLoginResponse> => {
    const response = await apiClient.post<DriverLoginResponse>('/auth/login', data);
    return response.data;
  },
  resetPassword: async (data: PasswordResetRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  acceptConsent: async (driverId: number): Promise<{ message: string; consent_at: string; consent_version: string }> => {
    const response = await apiClient.post(`/driver/me/consent?driver_id=${driverId}`);
    return response.data;
  },

  exportData: async (driverId: number): Promise<Record<string, unknown>> => {
    const response = await apiClient.get(`/driver/me/export?driver_id=${driverId}`);
    return response.data;
  },

  deleteAccount: async (driverId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/driver/me?driver_id=${driverId}`);
    return response.data;
  },
};

export default authApi;
