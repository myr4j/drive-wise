/**
 * Shadow tokens — soft, low-opacity, atmospheric.
 *
 * Light mode: warm shadows (slight brown tint via shadowColor) for depth on parchment.
 * Dark mode: shadows fade out; rely on hairline borders for depth instead.
 *
 * `shadows` (legacy export) maps the old sm/md/lg keys to new tokens so the
 * 21 importing files don't break.
 */
import { ViewStyle } from 'react-native';

export type ShadowToken = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const lightShadows = {
  hairline: {
    shadowColor: '#3A2410',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  raised: {
    shadowColor: '#3A2410',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  floating: {
    shadowColor: '#3A2410',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 8,
  },
  modal: {
    shadowColor: '#3A2410',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
  },
} satisfies Record<string, ShadowToken>;

export const darkShadows = {
  hairline: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 1,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 16,
  },
} satisfies Record<string, ShadowToken>;

export type ShadowSet = typeof lightShadows;

/**
 * Legacy export — old code uses shadows.sm / shadows.md / shadows.lg.
 * Map those onto the new tokens.
 */
export const shadows = {
  sm: lightShadows.hairline,
  md: lightShadows.raised,
  lg: lightShadows.floating,
};
