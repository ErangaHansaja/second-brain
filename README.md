# Second Brain

A local-first personal knowledge and life organizer built with **Expo (React Native)** and **SQLite + Drizzle ORM**. Organize categories, nested folders, notes, ratings, and structured facts inside a deep-space **Obsidian** interface that works 100% offline.

## Phase 1 Features

- **Cosmic Hierarchy Explorer**
  - Root **Me** (`Core`, depth 0) locked to top-level categories (`Galaxy`, depth 1), followed by arbitrary nesting (`Solar System`, `Planet`, `Moon`, and deeper).
  - Switch cleanly between List and 2-column Grid views with automatic ancestor breadcrumbs and Android hardware back navigation.
  - Long-press actions for **Rename**, **Move** (with recursive CTE cycle prevention), and **Cascade Delete** (`PRAGMA foreign_keys = ON`).
  - Depth-aware creation FAB (`New Category` at root, `Folder` default at depth 1, `Entry` default at depth 2+ with direct redirect into edit mode).
- **Entry & Folder Inspector (`NodeDetailScreen`)**
  - View and Edit modes separated by dirty-state navigation guards (header back, breadcrumb taps, and Android hardware back button prompt to discard unsaved edits).
  - Entry fields: `StatusChip` (`Planned`, `In Progress`, `Completed`, `Dropped`), 1–10 `RatingStars`, monospace `#tags`, flexible key-value `MetadataEditor`, and multiline notes.
  - Folder fields kept minimal: title, description, and nested descendant summary.
- **Global Search**
  - Debounced full-text SQLite query across titles, notes, tags, metadata JSON, and statuses, with full breadcrumb paths on every match.
  - Filter pills for `All`, `Entries`, `Folders`, and each status (tapping a status loads matching entries immediately without needing search text).
- **Settings, Seeding & JSON Backups**
  - Live database totals by cosmic tier and one-tap starter template seeding (`Food`, `Entertainment`, `Work`, `Study`, `Hobbies`) when empty.
  - Timestamped JSON export (`second-brain-backup-YYYY-MM-DD.json`) via OS share sheet and validated backup import with destructive restore confirmation and automatic Explorer root recovery.
- **Tactile Haptics & Dark Boot**
  - Safe `expo-haptics` feedback utility (`Platform.OS !== 'web'` + `try/catch`) wired across creation, rating taps, filter toggles, view switches, saves, and destructive confirmations.
  - Consistent `#04050A` Obsidian background from native splash and root container through tab and stack transitions.

---

## Tech Stack

- **Framework:** Expo SDK `~58.0.26`, React `19.3.0`, React Native `0.88.1`, Expo Router `~58.0.32`
- **Database:** `expo-sqlite` (`~58.0.18`) + `drizzle-orm` (`^0.45.4`) + `drizzle-kit` (`^0.31.11`)
- **Platform Modules:** `expo-crypto`, `expo-file-system`, `expo-document-picker`, `expo-sharing`, `expo-haptics`, `expo-status-bar`, `react-native-safe-area-context`, `@expo/vector-icons`
- **Language:** TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)

---

## Folder Structure

```text
second-brain/
├── app.json                       # Dark UI config, splash/root #04050A, typed routes
├── drizzle/                       # Generated SQLite schema migrations
├── docs/walkthroughs/             # Per-step verification notes (step-2 .. step-12)
└── src/
    ├── app/                       # Thin Expo Router route wrappers (tabs, node/[nodeId])
    ├── components/                # Reusable UI atoms (common, detail, explorer, layout, providers, search)
    ├── constants/                 # Status presets & starter folder templates
    ├── db/                        # SQLite client, schema, and repository (CRUD + recursive CTEs)
    ├── hooks/                     # Race-safe data hooks (useRootNode, useNode, useChildren, useSearch, ...)
    ├── screens/                   # Feature screen implementations (Explorer, Detail, Search, Settings)
    ├── theme/                     # Obsidian palette, typography, spacing, and cosmic tier helpers
    ├── types/                     # Domain models, parsed node shapes, and backup contracts
    └── utils/                     # SDK 58 JSON backup engine & safe haptics helpers
```

---

## Local Development Commands

```bash
# Install dependencies
npm install

# Start Expo dev server (scan QR code in Expo Go or launch emulator)
npx expo start

# Typecheck the codebase (must pass with 0 errors)
npx tsc --noEmit

# Regenerate Drizzle SQLite migrations after changing src/db/schema.ts
npm run db:generate
```

> **Note:** Phase 1 is 100% compatible with Expo Go and requires no local Xcode or Android Studio native build.

---

## Backup Format (`version: 1`)

Exported JSON files match the `ExportedDatabase` contract defined in `src/types/index.ts`:

```json
{
  "version": 1,
  "exportedAt": "2026-11-25T12:00:00.000Z",
  "nodes": [
    {
      "id": "<uuid>",
      "parentId": null,
      "title": "Me",
      "nodeType": "folder",
      "depth": 0,
      "icon": "planet-outline",
      "color": "#F5A623",
      "status": null,
      "rating": null,
      "tags": "[]",
      "metadata": "{}",
      "notes": null,
      "description": null,
      "createdAt": "2026-11-25T12:00:00.000Z",
      "updatedAt": "2026-11-25T12:00:00.000Z"
    }
  ]
}
```

Import validation enforces:
- `version === 1` and a non-empty `nodes` array.
- Exactly one root node (`nodeType === 'folder'`, `depth === 0`, `parentId === null`) and all non-root nodes having `depth > 0` with non-null `parentId`.
- Atomic transaction replacement sorted by `depth ASC` so SQLite foreign keys (`ON DELETE CASCADE`) remain valid throughout restore.
