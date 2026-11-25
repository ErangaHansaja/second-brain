import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '@/theme/tokens';
import {
  ensureRootNode,
  importDatabase,
  seedStarterTemplates,
} from '@/db/repository';
import { useDatabaseStats, useRootNode } from '@/hooks';
import {
  exportBackupToFile,
  pickAndParseBackupFile,
} from '@/utils/backup';
import { hapticSuccess, hapticWarning } from '@/utils/haptics';
import type { ExportedDatabase } from '@/types';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface FeedbackBanner {
  type: 'success' | 'error';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SettingsScreen() {
  const { rootNode, refresh: refreshRoot } = useRootNode();
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useDatabaseStats();

  // Operation states
  const [seeding, setSeeding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pickingImport, setPickingImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<ExportedDatabase | null>(
    null
  );
  const [banner, setBanner] = useState<FeedbackBanner | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshRoot();
      refreshStats();
    }, [refreshRoot, refreshStats])
  );

  const showStarterCard = stats !== null && stats.galaxies === 0;

  const handleSeedStarter = async () => {
    if (seeding || !showStarterCard) return;
    try {
      setSeeding(true);
      setBanner(null);
      const targetRoot = rootNode ?? (await ensureRootNode());
      await seedStarterTemplates(targetRoot.id);
      hapticSuccess();
      refreshRoot();
      refreshStats();
      setBanner({
        type: 'success',
        message: 'Starter categories loaded into Explorer.',
      });
    } catch (err) {
      setBanner({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to load starter categories.',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleExportBackup = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      setBanner(null);
      const { filename, nodeCount } = await exportBackupToFile();
      hapticSuccess();
      setBanner({
        type: 'success',
        message: `Exported ${nodeCount} ${
          nodeCount === 1 ? 'item' : 'items'
        } (${filename}).`,
      });
    } catch (err) {
      setBanner({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to export backup.',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleStartImport = async () => {
    if (pickingImport || importing) return;
    try {
      setPickingImport(true);
      setBanner(null);
      const parsed = await pickAndParseBackupFile();
      if (parsed) {
        hapticWarning();
        setPendingBackup(parsed);
      }
    } catch (err) {
      setBanner({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to read backup file.',
      });
    } finally {
      setPickingImport(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingBackup || importing) return;
    const backupToImport = pendingBackup;
    const restoredCount = backupToImport.nodes.length;

    try {
      setImporting(true);
      await importDatabase(backupToImport);
      hapticSuccess();
      const restoredRoot = await ensureRootNode();
      setPendingBackup(null);
      refreshRoot();
      refreshStats();
      setBanner({
        type: 'success',
        message: `Restored ${restoredCount} ${
          restoredCount === 1 ? 'item' : 'items'
        } from backup.`,
        actionLabel: 'Open Explorer',
        onAction: () => {
          router.navigate({
            pathname: '/(tabs)',
            params: { nodeId: restoredRoot.id },
          } as any);
        },
      });
    } catch (err) {
      setPendingBackup(null);
      setBanner({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to restore backup.',
      });
    } finally {
      setImporting(false);
    }
  };

  const statItems = [
    {
      label: 'Total',
      value: stats?.total ?? 0,
      color: Colors.tier.core,
    },
    {
      label: 'Entries',
      value: stats?.entries ?? 0,
      color: Colors.semantic.success,
    },
    {
      label: 'Galaxies',
      value: stats?.galaxies ?? 0,
      color: Colors.tier.galaxy,
    },
    {
      label: 'Solar Systems',
      value: stats?.solarSystems ?? 0,
      color: Colors.tier.solarSystem,
    },
    {
      label: 'Planets',
      value: stats?.planets ?? 0,
      color: Colors.tier.planet,
    },
    {
      label: 'Moons',
      value: stats?.moons ?? 0,
      color: Colors.tier.moon,
    },
  ];

  return (
    <ScreenContainer>
      {/* Fixed Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Data, structure, and local backups
        </Text>
      </View>

      {/* Pinned Inline Feedback Banner */}
      {banner || statsError ? (
        <View style={styles.bannerWrap}>
          <View
            style={[
              styles.banner,
              banner?.type === 'error' || statsError
                ? styles.bannerError
                : styles.bannerSuccess,
            ]}>
            <Ionicons
              name={
                banner?.type === 'error' || statsError
                  ? 'alert-circle-outline'
                  : 'checkmark-circle-outline'
              }
              size={18}
              color={
                banner?.type === 'error' || statsError
                  ? Colors.semantic.danger
                  : Colors.semantic.success
              }
            />
            <View style={styles.bannerBody}>
              <Text
                style={[
                  styles.bannerText,
                  (banner?.type === 'error' || Boolean(statsError)) &&
                    styles.bannerTextError,
                ]}>
                {banner?.message ?? statsError?.message}
              </Text>
              {banner?.actionLabel && banner.onAction ? (
                <Pressable
                  onPress={banner.onAction}
                  style={({ pressed }) => [
                    styles.bannerActionBtn,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.bannerActionText}>
                    {banner.actionLabel}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {banner ? (
              <Pressable hitSlop={8} onPress={() => setBanner(null)}>
                <Ionicons name="close" size={16} color={Colors.text.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Section 1 — Overview (Database Stats) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
            {statsLoading && !stats ? (
              <ActivityIndicator size="small" color={Colors.tier.core} />
            ) : null}
          </View>

          <View style={styles.statsGrid}>
            {statItems.map((item) => (
              <View key={item.label} style={styles.statTile}>
                <View style={styles.statLabelRow}>
                  <View
                    style={[styles.tierDot, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 2 — Starter Structure (hidden once galaxies exist) */}
        {showStarterCard ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Starter Structure</Text>
            <Text style={styles.sectionDescription}>
              Populate top-level categories for Food, Entertainment, Work, Study,
              and Hobbies.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                seeding && styles.actionButtonDisabled,
                pressed && !seeding && styles.pressed,
              ]}
              disabled={seeding}
              onPress={handleSeedStarter}>
              {seeding ? (
                <ActivityIndicator size="small" color={Colors.tier.core} />
              ) : (
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color={Colors.tier.core}
                />
              )}
              <Text style={styles.actionButtonText}>
                {seeding ? 'Loading Categories...' : 'Load Starter Categories'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Section 3 — Local Backup */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Local Backup</Text>
          <Text style={styles.sectionDescription}>
            Save your entire hierarchy as a portable JSON file or restore from a
            previous backup.
          </Text>

          <View style={styles.buttonGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryOutlineBtn,
                exporting && styles.actionButtonDisabled,
                pressed && !exporting && styles.pressed,
              ]}
              disabled={exporting || importing}
              onPress={handleExportBackup}>
              {exporting ? (
                <ActivityIndicator size="small" color={Colors.tier.core} />
              ) : (
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={Colors.tier.core}
                />
              )}
              <Text style={styles.actionButtonText}>
                {exporting ? 'Preparing Export...' : 'Export Backup (JSON)'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                (pickingImport || importing) && styles.actionButtonDisabled,
                pressed && !pickingImport && !importing && styles.pressed,
              ]}
              disabled={pickingImport || importing || exporting}
              onPress={handleStartImport}>
              {pickingImport || importing ? (
                <ActivityIndicator size="small" color={Colors.text.primary} />
              ) : (
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={Colors.text.primary}
                />
              )}
              <Text style={styles.actionButtonText}>
                {pickingImport
                  ? 'Opening Picker...'
                  : importing
                  ? 'Restoring Backup...'
                  : 'Import Backup (JSON)'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Subtle App Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>Second Brain · v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Import Confirmation Dialog */}
      <ConfirmDialog
        visible={Boolean(pendingBackup)}
        title="Restore Backup"
        message={
          pendingBackup
            ? `Replace current database with ${pendingBackup.nodes.length} items from this backup? All existing local data will be overwritten.`
            : ''
        }
        confirmLabel={importing ? 'Restoring...' : 'Restore'}
        destructive
        onConfirm={handleConfirmImport}
        onCancel={() => {
          if (!importing) setPendingBackup(null);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 4,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
    backgroundColor: Colors.bg.void,
    gap: 2,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  bannerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.bg.void,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderColor: Colors.semantic.success,
  },
  bannerError: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: Colors.semantic.danger,
  },
  bannerBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  bannerText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.semantic.success,
    lineHeight: 18,
  },
  bannerTextError: {
    color: Colors.semantic.danger,
  },
  bannerActionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
    borderWidth: 1,
    borderColor: Colors.semantic.success,
  },
  bannerActionText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.semantic.success,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  statTile: {
    width: '48.5%',
    backgroundColor: Colors.bg.void,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    flex: 1,
  },
  statValue: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  buttonGroup: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  primaryOutlineBtn: {
    borderColor: Colors.border.active,
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  pressed: {
    opacity: 0.78,
  },
  footerWrap: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  footerText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
