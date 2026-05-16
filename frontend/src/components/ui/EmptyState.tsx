import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import {
  Inbox,
  Search,
  Compass,
  Coffee,
  Moon,
  Clock,
  History,
  Car,
  Activity,
  LucideIcon,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import Button from './Button';
import DawnIllustration from './DawnIllustration';

/**
 * Map legacy string icon prop (Material icon names from the old codebase)
 * onto Lucide icons. New code should pass `iconComponent` directly.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  inbox: Inbox,
  search: Search,
  compass: Compass,
  'coffee-outline': Coffee,
  sleep: Moon,
  clock: Clock,
  history: History,
  car: Car,
  activity: Activity,
};

interface EmptyStateProps {
  icon?: string;
  iconComponent?: LucideIcon;
  /**
   * Show the signature DawnIllustration instead of an icon-in-circle.
   * Wins over `icon`/`iconComponent` if true.
   */
  illustration?: boolean;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showIllustration?: boolean;
  style?: ViewStyle;
}

export default function EmptyState({
  icon = 'inbox',
  iconComponent,
  illustration = false,
  title,
  message,
  actionLabel,
  onAction,
  showIllustration = true,
  style,
}: EmptyStateProps) {
  const { colors, spacing, fonts, typeScale } = useTheme();

  const Icon = iconComponent ?? ICON_MAP[icon] ?? Inbox;

  return (
    <View
      style={[
        styles.container,
        { padding: spacing.xl },
        style,
      ]}
    >
      {showIllustration && illustration && (
        <View style={{ marginBottom: spacing.lg }}>
          <DawnIllustration size={140} />
        </View>
      )}
      {showIllustration && !illustration && (
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surfaceSunken,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.hairline,
            marginBottom: spacing.lg,
          }}
        >
          <Icon size={36} color={colors.inkMuted} strokeWidth={1.5} />
        </View>
      )}
      <Text
        style={{
          ...typeScale.displaySm,
          color: colors.ink,
          fontFamily: fonts.display,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      {message && (
        <Text
          style={{
            ...typeScale.bodyMd,
            color: colors.inkMuted,
            textAlign: 'center',
            marginBottom: spacing.lg,
            maxWidth: 280,
          }}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onPress={onAction}>
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
  },
});
