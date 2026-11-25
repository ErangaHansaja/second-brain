import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_PRESETS, type StatusConfig } from '@/constants/statuses';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '@/theme/tokens';
import type { CosmosNode } from '@/utils/cosmosLayout';
import { TierBadge } from '@/components/explorer/TierBadge';

export interface CosmosInspectorCardProps {
  item: CosmosNode;
  onOpen: (item: CosmosNode) => void;
  onClose: () => void;
}

export function CosmosInspectorCard({
  item,
  onOpen,
  onClose,
}: CosmosInspectorCardProps) {
  const { node, color, descendantCount } = item;
  const isEntry = node.nodeType === 'entry';

  const defaultIcon =
    node.depth === 0
      ? 'planet-outline'
      : isEntry
        ? 'document-text-outline'
        : 'folder-outline';
  const iconName = (node.icon || defaultIcon) as keyof typeof Ionicons.glyphMap;

  const statusConfig =
    isEntry &&
    node.status &&
    Object.prototype.hasOwnProperty.call(STATUS_PRESETS, node.status)
      ? (STATUS_PRESETS as Record<string, StatusConfig>)[node.status]
      : undefined;

  const subtitleText = isEntry
    ? node.notes?.trim() || null
    : node.description?.trim() || null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.identityWrap}>
          <View
            style={[
              styles.iconCircle,
              {
                borderColor: color,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              },
            ]}>
            <Ionicons name={iconName} size={18} color={color} />
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {node.title}
            </Text>
            <View style={styles.metaRow}>
              <TierBadge depth={node.depth} />

              {isEntry ? (
                <>
                  {statusConfig ? (
                    <View
                      style={[
                        styles.statusPill,
                        { borderColor: statusConfig.color },
                      ]}>
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusConfig.color },
                        ]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  ) : null}

                  {typeof node.rating === 'number' ? (
                    <View style={styles.ratingWrap}>
                      <Ionicons
                        name="star"
                        size={11}
                        color={Colors.tier.core}
                      />
                      <Text style={styles.ratingText}>{node.rating}/10</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.countText}>
                  {descendantCount === 0
                    ? 'Empty'
                    : `${descendantCount} ${
                        descendantCount === 1 ? 'item' : 'items'
                      }`}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Pressable
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Close inspector"
          accessibilityRole="button">
          <Ionicons name="close" size={16} color={Colors.text.secondary} />
        </Pressable>
      </View>

      {subtitleText ? (
        <Text style={styles.previewText} numberOfLines={1}>
          {subtitleText}
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          isEntry ? styles.entryActionBtn : styles.folderActionBtn,
          pressed && styles.pressed,
        ]}
        onPress={() => onOpen(item)}
        accessibilityRole="button">
        <Ionicons
          name={isEntry ? 'document-text-outline' : 'folder-open-outline'}
          size={16}
          color={isEntry ? Colors.bg.void : Colors.tier.core}
        />
        <Text
          style={[
            styles.actionText,
            isEntry ? styles.entryActionText : styles.folderActionText,
          ]}>
          {isEntry ? 'Open Entry' : 'Open in Explorer'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  identityWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  statusPill: {
    paddingHorizontal: Spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statusText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs - 1,
    fontWeight: FontWeight.medium,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
  },
  countText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: FontSize.xs + 1,
    color: Colors.text.secondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  entryActionBtn: {
    backgroundColor: Colors.tier.core,
  },
  folderActionBtn: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.active,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  entryActionText: {
    color: Colors.bg.void,
  },
  folderActionText: {
    color: Colors.tier.core,
  },
  pressed: {
    opacity: 0.78,
  },
});
