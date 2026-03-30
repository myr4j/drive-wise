import { create } from 'zustand';
import { FatigueLevel, SnapshotResponse, ShapExplanation } from '@/types/api';

interface FatigueHistoryPoint {
  timestamp: string;
  fatigueScore: number;
  fatigueLevel: FatigueLevel;
}

interface FatigueState {
  currentFatigueLevel: FatigueLevel | null;
  currentFatigueScore: number | null;
  fatigueHistory: FatigueHistoryPoint[];
  lastSnapshot: SnapshotResponse | null;
  lastShapExplanation: ShapExplanation | null;
  suggestion: { message: string; delivery: string } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  updateFatigue: (snapshot: SnapshotResponse) => void;
  clearFatigueData: () => void;
  setSuggestion: (suggestion: { message: string; delivery: string } | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFatigueStore = create<FatigueState>((set) => ({
  currentFatigueLevel: null,
  currentFatigueScore: null,
  fatigueHistory: [],
  lastSnapshot: null,
  lastShapExplanation: null,
  suggestion: null,
  isLoading: false,
  error: null,

  updateFatigue: (snapshot) => set((state) => ({
    currentFatigueLevel: snapshot.fatigue_level,
    currentFatigueScore: snapshot.fatigue_score,
    fatigueHistory: [
      ...state.fatigueHistory.slice(-50), // Keep last 50 points
      {
        timestamp: new Date().toISOString(),
        fatigueScore: snapshot.fatigue_score,
        fatigueLevel: snapshot.fatigue_level,
      },
    ],
    lastSnapshot: snapshot,
    lastShapExplanation: snapshot.explanation,
    suggestion: snapshot.suggestion,
    error: null,
  })),
  clearFatigueData: () => set({
    currentFatigueLevel: null,
    currentFatigueScore: null,
    fatigueHistory: [],
    lastSnapshot: null,
    lastShapExplanation: null,
    suggestion: null,
    error: null,
  }),
  setSuggestion: (suggestion) => set({ suggestion }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));

export default useFatigueStore;
