/**
 * 4-point spacing scale, extended.
 * Includes legacy aliases (xs/sm/md/lg/xl) so existing code keeps working.
 */
export const spacing = {
  none: 0,
  micro: 2,
  xxs: 4,
  xs: 4, // legacy alias
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  huge: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
} as const;
