/**
 * Motion tokens — spring-first, no linear easings.
 * Used by Reanimated (withSpring/withTiming) and Moti (transition prop).
 *
 * NOTE: Do NOT import Reanimated's Easing here. Calling Easing.bezier()
 * at module level (outside a component) breaks web bundling because
 * Reanimated worklets are not initialized when module-level code runs.
 * Import Easing directly inside component functions where needed.
 */

export const motion = {
  duration: {
    instant: 90,
    fast: 180,
    base: 240,
    slow: 360,
    deliberate: 520,
    breathing: 1600,
  },
  spring: {
    default: { damping: 18, stiffness: 200, mass: 1 },
    soft: { damping: 22, stiffness: 140, mass: 1 },
    snappy: { damping: 14, stiffness: 280, mass: 1 },
    gentle: { damping: 26, stiffness: 120, mass: 1 },
  },
  // Bezier params only — instantiate via Easing.bezier() inside components
  easingParams: {
    standard: [0.2, 0, 0, 1] as [number, number, number, number],
    emphasized: [0.3, 0, 0, 1] as [number, number, number, number],
    breathe: [0.45, 0, 0.55, 1] as [number, number, number, number],
  },
  stagger: {
    tight: 50,
    base: 80,
    relaxed: 120,
  },
} as const;
