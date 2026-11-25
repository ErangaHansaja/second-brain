# Walkthrough — Step 13: Interactive Obsidian Cosmos View

> **Branch:** `feat/step-13-cosmos-view`  
> **Base:** `dev` (at `e4ba5b4` — Phase 1 / Step 12 merged)  
> **Status:** Completed & Typechecked (PR #12 Ready for Expo Go QA)  

---

## 1. Overview & Architecture

Step 13 launches **Phase 2: The Obsidian Cosmos View**, adding an interactive pinch-to-zoom 2D galaxy constellation map backed live by SQLite (`expo-sqlite`) and running smoothly on Android/iOS in Expo Go:

1. **Dependencies & Gesture Root (`package.json`, `src/app/_layout.tsx`):**
   - Installed `react-native-svg` (`15.16.0`) via `npx expo install react-native-svg` alongside `react-native-reanimated` (`4.7.1`), `react-native-gesture-handler` (`~3.3.0`), and `react-native-worklets` (`0.13.0`).
   - Verified `babel-preset-expo` in Expo SDK 58 automatically resolves `react-native-worklets/plugin`, keeping `babel.config.js` conflict-free.
   - Wrapped the root app container in `<GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.void }}>`.
2. **Whole-Universe Data Loader (`src/db/repository.ts`, `src/hooks/useAllNodes.ts`):**
   - Added `getAllNodes(): Promise<ParsedNode[]>` ordered by `depth ASC, title COLLATE NOCASE ASC`.
   - Added `useAllNodes()` with a cancellation guard (`cancelled`) and memoized `refresh()`, re-exported via `src/hooks/index.ts`.
3. **Orbital Layout Math & World-Space Hit-Testing (`src/utils/cosmosLayout.ts`):**
   - **Mass Calculation (O(N)):** Computes subtree `descendantCount` per node using a cycle-guarded DFS cache so folder radii scale proportionally with subtree size.
   - **Depth 0 (Root `"Me"`):** Anchored at `(0, 0)` with `radius: 26` and Event Horizon amber `#F5A623`.
   - **Depth 1 (Galaxies):** Placed evenly around `(0, 0)` starting at `-π/2` along a primary ring (`r = 185`, expanding smoothly by `+20px` per galaxy past 6), `radius` scaled between `14` and `22`.
   - **Depth 2 (Solar Systems):** Fanned radially outward along their parent Galaxy's angle (`localR = 72–90` scaled with sibling count, `fanSpan <= 1.25π`), `radius` scaled `10–13` for folders.
   - **Depth 3+ (Planets, Entries, Moons):** Nested in tight outward arcs around their parent (`localR = 36–46`, `fanSpan <= 1.65π`). Entry radii map ratings `1–10` across `6–10px` (`7.5px` when unrated) and inherit status colors from `STATUS_PRESETS`, falling back to `tierColor(depth)`.
   - **Deterministic Tap Hit-Testing:** `findNodeAtWorldPoint(items, worldX, worldY, scale)` converts screen coordinates `(sx, sy)` into world space (`(sx - cx - tx) / scale`, `(sy - cy - ty) / scale`) and selects the closest body within `Math.max(item.radius + 14 / safeScale, 22 / safeScale)`.
4. **60 FPS Gesture Camera, LOD Labels & Inspector (`CosmosScreen.tsx`, `CosmosLabel.tsx`, `CosmosInspectorCard.tsx`):**
   - **SVG Matrix Camera:** Rather than scaling a huge `View` bitmap (which risks Android GPU texture limits when zoomed), `<Svg>` fills the exact viewport and animates a single `<AnimatedG>` native `matrix` (`[s, 0, 0, s, cx + tx, cy + ty]`) on the UI thread via `useAnimatedProps`.
   - **Simultaneous Gestures:** Uses RNGH v3 hooks (`usePanGesture` incremental `changeX/changeY`, `usePinchGesture` focal-point `scaleChange` clamped `[0.35, 4.0]`, and `useExclusiveGestures(doubleTap, singleTap)` with `scheduleOnRN` from `react-native-worklets`).
   - **Coarse Zoom LOD:** `useAnimatedReaction` dispatches `setZoomTier` via `scheduleOnRN` only when crossing thresholds `0.8` and `1.35`:
     - Always visible: Depth `0` & `1`, plus any selected node and its direct children.
     - Visible at `scale >= 0.8`: Depth `2` (Solar Systems).
     - Visible at `scale >= 1.35`: Depth `3+` (Planets, Entries, Moons).
   - **Event Horizon Visuals:** Deterministic static starfield (68 stars), dashed hairline orbital rings, glowing parent-child edges, and a central `"Me"` black hole featuring a `<RadialGradient>` amber corona, animated breathing outer ring, accretion rim, and `#04050A` void core.
   - **HUD & Floating Inspector Card:** Top `"Cosmos"` pill + live body counter, bottom-right zoom controls (`+`, `-`, recenter on `"Me"`) stacked dynamically above `CosmosInspectorCard`, with `"Open Entry"` (`/node/${id}`) or `"Open in Explorer"` (`/(tabs)?nodeId=${id}`) actions.

---

## 2. File Changes

### Files Created
- `src/hooks/useAllNodes.ts` — Race-safe whole-universe loader hook.
- `src/utils/cosmosLayout.ts` — Deterministic orbital placement & world-space tap hit-testing engine.
- `src/app/(tabs)/cosmos.tsx` — Thin Expo Router wrapper for the `Cosmos` tab.
- `src/screens/cosmos/CosmosScreen.tsx` — Interactive pan/pinch/tap SVG universe screen.
- `src/screens/cosmos/CosmosLabel.tsx` — UI-thread screen-space label anchored under celestial bodies.
- `src/screens/cosmos/CosmosInspectorCard.tsx` — Floating inspector summary card with deep navigation actions.
- `docs/walkthroughs/step-13.md` — This walkthrough report.

### Files Modified
- `package.json` & `package-lock.json` — Added `react-native-svg` (`15.16.0`).
- `src/app/_layout.tsx` — Replaced root `View` with `<GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.void }}>`.
- `src/app/(tabs)/_layout.tsx` — Added the `Cosmos` tab (`aperture` / `aperture-outline`) next to `Explorer`.
- `src/db/repository.ts` — Exported `getAllNodes()`.
- `src/hooks/index.ts` — Exported `useAllNodes`.
- `PROJECT_STATE.md` — Marked Step 12 merged and Step 13 complete.

---

## 3. Git Commits in Step 13

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `29345b5` | `chore(deps): configure svg, reanimated, and gesture-handler root for Cosmos view` | `react-native-svg` & `GestureHandlerRootView` root |
| `c2558d8` | `feat(data): add getAllNodes repository query and reactive useAllNodes hook` | `getAllNodes()` & `useAllNodes` hook |
| `2b920b3` | `feat(cosmos): add deterministic orbital layout engine and world-space hit-testing` | `src/utils/cosmosLayout.ts` |
| `b834da2` | `feat(screen): implement interactive pinch-to-zoom Cosmos galaxy screen and tab` | `CosmosScreen`, `CosmosLabel`, `CosmosInspectorCard`, `cosmos` tab |
| *(pending)* | `docs: update PROJECT_STATE.md and add step-13 walkthrough` | `PROJECT_STATE.md` & `docs/walkthroughs/step-13.md` |

---

## 4. Verification & Manual Testing Steps (Expo Go)

### TypeScript Verification
```bash
npx tsc --noEmit
```
*Result:* Passed with **0 errors**.

### Manual Expo Go QA Steps
1. **Tab Navigation & Boot:** Launch `npx expo start` in Expo Go and tap the **Cosmos** tab (`aperture` icon next to Explorer). Confirm the void `#04050A` canvas renders with the central amber breathing `"Me"` black hole, starfield, and orbiting categories.
2. **Pan, Pinch & Controls:**
   - Drag with one finger -> smooth 60 FPS panning across the constellation.
   - Pinch with two fingers (and pan simultaneously while pinching) -> smooth zoom clamped between `0.35x` and `4.0x` anchored at your pinch center.
   - Tap `+`, `-`, and the amber target recenter button -> smooth animated zoom steps and spring recenter back to `"Me"`.
   - Double-tap an outer galaxy -> springs smoothly into a `2.0x` zoom centered on that region; double-tap again -> springs back to `1.0x` centered on `"Me"`.
3. **Zoom LOD & Selection:**
   - Zoom out (`< 0.8x`) -> confirm only Depth 0 (`Me`) and Depth 1 (Galaxies) labels remain visible cleanly.
   - Zoom back to `1.0x` -> Depth 2 labels fade into view; zoom past `1.35x` -> Depth 3+ labels appear cleanly without overlapping or blurring.
   - Tap a small planet/entry -> confirm light haptic fires, the camera centers smoothly on the body, its child labels appear, and `CosmosInspectorCard` slides cleanly below the zoom controls.
4. **Cross-Tab Deep Linking & Live Sync:**
   - On a selected folder card, tap **Open in Explorer** -> confirms Explorer navigates straight into that folder.
   - On a selected entry card, tap **Open Entry** -> opens `NodeDetailScreen` for that entry; edit its rating or status, return to **Cosmos**, and confirm the node's size/color/card update automatically.
