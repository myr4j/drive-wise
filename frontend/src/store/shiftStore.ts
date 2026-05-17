import { create } from 'zustand';
import { ShiftStartResponse, ShiftStatus } from '@/types/api';

interface ShiftState {
  activeShift: ShiftStartResponse | null;
  shiftStatus: ShiftStatus | null;
  isLoading: boolean;
  error: string | null;

  // Break tracking
  isOnBreak: boolean;
  breakStartedAt: string | null;
  activeBreakId: number | null;

  // Actions
  setActiveShift: (shift: ShiftStartResponse) => void;
  clearActiveShift: () => void;
  setShiftStatus: (status: ShiftStatus) => void;
  clearShiftStatus: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  startBreak: (breakId: number, startedAt: string) => void;
  endBreak: () => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  activeShift: null,
  shiftStatus: null,
  isLoading: false,
  error: null,
  isOnBreak: false,
  breakStartedAt: null,
  activeBreakId: null,

  setActiveShift: (shift) => set({ activeShift: shift, error: null }),
  clearActiveShift: () => set({
    activeShift: null,
    shiftStatus: null,
    error: null,
    isOnBreak: false,
    breakStartedAt: null,
    activeBreakId: null,
  }),
  setShiftStatus: (status) => set({ shiftStatus: status }),
  clearShiftStatus: () => set({ shiftStatus: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  startBreak: (breakId, startedAt) => set({ isOnBreak: true, breakStartedAt: startedAt, activeBreakId: breakId }),
  endBreak: () => set({ isOnBreak: false, breakStartedAt: null, activeBreakId: null }),
}));

export default useShiftStore;
