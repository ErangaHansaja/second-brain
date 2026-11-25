# Walkthrough — Step 13: Interactive 3D Obsidian Cosmos View

> **Branch:** `feat/step-13-cosmos-view`  
> **Base:** `dev` (at `e4ba5b4` — Phase 1 / Step 12 merged)  
> **Status:** Completed & Typechecked (PR #13 Updated with 3D WebView Engine)  

---

## 1. Overview & Architecture

Step 13 delivers **Phase 2: The Obsidian Cosmos View**, replacing the initial flat 2D SVG map with a **100% offline, hardware-accelerated 3D Canvas Galaxy & Black Hole engine** inside `react-native-webview`, paired with native Obsidian HUD overlays and Inspector Card:

1. **Offline 3D Black Hole & Galaxy Engine (`src/screens/cosmos/cosmosEngineHtml.ts`):**
   - **Zero-CDN High-DPI 3D Canvas:** Runs an internal `requestAnimationFrame` loop scaled by `Math.min(window.devicePixelRatio, 3)` inside `#04050A` void space with perspective projection, 3D yaw/pitch/zoom/pan camera interpolation, and back-to-front Z-sorting.
   - **3D Starfield & Parallax Nebula:** Renders 290+ twinkling 3D sphere stars plus 4 deep-indigo, stellar-sky, and amber nebula clouds with cached radial glow textures (`globalCompositeOperation = 'lighter'`).
   - **Living `"Me"` Black Hole Core:** Central pitch-black singularity sphere occluded cleanly against 340+ Keplerian amber/gold/white-hot accretion disk particles (inner particles orbit faster; back-half renders behind the event horizon, front-half crosses in front).
   - **Tilted 3D Orbital Systems:**
     - Galaxies (depth 1) drift gently on wide inclined 3D orbital planes (`r = 215–254`).
     - Solar Systems (depth 2) fan along wide outward tilted local arcs (`r = 88–108`); Entries/Planets (depth 3+) nest cleanly (`r = 48–66`) with guaranteed angular spacing so sibling labels and bodies don't crowd.
     - Tapered parent-child energy filaments connect the hierarchy; entry colors map directly from `STATUS_PRESETS`, with glow/radius scaled by rating (`1–10`) and folder `descendantCount`.
   - **Obsidian Graph Focus & Collision-Free Labels:**
     - Tapping a body flies the 3D camera smoothly onto it, dims unrelated branches smoothly to ~20% opacity while highlighting the selected node's ancestor path and direct children, and posts `{ type: 'SELECT_NODE', nodeId }` to React Native.
     - Priority-sorted 2D bounding-box collision detection checks both placed labels and higher-priority node circles so labels never overlap each other or sit directly over another body.
   - **Mobile Multi-Touch & Bidirectional Bridge:**
     - Handles 1-finger 3D trackball rotation with inertia, 2-finger pinch-zoom (`0.45x`–`3.6x`) + screen pan, single-tap node selection, void tap clear, and double-tap reset (`touch-action: none`).
     - Listens on both `window` and `document` for `SET_DATA`, `ZOOM_IN`, `ZOOM_OUT`, `RESET_CAMERA`, and `CLEAR_SELECTION` after posting `READY`.
2. **Whole-Universe Data & Shared Payload Prep (`repository.ts`, `useAllNodes.ts`, `cosmosLayout.ts`):**
   - `getAllNodes()` loads all nodes sorted `depth ASC, title COLLATE NOCASE ASC`.
   - `useAllNodes()` wraps `getAllNodes()` safely with a cancellation flag and `refresh()`.
   - `buildCosmosGraphData()` in `src/utils/cosmosLayout.ts` computes O(N) descendant counts and status/tier colors shared across the WebView payload and `CosmosInspectorCard`.
3. **Native Overlays & Focus Camera Auto-Reset (`CosmosScreen.tsx`, `CosmosInspectorCard.tsx`):**
   - Mounts `<WebView>` with `originWhitelist={['*']}`, `scrollEnabled={false}`, `bounces={false}`, `overScrollMode="never"`, `androidLayerType="hardware"`, `setBuiltInZoomControls={false}`, `setDisplayZoomControls={false}`, and `#04050A` `style` / `containerStyle` for zero white flashes.
   - On `useFocusEffect` tab return, refreshes `useAllNodes()`, clears `selectedNodeId`, and posts `RESET_CAMERA` so returning from Detail/Explorer/Search/Settings always reopens centered cleanly on `"Me"`.
   - Keeps native Obsidian top HUD (`Cosmos` + live body counter), `+` / `-` / Recenter circular controls, and bottom `CosmosInspectorCard` (`Open Entry` / `Open in Explorer`).

---

## 2. File Changes

### Files Created
- `src/hooks/useAllNodes.ts` — Race-safe whole-universe loader hook.
- `src/utils/cosmosLayout.ts` — O(N) descendant mass calculation, status/tier color resolution, and 3D payload builder.
- `src/app/(tabs)/cosmos.tsx` — Thin Expo Router wrapper for the `Cosmos` tab.
- `src/screens/cosmos/cosmosEngineHtml.ts` — Self-contained offline 3D Canvas Black Hole & Galaxy WebView HTML engine.
- `src/screens/cosmos/CosmosScreen.tsx` — 3D WebView host, bridge, HUD controls, and focus auto-reset.
- `src/screens/cosmos/CosmosInspectorCard.tsx` — Floating inspector summary card with deep navigation actions.
- `docs/walkthroughs/step-13.md` — This walkthrough report.

### Files Modified
- `package.json` & `package-lock.json` — Installed `react-native-svg` (`15.16.0`) and `react-native-webview` (`14.0.1`).
- `src/app/_layout.tsx` — Wrapped app root in `<GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.void }}>`.
- `src/app/(tabs)/_layout.tsx` — Added the 4th `Cosmos` tab (`aperture` / `aperture-outline`) next to `Explorer`.
- `src/db/repository.ts` — Exported `getAllNodes()`.
- `src/hooks/index.ts` — Exported `useAllNodes`.
- `PROJECT_STATE.md` — Marked Step 12 merged and Step 13 complete with 3D WebView engine architecture.

---

## 3. Git Commits in Step 13

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `29345b5` | `chore(deps): configure svg, reanimated, and gesture-handler root for Cosmos view` | `react-native-svg` & `GestureHandlerRootView` root |
| `c2558d8` | `feat(data): add getAllNodes repository query and reactive useAllNodes hook` | `getAllNodes()` & `useAllNodes` hook |
| `2b920b3` | `feat(cosmos): add deterministic orbital layout engine and world-space hit-testing` | Initial layout helpers |
| `b834da2` | `feat(screen): implement interactive pinch-to-zoom Cosmos galaxy screen and tab` | Initial `cosmos` tab & inspector card |
| `d2f8832` | `docs: update PROJECT_STATE.md and add step-13 walkthrough` | Initial Step 13 docs |
| `eaf41ef` | `chore(deps): add react-native-webview for GPU-accelerated 3D Cosmos engine` | `react-native-webview` (`14.0.1`) |
| `1f2f9e7` | `feat(cosmos): build offline GPU-accelerated 3D Black Hole and Galaxy canvas engine` | `src/screens/cosmos/cosmosEngineHtml.ts` |
| `c0f2463` | `feat(screen): connect CosmosScreen to 3D WebView engine with focus camera auto-reset` | WebView wiring, cleaned `cosmosLayout.ts`, focus reset |
| *(pending)* | `docs: update PROJECT_STATE and step-13 walkthrough for 3D Cosmos engine` | Updated Step 13 docs |

---

## 4. Verification & Manual Testing Steps (Expo Go)

### TypeScript Verification
```bash
npx tsc --noEmit
```
*Result:* Passed with **0 errors**.

### Manual Expo Go QA Steps
1. **3D Boot & Black Hole Core:** Launch `npx expo start` in Expo Go and open the **Cosmos** tab (`aperture` icon). Confirm zero white flash, `#04050A` space, parallax stars/nebula, and the central black singularity sliced cleanly through the swirling amber accretion disk.
2. **3D Rotation, Pinch, Pan & Inertia:**
   - Drag 1 finger -> smooth 3D yaw/pitch orbital rotation with natural momentum inertia after release.
   - Pinch 2 fingers -> smooth zoom (`0.45x`–`3.6x`) and 2-finger pan without triggering Android native DOM zoom or jumping when lifting one finger.
   - Double-tap empty space -> smoothly flies back to the default full-universe view centered on `"Me"`.
3. **Obsidian Graph Focus & Collision-Free Labels:**
   - Tap a Galaxy (e.g., `Entertainment`) or Solar System (e.g., `Anime`) -> confirms camera flies smoothly in, unrelated branches dim to ~20%, active parent/child filaments brighten, and `Games` / `Movies & Series` / `Rezero` / `Attack on Titan` labels show zero text collisions.
   - Tap empty space -> clears focus dimming and closes the bottom inspector card.
4. **Cross-Tab Sync & Stuck-Zoom Fix:**
   - Tap an Entry -> tap **Open Entry** -> update its status/rating in Detail -> press Back to return to **Cosmos**. Confirm the camera automatically resets cleanly to full `"Me"` view with the updated node styling applied immediately.
   - Repeat switching between **Explorer**, **Search**, **Settings**, and **Cosmos** to verify camera always reopens cleanly centered.
