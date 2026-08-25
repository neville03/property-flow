import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { Btn } from "./ui";
import { useAccount } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/properties", label: "Properties" },
  { to: "/applications", label: "Applications" },
  { to: "/finance", label: "Finance" },
  { to: "/staff", label: "Staff" },
  { to: "/maintenance", label: "Maintenance" },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { data: account } = useAccount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = account?.isAdmin ? [...NAV, { to: "/admin", label: "Admin" } as const] : NAV;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard">
              <Logo />
            </Link>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {items.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className={`px-3 py-1.5 text-sm transition ${
                  pathname === i.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {i.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium text-foreground">{account?.full_name ?? account?.email}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {account?.roles.join(" · ") || "owner"}
              </div>
            </div>
            <Btn variant="outline" onClick={signOut}>
              Sign out
            </Btn>
          </div>
        </div>
        {open ? (
          <nav className="grid border-t border-border lg:hidden">
            {items.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="border-b border-border px-4 py-3 text-sm text-foreground"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <div className="mt-6 space-y-6">{children}</div>
      </main>
    </div>
  );
}
