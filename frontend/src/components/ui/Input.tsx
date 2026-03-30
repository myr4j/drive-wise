import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';

import { colors, spacing, borderRadius } from '@/utils/theme';

interface InputProps {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  value,
  onChangeText,
  onBlur,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable,
  multiline,
  numberOfLines,
}: InputProps) {
  return (
    <View style={styles.container}>
      <PaperTextInput
        label={label}
        mode="outlined"
        outlineColor={colors.primaryLight}
        activeOutlineColor={error ? colors.error : colors.primary}
        error={!!error}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        left={leftIcon ? <PaperTextInput.Icon icon={leftIcon} /> : undefined}
        right={rightIcon ? <PaperTextInput.Icon icon={rightIcon} /> : undefined}
      />
      {error && (
        <HelperText type="error" visible={true}>
          {error}
        </HelperText>
      )}
      {!error && helperText && (
        <HelperText type="info" visible={true}>
          {helperText}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    fontSize: 16,
  },
});
