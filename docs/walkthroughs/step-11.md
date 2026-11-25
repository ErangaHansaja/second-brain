# Walkthrough — Step 11: Settings Screen with Live Stats, Starter Seeding & JSON Backup

> **Branch:** `feat/step-11-settings-screen`  
> **Base:** `dev` (at `53b188f` — Step 10 merged)  
> **Status:** Completed & Verified (PR #10 Review Fixes Applied)  

---

## 1. Overview & Objectives

Step 11 turns Settings into the central local data control screen for Second Brain, pairing real-time cosmic tier telemetry with resilient, cross-platform JSON backup/restore capabilities:

1. **Resilient SDK 58 Backup & Validation Utility (`src/utils/backup.ts`):**
   - Installed `expo-document-picker` (`~58.0.5`) via `npx expo install`.
   - Built `exportBackupToFile()` using Expo SDK 58 `File` and `Paths.cache` (`file.create({ intermediates: true, overwrite: true })` + `file.write(...)`), generating timestamped files (`second-brain-backup-YYYY-MM-DD.json`) and presenting the OS share sheet via `expo-sharing` (`mimeType: 'application/json'`, `UTI: 'public.json'`).
   - Built `pickAndParseBackupFile()` configured with `type: ['application/json', 'text/plain', '*/*']` and `copyToCacheDirectory: true` so Android file managers never grey out `.json` files.
   - Added `readBackupUriAsText(uri)` implementing a 3-stage fallback chain resilient to Android `content://` URIs and special characters such as parentheses (`second-brain-backup-2026-11-25(1).json`):
     1. `File.text()` across raw, `encodeURI`, and `decodeURI` candidates.
     2. `readAsStringAsync(uri, { encoding: 'utf8' })` from `expo-file-system/legacy`.
     3. Native `fetch(uri)` -> `response.text()`.
   - Strips UTF-8 BOM (`\uFEFF`) before `JSON.parse`, logs underlying errors with `console.warn('[Backup] Import failed:', err)` in `__DEV__`, and strictly validates `version === 1`, non-empty `nodes[]`, valid row types, root invariants (`depth === 0` <-> `parentId === null`), and single folder root.
2. **Pinned Feedback & Decluttered `SettingsScreen` (`src/screens/settings/SettingsScreen.tsx`):**
   - Updated `src/app/(tabs)/_layout.tsx` (`headerShown: false` on `settings`) and wrapped `SettingsScreen` in `<ScreenContainer>`.
   - Pinned the top **Settings** header and inline **Feedback Banner** outside `<ScrollView>` so success/error banners remain immediately visible even when scrolled down tapping Export or Import.
   - **Overview Grid:** Compact 2×3 metric grid (**Total**, **Entries**, **Galaxies**, **Solar Systems**, **Planets**, **Moons**) refreshed automatically on focus via `useFocusEffect`.
   - **Starter Structure:** Renders **"Load Starter Categories"** only when `stats !== null && stats.galaxies === 0` (automatically hidden once categories exist so Local Backup fits cleanly above the fold).
   - **Local Backup (Export / Import) & Root Recovery:** Validates picked JSON *before* showing destructive `<ConfirmDialog>`, restores via `importDatabase()`, refreshes stats/root, displays `"Restored N items from backup"` with `"Open Explorer"` quick jump, and tracks `prevRootIdRef` in `ExplorerScreen.tsx` so tapping the Explorer bottom tab snaps straight to a newly restored root UUID.
   - **Developer Tools (`__DEV__` only):** Preserved **"Run DB Self-Test"** and **"Open UI Component Gallery"**.

---

## 2. File Changes

### Files Created
- `src/utils/backup.ts` — JSON export to file + share sheet, 3-stage resilient URI reading, and strict backup validation.
- `docs/walkthroughs/step-11.md` — This walkthrough report.

### Files Modified
- `package.json` & `package-lock.json` — Installed `expo-document-picker` (`~58.0.5`).
- `src/app/(tabs)/_layout.tsx` — Set `headerShown: false` on `settings` tab.
- `src/screens/settings/SettingsScreen.tsx` — Pinned header/feedback banner above `ScrollView`, auto-hid Starter Structure card once seeded, added Overview, Local Backup, and preserved `__DEV__` tools.
- `src/screens/explorer/ExplorerScreen.tsx` — Tracked `prevRootIdRef` so Explorer automatically resets to the restored root UUID when switching back after a backup restore.
- `PROJECT_STATE.md` — Updated Step 11 state, file tree, and architectural decisions.

---

## 3. Git Commits in Step 11

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `189880e` | `feat(backup): install expo-document-picker and add validated JSON backup file utility` | `expo-document-picker` & initial `src/utils/backup.ts` |
| `fa94e8d` | `feat(screen): implement SettingsScreen with live stats, starter seeding, and JSON export/import` | Initial Settings screen & tab layout update |
| `a708434` | `docs: update PROJECT_STATE.md and add step-11 walkthrough` | Initial Step 11 docs |
| `df9a116` | `fix(backup): make Android backup file reading resilient to content URIs and special characters` | 3-stage `readBackupUriAsText`, BOM strip & `__DEV__` logging |
| `826412f` | `fix(settings): pin feedback banner outside ScrollView and hide Starter Structure once seeded` | Pinned banner, conditional starter card & Explorer root snap |
| *(pending)* | `docs: update step-11 walkthrough and PROJECT_STATE with import and layout fixes` | Updated docs & state |

---

## 4. Verification & Manual Testing Steps (Expo Go)

1. **TypeScript Verification:**
   ```bash
   npx tsc --noEmit
   ```
   *Result:* Passed with **0 errors**.

2. **On-Device Android Expo Go Verification:**
   ```bash
   npx expo start
   ```
   - **Decluttered Layout & Pinned Banner:** Open **Settings** when categories are already loaded -> confirm Starter Structure card is hidden and Overview + Local Backup sit prominently. Scroll down, tap **Export Backup (JSON)** or **Import Backup (JSON)** -> confirm the teal/red feedback banner remains pinned cleanly at the top below the Settings header.
   - **Export + Android Parenthesis Filename Import:**
     - Export backup twice (or save as `second-brain-backup-YYYY-MM-DD(1).json` in Downloads).
     - Modify or add a dummy node in Explorer.
     - Return to Settings, tap **Import Backup (JSON)**, select `second-brain-backup-YYYY-MM-DD(1).json` -> confirm `"Restore Backup"` dialog lists the node count, tap **Restore**, confirm pinned teal `"Restored N items from backup"` banner appears, and tap the **Explorer** bottom tab icon (or **"Open Explorer"**) to verify the restored hierarchy appears immediately.
