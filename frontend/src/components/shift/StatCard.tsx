import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

import { colors, spacing, borderRadius, shadows } from '@/utils/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  trendValue,
}: StatCardProps) {
  const colorMap = {
    primary: { bg: colors.primaryLight, text: colors.primaryDark },
    success: { bg: colors.fatigueLow, text: '#2E7D32' },
    warning: { bg: colors.fatigueModerate, text: '#F57F17' },
    error: { bg: '#FFCDD2', text: colors.error },
    info: { bg: '#B3E5FC', text: '#0277BD' },
  };

  const theme = colorMap[color];

  return (
    <Card style={[styles.card, shadows.sm]} mode="elevated">
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="bodySmall" style={styles.title}>
            {title}
          </Text>
          {trend && trendValue && (
            <View style={[styles.trendBadge, styles[`${trend}Badge`]]}>
              <Text
                variant="labelSmall"
                style={[styles.trendText, styles[`${trend}Text`]]}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.valueContainer}>
          <Text variant="displaySmall" style={[styles.value, { color: theme.text }]}>
            {value}
          </Text>
        </View>
        <View style={[styles.indicator, { backgroundColor: theme.bg }]} />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    flex: 1,
    minHeight: 120,
  },
  content: {
    padding: spacing.md,
    justifyContent: 'space-between',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.gray,
    fontWeight: '500',
  },
  valueContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  value: {
    fontWeight: 'bold',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  trendBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  upBadge: {
    backgroundColor: colors.success + '20',
  },
  downBadge: {
    backgroundColor: colors.error + '20',
  },
  neutralBadge: {
    backgroundColor: colors.gray + '20',
  },
  trendText: {
    fontWeight: '600',
    fontSize: 10,
  },
  upText: {
    color: colors.success,
  },
  downText: {
    color: colors.error,
  },
  neutralText: {
    color: colors.gray,
  },
});
