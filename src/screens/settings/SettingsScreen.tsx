import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.badge}>SYSTEM // CONFIG</Text>
          <Text style={styles.status}>READY</Text>
        </View>
        <Text style={styles.title}>Settings & Data</Text>
        <Text style={styles.subtitle}>Database statistics, starter templates, and backup export/import</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.void,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.bg.surface,
    borderColor: Colors.border.subtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badge: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.tier.moon,
    letterSpacing: 1.2,
  },
  status: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.semantic.success,
    letterSpacing: 1,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
