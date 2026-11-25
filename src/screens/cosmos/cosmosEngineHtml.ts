import { Colors } from '@/theme/tokens';

/**
 * Payload sent from React Native to the offline 3D Cosmos WebGL WebView.
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
 * Generates a 100% offline, zero-dependency WebGL 1.0 GPU shader star-system engine
 * inspired by a minimalist 3D dotted-globe astrolabe.
 */
export function buildCosmosHtml(): string {
  const voidHex = Colors.bg.void;

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
    #labels {
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .cosmos-label {
      position: absolute;
      left: 0;
      top: 0;
      font-family: Menlo, ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 10.5px;
      line-height: 13px;
      letter-spacing: 0.2px;
      color: #D6D8E1;
      white-space: nowrap;
      text-shadow: 0 1px 4px #04050A, 0 0 8px #04050A;
      will-change: transform, opacity;
      pointer-events: none;
      display: none;
    }
    .cosmos-label.major {
      font-size: 11px;
      font-weight: 600;
      color: #EAE6DF;
    }
    .cosmos-label.selected {
      font-size: 11.5px;
      font-weight: 700;
      color: #E6B36A;
    }
  </style>
</head>
<body>
  <canvas id="gl"></canvas>
  <div id="labels"></div>
  <script>
    (function () {
      'use strict';

      var canvas = document.getElementById('gl');
      var labelsRoot = document.getElementById('labels');
      var gl = canvas.getContext('webgl', {
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });

      function postToRN(payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (e) {
          // Ignore outside React Native WebView
        }
      }

      if (!gl) {
        postToRN({ type: 'READY' });
        return;
      }

      // ── Viewport & DPR (capped at 2 for mobile GPU perf) ─────────
      var width = window.innerWidth || 360;
      var height = window.innerHeight || 640;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);

      function resizeCanvas() {
        width = window.innerWidth || 360;
        height = window.innerHeight || 640;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      var ptRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || [1, 64];
      var maxPointSize = Math.max(32, ptRange[1] || 64);

      // ── Palette Constants (Minimalist Monochrome + Sand-Obsidian) ──
      var PALETTE = {
        coreWhite: [0.918, 0.902, 0.875],   // #EAE6DF warm off-white
        sandAmber: [0.902, 0.702, 0.416],   // #E6B36A subtle sand/amber
        mutedSky:  [0.408, 0.710, 0.910],   // #68B5E8 muted sky
        softMint:  [0.322, 0.780, 0.690],   // #52C7B0 soft mint
        mutedRose: [0.851, 0.408, 0.478],   // #D9687A muted rose
        softViolet:[0.584, 0.612, 0.922]    // #959CEB soft violet
      };

      var GALAXY_ACCENTS = [
        PALETTE.softViolet,
        PALETTE.mutedSky,
        PALETTE.softMint,
        PALETTE.sandAmber,
        PALETTE.coreWhite
      ];

      function clamp(v, min, max) {
        return v < min ? min : v > max ? max : v;
      }

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function resolveRefinedRgb(node, galaxyIndex) {
        if (node.depth === 0) return PALETTE.coreWhite;
        if (node.nodeType === 'entry') {
          if (node.status === 'planned') return PALETTE.mutedSky;
          if (node.status === 'in_progress') return PALETTE.sandAmber;
          if (node.status === 'completed') return PALETTE.softMint;
          if (node.status === 'dropped') return PALETTE.mutedRose;
          return PALETTE.sandAmber;
        }
        if (node.depth === 1) {
          return GALAXY_ACCENTS[galaxyIndex % GALAXY_ACCENTS.length];
        }
        if (node.depth === 2) return PALETTE.mutedSky;
        if (node.depth === 3) return PALETTE.softMint;
        return PALETTE.coreWhite;
      }

      // ── GLSL Shader Compilation Helpers ──────────────────────────
      var PREC = '#ifdef GL_FRAGMENT_PRECISION_HIGH\\nprecision highp float;\\n#else\\nprecision mediump float;\\n#endif\\n';

      function compileShader(type, src) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
      }

      function createProgram(vsSrc, fsSrc) {
        var prog = gl.createProgram();
        gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSrc));
        gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSrc));
        gl.linkProgram(prog);
        return prog;
      }

      // ── Program 1: Deep 3D Starfield ─────────────────────────────
      var starProg = createProgram(
        'attribute vec3 aPos;\\n' +
        'attribute float aSize;\\n' +
        'attribute float aAlpha;\\n' +
        'uniform mat4 uRotProj;\\n' +
        'uniform float uDpr;\\n' +
        'uniform float uMaxPt;\\n' +
        'varying float vAlpha;\\n' +
        'void main() {\\n' +
        '  vAlpha = aAlpha;\\n' +
        '  gl_Position = uRotProj * vec4(aPos, 1.0);\\n' +
        '  gl_PointSize = min(uMaxPt, aSize * uDpr);\\n' +
        '}',
        PREC +
        'varying float vAlpha;\\n' +
        'void main() {\\n' +
        '  vec2 p = gl_PointCoord * 2.0 - 1.0;\\n' +
        '  float d = length(p);\\n' +
        '  if (d > 1.0) discard;\\n' +
        '  float a = smoothstep(1.0, 0.15, d) * vAlpha;\\n' +
        '  gl_FragColor = vec4(0.918, 0.902, 0.875, a);\\n' +
        '}'
      );

      // ── Program 2: Central Dotted Fibonacci Globe ────────────────
      var globeProg = createProgram(
        'attribute vec3 aPos;\\n' +
        'uniform mat4 uMvp;\\n' +
        'uniform mat4 uView;\\n' +
        'uniform float uGlobeAngle;\\n' +
        'uniform float uDpr;\\n' +
        'uniform float uMaxPt;\\n' +
        'uniform float uFocusAlpha;\\n' +
        'varying float vAlpha;\\n' +
        'void main() {\\n' +
        '  float ca = cos(uGlobeAngle);\\n' +
        '  float sa = sin(uGlobeAngle);\\n' +
        '  vec3 rotPos = vec3(aPos.x * ca - aPos.z * sa, aPos.y, aPos.x * sa + aPos.z * ca);\\n' +
        '  vec4 viewPos = uView * vec4(rotPos, 1.0);\\n' +
        '  vec3 viewCenter = (uView * vec4(0.0, 0.0, 0.0, 1.0)).xyz;\\n' +
        '  vec3 normView = normalize(viewPos.xyz - viewCenter);\\n' +
        '  float facing = clamp(normView.z * 0.5 + 0.5, 0.0, 1.0);\\n' +
        '  vAlpha = mix(0.14, 0.95, pow(facing, 1.35)) * uFocusAlpha;\\n' +
        '  gl_Position = uMvp * vec4(rotPos, 1.0);\\n' +
        '  float sizeFactor = mix(1.75, 2.65, facing);\\n' +
        '  gl_PointSize = min(uMaxPt, sizeFactor * uDpr);\\n' +
        '}',
        PREC +
        'varying float vAlpha;\\n' +
        'void main() {\\n' +
        '  vec2 p = gl_PointCoord * 2.0 - 1.0;\\n' +
        '  float d = length(p);\\n' +
        '  if (d > 1.0) discard;\\n' +
        '  float edge = 1.0 - smoothstep(0.55, 1.0, d);\\n' +
        '  gl_FragColor = vec4(0.918, 0.902, 0.875, edge * vAlpha);\\n' +
        '}'
      );

      // ── Program 3: Concentric Orbit Rings & Filaments ────────────
      var lineProg = createProgram(
        'attribute vec3 aPos;\\n' +
        'attribute vec3 aColor;\\n' +
        'attribute float aAlpha;\\n' +
        'uniform mat4 uMvp;\\n' +
        'varying vec3 vColor;\\n' +
        'varying float vAlpha;\\n' +
        'void main() {\\n' +
        '  vColor = aColor;\\n' +
        '  vAlpha = aAlpha;\\n' +
        '  gl_Position = uMvp * vec4(aPos, 1.0);\\n' +
        '}',
        PREC +
        'varying vec3 vColor;\\n' +
        'varying float vAlpha;\\n' +
        'void main() {\\n' +
        '  gl_FragColor = vec4(vColor, vAlpha);\\n' +
        '}'
      );

      // ── Program 4: Procedural Ray-Sphere 3D Lit Planets ──────────
      var planetProg = createProgram(
        'attribute vec3 aPos;\\n' +
        'attribute vec3 aColor;\\n' +
        'attribute float aRadius;\\n' +
        'attribute float aAlpha;\\n' +
        'attribute float aSelected;\\n' +
        'uniform mat4 uMvp;\\n' +
        'uniform mat3 uViewRot;\\n' +
        'uniform float uProjScaleY;\\n' +
        'uniform float uViewportH;\\n' +
        'uniform float uDpr;\\n' +
        'uniform float uMaxPt;\\n' +
        'varying vec3 vColor;\\n' +
        'varying float vAlpha;\\n' +
        'varying float vSelected;\\n' +
        'varying vec3 vLightDir;\\n' +
        'void main() {\\n' +
        '  vColor = aColor;\\n' +
        '  vAlpha = aAlpha;\\n' +
        '  vSelected = aSelected;\\n' +
        '  vec3 toCore = length(aPos) > 0.001 ? normalize(-aPos) : vec3(0.0, 0.5, 0.86);\\n' +
        '  vLightDir = normalize(uViewRot * toCore * 0.72 + vec3(-0.35, 0.45, 0.52));\\n' +
        '  gl_Position = uMvp * vec4(aPos, 1.0);\\n' +
        '  float w = max(gl_Position.w, 1.0);\\n' +
        '  float cssDiam = (2.0 * (aRadius / 0.62) * uProjScaleY / w) * (uViewportH * 0.5);\\n' +
        '  gl_PointSize = clamp(cssDiam * uDpr, 6.0 * uDpr, uMaxPt);\\n' +
        '}',
        PREC +
        'varying vec3 vColor;\\n' +
        'varying float vAlpha;\\n' +
        'varying float vSelected;\\n' +
        'varying vec3 vLightDir;\\n' +
        'void main() {\\n' +
        '  vec2 p = gl_PointCoord * 2.0 - 1.0;\\n' +
        '  float r = length(p);\\n' +
        '  if (r > 1.0) discard;\\n' +
        '  float sphereR = 0.62;\\n' +
        '  vec3 haloCol = mix(vColor, vec3(0.918, 0.902, 0.875), vSelected * 0.45);\\n' +
        '  if (r <= sphereR) {\\n' +
        '    vec2 sp = p / sphereR;\\n' +
        '    float z = sqrt(max(0.0, 1.0 - dot(sp, sp)));\\n' +
        '    vec3 n = vec3(sp.x, -sp.y, z);\\n' +
        '    vec3 l = normalize(vLightDir);\\n' +
        '    float diff = max(dot(n, l), 0.0);\\n' +
        '    float ambient = 0.25;\\n' +
        '    float fresnel = pow(1.0 - max(n.z, 0.0), 2.3);\\n' +
        '    vec3 halfV = normalize(l + vec3(0.0, 0.0, 1.0));\\n' +
        '    float spec = pow(max(dot(n, halfV), 0.0), 22.0) * 0.36;\\n' +
        '    vec3 rimCol = vec3(0.918, 0.902, 0.875);\\n' +
        '    vec3 shaded = vColor * (ambient + diff * 0.92) + rimCol * (spec + fresnel * (0.28 + vSelected * 0.55));\\n' +
        '    float aa = 1.0 - smoothstep(sphereR - 0.045, sphereR, r);\\n' +
        '    float haloT = 1.0 - smoothstep(sphereR - 0.02, 1.0, r);\\n' +
        '    float haloA = haloT * haloT * (0.22 + vSelected * 0.34);\\n' +
        '    vec3 col = mix(haloCol, shaded, aa);\\n' +
        '    gl_FragColor = vec4(col, max(aa, haloA) * vAlpha);\\n' +
        '  } else {\\n' +
        '    float t = 1.0 - smoothstep(sphereR, 1.0, r);\\n' +
        '    float haloA = t * t * (0.22 + vSelected * 0.34) * vAlpha;\\n' +
        '    gl_FragColor = vec4(haloCol, haloA);\\n' +
        '  }\\n' +
        '}'
      );

      // ── Cache Shader Attribute & Uniform Locations ───────────────
      var starLoc = {
        aPos: gl.getAttribLocation(starProg, 'aPos'),
        aSize: gl.getAttribLocation(starProg, 'aSize'),
        aAlpha: gl.getAttribLocation(starProg, 'aAlpha'),
        uRotProj: gl.getUniformLocation(starProg, 'uRotProj'),
        uDpr: gl.getUniformLocation(starProg, 'uDpr'),
        uMaxPt: gl.getUniformLocation(starProg, 'uMaxPt')
      };

      var globeLoc = {
        aPos: gl.getAttribLocation(globeProg, 'aPos'),
        uMvp: gl.getUniformLocation(globeProg, 'uMvp'),
        uView: gl.getUniformLocation(globeProg, 'uView'),
        uGlobeAngle: gl.getUniformLocation(globeProg, 'uGlobeAngle'),
        uDpr: gl.getUniformLocation(globeProg, 'uDpr'),
        uMaxPt: gl.getUniformLocation(globeProg, 'uMaxPt'),
        uFocusAlpha: gl.getUniformLocation(globeProg, 'uFocusAlpha')
      };

      var lineLoc = {
        aPos: gl.getAttribLocation(lineProg, 'aPos'),
        aColor: gl.getAttribLocation(lineProg, 'aColor'),
        aAlpha: gl.getAttribLocation(lineProg, 'aAlpha'),
        uMvp: gl.getUniformLocation(lineProg, 'uMvp')
      };

      var planetLoc = {
        aPos: gl.getAttribLocation(planetProg, 'aPos'),
        aColor: gl.getAttribLocation(planetProg, 'aColor'),
        aRadius: gl.getAttribLocation(planetProg, 'aRadius'),
        aAlpha: gl.getAttribLocation(planetProg, 'aAlpha'),
        aSelected: gl.getAttribLocation(planetProg, 'aSelected'),
        uMvp: gl.getUniformLocation(planetProg, 'uMvp'),
        uViewRot: gl.getUniformLocation(planetProg, 'uViewRot'),
        uProjScaleY: gl.getUniformLocation(planetProg, 'uProjScaleY'),
        uViewportH: gl.getUniformLocation(planetProg, 'uViewportH'),
        uDpr: gl.getUniformLocation(planetProg, 'uDpr'),
        uMaxPt: gl.getUniformLocation(planetProg, 'uMaxPt')
      };

      // ── Matrix Math (Column-major 4x4 Float32Arrays) ─────────────
      var matView = new Float32Array(16);
      var matProj = new Float32Array(16);
      var matMvp = new Float32Array(16);
      var matRotOnlyView = new Float32Array(16);
      var matRotProj = new Float32Array(16);
      var matViewRot3 = new Float32Array(9);

      function multiplyMat4(out, a, b) {
        for (var c = 0; c < 4; c++) {
          var b0 = b[c * 4];
          var b1 = b[c * 4 + 1];
          var b2 = b[c * 4 + 2];
          var b3 = b[c * 4 + 3];
          out[c * 4]     = a[0] * b0 + a[4] * b1 + a[8]  * b2 + a[12] * b3;
          out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9]  * b2 + a[13] * b3;
          out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
          out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
        }
      }

      function buildCameraMatrices(eyeX, eyeY, eyeZ, tx, ty, tz, fovRad, aspect, near, far) {
        // zAxis = normalize(eye - target)
        var zx = eyeX - tx;
        var zy = eyeY - ty;
        var zz = eyeZ - tz;
        var zLen = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1;
        zx /= zLen; zy /= zLen; zz /= zLen;

        // xAxis = normalize(cross([0,1,0], zAxis)) = (zz, 0, -zx)
        var xx = zz;
        var xy = 0;
        var xz = -zx;
        var xLen = Math.sqrt(xx * xx + xz * xz) || 1;
        xx /= xLen; xz /= xLen;

        // yAxis = cross(zAxis, xAxis)
        var yx = zy * xz - zz * xy;
        var yy = zz * xx - zx * xz;
        var yz = zx * xy - zy * xx;

        // matView (column-major)
        matView[0] = xx; matView[4] = xy; matView[8]  = xz; matView[12] = -(xx * eyeX + xy * eyeY + xz * eyeZ);
        matView[1] = yx; matView[5] = yy; matView[9]  = yz; matView[13] = -(yx * eyeX + yy * eyeY + yz * eyeZ);
        matView[2] = zx; matView[6] = zy; matView[10] = zz; matView[14] = -(zx * eyeX + zy * eyeY + zz * eyeZ);
        matView[3] = 0;  matView[7] = 0;  matView[11] = 0;  matView[15] = 1;

        matViewRot3[0] = xx; matViewRot3[3] = xy; matViewRot3[6] = xz;
        matViewRot3[1] = yx; matViewRot3[4] = yy; matViewRot3[7] = yz;
        matViewRot3[2] = zx; matViewRot3[5] = zy; matViewRot3[8] = zz;

        // Rotation-only view for distant starfield
        for (var r = 0; r < 16; r++) matRotOnlyView[r] = matView[r];
        matRotOnlyView[12] = 0;
        matRotOnlyView[13] = 0;
        matRotOnlyView[14] = 0;

        // Perspective matrix
        var f = 1.0 / Math.tan(fovRad * 0.5);
        var nf = 1.0 / (near - far);
        matProj.fill(0);
        matProj[0] = f / Math.max(0.2, aspect);
        matProj[5] = f;
        matProj[10] = (far + near) * nf;
        matProj[11] = -1;
        matProj[14] = 2 * far * near * nf;

        multiplyMat4(matMvp, matProj, matView);
        multiplyMat4(matRotProj, matProj, matRotOnlyView);
        return f;
      }

      function projectWorldPoint(wx, wy, wz) {
        var cx = matMvp[0] * wx + matMvp[4] * wy + matMvp[8]  * wz + matMvp[12];
        var cy = matMvp[1] * wx + matMvp[5] * wy + matMvp[9]  * wz + matMvp[13];
        var cz = matMvp[2] * wx + matMvp[6] * wy + matMvp[10] * wz + matMvp[14];
        var cw = matMvp[3] * wx + matMvp[7] * wy + matMvp[11] * wz + matMvp[15];
        if (cw <= 1.0) return null;
        var ndcX = cx / cw;
        var ndcY = cy / cw;
        return {
          sx: (ndcX * 0.5 + 0.5) * width,
          sy: (0.5 - ndcY * 0.5) * height,
          ndcZ: cz / cw,
          w: cw
        };
      }

      // ── Static Buffers: Starfield (380) & Fibonacci Globe (650) ──
      var seed = 0x5ec0bd1;
      function rand() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      }

      var STAR_COUNT = 380;
      var starData = new Float32Array(STAR_COUNT * 5);
      for (var s = 0; s < STAR_COUNT; s++) {
        var u = rand() * 2 - 1;
        var th = rand() * Math.PI * 2;
        var sr = 900 + rand() * 600;
        var sphi = Math.sqrt(Math.max(0, 1 - u * u));
        var sBase = s * 5;
        starData[sBase]     = sr * sphi * Math.cos(th);
        starData[sBase + 1] = sr * u;
        starData[sBase + 2] = sr * sphi * Math.sin(th);
        starData[sBase + 3] = 1.2 + rand() * 2.1;
        starData[sBase + 4] = 0.22 + rand() * 0.55;
      }
      var starBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
      gl.bufferData(gl.ARRAY_BUFFER, starData, gl.STATIC_DRAW);

      var GLOBE_COUNT = 650;
      var GLOBE_RADIUS = 44;
      var globeData = new Float32Array(GLOBE_COUNT * 3);
      var goldenAngle = Math.PI * (3 - Math.sqrt(5));
      for (var g = 0; g < GLOBE_COUNT; g++) {
        var gy = 1 - (g / (GLOBE_COUNT - 1)) * 2;
        var gr = Math.sqrt(Math.max(0, 1 - gy * gy));
        var gtheta = goldenAngle * g;
        var gBase = g * 3;
        globeData[gBase]     = Math.cos(gtheta) * gr * GLOBE_RADIUS;
        globeData[gBase + 1] = gy * GLOBE_RADIUS;
        globeData[gBase + 2] = Math.sin(gtheta) * gr * GLOBE_RADIUS;
      }
      var globeBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, globeBuf);
      gl.bufferData(gl.ARRAY_BUFFER, globeData, gl.STATIC_DRAW);

      // Dynamic buffers for Orbit Lines + Planets
      var lineBuf = gl.createBuffer();
      var planetBuf = gl.createBuffer();
      var lineArray = new Float32Array(0);
      var planetArray = new Float32Array(0);

      // ── Pooled HTML Labels (Zero Per-Frame DOM Churn) ────────────
      var MAX_LABELS = 44;
      var labelPool = [];
      for (var lp = 0; lp < MAX_LABELS; lp++) {
        var div = document.createElement('div');
        div.className = 'cosmos-label';
        labelsRoot.appendChild(div);
        labelPool.push({
          el: div,
          visible: false,
          text: '',
          cls: 'cosmos-label',
          x: -9999,
          y: -9999,
          opacity: '1'
        });
      }

      // ── Star-System Hierarchy & Orbit Helpers ────────────────────
      var bodyList = [];
      var bodyById = {};
      var parentById = {};
      var childrenById = {};
      var galaxyRings = [];
      var selectedId = null;
      var focusedSet = null;
      var focusedGalaxySet = null;
      var driftTime = 0;
      var driftFactor = 1;
      var globeAngle = 0;

      var baseFitDist = 580;
      var MIN_DIST = 115;
      var MAX_DIST = 1350;
      var DEFAULT_YAW = 0.34;
      var DEFAULT_PITCH = 0.44;

      var cam = {
        yaw: DEFAULT_YAW,
        pitch: DEFAULT_PITCH,
        dist: baseFitDist,
        tx: 0,
        ty: 0,
        tz: 0,
        goalYaw: DEFAULT_YAW,
        goalPitch: DEFAULT_PITCH,
        goalDist: baseFitDist,
        goalTx: 0,
        goalTy: 0,
        goalTz: 0,
        velYaw: 0,
        velPitch: 0
      };

      function computeBaseFitDist(maxRingR) {
        var spanR = Math.max(220, maxRingR + 45);
        var minAspect = Math.min(1.0, (width / Math.max(1, height)) * 1.45);
        return clamp((spanR * 2.15) / Math.max(0.55, minAspect), 420, 920);
      }

      function tiltedCirclePoint(radius, angle, tiltX, tiltZ) {
        var x0 = Math.cos(angle) * radius;
        var z0 = Math.sin(angle) * radius;
        // Rotate around X by tiltX
        var y1 = -z0 * Math.sin(tiltX);
        var z1 = z0 * Math.cos(tiltX);
        // Rotate around Z by tiltZ
        var x2 = x0 * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
        var y2 = x0 * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
        return [x2, y2, z1];
      }

      function computeBodyRadius(node) {
        if (node.depth === 0) return GLOBE_RADIUS;
        if (node.nodeType === 'entry') {
          if (typeof node.rating === 'number' && isFinite(node.rating)) {
            return 3.8 + ((clamp(node.rating, 1, 10) - 1) / 9) * 2.4;
          }
          return 4.6;
        }
        if (node.depth === 1) {
          return 8.5 + Math.min(node.descendantCount || 0, 18) * 0.24;
        }
        if (node.depth === 2) {
          return 5.8 + Math.min(node.descendantCount || 0, 10) * 0.18;
        }
        return 4.4 + Math.min(node.descendantCount || 0, 6) * 0.18;
      }

      function rebuildFocusSets() {
        if (!selectedId || !bodyById[selectedId]) {
          focusedSet = null;
          focusedGalaxySet = null;
          return;
        }
        var set = {};
        var gSet = {};
        set[selectedId] = true;

        var cur = selectedId;
        var guard = 0;
        while (cur && guard < 32) {
          set[cur] = true;
          var b = bodyById[cur];
          if (b && b.data.depth === 1) {
            gSet[cur] = true;
          }
          cur = parentById[cur];
          guard++;
        }

        var kids = childrenById[selectedId] || [];
        for (var k = 0; k < kids.length; k++) {
          set[kids[k]] = true;
          var kb = bodyById[kids[k]];
          if (kb && kb.data.depth === 1) {
            gSet[kids[k]] = true;
          }
        }
        focusedSet = set;
        focusedGalaxySet = gSet;
      }

      function setUniverseNodes(rawNodes) {
        bodyList = [];
        bodyById = {};
        parentById = {};
        childrenById = {};
        galaxyRings = [];

        if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
          selectedId = null;
          focusedSet = null;
          focusedGalaxySet = null;
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

        var rootBody = {
          data: rootNode,
          radius: GLOBE_RADIUS,
          rgb: PALETTE.coreWhite,
          wx: 0,
          wy: 0,
          wz: 0,
          parentId: null,
          orbitType: 'root',
          focusAlpha: 1,
          galaxyId: null
        };
        bodyList.push(rootBody);
        bodyById[rootNode.id] = rootBody;

        // Depth 1 Galaxies: concentric 3D orbit rings r = 92 + gIdx * 42
        var galaxies = childrenMap[rootNode.id] || [];
        var maxRingR = 92 + Math.max(0, galaxies.length - 1) * 42;
        baseFitDist = computeBaseFitDist(maxRingR);
        if (!selectedId) {
          cam.goalDist = clamp(cam.goalDist || baseFitDist, MIN_DIST, MAX_DIST);
        }

        var queue = [];
        for (var gIdx = 0; gIdx < galaxies.length; gIdx++) {
          var gal = galaxies[gIdx];
          var ringR = 92 + gIdx * 42;
          var tiltX = Math.sin(gIdx * 1.9 + 0.5) * 0.26;
          var tiltZ = Math.cos(gIdx * 2.3 + 0.2) * 0.22;
          var startAngle = -Math.PI * 0.5 + gIdx * 1.38;
          var rgb = resolveRefinedRgb(gal, gIdx);

          galaxyRings.push({
            galaxyId: gal.id,
            r: ringR,
            tiltX: tiltX,
            tiltZ: tiltZ,
            rgb: rgb
          });

          var galBody = {
            data: gal,
            radius: computeBodyRadius(gal),
            rgb: rgb,
            wx: 0,
            wy: 0,
            wz: 0,
            parentId: rootNode.id,
            orbitType: 'galaxy',
            focusAlpha: 1,
            galaxyId: gal.id,
            ringR: ringR,
            baseAngle: startAngle,
            driftSpeed: 0.032 / (1 + gIdx * 0.12),
            tiltX: tiltX,
            tiltZ: tiltZ
          };
          bodyList.push(galBody);
          bodyById[gal.id] = galBody;
          queue.push(galBody);
        }

        // Depth 2+ Solar Systems & Entries around parent orbs
        while (queue.length > 0) {
          var parentB = queue.shift();
          var kids = childrenMap[parentB.data.id] || [];
          var kCount = kids.length;
          if (kCount === 0) continue;

          var isGalaxy = parentB.data.depth === 1;
          var localR = isGalaxy
            ? clamp(26 + Math.max(0, kCount - 2) * 2.5, 26, 35)
            : clamp(16 + Math.max(0, kCount - 2) * 2.0, 16, 25);

          for (var c = 0; c < kCount; c++) {
            var child = kids[c];
            if (bodyById[child.id]) continue;

            var childAngle = (c * Math.PI * 2) / kCount + (parentB.data.depth * 0.7);
            var localTiltX = isGalaxy ? (parentB.tiltX + 0.42 + (c % 2) * 0.24) : (0.52 + (c % 3) * 0.22);
            var localTiltZ = isGalaxy ? (parentB.tiltZ - 0.34) : (-0.38 + (c % 2) * 0.35);

            var childBody = {
              data: child,
              radius: computeBodyRadius(child),
              rgb: resolveRefinedRgb(child, 0),
              wx: 0,
              wy: 0,
              wz: 0,
              parentId: parentB.data.id,
              orbitType: 'satellite',
              focusAlpha: 1,
              galaxyId: parentB.galaxyId,
              localR: localR,
              baseAngle: childAngle,
              driftSpeed: isGalaxy ? 0.045 : 0.06,
              tiltX: localTiltX,
              tiltZ: localTiltZ
            };
            bodyList.push(childBody);
            bodyById[child.id] = childBody;
            queue.push(childBody);
          }
        }

        if (selectedId && !bodyById[selectedId]) {
          selectedId = null;
        }
        rebuildFocusSets();
        updateWorldPositions();
      }

      function updateWorldPositions() {
        for (var i = 0; i < bodyList.length; i++) {
          var b = bodyList[i];
          if (b.orbitType === 'root') {
            b.wx = 0; b.wy = 0; b.wz = 0;
          } else if (b.orbitType === 'galaxy') {
            var p = tiltedCirclePoint(
              b.ringR,
              b.baseAngle + driftTime * b.driftSpeed,
              b.tiltX,
              b.tiltZ
            );
            b.wx = p[0]; b.wy = p[1]; b.wz = p[2];
          } else {
            var parent = bodyById[b.parentId];
            if (!parent) continue;
            var sp = tiltedCirclePoint(
              b.localR,
              b.baseAngle + driftTime * b.driftSpeed,
              b.tiltX,
              b.tiltZ
            );
            b.wx = parent.wx + sp[0];
            b.wy = parent.wy + sp[1];
            b.wz = parent.wz + sp[2];
          }
        }
      }

      // ── Camera Focus, Reset & Zoom Controls ──────────────────────
      function focusNode(nodeId) {
        var b = bodyById[nodeId];
        if (!b) return;
        selectedId = nodeId;
        rebuildFocusSets();

        cam.goalTx = b.wx;
        cam.goalTy = b.wy;
        cam.goalTz = b.wz;

        var targetDist =
          b.data.depth === 0
            ? baseFitDist * 0.65
            : b.data.depth === 1
              ? Math.min(cam.goalDist, baseFitDist * 0.48)
              : b.data.depth === 2
                ? Math.min(cam.goalDist, baseFitDist * 0.34)
                : Math.min(cam.goalDist, baseFitDist * 0.25);

        cam.goalDist = clamp(targetDist, MIN_DIST, MAX_DIST);
        cam.velYaw = 0;
        cam.velPitch = 0;
        postToRN({ type: 'SELECT_NODE', nodeId: nodeId });
      }

      function clearSelection(notifyRN) {
        selectedId = null;
        focusedSet = null;
        focusedGalaxySet = null;
        if (notifyRN) {
          postToRN({ type: 'CLEAR_SELECTION' });
        }
      }

      function resetCamera(clearSel) {
        baseFitDist = computeBaseFitDist(
          92 + Math.max(0, galaxyRings.length - 1) * 42
        );
        cam.goalYaw = DEFAULT_YAW;
        cam.goalPitch = DEFAULT_PITCH;
        cam.goalDist = baseFitDist;
        cam.goalTx = 0;
        cam.goalTy = 0;
        cam.goalTz = 0;
        cam.velYaw = 0;
        cam.velPitch = 0;
        if (clearSel) {
          selectedId = null;
          focusedSet = null;
          focusedGalaxySet = null;
        }
      }

      // ── Touch Gestures (1-Finger Orbit, 2-Finger Pinch, Tap Picking) ─
      var gesture = {
        mode: 'none',
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        startTime: 0,
        movedDist: 0,
        hadMulti: false,
        pinchDist: 0
      };
      var isTouching = false;
      var pendingTapTimer = null;
      var lastTapTime = 0;
      var lastTapX = 0;
      var lastTapY = 0;

      function touchDistance(t1, t2) {
        var dx = t2.clientX - t1.clientX;
        var dy = t2.clientY - t1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function pickNodeAtScreen(sx, sy) {
        var bestBody = null;
        var bestScore = Infinity;

        for (var i = 0; i < bodyList.length; i++) {
          var b = bodyList[i];
          var proj = projectWorldPoint(b.wx, b.wy, b.wz);
          if (!proj) continue;
          var dist2D = Math.hypot(sx - proj.sx, sy - proj.sy);
          if (dist2D <= 36) {
            // Prefer closer touch center and front-most depth
            var score = dist2D + proj.ndcZ * 4;
            if (score < bestScore) {
              bestScore = score;
              bestBody = b;
            }
          }
        }

        if (bestBody) {
          focusNode(bestBody.data.id);
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
          gesture.mode = 'orbit';
          gesture.startX = t.clientX;
          gesture.startY = t.clientY;
          gesture.lastX = t.clientX;
          gesture.lastY = t.clientY;
          gesture.startTime = performance.now();
          gesture.movedDist = 0;
          gesture.hadMulti = false;
          cam.velYaw = 0;
          cam.velPitch = 0;
        } else if (e.touches.length >= 2) {
          gesture.mode = 'pinch';
          gesture.hadMulti = true;
          gesture.pinchDist = Math.max(10, touchDistance(e.touches[0], e.touches[1]));
          cam.velYaw = 0;
          cam.velPitch = 0;
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (e.touches.length === 1 && gesture.mode === 'orbit') {
          var t = e.touches[0];
          var dx = t.clientX - gesture.lastX;
          var dy = t.clientY - gesture.lastY;
          gesture.lastX = t.clientX;
          gesture.lastY = t.clientY;
          gesture.movedDist += Math.hypot(dx, dy);

          var dYaw = -dx * 0.0062;
          var dPitch = dy * 0.0056;
          cam.goalYaw += dYaw;
          cam.yaw = cam.goalYaw;
          cam.goalPitch = clamp(cam.goalPitch + dPitch, -1.28, 1.28);
          cam.pitch = cam.goalPitch;
          cam.velYaw = dYaw;
          cam.velPitch = dPitch;
        } else if (e.touches.length >= 2) {
          gesture.mode = 'pinch';
          gesture.hadMulti = true;
          var nd = Math.max(10, touchDistance(e.touches[0], e.touches[1]));
          var ratio = gesture.pinchDist / nd;
          var nextDist = clamp(cam.goalDist * ratio, MIN_DIST, MAX_DIST);
          cam.goalDist = nextDist;
          cam.dist = nextDist;
          gesture.pinchDist = nd;
        }
      }, { passive: false });

      canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (e.touches.length === 1) {
          var rem = e.touches[0];
          gesture.mode = 'orbit';
          gesture.lastX = rem.clientX;
          gesture.lastY = rem.clientY;
          gesture.hadMulti = true;
          cam.velYaw = 0;
          cam.velPitch = 0;
          return;
        }

        if (e.touches.length === 0) {
          isTouching = false;
          var elapsed = performance.now() - gesture.startTime;

          if (!gesture.hadMulti && gesture.movedDist < 10 && elapsed < 320) {
            var now = performance.now();
            var tx = gesture.startX;
            var ty = gesture.startY;
            var dTapDist = Math.hypot(tx - lastTapX, ty - lastTapY);

            if (now - lastTapTime < 220 && dTapDist < 32) {
              if (pendingTapTimer) {
                clearTimeout(pendingTapTimer);
                pendingTapTimer = null;
              }
              lastTapTime = 0;
              resetCamera(true);
              postToRN({ type: 'CLEAR_SELECTION' });
            } else {
              lastTapTime = now;
              lastTapX = tx;
              lastTapY = ty;
              if (pendingTapTimer) clearTimeout(pendingTapTimer);
              pendingTapTimer = setTimeout(function () {
                pendingTapTimer = null;
                pickNodeAtScreen(tx, ty);
              }, 185);
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

      // ── Pause/Resume & RN <-> WebView Message Bridge ─────────────
      var isActive = true;
      var rafId = null;
      var lastFrameTime = performance.now();

      function startLoop() {
        if (rafId !== null) return;
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(render);
      }

      function stopLoop() {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }

      function handleMessage(event) {
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
          cam.goalDist = clamp(cam.goalDist / 1.32, MIN_DIST, MAX_DIST);
        } else if (msg.type === 'ZOOM_OUT') {
          cam.goalDist = clamp(cam.goalDist * 1.32, MIN_DIST, MAX_DIST);
        } else if (msg.type === 'RESET_CAMERA') {
          resetCamera(true);
        } else if (msg.type === 'CLEAR_SELECTION') {
          clearSelection(false);
        } else if (msg.type === 'SET_ACTIVE') {
          var nextActive = Boolean(msg.active);
          if (nextActive && !isActive) {
            isActive = true;
            startLoop();
          } else if (!nextActive && isActive) {
            isActive = false;
            stopLoop();
          }
        }
      }

      window.addEventListener('message', handleMessage);
      document.addEventListener('message', handleMessage);

      // ── Render Frame (4 WebGL Draw Calls + Pooled Labels) ─────────
      var RING_SEGS = 96;

      function render(now) {
        if (!isActive) {
          rafId = null;
          return;
        }
        rafId = requestAnimationFrame(render);

        var dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
        lastFrameTime = now;

        // Smooth orbital drift pause on touch or inspection
        var targetDrift = (isTouching || selectedId !== null) ? 0 : 1;
        driftFactor = lerp(driftFactor, targetDrift, 1 - Math.exp(-6 * dt));
        driftTime += dt * driftFactor;
        globeAngle += dt * 0.12;

        // Drag inertia
        if (!isTouching && gesture.mode !== 'orbit') {
          if (Math.abs(cam.velYaw) > 0.0001 || Math.abs(cam.velPitch) > 0.0001) {
            cam.goalYaw += cam.velYaw;
            cam.goalPitch = clamp(cam.goalPitch + cam.velPitch, -1.28, 1.28);
            cam.velYaw *= 0.91;
            cam.velPitch *= 0.91;
          }
        }

        // Smooth camera interpolation
        var ease = 1 - Math.exp(-9 * dt);
        cam.yaw = lerp(cam.yaw, cam.goalYaw, ease);
        cam.pitch = lerp(cam.pitch, cam.goalPitch, ease);
        cam.dist = lerp(cam.dist, cam.goalDist, ease);
        cam.tx = lerp(cam.tx, cam.goalTx, ease);
        cam.ty = lerp(cam.ty, cam.goalTy, ease);
        cam.tz = lerp(cam.tz, cam.goalTz, ease);

        if (selectedId && bodyById[selectedId]) {
          var selB = bodyById[selectedId];
          cam.goalTx = selB.wx;
          cam.goalTy = selB.wy;
          cam.goalTz = selB.wz;
        }

        updateWorldPositions();

        var cp = Math.cos(cam.pitch);
        var sp = Math.sin(cam.pitch);
        var cy = Math.cos(cam.yaw);
        var sy = Math.sin(cam.yaw);
        var eyeX = cam.tx + cam.dist * cp * sy;
        var eyeY = cam.ty + cam.dist * sp;
        var eyeZ = cam.tz + cam.dist * cp * cy;

        var fovRad = (46 * Math.PI) / 180;
        var aspect = width / Math.max(1, height);
        var projScaleY = buildCameraMatrices(
          eyeX, eyeY, eyeZ,
          cam.tx, cam.ty, cam.tz,
          fovRad, aspect, 10, 4000
        );

        gl.clearColor(0.016, 0.020, 0.039, 1.0); // #04050A
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // ── Draw Call 1: Deep 3D Starfield ────────────────────────
        gl.useProgram(starProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
        gl.enableVertexAttribArray(starLoc.aPos);
        gl.enableVertexAttribArray(starLoc.aSize);
        gl.enableVertexAttribArray(starLoc.aAlpha);
        gl.vertexAttribPointer(starLoc.aPos, 3, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(starLoc.aSize, 1, gl.FLOAT, false, 20, 12);
        gl.vertexAttribPointer(starLoc.aAlpha, 1, gl.FLOAT, false, 20, 16);
        gl.uniformMatrix4fv(starLoc.uRotProj, false, matRotProj);
        gl.uniform1f(starLoc.uDpr, dpr);
        gl.uniform1f(starLoc.uMaxPt, maxPointSize);
        gl.drawArrays(gl.POINTS, 0, STAR_COUNT);
        gl.disableVertexAttribArray(starLoc.aPos);
        gl.disableVertexAttribArray(starLoc.aSize);
        gl.disableVertexAttribArray(starLoc.aAlpha);

        // ── Draw Call 2: Central Dotted Fibonacci Globe ("Me") ────
        var coreBody = bodyList.length > 0 ? bodyList[0] : null;
        var coreFocus = coreBody
          ? (!focusedSet || focusedSet[coreBody.data.id] ? 1.0 : 0.25)
          : 1.0;

        gl.useProgram(globeProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, globeBuf);
        gl.enableVertexAttribArray(globeLoc.aPos);
        gl.vertexAttribPointer(globeLoc.aPos, 3, gl.FLOAT, false, 12, 0);
        gl.uniformMatrix4fv(globeLoc.uMvp, false, matMvp);
        gl.uniformMatrix4fv(globeLoc.uView, false, matView);
        gl.uniform1f(globeLoc.uGlobeAngle, globeAngle);
        gl.uniform1f(globeLoc.uDpr, dpr);
        gl.uniform1f(globeLoc.uMaxPt, maxPointSize);
        gl.uniform1f(globeLoc.uFocusAlpha, coreFocus);
        gl.drawArrays(gl.POINTS, 0, GLOBE_COUNT);
        gl.disableVertexAttribArray(globeLoc.aPos);

        // ── Draw Call 3: Tilted Orbit Tracks & Hierarchy Filaments ─
        var filamentCount = 0;
        for (var fi = 0; fi < bodyList.length; fi++) {
          if (bodyList[fi].data.depth >= 2 && bodyList[fi].parentId && bodyById[bodyList[fi].parentId]) {
            filamentCount++;
          }
        }
        var totalLineSegs = galaxyRings.length * RING_SEGS + filamentCount;
        var neededFloats = totalLineSegs * 2 * 7;
        if (lineArray.length < neededFloats) {
          lineArray = new Float32Array(Math.max(neededFloats, 2048));
        }

        var lOffset = 0;
        for (var rIdx = 0; rIdx < galaxyRings.length; rIdx++) {
          var ring = galaxyRings[rIdx];
          var isFocusedRing = focusedGalaxySet && focusedGalaxySet[ring.galaxyId];
          var ringAlpha = focusedSet ? (isFocusedRing ? 0.55 : 0.08) : 0.16;

          for (var seg = 0; seg < RING_SEGS; seg++) {
            var a0 = (seg / RING_SEGS) * Math.PI * 2;
            var a1 = ((seg + 1) / RING_SEGS) * Math.PI * 2;
            var p0 = tiltedCirclePoint(ring.r, a0, ring.tiltX, ring.tiltZ);
            var p1 = tiltedCirclePoint(ring.r, a1, ring.tiltX, ring.tiltZ);

            lineArray[lOffset++] = p0[0];
            lineArray[lOffset++] = p0[1];
            lineArray[lOffset++] = p0[2];
            lineArray[lOffset++] = ring.rgb[0];
            lineArray[lOffset++] = ring.rgb[1];
            lineArray[lOffset++] = ring.rgb[2];
            lineArray[lOffset++] = ringAlpha;

            lineArray[lOffset++] = p1[0];
            lineArray[lOffset++] = p1[1];
            lineArray[lOffset++] = p1[2];
            lineArray[lOffset++] = ring.rgb[0];
            lineArray[lOffset++] = ring.rgb[1];
            lineArray[lOffset++] = ring.rgb[2];
            lineArray[lOffset++] = ringAlpha;
          }
        }

        for (var bIdx = 0; bIdx < bodyList.length; bIdx++) {
          var cb = bodyList[bIdx];
          if (cb.data.depth < 2 || !cb.parentId) continue;
          var pb = bodyById[cb.parentId];
          if (!pb) continue;

          var isHighlighted =
            focusedSet && focusedSet[cb.data.id] && focusedSet[pb.data.id];
          var filAlpha = focusedSet ? (isHighlighted ? 0.50 : 0.05) : 0.14;

          lineArray[lOffset++] = pb.wx;
          lineArray[lOffset++] = pb.wy;
          lineArray[lOffset++] = pb.wz;
          lineArray[lOffset++] = cb.rgb[0];
          lineArray[lOffset++] = cb.rgb[1];
          lineArray[lOffset++] = cb.rgb[2];
          lineArray[lOffset++] = filAlpha;

          lineArray[lOffset++] = cb.wx;
          lineArray[lOffset++] = cb.wy;
          lineArray[lOffset++] = cb.wz;
          lineArray[lOffset++] = cb.rgb[0];
          lineArray[lOffset++] = cb.rgb[1];
          lineArray[lOffset++] = cb.rgb[2];
          lineArray[lOffset++] = filAlpha;
        }

        if (totalLineSegs > 0) {
          gl.useProgram(lineProg);
          gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            lineArray.subarray(0, lOffset),
            gl.DYNAMIC_DRAW
          );
          gl.enableVertexAttribArray(lineLoc.aPos);
          gl.enableVertexAttribArray(lineLoc.aColor);
          gl.enableVertexAttribArray(lineLoc.aAlpha);
          gl.vertexAttribPointer(lineLoc.aPos, 3, gl.FLOAT, false, 28, 0);
          gl.vertexAttribPointer(lineLoc.aColor, 3, gl.FLOAT, false, 28, 12);
          gl.vertexAttribPointer(lineLoc.aAlpha, 1, gl.FLOAT, false, 28, 24);
          gl.uniformMatrix4fv(lineLoc.uMvp, false, matMvp);
          gl.drawArrays(gl.LINES, 0, totalLineSegs * 2);
          gl.disableVertexAttribArray(lineLoc.aPos);
          gl.disableVertexAttribArray(lineLoc.aColor);
          gl.disableVertexAttribArray(lineLoc.aAlpha);
        }

        // ── Draw Call 4: Procedural 3D Lit Sphere Planets ─────────
        var planetEntries = [];
        var labelTargets = [];
        for (var pi = 0; pi < bodyList.length; pi++) {
          var pNode = bodyList[pi];
          var targetAlpha = !focusedSet || focusedSet[pNode.data.id] ? 1.0 : 0.22;
          pNode.focusAlpha = lerp(pNode.focusAlpha, targetAlpha, 1 - Math.exp(-10 * dt));

          var proj = projectWorldPoint(pNode.wx, pNode.wy, pNode.wz);
          if (!proj) continue;
          labelTargets.push({ body: pNode, proj: proj });
          if (pNode.orbitType !== 'root') {
            planetEntries.push({ body: pNode, proj: proj });
          }
        }

        // Painter's sort back-to-front by clip-space depth W
        planetEntries.sort(function (a, b) {
          return b.proj.w - a.proj.w;
        });

        var pFloatsNeeded = planetEntries.length * 9;
        if (planetArray.length < pFloatsNeeded) {
          planetArray = new Float32Array(Math.max(pFloatsNeeded, 576));
        }

        var pOffset = 0;
        for (var k = 0; k < planetEntries.length; k++) {
          var pe = planetEntries[k].body;
          planetArray[pOffset++] = pe.wx;
          planetArray[pOffset++] = pe.wy;
          planetArray[pOffset++] = pe.wz;
          planetArray[pOffset++] = pe.rgb[0];
          planetArray[pOffset++] = pe.rgb[1];
          planetArray[pOffset++] = pe.rgb[2];
          planetArray[pOffset++] = pe.radius;
          planetArray[pOffset++] = pe.focusAlpha;
          planetArray[pOffset++] = selectedId === pe.data.id ? 1.0 : 0.0;
        }

        if (planetEntries.length > 0) {
          gl.useProgram(planetProg);
          gl.bindBuffer(gl.ARRAY_BUFFER, planetBuf);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            planetArray.subarray(0, pOffset),
            gl.DYNAMIC_DRAW
          );
          gl.enableVertexAttribArray(planetLoc.aPos);
          gl.enableVertexAttribArray(planetLoc.aColor);
          gl.enableVertexAttribArray(planetLoc.aRadius);
          gl.enableVertexAttribArray(planetLoc.aAlpha);
          gl.enableVertexAttribArray(planetLoc.aSelected);
          gl.vertexAttribPointer(planetLoc.aPos, 3, gl.FLOAT, false, 36, 0);
          gl.vertexAttribPointer(planetLoc.aColor, 3, gl.FLOAT, false, 36, 12);
          gl.vertexAttribPointer(planetLoc.aRadius, 1, gl.FLOAT, false, 36, 24);
          gl.vertexAttribPointer(planetLoc.aAlpha, 1, gl.FLOAT, false, 36, 28);
          gl.vertexAttribPointer(planetLoc.aSelected, 1, gl.FLOAT, false, 36, 32);
          gl.uniformMatrix4fv(planetLoc.uMvp, false, matMvp);
          gl.uniformMatrix3fv(planetLoc.uViewRot, false, matViewRot3);
          gl.uniform1f(planetLoc.uProjScaleY, projScaleY);
          gl.uniform1f(planetLoc.uViewportH, height);
          gl.uniform1f(planetLoc.uDpr, dpr);
          gl.uniform1f(planetLoc.uMaxPt, maxPointSize);
          gl.drawArrays(gl.POINTS, 0, planetEntries.length);
          gl.disableVertexAttribArray(planetLoc.aPos);
          gl.disableVertexAttribArray(planetLoc.aColor);
          gl.disableVertexAttribArray(planetLoc.aRadius);
          gl.disableVertexAttribArray(planetLoc.aAlpha);
          gl.disableVertexAttribArray(planetLoc.aSelected);
        }

        // ── GPU-Composited Pooled HTML Labels (Collision-Free) ────
        var zoomRatio = baseFitDist / Math.max(1, cam.dist);
        var labelCandidates = [];
        for (var li = 0; li < labelTargets.length; li++) {
          var lt = labelTargets[li];
          var lBody = lt.body;
          var lNode = lBody.data;
          var lpProj = lt.proj;

          var isFocusedNode = focusedSet && focusedSet[lNode.id];
          var eligible =
            lNode.depth <= 1 ||
            isFocusedNode ||
            (lNode.depth === 2 && zoomRatio >= 1.12) ||
            (lNode.depth >= 3 && zoomRatio >= 1.52);

          if (!eligible) continue;
          if (lpProj.sx < -40 || lpProj.sx > width + 40 || lpProj.sy < 46 || lpProj.sy > height - 24) {
            continue;
          }

          var priority = 120 - lNode.depth * 25 - lpProj.ndcZ * 40;
          if (lNode.id === selectedId) priority += 1000;
          else if (isFocusedNode) priority += 700;
          else if (lNode.depth === 0) priority += 550;
          else if (lNode.depth === 1) priority += 400;

          labelCandidates.push({
            body: lBody,
            proj: lpProj,
            priority: priority
          });
        }

        labelCandidates.sort(function (a, b) {
          return b.priority - a.priority;
        });

        var placedBoxes = [];
        var usedPool = 0;

        for (var ci = 0; ci < labelCandidates.length && usedPool < MAX_LABELS; ci++) {
          var cand = labelCandidates[ci];
          var cBody = cand.body;
          var cData = cBody.data;
          var cProj = cand.proj;
          var isSel = cData.id === selectedId;

          var titleText = cData.title || '';
          if (titleText.length > 20) {
            titleText = titleText.slice(0, 19) + '…';
          }

          var cssRadius = (cBody.radius * projScaleY / Math.max(1, cProj.w)) * (height * 0.5);
          var approxW = titleText.length * 6.5 + 14;
          var lx = clamp(cProj.sx, approxW * 0.5 + 8, width - approxW * 0.5 - 8);
          var ly = cProj.sy + cssRadius + 7;
          if (ly + 16 > height - 14) continue;

          var box = {
            left: lx - approxW * 0.5 - 4,
            right: lx + approxW * 0.5 + 4,
            top: ly - 3,
            bottom: ly + 17
          };

          var overlaps = false;
          for (var pbIdx = 0; pbIdx < placedBoxes.length; pbIdx++) {
            var ob = placedBoxes[pbIdx];
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
          if (overlaps && !isSel) continue;

          placedBoxes.push(box);

          var slot = labelPool[usedPool++];
          var targetCls = isSel
            ? 'cosmos-label selected'
            : cData.depth <= 1
              ? 'cosmos-label major'
              : 'cosmos-label';
          var rx = Math.round(lx);
          var ry = Math.round(ly);
          var opStr = cBody.focusAlpha.toFixed(2);

          if (!slot.visible) {
            slot.el.style.display = 'block';
            slot.visible = true;
          }
          if (slot.cls !== targetCls) {
            slot.el.className = targetCls;
            slot.cls = targetCls;
          }
          if (slot.text !== titleText) {
            slot.el.textContent = titleText;
            slot.text = titleText;
          }
          if (slot.x !== rx || slot.y !== ry) {
            slot.el.style.transform =
              'translate3d(' + rx + 'px,' + ry + 'px,0) translateX(-50%)';
            slot.x = rx;
            slot.y = ry;
          }
          if (slot.opacity !== opStr) {
            slot.el.style.opacity = opStr;
            slot.opacity = opStr;
          }
        }

        for (var remPool = usedPool; remPool < MAX_LABELS; remPool++) {
          var unusedSlot = labelPool[remPool];
          if (unusedSlot.visible) {
            unusedSlot.el.style.display = 'none';
            unusedSlot.visible = false;
          }
        }
      }

      startLoop();
      postToRN({ type: 'READY' });
    })();
  </script>
</body>
</html>`;
}
