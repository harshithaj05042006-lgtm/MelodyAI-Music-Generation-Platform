import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Waveform } from "@/components/Waveform";
import { Sparkles, Wand2, Download, Library, Heart, ListMusic, Zap, Play } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MelodyAI — Compose original music with AI" },
      { name: "description", content: "Pick a genre, mood and instrument — MelodyAI generates a unique melody you can play, export and save." },
      { property: "og:title", content: "MelodyAI — Compose original music with AI" },
      { property: "og:description", content: "Pick a genre, mood and instrument — MelodyAI generates a unique melody you can play, export and save." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      {/* drifting background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-amber/20 blur-3xl" style={{ animation: "orb-drift 14s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-teal/20 blur-3xl" style={{ animation: "orb-drift 18s ease-in-out infinite reverse" }} />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#preview" className="hover:text-foreground transition">Preview</a>
        </nav>
        <Link to="/auth" className="rounded-full border border-border/60 px-4 py-2 text-sm hover:border-amber transition">Sign in</Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/5 px-3 py-1 text-xs font-medium text-amber">
          <Sparkles className="h-3 w-3" /> Generative music · MIDI export · No setup
        </span>
        <h1 className="mt-6 font-display text-6xl font-semibold leading-[1.05] tracking-tight md:text-8xl">
          Compose original music<br />with the <span className="text-gradient">power of AI</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          MelodyAI turns a few choices — genre, mood, instrument — into a unique melody in seconds. Play it, export the MIDI, build a library.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber to-teal px-6 py-3 text-sm font-semibold text-background shadow-glow transition hover:scale-[1.02]">
            <Wand2 className="h-4 w-4" /> Start creating
          </Link>
          <a href="#preview" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-amber transition">
            <Play className="h-4 w-4" /> Explore the player
          </a>
        </div>

        {/* Hero waveform stage */}
        <div className="relative mt-20">
          <div className="glass rounded-3xl p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            <div className="rounded-[20px] border border-border/40 bg-card/60 p-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
                  NOW PLAYING · Generated melody · 0:42
                </span>
                <span>96 BPM · C Dorian · Piano</span>
              </div>
              <div className="mt-6 h-40">
                <Waveform bars={84} />
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber to-teal text-background shadow-glow">
                  <Play className="h-5 w-5" />
                </button>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-amber to-teal" />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">0:17 / 0:42</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="font-display text-4xl font-semibold md:text-5xl">From idea to song<br />in three steps.</h2>
          <span className="hidden text-sm text-muted-foreground md:block">No DAW. No theory required.</span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Set the vibe", d: "Pick a genre, mood, tempo, instrument and duration." },
            { n: "02", t: "Generate", d: "MelodyAI composes a fresh, music-theory-aware melody." },
            { n: "03", t: "Play & export", d: "Listen, save, download MIDI, build smart playlists." },
          ].map((s) => (
            <div key={s.n} className="glass rounded-2xl p-8 transition hover:border-amber/40">
              <div className="text-sm font-mono text-amber">{s.n}</div>
              <h3 className="mt-3 font-display text-2xl font-semibold">{s.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview generator panel */}
      <section id="preview" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="glass overflow-hidden rounded-3xl">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="p-10">
              <h2 className="font-display text-4xl font-semibold">The console.</h2>
              <p className="mt-3 text-muted-foreground">A studio's worth of decisions, distilled to a few chips.</p>
              <div className="mt-8 space-y-5 text-sm">
                <ChipRow label="Genre" items={["Classical", "Jazz", "Pop", "Rock", "Lo-fi", "Piano", "Electronic"]} active="Jazz" />
                <ChipRow label="Mood" items={["Happy", "Calm", "Romantic", "Energetic", "Sad", "Inspirational"]} active="Romantic" />
                <ChipRow label="Instrument" items={["Piano", "Guitar", "Violin", "Flute", "Synth"]} active="Piano" />
                <ChipRow label="Tempo" items={["Slow", "Medium", "Fast"]} active="Medium" />
              </div>
              <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber to-teal px-5 py-2.5 text-sm font-semibold text-background shadow-glow">
                <Wand2 className="h-4 w-4" /> Generate yours
              </Link>
            </div>
            <div className="relative border-t border-border/40 bg-gradient-to-br from-secondary/40 to-card md:border-l md:border-t-0">
              <div className="absolute inset-0 grid place-items-center p-10">
                <div className="relative w-full">
                  <div className="absolute inset-0 rounded-full bg-amber/10 blur-3xl" />
                  <div className="relative grid place-items-center">
                    {/* Spinning circle visualizer */}
                    <svg viewBox="0 0 200 200" className="h-64 w-64">
                      <defs>
                        <linearGradient id="g" x1="0" x2="1">
                          <stop offset="0" stopColor="#f3b34a" />
                          <stop offset="1" stopColor="#5cd6c4" />
                        </linearGradient>
                      </defs>
                      {Array.from({ length: 48 }).map((_, i) => {
                        const a = (i / 48) * Math.PI * 2;
                        const r1 = 70;
                        const r2 = 70 + 12 + Math.sin(i * 0.7) * 16;
                        const x1 = 100 + Math.cos(a) * r1;
                        const y1 = 100 + Math.sin(a) * r1;
                        const x2 = 100 + Math.cos(a) * r2;
                        const y2 = 100 + Math.sin(a) * r2;
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#g)" strokeWidth="3" strokeLinecap="round" />;
                      })}
                      <circle cx="100" cy="100" r="56" fill="none" stroke="url(#g)" strokeWidth="1.5" opacity="0.4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-4xl font-semibold md:text-5xl">Everything you need to compose.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { i: <Wand2 className="h-5 w-5" />, t: "AI generation", d: "Music-theory aware composition across 7 genres and 6 moods." },
            { i: <Play className="h-5 w-5" />, t: "Live playback", d: "Tone.js synth voices per instrument with live waveform visualizer." },
            { i: <Download className="h-5 w-5" />, t: "MIDI export", d: "Download standard MIDI you can drop straight into any DAW." },
            { i: <Library className="h-5 w-5" />, t: "Library & history", d: "Every generation saved, searchable, replayable." },
            { i: <Heart className="h-5 w-5" />, t: "Favorites", d: "One-tap favorites that feed smart playlists." },
            { i: <ListMusic className="h-5 w-5" />, t: "Smart playlists", d: "Auto-grouped by mood: study, evening, workout, calm." },
            { i: <Zap className="h-5 w-5" />, t: "AI insights", d: "Complexity score, suggested use, genre confidence." },
            { i: <Sparkles className="h-5 w-5" />, t: "Visualizer", d: "Waveform, circular spectrum, equalizer bars." },
            { i: <Download className="h-5 w-5" />, t: "Reports", d: "Export a generation report with all parameters." },
          ].map((f) => (
            <div key={f.t} className="glass rounded-2xl p-6 transition hover:translate-y-[-2px] hover:border-amber/40">
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber/20 to-teal/20 text-amber">
                {f.i}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="font-display text-5xl font-semibold leading-tight">Your first track is<br />one click away.</h2>
        <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber to-teal px-7 py-3.5 text-sm font-semibold text-background shadow-glow">
          <Wand2 className="h-4 w-4" /> Start creating — it's free
        </Link>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl border-t border-border/40 px-6 py-8 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <span>© {new Date().getFullYear()} MelodyAI · Built with Lovable</span>
        </div>
      </footer>
    </div>
  );
}

function ChipRow({ label, items, active }: { label: string; items: string[]; active: string }) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i}
            className={
              i === active
                ? "rounded-full border border-amber/60 bg-amber/15 px-3 py-1 text-xs font-medium text-amber"
                : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            }
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
