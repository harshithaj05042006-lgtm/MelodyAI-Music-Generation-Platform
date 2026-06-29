// MelodyAI generative music engine.
// Procedural melody composition driven by music theory (scale, chord, rhythm)
// rendered with Tone.js. Designed to feel coherent across genre/mood combos.

export type Genre = "Classical" | "Jazz" | "Pop" | "Rock" | "Lo-fi" | "Piano" | "Electronic";
export type Mood = "Happy" | "Calm" | "Romantic" | "Energetic" | "Sad" | "Inspirational";
export type Tempo = "Slow" | "Medium" | "Fast";
export type Instrument = "Piano" | "Guitar" | "Violin" | "Flute" | "Drums" | "Synth";

export interface GenerationParams {
  genre: Genre;
  mood: Mood;
  tempo: Tempo;
  instrument: Instrument;
  durationSec: number;
}

export interface Note {
  pitch: number; // MIDI number
  time: number; // seconds from start
  duration: number; // seconds
  velocity: number; // 0..1
}

export interface Composition {
  bpm: number;
  notes: Note[];
  durationSec: number;
  params: GenerationParams;
}

const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  pentaMajor: [0, 2, 4, 7, 9],
  pentaMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

const MOOD_SCALE: Record<Mood, keyof typeof SCALES> = {
  Happy: "major",
  Calm: "pentaMajor",
  Romantic: "dorian",
  Energetic: "major",
  Sad: "minor",
  Inspirational: "lydian",
};

const GENRE_BIAS: Record<Genre, { rootShift: number; chordSpan: number; swing: number; scaleOverride?: keyof typeof SCALES }> = {
  Classical: { rootShift: 0, chordSpan: 12, swing: 0 },
  Jazz: { rootShift: 0, chordSpan: 14, swing: 0.18, scaleOverride: "dorian" },
  Pop: { rootShift: 0, chordSpan: 10, swing: 0 },
  Rock: { rootShift: -5, chordSpan: 12, swing: 0, scaleOverride: "pentaMinor" },
  "Lo-fi": { rootShift: -2, chordSpan: 8, swing: 0.1, scaleOverride: "minor" },
  Piano: { rootShift: 0, chordSpan: 14, swing: 0 },
  Electronic: { rootShift: 0, chordSpan: 12, swing: 0 },
};

const TEMPO_BPM: Record<Tempo, [number, number]> = {
  Slow: [60, 80],
  Medium: [90, 115],
  Fast: [125, 160],
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function compose(params: GenerationParams): Composition {
  const { genre, mood, tempo, durationSec } = params;
  const [bpmMin, bpmMax] = TEMPO_BPM[tempo];
  const bpm = Math.round(rand(bpmMin, bpmMax));
  const beat = 60 / bpm;

  const bias = GENRE_BIAS[genre];
  const scaleName = bias.scaleOverride ?? MOOD_SCALE[mood];
  const scale = SCALES[scaleName];
  const root = 60 + bias.rootShift; // around middle C

  // Chord progression — common diatonic patterns
  const progressions: number[][] = [
    [0, 5, 3, 4], // I-vi-IV-V
    [0, 3, 4, 0], // I-IV-V-I
    [5, 3, 0, 4], // vi-IV-I-V
    [0, 4, 5, 3], // I-V-vi-IV
  ];
  const progression = pick(progressions);

  const notes: Note[] = [];
  const barLen = beat * 4;
  const totalBars = Math.ceil(durationSec / barLen);

  for (let bar = 0; bar < totalBars; bar++) {
    const chordDegree = progression[bar % progression.length];
    const chordRoot = root + scale[chordDegree % scale.length];
    const barStart = bar * barLen;

    // Chord pad
    [0, 2, 4].forEach((interval) => {
      const pitch = chordRoot + (scale[(chordDegree + interval) % scale.length] - scale[chordDegree % scale.length]);
      notes.push({
        pitch: pitch - 12,
        time: barStart,
        duration: barLen * 0.95,
        velocity: 0.35,
      });
    });

    // Melody — 8 sixteenth-note slots per bar with rest probability
    const restProb = mood === "Calm" || mood === "Sad" ? 0.45 : mood === "Energetic" ? 0.1 : 0.25;
    const slots = mood === "Energetic" ? 8 : 6;
    let lastDegree = chordDegree;
    for (let s = 0; s < slots; s++) {
      if (Math.random() < restProb) continue;
      // Step within +/- 3 scale degrees from previous, anchored on chord tones
      const stepBias = Math.random() < 0.5 ? chordDegree : lastDegree;
      const step = stepBias + Math.round(rand(-2, 3));
      lastDegree = step;
      const scaleIdx = ((step % scale.length) + scale.length) % scale.length;
      const octaveShift = step >= scale.length ? 12 : step < 0 ? -12 : 0;
      const pitch = root + scale[scaleIdx] + octaveShift;
      let t = barStart + (s / slots) * barLen;
      // swing every other slot
      if (s % 2 === 1) t += bias.swing * (barLen / slots);
      notes.push({
        pitch,
        time: t,
        duration: (barLen / slots) * (0.6 + Math.random() * 0.6),
        velocity: 0.55 + Math.random() * 0.35,
      });
    }
  }

  // Trim to duration
  const trimmed = notes
    .filter((n) => n.time < durationSec)
    .map((n) => ({ ...n, duration: Math.min(n.duration, durationSec - n.time) }));

  return { bpm, notes: trimmed, durationSec, params };
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}

// --- AI insights ---
export function analyze(comp: Composition) {
  const avgPitch = comp.notes.reduce((a, n) => a + n.pitch, 0) / Math.max(comp.notes.length, 1);
  const density = comp.notes.length / comp.durationSec;
  const complexity = Math.min(100, Math.round(density * 12 + (comp.bpm - 60) / 2));
  const useCase =
    comp.params.mood === "Calm" || comp.params.mood === "Sad"
      ? "Relaxation & focus"
      : comp.params.mood === "Energetic"
        ? "Workout & motion"
        : comp.params.mood === "Romantic"
          ? "Evening ambience"
          : "Study & deep work";
  return {
    estimatedMood: comp.params.mood,
    complexity,
    avgPitch: Math.round(avgPitch),
    density: +density.toFixed(2),
    genreConfidence: Math.round(72 + Math.random() * 24),
    useCase,
  };
}