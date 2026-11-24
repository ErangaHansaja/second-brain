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
import type { SearchResult } from '@/types';
import { StatusChip } from '../detail/StatusChip';

export interface SearchResultCardProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchResultCard({
  result,
  onPress,
  style,
}: SearchResultCardProps) {
  const isFolder = result.nodeType === 'folder';
  const tierAccent = tierColor(result.depth);
  const iconColor = result.color || tierAccent;
  const defaultIcon = isFolder ? 'folder-outline' : 'document-text-outline';
  const iconName = (result.icon || defaultIcon) as keyof typeof Ionicons.glyphMap;

  const pathDisplay =
    result.breadcrumb && result.breadcrumb.length > 0
      ? result.breadcrumb.map((b) => b.title).join(' / ')
      : 'Root';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
      onPress={() => onPress(result)}>
      {/* Monospace Path Header */}
      <View style={styles.pathRow}>
        <Ionicons name="git-branch-outline" size={12} color={Colors.text.muted} />
        <Text style={styles.pathText} numberOfLines={1}>
          {pathDisplay}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainRow}>
        <View style={styles.leftCol}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>

          <View style={styles.titleCol}>
            <View style={styles.titleRow}>
              <View style={[styles.tierDot, { backgroundColor: tierAccent }]} />
              <Text style={styles.title} numberOfLines={1}>
                {result.title}
              </Text>
            </View>

            {result.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {result.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightCol}>
          {!isFolder && result.status ? (
            <StatusChip status={result.status} editable={false} />
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
        </View>
      </View>

      {/* Tags row snippet if tags exist */}
      {result.tags && result.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {result.tags.slice(0, 4).map((tag) => (
            <Text key={tag} style={styles.tagText}>
              #{tag}
            </Text>
          ))}
          {result.tags.length > 4 ? (
            <Text style={styles.tagMoreText}>+{result.tags.length - 4}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardPressed: {
    backgroundColor: Colors.bg.elevated,
    borderColor: Colors.border.active,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pathText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    flex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  titleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    flex: 1,
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
    marginLeft: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.subtle,
  },
  tagText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  tagMoreText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
});
