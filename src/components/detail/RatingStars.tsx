import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

export interface RatingStarsProps {
  rating: number | null;
  readonly?: boolean;
  onRate?: (rating: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function RatingStars({
  rating,
  readonly = false,
  onRate,
  style,
}: RatingStarsProps) {
  const currentRating = rating ?? 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotsRow}>
        {Array.from({ length: 10 }, (_, i) => {
          const score = i + 1;
          const isActive = score <= currentRating;

          return (
            <Pressable
              key={score}
              disabled={readonly}
              hitSlop={6}
              onPress={() => {
                if (readonly || !onRate) return;
                hapticLight();
                onRate(score);
              }}
              style={({ pressed }) => [
                styles.dotTouch,
                pressed && !readonly && styles.dotPressed,
              ]}>
              <View
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.scoreText}>
        {rating !== null && rating !== undefined ? `${rating} / 10` : 'Unrated'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotTouch: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPressed: {
    opacity: 0.6,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: Radius.sm,
  },
  dotActive: {
    backgroundColor: Colors.tier.core,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.6)',
    shadowColor: Colors.tier.core,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  scoreText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
});
