import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export function AppNav() {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo to="/dashboard" />
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/generate">Generate</NavLink>
          <NavLink to="/library">Library</NavLink>
        </nav>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground transition hover:border-amber hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: "/dashboard" | "/generate" | "/library"; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "rounded-full px-4 py-2 text-sm text-foreground bg-secondary" }}
    >
      {children}
    </Link>
  );
}