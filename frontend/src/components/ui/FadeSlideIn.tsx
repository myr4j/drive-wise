import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

interface FadeSlideInProps {
  children: React.ReactNode;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Animation duration (ms, default 400) */
  duration?: number;
  /** Initial translateY offset (default 8, set 0 to disable) */
  fromY?: number;
  /** Initial scale (default 1, set e.g. 0.92 for scale-up entrance) */
  fromScale?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Entrance animation: fade + optional translateY/scale.
 *
 * Built on RN's `Animated` API with `useNativeDriver: true`, so transforms
 * run on the native UI thread without bridge round-trips. No Reanimated
 * dependency — works everywhere Expo Go supports.
 */
export default function FadeSlideIn({
  children,
  delay = 0,
  duration = 400,
  fromY = 8,
  fromScale = 1,
  style,
}: FadeSlideInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;
  const scale = useRef(new Animated.Value(fromScale)).current;

  useEffect(() => {
    const easing = Easing.bezier(0.2, 0, 0, 1);
    const common = { duration, delay, easing, useNativeDriver: true };
    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, { ...common, toValue: 1 }),
    ];
    if (fromY !== 0) {
      animations.push(
        Animated.timing(translateY, { ...common, toValue: 0 })
      );
    }
    if (fromScale !== 1) {
      animations.push(Animated.timing(scale, { ...common, toValue: 1 }));
    }
    Animated.parallel(animations).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {children}
    </Animated.View>
  );
}
