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
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const entries = Object.entries(metadata);

  const handleDelete = (keyToDelete: string) => {
    const updated = { ...metadata };
    delete updated[keyToDelete];
    onChange?.(updated);
  };

  const handleOpenAdd = () => {
    setEditingKey(null);
    setFieldName('');
    setFieldValue('');
    setError(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (key: string, val: unknown) => {
    if (!editable) return;
    setEditingKey(key);
    setFieldName(key);
    setFieldValue(typeof val === 'object' ? JSON.stringify(val) : String(val));
    setError(null);
    setModalVisible(true);
  };

  const handleSaveField = () => {
    const trimmedKey = fieldName.trim();
    const trimmedVal = fieldValue.trim();

    if (!trimmedKey) {
      setError('Field name is required');
      return;
    }

    const updated = { ...metadata };

    // If key name was changed during edit, delete old key
    if (editingKey && editingKey !== trimmedKey) {
      delete updated[editingKey];
    }

    updated[trimmedKey] = trimmedVal;
    onChange?.(updated);

    setModalVisible(false);
    setEditingKey(null);
    setFieldName('');
    setFieldValue('');
    setError(null);
  };

  return (
    <View style={[styles.container, style]}>
      {entries.length > 0 ? (
        <View style={styles.rowsContainer}>
          {entries.map(([key, val]) => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.row,
                editable && pressed && styles.rowPressed,
              ]}
              disabled={!editable}
              onPress={() => handleOpenEdit(key, val)}>
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
                <View style={styles.rowActions}>
                  <Pressable
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(key);
                    }}
                    style={styles.deleteBtn}
                    accessibilityLabel={`Delete ${key}`}
                    accessibilityRole="button">
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={Colors.semantic.danger}
                    />
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : !editable ? (
        <Text style={styles.emptyText}>No details added</Text>
      ) : null}

      {editable ? (
        <Pressable
          style={({ pressed }) => [
            styles.addFieldBtn,
            pressed && styles.addFieldBtnPressed,
          ]}
          onPress={handleOpenAdd}
          accessibilityLabel="Add metadata field"
          accessibilityRole="button">
          <Ionicons name="add" size={14} color={Colors.tier.core} />
          <Text style={styles.addFieldText}>Add Metadata Field</Text>
        </Pressable>
      ) : null}

      {/* Keyboard-safe Dark Modal for Field Input / Edit */}
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
              <Text style={styles.modalTitle}>
                {editingKey ? 'Edit Field' : 'Add Metadata Field'}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.text.muted} />
              </Pressable>
            </View>

            <TextInputField
              label="Field Name"
              value={fieldName}
              onChangeText={(t) => {
                setFieldName(t);
                if (error) setError(null);
              }}
              placeholder="e.g. Season, Episodes, Price, Location"
              autoFocus={!editingKey}
              autoCapitalize="none"
              error={error}
              style={styles.modalInput}
            />

            <TextInputField
              label="Value"
              value={fieldValue}
              onChangeText={setFieldValue}
              placeholder="e.g. 3, 24, 1500"
              autoFocus={Boolean(editingKey)}
              onSubmitEditing={handleSaveField}
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
                  styles.saveBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleSaveField}>
                <Text style={styles.saveBtnText}>
                  {editingKey ? 'Save' : 'Add'}
                </Text>
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
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  deleteBtn: {
    padding: Spacing.xs,
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
    maxWidth: 380,
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
    marginBottom: Spacing.sm + 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
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
  saveBtn: {
    backgroundColor: Colors.tier.core,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    minWidth: 72,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.bg.void,
  },
  btnPressed: {
    opacity: 0.8,
  },
});
