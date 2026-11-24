import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';
import { useNode } from '@/hooks';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { TierBadge } from '@/components/explorer/TierBadge';
import { EmptyState } from '@/components/common/EmptyState';

export interface NodeDetailScreenProps {
  nodeId: string;
  initialEdit?: boolean;
}

export default function NodeDetailScreen({
  nodeId,
  initialEdit: _initialEdit,
}: NodeDetailScreenProps) {
  const { node, loading, error } = useNode(nodeId || null);

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed,
          ]}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {node ? node.title : 'Node Detail'}
        </Text>
        <View style={styles.topBarRight} />
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.tier.core} />
          </View>
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Could Not Load Item"
            subtitle={error.message}
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        ) : !node ? (
          <EmptyState
            icon="document-text-outline"
            title="Item Not Found"
            subtitle="This node may have been deleted or moved."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        ) : (
          <View style={styles.card}>
            <View style={styles.metaHeader}>
              <TierBadge depth={node.depth} />
              <Text style={styles.typeLabel}>{node.nodeType}</Text>
            </View>

            <Text style={styles.title}>{node.title}</Text>

            {node.description ? (
              <Text style={styles.description}>{node.description}</Text>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.placeholderBox}>
              <Ionicons
                name="construct-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.placeholderNote}>
                Entry editor coming in Step 9
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginHorizontal: Spacing.sm,
  },
  topBarRight: {
    width: 36,
  },
  body: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeLabel: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.subtle,
  },
  placeholderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  placeholderNote: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
});
