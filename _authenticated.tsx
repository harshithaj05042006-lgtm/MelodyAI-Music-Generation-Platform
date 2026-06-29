import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" />;
  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[400px] w-[400px] rounded-full bg-amber/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[460px] w-[460px] rounded-full bg-teal/10 blur-3xl" />
      </div>
      <AppNav />
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}