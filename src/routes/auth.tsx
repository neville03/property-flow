import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Logo } from "@/components/rentme/logo";
import { Btn, Field, inputClass } from "@/components/rentme/ui";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — RentMe" },
      {
        name: "description",
        content: "Sign in or request access to the RentMe rental operations console for property owners and managers.",
      },
      { property: "og:title", content: "Sign in — RentMe" },
      { property: "og:description", content: "Access your RentMe rental portfolio workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        toast.success("Account requested. An admin will approve your access.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-secondary p-10 lg:flex">
        <Logo size={32} />
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Rental operations,
            <br />
            without the paperwork.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Properties and units, public application links, tenant documents, rent collection and expenses — one
            console for your whole portfolio.
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Invite &amp; approval only</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo size={32} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
            {mode === "signin" ? "Sign in" : "Request access"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Use the credentials for your RentMe workspace."
              : "New owner accounts are reviewed by an admin before activation."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {mode === "signup" ? (
              <>
                <Field label="Full name">
                  <input
                    className={inputClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Phone">
                  <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
              </>
            ) : null}
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </Field>
            <Btn className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Request access"}
            </Btn>
          </form>

          <Btn variant="outline" className="mt-3 w-full" onClick={google} type="button">
            Continue with Google
          </Btn>

          <button
            type="button"
            className="mt-6 text-sm text-muted-foreground underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need an account? Request access" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
