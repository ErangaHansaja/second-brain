import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  tierColor,
} from '@/theme/tokens';
import { TierBadge } from '@/components/explorer/TierBadge';
import type { ParsedNode } from '@/types';

export interface NodeActionsModalProps {
  visible: boolean;
  node: ParsedNode | null;
  onRename: (node: ParsedNode) => void;
  onMove: (node: ParsedNode) => void;
  onDelete: (node: ParsedNode) => void;
  onClose: () => void;
}

export function NodeActionsModal({
  visible,
  node,
  onRename,
  onMove,
  onDelete,
  onClose,
}: NodeActionsModalProps) {
  if (!node) {
    return null;
  }

  const isFolder = node.nodeType === 'folder';
  const iconColor = node.color || tierColor(node.depth);
  const iconName = (node.icon ||
    (isFolder ? 'folder-outline' : 'document-text-outline')) as keyof typeof Ionicons.glyphMap;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.title} numberOfLines={1}>
                  {node.title}
                </Text>
                <TierBadge depth={node.depth} style={styles.tierBadge} />
              </View>
            </View>

            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.text.muted} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Action Rows */}
          <View style={styles.actionsList}>
            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.actionRowPressed,
              ]}
              onPress={() => onRename(node)}>
              <Ionicons
                name="pencil-outline"
                size={18}
                color={Colors.text.primary}
              />
              <Text style={styles.actionLabel}>Rename</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.text.muted}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.actionRowPressed,
              ]}
              onPress={() => onMove(node)}>
              <Ionicons
                name="folder-open-outline"
                size={18}
                color={Colors.text.primary}
              />
              <Text style={styles.actionLabel}>Move</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.text.muted}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                styles.deleteRow,
                pressed && styles.deleteRowPressed,
              ]}
              onPress={() => onDelete(node)}>
              <Ionicons
                name="trash-outline"
                size={18}
                color={Colors.semantic.danger}
              />
              <Text style={[styles.actionLabel, styles.deleteLabel]}>
                Delete
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.semantic.danger}
              />
            </Pressable>
          </View>

          {/* Cancel Footer */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.cancelPressed,
            ]}
            onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  tierBadge: {
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.subtle,
  },
  actionsList: {
    gap: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  actionRowPressed: {
    borderColor: Colors.border.active,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  deleteRow: {
    borderColor: 'rgba(244, 63, 94, 0.25)',
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  deleteRowPressed: {
    borderColor: Colors.semantic.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  deleteLabel: {
    color: Colors.semantic.danger,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  cancelPressed: {
    opacity: 0.75,
  },
  cancelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
});
