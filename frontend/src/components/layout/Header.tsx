import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  /**
   * - "flush" (default): transparent, sits on surface, hairline divider
   * - "elevated": surface-elevated background, no divider
   * - "minimal": no divider, no background — useful for hero screens
   */
  variant?: 'flush' | 'elevated' | 'minimal';
}

export default function Header({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightAction,
  variant = 'flush',
}: HeaderProps) {
  const { colors, spacing, fonts, typeScale } = useTheme();
  const insets = useSafeAreaInsets();

  const bg =
    variant === 'elevated'
      ? colors.surfaceElevated
      : variant === 'minimal'
      ? 'transparent'
      : colors.surface;

  const showDivider = variant === 'flush' || variant === 'elevated';

  return (
    <View
      style={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: bg,
        borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: colors.hairline,
      }}
    >
      <View style={styles.row}>
        {showBackButton && (
          <Pressable
            onPress={onBackPress}
            hitSlop={12}
            style={({ pressed }) => ({
              marginRight: spacing.sm,
              opacity: pressed ? 0.6 : 1,
              padding: 4,
              marginLeft: -4,
            })}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={24} color={colors.ink} strokeWidth={2} />
          </Pressable>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...typeScale.displaySm,
              color: colors.ink,
              fontFamily: fonts.display,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                ...typeScale.bodySm,
                color: colors.inkMuted,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction && <View style={{ marginLeft: spacing.sm }}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
