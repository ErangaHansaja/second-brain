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

export interface MetadataEditorProps {
  metadata: Record<string, unknown>;
  editable?: boolean;
  onChange?: (newMetadata: Record<string, unknown>) => void;
  style?: StyleProp<ViewStyle>;
}

export function MetadataEditor({
  metadata,
  editable = false,
  onChange,
  style,
}: MetadataEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const entries = Object.entries(metadata);

  const handleDelete = (keyToDelete: string) => {
    const updated = { ...metadata };
    delete updated[keyToDelete];
    onChange?.(updated);
  };

  const handleAddField = () => {
    const trimmedKey = newKey.trim();
    const trimmedVal = newValue.trim();

    if (!trimmedKey) {
      setAddError('Key is required');
      return;
    }

    const updated = {
      ...metadata,
      [trimmedKey]: trimmedVal,
    };

    onChange?.(updated);
    setNewKey('');
    setNewValue('');
    setAddError(null);
    setIsAdding(false);
  };

  return (
    <View style={[styles.container, style]}>
      {entries.length > 0 ? (
        <View style={styles.rowsContainer}>
          {entries.map(([key, val]) => (
            <View key={key} style={styles.row}>
              <View style={styles.keyCol}>
                <Text style={styles.keyText} numberOfLines={1}>
                  {key}
                </Text>
              </View>

              <View style={styles.valCol}>
                <Text style={styles.valText} numberOfLines={2}>
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </Text>
              </View>

              {editable ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => handleDelete(key)}
                  style={styles.deleteBtn}>
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={Colors.semantic.danger}
                  />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : !editable ? (
        <Text style={styles.emptyText}>No metadata recorded</Text>
      ) : null}

      {editable ? (
        isAdding ? (
          <View style={styles.addForm}>
            <View style={styles.inputRow}>
              <TextInput
                value={newKey}
                onChangeText={(t) => {
                  setNewKey(t);
                  if (addError) setAddError(null);
                }}
                placeholder="Field name"
                placeholderTextColor={Colors.text.muted}
                style={[styles.input, styles.keyInput]}
                autoCapitalize="none"
              />
              <TextInput
                value={newValue}
                onChangeText={setNewValue}
                placeholder="Value"
                placeholderTextColor={Colors.text.muted}
                style={[styles.input, styles.valInput]}
              />
            </View>

            {addError ? (
              <Text style={styles.errorText}>{addError}</Text>
            ) : null}

            <View style={styles.formActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setIsAdding(false);
                  setAddError(null);
                }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={handleAddField}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.addFieldBtn,
              pressed && styles.addFieldBtnPressed,
            ]}
            onPress={() => setIsAdding(true)}>
            <Ionicons name="add" size={14} color={Colors.tier.core} />
            <Text style={styles.addFieldText}>Add Metadata Field</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rowsContainer: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
  },
  keyCol: {
    width: 100,
  },
  keyText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  valCol: {
    flex: 1,
  },
  valText: {
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  deleteBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border.active,
    borderStyle: 'dashed',
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(245, 166, 35, 0.05)',
  },
  addFieldBtnPressed: {
    opacity: 0.8,
  },
  addFieldText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.tier.core,
  },
  addForm: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.active,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  keyInput: {
    width: 110,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
  },
  valInput: {
    flex: 1,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.semantic.danger,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  cancelBtnText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  saveBtn: {
    backgroundColor: Colors.tier.core,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
  },
  saveBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.bg.void,
  },
});
