import * as Crypto from 'expo-crypto';
import { asc, eq, isNull, desc, sql } from 'drizzle-orm';
import { db, expoDb } from './client';
import { nodes, type Node, type NewNode } from './schema';
import { Colors } from '../theme/tokens';
import { STARTER_TEMPLATES } from '../constants/starterTemplates';
import type {
  BreadcrumbItem,
  CreateNodeInput,
  DatabaseStats,
  ExportedDatabase,
  ParsedNode,
  SearchFilters,
  SearchResult,
  UpdateNodePatch,
} from '../types';

// ── Raw Row Type with Aliased Column Names ─────────────────────────
export interface RawNodeRow {
  id: string;
  parentId: string | null;
  title: string;
  nodeType: 'folder' | 'entry';
  depth: number;
  icon: string | null;
  color: string | null;
  status: string | null;
  rating: number | null;
  tags: string | null;
  metadata: string | null;
  notes: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Standard Aliased Column Selection for Raw SQLite Queries ───────
const ALIASED_COLUMNS = `
  id,
  parent_id AS parentId,
  title,
  node_type AS nodeType,
  depth,
  icon,
  color,
  status,
  rating,
  tags,
  metadata,
  notes,
  description,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

// ── Internal Helpers ───────────────────────────────────────────────
export function parseNode(raw: Node | RawNodeRow): ParsedNode {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(raw.tags ?? '[]');
    if (Array.isArray(parsed)) {
      tags = parsed.filter((t): t is string => typeof t === 'string');
    }
  } catch {
    tags = [];
  }

  let metadata: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(raw.metadata ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      metadata = parsed as Record<string, unknown>;
    }
  } catch {
    metadata = {};
  }

  return {
    id: raw.id,
    parentId: raw.parentId,
    title: raw.title,
    nodeType: raw.nodeType as 'folder' | 'entry',
    depth: raw.depth,
    icon: raw.icon,
    color: raw.color,
    status: raw.status,
    rating: raw.rating,
    tags,
    metadata,
    notes: raw.notes,
    description: raw.description,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── Root Node Bootstrap ────────────────────────────────────────────
/**
 * Ensures the singleton root "Me" node exists.
 * If not found, creates it with depth = 0 and returns it.
 */
export async function ensureRootNode(): Promise<ParsedNode> {
  const existing = await db
    .select()
    .from(nodes)
    .where(isNull(nodes.parentId))
    .limit(1);

  if (existing[0]) {
    return parseNode(existing[0]);
  }

  const now = new Date().toISOString();
  const rootId = Crypto.randomUUID();
  const newRoot: NewNode = {
    id: rootId,
    parentId: null,
    title: 'Me',
    nodeType: 'folder',
    depth: 0,
    icon: 'planet-outline',
    color: Colors.tier.core,
    tags: '[]',
    metadata: '{}',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(nodes).values(newRoot);
  const created = await getNode(rootId);
  if (!created) {
    throw new Error('Failed to create root node');
  }
  return created;
}

// ── Basic CRUD Operations ──────────────────────────────────────────
/**
 * Retrieves a single node by its unique ID. Returns null if not found.
 */
export async function getNode(id: string): Promise<ParsedNode | null> {
  const rows = await db
    .select()
    .from(nodes)
    .where(eq(nodes.id, id))
    .limit(1);

  if (!rows[0]) {
    return null;
  }
  return parseNode(rows[0]);
}

/**
 * Retrieves direct children of a given parent node.
 * Folders appear first, followed by entries, sorted by title alphabetically.
 */
export async function getChildren(parentId: string): Promise<ParsedNode[]> {
  const rows = await db
    .select()
    .from(nodes)
    .where(eq(nodes.parentId, parentId))
    .orderBy(
      desc(nodes.nodeType),
      sql`${nodes.title} COLLATE NOCASE ASC`
    );

  return rows.map(parseNode);
}

/**
 * Retrieves all nodes in the universe ordered by depth ASC, then title alphabetically.
 */
export async function getAllNodes(): Promise<ParsedNode[]> {
  const rows = await db
    .select()
    .from(nodes)
    .orderBy(asc(nodes.depth), sql`${nodes.title} COLLATE NOCASE ASC`);

  return rows.map(parseNode);
}

/**
 * Creates a new child node under a parent folder.
 * Computes depth automatically as parent.depth + 1.
 */
export async function createNode(input: CreateNodeInput): Promise<ParsedNode> {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Node title cannot be empty');
  }

  const parent = await getNode(input.parentId);
  if (!parent) {
    throw new Error(`Parent node not found: ${input.parentId}`);
  }
  if (parent.nodeType !== 'folder') {
    throw new Error('Cannot add children to an entry node; parent must be a folder');
  }
  if (input.nodeType === 'entry' && parent.depth === 0) {
    throw new Error('Entries must be placed inside a folder');
  }

  const id = input.id ?? Crypto.randomUUID();
  const depth = parent.depth + 1;
  const now = new Date().toISOString();

  const row: NewNode = {
    id,
    parentId: input.parentId,
    title,
    nodeType: input.nodeType,
    depth,
    icon: input.icon ?? (input.nodeType === 'folder' ? 'folder-outline' : 'document-text-outline'),
    color: input.color ?? (input.nodeType === 'folder' ? Colors.tier.galaxy : Colors.text.primary),
    description: input.description,
    tags: '[]',
    metadata: '{}',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(nodes).values(row);
  const created = await getNode(id);
  if (!created) {
    throw new Error(`Failed to retrieve newly created node: ${id}`);
  }
  return created;
}

/**
 * Partially updates an existing node.
 * Prevents changing root node away from folder.
 */
export async function updateNode(
  id: string,
  patch: UpdateNodePatch
): Promise<ParsedNode> {
  const existing = await getNode(id);
  if (!existing) {
    throw new Error(`Node not found for update: ${id}`);
  }

  if (existing.depth === 0 && patch.nodeType && patch.nodeType !== 'folder') {
    throw new Error('Cannot change root node type away from folder');
  }

  const now = new Date().toISOString();
  const updateValues: Partial<Node> = {
    updatedAt: now,
  };

  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    if (!trimmed) {
      throw new Error('Node title cannot be empty');
    }
    updateValues.title = trimmed;
  }
  if (patch.nodeType !== undefined) updateValues.nodeType = patch.nodeType;
  if (patch.icon !== undefined) updateValues.icon = patch.icon;
  if (patch.color !== undefined) updateValues.color = patch.color;
  if (patch.status !== undefined) updateValues.status = patch.status;
  if (patch.rating !== undefined) updateValues.rating = patch.rating;
  if (patch.notes !== undefined) updateValues.notes = patch.notes;
  if (patch.description !== undefined) updateValues.description = patch.description;

  if (patch.tags !== undefined) {
    updateValues.tags = JSON.stringify(patch.tags);
  }
  if (patch.metadata !== undefined) {
    updateValues.metadata = JSON.stringify(patch.metadata);
  }

  await db.update(nodes).set(updateValues).where(eq(nodes.id, id));

  const updated = await getNode(id);
  if (!updated) {
    throw new Error(`Failed to retrieve updated node: ${id}`);
  }
  return updated;
}

/**
 * Deletes a node. SQLite ON DELETE CASCADE deletes all descendant nodes.
 * Protects root node (depth === 0) from deletion.
 */
export async function deleteNode(id: string): Promise<void> {
  const existing = await getNode(id);
  if (!existing) {
    return;
  }

  if (existing.depth === 0) {
    throw new Error('Cannot delete root node');
  }

  await db.delete(nodes).where(eq(nodes.id, id));
}

// ── Recursive Tree Queries & Movement ──────────────────────────────
/**
 * Recursively fetches all ancestors from root down to the parent of `nodeId`.
 * Returns array of ParsedNode ordered by depth ASC.
 */
export async function getAncestors(nodeId: string): Promise<ParsedNode[]> {
  const sqlQuery = `
    WITH RECURSIVE ancestors AS (
      SELECT ${ALIASED_COLUMNS}
      FROM nodes
      WHERE id = (SELECT parent_id FROM nodes WHERE id = ?)

      UNION ALL

      SELECT
        n.id,
        n.parent_id AS parentId,
        n.title,
        n.node_type AS nodeType,
        n.depth,
        n.icon,
        n.color,
        n.status,
        n.rating,
        n.tags,
        n.metadata,
        n.notes,
        n.description,
        n.created_at AS createdAt,
        n.updated_at AS updatedAt
      FROM nodes n
      INNER JOIN ancestors a ON n.id = a.parentId
    )
    SELECT * FROM ancestors ORDER BY depth ASC;
  `;

  const rows = expoDb.getAllSync<RawNodeRow>(sqlQuery, [nodeId]);
  return rows.map(parseNode);
}

/**
 * Counts all descendant nodes recursively (excluding self).
 * Returns 0 if the node has no descendants.
 */
export async function getDescendantCount(nodeId: string): Promise<number> {
  const sqlQuery = `
    WITH RECURSIVE subtree AS (
      SELECT id FROM nodes WHERE parent_id = ?
      UNION ALL
      SELECT n.id FROM nodes n INNER JOIN subtree s ON n.parent_id = s.id
    )
    SELECT COUNT(*) AS count FROM subtree;
  `;

  const rows = expoDb.getAllSync<{ count: number }>(sqlQuery, [nodeId]);
  return rows[0]?.count ?? 0;
}

/**
 * Internal helper: returns all recursive descendant IDs of `nodeId` (excluding `nodeId` itself).
 */
function getDescendantIds(nodeId: string): string[] {
  const subtreeQuery = `
    WITH RECURSIVE subtree AS (
      SELECT id FROM nodes WHERE parent_id = ?
      UNION ALL
      SELECT n.id FROM nodes n INNER JOIN subtree s ON n.parent_id = s.id
    )
    SELECT id FROM subtree;
  `;
  const rows = expoDb.getAllSync<{ id: string }>(subtreeQuery, [nodeId]);
  return rows.map(r => r.id);
}

/**
 * Moves a node to a new parent folder.
 * Validates circular references (target cannot be self or descendant).
 * Updates node's parent and cascades depth changes to all descendants inside a transaction.
 */
export async function moveNode(
  nodeId: string,
  newParentId: string
): Promise<ParsedNode> {
  const node = await getNode(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  const newParent = await getNode(newParentId);
  if (!newParent) {
    throw new Error(`Target parent not found: ${newParentId}`);
  }

  if (node.depth === 0) {
    throw new Error('Cannot move root node');
  }
  if (nodeId === newParentId) {
    throw new Error('Cannot move a node into itself');
  }
  if (newParent.nodeType !== 'folder') {
    throw new Error('Target parent must be a folder');
  }
  if (node.nodeType === 'entry' && newParent.depth === 0) {
    throw new Error('Entries must be placed inside a folder');
  }

  // Fetch all descendant IDs using recursive CTE to prevent circular move
  const descendantIdList = getDescendantIds(nodeId);
  const descendantIds = new Set(descendantIdList);

  if (descendantIds.has(newParentId)) {
    throw new Error('Circular move: target is a descendant');
  }

  const newDepth = newParent.depth + 1;
  const depthDelta = newDepth - node.depth;
  const now = new Date().toISOString();

  // Execute depth cascade and parent reassignment atomically
  expoDb.withTransactionSync(() => {
    expoDb.runSync(
      `UPDATE nodes SET parent_id = ?, depth = ?, updated_at = ? WHERE id = ?;`,
      [newParentId, newDepth, now, nodeId]
    );

    if (descendantIdList.length > 0) {
      const placeholders = descendantIdList.map(() => '?').join(',');
      expoDb.runSync(
        `UPDATE nodes SET depth = depth + ?, updated_at = ? WHERE id IN (${placeholders});`,
        [depthDelta, now, ...descendantIdList]
      );
    }
  });

  const updated = await getNode(nodeId);
  if (!updated) {
    throw new Error(`Failed to retrieve moved node: ${nodeId}`);
  }
  return updated;
}

/**
 * Fetches all folder nodes eligible as move destinations for `nodeId`.
 * Excludes `nodeId` itself and all recursive descendants to prevent circular moves.
 */
export async function getMoveTargets(
  nodeId: string
): Promise<{ id: string; title: string; depth: number; pathLabel: string }[]> {
  interface FolderRow {
    id: string;
    parentId: string | null;
    title: string;
    depth: number;
  }

  const targetNode = await getNode(nodeId);
  const excludeRoot = targetNode?.nodeType === 'entry';

  const allFolders = expoDb.getAllSync<FolderRow>(
    `SELECT id, parent_id AS parentId, title, depth
     FROM nodes
     WHERE node_type = 'folder'
     ORDER BY depth ASC, title COLLATE NOCASE ASC;`
  );

  const folderMap = new Map<string, FolderRow>();
  for (const folder of allFolders) {
    folderMap.set(folder.id, folder);
  }

  const excludedIds = new Set<string>([nodeId, ...getDescendantIds(nodeId)]);

  const buildPathLabel = (folder: FolderRow): string => {
    if (folder.depth === 0 || !folder.parentId) {
      return 'Root';
    }
    const parts: string[] = [];
    const seen = new Set<string>();
    let curr: FolderRow | undefined = folder;
    while (curr && !seen.has(curr.id)) {
      seen.add(curr.id);
      parts.unshift(curr.title);
      curr = curr.parentId ? folderMap.get(curr.parentId) : undefined;
    }
    return parts.join(' / ');
  };

  return allFolders
    .filter(folder => {
      if (excludedIds.has(folder.id)) return false;
      if (excludeRoot && folder.depth === 0) return false;
      return true;
    })
    .map(folder => ({
      id: folder.id,
      title: folder.title,
      depth: folder.depth,
      pathLabel: buildPathLabel(folder),
    }));
}

/**
 * Searches nodes across title, notes, status, tags, and metadata using LIKE,
 * or lists matching entries when a status filter is active without a query.
 * Returns up to 50 results ordered by updated_at DESC with ancestor breadcrumbs.
 */
export async function searchNodes(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const statusFilter = filters?.status?.trim() || undefined;
  const nodeTypeFilter = filters?.nodeType;

  if (!hasQuery && !statusFilter) {
    return [];
  }

  const conditions: string[] = ['depth > 0'];
  const params: (string | number)[] = [];

  if (hasQuery) {
    const pattern = `%${trimmed}%`;
    conditions.push(
      '(title LIKE ? OR notes LIKE ? OR status LIKE ? OR tags LIKE ? OR metadata LIKE ?)'
    );
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  if (statusFilter) {
    conditions.push('status = ?');
    params.push(statusFilter);
    if (!nodeTypeFilter) {
      conditions.push("node_type = 'entry'");
    }
  }

  if (nodeTypeFilter) {
    conditions.push('node_type = ?');
    params.push(nodeTypeFilter);
  }

  const sqlQuery = `
    SELECT ${ALIASED_COLUMNS}
    FROM nodes
    WHERE ${conditions.join(' AND ')}
    ORDER BY updated_at DESC
    LIMIT 50;
  `;

  const rows = expoDb.getAllSync<RawNodeRow>(sqlQuery, params);

  const results: SearchResult[] = [];
  for (const row of rows) {
    const parsed = parseNode(row);
    const ancestors = await getAncestors(row.id);
    const breadcrumb: BreadcrumbItem[] = ancestors.map(a => ({
      id: a.id,
      title: a.title,
      depth: a.depth,
    }));
    results.push({
      ...parsed,
      breadcrumb,
    });
  }

  return results;
}

// ── Starter Seeding, Stats & Backup Export/Import ──────────────────
/**
 * Idempotently seeds starter category galaxies and solar systems under the root node.
 * If depth === 1 nodes already exist, returns immediately without modifying data.
 */
export async function seedStarterTemplates(rootId: string): Promise<void> {
  const root = await getNode(rootId);
  if (!root || root.depth !== 0) {
    throw new Error('A valid root node (depth === 0) must be provided for seeding');
  }

  const existingGalaxies = expoDb.getAllSync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM nodes WHERE depth = 1;'
  );
  if ((existingGalaxies[0]?.count ?? 0) > 0) {
    return;
  }

  const now = new Date().toISOString();
  expoDb.withTransactionSync(() => {
    for (const galaxy of STARTER_TEMPLATES) {
      const galaxyId = Crypto.randomUUID();
      expoDb.runSync(
        `INSERT INTO nodes (
          id, parent_id, title, node_type, depth, icon, color, description, tags, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, 'folder', 1, ?, ?, ?, '[]', '{}', ?, ?);`,
        [
          galaxyId,
          rootId,
          galaxy.title,
          galaxy.icon,
          galaxy.color,
          galaxy.description ?? null,
          now,
          now,
        ]
      );

      if (galaxy.children && galaxy.children.length > 0) {
        for (const child of galaxy.children) {
          const childId = Crypto.randomUUID();
          expoDb.runSync(
            `INSERT INTO nodes (
              id, parent_id, title, node_type, depth, icon, color, description, tags, metadata, created_at, updated_at
            ) VALUES (?, ?, ?, 'folder', 2, ?, ?, ?, '[]', '{}', ?, ?);`,
            [
              childId,
              galaxyId,
              child.title,
              child.icon,
              child.color,
              child.description ?? null,
              now,
              now,
            ]
          );
        }
      }
    }
  });
}

/**
 * Computes live database statistics across cosmic tiers and node types.
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const statsQuery = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN depth = 1 THEN 1 ELSE 0 END) AS galaxies,
      SUM(CASE WHEN depth = 2 THEN 1 ELSE 0 END) AS solarSystems,
      SUM(CASE WHEN depth = 3 THEN 1 ELSE 0 END) AS planets,
      SUM(CASE WHEN depth >= 4 THEN 1 ELSE 0 END) AS moons,
      SUM(CASE WHEN node_type = 'entry' THEN 1 ELSE 0 END) AS entries
    FROM nodes;
  `;

  interface StatsRow {
    total: number;
    galaxies: number | null;
    solarSystems: number | null;
    planets: number | null;
    moons: number | null;
    entries: number | null;
  }

  const rows = expoDb.getAllSync<StatsRow>(statsQuery);
  const row = rows[0];

  return {
    total: row?.total ?? 0,
    galaxies: row?.galaxies ?? 0,
    solarSystems: row?.solarSystems ?? 0,
    planets: row?.planets ?? 0,
    moons: row?.moons ?? 0,
    entries: row?.entries ?? 0,
  };
}

/**
 * Exports all database nodes as a typed JSON object sorted by depth ASC.
 */
export async function exportDatabase(): Promise<ExportedDatabase> {
  const sqlQuery = `
    SELECT ${ALIASED_COLUMNS}
    FROM nodes
    ORDER BY depth ASC, created_at ASC;
  `;

  const rows = expoDb.getAllSync<RawNodeRow>(sqlQuery);
  const rawNodes: Node[] = rows.map(r => ({
    id: r.id,
    parentId: r.parentId,
    title: r.title,
    nodeType: r.nodeType,
    depth: r.depth,
    icon: r.icon,
    color: r.color,
    status: r.status,
    rating: r.rating,
    tags: r.tags,
    metadata: r.metadata,
    notes: r.notes,
    description: r.description,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    nodes: rawNodes,
  };
}

/**
 * Replaces the entire database with imported JSON data.
 * Validates version and sorts nodes by depth ASC so parents insert before children.
 * Runs atomically inside a transaction.
 */
export async function importDatabase(data: ExportedDatabase): Promise<void> {
  if (!data || data.version !== 1 || !Array.isArray(data.nodes)) {
    throw new Error('Invalid database backup format or unsupported version');
  }

  // Ensure there is at least a root node (depth 0, parentId null)
  const hasRoot = data.nodes.some(
    n => n.depth === 0 && (n.parentId === null || n.parentId === undefined)
  );
  if (!hasRoot) {
    throw new Error('Corrupt backup: missing root "Me" node (depth === 0)');
  }

  // Sort by depth ASC so parents insert before children
  const sortedNodes = [...data.nodes].sort((a, b) => a.depth - b.depth);

  expoDb.withTransactionSync(() => {
    // Drop all existing nodes (cascades automatically)
    expoDb.runSync('DELETE FROM nodes;');

    const insertSql = `
      INSERT INTO nodes (
        id, parent_id, title, node_type, depth, icon, color, status, rating, tags, metadata, notes, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (const node of sortedNodes) {
      expoDb.runSync(insertSql, [
        node.id,
        node.parentId ?? null,
        node.title,
        node.nodeType,
        node.depth,
        node.icon ?? null,
        node.color ?? null,
        node.status ?? null,
        node.rating ?? null,
        node.tags ?? '[]',
        node.metadata ?? '{}',
        node.notes ?? null,
        node.description ?? null,
        node.createdAt,
        node.updatedAt,
      ]);
    }
  });
}
