import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-teal shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-background" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Melody<span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}