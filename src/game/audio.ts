// Procedural soundtrack + SFX built on WebAudio. No audio files to ship.

export type Mood = 'title' | 'mars' | 'storm' | 'space' | 'lab' | 'triumph';

const MIDI = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Chord progressions as semitone offsets from the mood's root.
const MOODS: Record<Mood, { root: number; chords: number[][]; bpm: number; arp: number; drums: boolean; cutoff: number }> = {
  title: { root: 50, chords: [[0, 7, 15, 22], [-4, 3, 12, 19], [-9, 3, 10, 15], [-2, 5, 14, 17]], bpm: 64, arp: 0.55, drums: false, cutoff: 1100 },
  mars: { root: 45, chords: [[0, 7, 12, 15], [-4, 3, 8, 15], [-7, 0, 7, 10], [-2, 5, 10, 14]], bpm: 76, arp: 0.7, drums: true, cutoff: 1400 },
  storm: { root: 43, chords: [[0, 7, 13, 15], [1, 8, 13, 16], [-2, 5, 10, 13], [0, 3, 7, 12]], bpm: 92, arp: 0.85, drums: true, cutoff: 900 },
  space: { root: 48, chords: [[0, 7, 14, 19], [5, 12, 16, 21], [-3, 4, 11, 16], [2, 9, 14, 17]], bpm: 58, arp: 0.45, drums: false, cutoff: 1800 },
  lab: { root: 52, chords: [[0, 4, 11, 14], [-3, 4, 9, 12], [5, 9, 12, 16], [2, 7, 11, 14]], bpm: 70, arp: 0.6, drums: false, cutoff: 2000 },
  triumph: { root: 48, chords: [[0, 7, 16, 19], [5, 12, 17, 21], [-3, 7, 12, 16], [7, 14, 19, 23]], bpm: 84, arp: 0.9, drums: true, cutoff: 2400 },
};

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private reverb!: ConvolverNode;
  private delay!: DelayNode;
  private padFilter!: BiquadFilterNode;
  private noiseBuf!: AudioBuffer;
  private loops: Record<string, { gain: GainNode; osc?: OscillatorNode; filter?: BiquadFilterNode }> = {};
  private mood: Mood = 'title';
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  muted = false;
  musicOn = true;

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    this.music = ctx.createGain();
    this.music.gain.value = this.musicOn ? 0.55 : 0;
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.music.connect(this.master);
    this.sfx.connect(this.master);

    // Generated impulse response = cheap lush reverb.
    this.reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb.buffer = ir;
    const revGain = ctx.createGain();
    revGain.gain.value = 0.6;
    this.reverb.connect(revGain).connect(this.music);

    this.delay = ctx.createDelay(2);
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const dl = ctx.createBiquadFilter();
    dl.type = 'lowpass';
    dl.frequency.value = 2400;
    this.delay.connect(dl).connect(fb).connect(this.delay);
    this.delay.connect(this.reverb);
    this.delay.connect(this.music);

    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.Q.value = 2;
    this.padFilter.connect(this.music);
    this.padFilter.connect(this.reverb);
    const lfo = ctx.createOscillator();
    const lfoAmt = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoAmt.gain.value = 500;
    lfo.connect(lfoAmt).connect(this.padFilter.frequency);
    lfo.start();

    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    this.makeLoops();
    this.setMood(this.mood, true);
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 90);
  }

  private makeLoops() {
    const ctx = this.ctx!;
    const noiseLoop = (name: string, type: BiquadFilterType, freq: number, q = 1) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(this.sfx);
      src.start();
      this.loops[name] = { gain, filter };
    };
    noiseLoop('wind', 'lowpass', 420, 0.7);
    noiseLoop('drill', 'bandpass', 1800, 4);
    noiseLoop('rotor', 'bandpass', 220, 1.5);
    noiseLoop('thruster', 'highpass', 2500, 0.5);

    // Motor hum: sawtooth through a lowpass, pitch follows speed.
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 50;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 380;
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(f).connect(g).connect(this.sfx);
    osc.start();
    this.loops.motor = { gain: g, osc, filter: f };
  }

  setMood(mood: Mood, force = false) {
    if (mood === this.mood && !force) return;
    this.mood = mood;
    if (!this.ctx) return;
    const m = MOODS[mood];
    this.padFilter.frequency.setTargetAtTime(m.cutoff, this.ctx.currentTime, 1.5);
    this.delay.delayTime.value = (60 / m.bpm) * 0.75;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (this.ctx) this.music.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.2);
  }

  /** Continuous loop levels, 0..1. Call every frame. */
  setLoop(name: 'wind' | 'drill' | 'rotor' | 'thruster' | 'motor', level: number, pitch = 1) {
    const l = this.loops[name];
    if (!l || !this.ctx) return;
    const t = this.ctx.currentTime;
    const max = name === 'wind' ? 0.22 : name === 'motor' ? 0.09 : name === 'thruster' ? 0.05 : 0.14;
    l.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * max, t, 0.08);
    if (name === 'motor' && l.osc) {
      l.osc.frequency.setTargetAtTime(38 + pitch * 70, t, 0.1);
      l.filter!.frequency.setTargetAtTime(240 + pitch * 600, t, 0.1);
    }
    if (name === 'rotor' && l.filter) l.filter.frequency.setTargetAtTime(120 + pitch * 260, t, 0.1);
    if (name === 'wind' && l.filter) l.filter.frequency.setTargetAtTime(260 + pitch * 700, t, 0.4);
  }

  silenceLoops() {
    (['wind', 'drill', 'rotor', 'thruster', 'motor'] as const).forEach((n) => this.setLoop(n, 0));
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const m = MOODS[this.mood];
    const sixteenth = 60 / m.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.playStep(this.step, this.nextTime, m);
      this.nextTime += sixteenth;
      this.step++;
    }
  }

  private playStep(step: number, t: number, m: (typeof MOODS)[Mood]) {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const chord = m.chords[Math.floor(bar / 2) % m.chords.length];
    const barLen = (60 / m.bpm) * 4;

    if (s === 0 && bar % 2 === 0) {
      // Pad: detuned saws, 2-bar swell.
      chord.forEach((iv, i) => {
        for (const det of [-7, 6]) this.tone(MIDI(m.root + iv + 12), t, barLen * 2.1, 'sawtooth', 0.018, this.padFilter, 1.6, det + i);
      });
      this.tone(MIDI(m.root + chord[0] - 12), t, barLen * 2, 'sine', 0.2, this.music, 0.3);
    }
    // Arp: plucked triangle notes into the delay.
    if (s % 2 === 0 && this.rand(bar * 31 + s) < m.arp) {
      const note = chord[Math.floor(this.rand(bar * 7 + s * 3) * chord.length)] + 24 + (this.rand(s + bar) > 0.7 ? 12 : 0);
      this.pluck(MIDI(m.root + note), t, 0.06);
    }
    if (m.drums) {
      if (s === 0 || s === 8 || (s === 11 && bar % 2)) this.kick(t);
      if (s % 4 === 2) this.hat(t, s === 14 ? 0.05 : 0.025);
    }
  }

  // Deterministic pseudo-random so the music phrase repeats like a composed loop.
  private rand(n: number) {
    const x = Math.sin(n * 127.1 + this.moodSeed() * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  private moodSeed() {
    return Object.keys(MOODS).indexOf(this.mood) + 1;
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode, attack = 0.01, detune = 0) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setTargetAtTime(0, t + dur - Math.min(dur * 0.5, 1.2), 0.4);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 2);
  }

  private pluck(freq: number, t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g);
    g.connect(this.music);
    g.connect(this.delay);
    o.start(t);
    o.stop(t + 1);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + 0.45);
  }

  private hat(t: number, vol: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(f).connect(g).connect(this.music);
    src.start(t, Math.random());
    src.stop(t + 0.08);
  }

  sfxPlay(name: 'hover' | 'select' | 'scan' | 'complete' | 'fail' | 'hit' | 'alarm' | 'whoosh' | 'land' | 'win' | 'tick') {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const blip = (f: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, f2?: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, at);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(this.sfx);
      g.connect(this.reverb);
      o.start(at);
      o.stop(at + dur + 0.05);
    };
    const noise = (at: number, dur: number, freq: number, vol: number, type: BiquadFilterType = 'lowpass') => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      src.connect(f).connect(g).connect(this.sfx);
      src.start(at, Math.random());
      src.stop(at + dur + 0.05);
    };
    switch (name) {
      case 'hover': blip(1400, t, 0.05, 'sine', 0.025); break;
      case 'tick': blip(900, t, 0.04, 'square', 0.02); break;
      case 'select': blip(660, t, 0.12, 'triangle', 0.1); blip(990, t + 0.06, 0.16, 'triangle', 0.08); break;
      case 'scan': blip(400, t, 0.35, 'sine', 0.08, 1600); break;
      case 'complete': [0, 4, 7, 12].forEach((n, i) => blip(MIDI(72 + n), t + i * 0.07, 0.6, 'triangle', 0.09)); break;
      case 'win': [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => blip(MIDI(67 + n), t + i * 0.09, 1.1, 'triangle', 0.08)); break;
      case 'fail': [0, -3, -7, -12].forEach((n, i) => blip(MIDI(64 + n), t + i * 0.16, 0.5, 'sawtooth', 0.04)); break;
      case 'hit': noise(t, 0.35, 900, 0.5); blip(120, t, 0.3, 'sine', 0.3, 40); break;
      case 'land': noise(t, 0.25, 400, 0.3); break;
      case 'whoosh': noise(t, 0.6, 1200, 0.25, 'bandpass'); break;
      case 'alarm': blip(880, t, 0.12, 'square', 0.04); blip(660, t + 0.15, 0.12, 'square', 0.04); break;
    }
  }
}

export const audio = new AudioEngine();
