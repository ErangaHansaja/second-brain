import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Spacing } from '@/theme/tokens';
import {
  deleteNode,
  getDescendantCount,
  getMoveTargets,
  moveNode,
  seedStarterTemplates,
  updateNode,
} from '@/db/repository';
import {
  useAncestors,
  useChildren,
  useNode,
  useRootNode,
} from '@/hooks';
import type { ParsedNode } from '@/types';
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
  hapticWarning,
} from '@/utils/haptics';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TierBadge } from '@/components/explorer/TierBadge';
import { Breadcrumb } from '@/components/explorer/Breadcrumb';
import { AddNodeFAB } from '@/components/explorer/AddNodeFAB';
import { MoveNodeModal, type MoveTargetFolder } from '@/components/explorer/MoveNodeModal';
import { ExplorerNodeItem } from './ExplorerNodeItem';
import { NodeActionsModal } from './NodeActionsModal';
import { RenameNodeModal } from './RenameNodeModal';

export interface ExplorerScreenProps {
  initialNodeId?: string;
}

type ActiveModal = 'none' | 'actions' | 'rename' | 'move' | 'delete';

interface FeedbackBanner {
  type: 'info' | 'error';
  message: string;
}

export default function ExplorerScreen({ initialNodeId }: ExplorerScreenProps) {
  const {
    rootNode,
    loading: rootLoading,
    error: rootError,
    refresh: refreshRoot,
  } = useRootNode();

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(
    initialNodeId ?? null
  );
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [banner, setBanner] = useState<FeedbackBanner | null>(null);

  // Selected node & modal orchestration state
  const [selectedNode, setSelectedNode] = useState<ParsedNode | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [mutating, setMutating] = useState<boolean>(false);
  const [moveTargets, setMoveTargets] = useState<MoveTargetFolder[]>([]);
  const [deleteChildCount, setDeleteChildCount] = useState<number>(0);

  const prevRootIdRef = useRef<string | null>(null);

  // Sync root node on initial load and snap cleanly if root UUID changes (e.g., backup restore)
  useEffect(() => {
    if (!rootNode) return;
    if (!currentNodeId) {
      setCurrentNodeId(rootNode.id);
    } else if (
      prevRootIdRef.current &&
      prevRootIdRef.current !== rootNode.id
    ) {
      setCurrentNodeId(rootNode.id);
    }
    prevRootIdRef.current = rootNode.id;
  }, [rootNode, currentNodeId]);

  // Sync incoming route param changes (e.g. deep-jump from Search)
  useEffect(() => {
    if (initialNodeId) {
      setCurrentNodeId(initialNodeId);
    }
  }, [initialNodeId]);

  // Auto-dismiss info banners cleanly
  useEffect(() => {
    if (!banner || banner.type !== 'info') return;
    const timer = setTimeout(() => {
      setBanner(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const {
    node: currentNode,
    loading: nodeLoading,
    error: nodeError,
    refresh: refreshNode,
  } = useNode(currentNodeId);

  const {
    children,
    loading: childrenLoading,
    error: childrenError,
    refresh: refreshChildren,
  } = useChildren(currentNodeId);

  const {
    ancestors,
    refresh: refreshAncestors,
  } = useAncestors(currentNodeId);

  // Recover to root automatically if active node no longer resolves (e.g. backup restore or deletion)
  useEffect(() => {
    if (
      !rootLoading &&
      !nodeLoading &&
      !nodeError &&
      rootNode &&
      currentNodeId &&
      currentNode === null &&
      currentNodeId !== rootNode.id
    ) {
      setCurrentNodeId(rootNode.id);
    }
  }, [rootLoading, nodeLoading, nodeError, rootNode, currentNodeId, currentNode]);

  const handleRefresh = useCallback(() => {
    refreshRoot();
    refreshNode();
    refreshChildren();
    refreshAncestors();
    setRefreshKey((prev) => prev + 1);
  }, [refreshRoot, refreshNode, refreshChildren, refreshAncestors]);

  // Refresh data whenever returning to Explorer tab
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  // Scoped Android hardware back button handling while Explorer is focused
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (currentNode && currentNode.parentId) {
            setCurrentNodeId(currentNode.parentId);
            return true;
          }
          return false;
        }
      );
      return () => subscription.remove();
    }, [currentNode])
  );

  const showError = (err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : fallback;
    setBanner({ type: 'error', message });
  };

  const handleSeedStarter = async () => {
    if (!rootNode || seeding) return;
    try {
      setSeeding(true);
      setBanner(null);
      await seedStarterTemplates(rootNode.id);
      hapticSuccess();
      handleRefresh();
      setBanner({ type: 'info', message: 'Starter categories loaded' });
    } catch (err) {
      showError(err, 'Failed to load starter categories');
    } finally {
      setSeeding(false);
    }
  };

  const handleNodePress = useCallback((node: ParsedNode) => {
    if (node.nodeType === 'folder') {
      setCurrentNodeId(node.id);
    } else {
      router.push(`/node/${node.id}` as any);
    }
  }, []);

  const handleNodeCreated = useCallback(
    (newNode: ParsedNode) => {
      handleRefresh();
      if (newNode.nodeType === 'entry') {
        router.push(`/node/${newNode.id}?edit=1` as any);
      }
    },
    [handleRefresh]
  );

  const handleNodeLongPress = useCallback((node: ParsedNode) => {
    hapticMedium();
    setSelectedNode(node);
    setActiveModal('actions');
  }, []);

  const handleCloseModals = () => {
    if (mutating) return;
    setActiveModal('none');
    setSelectedNode(null);
  };

  const handleStartRename = (node: ParsedNode) => {
    setSelectedNode(node);
    setActiveModal('rename');
  };

  const handleConfirmRename = async (newTitle: string) => {
    if (!selectedNode) return;
    try {
      setMutating(true);
      await updateNode(selectedNode.id, { title: newTitle });
      setActiveModal('none');
      setSelectedNode(null);
      handleRefresh();
      setBanner({ type: 'info', message: `Renamed to "${newTitle}"` });
    } catch (err) {
      setActiveModal('none');
      showError(err, 'Failed to rename item');
    } finally {
      setMutating(false);
    }
  };

  const handleStartMove = async (node: ParsedNode) => {
    try {
      setSelectedNode(node);
      const targets = await getMoveTargets(node.id);
      setMoveTargets(targets);
      setActiveModal('move');
    } catch (err) {
      setActiveModal('none');
      showError(err, 'Failed to load destination folders');
    }
  };

  const handleConfirmMove = async (targetParentId: string) => {
    if (!selectedNode) return;
    const movedTitle = selectedNode.title;
    try {
      setMutating(true);
      await moveNode(selectedNode.id, targetParentId);
      setActiveModal('none');
      setSelectedNode(null);
      handleRefresh();
      setBanner({ type: 'info', message: `Moved "${movedTitle}"` });
    } catch (err) {
      setActiveModal('none');
      showError(err, 'Failed to move item');
    } finally {
      setMutating(false);
    }
  };

  const handleStartDelete = async (node: ParsedNode) => {
    try {
      setSelectedNode(node);
      const count =
        node.nodeType === 'folder' ? await getDescendantCount(node.id) : 0;
      setDeleteChildCount(count);
      hapticWarning();
      setActiveModal('delete');
    } catch (err) {
      setActiveModal('none');
      showError(err, 'Failed to inspect item before delete');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedNode) return;
    const deletedTitle = selectedNode.title;
    try {
      setMutating(true);
      await deleteNode(selectedNode.id);
      setActiveModal('none');
      setSelectedNode(null);
      handleRefresh();
      setBanner({ type: 'info', message: `Deleted "${deletedTitle}"` });
    } catch (err) {
      setActiveModal('none');
      showError(err, 'Failed to delete item');
    } finally {
      setMutating(false);
    }
  };

  const activeError = rootError || nodeError || childrenError;
  const isInitialLoading =
    rootLoading || (nodeLoading && !currentNode) || (childrenLoading && children.length === 0 && !currentNode);

  const deleteMessage = selectedNode
    ? selectedNode.nodeType === 'folder' && deleteChildCount > 0
      ? `Delete "${selectedNode.title}" and its ${deleteChildCount} nested ${
          deleteChildCount === 1 ? 'item' : 'items'
        }? This action cannot be undone.`
      : `Delete "${selectedNode.title}"? This action cannot be undone.`
    : '';

  return (
    <ScreenContainer>
      {/* Top Explorer Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentNode ? currentNode.title : 'Me'}
            </Text>
            {currentNode ? <TierBadge depth={currentNode.depth} /> : null}
          </View>
          {currentNode?.description ? (
            <Text style={styles.headerDescription} numberOfLines={1}>
              {currentNode.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerRight}>
          {currentNode?.parentId ? (
            <Pressable
              hitSlop={8}
              onPress={() => setCurrentNodeId(currentNode.parentId)}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
              accessibilityLabel="Navigate up one level"
              accessibilityRole="button">
              <Ionicons
                name="arrow-back"
                size={19}
                color={Colors.text.primary}
              />
            </Pressable>
          ) : null}

          <Pressable
            hitSlop={8}
            onPress={() => {
              hapticLight();
              setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
            }}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            accessibilityLabel={
              viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'
            }
            accessibilityRole="button">
            <Ionicons
              name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
              size={19}
              color={Colors.text.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* Breadcrumb Bar (hidden at root depth 0) */}
      {currentNode && currentNode.depth > 0 ? (
        <Breadcrumb
          ancestors={ancestors}
          current={currentNode.title}
          onPress={(id) => setCurrentNodeId(id)}
        />
      ) : null}

      {/* Inline Feedback / Error Banner */}
      {banner || activeError ? (
        <View
          style={[
            styles.banner,
            banner?.type === 'error' || activeError
              ? styles.bannerError
              : styles.bannerInfo,
          ]}>
          <Ionicons
            name={
              banner?.type === 'error' || activeError
                ? 'alert-circle-outline'
                : 'checkmark-circle-outline'
            }
            size={16}
            color={
              banner?.type === 'error' || activeError
                ? Colors.semantic.danger
                : Colors.tier.core
            }
          />
          <Text
            style={[
              styles.bannerText,
              (banner?.type === 'error' || Boolean(activeError)) &&
                styles.bannerTextError,
            ]}
            numberOfLines={2}>
            {banner?.message ?? activeError?.message}
          </Text>
          {banner ? (
            <Pressable hitSlop={8} onPress={() => setBanner(null)}>
              <Ionicons name="close" size={14} color={Colors.text.muted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Node List / Grid */}
      {isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.tier.core} />
        </View>
      ) : !currentNode && !nodeLoading && rootNode ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="planet-outline"
            title="Folder Unavailable"
            subtitle="This location could not be found. It may have been deleted."
            actionLabel="Return to Me"
            onAction={() => setCurrentNodeId(rootNode.id)}
          />
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={children}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={
            viewMode === 'grid' ? styles.gridColumnWrapper : undefined
          }
          contentContainerStyle={
            children.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ExplorerNodeItem
              node={item}
              refreshKey={refreshKey}
              viewMode={viewMode}
              onPress={handleNodePress}
              onLongPress={handleNodeLongPress}
            />
          )}
          ListEmptyComponent={
            childrenLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.tier.core} />
              </View>
            ) : currentNode && currentNode.depth === 0 ? (
              <EmptyState
                icon="planet-outline"
                title="Your Universe is Empty"
                subtitle="Load starter categories for Entertainment, Work, Study, and Food — or tap + to create your own."
                actionLabel={
                  seeding ? 'Loading Starter Categories...' : 'Load Starter Categories'
                }
                onAction={handleSeedStarter}
              />
            ) : (
              <EmptyState
                icon="folder-open-outline"
                title="Empty Folder"
                subtitle="Tap the + button below to add a sub-folder or knowledge entry."
              />
            )
          }
        />
      )}

      {/* Floating Add Button */}
      {currentNode ? (
        <AddNodeFAB
          parentId={currentNode.id}
          parentDepth={currentNode.depth}
          onCreated={handleNodeCreated}
        />
      ) : null}

      {/* Long-Press Actions Menu */}
      <NodeActionsModal
        visible={activeModal === 'actions'}
        node={selectedNode}
        onRename={handleStartRename}
        onMove={handleStartMove}
        onDelete={handleStartDelete}
        onClose={handleCloseModals}
      />

      {/* Rename Modal */}
      <RenameNodeModal
        visible={activeModal === 'rename'}
        initialTitle={selectedNode?.title ?? ''}
        submitting={mutating}
        onSave={handleConfirmRename}
        onCancel={handleCloseModals}
      />

      {/* Move Destination Modal */}
      <MoveNodeModal
        visible={activeModal === 'move'}
        nodeTitle={selectedNode?.title ?? ''}
        folders={moveTargets}
        currentParentId={selectedNode?.parentId ?? ''}
        onSelect={handleConfirmMove}
        onCancel={handleCloseModals}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={activeModal === 'delete'}
        title="Delete Item"
        message={deleteMessage}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModals}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.bg.void,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.subtle,
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  headerDescription: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    borderColor: Colors.border.active,
    backgroundColor: Colors.bg.elevated,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.bg.surface,
  },
  bannerInfo: {
    borderColor: Colors.border.active,
  },
  bannerError: {
    borderColor: Colors.semantic.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  bannerText: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.tier.core,
  },
  bannerTextError: {
    color: Colors.semantic.danger,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xxl,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 112,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
  },
});
