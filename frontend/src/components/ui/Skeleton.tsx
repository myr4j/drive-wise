import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  Easing,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Pulsing placeholder. Drives opacity on the native UI thread via
 * RN's Animated API.
 */
export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 900,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceSunken,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonStack({
  rows = 3,
  rowHeight = 16,
  gap = 8,
  widths,
  style,
}: {
  rows?: number;
  rowHeight?: number;
  gap?: number;
  widths?: DimensionValue[];
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.stack, { gap }, style]}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height={rowHeight}
          width={widths?.[i] ?? (i === rows - 1 ? '60%' : '100%')}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
  },
});
