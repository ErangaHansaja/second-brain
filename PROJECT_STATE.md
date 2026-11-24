# Second Brain — Living Project State

> **Last Updated:** Step 2 (State & Theme) Completed  
> **Active Branch:** `feat/step-2-state-and-theme`  
> **Base Branch (`dev`):** Synced with GitHub `origin/dev` at commit `c5c7a0c` (Step 1 merged)

---

## 1. Roadmap & Step Status

| Step | Scope | Branch | Status |
|:---:|:---|:---|:---:|
| **1** | Project Setup, Tooling & Placeholder Tabs | `feat/step-1-project-setup` | ✅ **Merged to `dev`** (`c5c7a0c`) |
| **2** | Rules, Obsidian Theme Tokens & Thin Routes | `feat/step-2-state-and-theme` | 🟡 **Completed (Awaiting Approval)** |
| **3** | Database Schema, Migration & Provider | `feat/step-3-database-schema` | ⏳ Pending |
| **4** | TypeScript Types & Constants | `feat/step-4-types-constants` | ⏳ Pending |
| **5** | Repository Layer (CRUD, CTEs, Search) | `feat/step-5-repository` | ⏳ Pending |
| **6** | Shared UI Primitives & Explorer Atoms | `feat/step-6-components` | ⏳ Pending |
| **7** | Custom Data Hooks | `feat/step-7-hooks` | ⏳ Pending |
| **8** | Explorer Screen (Drill-Down Universe) | `feat/step-8-explorer-screen` | ⏳ Pending |
| **9** | Entry Detail & Editor Screen | `feat/step-9-detail-screen` | ⏳ Pending |
| **10** | Global Search Screen | `feat/step-10-search-screen` | ⏳ Pending |
| **11** | Settings Screen (Stats, Seed, Backup) | `feat/step-11-settings-screen` | ⏳ Pending |
| **12** | Polish, Edge Cases & Verification | `feat/step-12-polish` | ⏳ Pending |
| **13** | Documentation & Tag (`v1.0.0-phase1`) | `feat/step-13-release` | ⏳ Pending |

---

## 2. Current Project File Tree

```
second-brain/
├── .github/
│   └── commands/
│       └── create_feature_pr.md           # Standardized PR workflow template for all roadmap steps
├── .gitignore
├── AGENT_RULES.md                         # 7 permanent rules (thin routes, obsidian theme, manual PRs, zero slop)
├── IMPLEMENTATION_PLAN.md                 # Master blueprint with 8 architectural corrections
├── LICENSE
├── PROJECT_STATE.md                       # This living state document
├── README.md
├── app.json                               # Expo app config (name: "Second Brain", slug: "second-brain", scheme: "second-brain")
├── babel.config.js                        # babel-preset-expo + inline-import for .sql
├── drizzle.config.ts                      # schema: ./src/db/schema.ts, out: ./drizzle, driver: expo
├── metro.config.js                        # Extends sourceExts with 'sql'
├── package.json                           # Dependencies & scripts
├── package-lock.json
├── tsconfig.json                          # strict: true, noUncheckedIndexedAccess: true
│
├── assets/
│   └── images/                            # App icons, splash screens
│
├── docs/
│   └── walkthroughs/
│       └── step-2.md                      # Detailed Step 2 walkthrough report
│
├── scripts/
│   └── reset-project.js
│
└── src/
    ├── app/                               # STRICTLY thin Expo Router route wrappers (5-10 lines)
    │   ├── _layout.tsx                    # Root Stack: StatusBar light, background Colors.bg.void
    │   └── (tabs)/                        # Bottom tab navigator
    │       ├── _layout.tsx                # Tab bar styling with obsidian theme tokens
    │       ├── index.tsx                  # Thin route -> src/screens/explorer/ExplorerScreen
    │       ├── search.tsx                 # Thin route -> src/screens/search/SearchScreen
    │       └── settings.tsx               # Thin route -> src/screens/settings/SettingsScreen
    │
    ├── screens/                           # Real feature screen implementations
    │   ├── explorer/
    │   │   └── ExplorerScreen.tsx         # Obsidian instrument card placeholder
    │   ├── search/
    │   │   └── SearchScreen.tsx           # Obsidian search placeholder
    │   └── settings/
    │       └── SettingsScreen.tsx         # Obsidian settings placeholder
    │
    └── theme/
        └── tokens.ts                      # Obsidian black-hole palette, typography, spacing, tier helpers
```

---

## 3. Installed Packages & Versions

- **Expo SDK:** `~58.0.26` (React 19.3.0, React Native 0.88.1, Expo Router `~58.0.32`)
- **Native Modules:**
  - `expo-sqlite`: `~58.0.18` (Local SQLite database)
  - `expo-crypto`: `~58.0.8` (UUID v4 generation via `Crypto.randomUUID()`)
  - `expo-file-system`: `~58.0.14` (JSON backup file I/O)
  - `expo-sharing`: `~58.0.23` (Native share sheet for backup exports)
- **Database ORM & Tooling:**
  - `drizzle-orm`: `^0.45.4` (Type-safe SQL query builder)
  - `drizzle-kit`: `^0.31.11` (Migration generation CLI via `npm run db:generate`)
  - `babel-plugin-inline-import`: `^3.0.0` (Inlines `.sql` migration files into bundle)

---

## 4. Key Architectural & Design Decisions

1. **Thin Routes Pattern:** `src/app/` files contain only 5–10 lines re-exporting real screens from `src/screens/`. Zero business logic or layout styling in routes.
2. **Obsidian Deep-Space Instrument Aesthetic:**
   - Backgrounds: True void black (`#04050A`), deep surface (`#0B0D14`), elevated surface (`#131622`).
   - Hairline borders: `rgba(255, 255, 255, 0.08)`.
   - Core Accent: Event Horizon Amber (`#F5A623`) for depth 0 ("Me").
   - Cosmic Tiers:
     - Depth 0 (Core): `#F5A623` (Event Horizon Amber)
     - Depth 1 (Galaxy): `#818CF8` (Nebula Indigo)
     - Depth 2 (Solar System): `#38BDF8` (Stellar Sky)
     - Depth 3 (Planet): `#2DD4BF` (Orbital Teal)
     - Depth 4+ (Moon): `#94A3B8` (Lunar Silver)
   - Platform monospace font (`Menlo` on iOS, `monospace` on Android) for technical metadata and paths.
3. **Database Architecture (Upcoming Step 3):**
   - SQLite self-referencing hierarchy (`parent_id REFERENCES nodes(id) ON DELETE CASCADE`).
   - Foreign keys enforced explicitly via `PRAGMA foreign_keys = ON;` on connection.
   - Migrations handled via `useMigrations(db, migrations)` from `drizzle-orm/expo-sqlite/migrator`.
   - Recursive CTE queries must use `db.all()` / `expoDb.getAllSync()` with snake_case aliases (`parent_id AS parentId`).
   - Database restore must sort nodes by `depth ASC` before inserting.
4. **Navigation:** Single-screen Explorer with `currentNodeId` in React state and hardware Android `BackHandler` interception.
5. **PR-Only Merge Policy (Rule 6):** Feature branches are NEVER merged locally to `dev`. Every completed step pushes to `origin` and opens a PR using `.github/commands/create_feature_pr.md` for manual review and merge on GitHub.
6. **Zero AI Slop & Vector Icons (Rule 7):** Banned filler status copy (`ONLINE`, `STANDBY`, `SYSTEM // CONFIG`, etc.) and banned raw system emojis for navigation chrome. All navigation icons must use `@expo/vector-icons` (`Ionicons` / `Feather`), reserving emojis strictly for user-created content.

---

## 5. Next Immediate Step

**Step 3 — Database Schema & Migration Setup (`feat/step-3-database-schema`)**:
- Merge `feat/step-2-state-and-theme` into `dev` after user approval.
- Cut `feat/step-3-database-schema` from `dev`.
- Create `src/db/schema.ts` (nodes table with self-referencing FK).
- Create `src/db/client.ts` (`openDatabaseSync('second_brain.db')` + `drizzle()`).
- Generate initial migration with `npm run db:generate` (`drizzle/0000_initial.sql`).
- Create `src/components/providers/DatabaseProvider.tsx` using `useMigrations` and `PRAGMA foreign_keys = ON;`.
- Wire `DatabaseProvider` into `src/app/_layout.tsx`.
