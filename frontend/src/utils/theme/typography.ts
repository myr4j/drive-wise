/**
 * DriveWise typography
 *
 * Display: Fraunces (serif, variable, with SOFT/WONK axes) — editorial signature
 * Body/UI: Geist Sans (Vercel) — precise geometric sans
 * Numeric: Geist Mono — tabular alignment for scores, durations, timestamps
 *
 * Font names match the constants exported by @expo-google-fonts/*.
 */

export const fontFamilies = {
  displayItalic: 'Fraunces_400Regular_Italic',
  display: 'Fraunces_500Medium',
  displayBold: 'Fraunces_600SemiBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  bodySemibold: 'Geist_600SemiBold',
  bodyBold: 'Geist_700Bold',
  mono: 'GeistMono_500Medium',
  monoRegular: 'GeistMono_400Regular',
} as const;

export type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
};

export const typeScale = {
  displayXl: {
    fontFamily: fontFamilies.displayItalic,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.6,
  },
  displayLg: {
    fontFamily: fontFamilies.display,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.4,
  },
  displayMd: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  displaySm: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.1,
  },
  titleLg: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: 20,
    lineHeight: 28,
  },
  titleMd: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: 17,
    lineHeight: 24,
  },
  titleSm: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyLg: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  monoMd: {
    fontFamily: fontFamilies.mono,
    fontSize: 14,
    lineHeight: 20,
  },
  monoLg: {
    fontFamily: fontFamilies.mono,
    fontSize: 18,
    lineHeight: 24,
  },
} satisfies Record<string, TypeStyle>;

export type TypeScaleKey = keyof typeof typeScale;

/**
 * The complete set of TTF identifiers that App.tsx must load via expo-font.
 * Order doesn't matter; missing fonts fall back to the system font silently.
 */
export const fontsToLoad = [
  fontFamilies.displayItalic,
  fontFamilies.display,
  fontFamilies.displayBold,
  fontFamilies.body,
  fontFamilies.bodyMedium,
  fontFamilies.bodySemibold,
  fontFamilies.bodyBold,
  fontFamilies.mono,
  fontFamilies.monoRegular,
] as const;

/**
 * Legacy `typography` export — preserves the old shape so existing files
 * that read `typography.sizes.md` etc. keep working.
 */
export const typography = {
  fontFamily: fontFamilies.body,
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
