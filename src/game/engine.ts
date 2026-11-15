import { audio } from './audio';
import { LevelDef, Objective } from './levels';

export interface HudState {
  resource: number; // power (solar/RTG) or hull (probe)
  resourceLabel: string;
  speed: number;
  progress: number;
  objIndex: number;
  prompt: { verb: string; label: string; progress: number; ready: boolean; hint?: string } | null;
  warning: string | null;
  altitude: number;
  vspeed: number;
  time: number;
  panelDust: number;
  tau: number;
  signal: number;
  carrying: string | null;
  markers: number[];
  done: boolean[];
}

export type GameEvent =
  | { type: 'objective'; index: number; obj: Objective }
  | { type: 'complete'; time: number; resource: number; stars: number }
  | { type: 'fail'; reason: string }
  | { type: 'pause' };

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string; glow?: boolean; grav?: number; streak?: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

function rng(seed: number) {
  let a = seed * 9301 + 49297;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}

const KEYMAP: Record<string, 'left' | 'right' | 'up' | 'down' | 'action'> = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', Space: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyE: 'action', Enter: 'action',
};

const ARM_L1 = 175;
const ARM_L2 = 160;
const STEP = 4; // terrain sample spacing

export class Game {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private scale = 1;
  private raf = 0;
  private last = 0;
  private paused = false;
  private destroyed = false;
  private reduced = false;
  keys = { left: false, right: false, up: false, down: false, action: false };

  // world
  private heights!: Float32Array;
  private hOffset = 1200;
  private rocks: { x: number; r: number; h: number; s: number }[] = [];
  private stars: { x: number; y: number; z: number; r: number; tw: number }[] = [];
  private devils: { x: number; v: number; ph: number; h: number }[] = [];
  private asteroids: { x: number; y: number; r: number; vy: number; rot: number; spin: number; verts: number[] }[] = [];
  private particles: Particle[] = [];

  // player
  private p = { x: 160, y: 0, vx: 0, vy: 0, angle: 0, wheel: 0, rpm: 0, grounded: true, invuln: 0, tilt: 0 };
  private tip = { x: 0, y: 0 };
  private carrying: string | null = null;
  private placedSeis: number | null = null;
  private digDepth: Record<number, number> = {};
  private iceLeft = 1;

  // state
  private time = 0;
  private resource = 100;
  private panelDust = 0.3;
  private stormDark = 0;
  private objIndex = 0;
  private done: boolean[];
  private holdT = 0;
  private wasHolding = false;
  private finished = false;
  private finishT = 0;
  private quakeT = -1;
  private shake = 0;
  private cam = { x: 0, y: 0 };
  private warning: string | null = null;
  private warnCooldown = 0;
  private lastPrompt: HudState['prompt'] = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private L: LevelDef,
    private opts: { demo?: boolean; onEvent?: (e: GameEvent) => void } = {}
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.done = L.objectives.map(() => false);
    this.buildWorld();
    this.resetPlayer();
    this.resize();
    window.addEventListener('resize', this.resize);
    if (!opts.demo) {
      window.addEventListener('keydown', this.onKey);
      window.addEventListener('keyup', this.onKey);
      window.addEventListener('blur', this.onBlur);
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    window.removeEventListener('blur', this.onBlur);
    if (!this.opts.demo) audio.silenceLoops();
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (p) audio.silenceLoops();
    this.last = performance.now();
  }

  setKey(k: keyof Game['keys'], down: boolean) {
    this.keys[k] = down;
  }

  private onBlur = () => {
    (Object.keys(this.keys) as (keyof Game['keys'])[]).forEach((k) => (this.keys[k] = false));
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'Escape' && e.type === 'keydown') {
      this.opts.onEvent?.({ type: 'pause' });
      return;
    }
    const k = KEYMAP[e.code];
    if (!k) return;
    if (this.paused) return;
    e.preventDefault();
    this.keys[k] = e.type === 'keydown';
  };

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.max(1, rect.width);
    this.H = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    const viewH = this.L.vehicle === 'arm' ? 560 : this.L.vehicle === 'rover' ? 600 : 780;
    this.scale = Math.min(this.H / viewH, this.W / 640);
  };

  // ---------- world ----------
  private buildWorld() {
    const L = this.L;
    const r = rng(L.seed);
    const ph = Array.from({ length: 6 }, () => r() * Math.PI * 2);
    const raw = (x: number) =>
      L.terrainAmp * (0.55 * Math.sin(x * 0.0019 + ph[0]) + 0.3 * Math.sin(x * 0.0051 + ph[1]) + 0.15 * Math.sin(x * 0.011 + ph[2])) +
      L.terrainRough * (0.6 * Math.sin(x * 0.043 + ph[3]) + 0.4 * Math.sin(x * 0.097 + ph[4]));
    const flats = [160, ...L.objectives.map((o) => o.x), ...(L.landerX ? [L.landerX] : [])];
    const n = Math.ceil((L.length + this.hOffset * 2) / STEP);
    this.heights = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = i * STEP - this.hOffset;
      let y = raw(x);
      for (const c of flats) {
        const k = smooth(140, 50, Math.abs(x - c));
        if (k > 0) y = lerp(y, raw(c), k);
      }
      this.heights[i] = y;
    }
    if (L.scene === 'mars') {
      for (let i = 0; i < L.length / 22; i++) {
        const x = r() * (L.length + 1200) - 600;
        if (flats.some((c) => Math.abs(c - x) < 90)) continue;
        this.rocks.push({ x, r: 4 + Math.pow(r(), 3) * 26, h: 0.5 + r() * 0.5, s: r() });
      }
      this.rocks.sort((a, b) => a.r - b.r);
    }
    const starN = L.scene === 'space' ? 420 : 200;
    for (let i = 0; i < starN; i++) {
      this.stars.push({ x: r(), y: r(), z: 0.05 + r() * (L.scene === 'space' ? 0.5 : 0.04), r: 0.4 + r() * 1.3, tw: r() * 6 });
    }
    for (let i = 0; i < (L.dustDevils ?? 0); i++) {
      this.devils.push({ x: 600 + r() * (L.length - 900), v: (r() > 0.5 ? 1 : -1) * (25 + r() * 35), ph: r() * 10, h: 160 + r() * 140 });
    }
    if (L.asteroids) {
      const [a, b] = L.asteroids;
      for (let x = a; x < b; x += 46 + r() * 50) {
        const rad = 10 + Math.pow(r(), 2) * 38;
        const verts = Array.from({ length: 9 }, () => 0.72 + r() * 0.35);
        this.asteroids.push({ x, y: (r() - 0.5) * 640, r: rad, vy: (r() - 0.5) * 60, rot: r() * 6, spin: (r() - 0.5) * 1.4, verts });
      }
    }
  }

  groundY(x: number) {
    if (this.L.scene === 'space') return 99999;
    const f = (x + this.hOffset) / STEP;
    const i = clamp(Math.floor(f), 0, this.heights.length - 2);
    const t = clamp(f - i, 0, 1);
    return lerp(this.heights[i], this.heights[i + 1], t);
  }

  private resetPlayer() {
    const L = this.L;
    this.p.x = L.vehicle === 'probe' ? 120 : 160;
    if (L.vehicle === 'heli') this.p.x = 260;
    this.p.y = L.vehicle === 'probe' ? 0 : this.groundY(this.p.x) - (L.vehicle === 'heli' ? 18 : 0);
    if (L.vehicle === 'arm') {
      this.tip.x = (L.landerX ?? 300) + 150;
      this.tip.y = this.groundY(this.tip.x) - 120;
    }
    this.cam.x = this.p.x + (L.vehicle === 'arm' ? 220 : 120);
    this.cam.y = L.vehicle === 'probe' ? 0 : this.groundY(this.p.x) - 90;
  }

  private shoulder() {
    const lx = this.L.landerX ?? 300;
    return { x: lx + 46, y: this.groundY(lx) - 62 };
  }

  // ---------- loop ----------
  private loop = (now: number) => {
    if (this.destroyed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) this.update(dt);
    this.render(now / 1000);
    this.raf = requestAnimationFrame(this.loop);
  };

  private emit(e: GameEvent) {
    this.opts.onEvent?.(e);
  }

  private update(dt: number) {
    const L = this.L;
    this.time += dt;
    const k = this.keys;
    if (this.opts.demo) {
      k.right = true;
      if (this.p.x > L.length - 300) this.p.x = 200;
    }

    // storm
    if (L.stormFrom) this.stormDark = smooth(L.stormFrom, L.stormFrom + 1000, this.p.x) * 0.85;
    if (!this.opts.demo) audio.setMood(this.finished ? 'triumph' : this.stormDark > 0.25 ? 'storm' : L.mood);

    if (L.vehicle === 'rover') this.updateRover(dt);
    else if (L.vehicle === 'heli') this.updateHeli(dt);
    else if (L.vehicle === 'probe') this.updateProbe(dt);
    else this.updateArm(dt);

    this.updateDevils(dt);
    if (!this.opts.demo) this.updateObjectives(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);

    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.p.invuln = Math.max(0, this.p.invuln - dt);
    this.warnCooldown -= dt;

    // fail conditions
    if (!this.opts.demo && !this.finished && this.resource <= 0) {
      this.finished = true;
      audio.sfxPlay('fail');
      audio.silenceLoops();
      this.emit({
        type: 'fail',
        reason:
          L.vehicle === 'probe'
            ? 'Hull breached by debris. Telemetry lost somewhere past Mars.'
            : L.vehicle === 'heli'
            ? 'Battery exhausted mid-flight. Ingenuity needs sunlight between hops.'
            : 'Batteries depleted. The rover slipped into a silent hibernation.',
      });
    }
    if (this.finished && this.objIndex >= L.objectives.length) {
      this.finishT += dt;
      if (this.finishT > 1.8 && this.finishT - dt <= 1.8) {
        const res = Math.round(this.resource);
        const stars = 1 + (res >= 45 ? 1 : 0) + (this.time <= L.par ? 1 : 0);
        this.emit({ type: 'complete', time: this.time, resource: res, stars });
      }
    }

    if (!this.opts.demo) this.updateAudio();
  }

  private updateAudio() {
    const L = this.L;
    if (this.finished) {
      audio.silenceLoops();
      return;
    }
    const wind = L.scene === 'mars' ? 0.35 + this.stormDark * 0.9 : L.scene === 'cleanroom' ? 0.08 : 0;
    audio.setLoop('wind', wind, 0.3 + this.stormDark);
    const sp = Math.abs(this.p.vx) / L.maxSpeed;
    audio.setLoop('motor', L.vehicle === 'rover' ? 0.15 + sp : L.vehicle === 'arm' ? (this.armMoving ? 0.6 : 0) : 0, sp);
    audio.setLoop('rotor', L.vehicle === 'heli' ? this.p.rpm : 0, this.p.rpm);
    audio.setLoop('thruster', L.vehicle === 'probe' && (this.keys.left || this.keys.right || this.keys.up || this.keys.down) ? 1 : 0);
    const o = L.objectives[this.objIndex];
    const drilling = this.holding && o && /Grind|Abrasion|Scoop|Scrape|APXS/.test(o.verb + o.label);
    audio.setLoop('drill', drilling ? 1 : 0);
  }

  private holding = false;
  private armMoving = false;

  // ---------- vehicles ----------
  private updateRover(dt: number) {
    const L = this.L;
    const p = this.p;
    const k = this.keys;
    let input = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (this.resource <= 0 || this.finished && !this.opts.demo) input = 0;
    if (this.holding) input = 0;
    if (L.tether && p.x > L.tether.x + L.tether.range && input > 0) {
      input = 0;
      this.warn('Radio horizon: Sojourner must stay within range of the Pathfinder lander');
    }
    const slope = (this.groundY(p.x + 8) - this.groundY(p.x - 8)) / 16;
    const ang = Math.atan(slope);
    const accel = input * L.maxSpeed * 1.8;
    const friction = input === 0 ? 3.2 : 0.9;
    p.vx += (accel + L.gravity * Math.sin(ang) * 0.6 - p.vx * friction) * dt;
    p.vx = clamp(p.vx, -L.maxSpeed * 0.6, L.maxSpeed);
    p.x += p.vx * dt;
    if (p.x < 70) { p.x = 70; p.vx = 0; }
    if (p.x > L.length - 60) { p.x = L.length - 60; p.vx = 0; }
    const span = this.skinSpan();
    const yb = this.groundY(p.x - span);
    const yf = this.groundY(p.x + span);
    p.angle = lerp(p.angle, Math.atan2(yf - yb, span * 2), Math.min(1, dt * 10));
    p.y = (yb + yf + this.groundY(p.x)) / 3;
    p.wheel += (p.vx * dt) / 9;

    // dust kicked up by the wheels
    if (L.scene === 'mars' && Math.abs(p.vx) > 18 && Math.random() < Math.abs(p.vx) / 90) {
      const bx = p.x - Math.sign(p.vx) * span;
      this.spawn(bx, this.groundY(bx) - 3, -p.vx * 0.2 + (Math.random() - 0.5) * 30, -20 - Math.random() * 30, 1.2, 3 + Math.random() * 5, 'rgba(196,120,80,0.45)', false, 8);
    }

    // power model
    if (L.solar) {
      const sun = 1 - this.stormDark;
      const gain = 1.4 * sun * (1 - this.panelDust);
      const drain = L.drain * (0.25 + Math.abs(p.vx) / L.maxSpeed);
      this.resource = clamp(this.resource + (gain - drain) * dt, 0, 100);
      if (L.dustDevils) this.panelDust = clamp(this.panelDust + 0.016 * dt * (1 + this.stormDark * 3), 0, 0.95);
      if (this.resource < 20 && !this.finished) this.warn('Low power — slow down or find a dust devil to clean the panels');
    } else {
      this.resource = 100;
    }
  }

  private updateHeli(dt: number) {
    const L = this.L;
    const p = this.p;
    const k = this.keys;
    const g = L.gravity;
    const canFly = this.resource > 0 && !this.finished;
    const target = canFly && (k.up || !p.grounded) ? 1 : 0;
    p.rpm = lerp(p.rpm, target, Math.min(1, dt * (target ? 2.2 : 1.2)));
    const input = canFly ? (k.right ? 1 : 0) - (k.left ? 1 : 0) : 0;
    const lift = canFly && k.up ? g * 1.85 * p.rpm : g * 0.55 * p.rpm;
    p.vy += (g - lift - p.vy * 0.6) * dt;
    if (k.down) p.vy += g * 0.6 * dt;
    if (!p.grounded) p.vx += (input * 260 - p.vx * 0.9) * dt;
    p.vx = clamp(p.vx, -L.maxSpeed, L.maxSpeed);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, 80, L.length - 80);
    p.tilt = lerp(p.tilt, (p.vx / L.maxSpeed) * 0.4, Math.min(1, dt * 6));
    const gy = this.groundY(p.x) - 18;
    if (p.y < gy - 560) { p.y = gy - 560; p.vy = Math.max(0, p.vy); }
    if (p.y >= gy) {
      if (!p.grounded) {
        const impact = p.vy;
        if (impact > 125 || Math.abs(p.vx) > 120) {
          this.resource -= 30;
          this.shake = 1;
          audio.sfxPlay('hit');
          this.warn('Rotor strike! Land slower — under 4 m/s');
          for (let i = 0; i < 24; i++) this.spawn(p.x, gy + 16, (Math.random() - 0.5) * 260, -Math.random() * 200, 0.8, 2 + Math.random() * 3, '#ffd29a', true, 260);
          p.vy = -impact * 0.35;
          p.y = gy - 1;
          return;
        }
        audio.sfxPlay('land');
        for (let i = 0; i < 14; i++) this.spawn(p.x + (Math.random() - 0.5) * 40, gy + 16, (Math.random() - 0.5) * 160, -Math.random() * 40, 1.4, 4 + Math.random() * 6, 'rgba(200,130,90,0.4)', false, 10);
      }
      p.y = gy;
      p.vy = 0;
      p.grounded = true;
      p.vx *= Math.max(0, 1 - dt * 10);
      this.resource = clamp(this.resource + 9 * dt, 0, 100);
    } else {
      p.grounded = false;
    }
    if (k.up && canFly && p.grounded && p.rpm > 0.6) {
      p.grounded = false;
      p.vy = -20;
    }
    if (!p.grounded) this.resource = clamp(this.resource - L.drain * p.rpm * dt, 0, 100);
    // rotor downwash
    const alt = gy - p.y;
    if (p.rpm > 0.3 && alt < 220 && Math.random() < p.rpm * (1 - alt / 220)) {
      const side = Math.random() > 0.5 ? 1 : -1;
      this.spawn(p.x + side * 10, gy + 16, side * (80 + Math.random() * 120), -10 - Math.random() * 30, 1.3, 4 + Math.random() * 7, 'rgba(205,140,95,0.4)', false, 4);
    }
    if (this.resource < 25 && !p.grounded) this.warn('Battery low — land in the sunlight to recharge');
  }

  private updateProbe(dt: number) {
    const L = this.L;
    const p = this.p;
    const k = this.keys;
    const alive = !this.finished;
    const ix = alive ? (k.right ? 1 : 0) - (k.left ? 1 : 0) : 0;
    const iy = alive ? (k.down ? 1 : 0) - (k.up ? 1 : 0) : 0;
    p.vx += (ix * 260 + 60 - p.vx * 0.35) * dt;
    p.vy += (iy * 300 - p.vy * 1.4) * dt;
    if (L.planet) {
      const dx = L.planet.x - p.x;
      const dy = L.planet.y - p.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      const f = Math.min(260, 9e6 / d2);
      p.vx += (dx / d) * f * dt;
      p.vy += (dy / d) * f * dt;
      if (d < L.planet.r + 14 && p.invuln <= 0) {
        this.resource -= 25;
        p.invuln = 1;
        this.shake = 1;
        audio.sfxPlay('hit');
        p.vx -= (dx / d) * 200;
        p.vy -= (dy / d) * 200;
        this.warn('Too close! Jupiter’s radiation is frying the electronics');
      }
    }
    p.vx = clamp(p.vx, -160, L.maxSpeed);
    p.vy = clamp(p.vy, -240, 240);
    p.x = clamp(p.x + p.vx * dt, 60, L.length - 260);
    p.y = clamp(p.y + p.vy * dt, -330, 330);
    p.tilt = lerp(p.tilt, p.vy / 900, Math.min(1, dt * 5));
    if (ix || iy) {
      this.spawn(p.x - 26, p.y + 4, -120 - Math.random() * 80 + p.vx * 0.3, (Math.random() - 0.5) * 40, 0.4, 2 + Math.random() * 2, '#9fd8ff', true);
    }
    for (const a of this.asteroids) {
      a.y += a.vy * dt;
      a.rot += a.spin * dt;
      if (a.y > 360) a.y -= 720;
      if (a.y < -360) a.y += 720;
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      if (p.invuln <= 0 && dx * dx + dy * dy < (a.r + 16) ** 2) {
        this.resource -= 20;
        p.invuln = 1.1;
        this.shake = 0.8;
        audio.sfxPlay('hit');
        p.vx -= 80;
        for (let i = 0; i < 18; i++) this.spawn(p.x, p.y, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, 0.7, 1.5 + Math.random() * 2, '#ffcf8a', true);
        this.warn('Impact! Steer between the rocks');
      }
    }
    this.resource = clamp(this.resource, 0, 100);
  }

  private updateArm(dt: number) {
    const k = this.keys;
    const sh = this.shoulder();
    const ix = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    const iy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
    const speed = this.L.maxSpeed;
    this.armMoving = !!(ix || iy) && !this.holding;
    if (this.holding || this.finished) return;
    let nx = this.tip.x + ix * speed * dt;
    let ny = this.tip.y + iy * speed * dt;
    const dx = nx - sh.x;
    const dy = ny - sh.y;
    const d = Math.hypot(dx, dy);
    const reach = ARM_L1 + ARM_L2 - 6;
    if (d > reach) {
      nx = sh.x + (dx / d) * reach;
      ny = sh.y + (dy / d) * reach;
    }
    nx = Math.max(nx, sh.x - 110);
    ny = Math.min(ny, this.groundY(nx) - 8);
    if (ny > this.groundY(nx) - 12 && Math.abs(nx - this.tip.x) > 0.5 && Math.random() < 0.3) {
      this.spawn(nx, this.groundY(nx) - 2, (Math.random() - 0.5) * 40, -20, 0.8, 2 + Math.random() * 3, 'rgba(190,120,80,0.5)', false, 60);
    }
    this.tip.x = nx;
    this.tip.y = ny;
  }

  private updateDevils(dt: number) {
    const L = this.L;
    for (const d of this.devils) {
      d.x += d.v * dt;
      d.ph += dt;
      if (d.x < 400 || d.x > L.length - 300) d.v *= -1;
      if (Math.random() < 0.5) {
        const a = Math.random() * Math.PI * 2;
        const hy = Math.random() * d.h;
        this.spawn(d.x + Math.cos(a) * (10 + hy * 0.25), this.groundY(d.x) - hy, Math.cos(a + 1.5) * 60 + d.v, -30 - Math.random() * 40, 1.4, 3 + Math.random() * 6, 'rgba(214,160,120,0.28)', false, -10);
      }
      if (L.vehicle === 'rover' && Math.abs(d.x - this.p.x) < 45 && !this.opts.demo) {
        const before = this.panelDust;
        this.panelDust = Math.max(0, this.panelDust - dt * 0.9);
        if (before > 0.05 && this.panelDust <= 0.05) audio.sfxPlay('complete');
        if (Math.random() < 0.05) audio.sfxPlay('whoosh');
      }
    }
  }

  // ---------- objectives ----------
  private evalObjective(o: Objective): { near: boolean; ready: boolean; auto: boolean; hint?: string } {
    const p = this.p;
    const L = this.L;
    switch (o.kind) {
      case 'scan': {
        const near = Math.abs(p.x - o.x) < 60;
        const ready = near && Math.abs(p.vx) < 30;
        return { near, ready, auto: false, hint: near && !ready ? 'Stop the rover first' : undefined };
      }
      case 'reach':
      case 'climb':
      case 'gate':
        return { near: false, ready: false, auto: true };
      case 'land': {
        const near = Math.abs(p.x - o.x) < 70;
        const ready = near && p.grounded && Math.abs(p.vx) < 25;
        return { near, ready, auto: true, hint: near && !p.grounded ? 'Descend slowly onto the pad' : undefined };
      }
      case 'transmit': {
        const near = Math.abs(p.x - o.x) < 160;
        return { near, ready: near, auto: false };
      }
      case 'dig':
      case 'place': {
        const nearGround = this.groundY(this.tip.x) - this.tip.y < 18;
        const near = Math.abs(this.tip.x - o.x) < 45;
        const needCarry = o.kind === 'place';
        const ready = near && nearGround && (needCarry ? !!this.carrying : !this.carrying);
        return { near, ready, auto: false, hint: near && !nearGround ? 'Lower the arm to the ground' : undefined };
      }
      case 'observe': {
        const near = Math.abs(this.tip.x - o.x) < 90;
        return { near, ready: near, auto: false };
      }
      case 'pickup': {
        const ty = this.groundY(L.landerX ?? 300) + (o.y ?? -70);
        const near = Math.hypot(this.tip.x - o.x, this.tip.y - ty) < 42;
        return { near, ready: near, auto: false };
      }
      case 'deliver': {
        const ty = this.groundY(o.x) - 86;
        const near = Math.hypot(this.tip.x - o.x, this.tip.y - ty) < 46 && !!this.carrying;
        return { near, ready: near, auto: false };
      }
      case 'listen': {
        const ready = this.quakeT > 1.2;
        return { near: true, ready, auto: false, hint: ready ? undefined : 'Waiting for ground motion…' };
      }
    }
  }

  private updateObjectives(dt: number) {
    const L = this.L;
    const o = L.objectives[this.objIndex];
    this.holding = false;
    this.lastPrompt = null;
    if (!o || this.finished) return;
    const st = this.evalObjective(o);
    let complete = false;

    if (o.kind === 'reach') complete = this.p.x >= o.x;
    else if (o.kind === 'climb') complete = this.groundY(this.p.x) - 18 - this.p.y > 110;
    else if (o.kind === 'gate') complete = Math.abs(this.p.x - o.x) < 30 && Math.abs(this.p.y - (o.y ?? 0)) < 80;
    else {
      if (o.kind === 'listen') {
        if (this.quakeT < 0) this.quakeT = 0;
        this.quakeT += dt;
        if (this.quakeT > 1.2) this.shake = Math.max(this.shake, this.reduced ? 0 : 0.35);
      }
      const pressing = st.auto || this.keys.action;
      if (st.ready && pressing) {
        if (!this.wasHolding && !st.auto) audio.sfxPlay('scan');
        this.holdT += dt;
        this.holding = !st.auto;
        if (o.kind === 'dig') this.digDepth[o.x] = Math.max(this.digDepth[o.x] ?? 0, this.holdT / o.hold);
        if (o.kind === 'observe') this.iceLeft = 1 - (this.holdT / o.hold) * 0.85;
        if (o.kind === 'dig' || o.kind === 'scan') {
          if (Math.random() < 0.6) {
            const tx = o.kind === 'dig' ? this.tip.x : o.x + 30;
            const ty = o.kind === 'dig' ? this.groundY(tx) - 4 : this.groundY(tx) - 14;
            this.spawn(tx, ty, (Math.random() - 0.5) * 120, -40 - Math.random() * 90, 0.6, 1.5 + Math.random() * 2, o.ice ? '#e8f6ff' : L.scene === 'cleanroom' ? '#bfe6ff' : '#ffb27a', true, 200);
          }
        }
        if (this.holdT >= o.hold) complete = true;
      } else {
        this.holdT = Math.max(0, this.holdT - dt * 1.5);
      }
      this.wasHolding = st.ready && pressing;
      if (st.near || st.ready) {
        this.lastPrompt = {
          verb: o.verb,
          label: o.label,
          progress: clamp(this.holdT / Math.max(0.01, o.hold), 0, 1),
          ready: st.ready,
          hint: st.hint,
        };
      }
    }

    if (complete) {
      this.done[this.objIndex] = true;
      if (o.kind === 'dig') this.carrying = o.ice ? null : 'soil';
      if (o.kind === 'pickup') this.carrying = 'seis';
      if (o.kind === 'place') { this.carrying = null; this.placedSeis = this.tip.x; }
      if (o.kind === 'deliver') this.carrying = null;
      if (o.kind === 'listen') this.quakeT = -1;
      this.holdT = 0;
      this.wasHolding = false;
      audio.sfxPlay('complete');
      this.burst(o);
      this.emit({ type: 'objective', index: this.objIndex, obj: o });
      this.objIndex++;
      if (this.objIndex >= L.objectives.length) {
        this.finished = true;
        audio.sfxPlay('win');
      }
    }
  }

  private burst(o: Objective) {
    const x = this.L.vehicle === 'arm' ? this.tip.x : this.p.x;
    const y = this.L.vehicle === 'arm' ? this.tip.y : this.L.vehicle === 'probe' ? this.p.y : this.p.y - 40;
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 200;
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.9 + Math.random() * 0.6, 1.5 + Math.random() * 2.5, i % 3 ? '#8fe3ff' : '#ffd48a', true, 40);
    }
    void o;
  }

  private warn(msg: string) {
    if (this.warnCooldown > 0 && this.warning === msg) return;
    if (this.warning !== msg) audio.sfxPlay('alarm');
    this.warning = msg;
    this.warnCooldown = 2.2;
  }

  // ---------- particles / camera ----------
  private spawn(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string, glow = false, grav = 0) {
    if (this.particles.length > 700) this.particles.shift();
    const q: Particle = { x, y, vx, vy, life, max: life, size, color, glow, grav };
    this.particles.push(q);
    return q;
  }

  private updateParticles(dt: number) {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const q = ps[i];
      q.life -= dt;
      if (q.life <= 0) { ps.splice(i, 1); continue; }
      q.vy += (q.grav ?? 0) * dt;
      q.vx *= 1 - dt * 0.8;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    // ambient blowing dust
    if (this.L.scene === 'mars' && Math.random() < 0.4 + this.stormDark * 2) {
      const x = this.cam.x + this.W / this.scale / 2 + 20;
      const y = this.cam.y + (Math.random() - 0.6) * (this.H / this.scale);
      this.spawn(x, y, -160 - Math.random() * 200 - this.stormDark * 300, (Math.random() - 0.5) * 20, 5, 0.6 + Math.random() * 0.9, 'rgba(240,190,140,0.45)', false, 0).streak = true;
    }
  }

  private updateCamera(dt: number) {
    const L = this.L;
    const p = this.p;
    let tx = p.x;
    let ty = p.y;
    if (L.vehicle === 'rover') { tx = p.x + p.vx * 0.9 + 80; ty = p.y - (L.scene === 'cleanroom' ? 190 : 80); }
    else if (L.vehicle === 'heli') { tx = p.x + p.vx * 0.5; const gy = this.groundY(p.x); ty = Math.min((p.y + gy) / 2 - 30, gy - 200); }
    else if (L.vehicle === 'probe') { tx = p.x + 180 + p.vx * 0.4; ty = p.y * 0.45; }
    else { tx = (L.landerX ?? 300) + 210; ty = this.groundY(tx) - 150; }
    const k = Math.min(1, dt * (L.vehicle === 'arm' ? 2 : 3.5));
    this.cam.x = lerp(this.cam.x, tx, k);
    this.cam.y = lerp(this.cam.y, ty, k);
  }

  getHud(): HudState {
    const L = this.L;
    const gy = this.groundY(this.p.x) - 18;
    return {
      resource: this.resource,
      resourceLabel: L.vehicle === 'probe' ? 'Hull' : L.solar ? 'Battery' : 'RTG Power',
      speed: Math.abs(this.p.vx),
      progress: clamp(this.p.x / L.length, 0, 1),
      objIndex: this.objIndex,
      prompt: this.lastPrompt,
      warning: this.warnCooldown > 0 ? this.warning : null,
      altitude: L.vehicle === 'heli' ? Math.max(0, (gy - this.p.y) / 36) : 0,
      vspeed: L.vehicle === 'heli' ? this.p.vy / 36 : 0,
      time: this.time,
      panelDust: this.panelDust,
      tau: 0.6 + this.stormDark * 10.2,
      signal: L.tether ? clamp(1 - (this.p.x - L.tether.x) / L.tether.range, 0, 1) : 1,
      carrying: this.carrying,
      markers: L.objectives.map((o) => o.x / L.length),
      done: [...this.done],
    };
  }

  // ---------- render ----------
  private render(t: number) {
    const { ctx, W, H, dpr } = this;
    const L = this.L;
    const s = this.scale;
    const sh = this.reduced ? 0 : this.shake;
    const camX = this.cam.x + (Math.random() - 0.5) * sh * 18;
    const camY = this.cam.y + (Math.random() - 0.5) * sh * 18;
    const ox = W / 2 - camX * s;
    const oy = H * 0.5 - camY * s;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawSky(t, camX, camY);

    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
    if (L.scene === 'cleanroom') this.drawCleanroom(t, camX);
    if (L.scene === 'space') this.drawSpace(t);
    if (L.scene !== 'space') this.drawGround(camX);
    this.drawProps(t);
    this.drawDevils(t);
    this.drawPlayer(t);
    this.drawParticles();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawOverlay(t);
  }

  private drawSky(t: number, camX: number, camY: number) {
    const { ctx, W, H } = this;
    const P = this.L.palette;
    const sd = this.stormDark;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sd ? mixHex(P.skyTop, '#120a08', sd) : P.skyTop);
    g.addColorStop(1, sd ? mixHex(P.skyBottom, '#4a2a1a', sd) : P.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars (dimmer through the Martian sky)
    const starA = this.L.scene === 'space' ? 1 : this.L.scene === 'cleanroom' ? 0 : 0.35 * (1 - sd);
    if (starA > 0) {
      for (const st of this.stars) {
        const px = (((st.x * W * 3 - camX * st.z * this.scale) % W) + W) % W;
        const py = this.L.scene === 'space' ? (((st.y * H * 2 - camY * st.z * this.scale) % H) + H) % H : st.y * H * 0.5;
        const a = starA * (0.5 + 0.5 * Math.sin(t * 2 + st.tw));
        ctx.fillStyle = `rgba(230,240,255,${a})`;
        ctx.fillRect(px, py, st.r, st.r);
      }
    }
    if (this.L.scene === 'mars') {
      // small pale sun with the blue Martian halo
      const sx = W * 0.78 - camX * 0.02 * this.scale;
      const sy = H * 0.2;
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.45);
      halo.addColorStop(0, `rgba(170,205,255,${0.55 * (1 - sd)})`);
      halo.addColorStop(0.15, `rgba(140,180,230,${0.22 * (1 - sd)})`);
      halo.addColorStop(1, 'rgba(140,180,230,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(245,250,255,${1 - sd * 0.9})`;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(5, H * 0.012), 0, Math.PI * 2);
      ctx.fill();
      // Phobos
      ctx.fillStyle = `rgba(120,100,95,${0.8 * (1 - sd)})`;
      ctx.beginPath();
      ctx.ellipse(W * 0.22 - camX * 0.01 * this.scale, H * 0.14, 6, 4.5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      this.ridge(camX, camY, 0.08, 0.36, 140, 0.0016, this.L.palette.far, 0.65, 1);
      this.ridge(camX, camY, 0.22, 0.5, 90, 0.0035, this.L.palette.mid, 0.85, 2);
      // haze band
      const hz = ctx.createLinearGradient(0, H * 0.35, 0, H);
      hz.addColorStop(0, 'rgba(0,0,0,0)');
      hz.addColorStop(1, sd ? `rgba(120,70,40,${0.3 + sd * 0.5})` : P.haze);
      ctx.fillStyle = hz;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.L.scene === 'space') {
      // nebula washes (teal + rose, no violet)
      const blobs: [number, number, number, string][] = [
        [0.25, 0.3, 0.6, 'rgba(40,140,160,0.10)'],
        [0.75, 0.7, 0.7, 'rgba(190,80,70,0.08)'],
        [0.5, 0.15, 0.4, 'rgba(60,110,200,0.08)'],
      ];
      for (const [bx, by, br, c] of blobs) {
        const x = bx * W - (camX * 0.03 * this.scale) % W;
        const rg = ctx.createRadialGradient(x, by * H, 0, x, by * H, br * Math.max(W, H));
        rg.addColorStop(0, c);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
      }
      // the Sun recedes behind us
      const fade = clamp(1 - this.p.x / this.L.length, 0.1, 1);
      const sx = W * 0.05 - (this.p.x / this.L.length) * W * 0.4;
      const sg = ctx.createRadialGradient(sx, H * 0.5, 0, sx, H * 0.5, H * 0.9 * fade);
      sg.addColorStop(0, `rgba(255,240,200,${0.9 * fade})`);
      sg.addColorStop(0.08, `rgba(255,200,120,${0.35 * fade})`);
      sg.addColorStop(1, 'rgba(255,180,100,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  private ridge(camX: number, camY: number, par: number, base: number, amp: number, freq: number, color: string, alpha: number, seed: number) {
    const { ctx, W, H } = this;
    const s = this.scale;
    ctx.globalAlpha = alpha * (1 - this.stormDark * 0.7);
    ctx.fillStyle = color;
    ctx.beginPath();
    const by = H * base - camY * par * s * 0.4;
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 8) {
      const wx = (x - W / 2) / s + camX * par;
      const y = by - amp * s * (0.6 * Math.sin(wx * freq + seed) + 0.3 * Math.sin(wx * freq * 2.7 + seed * 3) + 0.1 * Math.sin(wx * freq * 7 + seed));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private visibleRange() {
    const half = this.W / this.scale / 2 + 60;
    return [this.cam.x - half, this.cam.x + half];
  }

  private drawGround(camX: number) {
    const { ctx } = this;
    const P = this.L.palette;
    const [x0, x1] = this.visibleRange();
    const bottom = this.cam.y + this.H / this.scale;
    const top = this.groundY(camX) - 60;
    ctx.beginPath();
    ctx.moveTo(x0, bottom);
    for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, this.groundY(x));
    ctx.lineTo(x1, bottom);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, top + 340);
    g.addColorStop(0, P.ground);
    g.addColorStop(1, P.groundDeep);
    ctx.fillStyle = g;
    ctx.fill();
    // lit rim
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, this.groundY(x) + 0.5);
    ctx.strokeStyle = P.rim;
    ctx.globalAlpha = this.L.scene === 'cleanroom' ? 0.9 : 0.55;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (this.L.scene === 'cleanroom') {
      // glossy floor tiles + reflections
      ctx.strokeStyle = 'rgba(120,140,170,0.35)';
      ctx.lineWidth = 1;
      for (let x = Math.floor(x0 / 80) * 80; x < x1; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 40, 120);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x0, 2, x1 - x0, 6);
      return;
    }
    // pebbles
    for (let c = Math.floor(x0 / 14); c < x1 / 14; c++) {
      const h = hash(c);
      if (h > 0.55) continue;
      const x = c * 14 + hash(c + 7) * 14;
      const depth = hash(c + 3) * 70;
      const gy = this.groundY(x) + depth;
      ctx.fillStyle = depth < 4 ? 'rgba(60,24,12,0.55)' : `rgba(40,14,8,${0.25 - depth / 400})`;
      ctx.beginPath();
      ctx.ellipse(x, gy + 2, 1 + h * 4, 0.8 + h * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // boulders
    for (const r of this.rocks) {
      if (r.x < x0 - 40 || r.x > x1 + 40) continue;
      this.drawRock(r.x, this.groundY(r.x), r.r, r.h, r.s);
    }
  }

  private drawRock(x: number, gy: number, r: number, h: number, s: number, highlight = false) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(30,10,5,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + r * 0.5, gy + 1, r * 1.3, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(x - r, gy - r * h * 2, x + r, gy);
    g.addColorStop(0, highlight ? '#d99a6a' : '#8e5236');
    g.addColorStop(1, highlight ? '#6b3420' : '#3f1d12');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - r, gy + 2);
    ctx.quadraticCurveTo(x - r * 0.9, gy - r * h * 1.4, x - r * 0.2 + s * 4, gy - r * h * 1.8);
    ctx.quadraticCurveTo(x + r * 0.7, gy - r * h * 1.6, x + r, gy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,160,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, gy - r * h * 1.2);
    ctx.quadraticCurveTo(x - r * 0.2, gy - r * h * 1.8, x + r * 0.3, gy - r * h * 1.6);
    ctx.stroke();
  }

  private drawCleanroom(t: number, camX: number) {
    const { ctx } = this;
    const [x0, x1] = this.visibleRange();
    // back wall
    const g = ctx.createLinearGradient(0, -600, 0, 0);
    g.addColorStop(0, '#0c1424');
    g.addColorStop(1, '#1a2840');
    ctx.fillStyle = g;
    ctx.fillRect(x0, -700, x1 - x0, 700);
    // wall panels
    ctx.strokeStyle = 'rgba(120,160,210,0.12)';
    ctx.lineWidth = 2;
    for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) {
      ctx.strokeRect(x + 6, -520, 148, 500);
    }
    // the big night window
    const wx0 = 760, wx1 = 1420, wy0 = -470, wy1 = -170;
    const sky = ctx.createLinearGradient(0, wy0, 0, wy1);
    sky.addColorStop(0, '#02040b');
    sky.addColorStop(0.75, '#0b1430');
    sky.addColorStop(1, '#3a2a2a');
    ctx.fillStyle = sky;
    ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    ctx.clip();
    for (let i = 0; i < 90; i++) {
      const sx = wx0 + hash(i) * (wx1 - wx0);
      const sy = wy0 + hash(i + 50) * (wy1 - wy0) * 0.85;
      ctx.fillStyle = `rgba(220,230,255,${0.3 + 0.4 * Math.sin(t * 1.5 + i)})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    // San Gabriel mountains silhouette + city glow
    ctx.fillStyle = '#05070d';
    ctx.beginPath();
    ctx.moveTo(wx0, wy1);
    for (let x = wx0; x <= wx1; x += 10) ctx.lineTo(x, wy1 - 40 - 30 * Math.sin(x * 0.012) - 14 * Math.sin(x * 0.04));
    ctx.lineTo(wx1, wy1);
    ctx.fill();
    const named: [number, number, string, number][] = [
      [900, -400, '#ffb97a', 0],
      [1250, -380, '#cfe4ff', 1],
    ];
    for (const [sx, sy, c, i] of named) {
      const lit = this.done[i + 1];
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + i);
      const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, lit ? 46 : 26);
      rg.addColorStop(0, c);
      rg.addColorStop(0.2, c + '88');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = pulse;
      ctx.fillStyle = rg;
      ctx.fillRect(sx - 50, sy - 50, 100, 100);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = '#8fa3c0';
    ctx.lineWidth = 6;
    ctx.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    ctx.lineWidth = 3;
    for (let x = wx0 + 165; x < wx1; x += 165) {
      ctx.beginPath();
      ctx.moveTo(x, wy0);
      ctx.lineTo(x, wy1);
      ctx.stroke();
    }
    // ceiling light strips
    for (let x = Math.floor(x0 / 240) * 240; x < x1; x += 240) {
      const lg = ctx.createLinearGradient(0, -600, 0, -300);
      lg.addColorStop(0, 'rgba(180,215,255,0.22)');
      lg.addColorStop(1, 'rgba(180,215,255,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(x + 60, -580);
      ctx.lineTo(x + 180, -580);
      ctx.lineTo(x + 230, -300);
      ctx.lineTo(x + 10, -300);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,240,255,0.9)';
      ctx.fillRect(x + 60, -586, 120, 6);
    }
    // assembly cradle
    ctx.fillStyle = '#3c4c66';
    ctx.fillRect(110, -20, 140, 20);
    ctx.fillStyle = '#e0a040';
    for (let i = 0; i < 7; i++) ctx.fillRect(112 + i * 20, -20, 10, 4);
    // DSN console
    const cx = 1690;
    ctx.fillStyle = '#1d2a3f';
    ctx.fillRect(cx - 10, -120, 120, 120);
    ctx.fillStyle = '#26354f';
    ctx.fillRect(cx - 20, -130, 140, 14);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = this.done[3] ? '#38f0a8' : i === Math.floor(t * 2) % 3 ? '#5fd0ff' : '#1f6a9a';
      ctx.fillRect(cx + i * 36, -108, 28, 18);
    }
    void camX;
  }

  private drawSpace(t: number) {
    const { ctx } = this;
    const L = this.L;
    const pl = L.planet;
    if (pl) {
      const [x0, x1] = this.visibleRange();
      if (pl.x + pl.r * 3 > x0 && pl.x - pl.r * 3 < x1) {
        const glow = ctx.createRadialGradient(pl.x, pl.y, pl.r * 0.9, pl.x, pl.y, pl.r * 1.6);
        glow.addColorStop(0, 'rgba(255,200,150,0.25)');
        glow.addColorStop(1, 'rgba(255,200,150,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.r * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2);
        ctx.clip();
        const bands = ['#d9b38c', '#b07b52', '#e8d2b0', '#9c6a48', '#f0dcc0', '#c08a60', '#e2c49c', '#a87650', '#d8b892'];
        const bh = (pl.r * 2) / bands.length;
        bands.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          const y = pl.y - pl.r + i * bh;
          ctx.moveTo(pl.x - pl.r, y);
          for (let x = -pl.r; x <= pl.r; x += 12) ctx.lineTo(pl.x + x, y + Math.sin(x * 0.05 + t * 0.4 + i) * 3);
          ctx.lineTo(pl.x + pl.r, y + bh + 4);
          ctx.lineTo(pl.x - pl.r, y + bh + 4);
          ctx.fill();
        });
        ctx.fillStyle = '#b5523a';
        ctx.beginPath();
        ctx.ellipse(pl.x + pl.r * 0.3, pl.y + pl.r * 0.35, pl.r * 0.17, pl.r * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        const shade = ctx.createLinearGradient(pl.x - pl.r, 0, pl.x + pl.r, 0);
        shade.addColorStop(0, 'rgba(0,0,0,0)');
        shade.addColorStop(0.55, 'rgba(0,0,0,0.1)');
        shade.addColorStop(1, 'rgba(0,0,10,0.8)');
        ctx.fillStyle = shade;
        ctx.fillRect(pl.x - pl.r, pl.y - pl.r, pl.r * 2, pl.r * 2);
        ctx.restore();
      }
    }
    for (const a of this.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      a.verts.forEach((v, i) => {
        const ang = (i / a.verts.length) * Math.PI * 2;
        const px = Math.cos(ang) * a.r * v;
        const py = Math.sin(ang) * a.r * v;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      const g = ctx.createLinearGradient(-a.r, -a.r, a.r, a.r);
      g.addColorStop(0, '#8d8378');
      g.addColorStop(1, '#2b2622');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.arc(a.r * 0.2, -a.r * 0.1, a.r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // pale blue dot near the end
    const end = L.length - 100;
    ctx.fillStyle = '#7fb6ff';
    ctx.beginPath();
    ctx.arc(end + 300, -180, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawProps(t: number) {
    const { ctx } = this;
    const L = this.L;
    // landers
    if (L.landerX && L.skin === 'sojourner') this.drawPathfinder(L.landerX, t);
    if (L.vehicle === 'arm') this.drawLander(L.landerX ?? 300, t);
    if (L.tether) {
      // radio range edge
      const ex = L.tether.x + L.tether.range;
      const gy = this.groundY(ex);
      ctx.strokeStyle = 'rgba(120,220,255,0.35)';
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex, gy);
      ctx.lineTo(ex, gy - 260);
      ctx.stroke();
      ctx.setLineDash([]);
      // signal arcs from lander
      const d = this.p.x - L.tether.x;
      for (let i = 0; i < 3; i++) {
        const r = ((t * 120 + i * 140) % 420) + 20;
        ctx.strokeStyle = `rgba(140,220,255,${0.25 * (1 - r / 440)})`;
        ctx.beginPath();
        ctx.arc(L.tether.x, this.groundY(L.tether.x) - 60, r, -Math.PI * 0.45, -Math.PI * 0.05);
        ctx.stroke();
      }
      void d;
    }
    // objective markers
    L.objectives.forEach((o, i) => {
      const active = i === this.objIndex && !this.finished;
      const done = this.done[i];
      if (L.scene === 'mars' && (o.kind === 'scan') ) this.drawRock(o.x + 34, this.groundY(o.x + 34), 22, 0.8, 0.5, true);
      if (o.kind === 'land' || o.kind === 'climb') this.drawPad(o.x, done, active, t);
      if (o.kind === 'gate' || o.kind === 'transmit') this.drawGate(o, active, done, t);
      if (L.vehicle === 'arm' && (o.kind === 'dig' || o.kind === 'observe')) this.drawTrench(o.x, o.ice);
      if (!active) {
        if (done && L.vehicle === 'rover') this.drawFlag(o.x, t);
        return;
      }
      if (o.kind === 'gate' || o.kind === 'transmit' || o.kind === 'climb' || o.kind === 'listen') return;
      let bx = o.x;
      let by = L.scene === 'space' ? 0 : this.groundY(o.x);
      if (o.kind === 'deliver') by = this.groundY(o.x) - 86;
      if (o.kind === 'pickup') by = this.groundY(L.landerX ?? 300) + (o.y ?? -70);
      this.drawBeacon(bx, by, t, o.kind === 'deliver' || o.kind === 'pickup');
    });
    if (this.placedSeis !== null) this.drawSeis(this.placedSeis, this.groundY(this.placedSeis), t);
  }

  private drawBeacon(x: number, y: number, t: number, small: boolean) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (!small) {
      const g = ctx.createLinearGradient(0, y - 240, 0, y);
      g.addColorStop(0, 'rgba(90,210,255,0)');
      g.addColorStop(1, `rgba(90,210,255,${0.28 + 0.1 * Math.sin(t * 4)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 240, 32, 240);
    }
    for (let i = 0; i < 2; i++) {
      const ph = (t * 0.8 + i * 0.5) % 1;
      ctx.strokeStyle = `rgba(120,225,255,${0.7 * (1 - ph)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, (small ? 12 : 18) + ph * (small ? 26 : 60), (small ? 12 : 5) + ph * (small ? 26 : 14), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // diamond
    const dy = y - (small ? 40 : 120) + Math.sin(t * 3) * 6;
    ctx.fillStyle = '#8fe8ff';
    ctx.beginPath();
    ctx.moveTo(x, dy - 9);
    ctx.lineTo(x + 7, dy);
    ctx.lineTo(x, dy + 9);
    ctx.lineTo(x - 7, dy);
    ctx.fill();
    ctx.restore();
  }

  private drawFlag(x: number, t: number) {
    const { ctx } = this;
    const gy = this.groundY(x);
    ctx.strokeStyle = '#d9e3ef';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x, gy - 46);
    ctx.stroke();
    ctx.fillStyle = '#3ce0a0';
    ctx.beginPath();
    ctx.moveTo(x, gy - 46);
    ctx.quadraticCurveTo(x + 10, gy - 46 + Math.sin(t * 4) * 3, x + 22, gy - 40);
    ctx.lineTo(x, gy - 34);
    ctx.fill();
  }

  private drawPad(x: number, done: boolean, active: boolean, t: number) {
    const { ctx } = this;
    const gy = this.groundY(x);
    ctx.save();
    ctx.strokeStyle = done ? 'rgba(60,224,160,0.9)' : active ? `rgba(120,225,255,${0.6 + 0.4 * Math.sin(t * 5)})` : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, gy + 1, 52, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 14, gy + 1);
    ctx.lineTo(x + 14, gy + 1);
    ctx.stroke();
    if (active) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, gy - 200, 0, gy);
      g.addColorStop(0, 'rgba(90,210,255,0)');
      g.addColorStop(1, 'rgba(90,210,255,0.22)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 52, gy - 200, 104, 200);
    }
    ctx.restore();
  }

  private drawGate(o: Objective, active: boolean, done: boolean, t: number) {
    const { ctx } = this;
    const y = o.y ?? 0;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const c = done ? '60,224,160' : active ? '120,225,255' : '160,170,200';
    if (o.kind === 'transmit') {
      // Earth relay beam
      const g = ctx.createRadialGradient(o.x, y, 0, o.x, y, 160);
      g.addColorStop(0, `rgba(${c},0.25)`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, y, 160, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${c},${0.8 - i * 0.22})`;
      ctx.lineWidth = 4 - i;
      ctx.beginPath();
      ctx.ellipse(o.x, y, 22 + i * 6 + Math.sin(t * 3 + i) * 2, 80 + i * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawTrench(x: number, ice?: boolean) {
    const { ctx } = this;
    const d = clamp(this.digDepth[x] ?? 0, 0, 1);
    if (d <= 0) return;
    const gy = this.groundY(x);
    ctx.fillStyle = '#2a120a';
    ctx.beginPath();
    ctx.ellipse(x, gy + 2, 42 * d + 8, 10 * d + 2, 0, 0, Math.PI);
    ctx.fill();
    if (ice) {
      ctx.fillStyle = `rgba(235,248,255,${0.9 * d * this.iceLeft})`;
      ctx.beginPath();
      ctx.ellipse(x, gy + 5, 30 * d, 4 * d, 0, 0, Math.PI);
      ctx.fill();
    }
  }

  private drawPathfinder(x: number, t: number) {
    const { ctx } = this;
    const gy = this.groundY(x);
    // deflated airbags
    ctx.fillStyle = 'rgba(210,200,180,0.75)';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(x + i * 34, gy - 6, 26, 10, 0, Math.PI, 0);
      ctx.fill();
    }
    // petals
    ctx.fillStyle = '#1e3150';
    ctx.beginPath();
    ctx.moveTo(x - 80, gy - 4);
    ctx.lineTo(x - 30, gy - 18);
    ctx.lineTo(x + 30, gy - 18);
    ctx.lineTo(x + 80, gy - 4);
    ctx.lineTo(x + 70, gy);
    ctx.lineTo(x - 70, gy);
    ctx.fill();
    ctx.strokeStyle = '#4c79b8';
    ctx.lineWidth = 1;
    for (let i = -70; i < 70; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x + i, gy - 3);
      ctx.lineTo(x + i * 0.4, gy - 17);
      ctx.stroke();
    }
    ctx.fillStyle = '#c8b28a';
    ctx.fillRect(x - 22, gy - 38, 44, 20);
    // IMP camera mast
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, gy - 38);
    ctx.lineTo(x, gy - 76);
    ctx.stroke();
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x - 7, gy - 84, 14, 9);
    ctx.fillStyle = `rgba(80,220,255,${0.5 + 0.5 * Math.sin(t * 6)})`;
    ctx.fillRect(x + 18, gy - 50, 3, 3);
  }

  private drawLander(x: number, t: number) {
    const { ctx } = this;
    const L = this.L;
    const gy = this.groundY(x);
    const viking = L.skin === 'viking';
    ctx.fillStyle = 'rgba(20,8,4,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, gy + 2, 120, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.strokeStyle = '#b8bcc4';
    ctx.lineWidth = 4;
    for (const lx of [-70, 70, 0]) {
      ctx.beginPath();
      ctx.moveTo(x + lx * 0.5, gy - 44);
      ctx.lineTo(x + lx, gy - 4);
      ctx.stroke();
      ctx.fillStyle = '#8d939c';
      ctx.beginPath();
      ctx.ellipse(x + lx, gy - 2, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (viking) {
      // hexagonal body
      const bg = ctx.createLinearGradient(0, gy - 80, 0, gy - 40);
      bg.addColorStop(0, '#e9e4d8');
      bg.addColorStop(1, '#8f8a80');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(x - 64, gy - 44);
      ctx.lineTo(x - 50, gy - 78);
      ctx.lineTo(x + 50, gy - 78);
      ctx.lineTo(x + 64, gy - 44);
      ctx.closePath();
      ctx.fill();
      // RTG covers
      ctx.fillStyle = '#5c5f66';
      ctx.fillRect(x - 46, gy - 96, 18, 20);
      ctx.fillRect(x - 22, gy - 96, 18, 20);
      // high-gain dish
      ctx.strokeStyle = '#d0d4da';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 20, gy - 78);
      ctx.lineTo(x - 30, gy - 140);
      ctx.stroke();
      ctx.fillStyle = '#eef0f2';
      ctx.beginPath();
      ctx.ellipse(x - 30, gy - 146, 34, 10, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // camera
      ctx.fillStyle = '#c9ccd2';
      ctx.fillRect(x + 20, gy - 110, 10, 32);
      ctx.fillRect(x + 16, gy - 118, 18, 10);
      // biology hopper
      L.hoppers?.forEach((h) => {
        ctx.fillStyle = '#d8a040';
        ctx.beginPath();
        ctx.moveTo(h.x - 14, gy - 92);
        ctx.lineTo(h.x + 14, gy - 92);
        ctx.lineTo(h.x + 6, gy - 78);
        ctx.lineTo(h.x - 6, gy - 78);
        ctx.fill();
      });
    } else {
      // InSight: deck + two round solar arrays
      ctx.fillStyle = '#dfe2e8';
      ctx.fillRect(x - 54, gy - 66, 108, 22);
      ctx.fillStyle = '#c99a3a';
      ctx.fillRect(x - 54, gy - 48, 108, 4);
      for (const side of [-1, 1]) {
        const px = x + side * 110;
        ctx.fillStyle = '#18233a';
        ctx.beginPath();
        ctx.ellipse(px, gy - 60, 58, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,160,230,0.6)';
        ctx.lineWidth = 1;
        for (let i = -48; i <= 48; i += 12) {
          ctx.beginPath();
          ctx.moveTo(px + i, gy - 67);
          ctx.lineTo(px + i * 1.05, gy - 52);
          ctx.stroke();
        }
        ctx.strokeStyle = '#aab';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + side * 54, gy - 58);
        ctx.lineTo(px - side * 56, gy - 60);
        ctx.stroke();
      }
      // SEIS on deck until lifted
      if (!this.done[2]) this.drawSeis(x - 10, gy - 66, t);
      // wind & thermal shield waiting
      ctx.fillStyle = '#e8e8e0';
      ctx.beginPath();
      ctx.arc(x - 32, gy - 66, 13, Math.PI, 0);
      ctx.fill();
    }
    this.drawArm(t);
  }

  private drawSeis(x: number, y: number, t: number) {
    const { ctx } = this;
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath();
    ctx.arc(x, y, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#8a6a2a';
    ctx.fillRect(x - 16, y - 2, 32, 3);
    if (this.objIndex === 4 && this.quakeT > 1.2) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const r = ((t * 140 + i * 60) % 180) + 10;
        ctx.strokeStyle = `rgba(255,210,120,${0.5 * (1 - r / 190)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawArm(t: number) {
    const { ctx } = this;
    const sh = this.shoulder();
    const tip = this.tip;
    const dx = tip.x - sh.x;
    const dy = tip.y - sh.y;
    const d = clamp(Math.hypot(dx, dy), 1, ARM_L1 + ARM_L2 - 1);
    const a = Math.atan2(dy, dx);
    const cosB = clamp((ARM_L1 * ARM_L1 + d * d - ARM_L2 * ARM_L2) / (2 * ARM_L1 * d), -1, 1);
    const b = Math.acos(cosB);
    const ex = sh.x + Math.cos(a - b) * ARM_L1;
    const ey = sh.y + Math.sin(a - b) * ARM_L1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#52565e';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(ex, ey);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.strokeStyle = '#d9dde3';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = '#2b2f36';
    for (const [jx, jy] of [[sh.x, sh.y], [ex, ey]]) {
      ctx.beginPath();
      ctx.arc(jx, jy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // scoop / grapple
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.fillStyle = '#9aa0a8';
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(12, -6);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    if (this.carrying === 'soil') {
      ctx.fillStyle = '#9c4d28';
      ctx.beginPath();
      ctx.ellipse(0, -6, 11, 5, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.restore();
    if (this.carrying === 'seis') this.drawSeis(tip.x, tip.y + 22, t);
    ctx.lineCap = 'butt';
  }

  private drawDevils(t: number) {
    const { ctx } = this;
    for (const d of this.devils) {
      const gy = this.groundY(d.x);
      ctx.save();
      for (let i = 0; i < 14; i++) {
        const h = (i / 14) * d.h;
        const w = 10 + h * 0.28;
        const sway = Math.sin(t * 1.5 + d.ph + i * 0.3) * h * 0.08;
        ctx.strokeStyle = `rgba(222,170,130,${0.16 - i * 0.006})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(d.x + sway, gy - h, w, 4 + w * 0.12, 0, t * 4 + i, t * 4 + i + Math.PI * 1.4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private skinSpan() {
    const s = this.L.skin;
    return s === 'sojourner' ? 14 : s === 'vali' ? 32 : 26;
  }

  private drawPlayer(t: number) {
    const L = this.L;
    if (L.vehicle === 'rover') this.drawRover(t);
    else if (L.vehicle === 'heli') this.drawHeli(t);
    else if (L.vehicle === 'probe') this.drawProbe(t);
  }

  private drawWheel(x: number, y: number, r: number, rot: number) {
    const { ctx } = this;
    ctx.fillStyle = '#1b1d22';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a9afb8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62);
      ctx.stroke();
    }
  }

  private drawRover(t: number) {
    const { ctx } = this;
    const p = this.p;
    const L = this.L;
    const span = this.skinSpan();
    const wr = L.skin === 'sojourner' ? 6 : L.skin === 'vali' ? 12 : 10;
    const wheels = [-span, 0, span].map((dx) => ({ x: p.x + dx, y: this.groundY(p.x + dx) - wr }));
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 1, span + 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyY = (wheels[0].y + wheels[2].y) / 2 - wr - (L.skin === 'sojourner' ? 4 : 10) + Math.sin(t * 9) * 0.4 * (Math.abs(p.vx) > 5 ? 1 : 0);
    // rocker-bogie links
    ctx.strokeStyle = L.skin === 'vali' ? '#cfd6df' : '#9aa1ab';
    ctx.lineWidth = L.skin === 'sojourner' ? 2 : 3;
    ctx.beginPath();
    ctx.moveTo(wheels[0].x, wheels[0].y);
    ctx.lineTo(p.x - span * 0.4, bodyY + 4);
    ctx.lineTo(wheels[1].x, wheels[1].y);
    ctx.moveTo(p.x - span * 0.4, bodyY + 4);
    ctx.lineTo(p.x + span * 0.3, bodyY + 2);
    ctx.lineTo(wheels[2].x, wheels[2].y);
    ctx.stroke();
    wheels.forEach((w) => this.drawWheel(w.x, w.y, wr, p.wheel));

    ctx.save();
    ctx.translate(p.x, bodyY);
    ctx.rotate(p.angle);
    const scanning = this.holding;
    if (L.skin === 'opportunity') {
      // warm electronics box
      const g = ctx.createLinearGradient(0, -14, 0, 4);
      g.addColorStop(0, '#e6d3a6');
      g.addColorStop(1, '#9c8256');
      ctx.fillStyle = g;
      ctx.fillRect(-24, -10, 48, 14);
      // solar deck with wings
      ctx.fillStyle = '#122248';
      ctx.beginPath();
      ctx.moveTo(-40, -12);
      ctx.lineTo(38, -12);
      ctx.lineTo(42, -16);
      ctx.lineTo(-44, -16);
      ctx.fill();
      ctx.fillStyle = `rgba(70,120,210,${0.9 - this.panelDust * 0.7})`;
      ctx.fillRect(-42, -16, 82, 2);
      ctx.fillStyle = `rgba(190,120,80,${this.panelDust * 0.9})`;
      ctx.fillRect(-44, -17, 86, 3);
      this.drawMast(16, -16, 46, scanning, t, '#e7e2d6');
      // HGA dish
      ctx.fillStyle = '#d7dbe1';
      ctx.beginPath();
      ctx.ellipse(-18, -22, 8, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (L.skin === 'sojourner') {
      ctx.fillStyle = '#c0b49a';
      ctx.fillRect(-14, -6, 28, 8);
      ctx.fillStyle = '#16264a';
      ctx.fillRect(-17, -9, 34, 3);
      ctx.fillStyle = 'rgba(90,140,220,0.8)';
      for (let i = -16; i < 16; i += 4) ctx.fillRect(i, -9, 3, 1);
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      ctx.lineTo(-10, -30);
      ctx.stroke();
      // APXS on rear arm
      ctx.fillStyle = '#d9a040';
      ctx.fillRect(-20, -3, 5, 5);
      if (scanning) this.drawBeam(-18, 0, 50, 10, t);
    } else {
      // VALI — Perseverance-class
      const g = ctx.createLinearGradient(0, -22, 0, 6);
      g.addColorStop(0, '#f7f9fc');
      g.addColorStop(1, '#a7b1bf');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-34, -16);
      ctx.lineTo(30, -16);
      ctx.lineTo(36, 0);
      ctx.lineTo(-34, 4);
      ctx.closePath();
      ctx.fill();
      // RTG with fins
      ctx.fillStyle = '#4e5662';
      ctx.save();
      ctx.translate(-38, -12);
      ctx.rotate(-0.5);
      ctx.fillRect(-14, -6, 26, 12);
      ctx.fillStyle = '#7a8492';
      for (let i = -12; i < 12; i += 4) ctx.fillRect(i, -10, 2, 20);
      ctx.restore();
      // arm folded up front
      ctx.strokeStyle = '#cfd6df';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, -6);
      ctx.lineTo(44, -14);
      ctx.lineTo(40, -2);
      ctx.stroke();
      this.drawMast(18, -16, 58, scanning, t, '#f2f5f9');
      // status LED
      ctx.fillStyle = `rgba(80,230,255,${0.5 + 0.5 * Math.sin(t * 4)})`;
      ctx.fillRect(-20, -10, 3, 3);
    }
    ctx.restore();
  }

  private drawMast(x: number, y: number, h: number, scanning: boolean, t: number, color: string) {
    const { ctx } = this;
    const o = this.L.objectives[this.objIndex];
    // in the cleanroom the mast looks up at the window stars
    const lookUp = this.L.scene === 'cleanroom' && o && o.kind === 'scan' && this.objIndex < 3;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h);
    ctx.stroke();
    ctx.save();
    ctx.translate(x, y - h);
    if (lookUp && scanning) ctx.rotate(-0.6);
    ctx.fillStyle = color;
    ctx.fillRect(-7, -6, 16, 9);
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(5, -4, 4, 5);
    ctx.restore();
    if (scanning) {
      if (lookUp) {
        const sx = this.objIndex === 1 ? 900 : 1250;
        const sy = this.objIndex === 1 ? -400 : -380;
        // beam to the star, in world coordinates
        const m = this.ctx.getTransform();
        ctx.save();
        ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, this.dpr * (this.W / 2 - this.cam.x * this.scale), this.dpr * (this.H * 0.5 - this.cam.y * this.scale));
        const wx = this.p.x + 18;
        const wy = this.p.y - 90;
        this.beamLine(wx, wy, sx, sy, t);
        ctx.restore();
        ctx.setTransform(m);
      } else {
        this.drawBeam(x + 8, y - h, 30, h - 4, t);
      }
    }
  }

  private beamLine(x0: number, y0: number, x1: number, y1: number, t: number) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(120,225,255,${0.4 + 0.3 * Math.sin(t * 20)})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -t * 60;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  private drawBeam(x: number, y: number, dx: number, dy: number, t: number) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y, x + dx, y + dy);
    g.addColorStop(0, 'rgba(140,230,255,0.7)');
    g.addColorStop(1, 'rgba(140,230,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy - 10 + Math.sin(t * 30) * 2);
    ctx.lineTo(x + dx, y + dy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawHeli(t: number) {
    const { ctx } = this;
    const p = this.p;
    const gy = this.groundY(p.x);
    const alt = gy - p.y;
    // shadow shrinks with altitude
    ctx.fillStyle = `rgba(0,0,0,${clamp(0.35 - alt / 1500, 0.05, 0.35)})`;
    ctx.beginPath();
    ctx.ellipse(p.x, gy + 1, 26 * clamp(1 - alt / 900, 0.3, 1), 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    // scale up around the feet so they still touch the ground
    ctx.translate(p.x, p.y + 18);
    ctx.scale(1.6, 1.6);
    ctx.translate(0, -18);
    ctx.rotate(p.tilt);
    // legs
    ctx.strokeStyle = '#c7ccd4';
    ctx.lineWidth = 1.5;
    for (const lx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(lx * 6, 0);
      ctx.lineTo(lx * 20, 18);
      ctx.stroke();
      ctx.fillStyle = '#c7ccd4';
      ctx.beginPath();
      ctx.arc(lx * 20, 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // body
    const g = ctx.createLinearGradient(0, -8, 0, 6);
    g.addColorStop(0, '#e8d6a8');
    g.addColorStop(1, '#9b8452');
    ctx.fillStyle = g;
    ctx.fillRect(-8, -7, 16, 12);
    // mast
    ctx.strokeStyle = '#d9dde3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, -40);
    ctx.stroke();
    // rotors — blur discs + blades
    const spin = t * 60 * p.rpm;
    for (const [ry, dir] of [[-26, 1], [-34, -1]] as const) {
      const w = 34;
      if (p.rpm > 0.15) {
        ctx.fillStyle = `rgba(220,225,235,${0.12 + p.rpm * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(0, ry, w, 2.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const bl = Math.cos(spin * dir) * w;
      ctx.strokeStyle = p.rpm > 0.6 ? 'rgba(40,40,46,0.35)' : '#2b2b30';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-bl, ry);
      ctx.lineTo(bl, ry);
      ctx.stroke();
    }
    // solar panel cap
    ctx.fillStyle = '#16264a';
    ctx.fillRect(-9, -44, 18, 4);
    ctx.restore();
  }

  private drawProbe(t: number) {
    const { ctx } = this;
    const p = this.p;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt);
    if (p.invuln > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
    // magnetometer boom
    ctx.strokeStyle = '#9aa3b0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-60, 22);
    ctx.stroke();
    // RTG booms
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(-30, -26);
    ctx.stroke();
    ctx.fillStyle = '#6d7480';
    ctx.fillRect(-36, -32, 10, 8);
    ctx.fillRect(-28, -24, 10, 8);
    // body
    ctx.fillStyle = '#c9a85a';
    ctx.fillRect(-10, -6, 18, 14);
    // dish facing Earth (back, to the left)
    const g = ctx.createLinearGradient(0, -34, 0, 34);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#9aa3b0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-12, 0, 8, 34, 0, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.strokeStyle = '#e6e9ee';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -34);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-12, 34);
    ctx.stroke();
    ctx.restore();
    // transmit beam during the final objective
    if (this.holding) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const r = ((t * 220 + i * 70) % 280) + 10;
        ctx.strokeStyle = `rgba(140,230,255,${0.6 * (1 - r / 290)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x - 20, p.y, r, Math.PI * 0.75, Math.PI * 1.25);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawParticles() {
    const { ctx } = this;
    for (const q of this.particles) {
      const a = q.life / q.max;
      if (q.streak) {
        ctx.globalAlpha = Math.min(1, a * 3);
        ctx.strokeStyle = q.color;
        ctx.lineWidth = q.size;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - q.vx * 0.05, q.y - q.vy * 0.05);
        ctx.stroke();
        continue;
      }
      if (q.glow) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a;
      } else {
        ctx.globalAlpha = Math.min(1, a * 1.4);
      }
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size * (q.glow ? 1 : 1 + (1 - a) * 1.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  private drawOverlay(t: number) {
    const { ctx, W, H } = this;
    if (this.stormDark > 0) {
      ctx.fillStyle = `rgba(110,60,30,${this.stormDark * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.L.scene === 'mars' && this.L.vehicle === 'rover' && this.stormDark > 0.3) {
      // headlight-like mast lamp in the storm gloom
      const sx = W / 2 + (this.p.x - this.cam.x + 30) * this.scale;
      const sy = H * 0.5 + (this.p.y - 60 - this.cam.y) * this.scale;
      const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 260 * this.scale);
      rg.addColorStop(0, `rgba(255,220,170,${0.25 * this.stormDark})`);
      rg.addColorStop(1, 'rgba(255,220,170,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    // quake jitter lines
    if (this.quakeT > 1.2) {
      ctx.strokeStyle = 'rgba(255,210,120,0.08)';
      for (let i = 0; i < 4; i++) {
        const y = (t * 300 + i * H / 4) % H;
        ctx.fillStyle = 'rgba(255,210,120,0.04)';
        ctx.fillRect(0, y, W, 2);
      }
    }
  }
}
