import apiClient from './api';
import {
  DriverRegisterRequest,
  DriverLoginRequest,
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
};

export default authApi;
