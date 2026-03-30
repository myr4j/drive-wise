import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { FatigueLevel } from '@/types/api';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { getFatigueColor, getFatigueLabel, getFatigueMessage } from '@/utils/formatters';

interface FatigueGaugeProps {
  fatigueLevel: FatigueLevel | null | undefined;
  fatigueScore: number | null | undefined;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showMessage?: boolean;
}

export default function FatigueGauge({
  fatigueLevel,
  fatigueScore,
  size = 'large',
  showLabel = true,
  showMessage = true,
}: FatigueGaugeProps) {
  const fatigueColor = getFatigueColor(fatigueLevel);
  const score = fatigueScore ?? 0;

  const dimensions = {
    small: { outer: 100, inner: 80, fontSize: 20 },
    medium: { outer: 140, inner: 110, fontSize: 28 },
    large: { outer: 180, inner: 140, fontSize: 36 },
  };

  const { outer, inner, fontSize } = dimensions[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.gaugeOuter,
          {
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            backgroundColor: fatigueColor,
            opacity: 0.2,
          },
        ]}
      >
        <View
          style={[
            styles.gaugeInner,
            {
              width: inner,
              height: inner,
              borderRadius: inner / 2,
              backgroundColor: fatigueColor,
            },
          ]}
        >
          <Text
            style={[
              styles.scoreText,
              { fontSize, color: colors.white },
            ]}
          >
            {Math.round(score * 100)}%
          </Text>
        </View>
      </View>

      {showLabel && (
        <Text
          variant="titleLarge"
          style={[styles.label, { color: fatigueColor }]}
        >
          {getFatigueLabel(fatigueLevel)}
        </Text>
      )}

      {showMessage && (
        <Text variant="bodyMedium" style={styles.message}>
          {getFatigueMessage(fatigueLevel)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  gaugeOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gaugeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    color: colors.gray,
    paddingHorizontal: spacing.md,
  },
});
