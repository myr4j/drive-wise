import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/utils/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'transparent';
}

export default function Header({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightAction,
  variant = 'primary',
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const headerStyles = [
    styles.header,
    { paddingTop: insets.top + spacing.md },
    variant === 'primary' && styles.primaryHeader,
    variant === 'secondary' && styles.secondaryHeader,
    variant === 'transparent' && styles.transparentHeader,
  ];

  return (
    <View style={headerStyles}>
      <View style={styles.content}>
        {showBackButton && (
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={onBackPress}
            iconColor={variant === 'transparent' ? colors.darkGray : colors.white}
          />
        )}
        <View style={[styles.titleContainer, showBackButton && styles.titleContainerWithBack]}>
          <Text
            variant="titleLarge"
            style={[
              styles.title,
              variant === 'transparent' ? { color: colors.darkGray } : { color: colors.white },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="bodySmall"
              style={[
                styles.subtitle,
                variant === 'transparent' ? { color: colors.gray } : { color: colors.white + 'CC' },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  primaryHeader: {
    backgroundColor: colors.primary,
  },
  secondaryHeader: {
    backgroundColor: colors.darkGray,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleContainerWithBack: {
    marginLeft: spacing.xs,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 2,
  },
  rightAction: {
    marginLeft: 'auto',
  },
});
