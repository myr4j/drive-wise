import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper';

import { colors, spacing, borderRadius } from '@/utils/theme';

interface ButtonProps extends Omit<PaperButtonProps, 'mode' | 'textColor'> {
  variant?: 'contained' | 'outlined' | 'text' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  style,
  ...props
}: ButtonProps) {
  const mode = variant === 'contained' ? 'contained' : variant === 'outlined' ? 'outlined' : 'text';
  
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabledButton,
    style,
  ];

  return (
    <PaperButton
      mode={mode}
      disabled={disabled || loading}
      loading={loading}
      style={buttonStyles}
      contentStyle={styles.content}
      textColor={variant === 'contained' && !disabled ? colors.white : undefined}
      {...props}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    fontWeight: '600',
  },
  containedButton: {
    backgroundColor: colors.primary,
  },
  outlinedButton: {
    borderColor: colors.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  tonalButton: {
    backgroundColor: colors.primaryLight,
  },
  smallButton: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  mediumButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  largeButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabledButton: {
    backgroundColor: colors.gray,
    borderColor: colors.gray,
  },
  content: {
    paddingVertical: spacing.xs / 2,
  },
});
