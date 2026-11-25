import { STATUS_PRESETS, type StatusConfig } from '@/constants/statuses';
import { Colors, tierColor } from '@/theme/tokens';
import type { ParsedNode } from '@/types';
import type { CosmosEngineNode } from '@/screens/cosmos/cosmosEngineHtml';

export interface CosmosNode {
  node: ParsedNode;
  color: string;
  descendantCount: number;
  parentId: string | null;
}

export function resolveCosmosNodeColor(node: ParsedNode): string {
  if (node.depth === 0) {
    return Colors.tier.core;
  }

  if (node.nodeType === 'entry') {
    if (
      node.status &&
      Object.prototype.hasOwnProperty.call(STATUS_PRESETS, node.status)
    ) {
      const preset = (STATUS_PRESETS as Record<string, StatusConfig>)[
        node.status
      ];
      if (preset) {
        return preset.color;
      }
    }
    return tierColor(node.depth);
  }

  return node.color || tierColor(node.depth);
}

/**
 * Computes subtree descendant counts for every node in O(N) with cycle protection.
 */
export function computeDescendantCounts(
  nodes: ParsedNode[]
): Map<string, number> {
  const childrenByParent = new Map<string, ParsedNode[]>();
  for (const node of nodes) {
    if (node.parentId) {
      const list = childrenByParent.get(node.parentId);
      if (list) {
        list.push(node);
      } else {
        childrenByParent.set(node.parentId, [node]);
      }
    }
  }

  const descendantCounts = new Map<string, number>();
  const visiting = new Set<string>();

  function countDescendants(nodeId: string): number {
    const cached = descendantCounts.get(nodeId);
    if (cached !== undefined) return cached;
    if (visiting.has(nodeId)) return 0;

    visiting.add(nodeId);
    const directChildren = childrenByParent.get(nodeId) ?? [];
    let total = 0;
    for (const child of directChildren) {
      total += 1 + countDescendants(child.id);
    }
    visiting.delete(nodeId);
    descendantCounts.set(nodeId, total);
    return total;
  }

  for (const node of nodes) {
    countDescendants(node.id);
  }

  return descendantCounts;
}

/**
 * Prepares both native inspector summary items and lightweight WebView 3D engine payloads.
 */
export function buildCosmosGraphData(nodes: ParsedNode[]): {
  items: CosmosNode[];
  engineNodes: CosmosEngineNode[];
} {
  if (nodes.length === 0) {
    return { items: [], engineNodes: [] };
  }

  const descendantCounts = computeDescendantCounts(nodes);
  const items: CosmosNode[] = [];
  const engineNodes: CosmosEngineNode[] = [];

  for (const node of nodes) {
    const color = resolveCosmosNodeColor(node);
    const descendantCount = descendantCounts.get(node.id) ?? 0;

    items.push({
      node,
      color,
      descendantCount,
      parentId: node.parentId,
    });

    engineNodes.push({
      id: node.id,
      parentId: node.parentId,
      title: node.title,
      nodeType: node.nodeType,
      depth: node.depth,
      color,
      rating: node.rating ?? null,
      status: node.status ?? null,
      descendantCount,
    });
  }

  return { items, engineNodes };
}
