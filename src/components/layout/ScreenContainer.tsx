import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/theme/tokens';

export interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  avoidKeyboard?: boolean;
  keyboardVerticalOffset?: number;
}

export function ScreenContainer({
  children,
  style,
  edges = ['top', 'left', 'right'],
  avoidKeyboard = false,
  keyboardVerticalOffset = 0,
}: ScreenContainerProps) {
  const content = avoidKeyboard ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}>
      {children}
    </KeyboardAvoidingView>
  ) : (
    children
  );

  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  keyboardAvoid: {
    flex: 1,
  },
});
