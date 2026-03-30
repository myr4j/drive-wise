import apiClient from './api';
import { SnapshotRequest, SnapshotResponse } from '@/types/api';

export const snapshotsApi = {
  /**
   * Record a GPS snapshot during a shift
   * Returns fatigue prediction, suggestion, and SHAP explanation
   */
  sendSnapshot: async (
    shiftId: string,
    data: SnapshotRequest
  ): Promise<SnapshotResponse> => {
    const response = await apiClient.post<SnapshotResponse>(
      `/shift/${shiftId}/snapshot`,
      data
    );
    return response.data;
  },
};

export default snapshotsApi;
