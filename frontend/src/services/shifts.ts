import apiClient from './api';
import {
  ShiftStartRequest,
  ShiftStartResponse,
  ShiftEndResponse,
  ShiftStatus,
  ShiftsListResponse,
  DriverStatsResponse,
  FeatureImportanceResponse,
} from '@/types/api';

export const shiftsApi = {
  /**
   * Start a new driving shift
   */
  startShift: async (driverId: number): Promise<ShiftStartResponse> => {
    const response = await apiClient.post<ShiftStartResponse>('/shift/start', {}, {
      params: { driver_id: driverId },
    });
    return response.data;
  },

  /**
   * End a shift and get summary
   */
  endShift: async (shiftId: string): Promise<ShiftEndResponse> => {
    const response = await apiClient.post<ShiftEndResponse>(`/shift/${shiftId}/end`);
    return response.data;
  },

  /**
   * Get current shift status
   */
  getShiftStatus: async (shiftId: string): Promise<ShiftStatus> => {
    const response = await apiClient.get<ShiftStatus>(`/shift/${shiftId}/status`);
    return response.data;
  },

  /**
   * List shifts with pagination and filters
   */
  listShifts: async (params?: {
    driver_id?: number | string;
    status?: 'active' | 'completed';
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<ShiftsListResponse> => {
    const apiParams: Record<string, any> = {};
    if (params?.driver_id) {
      // Convert to number if string
      apiParams.driver_id = typeof params.driver_id === 'string'
        ? parseInt(params.driver_id, 10)
        : params.driver_id;
    }
    if (params?.status) apiParams.status = params.status;
    if (params?.from_date) apiParams.from_date = params.from_date;
    if (params?.to_date) apiParams.to_date = params.to_date;
    if (params?.page) apiParams.page = params.page;
    if (params?.per_page) apiParams.per_page = params.per_page;

    const response = await apiClient.get<ShiftsListResponse>('/shift/s', { params: apiParams });
    return response.data;
  },

  /**
   * Get driver statistics
   */
  getDriverStats: async (driverId: number | string): Promise<DriverStatsResponse> => {
    // Convert to number if string
    const numericId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;
    const response = await apiClient.get<DriverStatsResponse>('/shift/driver/stats', {
      params: { driver_id: numericId },
    });
    return response.data;
  },

  /**
   * Get ML model feature importance
   */
  getFeatureImportance: async (): Promise<FeatureImportanceResponse> => {
    const response = await apiClient.get<FeatureImportanceResponse>('/shift/ml/feature-importance');
    return response.data;
  },

  /**
   * Cleanup orphaned shifts (active for too long)
   */
  cleanupOrphanedShifts: async (hoursThreshold: number = 24): Promise<{
    message: string;
    cleaned_count: number;
    hours_threshold: number;
  }> => {
    const response = await apiClient.post('/shift/cleanup/orphaned', null, {
      params: { hours_threshold: hoursThreshold },
    });
    return response.data;
  },
};

export default shiftsApi;
