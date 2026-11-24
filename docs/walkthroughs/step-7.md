# Walkthrough — Step 7: Reactive SQLite Data Hooks with Race-Condition Guards

> **Branch:** `feat/step-7-custom-hooks`  
> **Base:** `dev` (at `6366201` — Step 6 merged)  
> **Status:** Completed & Verified  

---

## 1. Overview & Objectives

Step 7 implements the reactive React hooks layer in `src/hooks/`, connecting SQLite repository methods to React Native screen components. It establishes strict concurrency guardrails and stable memoization patterns across all 7 hooks:

1. **Race-Condition Safety:** Every async hook tracks a `cancelled` boolean inside its `useEffect` cleanup function. Stale promises from unmounted components or rapid navigation state changes are safely discarded without calling state setters.
2. **Out-of-Order Search Protection:** `useSearch` maintains a monotonically increasing request ID ref (`requestIdRef.current`). When rapid keystrokes fire multiple asynchronous queries, only the most recently issued search request is allowed to commit its results to state.
3. **Nullable ID Resilience:** All node-specific hooks (`useNode`, `useChildren`, `useAncestors`, `useDescendantCount`) accept `string | null`. If the passed ID is `null` (e.g. before the root node resolves on initial application mount), they immediately and synchronously reset to `null` / `[]` / `0` with `loading: false`.
4. **Stable `refresh` Callbacks:** Every hook exports a stable `refresh: () => void` function memoized via `useCallback` that advances an internal tick counter. These callbacks can be safely passed to `useFocusEffect`, `onCreated`, or mutation handlers without triggering render cascades.
5. **Dynamic Subtree Mass Counter:** `useDescendantCount` accepts an optional `refreshKey?: number` alongside `nodeId`, ensuring cards reactively recalculate mass whenever child nodes are added, deleted, or moved.

---

## 2. File Changes

### Files Created
- `src/hooks/useRootNode.ts` — Root `"Me"` node bootstrap and reactive state hook.
- `src/hooks/useNode.ts` — Single node lookup hook with nullable ID guard.
- `src/hooks/useChildren.ts` — Direct children retrieval hook with nullable ID guard.
- `src/hooks/useAncestors.ts` — Ancestor hierarchy hook mapping to `BreadcrumbItem[]`.
- `src/hooks/useDescendantCount.ts` — Recursive subtree mass counter with `refreshKey` support.
- `src/hooks/useSearch.ts` — Debounced full-text search hook with monotonic request ID guard.
- `src/hooks/useDatabaseStats.ts` — Live database tier counts and statistics hook.
- `src/hooks/index.ts` — Barrel file re-exporting all 7 hooks and their return types.
- `docs/walkthroughs/step-7.md` — This walkthrough report.

### Files Modified
- `PROJECT_STATE.md` — Updated roadmap progress, file tree, and hook architectural decisions.

---

## 3. Hook Specifications & Signatures

### 1. `useRootNode()`
- **Signature:** `useRootNode(): UseRootNodeResult`
- **Return Shape:**
  ```typescript
  {
    rootNode: ParsedNode | null;
    loading: boolean;
    error: Error | null;
    refresh: () => void;
  }
  ```
- **Behavior:** Calls `ensureRootNode()` on mount, bootstrapping the singleton `"Me"` core node (`depth: 0`).

### 2. `useNode(id: string | null)`
- **Signature:** `useNode(id: string | null): UseNodeResult`
- **Return Shape:**
  ```typescript
  {
    node: ParsedNode | null;
    loading: boolean;
    error: Error | null;
    refresh: () => void;
  }
  ```
- **Behavior:** Queries `getNode(id)`. When `id === null`, sets `node: null`, `loading: false`, `error: null`.

### 3. `useChildren(parentId: string | null)`
- **Signature:** `useChildren(parentId: string | null): UseChildrenResult`
- **Return Shape:**
  ```typescript
  {
    children: ParsedNode[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
  }
  ```
- **Behavior:** Queries `getChildren(parentId)` (ordered folders first, then alphabetical). When `parentId === null`, sets `children: []`, `loading: false`.

### 4. `useAncestors(nodeId: string | null)`
- **Signature:** `useAncestors(nodeId: string | null): UseAncestorsResult`
- **Return Shape:**
  ```typescript
  {
    ancestors: BreadcrumbItem[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
  }
  ```
- **Behavior:** Queries recursive CTE `getAncestors(nodeId)` and maps each ancestor row to `BreadcrumbItem` (`{ id, title, depth }`). When `nodeId === null`, sets `ancestors: []`, `loading: false`.

### 5. `useDescendantCount(nodeId: string | null, refreshKey?: number)`
- **Signature:** `useDescendantCount(nodeId: string | null, refreshKey?: number): UseDescendantCountResult`
- **Return Shape:**
  ```typescript
  {
    count: number;
    loading: boolean;
    refresh: () => void;
  }
  ```
- **Behavior:** Queries recursive CTE `getDescendantCount(nodeId)`. Triggers on `nodeId` change, `refreshKey` change, or manual `refresh()`. When `nodeId === null`, sets `count: 0`, `loading: false`.

### 6. `useSearch(debounceMs = 250)`
- **Signature:** `useSearch(debounceMs?: number): UseSearchResult`
- **Return Shape:**
  ```typescript
  {
    query: string;
    setQuery: (q: string) => void;
    clearQuery: () => void;
    results: SearchResult[];
    loading: boolean;
    error: Error | null;
  }
  ```
- **Behavior:** Debounces input by `debounceMs` (default 250ms). When `query.trim()` is empty, immediately clears `results: []` without querying SQLite. Discards out-of-order asynchronous responses using `requestIdRef`.

### 7. `useDatabaseStats()`
- **Signature:** `useDatabaseStats(): UseDatabaseStatsResult`
- **Return Shape:**
  ```typescript
  {
    stats: DatabaseStats | null;
    loading: boolean;
    error: Error | null;
    refresh: () => void;
  }
  ```
- **Behavior:** Queries `getDatabaseStats()` for live counts across Galaxies, Solar Systems, Planets, Moons, and Entries.

---

## 4. Git Commits in Step 7

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `2d678e7` | `feat(hooks): add useRootNode, useNode, useChildren, and useAncestors hooks` | Core node & hierarchy hooks |
| `8aea0f2` | `feat(hooks): add useDescendantCount, debounced useSearch, useDatabaseStats, and barrel export` | Counter, search, stats hooks & barrel |
| `(pending)` | `docs: update PROJECT_STATE.md and add step-7 walkthrough` | State tracking and walkthrough report |

---

## 5. Verification & Testing

1. **TypeScript Verification:**
   ```bash
   npx tsc --noEmit
   ```
   *Result:* Passed with **0 errors**.

2. **Integration Readiness:**
   - Hooks are ready for direct consumption by:
     - `ExplorerScreen.tsx` (Step 8): `useRootNode`, `useNode`, `useChildren`, `useAncestors`, `useDescendantCount`.
     - `[nodeId].tsx` (Step 9): `useNode`.
     - `SearchScreen.tsx` (Step 10): `useSearch`.
     - `SettingsScreen.tsx` (Step 11): `useDatabaseStats`.
