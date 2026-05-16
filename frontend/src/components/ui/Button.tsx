import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type LegacyButtonMode = 'contained' | 'outlined' | 'text' | 'tonal';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Legacy Paper-style API — automatically mapped onto variant */
  mode?: LegacyButtonMode;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  haptic?: boolean;
  style?: ViewStyle | ViewStyle[];
};

const variantFromMode: Record<LegacyButtonMode, ButtonVariant> = {
  contained: 'primary',
  outlined: 'ghost',
  text: 'ghost',
  tonal: 'subtle',
};

const sizeTokens = {
  sm: { paddingV: 8, paddingH: 14, fontSize: 13, lineHeight: 18, minHeight: 36, gap: 6 },
  md: { paddingV: 12, paddingH: 20, fontSize: 15, lineHeight: 22, minHeight: 44, gap: 8 },
  lg: { paddingV: 16, paddingH: 28, fontSize: 16, lineHeight: 24, minHeight: 56, gap: 10 },
} as const;

export default function Button({
  children,
  variant,
  size = 'md',
  mode,
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  haptic = true,
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const { colors, fonts, borderRadius } = useTheme();
  const resolvedVariant: ButtonVariant =
    variant ?? (mode ? variantFromMode[mode] : 'primary');
  const tokens = sizeTokens[size];
  const isInteractive = !disabled && !loading;

  const scale = useRef(new Animated.Value(1)).current;

  const palette = useMemo(() => {
    switch (resolvedVariant) {
      case 'primary':
        return {
          bg: isInteractive ? colors.accent : colors.surfaceSunken,
          text: isInteractive ? colors.onAccent : colors.inkSubtle,
          border: 'transparent',
        };
      case 'subtle':
        return {
          bg: colors.accentMuted,
          text: isInteractive ? colors.accent : colors.inkSubtle,
          border: 'transparent',
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: isInteractive ? colors.ink : colors.inkSubtle,
          border: colors.hairlineStrong,
        };
      case 'destructive':
        return {
          bg: isInteractive ? colors.error : colors.surfaceSunken,
          text: isInteractive ? colors.onAccent : colors.inkSubtle,
          border: 'transparent',
        };
    }
  }, [resolvedVariant, isInteractive, colors]);

  const handlePressIn = (e: any) => {
    Animated.spring(scale, {
      toValue: 0.96,
      stiffness: 320,
      damping: 14,
      mass: 1,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };
  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      stiffness: 260,
      damping: 18,
      mass: 1,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };
  const handlePress = (e: any) => {
    if (haptic) {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.(e);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={isInteractive ? handlePress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: resolvedVariant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          paddingVertical: tokens.paddingV,
          paddingHorizontal: tokens.paddingH,
          minHeight: tokens.minHeight,
          borderRadius: borderRadius.md,
          opacity: disabled ? 0.55 : 1,
          transform: [{ scale }],
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      <View style={[styles.inner, { gap: tokens.gap }]}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.text} />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children !== undefined && children !== null && (
              <Text
                style={{
                  color: palette.text,
                  fontFamily: fonts.bodySemibold,
                  fontSize: tokens.fontSize,
                  lineHeight: tokens.lineHeight,
                  letterSpacing: 0.2,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {children}
              </Text>
            )}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
});
