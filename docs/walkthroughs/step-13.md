# Walkthrough — Step 13: Interactive WebGL 1.0 Obsidian Cosmos View

> **Branch:** `feat/step-13-cosmos-view`  
> **Base:** `dev` (at `e4ba5b4` — Phase 1 / Step 12 merged)  
> **Status:** Completed & Typechecked (PR #13 Updated with 60 FPS WebGL 1.0 Engine)  

---

## 1. Overview & Architecture

Step 13 delivers **Phase 2: The Obsidian Cosmos View**, powered by a **100% original, zero-dependency, offline WebGL 1.0 GPU shader star-system engine** hosted in `react-native-webview` with native Obsidian HUD overlays and Inspector Card:

1. **Pure WebGL 1.0 GPU Engine (`src/screens/cosmos/cosmosEngineHtml.ts`):**
   - **Zero 2D Canvas Bottlenecks:** Eliminates all `createRadialGradient`, `shadowBlur`, and per-frame full-screen 2D redraws; caps resolution cleanly at `Math.min(window.devicePixelRatio || 1, 2)` and clears `#04050A` (`gl.clearColor(0.016, 0.020, 0.039, 1.0)`).
   - **Minimalist Monochrome & Sand-Obsidian Palette:** Refined accents (`#EAE6DF` warm off-white, `#E6B36A` sand/amber, `#68B5E8` muted sky, `#52C7B0` soft mint, `#D9687A` muted rose, `#959CEB` soft violet).
   - **4 Batched GPU Draw Calls:**
     1. **Deep 3D Starfield (`gl.POINTS`):** 380 deterministic stars distributed across a distant spherical shell (`r = 900–1500`) rotated by camera orientation only.
     2. **Central `"Me"` Fibonacci Dotted 3D Globe (`gl.POINTS`):** ~650 Fibonacci-sphere points (`radius = 44`) rotating smoothly at `~0.12 rad/s`, with a vertex shader view-space normal/depth gradient (`vAlpha` ~`0.95` crisp front dots fading smoothly to `0.14` on back hemisphere dots).
     3. **Concentric Tilted 3D Orbit Tracks & Filaments (`gl.LINES`):** Each Depth 1 Galaxy gets its own 96-segment concentric tilted astrolabe ring (`r = 92 + galaxyIndex * 42`, `±0.26 rad` inclination), brightening from `0.16` to `0.55` when its branch is focused, alongside subtle parent-child hierarchy filaments (`0.14` -> `0.50` on focus).
     4. **Procedural Ray-Sphere Lit 3D Planets (`gl.POINTS`):** Painter's-sorted spheres shaded per-fragment via `gl_PointCoord` sphere normals, directional light toward `"Me"`, specular highlight, Fresnel limb glow, and soft atmospheric halo; scaled subtly by `rating` (`1–10`) and folder `descendantCount`, with unfocused branches smoothly dimmed to `0.22`.
   - **Pooled GPU-Composited HTML Labels:** Fixed pool of `translate3d` `<div>` nodes with priority-sorted bounding-box collision culling (selected -> branch neighbors -> core -> galaxies -> closer Z), revealing Solar System and Entry labels smoothly on zoom-in or branch focus.
   - **Instant Touch Controls & MVP-Matched Picking:** 1-finger spherical orbit + inertia, 2-finger pinch zoom (`MIN_DIST` to `MAX_DIST`), double-tap reset, and exact MVP-projected `36px` tap picking (`SELECT_NODE` / `CLEAR_SELECTION`).
2. **Whole-Universe Data & Shared Payload (`repository.ts`, `useAllNodes.ts`, `cosmosLayout.ts`):**
   - `getAllNodes()` loads all nodes ordered by `depth ASC, title COLLATE NOCASE ASC`; `useAllNodes()` wraps it with a `cancelled` guard.
   - `buildCosmosGraphData()` computes O(N) descendant counts and node colors shared between the WebGL payload and `CosmosInspectorCard`.
3. **Tab Blur GPU Pause & Focus Camera Auto-Reset (`CosmosScreen.tsx`):**
   - Mounts `<WebView>` with `androidLayerType="hardware"`, `javaScriptEnabled`, `domStorageEnabled`, `scrollEnabled={false}`, `bounces={false}`, `overScrollMode="never"`, `setBuiltInZoomControls={false}`, and `#04050A` styling.
   - Inside `useFocusEffect`, refreshes nodes, clears selection, resumes the WebGL loop (`SET_ACTIVE: true`), and resets camera (`RESET_CAMERA`) on focus; returns a blur cleanup sending `SET_ACTIVE: false` so `requestAnimationFrame` stops completely while on Explorer, Search, or Settings.

---

## 2. File Changes

### Files Created
- `src/hooks/useAllNodes.ts` — Race-safe whole-universe loader hook.
- `src/utils/cosmosLayout.ts` — O(N) descendant counts, color resolution, and payload builder.
- `src/app/(tabs)/cosmos.tsx` — Thin Expo Router wrapper for the `Cosmos` tab.
- `src/screens/cosmos/cosmosEngineHtml.ts` — Offline WebGL 1.0 star-system shader engine.
- `src/screens/cosmos/CosmosScreen.tsx` — Hardware-accelerated WebView host, HUD controls, and focus/blur lifecycle.
- `src/screens/cosmos/CosmosInspectorCard.tsx` — Floating inspector summary card with deep navigation actions.
- `docs/walkthroughs/step-13.md` — This walkthrough report.

### Files Modified
- `package.json` & `package-lock.json` — Added `react-native-svg` (`15.16.0`) and `react-native-webview` (`14.0.1`).
- `src/app/_layout.tsx` — Wrapped app root in `<GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.void }}>`.
- `src/app/(tabs)/_layout.tsx` — Added the 4th `Cosmos` tab (`aperture` / `aperture-outline`) next to `Explorer`.
- `src/db/repository.ts` — Exported `getAllNodes()`.
- `src/hooks/index.ts` — Exported `useAllNodes`.
- `PROJECT_STATE.md` — Documented WebGL 1.0 Cosmos engine, `react-native-webview`, and blur/focus lifecycle.

---

## 3. Git Commits in Step 13

| Commit Hash | Message | Scope |
|:---|:---|:---|
| `29345b5` | `chore(deps): configure svg, reanimated, and gesture-handler root for Cosmos view` | `react-native-svg` & `GestureHandlerRootView` root |
| `c2558d8` | `feat(data): add getAllNodes repository query and reactive useAllNodes hook` | `getAllNodes()` & `useAllNodes` hook |
| `2b920b3` | `feat(cosmos): add deterministic orbital layout engine and world-space hit-testing` | Initial layout utilities |
| `b834da2` | `feat(screen): implement interactive pinch-to-zoom Cosmos galaxy screen and tab` | Initial `cosmos` tab & inspector card |
| `d2f8832` | `docs: update PROJECT_STATE.md and add step-13 walkthrough` | Initial Step 13 docs |
| `eaf41ef` | `chore(deps): add react-native-webview for GPU-accelerated 3D Cosmos engine` | `react-native-webview` (`14.0.1`) |
| `1f2f9e7` | `feat(cosmos): build offline GPU-accelerated 3D Black Hole and Galaxy canvas engine` | Initial 2D Canvas engine |
| `c0f2463` | `feat(screen): connect CosmosScreen to 3D WebView engine with focus camera auto-reset` | WebView wiring & cleanup |
| `85867d8` | `docs: update PROJECT_STATE and step-13 walkthrough for 3D Cosmos engine` | Updated 3D docs |
| `61d954e` | `perf(cosmos): replace 2D canvas with 60fps WebGL 1.0 dotted-globe and 3D planet shader engine` | WebGL 1.0 shaders, Fibonacci globe & pooled labels |
| `564405a` | `feat(cosmos): pause WebGL loop on tab blur and auto-reset camera on focus` | `SET_ACTIVE` blur pause & focus camera reset |
| *(pending)* | `docs: update PROJECT_STATE and step-13 walkthrough for WebGL Cosmos engine` | Final WebGL docs & QA checklist |

---

## 4. Verification & Manual Testing Steps (Expo Go)

### TypeScript Verification
```bash
npx tsc --noEmit
```
*Result:* Passed with **0 errors**.

### Manual Expo Go QA Steps
1. **60 FPS Boot & Dotted Globe:** Open the **Cosmos** tab in Expo Go. Confirm smooth 60 FPS animation, `#04050A` deep space, rotating ~650-dot Fibonacci `"Me"` globe with crisp front dots & faded back hemisphere, tilted concentric orbital tracks, and 3D shader-lit spheres.
2. **Touch Responsiveness & Camera Orbit:**
   - Drag 1 finger -> instant 3D spherical rotation with smooth inertia damping.
   - Pinch 2 fingers -> smooth zoom in/out (`MIN_DIST`–`MAX_DIST`).
   - Double-tap anywhere -> smoothly resets back to the full concentric astrolabe view.
3. **Instant Tap Picking, Focus Dimming & Collision-Free Labels:**
   - Tap any Galaxy (`Entertainment`, `Food`, etc.) or planet -> instant `36px` selection, smooth fly-in, unrelated branches dim to `~0.22`, active orbit track & filaments brighten, labels appear cleanly without overlap, and `CosmosInspectorCard` opens cleanly at bottom.
   - Tap empty space -> immediately clears selection and closes the inspector card.
4. **Tab Blur Pause & Focus Auto-Reset:**
   - Zoom into an Entry, tap **Open Entry** -> edit in Detail -> press Back, OR switch to **Explorer** / **Search** / **Settings** and return to **Cosmos**. Confirm Explorer/Search/Settings run smoothly without background WebGL lag (`SET_ACTIVE: false`), and returning to **Cosmos** cleanly resets the camera to full centered view (`RESET_CAMERA`) with refreshed data.
