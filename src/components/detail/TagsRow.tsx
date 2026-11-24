import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
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
  const [isAdding, setIsAdding] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  const handleRemove = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    onTagsChange?.(updated);
  };

  const handleAddSubmit = () => {
    const cleaned = newTagText.trim().replace(/^#+/, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      onTagsChange?.([...tags, cleaned]);
    }
    setNewTagText('');
    setIsAdding(false);
  };

  return (
    <View style={[styles.container, style]}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tagChip}>
          <Text style={styles.tagText}>#{tag}</Text>
          {editable ? (
            <Pressable
              hitSlop={6}
              onPress={() => handleRemove(tag)}
              style={styles.removeBtn}>
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
        isAdding ? (
          <View style={styles.inputWrap}>
            <Text style={styles.hashPrefix}>#</Text>
            <TextInput
              value={newTagText}
              onChangeText={setNewTagText}
              onSubmitEditing={handleAddSubmit}
              onBlur={handleAddSubmit}
              placeholder="tag"
              placeholderTextColor={Colors.text.muted}
              autoFocus
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.addBtn,
              pressed && styles.addBtnPressed,
            ]}
            onPress={() => setIsAdding(true)}>
            <Ionicons name="add" size={12} color={Colors.tier.core} />
            <Text style={styles.addBtnText}>Add tag</Text>
          </Pressable>
        )
      ) : tags.length === 0 ? (
        <Text style={styles.emptyText}>No tags</Text>
      ) : null}
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.active,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  hashPrefix: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  input: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
    padding: 0,
    minWidth: 44,
  },
  emptyText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
});
