# Second Brain — Permanent Agent & Architecture Rules

These rules apply to Step 2 and EVERY future development step in this repository.

---

## 1. Production Folder Structure (Thin Routes)
- Keep `src/app/` strictly as **thin Expo Router wrapper files** (5–10 lines max, zero business logic or heavy UI).
- All real screens live inside feature folders under `src/screens/`:
  - `src/screens/explorer/` — Main drill-down universe explorer screen and sub-views
  - `src/screens/node-detail/` — Entry detail and editor screen
  - `src/screens/search/` — Global search screen
  - `src/screens/settings/` — Settings, database stats, seed, export/import screen
- Reusable UI primitives live under:
  - `src/components/common/` — Reusable atoms/molecules (`Button`, `Card`, `Badge`, `Input`)
  - `src/components/layout/` — Layout helpers, headers, wrappers
- Shared helpers and utility functions live in `src/utils/`.

---

## 2. Anti-Generic Design Rule
- **No generic AI dashboard aesthetics:** No loud neon purple/rainbow gradients, no cramped drop-shadow cards, no boilerplate placeholder copy.
- **Obsidian Deep-Space Instrument Look:**
  - True void blacks (`#04050A`) and deep surfaces (`#0B0D14`, `#131622`).
  - Subtle hairline borders (`rgba(255, 255, 255, 0.08)`).
  - Warm event-horizon amber/gold highlights (`#F5A623`) for core elements.
  - Platform monospace font (`Menlo` on iOS, `monospace` on Android) for metadata, breadcrumb paths, depth indices, and mass counters.
  - Generous negative space, crisp hierarchy, and deliberate tactile contrast.

---

## 3. Living State File (`PROJECT_STATE.md`)
- Maintain `PROJECT_STATE.md` in the repository root.
- **Update it at the end of EVERY step** before stopping.
- Any new agent session must be able to read `PROJECT_STATE.md` alone and instantly know:
  - Current branch status
  - Completed steps vs. pending steps
  - Exact folder tree
  - Installed packages & tools
  - Key architectural, design, and database decisions
  - Immediate next step

---

## 4. Per-Step Walkthrough Report
- At the end of EVERY step, create `docs/walkthroughs/step-<N>.md` documenting:
  - Exact files created, modified, or deleted
  - Key code and design decisions made in this step
  - Exact git commits created
  - Step-by-step manual testing instructions
- Enables clean hand-offs and executive architecture review.

---

## 5. Atomic Commits & Hard Stop
- Always commit step-by-step (1 logical unit = 1 small, cleanly described atomic commit).
- Never merge a feature branch into `dev` without explicit user testing and approval.
- Never start the next roadmap step until the current step is approved and merged.

---

## 6. Manual PR Merge Only
- **Never merge feature branches into `dev` locally.**
- At the end of EVERY step, push the branch to `origin` and execute the workflow defined in `.github/commands/create_feature_pr.md` to open or update a Pull Request targeting `dev`.
- Print the clickable PR URL and perform a **HARD STOP** so the user can review diffs, test, and merge manually on GitHub.
- Never advance to the next step until the user merges the PR and gives explicit approval.

---

## 7. Clean Copy & Real Vector Icons (Zero AI Slop)
- **Zero cheesy sci-fi filler text:** Never write boilerplate pseudo-cyber copy like `ONLINE`, `STANDBY`, `SYSTEM // CONFIG`, `QUERY // INDEX`, or fake status indicators. Use clear, human, purpose-driven labels (`Knowledge Base`, `Recent Entries`, `Search Nodes`, `Settings`).
- **Zero raw system emoji chrome:** Never use raw emojis (`🪐`, `🔍`, `⚙️`, etc.) as tab bar icons, button icons, or navigation chrome. Always use proper vector icons from `@expo/vector-icons` (`Ionicons` or `Feather`).
- **User content exception:** Emojis are reserved strictly for user-selected folder/entry icons or preset visual category tags (stored as data, not hardcoded into UI navigation).

