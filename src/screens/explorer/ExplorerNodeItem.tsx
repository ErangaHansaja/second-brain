import React from 'react';
import { StyleSheet } from 'react-native';
import { useDescendantCount } from '@/hooks';
import { NodeCard } from '@/components/explorer/NodeCard';
import type { ParsedNode } from '@/types';

export interface ExplorerNodeItemProps {
  node: ParsedNode;
  refreshKey: number;
  viewMode: 'list' | 'grid';
  onPress: (node: ParsedNode) => void;
  onLongPress: (node: ParsedNode) => void;
}

export function ExplorerNodeItem({
  node,
  refreshKey,
  viewMode,
  onPress,
  onLongPress,
}: ExplorerNodeItemProps) {
  const isFolder = node.nodeType === 'folder';
  const { count } = useDescendantCount(isFolder ? node.id : null, refreshKey);

  return (
    <NodeCard
      node={node}
      descendantCount={isFolder ? count : undefined}
      viewMode={viewMode}
      onPress={onPress}
      onLongPress={onLongPress}
      style={viewMode === 'grid' ? styles.gridCard : undefined}
    />
  );
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    maxWidth: '48.5%',
  },
});
