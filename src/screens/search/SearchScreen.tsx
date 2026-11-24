import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.badge}>QUERY // INDEX</Text>
          <Text style={styles.status}>STANDBY</Text>
        </View>
        <Text style={styles.title}>Global Search</Text>
        <Text style={styles.subtitle}>Instant full-text search across nodes, notes, and tags</Text>
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
    color: Colors.tier.solarSystem,
    letterSpacing: 1.2,
  },
  status: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
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
