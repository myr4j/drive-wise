import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

/**
 * Custom underlined input with a floating label that lifts/shrinks on focus.
 * Uses RN's Animated API (no Reanimated dep). Label position uses
 * useNativeDriver: true for the translateY; fontSize is interpolated
 * with useNativeDriver: false (layout property).
 */
export default function Input({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  helperText,
  leftIcon,
  rightIcon,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable = true,
  multiline,
  numberOfLines,
}: InputProps) {
  const { colors, fonts, spacing, typeScale } = useTheme();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasValue = value.length > 0;
  const labelLifted = focused || hasValue;

  // Two parallel Animated.Values so we can drive transform with native driver
  // while keeping fontSize on JS (layout).
  const liftTransform = useRef(new Animated.Value(labelLifted ? 1 : 0)).current;
  const liftSize = useRef(new Animated.Value(labelLifted ? 1 : 0)).current;

  useEffect(() => {
    const toValue = labelLifted ? 1 : 0;
    Animated.parallel([
      Animated.timing(liftTransform, {
        toValue,
        duration: 180,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(liftSize, {
        toValue,
        duration: 180,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [labelLifted]);

  const translateY = liftTransform.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -26],
  });
  const fontSize = liftSize.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 11],
  });

  const underlineColor = error
    ? colors.error
    : focused
    ? colors.accent
    : colors.hairlineStrong;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
          borderBottomWidth: focused ? 2 : StyleSheet.hairlineWidth,
          borderBottomColor: underlineColor,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>
        )}

        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              transform: [{ translateY }],
            }}
          >
            <Animated.Text
              onPress={() => inputRef.current?.focus()}
              style={{
                color: error
                  ? colors.error
                  : focused
                  ? colors.accent
                  : colors.inkMuted,
                fontFamily: fonts.bodyMedium,
                letterSpacing: labelLifted ? 1.0 : 0,
                textTransform: labelLifted ? 'uppercase' : 'none',
                fontSize,
              }}
            >
              {label}
            </Animated.Text>
          </Animated.View>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            placeholder={focused ? placeholder : undefined}
            placeholderTextColor={colors.inkSubtle}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            selectionColor={colors.accent}
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              lineHeight: 22,
              color: colors.ink,
              paddingVertical: 2,
              paddingHorizontal: 0,
              margin: 0,
            }}
          />
        </View>

        {rightIcon && (
          <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View>
        )}
      </View>

      {(error || helperText) && (
        <Text
          style={{
            ...typeScale.bodySm,
            color: error ? colors.error : colors.inkMuted,
            marginTop: spacing.xs,
          }}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}
