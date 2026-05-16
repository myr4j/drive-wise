import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { FatigueLevel } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { getFatigueLabel, getFatigueMessage } from '@/utils/formatters';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FatigueGaugeProps {
  fatigueLevel: FatigueLevel | null | undefined;
  fatigueScore: number | null | undefined;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showMessage?: boolean;
}

const SIZES = {
  small: { diameter: 140, stroke: 8, scoreSize: 36 },
  medium: { diameter: 200, stroke: 11, scoreSize: 56 },
  large: { diameter: 260, stroke: 14, scoreSize: 76 },
} as const;

export default function FatigueGauge({
  fatigueLevel,
  fatigueScore,
  size = 'large',
  showLabel = true,
  showMessage = true,
}: FatigueGaugeProps) {
  const { colors, fonts, typeScale, spacing } = useTheme();
  const { diameter, stroke, scoreSize } = SIZES[size];

  const radius = (diameter - stroke) / 2;
  const perimeter = 2 * Math.PI * radius;
  const score = Math.max(0, Math.min(1, fatigueScore ?? 0));

  // Discrete stroke color — recomputed on score change, not animated
  const strokeColor = useMemo(() => {
    if (score < 0.33) return colors.fatigueRest;
    if (score < 0.66) return colors.fatigueWatch;
    if (score < 0.88) return colors.fatigueAlert;
    return colors.fatigueStop;
  }, [score, colors]);

  // Progress (0..1) animated. We interpolate to strokeDashoffset.
  // useNativeDriver: false because strokeDashoffset isn't a native-animatable prop.
  const progress = useRef(new Animated.Value(0)).current;
  // Breathing scale animation (useNativeDriver: true)
  const breathScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: score,
      duration: 900,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start();
  }, [score]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, {
          toValue: 1.035,
          duration: 1600,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: true,
        }),
        Animated.timing(breathScale, {
          toValue: 1,
          duration: 1600,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // strokeDashoffset goes from perimeter (empty) to 0 (full circle)
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [perimeter, 0],
  });

  const displayScore = Math.round(score * 100);
  const label = getFatigueLabel(fatigueLevel);
  const message = getFatigueMessage(fatigueLevel);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          { width: diameter, height: diameter },
          { transform: [{ scale: breathScale }] },
        ]}
      >
        <Svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
        >
          <Defs>
            <LinearGradient id="bgRing" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.hairlineStrong} stopOpacity="1" />
              <Stop offset="1" stopColor={colors.hairline} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background track */}
          <Circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke="url(#bgRing)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
          />

          {/* Animated progress arc */}
          <AnimatedCircle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${perimeter} ${perimeter}`}
            strokeDashoffset={strokeDashoffset as any}
            originX={diameter / 2}
            originY={diameter / 2}
            rotation={-90}
          />
        </Svg>

        <View style={[StyleSheet.absoluteFillObject, styles.center]}>
          <Text
            style={{
              fontFamily: fonts.displayItalic,
              fontSize: scoreSize,
              lineHeight: scoreSize * 1.05,
              color: colors.ink,
              includeFontPadding: false,
            }}
            accessibilityLabel={`Niveau de fatigue ${displayScore} pour cent, ${label}`}
          >
            {displayScore}
          </Text>
          <Text
            style={{ ...typeScale.caption, color: strokeColor, marginTop: 4 }}
          >
            {label}
          </Text>
        </View>
      </Animated.View>

      {showLabel && (
        <Text
          style={{
            ...typeScale.titleSm,
            color: colors.inkMuted,
            marginTop: spacing.md,
            letterSpacing: 0.4,
          }}
        >
          Niveau actuel
        </Text>
      )}
      {showMessage && message ? (
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontSize: 16,
            lineHeight: 24,
            color: colors.inkMuted,
            marginTop: spacing.xs,
            paddingHorizontal: spacing.lg,
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
