# Walkthrough — Step 4: Shared TypeScript Contracts & Starter Constants

> **Branch:** `feat/step-4-types-and-constants`  
> **Base:** `dev` (at `3e52f1d` — Step 3 merged)  
> **Status:** Completed & Verified  

---

## 1. Overview & Objectives

In Step 4, we established the centralized TypeScript contracts and obsidian-themed domain constants for Second Brain:
1. **Core Type Definitions:** Created `src/types/index.ts` defining all parsed entity shapes (`ParsedNode`), hierarchy types (`BreadcrumbItem`, `CosmicTier`), search results with ancestor paths (`SearchResult`), database export/import payloads (`ExportedDatabase`), and statistics counters (`DatabaseStats`).
2. **Repository Input Contracts:** Formalized `CreateNodeInput` and `UpdateNodePatch` contracts to guarantee strict type alignment across the upcoming Repository layer (Step 5), data hooks (Step 7), and UI screens (Steps 8–11).
3. **Single Source of Truth for Cosmic Tier:** Refactored `src/theme/tokens.ts` to import `CosmicTier` directly from `src/types`.
4. **Obsidian-Themed Starter Templates:** Created `src/constants/starterTemplates.ts` with structured template trees for Food, Entertainment, Work, Study, and Hobbies. Replaced raw emojis and hardcoded hex colors with tokenized palette colors and standard `@expo/vector-icons` (`Ionicons`) icon names.
5. **Entry Status Presets:** Created `src/constants/statuses.ts` mapping all preset statuses (`completed`, `in_progress`, `planned`, `liked`, `disliked`, `neutral`) to human display labels, Ionicons, and token colors.

---

## 2. File Changes

### Files Created
- `src/types/index.ts` — Core domain types, parsed node models, search shapes, export schemas, and repository input contracts.
- `src/constants/starterTemplates.ts` — Pre-defined cosmic hierarchy starter templates (Galaxies and Solar Systems).
- `src/constants/statuses.ts` — Preset status configurations with labels, Ionicons, and theme colors.
- `docs/walkthroughs/step-4.md` — This walkthrough report.

### Files Modified
- `src/theme/tokens.ts` — Imported and re-exported `CosmicTier` from `../types` for a single canonical source of truth.
- `PROJECT_STATE.md` — Updated roadmap progress, file tree, and architectural decisions.

---

## 3. Key Code Highlights

### Repository Input Contracts & Parsed Node (`src/types/index.ts`)
```typescript
import type { Node } from '../db/schema';
export type { Node, NewNode } from '../db/schema';

export type NodeType = 'folder' | 'entry';

export interface ParsedNode extends Omit<Node, 'tags' | 'metadata'> {
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface CreateNodeInput {
  id?: string;
  parentId: string;
  title: string;
  nodeType: NodeType;
  icon?: string;
  color?: string;
  description?: string;
}

export type UpdateNodePatch = Partial<
  Omit<ParsedNode, 'id' | 'createdAt' | 'updatedAt' | 'parentId' | 'depth'>
>;
```

### Themed Starter Templates (`src/constants/starterTemplates.ts`)
```typescript
import { Colors } from '../theme/tokens';

export interface TemplateDefinition {
  title: string;
  icon: string;
  color: string;
  description?: string;
  children?: TemplateDefinition[];
}

export const STARTER_TEMPLATES: TemplateDefinition[] = [
  {
    title: 'Food',
    icon: 'restaurant-outline',
    color: Colors.tier.galaxy,
    description: 'Culinary discoveries, dining spots, and recipes',
    children: [
      { title: 'Liked', icon: 'heart-outline', color: Colors.semantic.danger },
      { title: 'Disliked', icon: 'thumbs-down-outline', color: Colors.text.muted },
      { title: 'Want to Try', icon: 'bookmark-outline', color: Colors.tier.core },
    ],
  },
  // Entertainment, Work, Study, Hobbies...
];
```

### Preset Status Configurations (`src/constants/statuses.ts`)
```typescript
export const STATUS_PRESETS = {
  completed:   { value: 'completed',   label: 'Completed',   icon: 'checkmark-circle-outline', color: Colors.semantic.success },
  in_progress: { value: 'in_progress', label: 'In Progress', icon: 'time-outline',             color: Colors.tier.core },
  planned:     { value: 'planned',     label: 'Planned',     icon: 'calendar-outline',         color: Colors.tier.solarSystem },
  liked:       { value: 'liked',       label: 'Liked',       icon: 'heart-outline',            color: Colors.semantic.danger },
  disliked:    { value: 'disliked',    label: 'Disliked',    icon: 'thumbs-down-outline',      color: Colors.text.muted },
  neutral:     { value: 'neutral',     label: 'Neutral',     icon: 'remove-circle-outline',    color: Colors.text.secondary },
} as const;
```

---

## 4. Git Commits in Step 4

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `8e85c11` | `feat(types): define core domain types, parsed node shapes, and repository input contracts` | Core types and repository input contracts |
| `4ecaed8` | `feat(constants): add obsidian-themed starter templates and entry status presets` | Clean vector starter templates and status configurations |
| *(pending)* | `docs: update PROJECT_STATE.md and add step-4 walkthrough` | State tracking and walkthrough report |

---

## 5. Manual Testing & Verification

1. **TypeScript Type-Check:**
   ```bash
   npx tsc --noEmit
   ```
   *Result:* Passed with **0 errors**.

2. **Integration Verification:**
   - Verified that `CosmicTier` imported into `src/theme/tokens.ts` produces zero circular dependency or resolution warnings.
   - Verified that `NodeStatus` matches all keys in `STATUS_PRESETS`.
   - Verified that all template colors map to valid keys in `Colors.tier` or `Colors.semantic`.
