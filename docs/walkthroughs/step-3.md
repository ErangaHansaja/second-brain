# Walkthrough — Step 3: Database Schema, SQLite Client, Migration 0000 & DatabaseProvider

> **Branch:** `feat/step-3-database-schema`  
> **Base:** `dev` (at `ddaae58` — Step 2 merged)  
> **Status:** Completed & Verified  

---

## 1. Overview & Objectives

Step 3 establishes the persistent SQLite database engine powering Second Brain:
1. **Drizzle Schema:** Defined the self-referencing `nodes` table in `src/db/schema.ts` with typed foreign key cascade delete (`ON DELETE CASCADE`), UUID primary key, cosmic hierarchy `depth`, and inferred `Node`/`NewNode` types.
2. **SQLite Client & Guaranteed Foreign Keys:** Created `src/db/client.ts` using `expo-sqlite`, ensuring `PRAGMA foreign_keys = ON;` executes synchronously immediately upon connection before any query or migration.
3. **Migration 0000 Generation:** Generated the baseline SQL migration (`drizzle/0000_ambitious_falcon.sql`), migration bundle, and created `src/db/migrations.ts` and `src/types/declarations.d.ts`.
4. **DatabaseProvider Component:** Created `src/components/providers/DatabaseProvider.tsx` using `useMigrations` from `drizzle-orm/expo-sqlite/migrator`, featuring an obsidian loading spinner (`#F5A623` on `#04050A`), non-swallowed error screens, and dev-mode migration logging.
5. **Root Layout Wiring:** Wrapped the root navigation `<Stack>` in `src/app/_layout.tsx` inside `<DatabaseProvider>`.

---

## 2. File Changes

### Files Created
- `src/db/schema.ts` — Drizzle ORM definition of the `nodes` table and TypeScript types.
- `src/db/client.ts` — `expo-sqlite` instance with `PRAGMA foreign_keys = ON;` and Drizzle client.
- `src/db/migrations.ts` — Re-exports generated Drizzle migrations bundle.
- `src/types/declarations.d.ts` — Ambient module declarations for `.sql` imports and Drizzle migrations object.
- `src/components/providers/DatabaseProvider.tsx` — Migration lifecycle component with loading and error boundaries.
- `drizzle/0000_ambitious_falcon.sql` — Auto-generated initial SQL schema migration.
- `drizzle/migrations.js` — Auto-generated Expo SQLite migration loader.
- `drizzle/meta/0000_snapshot.json` — Drizzle migration snapshot.
- `drizzle/meta/_journal.json` — Drizzle migration journal.
- `docs/walkthroughs/step-3.md` — This walkthrough report.

### Files Modified
- `src/app/_layout.tsx` — Wrapped `<Stack>` in `<DatabaseProvider>`.
- `PROJECT_STATE.md` — Updated roadmap status, file tree, and architectural decisions.

---

## 3. Generated SQL Migration Preview (`drizzle/0000_ambitious_falcon.sql`)

```sql
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`title` text NOT NULL,
	`node_type` text DEFAULT 'folder' NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	`icon` text,
	`color` text,
	`status` text,
	`rating` real,
	`tags` text DEFAULT '[]',
	`metadata` text DEFAULT '{}',
	`notes` text,
	`description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
```

---

## 4. Key Implementation Highlights

### Guaranteed Foreign Key Enforcement (`src/db/client.ts`)
```typescript
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const expoDb = SQLite.openDatabaseSync('second_brain.db');

// Enforce foreign keys (cascade deletes) on every SQLite connection session
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
```

### Self-Referencing Foreign Key Typing (`src/db/schema.ts`)
```typescript
import { AnySQLiteColumn, sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const nodes = sqliteTable('nodes', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').references(
    (): AnySQLiteColumn => nodes.id,
    { onDelete: 'cascade' }
  ),
  // ...
});
```

---

## 5. Git Commits in Step 3

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `c1298bd` | `feat(db): define nodes Drizzle schema and SQLite client with foreign keys enabled` | Schema and client with PRAGMA foreign_keys |
| `8682156` | `feat(db): generate initial SQLite migration 0000 and migration export` | Generated SQL, snapshot, journal, typings |
| `1ae5006` | `feat(db): add DatabaseProvider using useMigrations and wire root layout` | DatabaseProvider component and root layout wiring |
| *(pending)* | `docs: update PROJECT_STATE.md and add step-3 walkthrough` | State tracking and walkthrough report |

---

## 6. Manual Testing & Verification

1. **TypeScript Type-Check:**
   ```bash
   npx tsc --noEmit
   ```
   *Result:* Passed with **0 errors**.

2. **Expo Go Verification:**
   ```bash
   npx expo start
   ```
   - Launch app on Android / iOS via Expo Go.
   - Observe brief amber `ActivityIndicator` loading state while migration 0000 executes.
   - Verify terminal logs output: `[DB] Migrations ready`.
   - Verify normal navigation across Explorer, Search, and Settings tabs after migration finishes.
   - Verify no red screen / migration errors.
