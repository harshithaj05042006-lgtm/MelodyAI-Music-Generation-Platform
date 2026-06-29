import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { compose, analyze, type Composition, type Genre, type Mood, type Tempo, type Instrument } from "@/lib/music-engine";
import { Player } from "@/lib/audio-player";
import { compositionToMidi } from "@/lib/midi-export";
import { LiveWaveform, Waveform } from "@/components/Waveform";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Play, Pause, Square, Repeat, Download, Heart, Wand2, Sparkles, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({ meta: [{ title: "Generate — MelodyAI" }] }),
  component: GeneratePage,
});

const GENRES: Genre[] = ["Classical", "Jazz", "Pop", "Rock", "Lo-fi", "Piano", "Electronic"];
const MOODS: Mood[] = ["Happy", "Calm", "Romantic", "Energetic", "Sad", "Inspirational"];
const TEMPOS: Tempo[] = ["Slow", "Medium", "Fast"];
const INSTRUMENTS: Instrument[] = ["Piano", "Guitar", "Violin", "Flute", "Drums", "Synth"];
const DURATIONS = [
  { label: "15s", val: 15 }, { label: "30s", val: 30 }, { label: "1 min", val: 60 }, { label: "2 min", val: 120 },
];

function GeneratePage() {
  const { user } = useAuth();
  const [genre, setGenre] = useState<Genre>("Jazz");
  const [mood, setMood] = useState<Mood>("Romantic");
  const [tempo, setTempo] = useState<Tempo>("Medium");
  const [instrument, setInstrument] = useState<Instrument>("Piano");
  const [duration, setDuration] = useState(30);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [comp, setComp] = useState<Composition | null>(null);

  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [pos, setPos] = useState(0);
  const [vol, setVol] = useState(0.8);
  const [loop, setLoop] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const playerRef = useRef<Player | null>(null);

  // poll position
  useEffect(() => {
    const id = window.setInterval(() => {
      const p = playerRef.current?.getPosition() ?? 0;
      setPos(p);
      const s = playerRef.current?.getState();
      if (s) setState(s);
    }, 100);
    return () => clearInterval(id);
  }, []);

  const insights = useMemo(() => (comp ? analyze(comp) : null), [comp]);

  const generate = async () => {
    setGenerating(true);
    setProgress(0);
    setComp(null);
    playerRef.current?.stop();
    setState("idle");
    setFavorite(false);

    // fake AI progress
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / 1400);
      setProgress(t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    await new Promise((r) => setTimeout(r, 1400));
    const c = compose({ genre, mood, tempo, instrument, durationSec: duration });
    setComp(c);
    const p = new Player();
    await p.load(c);
    p.setVolume(vol);
    p.setLoop(loop);
    playerRef.current = p;
    setGenerating(false);

    // auto-save
    if (user) {
      const name = `${mood} ${genre} #${Math.floor(Math.random() * 9000 + 1000)}`;
      const { error } = await supabase.from("generations").insert({
        user_id: user.id,
        name,
        genre, mood, tempo, instrument,
        duration_sec: duration,
        bpm: c.bpm,
        notes: c.notes as any,
      });
      if (error) toast.error("Saved locally — DB save failed");
      else toast.success("Saved to your library");
    }
  };

  const play = async () => {
    if (!playerRef.current) return;
    await playerRef.current.play();
    setState("playing");
  };
  const pause = () => { playerRef.current?.pause(); setState("paused"); };
  const stop = () => { playerRef.current?.stop(); setState("idle"); setPos(0); if (comp) playerRef.current?.load(comp); };

  const download = () => {
    if (!comp) return;
    const blob = compositionToMidi(comp);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `melodyai-${Date.now()}.mid`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem("melodyai:downloads", String(Number(localStorage.getItem("melodyai:downloads") ?? 0) + 1));
    toast.success("MIDI exported");
  };

  const exportReport = () => {
    if (!comp || !insights) return;
    const txt = [
      `MelodyAI — Generation Report`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Genre: ${comp.params.genre}`,
      `Mood: ${comp.params.mood}`,
      `Tempo: ${comp.params.tempo} (${comp.bpm} BPM)`,
      `Instrument: ${comp.params.instrument}`,
      `Duration: ${comp.durationSec}s`,
      `Notes: ${comp.notes.length}`,
      ``,
      `--- AI Insights ---`,
      `Estimated mood: ${insights.estimatedMood}`,
      `Complexity score: ${insights.complexity}/100`,
      `Note density: ${insights.density} notes/sec`,
      `Genre confidence: ${insights.genreConfidence}%`,
      `Suggested use: ${insights.useCase}`,
    ].join("\n");
    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `melodyai-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const share = (where: "wa" | "li" | "x" | "fb") => {
    const text = encodeURIComponent("Just composed an original melody with MelodyAI 🎵");
    const url = encodeURIComponent(window.location.origin);
    const links: Record<string, string> = {
      wa: `https://wa.me/?text=${text}%20${url}`,
      li: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    window.open(links[where], "_blank");
  };

  const toggleFav = async () => {
    if (!comp || !user) return;
    const next = !favorite;
    setFavorite(next);
    // patch latest matching record
    const { data } = await supabase
      .from("generations")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data[0]) await supabase.from("generations").update({ is_favorite: next }).eq("id", data[0].id);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Controls */}
      <div className="glass rounded-3xl p-7">
        <h1 className="font-display text-3xl font-semibold">Compose</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a vibe — MelodyAI handles the rest.</p>

        <Section label="Genre">
          <Chips items={GENRES} value={genre} onChange={setGenre} />
        </Section>
        <Section label="Mood">
          <Chips items={MOODS} value={mood} onChange={setMood} />
        </Section>
        <Section label="Instrument">
          <Chips items={INSTRUMENTS} value={instrument} onChange={setInstrument} />
        </Section>
        <Section label="Tempo">
          <Chips items={TEMPOS} value={tempo} onChange={setTempo} />
        </Section>
        <Section label="Duration">
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.val}
                onClick={() => setDuration(d.val)}
                className={
                  duration === d.val
                    ? "rounded-full border border-amber/60 bg-amber/15 px-3 py-1.5 text-xs font-medium text-amber"
                    : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-amber/40"
                }
              >{d.label}</button>
            ))}
          </div>
        </Section>

        <button
          onClick={generate}
          disabled={generating}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber to-teal py-3.5 text-sm font-semibold text-background shadow-glow transition disabled:opacity-60"
        >
          <Wand2 className="h-4 w-4" /> {generating ? "Generating…" : "Generate melody"}
        </button>

        {generating && (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-amber to-teal transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              AI composing · est. {Math.max(0, Math.ceil((1 - progress) * 1.4))}s
            </p>
          </div>
        )}
      </div>

      {/* Player + insights */}
      <div className="space-y-6">
        <div className="glass rounded-3xl p-7">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              {comp ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
                  Ready · {comp.bpm} BPM · {comp.notes.length} notes
                </>
              ) : "Awaiting first generation"}
            </span>
            {comp && (
              <button onClick={toggleFav} className={favorite ? "text-amber" : "text-muted-foreground hover:text-foreground"}>
                <Heart className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
              </button>
            )}
          </div>

          <div className="mt-5 h-40 overflow-hidden rounded-2xl border border-border/40 bg-card/40">
            {state === "playing" && playerRef.current?.getAnalyser() ? (
              <LiveWaveform analyser={playerRef.current.getAnalyser()} />
            ) : (
              <Waveform bars={64} className="px-3" />
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button onClick={state === "playing" ? pause : play} disabled={!comp} className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber to-teal text-background shadow-glow disabled:opacity-40">
              {state === "playing" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={stop} disabled={!comp} className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-amber transition disabled:opacity-40">
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setLoop(!loop); playerRef.current?.setLoop(!loop); }}
              className={`grid h-10 w-10 place-items-center rounded-full border transition ${loop ? "border-amber text-amber" : "border-border hover:border-amber"}`}
            >
              <Repeat className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="range"
                min={0}
                max={comp?.durationSec ?? 1}
                step={0.1}
                value={pos}
                onChange={(e) => playerRef.current?.seek(Number(e.target.value))}
                className="w-full accent-amber"
                disabled={!comp}
              />
              <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                <span>{fmt(pos)}</span>
                <span>{fmt(comp?.durationSec ?? 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Vol</span>
            <input
              type="range" min={0} max={1} step={0.01} value={vol}
              onChange={(e) => { const v = Number(e.target.value); setVol(v); playerRef.current?.setVolume(v); }}
              className="flex-1 accent-amber"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={download} disabled={!comp} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs hover:border-amber transition disabled:opacity-40">
              <Download className="h-3.5 w-3.5" /> MIDI
            </button>
            <button onClick={exportReport} disabled={!comp} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs hover:border-amber transition disabled:opacity-40">
              <FileText className="h-3.5 w-3.5" /> Report
            </button>
            <div className="ml-auto flex gap-1.5">
              {(["wa","li","x","fb"] as const).map((k) => (
                <button key={k} onClick={() => share(k)} disabled={!comp} className="rounded-full border border-border px-3 py-2 text-[10px] uppercase tracking-wider hover:border-amber transition disabled:opacity-40">
                  {k === "wa" ? "WhatsApp" : k === "li" ? "LinkedIn" : k === "x" ? "X" : "Facebook"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {insights && (
          <div className="glass rounded-3xl p-7">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber">
              <Sparkles className="h-3.5 w-3.5" /> AI Insights
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Insight label="Mood" value={insights.estimatedMood} />
              <Insight label="Complexity" value={`${insights.complexity}/100`} />
              <Insight label="Genre confidence" value={`${insights.genreConfidence}%`} />
              <Insight label="Best for" value={insights.useCase} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Chips<T extends string>({ items, value, onChange }: { items: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={
            value === i
              ? "rounded-full border border-amber/60 bg-amber/15 px-3 py-1.5 text-xs font-medium text-amber"
              : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-amber/40 transition"
          }
        >{i}</button>
      ))}
    </div>
  );
}

function Insight({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-base">{value}</div>
    </div>
  );
}