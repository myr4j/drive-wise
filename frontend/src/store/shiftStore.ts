import { create } from 'zustand';
import { ShiftStartResponse, ShiftStatus } from '@/types/api';

interface ShiftState {
  activeShift: ShiftStartResponse | null;
  shiftStatus: ShiftStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveShift: (shift: ShiftStartResponse) => void;
  clearActiveShift: () => void;
  setShiftStatus: (status: ShiftStatus) => void;
  clearShiftStatus: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  activeShift: null,
  shiftStatus: null,
  isLoading: false,
  error: null,

  setActiveShift: (shift) => set({ activeShift: shift, error: null }),
  clearActiveShift: () => set({ 
    activeShift: null, 
    shiftStatus: null,
    error: null 
  }),
  setShiftStatus: (status) => set({ shiftStatus: status }),
  clearShiftStatus: () => set({ shiftStatus: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));

export default useShiftStore;
