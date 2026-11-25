import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
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
  buildCosmosGraphData,
  type CosmosNode,
} from '@/utils/cosmosLayout';
import { hapticLight } from '@/utils/haptics';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { buildCosmosHtml, type CosmosEngineNode } from './cosmosEngineHtml';
import { CosmosInspectorCard } from './CosmosInspectorCard';

interface CosmosWebViewHandle {
  postMessage: (data: string) => void;
}

type OutgoingWebViewCommand =
  | { type: 'SET_DATA'; nodes: CosmosEngineNode[] }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'RESET_CAMERA' }
  | { type: 'CLEAR_SELECTION' };

interface IncomingWebViewMessage {
  type?: string;
  nodeId?: string;
}

export default function CosmosScreen() {
  const { nodes, loading, error, refresh } = useAllNodes();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const webViewRef = useRef<CosmosWebViewHandle | null>(null);
  const webViewReadyRef = useRef<boolean>(false);

  const htmlSource = useMemo(() => ({ html: buildCosmosHtml() }), []);
  const graph = useMemo(() => buildCosmosGraphData(nodes), [nodes]);

  const latestEngineNodesRef = useRef<CosmosEngineNode[]>(graph.engineNodes);
  useEffect(() => {
    latestEngineNodesRef.current = graph.engineNodes;
  }, [graph.engineNodes]);

  const postCommand = useCallback((command: OutgoingWebViewCommand) => {
    try {
      webViewRef.current?.postMessage(JSON.stringify(command));
    } catch {
      // WebView may not be mounted yet
    }
  }, []);

  // Push fresh SQLite nodes whenever WebView becomes ready or nodes update
  useEffect(() => {
    if (webViewReadyRef.current) {
      postCommand({ type: 'SET_DATA', nodes: graph.engineNodes });
    }
  }, [graph.engineNodes, postCommand]);

  // Refresh data and reset zoom/selection whenever returning to Cosmos tab
  useFocusEffect(
    useCallback(() => {
      refresh();
      setSelectedNodeId(null);
      if (webViewReadyRef.current) {
        postCommand({ type: 'RESET_CAMERA' });
      }
    }, [refresh, postCommand])
  );

  const selectedItem = useMemo(
    () =>
      selectedNodeId
        ? graph.items.find((item) => item.node.id === selectedNodeId) ?? null
        : null,
    [graph.items, selectedNodeId]
  );

  useEffect(() => {
    if (selectedNodeId && !loading && !selectedItem) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, loading, selectedItem]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const parsed = JSON.parse(
          event.nativeEvent.data
        ) as IncomingWebViewMessage;
        if (!parsed || !parsed.type) return;

        if (parsed.type === 'READY') {
          webViewReadyRef.current = true;
          postCommand({
            type: 'SET_DATA',
            nodes: latestEngineNodesRef.current,
          });
        } else if (parsed.type === 'SELECT_NODE' && parsed.nodeId) {
          hapticLight();
          setSelectedNodeId(parsed.nodeId);
        } else if (parsed.type === 'CLEAR_SELECTION') {
          setSelectedNodeId(null);
        }
      } catch {
        // Ignore malformed messages
      }
    },
    [postCommand]
  );

  const handleZoomIn = useCallback(() => {
    hapticLight();
    postCommand({ type: 'ZOOM_IN' });
  }, [postCommand]);

  const handleZoomOut = useCallback(() => {
    hapticLight();
    postCommand({ type: 'ZOOM_OUT' });
  }, [postCommand]);

  const handleRecenter = useCallback(() => {
    hapticLight();
    setSelectedNodeId(null);
    postCommand({ type: 'RESET_CAMERA' });
  }, [postCommand]);

  const handleCloseInspector = useCallback(() => {
    setSelectedNodeId(null);
    postCommand({ type: 'CLEAR_SELECTION' });
  }, [postCommand]);

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
          <WebView
            {...({ ref: webViewRef } as object)}
            source={htmlSource}
            originWhitelist={['*']}
            javaScriptEnabled
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            androidLayerType="hardware"
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onMessage={handleWebViewMessage}
            containerStyle={styles.webView}
            style={styles.webView}
          />
        )}

        {/* Top Floating HUD */}
        <View pointerEvents="box-none" style={styles.topHud}>
          <View style={styles.hudPill}>
            <Text style={styles.hudTitle}>Cosmos</Text>
          </View>

          <View style={styles.hudPill}>
            <Text style={styles.hudCount}>
              {graph.items.length}{' '}
              {graph.items.length === 1 ? 'body' : 'bodies'}
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
              onPress={handleZoomIn}
              accessibilityLabel="Zoom in"
              accessibilityRole="button">
              <Ionicons name="add" size={18} color={Colors.text.primary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlPressed,
              ]}
              onPress={handleZoomOut}
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
              onClose={handleCloseInspector}
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
  webView: {
    flex: 1,
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
