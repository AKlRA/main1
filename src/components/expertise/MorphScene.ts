import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';

export const SHAPES = ['Sphere', 'Torus knot', 'Double helix', 'Lattice'] as const;
export type ShapeName = (typeof SHAPES)[number];

// --- Point clouds -----------------------------------------------------------------------------

const TAU = Math.PI * 2;

function sphere(n: number, out: Float32Array) {
  // Fibonacci lattice: even coverage with no poles.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    out.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
  }
}

function torusKnot(n: number, out: Float32Array) {
  const p = 2, q = 3, R = 0.62, tube = 0.11;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const rr = R + 0.26 * Math.cos(q * t);
    const c = new Vector3(rr * Math.cos(p * t), rr * Math.sin(p * t), 0.26 * Math.sin(q * t));
    // Scatter around the curve inside a thin tube.
    const a = Math.random() * TAU, d = tube * Math.sqrt(Math.random());
    out.set([c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.8, c.z + Math.sin(a) * d], i * 3);
  }
}

function helix(n: number, out: Float32Array) {
  const rungs = Math.floor(n * 0.18);
  for (let i = 0; i < n; i++) {
    const t = Math.random() * 2 - 1;
    const angle = t * Math.PI * 3.2;
    if (i < rungs) {
      // Base pairs: points along the chord between the two strands.
      const step = Math.round((t + 1) * 9) / 9 - 1;
      const a = step * Math.PI * 3.2, k = Math.random() * 2 - 1;
      out.set([Math.cos(a) * 0.48 * k, step * 1.15, Math.sin(a) * 0.48 * k], i * 3);
    } else {
      const strand = i % 2 ? Math.PI : 0;
      const j = (Math.random() - 0.5) * 0.06;
      out.set([Math.cos(angle + strand) * 0.5 + j, t * 1.15 + j, Math.sin(angle + strand) * 0.5 + j], i * 3);
    }
  }
}

function lattice(n: number, out: Float32Array) {
  // Points along the grid lines of a cube's six faces.
  const g = 5, s = 0.72;
  for (let i = 0; i < n; i++) {
    const axis = Math.floor(Math.random() * 3), side = Math.random() < 0.5 ? -1 : 1;
    const line = (Math.floor(Math.random() * (g + 1)) / g) * 2 - 1;
    const along = Math.random() * 2 - 1;
    const uv = Math.random() < 0.5 ? [line, along] : [along, line];
    const v = [0, 0, 0];
    v[axis] = side;
    v[(axis + 1) % 3] = uv[0];
    v[(axis + 2) % 3] = uv[1];
    out.set([v[0] * s, v[1] * s, v[2] * s], i * 3);
  }
}

const BUILDERS = [sphere, torusKnot, helix, lattice];

// --- Shaders ----------------------------------------------------------------------------------

const vertex = /* glsl */ `
attribute vec3 aPos0;
attribute vec3 aPos1;
attribute vec3 aPos2;
attribute vec3 aPos3;
attribute float aRand;
uniform float uFrom;
uniform float uTo;
uniform float uMix;
uniform float uTime;
uniform vec3 uPointer;
uniform float uPush;
uniform float uSize;
varying float vRand;
varying float vDepth;
varying float vHeat;

vec3 shape(float i) {
  if (i < 0.5) return aPos0;
  if (i < 1.5) return aPos1;
  if (i < 2.5) return aPos2;
  return aPos3;
}

void main() {
  // Staggered morph: each point leaves on its own beat, so the form dissolves and re-knits.
  float m = clamp(uMix * 1.5 - aRand * 0.5, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 a = shape(uFrom);
  vec3 b = shape(uTo);
  vec3 p = mix(a, b, m);
  // Mid-flight the points billow outward.
  p += normalize(p + 0.0001) * sin(m * 3.14159) * (0.25 + aRand * 0.35);
  p += 0.012 * vec3(sin(uTime * 1.7 + aRand * 40.0), cos(uTime * 1.3 + aRand * 30.0), sin(uTime * 1.1 + aRand * 20.0));

  vec4 world = modelMatrix * vec4(p, 1.0);
  // Points scatter away from the pointer, then spring back.
  vec2 away = world.xy - uPointer.xy;
  float d = length(away);
  float heat = smoothstep(0.6, 0.0, d) * uPush;
  world.xy += normalize(away + 0.0001) * heat * 0.32;
  world.z += heat * 0.4;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aRand * 0.9) * (1.0 + heat * 1.5) / -mv.z;
  vRand = aRand;
  vDepth = clamp(1.5 - (-mv.z - 3.0) * 0.55, 0.45, 1.0);
  vHeat = heat;
}`;

const fragment = /* glsl */ `
uniform vec3 uLime;
uniform vec3 uCyan;
varying float vRand;
varying float vDepth;
varying float vHeat;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.05, r);
  vec3 col = mix(uLime, uCyan, step(0.86, vRand) * 0.9 + vHeat * 0.6);
  gl_FragColor = vec4(col * vDepth * 1.25, alpha * vDepth);
}`;

// --- Scene ------------------------------------------------------------------------------------

export interface MorphOptions {
  lowPower: boolean;
  still: boolean;
  onShape: (index: number) => void;
}

const AUTO_MORPH_MS = 6500;
const MORPH_SECONDS = 1.8;

/**
 * A particle field that morphs between four forms. Drag spins it (with inertia), a click or tap
 * advances the form, the pointer scatters nearby points. Idles by spinning and morphing on its own.
 */
export class MorphScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(35, 1, 0.1, 40);
  private group = new Group();
  private material: ShaderMaterial;
  private geometry = new BufferGeometry();
  private canvas: HTMLCanvasElement;
  private opts: MorphOptions;
  private raf = 0;
  private running = false;
  private start = performance.now();
  private shape = 0;
  private morphT = 1;
  private lastMorph = performance.now();
  private spin = { x: 0.25, y: 0, vx: 0, vy: 0.12 };
  private drag: { id: number; x: number; y: number; moved: number } | null = null;
  private pointer = new Vector3(9, 9, 0);
  private pointerTarget = new Vector3(9, 9, 0);
  private push = 0;
  private cleanups: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, opts: MorphOptions) {
    this.canvas = canvas;
    this.opts = opts;
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
    const dpr = Math.min(window.devicePixelRatio, opts.lowPower ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);

    const n = opts.lowPower ? 5000 : 11000;
    BUILDERS.forEach((build, i) => {
      const arr = new Float32Array(n * 3);
      build(n, arr);
      this.geometry.setAttribute(`aPos${i}`, new BufferAttribute(arr, 3));
    });
    const rand = new Float32Array(n);
    for (let i = 0; i < n; i++) rand[i] = Math.random();
    this.geometry.setAttribute('aRand', new BufferAttribute(rand, 1));
    // `position` drives culling bounds only; the shader picks the real positions.
    this.geometry.setAttribute('position', this.geometry.getAttribute('aPos0'));

    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uFrom: { value: 0 },
        uTo: { value: 0 },
        uMix: { value: 1 },
        uTime: { value: 0 },
        uPointer: { value: this.pointer },
        uPush: { value: 0 },
        uSize: { value: (opts.lowPower ? 30 : 27) * dpr },
        uLime: { value: new Color('#ccff00') },
        uCyan: { value: new Color('#00f0ff') },
      },
    });
    const points = new Points(this.geometry, this.material);
    points.frustumCulled = false;
    this.group.add(points);
    this.scene.add(this.group);
    this.camera.position.set(0, 0, 4.2);
    this.bindInput();
    this.resize();
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep the form the same apparent size in tall and wide frames.
    this.camera.position.z = w / h < 1 ? 4.2 / Math.max(0.62, w / h) : 4.2;
    this.camera.updateProjectionMatrix();
    if (!this.running) this.render(0);
  }

  next() {
    if (this.morphT < 1) return;
    const u = this.material.uniforms;
    u.uFrom.value = this.shape;
    this.shape = (this.shape + 1) % BUILDERS.length;
    u.uTo.value = this.shape;
    this.morphT = this.opts.still ? 1 : 0;
    this.lastMorph = performance.now();
    this.opts.onShape(this.shape);
    if (!this.running) this.render(0);
  }

  play() {
    if (this.running || this.opts.still) return;
    this.running = true;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.render(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private toWorld(clientX: number, clientY: number) {
    const b = this.canvas.getBoundingClientRect();
    const ndc = new Vector3(((clientX - b.left) / b.width) * 2 - 1, -((clientY - b.top) / b.height) * 2 + 1, 0.5);
    ndc.unproject(this.camera);
    const dir = ndc.sub(this.camera.position).normalize();
    // Intersect with the z = 0 plane through the form's centre.
    return this.camera.position.clone().add(dir.multiplyScalar(-this.camera.position.z / dir.z));
  }

  private bindInput() {
    const el = this.canvas;
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      el.addEventListener(type, fn as EventListener);
      this.cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    };
    on('pointerdown', (e) => {
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
      el.setPointerCapture(e.pointerId);
    });
    on('pointermove', (e) => {
      this.pointerTarget.copy(this.toWorld(e.clientX, e.clientY));
      this.push = 1;
      if (!this.drag || this.drag.id !== e.pointerId) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.drag.moved += Math.abs(dx) + Math.abs(dy);
      // Velocity in rad/s (moves arrive roughly once per frame), so a flick carries on after release.
      this.spin.vy = dx * 0.5;
      this.spin.vx = dy * 0.5;
      this.spin.y += dx * 0.008;
      this.spin.x += dy * 0.008;
      if (!this.running) this.render(0);
    });
    const release = (e: PointerEvent) => {
      if (!this.drag || this.drag.id !== e.pointerId) return;
      const tap = this.drag.moved < 6;
      this.drag = null;
      if (tap && e.type === 'pointerup') this.next();
    };
    on('pointerup', release);
    on('pointercancel', release);
    on('pointerleave', () => { this.pointerTarget.set(9, 9, 0); });
  }

  private render(dt: number) {
    const now = performance.now();
    const t = this.opts.still ? 2 : (now - this.start) / 1000;
    const u = this.material.uniforms;

    if (this.morphT < 1) {
      this.morphT = Math.min(1, this.morphT + dt / MORPH_SECONDS);
    } else if (!this.opts.still && !this.drag && now - this.lastMorph > AUTO_MORPH_MS) {
      this.next();
    }
    u.uMix.value = this.morphT;

    // Spin: inertia from the last drag decays back to a slow idle turn.
    if (!this.drag) {
      this.spin.vx *= Math.exp(-dt * 2.5);
      this.spin.vy += (0.12 - this.spin.vy) * (1 - Math.exp(-dt * 1.5));
      this.spin.x += this.spin.vx * dt + (0.25 - this.spin.x) * (1 - Math.exp(-dt * 0.8));
      this.spin.y += this.spin.vy * dt;
    }
    this.group.rotation.set(this.spin.x, this.spin.y, 0);

    this.pointer.lerp(this.pointerTarget, 1 - Math.exp(-dt * 10));
    this.push *= Math.exp(-dt * 0.8);
    u.uPush.value = Math.max(0.35, this.push);
    u.uTime.value = t;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.pause();
    this.cleanups.forEach((fn) => fn());
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
