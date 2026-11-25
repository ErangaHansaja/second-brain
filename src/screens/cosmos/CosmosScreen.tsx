import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, {
  Circle,
  type CircleProps,
  Defs,
  G,
  type GProps,
  Line,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useAllNodes } from '@/hooks';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '@/theme/tokens';
import {
  computeCosmosLayout,
  type CosmosNode,
  findNodeAtWorldPoint,
} from '@/utils/cosmosLayout';
import { hapticLight } from '@/utils/haptics';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { CosmosLabel } from './CosmosLabel';
import { CosmosInspectorCard } from './CosmosInspectorCard';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MIN_SCALE = 0.35;
const MAX_SCALE = 4.0;
const DOUBLE_TAP_ZOOM = 2.0;

type ZoomTier = 0 | 1 | 2;

interface StarPoint {
  id: string;
  x: number;
  y: number;
  r: number;
  opacity: number;
}

function generateStarfield(count: number, extent: number): StarPoint[] {
  let seed = 0x5ec0bd1;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const stars: StarPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      id: `star-${i}`,
      x: (nextRand() - 0.5) * extent * 2,
      y: (nextRand() - 0.5) * extent * 2,
      r: 0.7 + nextRand() * 1.0,
      opacity: 0.14 + nextRand() * 0.28,
    });
  }
  return stars;
}

const STARFIELD = generateStarfield(68, 950);

export default function CosmosScreen() {
  const { nodes, loading, error, refresh } = useAllNodes();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomTier, setZoomTier] = useState<ZoomTier>(1);

  const initialWindow = Dimensions.get('window');
  const [canvasSize, setCanvasSize] = useState({
    width: initialWindow.width,
    height: Math.max(320, initialWindow.height - 130),
  });

  // Camera state (UI thread)
  const cx = useSharedValue(initialWindow.width / 2);
  const cy = useSharedValue(Math.max(320, initialWindow.height - 130) / 2);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);

  // Subtle breathing halo animation around the central black hole
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [breath]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const layout = useMemo(() => computeCosmosLayout(nodes), [nodes]);

  const layoutItemsRef = useRef<CosmosNode[]>(layout.items);

  useEffect(() => {
    layoutItemsRef.current = layout.items;
  }, [layout.items]);

  const selectedItem = useMemo(
    () =>
      selectedNodeId
        ? layout.items.find((item) => item.node.id === selectedNodeId) ?? null
        : null,
    [layout.items, selectedNodeId]
  );

  // Clear stale selection if the node no longer exists after reload/restore
  useEffect(() => {
    if (selectedNodeId && !loading && !selectedItem) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, loading, selectedItem]);

  // Coarse LOD threshold updates via scheduleOnRN only on threshold crossings
  useAnimatedReaction(
    () => {
      'worklet';
      if (scale.value >= 1.35) return 2 as ZoomTier;
      if (scale.value >= 0.8) return 1 as ZoomTier;
      return 0 as ZoomTier;
    },
    (nextTier, prevTier) => {
      'worklet';
      if (nextTier !== prevTier) {
        scheduleOnRN(setZoomTier, nextTier);
      }
    },
    []
  );

  const handleTapAtScreen = useCallback(
    (
      sx: number,
      sy: number,
      tapScale: number,
      tapTx: number,
      tapTy: number,
      centerX: number,
      centerY: number
    ) => {
      const worldX = (sx - centerX - tapTx) / tapScale;
      const worldY = (sy - centerY - tapTy) / tapScale;
      const hit = findNodeAtWorldPoint(
        layoutItemsRef.current,
        worldX,
        worldY,
        tapScale
      );

      if (hit) {
        hapticLight();
        setSelectedNodeId(hit.node.id);
        tx.value = withSpring(-hit.x * tapScale, { damping: 20, stiffness: 160 });
        ty.value = withSpring(-hit.y * tapScale, { damping: 20, stiffness: 160 });
      } else {
        setSelectedNodeId(null);
      }
    },
    [tx, ty]
  );

  const panGesture = usePanGesture({
    minDistance: 6,
    onUpdate: (e) => {
      'worklet';
      tx.value += e.changeX;
      ty.value += e.changeY;
    },
  });

  const pinchGesture = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      const prevScale = scale.value;
      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, prevScale * e.scaleChange)
      );
      const ratio = nextScale / prevScale;
      const relFocalX = e.focalX - cx.value;
      const relFocalY = e.focalY - cy.value;
      tx.value = relFocalX - (relFocalX - tx.value) * ratio;
      ty.value = relFocalY - (relFocalY - ty.value) * ratio;
      scale.value = nextScale;
    },
  });

  const doubleTapGesture = useTapGesture({
    numberOfTaps: 2,
    maxDistance: 18,
    maxDelay: 250,
    onActivate: (e) => {
      'worklet';
      if (e.numberOfPointers > 1) return;
      if (scale.value > 1.35) {
        scale.value = withSpring(1);
        tx.value = withSpring(0);
        ty.value = withSpring(0);
      } else {
        const worldX = (e.x - cx.value - tx.value) / scale.value;
        const worldY = (e.y - cy.value - ty.value) / scale.value;
        scale.value = withSpring(DOUBLE_TAP_ZOOM);
        tx.value = withSpring(-worldX * DOUBLE_TAP_ZOOM);
        ty.value = withSpring(-worldY * DOUBLE_TAP_ZOOM);
      }
    },
  });

  const singleTapGesture = useTapGesture({
    maxDistance: 8,
    onActivate: (e) => {
      'worklet';
      if (e.numberOfPointers > 1) return;
      scheduleOnRN(
        handleTapAtScreen,
        e.x,
        e.y,
        scale.value,
        tx.value,
        ty.value,
        cx.value,
        cy.value
      );
    },
  });

  const tapComposition = useExclusiveGestures(doubleTapGesture, singleTapGesture);
  const composedGesture = useSimultaneousGestures(
    panGesture,
    pinchGesture,
    tapComposition
  );

  const worldAnimatedProps = useAnimatedProps<GProps & { matrix?: number[] }>(
    () => {
      'worklet';
      const s = scale.value;
      return {
        matrix: [s, 0, 0, s, cx.value + tx.value, cy.value + ty.value],
      };
    }
  );

  const haloAnimatedProps = useAnimatedProps<CircleProps>(() => {
    'worklet';
    return {
      r: 38 + breath.value * 7,
      strokeOpacity: 0.42 - breath.value * 0.24,
    };
  });

  const handleCanvasLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) {
        cx.value = width / 2;
        cy.value = height / 2;
        setCanvasSize((prev) =>
          prev.width === width && prev.height === height
            ? prev
            : { width, height }
        );
      }
    },
    [cx, cy]
  );

  const handleZoomStep = useCallback(
    (factor: number) => {
      hapticLight();
      const prevScale = scale.value;
      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, prevScale * factor)
      );
      const ratio = nextScale / prevScale;
      scale.value = withTiming(nextScale, { duration: 180 });
      tx.value = withTiming(tx.value * ratio, { duration: 180 });
      ty.value = withTiming(ty.value * ratio, { duration: 180 });
    },
    [scale, tx, ty]
  );

  const handleRecenter = useCallback(() => {
    hapticLight();
    scale.value = withSpring(1);
    tx.value = withSpring(0);
    ty.value = withSpring(0);
  }, [scale, tx, ty]);

  const handleOpenSelected = useCallback((item: CosmosNode) => {
    if (item.node.nodeType === 'entry') {
      router.push(`/node/${item.node.id}` as any);
    } else {
      router.navigate({
        pathname: '/(tabs)',
        params: { nodeId: item.node.id },
      } as any);
    }
  }, []);

  const rootItem = useMemo(
    () => layout.items.find((item) => item.node.depth === 0) ?? null,
    [layout.items]
  );

  const orbitingItems = useMemo(
    () => layout.items.filter((item) => item.node.depth > 0),
    [layout.items]
  );

  const visibleLabels = useMemo(() => {
    return layout.items.filter((item) => {
      const isSelected = selectedNodeId === item.node.id;
      const isSelectedChild = Boolean(
        selectedNodeId && item.parentId === selectedNodeId
      );
      if (item.node.depth <= 1 || isSelected || isSelectedChild) {
        return true;
      }
      if (item.node.depth === 2) {
        return zoomTier >= 1;
      }
      return zoomTier >= 2;
    });
  }, [layout.items, selectedNodeId, zoomTier]);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {loading && nodes.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.tier.core} />
          </View>
        ) : error && nodes.length === 0 ? (
          <View style={styles.centerState}>
            <EmptyState
              icon="alert-circle-outline"
              title="Could Not Load Cosmos"
              subtitle={error.message}
              actionLabel="Retry"
              onAction={refresh}
            />
          </View>
        ) : (
          <GestureDetector gesture={composedGesture}>
            <View style={styles.canvasWrap} onLayout={handleCanvasLayout}>
              <Svg
                width={canvasSize.width}
                height={canvasSize.height}
                style={styles.svgCanvas}>
                <Defs>
                  <RadialGradient
                    id="coreEventHorizon"
                    cx="50%"
                    cy="50%"
                    r="50%">
                    <Stop
                      offset="0%"
                      stopColor={Colors.tier.core}
                      stopOpacity={0.92}
                    />
                    <Stop
                      offset="42%"
                      stopColor={Colors.tier.core}
                      stopOpacity={0.34}
                    />
                    <Stop
                      offset="76%"
                      stopColor={Colors.tier.core}
                      stopOpacity={0.08}
                    />
                    <Stop
                      offset="100%"
                      stopColor={Colors.bg.void}
                      stopOpacity={0}
                    />
                  </RadialGradient>
                </Defs>

                <AnimatedG animatedProps={worldAnimatedProps}>
                  {/* Deterministic static starfield */}
                  {STARFIELD.map((star) => (
                    <Circle
                      key={star.id}
                      cx={star.x}
                      cy={star.y}
                      r={star.r}
                      fill={Colors.text.primary}
                      fillOpacity={star.opacity}
                    />
                  ))}

                  {/* Hairline orbital rings */}
                  {layout.rings.map((ring, idx) => (
                    <Circle
                      key={`ring-${ring.depth}-${idx}`}
                      cx={ring.cx}
                      cy={ring.cy}
                      r={ring.r}
                      fill="none"
                      stroke={Colors.text.muted}
                      strokeOpacity={ring.depth === 1 ? 0.34 : 0.22}
                      strokeWidth={ring.depth === 1 ? 1 : 0.8}
                      strokeDasharray={ring.depth === 1 ? '4 6' : '2 4'}
                    />
                  ))}

                  {/* Parent-child cosmic tether edges */}
                  {layout.edges.map((edge) => (
                    <Line
                      key={edge.id}
                      x1={edge.fromX}
                      y1={edge.fromY}
                      x2={edge.toX}
                      y2={edge.toY}
                      stroke={edge.color}
                      strokeOpacity={edge.depth === 1 ? 0.26 : 0.18}
                      strokeWidth={edge.depth === 1 ? 1.1 : 0.8}
                    />
                  ))}

                  {/* Orbiting Galaxies, Systems, Planets & Entries */}
                  {orbitingItems.map((item) => {
                    const isSelected = selectedNodeId === item.node.id;
                    const isFolder = item.node.nodeType === 'folder';

                    return (
                      <G key={item.node.id}>
                        <Circle
                          cx={item.x}
                          cy={item.y}
                          r={item.radius + 4}
                          fill={item.color}
                          fillOpacity={isSelected ? 0.24 : 0.1}
                        />

                        <Circle
                          cx={item.x}
                          cy={item.y}
                          r={item.radius}
                          fill={item.color}
                          fillOpacity={isFolder ? 0.24 : 0.9}
                          stroke={item.color}
                          strokeWidth={isFolder ? 1.6 : 1}
                        />

                        {isFolder && item.descendantCount > 0 ? (
                          <Circle
                            cx={item.x}
                            cy={item.y}
                            r={2.5}
                            fill={item.color}
                            fillOpacity={0.95}
                          />
                        ) : null}

                        {isSelected ? (
                          <Circle
                            cx={item.x}
                            cy={item.y}
                            r={item.radius + 6}
                            fill="none"
                            stroke={Colors.tier.core}
                            strokeWidth={1.4}
                            strokeDasharray="3 3"
                          />
                        ) : null}
                      </G>
                    );
                  })}

                  {/* Central "Me" Event Horizon Black Hole */}
                  {rootItem ? (
                    <G>
                      <AnimatedCircle
                        cx={0}
                        cy={0}
                        fill="none"
                        stroke={Colors.tier.core}
                        strokeWidth={1.2}
                        animatedProps={haloAnimatedProps}
                      />
                      <Circle
                        cx={0}
                        cy={0}
                        r={46}
                        fill="url(#coreEventHorizon)"
                      />
                      <Circle
                        cx={0}
                        cy={0}
                        r={26}
                        fill="none"
                        stroke={Colors.tier.core}
                        strokeWidth={1.5}
                        strokeOpacity={0.88}
                      />
                      <Circle cx={0} cy={0} r={21} fill={Colors.bg.void} />
                      {selectedNodeId === rootItem.node.id ? (
                        <Circle
                          cx={0}
                          cy={0}
                          r={32}
                          fill="none"
                          stroke={Colors.tier.core}
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                        />
                      ) : null}
                    </G>
                  ) : null}
                </AnimatedG>
              </Svg>

              {/* Crisp Screen-Space Node Labels with LOD */}
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {visibleLabels.map((item) => (
                  <CosmosLabel
                    key={item.node.id}
                    item={item}
                    tx={tx}
                    ty={ty}
                    scale={scale}
                    cx={cx}
                    cy={cy}
                    isSelected={selectedNodeId === item.node.id}
                  />
                ))}
              </View>
            </View>
          </GestureDetector>
        )}

        {/* Top Floating HUD */}
        <View pointerEvents="box-none" style={styles.topHud}>
          <View style={styles.hudPill}>
            <Text style={styles.hudTitle}>Cosmos</Text>
          </View>

          <View style={styles.hudPill}>
            <Text style={styles.hudCount}>
              {layout.items.length}{' '}
              {layout.items.length === 1 ? 'body' : 'bodies'}
            </Text>
          </View>
        </View>

        {/* Bottom Controls & Selected Inspector Stack */}
        <View pointerEvents="box-none" style={styles.bottomHud}>
          <View pointerEvents="box-none" style={styles.controlsWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlPressed,
              ]}
              onPress={() => handleZoomStep(1.35)}
              accessibilityLabel="Zoom in"
              accessibilityRole="button">
              <Ionicons name="add" size={18} color={Colors.text.primary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlPressed,
              ]}
              onPress={() => handleZoomStep(1 / 1.35)}
              accessibilityLabel="Zoom out"
              accessibilityRole="button">
              <Ionicons name="remove" size={18} color={Colors.text.primary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlPressed,
              ]}
              onPress={handleRecenter}
              accessibilityLabel="Recenter on Me"
              accessibilityRole="button">
              <Ionicons
                name="locate-outline"
                size={18}
                color={Colors.tier.core}
              />
            </Pressable>
          </View>

          {selectedItem ? (
            <CosmosInspectorCard
              item={selectedItem}
              onOpen={handleOpenSelected}
              onClose={() => setSelectedNodeId(null)}
            />
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  canvasWrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.bg.void,
  },
  svgCanvas: {
    backgroundColor: Colors.bg.void,
  },
  topHud: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudPill: {
    backgroundColor: Colors.bg.overlay,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md - 2,
    paddingVertical: Spacing.xs + 2,
  },
  hudTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  hudCount: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  bottomHud: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    gap: Spacing.sm,
  },
  controlsWrap: {
    alignSelf: 'flex-end',
    gap: Spacing.xs + 2,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPressed: {
    borderColor: Colors.border.active,
    backgroundColor: Colors.bg.elevated,
  },
});
