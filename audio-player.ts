// Tone.js-based playback. Client-only — import dynamically.
import type { Composition, Instrument } from "./music-engine";

let toneMod: typeof import("tone") | null = null;

async function tone() {
  if (!toneMod) toneMod = await import("tone");
  return toneMod;
}

function buildSynth(T: typeof import("tone"), instrument: Instrument) {
  switch (instrument) {
    case "Piano":
      return new T.PolySynth(T.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 1.2 },
      });
    case "Guitar":
      return new T.PolySynth(T.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.8 },
      });
    case "Violin":
      return new T.PolySynth(T.AMSynth, {
        envelope: { attack: 0.3, decay: 0.2, sustain: 0.6, release: 1.5 },
      });
    case "Flute":
      return new T.PolySynth(T.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.8 },
      });
    case "Drums":
      return new T.PolySynth(T.MembraneSynth);
    case "Synth":
    default:
      return new T.PolySynth(T.FMSynth, {
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6 },
      });
  }
}

export class Player {
  private synth: any = null;
  private analyser: any = null;
  private parts: any[] = [];
  private comp: Composition | null = null;
  private startedAt = 0;
  private offset = 0;
  private state: "idle" | "playing" | "paused" = "idle";
  private loop = false;
  private onEndCb: (() => void) | null = null;

  async load(comp: Composition) {
    const T = await tone();
    this.stop();
    this.comp = comp;
    this.synth = buildSynth(T, comp.params.instrument);
    this.analyser = new T.Analyser("waveform", 256);
    const gain = new T.Gain(0.8).toDestination();
    this.synth.connect(gain);
    gain.connect(this.analyser);
  }

  setVolume(v: number) {
    tone().then((T) => {
      T.getDestination().volume.value = T.gainToDb(Math.max(0.0001, v));
    });
  }

  setLoop(loop: boolean) {
    this.loop = loop;
  }

  getAnalyser() {
    return this.analyser;
  }

  getState() {
    return this.state;
  }

  getPosition(): number {
    if (!this.comp) return 0;
    if (this.state === "playing") {
      const T = toneMod!;
      return Math.min(this.comp.durationSec, T.now() - this.startedAt + this.offset);
    }
    return this.offset;
  }

  onEnd(cb: () => void) {
    this.onEndCb = cb;
  }

  async play() {
    if (!this.comp || !this.synth) return;
    const T = await tone();
    await T.start();
    const now = T.now() + 0.05;
    this.startedAt = now;
    const from = this.offset;
    for (const n of this.comp.notes) {
      if (n.time < from) continue;
      const when = now + (n.time - from);
      const name = midiName(n.pitch);
      this.synth.triggerAttackRelease(name, n.duration, when, n.velocity);
    }
    const remaining = (this.comp.durationSec - from) * 1000;
    this.state = "playing";
    window.setTimeout(() => {
      if (this.state !== "playing") return;
      this.offset = 0;
      this.state = "idle";
      if (this.loop) this.play();
      else this.onEndCb?.();
    }, remaining);
  }

  pause() {
    if (this.state !== "playing" || !this.comp) return;
    const T = toneMod!;
    this.offset = Math.min(this.comp.durationSec, T.now() - this.startedAt + this.offset);
    this.synth?.releaseAll?.();
    this.state = "paused";
  }

  stop() {
    this.synth?.releaseAll?.();
    this.synth?.dispose?.();
    this.analyser?.dispose?.();
    this.synth = null;
    this.analyser = null;
    this.offset = 0;
    this.state = "idle";
    this.parts = [];
  }

  async seek(t: number) {
    if (!this.comp) return;
    const wasPlaying = this.state === "playing";
    this.synth?.releaseAll?.();
    this.offset = Math.max(0, Math.min(this.comp.durationSec, t));
    this.state = "paused";
    if (wasPlaying) await this.play();
  }
}

function midiName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}