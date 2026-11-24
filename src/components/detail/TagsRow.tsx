import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
} from '@/theme/tokens';
import { TextInputField } from '../common/TextInputField';

export interface TagsRowProps {
  tags: string[];
  editable?: boolean;
  onTagsChange?: (tags: string[]) => void;
  style?: StyleProp<ViewStyle>;
}

export function TagsRow({
  tags,
  editable = false,
  onTagsChange,
  style,
}: TagsRowProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  const handleRemove = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    onTagsChange?.(updated);
  };

  const handleOpenAdd = () => {
    setNewTagText('');
    setTagError(null);
    setModalVisible(true);
  };

  const handleAddSubmit = () => {
    const cleaned = newTagText.trim().replace(/^#+/, '').toLowerCase();
    if (!cleaned) {
      setTagError('Tag cannot be empty');
      return;
    }
    if (tags.includes(cleaned)) {
      setTagError('Tag already exists');
      return;
    }

    onTagsChange?.([...tags, cleaned]);
    setNewTagText('');
    setTagError(null);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tagChip}>
          <Text style={styles.tagText}>#{tag}</Text>
          {editable ? (
            <Pressable
              hitSlop={8}
              onPress={() => handleRemove(tag)}
              style={styles.removeBtn}
              accessibilityLabel={`Remove tag ${tag}`}
              accessibilityRole="button">
              <Ionicons
                name="close"
                size={12}
                color={Colors.text.muted}
              />
            </Pressable>
          ) : null}
        </View>
      ))}

      {editable ? (
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            pressed && styles.addBtnPressed,
          ]}
          onPress={handleOpenAdd}
          accessibilityLabel="Add tag"
          accessibilityRole="button">
          <Ionicons name="add" size={12} color={Colors.tier.core} />
          <Text style={styles.addBtnText}>Add tag</Text>
        </Pressable>
      ) : tags.length === 0 ? (
        <Text style={styles.emptyText}>No tags</Text>
      ) : null}

      {/* Keyboard-safe Dark Modal for Tag Input */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable
            style={styles.overlayBackdrop}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Tag</Text>
              <Pressable
                hitSlop={8}
                onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.text.muted} />
              </Pressable>
            </View>

            <TextInputField
              label="Tag Name"
              value={newTagText}
              onChangeText={(text) => {
                setNewTagText(text);
                if (tagError) setTagError(null);
              }}
              placeholder="e.g. sci-fi, physics, books"
              autoFocus
              autoCapitalize="none"
              error={tagError}
              onSubmitEditing={handleAddSubmit}
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleAddSubmit}>
                <Text style={styles.submitBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  removeBtn: {
    padding: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border.active,
    borderStyle: 'dashed',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: 'rgba(245, 166, 35, 0.05)',
  },
  addBtnPressed: {
    opacity: 0.8,
  },
  addBtnText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.tier.core,
    fontWeight: FontWeight.medium,
  },
  emptyText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.lg,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  modalInput: {
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
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
    minWidth: 72,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.bg.void,
  },
  btnPressed: {
    opacity: 0.8,
  },
});
