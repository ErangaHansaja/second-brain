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
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  tierColor,
} from '@/theme/tokens';
import type { ParsedNode } from '@/types';

export interface NodeCardProps {
  node: ParsedNode;
  descendantCount?: number;
  viewMode?: 'list' | 'grid';
  onPress?: (node: ParsedNode) => void;
  onLongPress?: (node: ParsedNode) => void;
  style?: StyleProp<ViewStyle>;
}

export function NodeCard({
  node,
  descendantCount,
  viewMode = 'list',
  onPress,
  onLongPress,
  style,
}: NodeCardProps) {
  const isFolder = node.nodeType === 'folder';
  const tierAccent = tierColor(node.depth);
  const iconColor = node.color || tierAccent;

  const defaultIcon = isFolder ? 'folder-outline' : 'document-text-outline';
  const iconName = (node.icon || defaultIcon) as keyof typeof Ionicons.glyphMap;

  if (viewMode === 'grid') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.gridContainer,
          pressed && styles.cardPressed,
          style,
        ]}
        onPress={() => onPress?.(node)}
        onLongPress={() => onLongPress?.(node)}>
        <View style={styles.gridTopRow}>
          <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
            <Ionicons name={iconName} size={22} color={iconColor} />
          </View>
          <View style={[styles.tierDot, { backgroundColor: tierAccent }]} />
        </View>

        <View style={styles.gridBottom}>
          <Text style={styles.title} numberOfLines={2}>
            {node.title}
          </Text>

          {isFolder && descendantCount !== undefined ? (
            <Text style={styles.metadataText}>
              {descendantCount} {descendantCount === 1 ? 'item' : 'items'}
            </Text>
          ) : null}

          {!isFolder && node.rating !== null && node.rating !== undefined ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={Colors.tier.core} />
              <Text style={styles.ratingText}>{node.rating} / 10</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.listContainer,
        pressed && styles.cardPressed,
        style,
      ]}
      onPress={() => onPress?.(node)}
      onLongPress={() => onLongPress?.(node)}>
      <View style={[styles.accentBar, { backgroundColor: tierAccent }]} />

      <View style={styles.contentRow}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>
            {node.title}
          </Text>
          {node.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {node.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightCol}>
          {isFolder ? (
            <>
              {descendantCount !== undefined ? (
                <Text style={styles.metadataText}>
                  {descendantCount} {descendantCount === 1 ? 'item' : 'items'}
                </Text>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.text.muted}
              />
            </>
          ) : (
            <>
              {node.rating !== null && node.rating !== undefined ? (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={10} color={Colors.tier.core} />
                  <Text style={styles.ratingText}>{node.rating} / 10</Text>
                </View>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.text.muted}
              />
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.bg.surface,
    borderColor: Colors.border.subtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  accentBar: {
    width: 3,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  cardPressed: {
    backgroundColor: Colors.bg.elevated,
    borderColor: Colors.border.active,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metadataText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  ratingText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.tier.core,
  },
  gridContainer: {
    flex: 1,
    minHeight: 124,
    backgroundColor: Colors.bg.surface,
    borderColor: Colors.border.subtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  gridTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridBottom: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
});
