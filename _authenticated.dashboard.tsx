import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Wand2, Library, Heart, Settings, Music, Download as DownloadIcon, Sparkles, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MelodyAI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: rows = [] } = useQuery({
    queryKey: ["generations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = rows.length;
  const favs = rows.filter((r) => r.is_favorite).length;
  const genres = rows.reduce<Record<string, number>>((m, r) => ((m[r.genre] = (m[r.genre] || 0) + 1), m), {});
  const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const downloads = Number(localStorage.getItem("melodyai:downloads") ?? 0);

  const name = (user?.user_metadata as any)?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-4xl font-semibold">Hello, {name}.</h1>
        </div>
        <Link to="/generate" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber to-teal px-5 py-2.5 text-sm font-semibold text-background shadow-glow">
          <Wand2 className="h-4 w-4" /> New generation
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Music className="h-4 w-4" />} label="Songs generated" value={total} />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="Favorite genre" value={topGenre} />
        <Stat icon={<Heart className="h-4 w-4" />} label="Favorites" value={favs} />
        <Stat icon={<DownloadIcon className="h-4 w-4" />} label="Downloads" value={downloads} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <QuickAction to="/generate" icon={<Wand2 className="h-5 w-5" />} title="Generate" desc="Compose a new melody" />
        <QuickAction to="/library" icon={<Library className="h-5 w-5" />} title="Library" desc="Replay & manage" />
        <QuickAction to="/library" icon={<Heart className="h-5 w-5" />} title="Favorites" desc="Your top picks" />
        <QuickAction to="/dashboard" icon={<Settings className="h-5 w-5" />} title="Settings" desc="Preferences" />
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Recent creations</h2>
          <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {rows.length === 0 ? (
          <div className="glass grid place-items-center rounded-2xl p-12 text-center">
            <Sparkles className="h-6 w-6 text-amber" />
            <p className="mt-3 text-sm text-muted-foreground">No compositions yet. Your first melody is one click away.</p>
            <Link to="/generate" className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber/40 px-4 py-2 text-sm text-amber hover:bg-amber/10 transition">
              <Wand2 className="h-4 w-4" /> Start composing
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.slice(0, 6).map((r) => (
              <div key={r.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.genre} · {r.mood}</span>
                  <span>{r.duration_sec}s</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold truncate">{r.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  <Link to="/library" className="inline-flex items-center gap-1.5 text-xs text-amber hover:underline">
                    <Play className="h-3 w-3" /> Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <span className="inline-grid h-8 w-8 place-items-center rounded-lg bg-amber/10 text-amber">{icon}</span>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function QuickAction({ to, icon, title, desc }: { to: "/generate" | "/library" | "/dashboard"; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="glass group rounded-2xl p-5 transition hover:border-amber/40">
      <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber/20 to-teal/20 text-amber">{icon}</span>
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}