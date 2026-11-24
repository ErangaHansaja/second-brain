import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@/db/client';
import migrations from '@/db/migrations';
import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '@/theme/tokens';

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success && __DEV__) {
      console.log('[DB] Migrations ready');
    }
  }, [success]);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Database Migration Failed</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.tier.core} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.bg.void,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorTitle: {
    color: Colors.semantic.danger,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mono,
    textAlign: 'center',
    lineHeight: 20,
  },
});
