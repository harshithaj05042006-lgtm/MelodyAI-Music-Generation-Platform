import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Player } from "@/lib/audio-player";
import { compose as recompose, type Composition, type Genre, type Instrument, type Mood, type Tempo, analyze } from "@/lib/music-engine";
import { compositionToMidi } from "@/lib/midi-export";
import { Play, Pause, Trash2, Heart, Search, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — MelodyAI" }] }),
  component: LibraryPage,
});

type Row = {
  id: string; name: string; genre: string; mood: string; tempo: string;
  instrument: string; duration_sec: number; bpm: number; is_favorite: boolean;
  notes: any; created_at: string;
};

const SMART = [
  { key: "Relaxing Music", match: (r: Row) => r.mood === "Calm" || r.mood === "Sad" },
  { key: "Study Music", match: (r: Row) => r.genre === "Lo-fi" || r.genre === "Classical" || r.genre === "Piano" },
  { key: "Workout Mix", match: (r: Row) => r.mood === "Energetic" || r.genre === "Rock" },
  { key: "Evening Vibes", match: (r: Row) => r.mood === "Romantic" || r.genre === "Jazz" },
  { key: "Classical Collection", match: (r: Row) => r.genre === "Classical" },
];

function LibraryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "favorites" | string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playerRef = useRef<Player | null>(null);

  const { data: rows = [] } = useQuery<Row[]>({
    queryKey: ["generations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("generations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  const filtered = useMemo(() => {
    let r = rows;
    if (tab === "favorites") r = r.filter((x) => x.is_favorite);
    else if (tab !== "all") {
      const s = SMART.find((x) => x.key === tab);
      if (s) r = r.filter(s.match);
    }
    if (q) {
      const t = q.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(t) || x.genre.toLowerCase().includes(t) || x.mood.toLowerCase().includes(t));
    }
    return r;
  }, [rows, q, tab]);

  const recs = useMemo(() => {
    if (!rows.length) return null;
    const count = <K extends keyof Row>(k: K) => {
      const m: Record<string, number> = {};
      for (const r of rows) m[String(r[k])] = (m[String(r[k])] || 0) + 1;
      return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];
    };
    return { genre: count("genre"), mood: count("mood"), instrument: count("instrument") };
  }, [rows]);

  const rowToComp = (r: Row): Composition => ({
    bpm: r.bpm,
    notes: r.notes as any,
    durationSec: r.duration_sec,
    params: {
      genre: r.genre as Genre, mood: r.mood as Mood, tempo: r.tempo as Tempo,
      instrument: r.instrument as Instrument, durationSec: r.duration_sec,
    },
  });

  const play = async (r: Row) => {
    if (playingId === r.id) {
      playerRef.current?.pause();
      setPlayingId(null);
      return;
    }
    playerRef.current?.stop();
    const p = new Player();
    let comp = rowToComp(r);
    if (!comp.notes || (Array.isArray(comp.notes) && comp.notes.length === 0)) comp = recompose(comp.params);
    await p.load(comp);
    p.onEnd(() => setPlayingId(null));
    playerRef.current = p;
    await p.play();
    setPlayingId(r.id);
  };

  const del = async (id: string) => {
    await supabase.from("generations").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["generations"] });
    toast.success("Deleted");
  };

  const fav = async (r: Row) => {
    await supabase.from("generations").update({ is_favorite: !r.is_favorite }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["generations"] });
  };

  const dl = (r: Row) => {
    const comp = rowToComp(r);
    const blob = compositionToMidi(comp.notes?.length ? comp : recompose(comp.params));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.name.replace(/\s+/g, "_")}.mid`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Your library</p>
          <h1 className="font-display text-4xl font-semibold">Generations</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, genre, mood…"
            className="w-72 rounded-full border border-border bg-input/40 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-amber"
          />
        </div>
      </div>

      {recs && (
        <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm">
          <span className="inline-flex items-center gap-2 text-amber">
            <Sparkles className="h-4 w-4" /> AI recommends
          </span>
          <span className="text-muted-foreground">
            More <b className="text-foreground">{recs.genre}</b> · {recs.mood} mood · try <b className="text-foreground">{recs.instrument}</b>
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["all", "favorites", ...SMART.map((s) => s.key)].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "rounded-full border border-amber/60 bg-amber/15 px-3.5 py-1.5 text-xs font-medium text-amber"
                : "rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground hover:border-amber/40 transition"
            }
          >{t === "all" ? "All" : t === "favorites" ? "Favorites" : t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass grid place-items-center rounded-2xl p-16 text-sm text-muted-foreground">
          Nothing here yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const a = analyze(rowToComp(r));
            return (
              <div key={r.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold truncate">{r.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.genre} · {r.mood} · {r.instrument}</p>
                  </div>
                  <button onClick={() => fav(r)} className={r.is_favorite ? "text-amber" : "text-muted-foreground hover:text-foreground"}>
                    <Heart className="h-4 w-4" fill={r.is_favorite ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{r.duration_sec}s</span>
                  <span>{r.bpm} BPM</span>
                  <span>{a.complexity}/100</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => play(r)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber to-teal px-3.5 py-1.5 text-xs font-semibold text-background shadow-glow">
                    {playingId === r.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {playingId === r.id ? "Pause" : "Play"}
                  </button>
                  <button onClick={() => dl(r)} className="grid h-7 w-7 place-items-center rounded-full border border-border hover:border-amber transition" title="Download MIDI">
                    <Download className="h-3 w-3" />
                  </button>
                  <button onClick={() => del(r.id)} className="ml-auto grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}