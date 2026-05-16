import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
}

/**
 * Three pulsing dots, staggered.
 */
export default function LoadingOverlay({
  visible,
  message = 'Chargement',
  fullScreen = true,
}: LoadingOverlayProps) {
  const { colors, spacing, fonts, typeScale } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        {
          backgroundColor: fullScreen ? colors.surface + 'EE' : 'transparent',
          padding: spacing.lg,
        },
      ]}
      pointerEvents={fullScreen ? 'auto' : 'none'}
    >
      <View style={[styles.dotsRow, { gap: 8 }]}>
        <Dot color={colors.accent} delay={0} />
        <Dot color={colors.accent} delay={180} />
        <Dot color={colors.accent} delay={360} />
      </View>
      {message && (
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
            fontFamily: fonts.bodyMedium,
            marginTop: spacing.md,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

function Dot({ color, delay }: { color: string; delay: number }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const easing = Easing.bezier(0.45, 0, 0.55, 1);
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            easing,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            easing,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.6,
            duration: 500,
            easing,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 500,
            easing,
            useNativeDriver: true,
          }),
        ]),
        // Padding so total cycle is consistent across dots
        Animated.delay(540 - delay),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
