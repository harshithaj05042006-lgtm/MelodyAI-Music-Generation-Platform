// Minimal Type-0 MIDI writer — enough for piano-roll exports.
import type { Composition } from "./music-engine";

function writeVarLen(value: number): number[] {
  const buffer: number[] = [];
  let v = value;
  buffer.unshift(v & 0x7f);
  v >>= 7;
  while (v > 0) {
    buffer.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return buffer;
}

function u32(n: number): number[] {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function u16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}
function ascii(s: string): number[] {
  return Array.from(s).map((c) => c.charCodeAt(0));
}

export function compositionToMidi(comp: Composition): Blob {
  const ticksPerQuarter = 480;
  const usPerQuarter = Math.round(60_000_000 / comp.bpm);

  // Convert notes to events with absolute ticks.
  type Ev = { tick: number; data: number[] };
  const events: Ev[] = [];
  const secondsToTicks = (s: number) => Math.round((s * comp.bpm * ticksPerQuarter) / 60);

  for (const n of comp.notes) {
    const start = secondsToTicks(n.time);
    const end = start + Math.max(1, secondsToTicks(n.duration));
    const vel = Math.max(1, Math.min(127, Math.round(n.velocity * 127)));
    const pitch = Math.max(0, Math.min(127, n.pitch));
    events.push({ tick: start, data: [0x90, pitch, vel] });
    events.push({ tick: end, data: [0x80, pitch, 64] });
  }
  events.sort((a, b) => a.tick - b.tick);

  // Build track
  const trackData: number[] = [];
  // tempo meta
  trackData.push(0, 0xff, 0x51, 0x03, (usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff);
  let lastTick = 0;
  for (const ev of events) {
    const delta = ev.tick - lastTick;
    lastTick = ev.tick;
    trackData.push(...writeVarLen(delta), ...ev.data);
  }
  // end of track
  trackData.push(0, 0xff, 0x2f, 0x00);

  const header = [...ascii("MThd"), ...u32(6), ...u16(0), ...u16(1), ...u16(ticksPerQuarter)];
  const track = [...ascii("MTrk"), ...u32(trackData.length), ...trackData];
  return new Blob([new Uint8Array([...header, ...track])], { type: "audio/midi" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}