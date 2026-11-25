# Walkthrough — Step 11: Settings Screen with Live Stats, Starter Seeding & JSON Backup

> **Branch:** `feat/step-11-settings-screen`  
> **Base:** `dev` (at `53b188f` — Step 10 merged)  
> **Status:** Completed & Verified  

---

## 1. Overview & Objectives

Step 11 turns Settings into the central local data control screen for Second Brain, pairing real-time cosmic tier telemetry with validated JSON backup/restore capabilities:

1. **SDK 58 Backup & Validation Utility (`src/utils/backup.ts`):**
   - Installed `expo-document-picker` (`~58.0.5`) via `npx expo install`.
   - Built `exportBackupToFile()` using the non-deprecated Expo SDK 58 `File` and `Paths.cache` class API (`file.create({ intermediates: true, overwrite: true })` + `file.write(...)`), generating timestamped files (`second-brain-backup-YYYY-MM-DD.json`) and presenting the OS share sheet via `expo-sharing` (`mimeType: 'application/json'`, `UTI: 'public.json'`).
   - Built `pickAndParseBackupFile()` configured with `type: ['application/json', 'text/plain', '*/*']` and `copyToCacheDirectory: true` so Android file managers never grey out `.json` files. Reads UTF-8 text via `File.text()` and strictly validates:
     - `version === 1`
     - Non-empty `nodes` array
     - Valid required `id`, `title`, `nodeType` (`'folder' | 'entry'`), and non-negative integer `depth` on every row
     - Root parent invariants (`depth === 0` <-> `parentId === null`) and exactly 1 folder root node (`depth === 0`).
2. **Complete Settings & Data Screen (`src/screens/settings/SettingsScreen.tsx`):**
   - Updated `src/app/(tabs)/_layout.tsx` (`headerShown: false` on `settings`) and wrapped `SettingsScreen` in `<ScreenContainer>` + `<ScrollView>`.
   - **Overview Grid:** Compact 2-column × 3-row metric grid showing color-coded tier dots and monospace counts (**Total**, **Entries**, **Galaxies**, **Solar Systems**, **Planets**, **Moons**) refreshed automatically on focus via `useFocusEffect`.
   - **Starter Structure:** Clean **"Load Starter Categories"** action invoking `seedStarterTemplates(rootNode.id)` and automatically disabling with `"Starter categories already present"` once galaxies exist.
   - **Local Backup (Export / Import):**
     - **"Export Backup (JSON)"** saves and shares the full SQLite dump with loading feedback and a dark teal success banner.
     - **"Import Backup (JSON)"** picks and validates the JSON file *before* prompting a destructive `<ConfirmDialog>` showing the exact item count to restore. On confirmation, calls `importDatabase()`, refreshes `rootNode` and `stats`, and displays a success banner with an `"Open Explorer"` jump straight to the restored root UUID.
   - **Developer Tools (`__DEV__` only):** Preserved **"Run DB Self-Test"** and **"Open UI Component Gallery"** cleanly in a bottom developer section.

---

## 2. File Changes

### Files Created
- `src/utils/backup.ts` — Export to JSON file + share sheet, and document-picker read + strict backup validation.
- `docs/walkthroughs/step-11.md` — This walkthrough report.

### Files Modified
- `package.json` & `package-lock.json` — Installed `expo-document-picker` (`~58.0.5`).
- `src/app/(tabs)/_layout.tsx` — Set `headerShown: false` on `settings` tab.
- `src/screens/settings/SettingsScreen.tsx` — Implemented full Overview, Starter Structure, Local Backup (Export/Import), feedback banner, and preserved `__DEV__` tools.
- `PROJECT_STATE.md` — Marked Step 10 merged, Step 11 complete, added `src/utils/backup.ts` and `expo-document-picker`.

---

## 3. Git Commits in Step 11

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `189880e` | `feat(backup): install expo-document-picker and add validated JSON backup file utility` | `expo-document-picker` & `src/utils/backup.ts` |
| `fa94e8d` | `feat(screen): implement SettingsScreen with live stats, starter seeding, and JSON export/import` | Full Settings screen & tab layout update |
| *(pending)* | `docs: update PROJECT_STATE.md and add step-11 walkthrough` | Living project state & walkthrough |

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
   - **Overview & Auto-Refresh:** Open the **Settings** tab -> confirm no duplicate header bar and verify the 2×3 Overview stat grid accurately counts Total, Entries, Galaxies, Solar Systems, Planets, and Moons. Create an entry in Explorer, switch back to Settings, and verify counts update automatically.
   - **Starter Categories:** On an empty DB, tap **"Load Starter Categories"** -> confirm success banner appears, counts jump immediately, and the button disables showing `"Starter categories already present"`.
   - **Export Backup (JSON):** Tap **"Export Backup (JSON)"** -> confirm native Android Share sheet opens with `second-brain-backup-YYYY-MM-DD.json`. Save it to Downloads or Drive.
   - **Import Backup Validation & Restore:**
     - Create or delete an item so the DB differs from your saved backup.
     - Tap **"Import Backup (JSON)"**, pick a non-backup or malformed `.json` file -> confirm dark error banner displays a clear validation message without touching local SQLite data.
     - Tap **"Import Backup (JSON)"** again and pick the valid exported `.json` file -> verify dark `"Restore Backup"` confirmation dialog lists the item count, tap **Restore**, confirm teal `"Restored N items from backup"` banner appears, and tap **"Open Explorer"** to see the restored tree intact.
