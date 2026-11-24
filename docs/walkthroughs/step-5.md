# Walkthrough — Step 5: Database Repository Engine & On-Device Self-Test Suite

> **Branch:** `feat/step-5-repository-layer`  
> **Base:** `dev` (at `dc36859` — Step 4 merged)  
> **Status:** Completed & Verified  

---

## 1. Overview & Objectives

Step 5 delivers the complete data-access engine for Second Brain in `src/db/repository.ts`, strictly adhering to all architectural and technical guardrails:
1. **Raw SQLite Recursive CTEs:** Used `expoDb.getAllSync<RawRow>()` for all `WITH RECURSIVE` queries (`getAncestors`, `getDescendantCount`, `moveNode` circular check, and `searchNodes`), completely avoiding non-returning `db.run()` SELECT pitfalls.
2. **Standard Column Aliasing:** In all raw SQLite queries, aliased snake_case columns (`parent_id AS parentId`, `node_type AS nodeType`, `created_at AS createdAt`, `updated_at AS updatedAt`) for direct 1:1 mapping to Drizzle's `Node` shape.
3. **Safe Parsing & Input Validation:** Built resilient `parseNode()` with `try/catch` wrapping and safe array/object fallbacks. Enforced non-empty titles and folder parentage.
4. **Circular Move Prevention & Depth Cascade:** Before any move operation, queries the full descendant set using a recursive CTE. If the target is in the subtree, throws an error before writes. Reassigns parent and cascades depth shifts to all descendants atomically inside `expoDb.withTransactionSync`.
5. **Idempotent Seeding & Depth-Sorted Backup:** Implemented idempotent `seedStarterTemplates()` and JSON `importDatabase()` sorting nodes by `depth ASC` to guarantee foreign keys succeed under `PRAGMA foreign_keys = ON;`.
6. **On-Device `__DEV__` Self-Test Suite:** Built `src/db/selfTest.ts` with 8 automated integration checks running in a temporary isolated folder and added an interactive diagnostic trigger in `SettingsScreen.tsx`.

---

## 2. File Changes

### Files Created
- `src/db/repository.ts` — Complete repository implementation (12 public functions + internal helpers).
- `src/db/selfTest.ts` — 8 on-device automated repository verification checks.
- `docs/walkthroughs/step-5.md` — This walkthrough report.

### Files Modified
- `src/screens/settings/SettingsScreen.tsx` — Added `__DEV__`-only "Run DB Self-Test" diagnostic button and results card using `@expo/vector-icons` (`Ionicons`).
- `package.json` & `package-lock.json` — Added `@expo/vector-icons: ^15.0.3`.
- `PROJECT_STATE.md` — Updated roadmap progress, file tree, dependencies, and architectural decisions.

---

## 3. Implemented Repository API (`src/db/repository.ts`)

| Function | Purpose & Mechanism |
|:---|:---|
| `parseNode(raw)` | Safe parsing of JSON `tags` (string[]) and `metadata` (object) with fallbacks |
| `ensureRootNode()` | Singleton "Me" folder bootstrap (`depth: 0`, `Crypto.randomUUID()`) |
| `getNode(id)` | Fetches single node by ID |
| `getChildren(parentId)` | Direct children ordered with folders first, then title alphabetical |
| `createNode(input)` | Validates title, verifies parent is a folder, computes `parent.depth + 1` |
| `updateNode(id, patch)` | Partial update, timestamps `updatedAt`, prevents changing root type |
| `deleteNode(id)` | Cascade deletes node and descendants; blocks deleting root node |
| `getAncestors(nodeId)` | Recursive CTE walking up `parent_id` chain to root (`depth ASC`) |
| `getDescendantCount(nodeId)` | Recursive CTE counting total descendant nodes (excluding self) |
| `moveNode(nodeId, newParentId)` | Blocks circular nesting via CTE subtree check; cascades depth atomically |
| `searchNodes(query)` | Full-text `LIKE` across title, notes, status, tags; attaches breadcrumbs |
| `seedStarterTemplates(rootId)` | Idempotent insertion of starter Galaxies and Solar Systems |
| `getDatabaseStats()` | Single-pass live counts across cosmic tiers and node types |
| `exportDatabase()` | Queries all raw nodes sorted by `depth ASC` for backup payload |
| `importDatabase(data)` | Validates backup and inserts rows in `depth ASC` order inside a transaction |

---

## 4. On-Device Self-Test Suite (`src/db/selfTest.ts`)

The self-test runs 8 isolated integration checks under a temporary folder (`__selftest_root__`) and cleans it up in a `finally` block:
1. **Root Node Bootstrap:** Verifies `ensureRootNode()` returns a depth 0 `"Me"` folder.
2. **Hierarchy Depth Computation:** Creates `Folder -> Subfolder -> Entry` and checks calculated depths `1, 2, 3`.
3. **Recursive Ancestor Chain:** Verifies `getAncestors()` produces `Me > __selftest_root__ > Subfolder A`.
4. **Recursive Descendant Count:** Verifies `getDescendantCount()` calculates subtree mass accurately.
5. **Safe Move & Depth Cascade:** Verifies circular move into own descendant throws error, while valid move updates depths for self and children.
6. **Global Search with Breadcrumbs:** Verifies `searchNodes()` matches entries by title/tag and attaches ancestor breadcrumbs.
7. **Root Protection & Cascade Delete:** Verifies deleting root is blocked, and deleting parent cascade-deletes all children.
8. **Database Export Schema:** Verifies `exportDatabase()` returns `version: 1` with valid node records.

---

## 5. Git Commits in Step 5

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `8191f31` | `feat(db): implement repository core helpers, root bootstrap, and basic CRUD` | CRUD operations, parseNode, ensureRootNode |
| `bac3af6` | `feat(db): add recursive ancestors, descendant count, safe moveNode, and searchNodes` | Recursive CTE queries, move protection, search |
| `1e0f935` | `feat(db): add idempotent starter seeding, stats, and depth-sorted JSON export/import` | Starter seeding, single-pass stats, export/import |
| `466b270` | `test(db): add on-device __DEV__ repository self-test suite and trigger in Settings` | Self-test harness, SettingsScreen diagnostic UI, `@expo/vector-icons` |
| *(pending)* | `docs: update PROJECT_STATE.md and add step-5 walkthrough` | State tracking and walkthrough report |

---

## 6. Manual Testing & Verification

1. **TypeScript Type-Check:**
   ```bash
   npx tsc --noEmit
   ```
   *Result:* Passed with **0 errors**.

2. **On-Device Expo Go Verification:**
   ```bash
   npx expo start
   ```
   - Open app in Expo Go.
   - Navigate to **Settings** tab.
   - Scroll to **ENGINE DIAGNOSTICS** card.
   - Tap **"Run DB Self-Test"**.
   - Verify all 8 checks execute and display green checkmarks with `"All 8 Checks Passed"`.
