import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight } from '@/theme/tokens';
import type { CosmosNode } from '@/utils/cosmosLayout';

export interface CosmosLabelProps {
  item: CosmosNode;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  scale: SharedValue<number>;
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  isSelected: boolean;
}

const LABEL_HALF_WIDTH = 64;

export const CosmosLabel = React.memo(function CosmosLabel({
  item,
  tx,
  ty,
  scale,
  cx,
  cy,
  isSelected,
}: CosmosLabelProps) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const screenX = cx.value + tx.value + item.x * scale.value;
    const screenY = cy.value + ty.value + (item.y + item.radius) * scale.value + 5;

    return {
      transform: [{ translateX: screenX }, { translateY: screenY }],
    };
  });

  const depth = item.node.depth;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.anchor, animatedStyle]}>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          depth === 0 && styles.coreLabel,
          depth >= 2 && styles.subLabel,
          isSelected && styles.selectedLabel,
        ]}>
        {item.node.title}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: -LABEL_HALF_WIDTH,
    top: 0,
    width: LABEL_HALF_WIDTH * 2,
    alignItems: 'center',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    textShadowColor: Colors.bg.void,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  coreLabel: {
    fontWeight: FontWeight.bold,
    color: Colors.tier.core,
  },
  subLabel: {
    fontSize: FontSize.xs - 1,
    color: Colors.text.secondary,
  },
  selectedLabel: {
    color: Colors.tier.core,
    fontWeight: FontWeight.bold,
  },
});
