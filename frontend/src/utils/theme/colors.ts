/**
 * DriveWise — "Arctic Slate" palette
 *
 * Cool, clean, professional. Blue-navy accent, slate surfaces.
 * Two palettes (light / dark) share identical keys so the rest of the
 * app stays palette-agnostic via useTheme().
 *
 * Legacy alias names preserved for backward compatibility.
 */

export type ThemePalette = {
  // Surfaces
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;

  // Ink (text)
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  inkInverse: string;

  // Accent (signature)
  accent: string;
  accentSoft: string;
  accentMuted: string;
  onAccent: string;

  // Fatigue semantic colors
  fatigueRest: string;
  fatigueWatch: string;
  fatigueAlert: string;
  fatigueStop: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Structure
  hairline: string;
  hairlineStrong: string;
  scrim: string;

  // Legacy aliases — DO NOT remove until Phase 4 is done.
  primary: string;
  primaryDark: string;
  primaryLight: string;
  fatigueLow: string;
  fatigueModerate: string;
  fatigueHigh: string;
  fatigueCritical: string;
  white: string;
  black: string;
  gray: string;
  lightGray: string;
  darkGray: string;
  background: string;
  card: string;
};

const sharedNeutrals = {
  white: '#F8FAFD',
  black: '#0A1628',
};

export const lightPalette: ThemePalette = {
  surface: '#F0F4FA',
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#E1E8F4',

  ink: '#0A1628',
  inkMuted: '#4A5A72',
  inkSubtle: '#8A9BB5',
  inkInverse: '#F0F4FA',

  accent: '#3563D4',
  accentSoft: '#B8CCEE',
  accentMuted: '#DAE5F8',
  onAccent: '#FFFFFF',

  fatigueRest: '#2A9E82',
  fatigueWatch: '#C49A2A',
  fatigueAlert: '#C85A3A',
  fatigueStop: '#A02828',

  success: '#2A9E82',
  warning: '#C49A2A',
  error: '#A02828',
  info: '#3563D4',

  hairline: 'rgba(10, 22, 40, 0.08)',
  hairlineStrong: 'rgba(10, 22, 40, 0.16)',
  scrim: 'rgba(10, 22, 40, 0.45)',

  // Legacy aliases ↓
  primary: '#3563D4',
  primaryDark: '#2448A8',
  primaryLight: '#B8CCEE',
  fatigueLow: '#2A9E82',
  fatigueModerate: '#C49A2A',
  fatigueHigh: '#C85A3A',
  fatigueCritical: '#A02828',
  white: sharedNeutrals.white,
  black: sharedNeutrals.black,
  gray: '#8A9BB5',
  lightGray: '#E1E8F4',
  darkGray: '#4A5A72',
  background: '#F0F4FA',
  card: '#FFFFFF',
};

export const darkPalette: ThemePalette = {
  surface: '#0C1525',
  surfaceElevated: '#142035',
  surfaceSunken: '#070E1A',

  ink: '#DCE8F8',
  inkMuted: '#7A96B8',
  inkSubtle: '#445A78',
  inkInverse: '#0C1525',

  accent: '#6B9FE8',
  accentSoft: '#1A2E4A',
  accentMuted: '#1E3A5C',
  onAccent: '#0C1525',

  fatigueRest: '#3DBFA0',
  fatigueWatch: '#E0B840',
  fatigueAlert: '#E07050',
  fatigueStop: '#C84040',

  success: '#3DBFA0',
  warning: '#E0B840',
  error: '#C84040',
  info: '#6B9FE8',

  hairline: 'rgba(220, 232, 248, 0.10)',
  hairlineStrong: 'rgba(220, 232, 248, 0.18)',
  scrim: 'rgba(0, 0, 0, 0.65)',

  // Legacy aliases ↓
  primary: '#6B9FE8',
  primaryDark: '#3563D4',
  primaryLight: '#1E3A5C',
  fatigueLow: '#3DBFA0',
  fatigueModerate: '#E0B840',
  fatigueHigh: '#E07050',
  fatigueCritical: '#C84040',
  white: sharedNeutrals.white,
  black: sharedNeutrals.black,
  gray: '#445A78',
  lightGray: '#142035',
  darkGray: '#7A96B8',
  background: '#0C1525',
  card: '#142035',
};

/**
 * Legacy export — points at the light palette so existing imports of
 * `colors.X` from `@/utils/theme` keep working unchanged.
 * Theming-aware components should call useTheme().colors instead.
 */
export const colors = lightPalette;
