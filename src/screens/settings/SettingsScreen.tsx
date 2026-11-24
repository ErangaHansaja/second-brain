import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';
import { runRepositorySelfTest, type SelfTestOutput } from '@/db/selfTest';

export default function SettingsScreen() {
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<SelfTestOutput | null>(null);

  const handleRunSelfTest = async () => {
    setTesting(true);
    try {
      const output = await runRepositorySelfTest();
      setTestOutput(output);
    } catch (err: unknown) {
      setTestOutput({
        passed: false,
        results: [
          {
            name: 'Execution Error',
            passed: false,
            detail: err instanceof Error ? err.message : String(err),
          },
        ],
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.badge}>SETTINGS</Text>
          <Text style={styles.status}>LOCAL</Text>
        </View>
        <Text style={styles.title}>Settings & Data</Text>
        <Text style={styles.subtitle}>
          Database statistics, starter templates, and backup export/import
        </Text>
      </View>

      {__DEV__ && (
        <View style={[styles.card, styles.devCard]}>
          <View style={styles.devHeader}>
            <Ionicons name="construct-outline" size={16} color={Colors.tier.core} />
            <Text style={styles.devTitle}>DEVELOPER TOOLS</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.testButton,
              pressed && styles.testButtonPressed,
              testing && styles.testButtonDisabled,
            ]}
            onPress={handleRunSelfTest}
            disabled={testing}>
            {testing ? (
              <ActivityIndicator size="small" color={Colors.tier.core} />
            ) : (
              <Ionicons name="play-outline" size={16} color={Colors.tier.core} />
            )}
            <Text style={styles.testButtonText}>
              {testing ? 'Running DB Verification...' : 'Run DB Self-Test'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.testButton,
              styles.galleryButton,
              pressed && styles.testButtonPressed,
            ]}
            onPress={() => router.push('/dev-gallery' as any)}>
            <Ionicons name="images-outline" size={16} color={Colors.tier.core} />
            <Text style={styles.testButtonText}>Open UI Component Gallery</Text>
          </Pressable>

          {testOutput && (
            <View style={styles.resultsContainer}>
              <View style={styles.summaryRow}>
                <Ionicons
                  name={testOutput.passed ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={testOutput.passed ? Colors.semantic.success : Colors.semantic.danger}
                />
                <Text
                  style={[
                    styles.summaryText,
                    {
                      color: testOutput.passed
                        ? Colors.semantic.success
                        : Colors.semantic.danger,
                    },
                  ]}>
                  {testOutput.passed ? 'All 8 Checks Passed' : 'Verification Failures Detected'}
                </Text>
              </View>

              {testOutput.results.map((r, i) => (
                <View key={i} style={styles.resultItem}>
                  <View style={styles.resultRow}>
                    <Ionicons
                      name={r.passed ? 'checkmark-circle-outline' : 'close-circle-outline'}
                      size={14}
                      color={r.passed ? Colors.semantic.success : Colors.semantic.danger}
                    />
                    <Text
                      style={[
                        styles.resultName,
                        {
                          color: r.passed ? Colors.text.primary : Colors.semantic.danger,
                        },
                      ]}>
                      {r.name}
                    </Text>
                  </View>
                  {r.detail && <Text style={styles.resultDetail}>{r.detail}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: Colors.bg.void,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 380,
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
  devCard: {
    borderColor: 'rgba(245, 166, 35, 0.25)',
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  devTitle: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.tier.core,
    letterSpacing: 1.2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.active,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  galleryButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border.subtle,
  },
  testButtonPressed: {
    opacity: 0.8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  resultsContainer: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  summaryText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  resultItem: {
    backgroundColor: Colors.bg.void,
    borderColor: Colors.border.subtle,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: 2,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resultName: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  resultDetail: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs - 1,
    color: Colors.text.secondary,
    marginLeft: 18,
  },
});
