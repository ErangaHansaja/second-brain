import { Colors } from '@/theme/tokens';

/**
 * Payload sent from React Native to the offline 3D Cosmos Canvas WebView.
 */
export interface CosmosEngineNode {
  id: string;
  parentId: string | null;
  title: string;
  nodeType: 'folder' | 'entry';
  depth: number;
  color: string;
  rating: number | null;
  status: string | null;
  descendantCount: number;
}

/**
 * Generates a 100% offline, zero-CDN HTML5 3D Canvas engine for the Obsidian Cosmos view.
 */
export function buildCosmosHtml(): string {
  const voidHex = Colors.bg.void;
  const coreHex = Colors.tier.core;
  const galaxyHex = Colors.tier.galaxy;
  const solarHex = Colors.tier.solarSystem;
  const textPrimary = Colors.text.primary;
  const textSecondary = Colors.text.secondary;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: ${voidHex};
      touch-action: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      background-color: ${voidHex};
      touch-action: none;
    }
  </style>
</head>
<body>
  <canvas id="cosmos"></canvas>
  <script>
    (function () {
      'use strict';

      var VOID_HEX = ${JSON.stringify(voidHex)};
      var CORE_HEX = ${JSON.stringify(coreHex)};
      var GALAXY_HEX = ${JSON.stringify(galaxyHex)};
      var SOLAR_HEX = ${JSON.stringify(solarHex)};
      var TEXT_PRIMARY = ${JSON.stringify(textPrimary)};
      var TEXT_SECONDARY = ${JSON.stringify(textSecondary)};

      var canvas = document.getElementById('cosmos');
      var ctx = canvas.getContext('2d', { alpha: false });

      var width = window.innerWidth || 360;
      var height = window.innerHeight || 640;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);

      function resizeCanvas() {
        width = window.innerWidth || 360;
        height = window.innerHeight || 640;
        dpr = Math.min(window.devicePixelRatio || 1, 3);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // ── Utilities ────────────────────────────────────────────────
      function clamp(val, min, max) {
        return val < min ? min : val > max ? max : val;
      }

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return { r: 129, g: 140, b: 248 };
        var clean = hex.replace('#', '');
        if (clean.length === 3) {
          clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
        }
        var num = parseInt(clean, 16);
        if (isNaN(num)) return { r: 129, g: 140, b: 248 };
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      }

      function postToRN(payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (err) {
          // Ignore outside RN container
        }
      }

      // ── Pre-baked Radial Glow Sprites (GPU DrawImage Performance) ─
      var glowCache = {};
      function getGlowSprite(hex) {
        var key = hex || GALAXY_HEX;
        if (glowCache[key]) return glowCache[key];

        var size = 96;
        var off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        var octx = off.getContext('2d');
        var rgb = hexToRgb(key);
        var half = size / 2;

        var grad = octx.createRadialGradient(half, half, 0, half, half, half);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.18, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.85)');
        grad.addColorStop(0.45, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.28)');
        grad.addColorStop(0.75, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.06)');
        grad.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0)');

        octx.fillStyle = grad;
        octx.fillRect(0, 0, size, size);
        glowCache[key] = off;
        return off;
      }

      var whiteStarSprite = (function () {
        var size = 32;
        var off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        var octx = off.getContext('2d');
        var half = size / 2;
        var grad = octx.createRadialGradient(half, half, 0, half, half, half);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.35, 'rgba(242, 244, 248, 0.45)');
        grad.addColorStop(1, 'rgba(242, 244, 248, 0)');
        octx.fillStyle = grad;
        octx.fillRect(0, 0, size, size);
        return off;
      })();

      // ── Seeded PRNG for Deterministic Stars & Nebula ─────────────
      var seed = 0x5ec0bd1;
      function rand() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      }

      // 280+ 3D sphere stars around universe
      var stars = [];
      for (var s = 0; s < 290; s++) {
        var u = rand() * 2 - 1;
        var theta = rand() * Math.PI * 2;
        var rad = 900 + rand() * 650;
        var sinPhi = Math.sqrt(Math.max(0, 1 - u * u));
        stars.push({
          x: rad * sinPhi * Math.cos(theta),
          y: rad * u,
          z: rad * sinPhi * Math.sin(theta),
          size: 0.9 + rand() * 2.1,
          baseAlpha: 0.22 + rand() * 0.58,
          twinkleSpeed: 0.7 + rand() * 2.2,
          phase: rand() * Math.PI * 2,
          tint: s % 11 === 0 ? CORE_HEX : s % 7 === 0 ? SOLAR_HEX : TEXT_PRIMARY
        });
      }

      // 4 subtle parallax nebula clouds
      var nebulae = [
        { x: -340, y: -180, z: 480, r: 340, color: GALAXY_HEX, alpha: 0.055 },
        { x: 380, y: 150, z: 420, r: 320, color: SOLAR_HEX, alpha: 0.045 },
        { x: -240, y: 260, z: -460, r: 310, color: GALAXY_HEX, alpha: 0.045 },
        { x: 240, y: -220, z: -420, r: 280, color: CORE_HEX, alpha: 0.038 }
      ];

      // 340+ Keplerian accretion disk particles around central Black Hole (0, 0, 0)
      var accretion = [];
      for (var p = 0; p < 340; p++) {
        var rNorm = Math.pow(rand(), 1.45);
        var orbitR = 29 + rNorm * 46;
        var angle = rand() * Math.PI * 2;
        var yJitter = (rand() - 0.5) * (2.6 + rNorm * 4.5);
        var speed = 1.65 / Math.pow(orbitR / 29, 1.38);
        var particleColor =
          rNorm < 0.22 ? '#FFF4D6' : rNorm < 0.65 ? CORE_HEX : '#D97706';
        accretion.push({
          r: orbitR,
          angle: angle,
          yJitter: yJitter,
          speed: speed,
          size: 1.2 + (1 - rNorm) * 1.9 + rand() * 0.9,
          alpha: (0.42 + (1 - rNorm) * 0.48) * (0.7 + rand() * 0.3),
          color: particleColor
        });
      }

      // ── Camera & Interaction State ───────────────────────────────
      var MIN_ZOOM = 0.45;
      var MAX_ZOOM = 3.6;
      var DEFAULT_YAW = 0.28;
      var DEFAULT_PITCH = 0.46;

      var cam = {
        yaw: DEFAULT_YAW,
        pitch: DEFAULT_PITCH,
        zoom: 1.0,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        panX: 0,
        panY: 0,
        goalYaw: DEFAULT_YAW,
        goalPitch: DEFAULT_PITCH,
        goalZoom: 1.0,
        goalTargetX: 0,
        goalTargetY: 0,
        goalTargetZ: 0,
        goalPanX: 0,
        goalPanY: 0,
        velYaw: 0,
        velPitch: 0
      };

      // ── Universe Graph State ─────────────────────────────────────
      var bodyList = [];
      var bodyById = {};
      var parentById = {};
      var childrenById = {};
      var selectedId = null;
      var focusedSet = null;
      var projectedBodies = [];
      var driftTime = 0;
      var driftFactor = 1;
      var isTouching = false;

      function rebuildFocusedSet() {
        if (!selectedId || !bodyById[selectedId]) {
          focusedSet = null;
          return;
        }
        var set = {};
        set[selectedId] = true;

        // Walk ancestors up to root
        var cur = parentById[selectedId];
        var guard = 0;
        while (cur && guard < 32) {
          set[cur] = true;
          cur = parentById[cur];
          guard++;
        }

        // Include direct children
        var kids = childrenById[selectedId] || [];
        for (var k = 0; k < kids.length; k++) {
          set[kids[k]] = true;
        }
        focusedSet = set;
      }

      function computeNodeRadius(node) {
        if (node.depth === 0) return 22;
        if (node.nodeType === 'entry') {
          if (typeof node.rating === 'number' && isFinite(node.rating)) {
            var norm = (clamp(node.rating, 1, 10) - 1) / 9;
            return 5.5 + norm * 4.2;
          }
          return 6.8;
        }
        if (node.depth === 1) {
          return 12 + Math.min(node.descendantCount || 0, 18) * 0.42;
        }
        if (node.depth === 2) {
          return 8.5 + Math.min(node.descendantCount || 0, 10) * 0.28;
        }
        return 6.5 + Math.min(node.descendantCount || 0, 6) * 0.25;
      }

      function setUniverseNodes(rawNodes) {
        bodyList = [];
        bodyById = {};
        parentById = {};
        childrenById = {};

        if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
          selectedId = null;
          focusedSet = null;
          return;
        }

        var childrenMap = {};
        var rootNode = null;
        for (var i = 0; i < rawNodes.length; i++) {
          var n = rawNodes[i];
          if (n.depth === 0 || !n.parentId) {
            if (!rootNode) rootNode = n;
          } else {
            if (!childrenMap[n.parentId]) childrenMap[n.parentId] = [];
            childrenMap[n.parentId].push(n);
            parentById[n.id] = n.parentId;
          }
          if (!childrenById[n.id]) childrenById[n.id] = [];
          if (n.parentId) {
            if (!childrenById[n.parentId]) childrenById[n.parentId] = [];
            childrenById[n.parentId].push(n.id);
          }
        }
        if (!rootNode) rootNode = rawNodes[0];

        // Create Root Body at (0, 0, 0)
        var rootBody = {
          data: rootNode,
          radius: 22,
          color: CORE_HEX,
          wx: 0,
          wy: 0,
          wz: 0,
          parentId: null,
          orbitType: 'root',
          focusAlpha: 1,
          driftRadius: 0,
          baseAngle: 0,
          driftSpeed: 0,
          tiltX: 0,
          tiltZ: 0,
          localRadius: 0,
          localAngle: 0,
          localTilt: 0,
          localPlaneAngle: 0,
          localSpeed: 0
        };
        bodyList.push(rootBody);
        bodyById[rootBody.data.id] = rootBody;
        getGlowSprite(rootBody.color);

        // Place Depth 1 Galaxies on tilted primary 3D rings
        var galaxies = childrenMap[rootNode.id] || [];
        var gCount = galaxies.length;
        var galaxyOrbitR = gCount <= 5 ? 215 : gCount <= 8 ? 236 : 254;
        var queue = [];

        for (var g = 0; g < gCount; g++) {
          var gal = galaxies[g];
          var gAngle = -Math.PI / 2 + (g * Math.PI * 2) / gCount;
          var tiltPhase = g * 1.37;
          var galBody = {
            data: gal,
            radius: computeNodeRadius(gal),
            color: gal.color || GALAXY_HEX,
            wx: 0,
            wy: 0,
            wz: 0,
            parentId: rootBody.data.id,
            orbitType: 'galaxy',
            focusAlpha: 1,
            driftRadius: galaxyOrbitR + (g % 2 === 0 ? -10 : 12),
            baseAngle: gAngle,
            driftSpeed: 0.026,
            tiltX: Math.sin(tiltPhase) * 0.22,
            tiltZ: Math.cos(tiltPhase) * 0.16,
            localRadius: 0,
            localAngle: 0,
            localTilt: 0,
            localPlaneAngle: 0,
            localSpeed: 0
          };
          getGlowSprite(galBody.color);
          bodyList.push(galBody);
          bodyById[gal.id] = galBody;
          queue.push(galBody);
        }

        // Place Depth 2+ Systems & Planets around parents in tilted outward 3D arcs
        while (queue.length > 0) {
          var parentBody = queue.shift();
          var kids = childrenMap[parentBody.data.id] || [];
          var kCount = kids.length;
          if (kCount === 0) continue;

          var isGalaxy = parentBody.data.depth === 1;
          var localR = isGalaxy
            ? clamp(88 + Math.max(0, kCount - 2) * 5.5, 88, 108)
            : clamp(48 + Math.max(0, kCount - 2) * 4, 48, 66);

          // Outward angle baseline in xz plane
          var outAngle = parentBody.orbitType === 'galaxy'
            ? parentBody.baseAngle
            : Math.atan2(parentBody.localBaseWz || 0, parentBody.localBaseWx || 1);

          var span = isGalaxy
            ? Math.min(Math.PI * 1.48, (kCount - 1) * 0.78)
            : Math.min(Math.PI * 1.72, (kCount - 1) * 0.86);

          for (var c = 0; c < kCount; c++) {
            var child = kids[c];
            if (bodyById[child.id]) continue;

            var childAngle = kCount === 1
              ? outAngle
              : kCount >= 6 && !isGalaxy
                ? outAngle + (c * Math.PI * 2) / kCount
                : outAngle - span / 2 + (c * span) / (kCount - 1);

            var planeTilt = isGalaxy
              ? 0.36 + (c % 2 === 0 ? 0.14 : -0.12)
              : 0.45 + ((c % 3) - 1) * 0.22;

            var childBody = {
              data: child,
              radius: computeNodeRadius(child),
              color: child.color || GALAXY_HEX,
              wx: 0,
              wy: 0,
              wz: 0,
              parentId: parentBody.data.id,
              orbitType: isGalaxy ? 'solar' : 'satellite',
              focusAlpha: 1,
              driftRadius: 0,
              baseAngle: 0,
              driftSpeed: 0,
              tiltX: 0,
              tiltZ: 0,
              localRadius: localR,
              localAngle: childAngle,
              localTilt: planeTilt,
              localPlaneAngle: (c * 1.15) + parentBody.data.depth * 0.8,
              localSpeed: isGalaxy ? 0.018 : 0.025,
              localBaseWx: Math.cos(childAngle),
              localBaseWz: Math.sin(childAngle)
            };
            getGlowSprite(childBody.color);
            bodyList.push(childBody);
            bodyById[child.id] = childBody;
            queue.push(childBody);
          }
        }

        if (selectedId && !bodyById[selectedId]) {
          selectedId = null;
        }
        rebuildFocusedSet();
        updateWorldPositions();
      }

      function updateWorldPositions() {
        for (var i = 0; i < bodyList.length; i++) {
          var b = bodyList[i];
          if (b.orbitType === 'root') {
            b.wx = 0;
            b.wy = 0;
            b.wz = 0;
          } else if (b.orbitType === 'galaxy') {
            var ga = b.baseAngle + driftTime * b.driftSpeed;
            var rx = Math.cos(ga) * b.driftRadius;
            var rz = Math.sin(ga) * b.driftRadius;
            b.wx = rx;
            b.wz = rz;
            b.wy = rx * b.tiltZ + rz * b.tiltX;
          } else {
            var parent = bodyById[b.parentId];
            if (!parent) continue;
            var pa = b.localAngle + driftTime * b.localSpeed;
            var lx = Math.cos(pa) * b.localRadius;
            var lz = Math.sin(pa) * b.localRadius;
            var ly = Math.sin(pa + b.localPlaneAngle) * b.localRadius * Math.sin(b.localTilt);
            // Compress planar radius slightly to match 3D tilted ellipse
            var cosT = Math.cos(b.localTilt * 0.45);
            b.wx = parent.wx + lx;
            b.wz = parent.wz + lz * cosT;
            b.wy = parent.wy + ly;
          }
        }
      }

      // ── 3D Camera Projection ─────────────────────────────────────
      function projectPoint(wx, wy, wz, viewportScale) {
        var dx = wx - cam.targetX;
        var dy = wy - cam.targetY;
        var dz = wz - cam.targetZ;

        // Yaw around Y axis
        var cy = Math.cos(cam.yaw);
        var sy = Math.sin(cam.yaw);
        var x1 = dx * cy - dz * sy;
        var z1 = dx * sy + dz * cy;

        // Pitch around X axis
        var cp = Math.cos(cam.pitch);
        var sp = Math.sin(cam.pitch);
        var y2 = dy * cp - z1 * sp;
        var z2 = dy * sp + z1 * cp;

        var focalLength = 720;
        var camDist = 760 / Math.max(0.2, cam.zoom * viewportScale);
        var depthZ = camDist + z2;
        if (depthZ < 45) return null;

        var persp = focalLength / depthZ;
        var sx = width * 0.5 + cam.panX + x1 * persp;
        var syScreen = height * 0.5 + cam.panY + y2 * persp;

        return {
          sx: sx,
          sy: syScreen,
          z: depthZ,
          scale: persp
        };
      }

      // ── Focus Camera & Tap Helpers ───────────────────────────────
      function focusNode(nodeId) {
        var b = bodyById[nodeId];
        if (!b) return;
        selectedId = nodeId;
        rebuildFocusedSet();

        cam.goalTargetX = b.wx;
        cam.goalTargetY = b.wy;
        cam.goalTargetZ = b.wz;
        cam.goalPanX = 0;
        cam.goalPanY = 0;

        var desiredZoom =
          b.data.depth === 0
            ? 1.05
            : b.data.depth === 1
              ? 1.48
              : b.data.depth === 2
                ? 1.98
                : 2.45;
        cam.goalZoom = b.data.depth === 0 ? desiredZoom : Math.max(cam.goalZoom, desiredZoom);
        cam.velYaw = 0;
        cam.velPitch = 0;

        postToRN({ type: 'SELECT_NODE', nodeId: nodeId });
      }

      function clearSelection(notifyRN) {
        selectedId = null;
        focusedSet = null;
        if (notifyRN) {
          postToRN({ type: 'CLEAR_SELECTION' });
        }
      }

      function resetCamera(clearSel) {
        cam.goalYaw = DEFAULT_YAW;
        cam.goalPitch = DEFAULT_PITCH;
        cam.goalZoom = 1.0;
        cam.goalTargetX = 0;
        cam.goalTargetY = 0;
        cam.goalTargetZ = 0;
        cam.goalPanX = 0;
        cam.goalPanY = 0;
        cam.velYaw = 0;
        cam.velPitch = 0;
        if (clearSel) {
          selectedId = null;
          focusedSet = null;
        }
      }

      // ── Touch Gestures (Rotate, Pinch-Zoom, Pan, Tap, Double-Tap) ─
      var gesture = {
        mode: 'none',
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        startTime: 0,
        movedDist: 0,
        hadMultiTouch: false,
        pinchDist: 0,
        pinchMidX: 0,
        pinchMidY: 0
      };
      var pendingTapTimer = null;
      var lastTapTime = 0;
      var lastTapX = 0;
      var lastTapY = 0;

      function touchDistance(t1, t2) {
        var dx = t2.clientX - t1.clientX;
        var dy = t2.clientY - t1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function handleSingleTap(sx, sy) {
        var hit = null;
        var bestScore = Infinity;

        // Sort candidates closest to camera first, check within generous screen hit radius
        for (var i = 0; i < projectedBodies.length; i++) {
          var item = projectedBodies[i];
          var hitR = Math.max(item.screenRadius + 15, 24);
          var dist = Math.hypot(sx - item.sx, sy - item.sy);
          if (dist <= hitR) {
            var score = dist - (item.body.data.id === selectedId ? 4 : 0);
            if (score < bestScore) {
              bestScore = score;
              hit = item.body;
            }
          }
        }

        if (hit) {
          focusNode(hit.data.id);
        } else if (selectedId) {
          clearSelection(true);
        } else {
          postToRN({ type: 'CLEAR_SELECTION' });
        }
      }

      canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isTouching = true;

        if (e.touches.length === 1) {
          var t = e.touches[0];
          gesture.mode = 'drag';
          gesture.startX = t.clientX;
          gesture.startY = t.clientY;
          gesture.lastX = t.clientX;
          gesture.lastY = t.clientY;
          gesture.startTime = performance.now();
          gesture.movedDist = 0;
          gesture.hadMultiTouch = false;
          cam.velYaw = 0;
          cam.velPitch = 0;
        } else if (e.touches.length >= 2) {
          gesture.mode = 'pinch';
          gesture.hadMultiTouch = true;
          var t1 = e.touches[0];
          var t2 = e.touches[1];
          gesture.pinchDist = Math.max(10, touchDistance(t1, t2));
          gesture.pinchMidX = (t1.clientX + t2.clientX) * 0.5;
          gesture.pinchMidY = (t1.clientY + t2.clientY) * 0.5;
          cam.velYaw = 0;
          cam.velPitch = 0;
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (e.touches.length === 1 && gesture.mode === 'drag') {
          var t = e.touches[0];
          var dx = t.clientX - gesture.lastX;
          var dy = t.clientY - gesture.lastY;
          gesture.lastX = t.clientX;
          gesture.lastY = t.clientY;
          gesture.movedDist += Math.hypot(dx, dy);

          var dYaw = dx * 0.0062;
          var dPitch = dy * 0.0056;
          cam.goalYaw += dYaw;
          cam.yaw = cam.goalYaw;
          cam.goalPitch = clamp(cam.goalPitch + dPitch, -1.25, 1.25);
          cam.pitch = cam.goalPitch;
          cam.velYaw = dYaw;
          cam.velPitch = dPitch;
        } else if (e.touches.length >= 2) {
          gesture.mode = 'pinch';
          gesture.hadMultiTouch = true;
          var t1 = e.touches[0];
          var t2 = e.touches[1];
          var newDist = Math.max(10, touchDistance(t1, t2));
          var newMidX = (t1.clientX + t2.clientX) * 0.5;
          var newMidY = (t1.clientY + t2.clientY) * 0.5;

          var ratio = newDist / gesture.pinchDist;
          var nextZoom = clamp(cam.goalZoom * ratio, MIN_ZOOM, MAX_ZOOM);
          cam.goalZoom = nextZoom;
          cam.zoom = nextZoom;

          var panDx = newMidX - gesture.pinchMidX;
          var panDy = newMidY - gesture.pinchMidY;
          cam.goalPanX += panDx;
          cam.goalPanY += panDy;
          cam.panX = cam.goalPanX;
          cam.panY = cam.goalPanY;

          gesture.pinchDist = newDist;
          gesture.pinchMidX = newMidX;
          gesture.pinchMidY = newMidY;
        }
      }, { passive: false });

      canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (e.touches.length === 1) {
          // Transition cleanly from 2 fingers back to 1 finger without jump
          var rem = e.touches[0];
          gesture.mode = 'drag';
          gesture.lastX = rem.clientX;
          gesture.lastY = rem.clientY;
          gesture.hadMultiTouch = true;
          cam.velYaw = 0;
          cam.velPitch = 0;
          return;
        }

        if (e.touches.length === 0) {
          isTouching = false;
          var elapsed = performance.now() - gesture.startTime;

          if (!gesture.hadMultiTouch && gesture.movedDist < 11 && elapsed < 320) {
            var now = performance.now();
            var tapX = gesture.startX;
            var tapY = gesture.startY;
            var doubleTapDist = Math.hypot(tapX - lastTapX, tapY - lastTapY);

            if (now - lastTapTime < 220 && doubleTapDist < 34) {
              if (pendingTapTimer) {
                clearTimeout(pendingTapTimer);
                pendingTapTimer = null;
              }
              lastTapTime = 0;
              resetCamera(true);
              postToRN({ type: 'CLEAR_SELECTION' });
            } else {
              lastTapTime = now;
              lastTapX = tapX;
              lastTapY = tapY;
              if (pendingTapTimer) clearTimeout(pendingTapTimer);
              pendingTapTimer = setTimeout(function () {
                pendingTapTimer = null;
                handleSingleTap(tapX, tapY);
              }, 200);
            }
          }
          gesture.mode = 'none';
        }
      }, { passive: false });

      canvas.addEventListener('touchcancel', function () {
        isTouching = false;
        gesture.mode = 'none';
        cam.velYaw = 0;
        cam.velPitch = 0;
      });

      // ── React Native <-> WebView Message Bridge ──────────────────
      function handleIncomingMessage(event) {
        var raw = event && event.data;
        if (!raw || typeof raw !== 'string') return;
        var msg;
        try {
          msg = JSON.parse(raw);
        } catch (err) {
          return;
        }
        if (!msg || !msg.type) return;

        if (msg.type === 'SET_DATA') {
          setUniverseNodes(msg.nodes || []);
        } else if (msg.type === 'ZOOM_IN') {
          cam.goalZoom = clamp(cam.goalZoom * 1.35, MIN_ZOOM, MAX_ZOOM);
        } else if (msg.type === 'ZOOM_OUT') {
          cam.goalZoom = clamp(cam.goalZoom / 1.35, MIN_ZOOM, MAX_ZOOM);
        } else if (msg.type === 'RESET_CAMERA') {
          resetCamera(true);
        } else if (msg.type === 'CLEAR_SELECTION') {
          clearSelection(false);
        }
      }

      window.addEventListener('message', handleIncomingMessage);
      document.addEventListener('message', handleIncomingMessage);

      // ── Main 60 FPS Render Loop ──────────────────────────────────
      var lastFrameTime = performance.now();

      function render(now) {
        var dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
        lastFrameTime = now;

        // Smooth orbital drift pause when interacting or inspecting
        var targetDrift = (isTouching || selectedId !== null) ? 0 : 1;
        driftFactor = lerp(driftFactor, targetDrift, 1 - Math.exp(-5 * dt));
        driftTime += dt * driftFactor;

        // Angular inertia after drag release
        if (!isTouching && gesture.mode !== 'drag') {
          if (Math.abs(cam.velYaw) > 0.0001 || Math.abs(cam.velPitch) > 0.0001) {
            cam.goalYaw += cam.velYaw;
            cam.goalPitch = clamp(cam.goalPitch + cam.velPitch, -1.25, 1.25);
            cam.velYaw *= 0.91;
            cam.velPitch *= 0.91;
          }
        }

        // Smooth camera interpolation
        var camEase = 1 - Math.exp(-9 * dt);
        cam.yaw = lerp(cam.yaw, cam.goalYaw, camEase);
        cam.pitch = lerp(cam.pitch, cam.goalPitch, camEase);
        cam.zoom = lerp(cam.zoom, cam.goalZoom, camEase);
        cam.targetX = lerp(cam.targetX, cam.goalTargetX, camEase);
        cam.targetY = lerp(cam.targetY, cam.goalTargetY, camEase);
        cam.targetZ = lerp(cam.targetZ, cam.goalTargetZ, camEase);
        cam.panX = lerp(cam.panX, cam.goalPanX, camEase);
        cam.panY = lerp(cam.panY, cam.goalPanY, camEase);

        // If a body is selected, keep camera smoothly tracking its world position
        if (selectedId && bodyById[selectedId]) {
          var selBody = bodyById[selectedId];
          cam.goalTargetX = selBody.wx;
          cam.goalTargetY = selBody.wy;
          cam.goalTargetZ = selBody.wz;
        }

        updateWorldPositions();

        // Viewport-adaptive fit scale so 360px phones frame the galaxy cleanly
        var viewportScale = Math.min(width, height * 0.86) / 535;
        var timeSec = now * 0.001;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = VOID_HEX;
        ctx.fillRect(0, 0, width, height);

        // 1. Subtle 3D Parallax Nebula Dust
        ctx.globalCompositeOperation = 'lighter';
        for (var nb = 0; nb < nebulae.length; nb++) {
          var nItem = nebulae[nb];
          var cyN = Math.cos(cam.yaw * 0.55);
          var syN = Math.sin(cam.yaw * 0.55);
          var cpN = Math.cos(cam.pitch * 0.55);
          var spN = Math.sin(cam.pitch * 0.55);
          var nx1 = nItem.x * cyN - nItem.z * syN;
          var nz1 = nItem.x * syN + nItem.z * cyN;
          var ny2 = nItem.y * cpN - nz1 * spN;
          var nsx = width * 0.5 + nx1 * 0.65 + cam.panX * 0.25;
          var nsy = height * 0.5 + ny2 * 0.65 + cam.panY * 0.25;
          var nSprite = getGlowSprite(nItem.color);
          ctx.globalAlpha = nItem.alpha;
          ctx.drawImage(nSprite, nsx - nItem.r, nsy - nItem.r, nItem.r * 2, nItem.r * 2);
        }

        // 2. 3D Parallax Twinkling Starfield
        var cyS = Math.cos(cam.yaw);
        var syS = Math.sin(cam.yaw);
        var cpS = Math.cos(cam.pitch);
        var spS = Math.sin(cam.pitch);
        for (var i = 0; i < stars.length; i++) {
          var st = stars[i];
          var sx1 = st.x * cyS - st.z * syS;
          var sz1 = st.x * syS + st.z * cyS;
          var sy2 = st.y * cpS - sz1 * spS;
          var sz2 = st.y * spS + sz1 * cpS;
          var starDepth = 1300 + sz2;
          if (starDepth < 150) continue;
          var sScale = 720 / starDepth;
          var psx = width * 0.5 + sx1 * sScale + cam.panX * 0.12;
          var psy = height * 0.5 + sy2 * sScale + cam.panY * 0.12;
          if (psx < -20 || psx > width + 20 || psy < -20 || psy > height + 20) continue;

          var twinkle = 0.62 + 0.38 * Math.sin(timeSec * st.twinkleSpeed + st.phase);
          ctx.globalAlpha = st.baseAlpha * twinkle;
          var starR = st.size * (0.85 + 0.3 * sScale);
          if (st.tint === TEXT_PRIMARY) {
            ctx.drawImage(whiteStarSprite, psx - starR * 2, psy - starR * 2, starR * 4, starR * 4);
          } else {
            var spSprite = getGlowSprite(st.tint);
            ctx.drawImage(spSprite, psx - starR * 2.4, psy - starR * 2.4, starR * 4.8, starR * 4.8);
          }
        }

        // 3. Project all Universe Bodies & Build Render Queue
        projectedBodies = [];
        var projById = {};
        for (var b = 0; b < bodyList.length; b++) {
          var body = bodyList[b];
          var targetFocus =
            !focusedSet || focusedSet[body.data.id] ? 1.0 : 0.2;
          body.focusAlpha = lerp(body.focusAlpha, targetFocus, 1 - Math.exp(-10 * dt));

          var pRes = projectPoint(body.wx, body.wy, body.wz, viewportScale);
          if (!pRes) continue;
          var screenRadius = Math.max(2.6, body.radius * pRes.scale);
          var entryProj = {
            body: body,
            sx: pRes.sx,
            sy: pRes.sy,
            z: pRes.z,
            scale: pRes.scale,
            screenRadius: screenRadius
          };
          projectedBodies.push(entryProj);
          projById[body.data.id] = entryProj;
        }

        // Sort back-to-front by camera Z (largest Z first)
        projectedBodies.sort(function (a, b) {
          return b.z - a.z;
        });

        // 4. Luminous Parent-Child Energy Filaments
        ctx.globalCompositeOperation = 'lighter';
        for (var eIdx = 0; eIdx < projectedBodies.length; eIdx++) {
          var childP = projectedBodies[eIdx];
          if (!childP.body.parentId) continue;
          var parentP = projById[childP.body.parentId];
          if (!parentP) continue;

          var isHighlightedEdge =
            focusedSet &&
            focusedSet[childP.body.data.id] &&
            focusedSet[parentP.body.data.id];

          var edgeAlpha = focusedSet
            ? isHighlightedEdge
              ? 0.56
              : 0.08
            : childP.body.data.depth === 1
              ? 0.26
              : 0.18;

          var grad = ctx.createLinearGradient(
            parentP.sx,
            parentP.sy,
            childP.sx,
            childP.sy
          );
          var cRgb = hexToRgb(childP.body.color);
          var pRgb = hexToRgb(parentP.body.color);
          grad.addColorStop(0, 'rgba(' + pRgb.r + ',' + pRgb.g + ',' + pRgb.b + ',' + (edgeAlpha * 0.65) + ')');
          grad.addColorStop(1, 'rgba(' + cRgb.r + ',' + cRgb.g + ',' + cRgb.b + ',' + edgeAlpha + ')');

          ctx.globalAlpha = 1;
          ctx.strokeStyle = grad;
          ctx.lineWidth = isHighlightedEdge ? 1.5 : childP.body.data.depth === 1 ? 1.15 : 0.85;
          ctx.beginPath();
          ctx.moveTo(parentP.sx, parentP.sy);
          ctx.lineTo(childP.sx, childP.sy);
          ctx.stroke();
        }

        // 5. Project Accretion Disk Particles around Core (0, 0, 0)
        var coreProj = null;
        for (var cpIdx = 0; cpIdx < projectedBodies.length; cpIdx++) {
          if (projectedBodies[cpIdx].body.orbitType === 'root') {
            coreProj = projectedBodies[cpIdx];
            break;
          }
        }
        var coreZ = coreProj ? coreProj.z : 1e9;
        var frontAccretion = [];
        var backAccretion = [];

        if (coreProj) {
          var diskTilt = 0.19;
          var cosDT = Math.cos(diskTilt);
          var sinDT = Math.sin(diskTilt);

          for (var ap = 0; ap < accretion.length; ap++) {
            var part = accretion[ap];
            var pa = part.angle + timeSec * part.speed;
            var ax = Math.cos(pa) * part.r;
            var az = Math.sin(pa) * part.r;
            var ay = part.yJitter + az * sinDT;
            var azTilted = az * cosDT;

            var apProj = projectPoint(ax, ay, azTilted, viewportScale);
            if (!apProj) continue;

            var item = {
              sx: apProj.sx,
              sy: apProj.sy,
              z: apProj.z,
              r: part.size * apProj.scale,
              alpha: part.alpha * coreProj.body.focusAlpha,
              color: part.color
            };

            if (apProj.z > coreZ) {
              backAccretion.push(item);
            } else {
              frontAccretion.push(item);
            }
          }
        }

        function drawAccretionList(list) {
          ctx.globalCompositeOperation = 'lighter';
          for (var k = 0; k < list.length; k++) {
            var d = list[k];
            var spr = getGlowSprite(d.color);
            var drawR = Math.max(1.8, d.r * 2.1);
            ctx.globalAlpha = d.alpha;
            ctx.drawImage(spr, d.sx - drawR, d.sy - drawR, drawR * 2, drawR * 2);
          }
        }

        // Draw back half of accretion disk before black hole & bodies behind it
        if (backAccretion.length > 0) {
          drawAccretionList(backAccretion);
        }

        // 6. Render Z-sorted Celestial Bodies
        var coreDrawn = false;
        for (var idx = 0; idx < projectedBodies.length; idx++) {
          var pBody = projectedBodies[idx];
          var bData = pBody.body;
          var isSelected = selectedId === bData.data.id;
          var alpha = bData.focusAlpha;

          if (bData.orbitType === 'root') {
            coreDrawn = true;
            var coreR = pBody.screenRadius;

            // Gravitational Lensing & Event Horizon Bloom
            ctx.globalCompositeOperation = 'lighter';
            var coreGlow = getGlowSprite(CORE_HEX);
            var bloomR = coreR * 3.1;
            ctx.globalAlpha = 0.58 * alpha;
            ctx.drawImage(coreGlow, pBody.sx - bloomR, pBody.sy - bloomR, bloomR * 2, bloomR * 2);

            // Pitch-black Singularity Sphere occluding background accretion
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.fillStyle = VOID_HEX;
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, coreR * 0.94, 0, Math.PI * 2);
            ctx.fill();

            // Photon Sphere Crisp Rim
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = CORE_HEX;
            ctx.globalAlpha = (isSelected ? 0.98 : 0.78) * alpha;
            ctx.lineWidth = isSelected ? 2.2 : 1.5;
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, coreR, 0, Math.PI * 2);
            ctx.stroke();

            if (isSelected) {
              ctx.globalAlpha = 0.45;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(pBody.sx, pBody.sy, coreR + 7, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Front half of swirling accretion disk passes cleanly in front of Singularity
            if (frontAccretion.length > 0) {
              drawAccretionList(frontAccretion);
            }
            continue;
          }

          // Orbiting Galaxies, Solar Systems, Planets & Entries
          var bodyR = pBody.screenRadius;
          var isFolder = bData.data.nodeType === 'folder';
          var sprite = getGlowSprite(bData.color);
          var haloR = bodyR * (isSelected ? 3.2 : isFolder ? 2.6 : 2.3);

          // Soft additive cosmic bloom
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (isSelected ? 0.85 : isFolder ? 0.55 : 0.48) * alpha;
          ctx.drawImage(sprite, pBody.sx - haloR, pBody.sy - haloR, haloR * 2, haloR * 2);

          // Crisp obsidian body fill + luminous inner core
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = alpha;
          if (isFolder) {
            ctx.fillStyle = VOID_HEX;
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, bodyR * 0.88, 0, Math.PI * 2);
            ctx.fill();

            var fRgb = hexToRgb(bData.color);
            ctx.fillStyle = 'rgba(' + fRgb.r + ',' + fRgb.g + ',' + fRgb.b + ',' + (0.28 * alpha) + ')';
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, bodyR * 0.88, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = bData.color;
            ctx.lineWidth = isSelected ? 2.1 : 1.4;
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, bodyR, 0, Math.PI * 2);
            ctx.stroke();

            if ((bData.data.descendantCount || 0) > 0) {
              ctx.fillStyle = bData.color;
              ctx.beginPath();
              ctx.arc(pBody.sx, pBody.sy, Math.max(1.8, bodyR * 0.22), 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = bData.color;
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, bodyR, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.65 * alpha;
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, Math.max(1.4, bodyR * 0.36), 0, Math.PI * 2);
            ctx.fill();
          }

          if (isSelected) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = CORE_HEX;
            ctx.globalAlpha = 0.72;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(pBody.sx, pBody.sy, bodyR + 5.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        if (!coreDrawn && frontAccretion.length > 0) {
          drawAccretionList(frontAccretion);
        }

        // 7. Collision-Free Priority-Sorted Crisp Labels
        ctx.globalCompositeOperation = 'source-over';
        var labelCandidates = [];
        for (var l = 0; l < projectedBodies.length; l++) {
          var lp = projectedBodies[l];
          var lNode = lp.body.data;
          var isFocusedNode = focusedSet && focusedSet[lNode.id];
          var showByZoom =
            lNode.depth <= 1 ||
            isFocusedNode ||
            (lNode.depth === 2 && cam.zoom >= 0.92) ||
            (lNode.depth >= 3 && cam.zoom >= 1.45);

          if (!showByZoom) continue;
          if (lp.sx < -40 || lp.sx > width + 40 || lp.sy < 52 || lp.sy > height - 20) continue;

          var priority = 100 - lNode.depth * 25 - lp.z * 0.01;
          if (lNode.id === selectedId) priority += 1000;
          else if (isFocusedNode) priority += 700;
          else if (lNode.depth === 0) priority += 550;
          else if (lNode.depth === 1) priority += 400;

          labelCandidates.push({
            proj: lp,
            priority: priority,
            isFocused: Boolean(isFocusedNode)
          });
        }

        labelCandidates.sort(function (a, b) {
          return b.priority - a.priority;
        });

        var placedBoxes = [];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (var cIdx = 0; cIdx < labelCandidates.length; cIdx++) {
          var cand = labelCandidates[cIdx];
          var pItem = cand.proj;
          var nData = pItem.body.data;
          var isSel = nData.id === selectedId;
          var fontSize = nData.depth <= 1 ? 11.5 : 10.5;
          var fontWeight = nData.depth <= 1 || isSel ? '600' : '500';
          ctx.font = fontWeight + ' ' + fontSize + 'px -apple-system, BlinkMacSystemFont, Roboto, sans-serif';

          var labelText = nData.title || '';
          if (labelText.length > 20) {
            labelText = labelText.slice(0, 19) + '…';
          }

          var textW = ctx.measureText(labelText).width;
          var lx = clamp(pItem.sx, textW * 0.5 + 10, width - textW * 0.5 - 10);
          var ly = pItem.sy + pItem.screenRadius + 6;
          if (ly + 16 > height - 12) continue;

          var box = {
            left: lx - textW * 0.5 - 6,
            right: lx + textW * 0.5 + 6,
            top: ly - 3,
            bottom: ly + fontSize + 5
          };

          var overlaps = false;
          for (var pb = 0; pb < placedBoxes.length; pb++) {
            var ob = placedBoxes[pb];
            if (
              box.left < ob.right &&
              box.right > ob.left &&
              box.top < ob.bottom &&
              box.bottom > ob.top
            ) {
              overlaps = true;
              break;
            }
          }
          if (!overlaps && !isSel) {
            for (var hc = 0; hc < cIdx; hc++) {
              var otherProj = labelCandidates[hc].proj;
              var cr = otherProj.screenRadius + 3;
              if (
                box.left < otherProj.sx + cr &&
                box.right > otherProj.sx - cr &&
                box.top < otherProj.sy + cr &&
                box.bottom > otherProj.sy - cr
              ) {
                overlaps = true;
                break;
              }
            }
          }
          if (overlaps && !isSel) continue;

          placedBoxes.push(box);

          ctx.globalAlpha = pItem.body.focusAlpha;
          ctx.shadowColor = VOID_HEX;
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = isSel
            ? CORE_HEX
            : nData.depth === 0
              ? CORE_HEX
              : nData.depth === 1 || cand.isFocused
                ? TEXT_PRIMARY
                : TEXT_SECONDARY;
          ctx.fillText(labelText, lx, ly);
          ctx.shadowBlur = 0;
        }

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
      postToRN({ type: 'READY' });
    })();
  </script>
</body>
</html>`;
}
