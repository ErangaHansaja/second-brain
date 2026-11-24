import React, { useState } from 'react';
import {
  Modal,
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
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '@/theme/tokens';
import { STATUS_LIST, STATUS_PRESETS, StatusConfig } from '@/constants/statuses';
import type { NodeStatus } from '@/types';

export interface StatusChipProps {
  status: NodeStatus | null;
  editable?: boolean;
  onChange?: (newStatus: NodeStatus) => void;
  style?: StyleProp<ViewStyle>;
}

export function StatusChip({
  status,
  editable = false,
  onChange,
  style,
}: StatusChipProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const matchedPreset: StatusConfig =
    status && status in STATUS_PRESETS
      ? STATUS_PRESETS[status as keyof typeof STATUS_PRESETS]
      : {
          value: status ?? 'neutral',
          label: status ? String(status) : 'No Status',
          icon: 'ellipse-outline',
          color: Colors.text.muted,
        };

  const handleSelect = (newStatus: NodeStatus) => {
    setModalVisible(false);
    onChange?.(newStatus);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.chip,
          { borderColor: matchedPreset.color },
          editable && styles.chipEditable,
          pressed && editable && styles.chipPressed,
          style,
        ]}
        disabled={!editable}
        onPress={() => setModalVisible(true)}>
        <Ionicons
          name={matchedPreset.icon as keyof typeof Ionicons.glyphMap}
          size={13}
          color={matchedPreset.color}
        />
        <Text style={[styles.label, { color: matchedPreset.color }]}>
          {matchedPreset.label}
        </Text>
        {editable ? (
          <Ionicons
            name="chevron-down"
            size={12}
            color={matchedPreset.color}
            style={styles.chevron}
          />
        ) : null}
      </Pressable>

      {editable ? (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}>
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Status</Text>
                <Pressable hitSlop={8} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={20} color={Colors.text.muted} />
                </Pressable>
              </View>

              <View style={styles.optionsList}>
                {STATUS_LIST.map((preset) => {
                  const isSelected = preset.value === status;
                  return (
                    <Pressable
                      key={preset.value}
                      style={({ pressed }) => [
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                        pressed && styles.optionItemPressed,
                      ]}
                      onPress={() => handleSelect(preset.value)}>
                      <View style={styles.optionLeft}>
                        <Ionicons
                          name={preset.icon as keyof typeof Ionicons.glyphMap}
                          size={18}
                          color={preset.color}
                        />
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: isSelected ? Colors.text.primary : Colors.text.secondary },
                          ]}>
                          {preset.label}
                        </Text>
                      </View>

                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={Colors.tier.core}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignSelf: 'flex-start',
  },
  chipEditable: {
    paddingRight: Spacing.xs + 3,
  },
  chipPressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  chevron: {
    marginLeft: 1,
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
    maxWidth: 340,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  optionsList: {
    gap: Spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  optionItemSelected: {
    borderColor: Colors.border.active,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  optionItemPressed: {
    opacity: 0.85,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
