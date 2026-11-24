import { AnySQLiteColumn, sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const nodes = sqliteTable('nodes', {
  // ── Identity ──────────────────────────────────────────────────
  id: text('id').primaryKey(),
  parentId: text('parent_id').references(
    (): AnySQLiteColumn => nodes.id,
    { onDelete: 'cascade' }
  ),

  // ── Content ───────────────────────────────────────────────────
  title: text('title').notNull(),
  nodeType: text('node_type', {
    enum: ['folder', 'entry'],
  }).notNull().default('folder'),

  // ── Hierarchy ─────────────────────────────────────────────────
  depth: integer('depth').notNull().default(0),

  // ── Visual (Phase 1 stored, Phase 2 rendered) ─────────────────
  icon: text('icon'),
  color: text('color'),

  // ── Entry Detail Fields (Used on entry nodes) ─────────────────
  status: text('status'),
  rating: real('rating'),
  tags: text('tags').default('[]'),
  metadata: text('metadata').default('{}'),
  notes: text('notes'),

  // ── Description on folders ────────────────────────────────────
  description: text('description'),

  // ── Timestamps ────────────────────────────────────────────────
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

// ── Inferred types ──────────────────────────────────────────────
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
