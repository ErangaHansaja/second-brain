import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'planet-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconRing}>
        <Ionicons name={icon} size={30} color={Colors.tier.core} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 280,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.tier.core,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.bg.void,
  },
});
