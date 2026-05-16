/**
 * DriveWise — "Dawn Companion" palette
 *
 * Warm, earthy, sophisticated. Inspired by dawn light, leather cockpits,
 * journals. Deliberately anti-Material-Blue.
 *
 * Two palettes (Parchment for light, Midnight for dark) share identical
 * keys so the rest of the app stays palette-agnostic via useTheme().
 *
 * Legacy alias names (primary, fatigueLow, etc.) are preserved so the
 * 21 files already importing from "@/utils/theme" keep compiling.
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

  // Status (folded into the warm palette)
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
  white: '#FFFEFA',
  black: '#0F1419',
};

export const lightPalette: ThemePalette = {
  surface: '#F7F3EB',
  surfaceElevated: '#FFFEFA',
  surfaceSunken: '#EFEAE0',

  ink: '#0F1419',
  inkMuted: '#5C6470',
  inkSubtle: '#8B919E',
  inkInverse: '#F7F3EB',

  accent: '#C9763A',
  accentSoft: '#E8C9A8',
  accentMuted: '#F2DFC6',
  onAccent: '#FFFEFA',

  fatigueRest: '#6B9080',
  fatigueWatch: '#D4A24C',
  fatigueAlert: '#C0633B',
  fatigueStop: '#8B2E2E',

  success: '#6B9080',
  warning: '#D4A24C',
  error: '#8B2E2E',
  info: '#5C7B8A',

  hairline: 'rgba(15, 20, 25, 0.08)',
  hairlineStrong: 'rgba(15, 20, 25, 0.16)',
  scrim: 'rgba(15, 20, 25, 0.45)',

  // Legacy aliases ↓
  primary: '#C9763A',
  primaryDark: '#A35F2D',
  primaryLight: '#E8C9A8',
  fatigueLow: '#6B9080',
  fatigueModerate: '#D4A24C',
  fatigueHigh: '#C0633B',
  fatigueCritical: '#8B2E2E',
  white: sharedNeutrals.white,
  black: sharedNeutrals.black,
  gray: '#8B919E',
  lightGray: '#EFEAE0',
  darkGray: '#5C6470',
  background: '#F7F3EB',
  card: '#FFFEFA',
};

export const darkPalette: ThemePalette = {
  surface: '#0E1118',
  surfaceElevated: '#161B26',
  surfaceSunken: '#080A0F',

  ink: '#F2EDE0',
  inkMuted: '#8B919E',
  inkSubtle: '#5C6470',
  inkInverse: '#0F1419',

  accent: '#E89B5A',
  accentSoft: '#3A2B1E',
  accentMuted: '#52402E',
  onAccent: '#0F1419',

  fatigueRest: '#88B5A1',
  fatigueWatch: '#E6B868',
  fatigueAlert: '#DC8056',
  fatigueStop: '#C04848',

  success: '#88B5A1',
  warning: '#E6B868',
  error: '#C04848',
  info: '#7E9AAA',

  hairline: 'rgba(242, 237, 224, 0.10)',
  hairlineStrong: 'rgba(242, 237, 224, 0.18)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  // Legacy aliases ↓
  primary: '#E89B5A',
  primaryDark: '#C9763A',
  primaryLight: '#52402E',
  fatigueLow: '#88B5A1',
  fatigueModerate: '#E6B868',
  fatigueHigh: '#DC8056',
  fatigueCritical: '#C04848',
  white: sharedNeutrals.white,
  black: sharedNeutrals.black,
  gray: '#5C6470',
  lightGray: '#161B26',
  darkGray: '#8B919E',
  background: '#0E1118',
  card: '#161B26',
};

/**
 * Legacy export — points at the light palette so existing imports of
 * `colors.X` from `@/utils/theme` keep working unchanged.
 * Theming-aware components should call useTheme().colors instead.
 */
export const colors = lightPalette;
