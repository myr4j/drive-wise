import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'default' | 'elevated' | 'outlined' | 'sunken' | 'accent';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: CardVariant;
  interactive?: boolean;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle;
  noPadding?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  actions,
  variant = 'default',
  interactive = false,
  onPress,
  style,
  contentStyle,
  noPadding = false,
}: CardProps) {
  const { colors, shadows, spacing, borderRadius, typeScale } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surfaceElevated,
          ...shadows.raised,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.hairlineStrong,
        };
      case 'sunken':
        return {
          backgroundColor: colors.surfaceSunken,
        };
      case 'accent':
        return {
          backgroundColor: colors.accentMuted,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accentSoft,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.surfaceElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.hairline,
          ...shadows.hairline,
        };
    }
  })();

  const isPressable = interactive && onPress;

  const innerBody = (
    <>
      {(title || subtitle) && (
        <View style={{ marginBottom: spacing.sm }}>
          {title && (
            <Text style={{ ...typeScale.titleMd, color: colors.ink }}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={{
                ...typeScale.bodySm,
                color: colors.inkMuted,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      <View style={contentStyle}>{children}</View>
      {actions && (
        <View
          style={{
            marginTop: spacing.md,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: spacing.sm,
          }}
        >
          {actions}
        </View>
      )}
    </>
  );

  const containerStyle: ViewStyle | ViewStyle[] = [
    {
      borderRadius: borderRadius.lg,
      padding: noPadding ? 0 : spacing.md,
      ...variantStyle,
    },
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ];

  if (isPressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(scale, {
            toValue: 0.985,
            stiffness: 320,
            damping: 16,
            mass: 1,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, {
            toValue: 1,
            stiffness: 260,
            damping: 18,
            mass: 1,
            useNativeDriver: true,
          }).start();
        }}
        style={[containerStyle, { transform: [{ scale }] }]}
        accessibilityRole="button"
      >
        {innerBody}
      </AnimatedPressable>
    );
  }

  return <View style={containerStyle}>{innerBody}</View>;
}
