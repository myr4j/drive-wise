// Fatigue level enum matching backend
export enum FatigueLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface FatigueHistoryPoint {
  timestamp: string;
  fatigueScore: number;
  fatigueLevel: FatigueLevel;
}

// Driver types
export interface Driver {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string | Date;
  updated_at?: string | Date;
}

// Auth request/response types
export interface DriverRegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface DriverLoginRequest {
  email: string;
  password: string;
}

export interface DriverResponse {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string | Date;
  updated_at?: string | Date;
}

export interface DriverLoginResponse {
  driver: DriverResponse;
  message?: string;
}

// Shift types
export interface ShiftStartRequest {
  started_at?: string; // Optional, backend defaults to UTC now
  driver_id?: string; // Optional, backend accepts as query param or in body
}

export interface ShiftStartResponse {
  shift_id: number;
  started_at: string;
  message?: string;
}

export interface ShiftEndResponse {
  shift_id: number;
  started_at: string;
  ended_at: string;
  duration_h: number;
  active_driving_h: number;
  total_break_min: number;
  break_count: number;
  total_snapshots?: number;
  avg_fatigue_score?: number;
  max_fatigue_score?: number;
  fatigue_peaks_count?: number;
  suggestions_given?: number;
  summary: string;
}

export interface ShiftStatus {
  shift_id: number;
  status: 'active' | 'completed';
  started_at: string;
  ended_at?: string;
  duration_h?: number;
  snapshot_count?: number;
  last_fatigue_score?: number;
  last_fatigue_level?: FatigueLevel;
}

export interface ShiftListItem {
  id: number;
  driver_id?: number;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'completed';
  duration_h?: number;
  avg_fatigue_score?: number;
  max_fatigue_score?: number;
}

export interface ShiftsListResponse {
  shifts: ShiftListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Snapshot types
export interface SnapshotRequest {
  speed_kmh: number;
  latitude: number;
  longitude: number;
  timestamp?: string; // Optional, backend defaults to UTC now
}

export interface ShapContribution {
  feature: string;
  label: string;
  value: number;
  shap_value: number;
  impact: number;
  direction: string;
}

export interface ShapExplanation {
  base_value: number;
  predicted_value: number;
  shap_values: Record<string, number>;
  contributions: ShapContribution[];
  top_positive: ShapContribution[];
  top_negative: ShapContribution[];
  feature_importance_ranking: string[];
  explanation_text: string;
}

export interface Suggestion {
  fatigue_level: FatigueLevel;
  message: string;
  delivery: string; // 'none', 'in_app', 'push_soft', 'push_strong'
}

export interface SnapshotResponse {
  snapshot_id: number;
  fatigue_score: number;
  fatigue_level: FatigueLevel;
  suggestion: Suggestion | null;
  explanation: ShapExplanation | null;
}

// Driver stats types
export interface FatigueDistribution {
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

export interface FatigueTrendPoint {
  date: string;
  avg_fatigue_score: number;
  snapshot_count: number;
}

export interface DriverStatsResponse {
  total_shifts: number;
  total_driving_hours: number;
  total_break_minutes: number;
  avg_breaks_per_shift: number;
  avg_fatigue_score: number;
  max_fatigue_score: number;
  total_fatigue_peaks: number;
  fatigue_distribution: Record<string, number>;
  fatigue_trend_7_days: FatigueTrendPoint[];
}

export interface FeatureImportanceResponse {
  status: string;
  feature_importance: Record<string, number>;
  ranking: string[];
}

// API Error type
export interface ApiError {
  detail: string;
  code?: string;
  status?: number;
}

export class ApiErrorClass extends Error {
  status?: number;
  code?: string;
  details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
