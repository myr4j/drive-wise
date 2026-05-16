/**
 * React Native Paper MD3 theme adapter.
 *
 * Maps our Dawn Companion palette onto Paper's MD3ColorScheme so that
 * Paper-provided primitives (Snackbar, Dialog, Menu, Portal, ProgressBar,
 * any <PaperProvider>-themed component still in the codebase) inherit our
 * colors and typography without having to be rewritten.
 *
 * Components rewritten in Phase 2 (Button, Card, Input) bypass Paper entirely.
 */
import {
  MD3LightTheme,
  MD3DarkTheme,
  configureFonts,
  MD3Theme,
} from 'react-native-paper';
import { lightPalette, darkPalette } from './colors';
import { fontFamilies } from './typography';

const fontConfig = {
  // Default body font applied to every variant unless overridden below
  default: {
    fontFamily: fontFamilies.body,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  // Display variants → Fraunces
  displayLarge: {
    fontFamily: fontFamilies.display,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.6,
    fontWeight: '500' as const,
  },
  displayMedium: {
    fontFamily: fontFamilies.display,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.4,
    fontWeight: '500' as const,
  },
  displaySmall: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.2,
    fontWeight: '500' as const,
  },
  headlineLarge: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.2,
    fontWeight: '500' as const,
  },
  headlineMedium: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.1,
    fontWeight: '500' as const,
  },
  headlineSmall: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  // Title variants → Geist Semibold
  titleLarge: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  titleMedium: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  titleSmall: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  // Body variants → Geist
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  // Label variants → Geist Medium
  labelLarge: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
    fontWeight: '500' as const,
  },
};

export const paperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: lightPalette.accent,
    onPrimary: lightPalette.onAccent,
    primaryContainer: lightPalette.accentSoft,
    onPrimaryContainer: lightPalette.ink,
    secondary: lightPalette.fatigueRest,
    onSecondary: lightPalette.onAccent,
    secondaryContainer: lightPalette.surfaceSunken,
    onSecondaryContainer: lightPalette.ink,
    tertiary: lightPalette.fatigueWatch,
    onTertiary: lightPalette.ink,
    background: lightPalette.surface,
    onBackground: lightPalette.ink,
    surface: lightPalette.surface,
    onSurface: lightPalette.ink,
    surfaceVariant: lightPalette.surfaceSunken,
    onSurfaceVariant: lightPalette.inkMuted,
    outline: lightPalette.hairlineStrong,
    outlineVariant: lightPalette.hairline,
    error: lightPalette.error,
    onError: lightPalette.onAccent,
    errorContainer: lightPalette.accentMuted,
    onErrorContainer: lightPalette.ink,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: lightPalette.surfaceElevated,
      level2: lightPalette.surfaceElevated,
      level3: lightPalette.surfaceElevated,
    },
  },
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkPalette.accent,
    onPrimary: darkPalette.onAccent,
    primaryContainer: darkPalette.accentSoft,
    onPrimaryContainer: darkPalette.ink,
    secondary: darkPalette.fatigueRest,
    onSecondary: darkPalette.onAccent,
    secondaryContainer: darkPalette.surfaceElevated,
    onSecondaryContainer: darkPalette.ink,
    tertiary: darkPalette.fatigueWatch,
    onTertiary: darkPalette.onAccent,
    background: darkPalette.surface,
    onBackground: darkPalette.ink,
    surface: darkPalette.surface,
    onSurface: darkPalette.ink,
    surfaceVariant: darkPalette.surfaceElevated,
    onSurfaceVariant: darkPalette.inkMuted,
    outline: darkPalette.hairlineStrong,
    outlineVariant: darkPalette.hairline,
    error: darkPalette.error,
    onError: darkPalette.onAccent,
    errorContainer: darkPalette.accentMuted,
    onErrorContainer: darkPalette.ink,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: darkPalette.surfaceElevated,
      level2: darkPalette.surfaceElevated,
      level3: darkPalette.surfaceElevated,
    },
  },
};
