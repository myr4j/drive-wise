import React from 'react';
import { StyleSheet, ViewStyle, Text } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';

import { colors, spacing, borderRadius, shadows } from '@/utils/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export default function Card({
  children,
  title,
  subtitle,
  actions,
  variant = 'elevated',
  style,
  contentStyle,
}: CardProps) {
  return (
    <PaperCard
      style={[styles.card, shadows.sm, style]}
      mode={variant === 'outlined' ? 'outlined' : 'elevated'}
    >
      {(title || subtitle) && (
        <PaperCard.Content>
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </PaperCard.Content>
      )}
      <PaperCard.Content style={[styles.content, contentStyle]}>
        {children}
      </PaperCard.Content>
      {actions && <PaperCard.Actions style={styles.actions}>{actions}</PaperCard.Actions>}
    </PaperCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    marginVertical: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  content: {
    paddingTop: 0,
  },
  actions: {
    marginLeft: 0,
    marginRight: 0,
    marginBottom: spacing.sm,
  },
});
