import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  /**
   * Semantic accent color for the value. Maps to a palette token.
   */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatCard({
  title,
  value,
  color = 'primary',
  trend,
  trendValue,
}: StatCardProps) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();

  const accent =
    color === 'success'
      ? colors.fatigueRest
      : color === 'warning'
      ? colors.fatigueWatch
      : color === 'error'
      ? colors.error
      : color === 'info'
      ? colors.info
      : colors.accent;

  const trendAccent =
    trend === 'up'
      ? colors.fatigueRest
      : trend === 'down'
      ? colors.error
      : colors.inkMuted;

  return (
    <View
      style={{
        flex: 1,
        minHeight: 110,
        backgroundColor: colors.surfaceElevated,
        borderRadius: borderRadius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.hairline,
        padding: spacing.md,
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
          {title}
        </Text>
        {trend && trendValue && (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: borderRadius.sm,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: trendAccent,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                color: trendAccent,
              }}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}{' '}
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 30,
          lineHeight: 36,
          color: accent,
          marginTop: spacing.md,
          letterSpacing: -0.4,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>

      <View
        style={{
          height: 2,
          width: 24,
          backgroundColor: accent,
          marginTop: spacing.sm,
          opacity: 0.6,
          borderRadius: 1,
        }}
      />
    </View>
  );
}
