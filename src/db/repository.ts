import * as Crypto from 'expo-crypto';
import { eq, isNull, desc, sql } from 'drizzle-orm';
import { db, expoDb } from './client';
import { nodes, type Node, type NewNode } from './schema';
import { Colors } from '../theme/tokens';
import type {
  CreateNodeInput,
  ParsedNode,
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
