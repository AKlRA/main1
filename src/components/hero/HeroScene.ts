import {
  Color,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

// Ashima Arts 3D simplex noise (MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uEnergy;
uniform vec2 uPointer;
varying vec3 vWorld;
varying vec3 vView;
varying float vField;
${NOISE}
void main(){
  vec3 p = position;
  float slow = uTime * 0.12;
  float field = snoise(p * 1.15 + vec3(slow, slow * 0.7, -slow));
  field += 0.45 * snoise(p * 2.6 - vec3(slow * 1.3));
  // The surface swells toward the pointer.
  vec3 pointerDir = normalize(vec3(uPointer * 1.4, 1.0));
  float facing = max(dot(normalize(p), pointerDir), 0.0);
  float bulge = pow(facing, 3.0) * (0.12 + uEnergy * 0.35);
  float disp = field * uAmp + bulge;
  p += normal * disp;
  vField = field + bulge * 2.0;
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vView = cameraPosition - world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const fragment = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uLime;
uniform vec3 uCyan;
uniform float uEnergy;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vView;
varying float vField;
void main(){
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 v = normalize(vView);
  float fres = pow(1.0 - clamp(abs(dot(n, v)), 0.0, 1.0), 2.4);
  // Topographic contour lines across the noise field.
  float bands = vField * 4.5 - uTime * 0.2;
  float w = fwidth(bands);
  float line = 1.0 - smoothstep(0.0, w * 1.5, abs(fract(bands) - 0.5));
  float key = max(dot(n, normalize(vec3(-0.5, 0.8, 0.6))), 0.0);
  vec3 col = uInk + uLime * key * 0.05;
  col = mix(col, uLime, line * (0.08 + fres * 0.42));
  col = mix(col, uLime, fres * 0.85);
  col += uCyan * pow(fres, 5.0) * (0.12 + uEnergy * 0.5);
  gl_FragColor = vec4(col, 1.0);
}`;

export interface HeroSceneOptions {
  lowPower: boolean;
  still: boolean;
}

/**
 * The hero's WebGL object. Owns its renderer, render loop and listeners;
 * the React wrapper only feeds it pointer and scroll input.
 */
export class HeroScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(32, 1, 0.1, 50);
  private mesh: Mesh<IcosahedronGeometry, ShaderMaterial>;
  private material: ShaderMaterial;
  private raf = 0;
  private running = false;
  private start = performance.now();
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private energy = 0;
  private scroll = 0;
  private layoutX = 0;
  private layoutY = 0;
  private layoutScale = 1;
  private opts: HeroSceneOptions;

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, opts: HeroSceneOptions) {
    this.canvas = canvas;
    this.opts = opts;
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !opts.lowPower,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.lowPower ? 1.5 : 2));
    this.renderer.setClearColor(0x000000, 0);

    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.16 },
        uEnergy: { value: 0 },
        uPointer: { value: [0, 0] },
        uInk: { value: new Color('#0a0a0a') },
        uLime: { value: new Color('#ccff00') },
        uCyan: { value: new Color('#00f0ff') },
      },
    });
    this.mesh = new Mesh(new IcosahedronGeometry(1, opts.lowPower ? 40 : 96), this.material);
    this.scene.add(this.mesh);
    this.camera.position.set(0, 0, 6);
    this.resize();
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // Desktop: the form sits right of the headline. Narrow: centred behind it.
    const aspect = w / h;
    const wide = aspect > 1.1;
    this.layoutX = wide ? 1.15 : 0.45;
    this.layoutY = wide ? 0 : 0.62;
    this.layoutScale = wide ? 1 : Math.min(0.78, Math.max(0.62, aspect));
    if (!this.running) this.render(0);
  }

  /** Normalised pointer, -1..1 on both axes. */
  setPointer(x: number, y: number) {
    const dx = x - this.pointer.tx, dy = y - this.pointer.ty;
    this.energy = Math.min(1, this.energy + Math.hypot(dx, dy) * 1.6);
    this.pointer.tx = x;
    this.pointer.ty = y;
  }

  /** 0 at rest, 1 when the hero has scrolled away. */
  setScroll(p: number) {
    this.scroll = p;
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

  private render(dt: number) {
    const t = this.opts.still ? 4 : (performance.now() - this.start) / 1000;
    const k = 1 - Math.exp(-dt * 4);
    this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * k;
    this.energy *= Math.exp(-dt * 1.4);

    const u = this.material.uniforms;
    u.uTime.value = t;
    u.uEnergy.value = this.energy;
    u.uPointer.value = [this.pointer.x, this.pointer.y];
    u.uAmp.value = 0.16 + this.scroll * 0.35;

    const s = this.scroll;
    this.mesh.position.set(this.layoutX * (1 - s * 0.6), this.layoutY + s * 1.2, 0);
    this.mesh.scale.setScalar(this.layoutScale * (1.05 + s * 0.7));
    this.mesh.rotation.set(this.pointer.y * 0.35 + t * 0.04 + s * 0.9, this.pointer.x * 0.5 + t * 0.07, 0);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.pause();
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
