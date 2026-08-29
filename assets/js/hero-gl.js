/* ══════════════════════════════════════════════════════════════
   hero-gl.js — Three.js WebGL treatment for the hero video.
   Renders the <video> through a shader that adds a slow barrel
   warp, edge chromatic fringe, film grain and a scroll-linked
   zoom + desaturation so the footage settles into the paper
   palette as you scroll away from it.

   Bails out (returning false) on anything that can't run it well,
   in which case the plain <video> stays visible.
   ══════════════════════════════════════════════════════════════ */

import {
  WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry,
  ShaderMaterial, Mesh, VideoTexture, LinearFilter, Vector2, SRGBColorSpace
} from 'three';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */`
  precision highp float;

  uniform sampler2D uTex;
  uniform vec2  uRes;      // canvas size in px
  uniform vec2  uTexRes;   // video size in px
  uniform float uTime;
  uniform float uProgress; // 0 at top of page -> 1 when hero is scrolled past
  uniform float uEnter;    // 0..1 intro reveal
  uniform vec3  uPaper;

  varying vec2 vUv;

  // cheap hash noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    // ---- object-fit: cover -------------------------------------
    float rCanvas = uRes.x / uRes.y;
    float rTex    = uTexRes.x / uTexRes.y;
    vec2  scale   = rCanvas > rTex
                  ? vec2(1.0, rTex / rCanvas)
                  : vec2(rCanvas / rTex, 1.0);
    vec2 uv = (vUv - 0.5) / scale + 0.5;

    // ---- slow drift + scroll zoom ------------------------------
    float zoom = 1.0 + uProgress * 0.16 - uEnter * 0.10;
    uv = (uv - 0.5) / zoom + 0.5;
    uv.y += uProgress * 0.045;
    uv.x += sin(uTime * 0.07) * 0.0035;

    // ---- gentle barrel warp ------------------------------------
    vec2 c = uv - 0.5;
    float r2 = dot(c, c);
    uv = 0.5 + c * (1.0 + r2 * 0.075);

    // ---- chromatic fringe, strongest at the edges --------------
    float fringe = (0.0016 + uProgress * 0.0042) * smoothstep(0.02, 0.32, r2);
    vec3 col;
    col.r = texture2D(uTex, uv + c * fringe).r;
    col.g = texture2D(uTex, uv).g;
    col.b = texture2D(uTex, uv - c * fringe).b;

    // ---- tonal grade: keep it crisp now, wash it out on scroll -
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(col, vec3(lum), 0.06 + uProgress * 0.44);          // desaturate on scroll
    col = mix(col, uPaper, 0.03 + uProgress * 0.42);             // wash toward paper
    col = (col - 0.5) * 1.13 + 0.5;                              // punch up the contrast
    col += 0.008;

    // ---- vignette ----------------------------------------------
    col *= 1.0 - smoothstep(0.16, 0.78, r2) * 0.20;

    // ---- film grain ---------------------------------------------
    float g = hash(vUv * uRes * 0.5 + fract(uTime) * 91.7);
    col += (g - 0.5) * 0.045;

    // ---- intro wipe ---------------------------------------------
    float wipe = smoothstep(0.0, 1.0, uEnter);
    col = mix(uPaper, col, wipe);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function initHeroGL({ canvas, video, paper = [0.957, 0.945, 0.918] }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    return null;
  }
  if (!renderer) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const texture = new VideoTexture(video);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;

  const uniforms = {
    uTex:      { value: texture },
    uRes:      { value: new Vector2(1, 1) },
    uTexRes:   { value: new Vector2(1280, 720) },
    uTime:     { value: 0 },
    uProgress: { value: 0 },
    // Defaults to fully revealed. The intro tween drops it to 0 and brings it
    // back — so if that tween never runs (throttled tab, GSAP missing, reduced
    // motion) the hero shows the footage rather than a blank paper rectangle.
    uEnter:    { value: 1 },
    uPaper:    { value: { x: paper[0], y: paper[1], z: paper[2] } }
  };

  const mesh = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false })
  );
  scene.add(mesh);

  function draw() {
    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * dpr, h * dpr);
    draw(); // paint immediately so a resize never shows a stale/blank buffer
  }

  video.addEventListener('loadedmetadata', () => {
    uniforms.uTexRes.value.set(video.videoWidth || 1280, video.videoHeight || 720);
    draw();
  });

  resize();
  window.addEventListener('resize', resize, { passive: true });

  let raf = 0;
  let running = true;
  let start = performance.now();
  let lastFrame = start;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    lastFrame = now;
    if (!running) return;
    uniforms.uTime.value = (now - start) / 1000;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // Render only while the hero is both on-screen and in a visible tab.
  // Both conditions feed one flag: the IntersectionObserver fires only when
  // intersection *changes*, so tracking them separately (and recomputing on
  // either) is what stops the canvas freezing after a tab switch while the
  // hero is still in view.
  let onScreen = true;
  let tabVisible = !document.hidden;
  const syncRunning = () => {
    const next = onScreen && tabVisible;
    if (next && !running) start += performance.now() - lastFrame; // don't jump uTime
    running = next;
  };

  const io = new IntersectionObserver(
    ([entry]) => { onScreen = entry.isIntersecting; syncRunning(); },
    { threshold: 0 }
  );
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    tabVisible = !document.hidden;
    syncRunning();
  });

  return {
    setProgress(p) { uniforms.uProgress.value = p; },
    setEnter(v) { uniforms.uEnter.value = v; draw(); },
    get enter() { return uniforms.uEnter.value; },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      renderer.dispose();
    }
  };
}

/** Conservative capability check — WebGL treatment is a desktop nicety. */
export function shouldUseGL({ reduced = false } = {}) {
  if (reduced) return false;
  if (window.matchMedia('(hover: none)').matches) return false;
  if (window.innerWidth < 900) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}
