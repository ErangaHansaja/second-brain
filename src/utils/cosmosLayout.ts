import { STATUS_PRESETS, type StatusConfig } from '@/constants/statuses';
import { Colors, tierColor } from '@/theme/tokens';
import type { ParsedNode } from '@/types';

export interface CosmosNode {
  node: ParsedNode;
  x: number;
  y: number;
  radius: number;
  color: string;
  descendantCount: number;
  parentId: string | null;
}

export interface CosmosEdge {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  depth: number;
}

export interface CosmosRing {
  cx: number;
  cy: number;
  r: number;
  depth: number;
}

export interface CosmosLayoutResult {
  items: CosmosNode[];
  edges: CosmosEdge[];
  rings: CosmosRing[];
  bounds: { maxRadius: number };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveNodeColor(node: ParsedNode): string {
  if (node.depth === 0) {
    return Colors.tier.core;
  }

  if (node.nodeType === 'entry') {
    if (node.status && Object.prototype.hasOwnProperty.call(STATUS_PRESETS, node.status)) {
      const preset = (STATUS_PRESETS as Record<string, StatusConfig>)[node.status];
      if (preset) {
        return preset.color;
      }
    }
    return tierColor(node.depth);
  }

  return node.color || tierColor(node.depth);
}

function resolveNodeRadius(node: ParsedNode, descendantCount: number): number {
  if (node.depth === 0) {
    return 26;
  }

  if (node.nodeType === 'entry') {
    if (typeof node.rating === 'number' && Number.isFinite(node.rating)) {
      const normalized = (clamp(node.rating, 1, 10) - 1) / 9;
      return 6 + normalized * 4;
    }
    return 7.5;
  }

  if (node.depth === 1) {
    return clamp(14 + Math.min(descendantCount, 16) * 0.5, 14, 22);
  }

  if (node.depth === 2) {
    return clamp(10 + Math.min(descendantCount, 9) * 0.33, 10, 13);
  }

  return clamp(7 + Math.min(descendantCount, 6) * 0.33, 7, 9);
}

function computeFanAngles(
  outAngle: number,
  count: number,
  maxSpread: number,
  stepAngle: number
): number[] {
  if (count <= 0) return [];
  if (count === 1) return [outAngle];

  const span = Math.min(maxSpread, (count - 1) * stepAngle);
  const start = outAngle - span / 2;
  const angles: number[] = [];

  for (let i = 0; i < count; i += 1) {
    angles.push(start + (i * span) / (count - 1));
  }

  return angles;
}

export function computeCosmosLayout(nodes: ParsedNode[]): CosmosLayoutResult {
  if (nodes.length === 0) {
    return {
      items: [],
      edges: [],
      rings: [],
      bounds: { maxRadius: 240 },
    };
  }

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

  // Compute subtree descendant counts in O(N) with cycle guard
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

  const rootNode =
    nodes.find((n) => n.depth === 0 || n.parentId === null) ?? nodes[0];

  if (!rootNode) {
    return {
      items: [],
      edges: [],
      rings: [],
      bounds: { maxRadius: 240 },
    };
  }

  const items: CosmosNode[] = [];
  const edges: CosmosEdge[] = [];
  const rings: CosmosRing[] = [];
  const placedById = new Map<string, CosmosNode>();

  const rootItem: CosmosNode = {
    node: rootNode,
    x: 0,
    y: 0,
    radius: 26,
    color: Colors.tier.core,
    descendantCount: descendantCounts.get(rootNode.id) ?? 0,
    parentId: null,
  };
  items.push(rootItem);
  placedById.set(rootNode.id, rootItem);

  const galaxies = childrenByParent.get(rootNode.id) ?? [];
  const galaxyOrbitR =
    galaxies.length <= 6
      ? 185
      : Math.min(285, 185 + (galaxies.length - 6) * 20);

  rings.push({
    cx: 0,
    cy: 0,
    r: galaxyOrbitR,
    depth: 1,
  });

  // BFS placement so every deeper tier inherits its parent's placed position & outward vector
  const queue: CosmosNode[] = [];

  galaxies.forEach((galaxy, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / galaxies.length;
    const gx = Math.cos(angle) * galaxyOrbitR;
    const gy = Math.sin(angle) * galaxyOrbitR;
    const descCount = descendantCounts.get(galaxy.id) ?? 0;

    const galaxyItem: CosmosNode = {
      node: galaxy,
      x: gx,
      y: gy,
      radius: resolveNodeRadius(galaxy, descCount),
      color: resolveNodeColor(galaxy),
      descendantCount: descCount,
      parentId: rootNode.id,
    };

    items.push(galaxyItem);
    placedById.set(galaxy.id, galaxyItem);
    edges.push({
      id: `${rootNode.id}->${galaxy.id}`,
      fromX: 0,
      fromY: 0,
      toX: gx,
      toY: gy,
      color: galaxyItem.color,
      depth: galaxy.depth,
    });
    queue.push(galaxyItem);
  });

  while (queue.length > 0) {
    const parentItem = queue.shift();
    if (!parentItem) continue;

    const children = childrenByParent.get(parentItem.node.id) ?? [];
    if (children.length === 0) continue;

    const isGalaxyParent = parentItem.node.depth === 1;
    const localR = isGalaxyParent
      ? clamp(72 + Math.max(0, children.length - 2) * 4.5, 72, 90)
      : clamp(36 + Math.max(0, children.length - 3) * 2.5, 36, 46);

    if (isGalaxyParent) {
      rings.push({
        cx: parentItem.x,
        cy: parentItem.y,
        r: localR,
        depth: 2,
      });
    }

    const grandparent = parentItem.parentId
      ? placedById.get(parentItem.parentId)
      : undefined;
    const outAngle = grandparent
      ? Math.atan2(parentItem.y - grandparent.y, parentItem.x - grandparent.x)
      : Math.atan2(parentItem.y, parentItem.x);

    const angles = isGalaxyParent
      ? computeFanAngles(outAngle, children.length, Math.PI * 1.25, 0.56)
      : computeFanAngles(outAngle, children.length, Math.PI * 1.65, 0.62);

    children.forEach((child, idx) => {
      if (placedById.has(child.id)) return;
      const angle = angles[idx] ?? outAngle;
      const cx = parentItem.x + Math.cos(angle) * localR;
      const cy = parentItem.y + Math.sin(angle) * localR;
      const descCount = descendantCounts.get(child.id) ?? 0;

      const childItem: CosmosNode = {
        node: child,
        x: cx,
        y: cy,
        radius: resolveNodeRadius(child, descCount),
        color: resolveNodeColor(child),
        descendantCount: descCount,
        parentId: parentItem.node.id,
      };

      items.push(childItem);
      placedById.set(child.id, childItem);
      edges.push({
        id: `${parentItem.node.id}->${child.id}`,
        fromX: parentItem.x,
        fromY: parentItem.y,
        toX: cx,
        toY: cy,
        color: childItem.color,
        depth: child.depth,
      });
      queue.push(childItem);
    });
  }

  let maxRadius = 220;
  for (const item of items) {
    const dist = Math.hypot(item.x, item.y) + item.radius;
    if (dist > maxRadius) {
      maxRadius = dist;
    }
  }

  return {
    items,
    edges,
    rings,
    bounds: { maxRadius },
  };
}

export function findNodeAtWorldPoint(
  items: CosmosNode[],
  worldX: number,
  worldY: number,
  scale: number
): CosmosNode | null {
  const safeScale = Math.max(scale, 0.25);
  let closestItem: CosmosNode | null = null;
  let closestDist = Number.POSITIVE_INFINITY;

  for (const item of items) {
    const hitRadius = Math.max(item.radius + 14 / safeScale, 22 / safeScale);
    const dist = Math.hypot(worldX - item.x, worldY - item.y);

    if (dist <= hitRadius && dist < closestDist) {
      closestDist = dist;
      closestItem = item;
    }
  }

  return closestItem;
}
