// ── Re-export inferred DB types ───────────────────────────────────
import type { Node } from '../db/schema';
export type { Node, NewNode } from '../db/schema';

// ── Enum helpers ─────────────────────────────────────────────────
export type NodeType = 'folder' | 'entry';

export type NodeStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'dropped'
  | (string & {});

// ── Cosmic tier mapping (used by TierBadge, tokens & Phase 2 renderer)
export type CosmicTier =
  | 'Core'
  | 'Galaxy'
  | 'Solar System'
  | 'Planet'
  | 'Moon';

// ── Parsed runtime shapes (tags & metadata deserialized to JS) ───
export interface ParsedNode extends Omit<Node, 'tags' | 'metadata'> {
  tags: string[];
  metadata: Record<string, unknown>;
}

// ── Breadcrumb ancestor entry ─────────────────────────────────────
export interface BreadcrumbItem {
  id: string;
  title: string;
  depth: number;
}

// ── Search result includes its full ancestor path ─────────────────
export interface SearchResult extends ParsedNode {
  breadcrumb: BreadcrumbItem[];
}

// ── JSON export / import shape ────────────────────────────────────
export interface ExportedDatabase {
  version: 1;
  exportedAt: string; // ISO 8601
  nodes: Node[]; // raw DB rows (tags/metadata as JSON strings)
}

// ── Stats for Settings screen ─────────────────────────────────────
export interface DatabaseStats {
  total: number;
  galaxies: number;
  solarSystems: number;
  planets: number;
  moons: number;
  entries: number;
}

// ── Repository Input Contracts ────────────────────────────────────
export interface CreateNodeInput {
  id?: string;
  parentId: string;
  title: string;
  nodeType: NodeType;
  icon?: string;
  color?: string;
  description?: string;
}

export interface SearchFilters {
  nodeType?: NodeType;
  status?: string;
}

export type UpdateNodePatch = Partial<
  Omit<ParsedNode, 'id' | 'createdAt' | 'updatedAt' | 'parentId' | 'depth'>
>;
