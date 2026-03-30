import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';

import { colors, spacing } from '@/utils/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showIllustration?: boolean;
}

export default function EmptyState({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
  showIllustration = true,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {showIllustration && (
        <View style={styles.illustrationContainer}>
          <IconButton icon={icon} size={64} iconColor={colors.gray} />
        </View>
      )}
      <Text variant="titleLarge" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  illustrationContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: 'bold',
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 150,
  },
});
