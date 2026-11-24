import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
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
import type { NodeType, ParsedNode } from '@/types';
import { createNode } from '@/db/repository';
import { TextInputField } from '../common/TextInputField';

export interface AddNodeFABProps {
  parentId: string;
  parentDepth: number;
  onCreated: (node: ParsedNode) => void;
  style?: StyleProp<ViewStyle>;
}

const QUICK_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'folder-outline',
  'book-outline',
  'code-slash-outline',
  'rocket-outline',
  'musical-notes-outline',
  'film-outline',
  'sparkles-outline',
  'hardware-chip-outline',
  'document-text-outline',
  'bulb-outline',
  'fitness-outline',
  'wallet-outline',
];

export function AddNodeFAB({
  parentId,
  parentDepth,
  onCreated,
  style,
}: AddNodeFABProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [nodeType, setNodeType] = useState<NodeType>('folder');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('folder-outline');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setNodeType('folder');
    setSelectedIcon('folder-outline');
    setError(null);
  };

  const handleOpen = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleClose = () => {
    resetForm();
    setModalVisible(false);
  };

  const handleNodeTypeChange = (type: NodeType) => {
    setNodeType(type);
    if (type === 'folder' && selectedIcon === 'document-text-outline') {
      setSelectedIcon('folder-outline');
    } else if (type === 'entry' && selectedIcon === 'folder-outline') {
      setSelectedIcon('document-text-outline');
    }
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const targetDepth = parentDepth + 1;
      const newNode = await createNode({
        parentId,
        title: trimmedTitle,
        nodeType,
        description: isFolder ? description.trim() || undefined : undefined,
        icon: selectedIcon,
        color: tierColor(targetDepth),
      });

      handleClose();
      onCreated(newNode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFolder = nodeType === 'folder';

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
          style,
        ]}
        onPress={handleOpen}
        accessibilityLabel="Add new item"
        accessibilityRole="button">
        <Ionicons name="add" size={28} color={Colors.bg.void} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}>
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Create New {isFolder ? 'Folder' : 'Entry'}
              </Text>
              <Pressable hitSlop={8} onPress={handleClose}>
                <Ionicons name="close" size={22} color={Colors.text.muted} />
              </Pressable>
            </View>

            {/* Type Selector Segment */}
            <View style={styles.segmentContainer}>
              <Pressable
                style={[
                  styles.segmentButton,
                  isFolder && styles.segmentButtonActive,
                ]}
                onPress={() => handleNodeTypeChange('folder')}>
                <Ionicons
                  name="folder-outline"
                  size={16}
                  color={isFolder ? Colors.tier.core : Colors.text.muted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    isFolder && styles.segmentTextActive,
                  ]}>
                  Folder
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.segmentButton,
                  !isFolder && styles.segmentButtonActive,
                ]}
                onPress={() => handleNodeTypeChange('entry')}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={!isFolder ? Colors.tier.core : Colors.text.muted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    !isFolder && styles.segmentTextActive,
                  ]}>
                  Entry
                </Text>
              </Pressable>
            </View>

            {/* Form Fields */}
            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}>
              <TextInputField
                label="Title"
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  if (error) setError(null);
                }}
                placeholder={isFolder ? 'e.g. Science, Tech, Media' : 'e.g. Interstellar, Paper Notes'}
                autoFocus
                error={error}
                style={styles.inputSpacing}
              />

              {isFolder ? (
                <TextInputField
                  label="Description (Optional)"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Short description of this domain"
                  multiline
                  numberOfLines={2}
                  style={styles.inputSpacing}
                />
              ) : null}

              {/* Icon Selector */}
              <Text style={styles.fieldLabel}>Select Icon</Text>
              <View style={styles.iconGrid}>
                {QUICK_ICONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      style={[
                        styles.iconOption,
                        isSelected && styles.iconOptionSelected,
                      ]}
                      onPress={() => setSelectedIcon(iconName)}>
                      <Ionicons
                        name={iconName}
                        size={20}
                        color={isSelected ? Colors.tier.core : Colors.text.secondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleClose}
                disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleCreate}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.bg.void} />
                ) : (
                  <Text style={styles.submitBtnText}>Create</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.tier.core,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.tier.core,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 3,
    marginBottom: Spacing.md,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.muted,
  },
  segmentTextActive: {
    color: Colors.text.primary,
    fontWeight: FontWeight.bold,
  },
  formScroll: {
    maxHeight: 320,
  },
  inputSpacing: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    borderColor: Colors.border.active,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.subtle,
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
  submitBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    backgroundColor: Colors.tier.core,
    minWidth: 80,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.bg.void,
  },
});
