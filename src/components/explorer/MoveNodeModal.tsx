import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
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

export interface MoveTargetFolder {
  id: string;
  title: string;
  depth: number;
  pathLabel: string;
}

export interface MoveNodeModalProps {
  visible: boolean;
  nodeTitle: string;
  folders: MoveTargetFolder[];
  currentParentId: string;
  onSelect: (targetParentId: string) => void;
  onCancel: () => void;
}

export function MoveNodeModal({
  visible,
  nodeTitle,
  folders,
  currentParentId,
  onSelect,
  onCancel,
}: MoveNodeModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Move Item</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {nodeTitle}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={onCancel}>
              <Ionicons name="close" size={22} color={Colors.text.muted} />
            </Pressable>
          </View>

          <Text style={styles.sectionHeading}>Select Destination Folder</Text>

          {/* Folder List */}
          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isCurrent = item.id === currentParentId;
              const tierAccent = tierColor(item.depth);

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.folderItem,
                    isCurrent && styles.folderItemCurrent,
                    pressed && !isCurrent && styles.folderItemPressed,
                  ]}
                  disabled={isCurrent}
                  onPress={() => onSelect(item.id)}>
                  <View
                    style={[styles.tierDot, { backgroundColor: tierAccent }]}
                  />

                  <Ionicons
                    name="folder-outline"
                    size={18}
                    color={isCurrent ? Colors.text.muted : Colors.tier.core}
                  />

                  <View style={styles.folderInfo}>
                    <Text
                      style={[
                        styles.folderTitle,
                        isCurrent && styles.folderTitleCurrent,
                      ]}
                      numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.folderPath} numberOfLines={1}>
                      {item.pathLabel}
                    </Text>
                  </View>

                  {isCurrent ? (
                    <Text style={styles.currentBadge}>Current</Text>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={Colors.text.muted}
                    />
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No available destination folders.</Text>
            }
          />

          {/* Cancel Footer */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
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
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
    maxWidth: 280,
  },
  sectionHeading: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: Spacing.sm,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  folderItemCurrent: {
    opacity: 0.5,
  },
  folderItemPressed: {
    borderColor: Colors.border.active,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  folderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  folderTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  folderTitleCurrent: {
    color: Colors.text.muted,
  },
  folderPath: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  currentBadge: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.subtle,
    alignItems: 'flex-end',
  },
  btnPressed: {
    opacity: 0.8,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
});
