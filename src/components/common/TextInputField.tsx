import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';

export interface TextInputFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  error?: string | null;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function TextInputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  error,
  autoFocus = false,
  style,
  inputStyle,
  onFocus,
  onBlur,
  ...restProps
}: TextInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.muted}
        multiline={multiline}
        autoFocus={autoFocus}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          inputStyle,
        ]}
        {...restProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bg.surface,
    borderColor: Colors.border.subtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text.primary,
    fontSize: FontSize.md,
    minHeight: 44,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm + 4,
  },
  inputFocused: {
    borderColor: Colors.border.active,
  },
  inputError: {
    borderColor: Colors.semantic.danger,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.semantic.danger,
    marginTop: Spacing.xs,
  },
});
