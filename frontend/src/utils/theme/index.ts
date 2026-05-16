/**
 * theme/ — DriveWise design system entry point
 *
 * Static tokens exposed here for files that don't need to react to
 * theme changes (constants, formatters, one-off utilities).
 *
 * For theme-aware UI use `useTheme()` from `@/contexts/ThemeContext`,
 * which returns the *current* (light or dark) palette + shadows.
 */
import { StyleSheet } from 'react-native';

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './motion';
export * from './shadows';
export * from './paperTheme';

// ---- Legacy globalStyles ------------------------------------------------
// Kept so existing imports of `globalStyles.card` etc. still resolve.
// New components should compose from theme tokens directly.
import { lightPalette } from './colors';
import { borderRadius, spacing } from './spacing';
import { lightShadows } from './shadows';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightPalette.surface,
  },
  card: {
    backgroundColor: lightPalette.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightPalette.hairline,
    ...lightShadows.hairline,
  },
  button: {
    backgroundColor: lightPalette.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: lightPalette.surfaceSunken,
  },
});

export default {
  colors: lightPalette,
  spacing,
  borderRadius,
  globalStyles,
};
