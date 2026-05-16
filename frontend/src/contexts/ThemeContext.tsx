/**
 * ThemeContext — single source of truth for the app's color scheme.
 *
 * Three preference modes:
 *   - "light":  always Parchment
 *   - "dark":   always Midnight
 *   - "system": follows the OS setting (default)
 *
 * The user's choice is persisted to AsyncStorage so it survives reloads.
 * The resolved palette + shadows + Paper theme are exposed via useTheme().
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  lightPalette,
  darkPalette,
  ThemePalette,
} from '@/utils/theme/colors';
import {
  lightShadows,
  darkShadows,
  ShadowSet,
} from '@/utils/theme/shadows';
import {
  paperLightTheme,
  paperDarkTheme,
} from '@/utils/theme/paperTheme';
import { spacing, borderRadius } from '@/utils/theme/spacing';
import { typeScale, fontFamilies } from '@/utils/theme/typography';
import { motion } from '@/utils/theme/motion';

export type ColorSchemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  /** Resolved scheme — never "system", always "light" or "dark" */
  scheme: 'light' | 'dark';
  /** Raw user preference, including "system" */
  preference: ColorSchemePreference;
  /** True if scheme === "dark" */
  isDark: boolean;
  /** Active palette */
  colors: ThemePalette;
  /** Active shadow set */
  shadows: ShadowSet;
  /** Static tokens (don't depend on scheme) */
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typeScale: typeof typeScale;
  fonts: typeof fontFamilies;
  motion: typeof motion;
  /** Set the user preference (persisted) */
  setPreference: (pref: ColorSchemePreference) => void;
  /** Quick toggle between light <-> dark (sets explicit preference) */
  toggle: () => void;
};

const STORAGE_KEY = '@drivewise:theme_preference';

const defaultValue: ThemeContextValue = {
  scheme: 'light',
  preference: 'light',
  isDark: false,
  colors: lightPalette,
  shadows: lightShadows,
  spacing,
  borderRadius,
  typeScale,
  fonts: fontFamilies,
  motion,
  setPreference: () => {},
  toggle: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [preference, setPreferenceState] =
    useState<ColorSchemePreference>('light');
  const [hydrated, setHydrated] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          setPreferenceState(value);
        }
      })
      .catch(() => {
        // ignore; fall back to default
      })
      .finally(() => setHydrated(true));
  }, []);

  const scheme: 'light' | 'dark' = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const setPreference = useCallback((pref: ColorSchemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {
      // best-effort persistence
    });
  }, []);

  const toggle = useCallback(() => {
    setPreference(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setPreference]);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = scheme === 'dark';
    return {
      scheme,
      preference,
      isDark,
      colors: isDark ? darkPalette : lightPalette,
      shadows: isDark ? darkShadows : lightShadows,
      spacing,
      borderRadius,
      typeScale,
      fonts: fontFamilies,
      motion,
      setPreference,
      toggle,
    };
  }, [scheme, preference, setPreference, toggle]);

  // Avoid a flash of wrong theme during the brief async hydration
  if (!hydrated) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={value.isDark ? paperDarkTheme : paperLightTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
