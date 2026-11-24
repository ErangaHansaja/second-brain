import React, { useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '@/theme/tokens';
import type { BreadcrumbItem } from '@/types';

export interface BreadcrumbProps {
  ancestors: BreadcrumbItem[];
  current: string;
  onPress: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function Breadcrumb({
  ancestors,
  current,
  onPress,
  style,
}: BreadcrumbProps) {
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}>
        {ancestors.map((item) => (
          <React.Fragment key={item.id}>
            <Pressable
              hitSlop={8}
              onPress={() => onPress(item.id)}
              style={({ pressed }) => [
                styles.itemPressable,
                pressed && styles.itemPressed,
              ]}>
              <Text style={styles.ancestorText}>{item.title}</Text>
            </Pressable>
            <Text style={styles.separator}>/</Text>
          </React.Fragment>
        ))}
        <Text style={styles.currentText} numberOfLines={1}>
          {current}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemPressable: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  itemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  ancestorText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  separator: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  currentText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
});
