import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export type AccountInfo = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  roles: string[];
  isAdmin: boolean;
  isApproved: boolean;
};

export function useAccount() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["account", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AccountInfo | null> => {
      if (!userId) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      const roleList = (roles ?? []).map((r) => r.role as string);
      return {
        id: userId,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? session?.user.email ?? null,
        phone: profile?.phone ?? null,
        status: profile?.status ?? "pending",
        roles: roleList,
        isAdmin: roleList.includes("admin"),
        isApproved: (profile?.status ?? "pending") === "approved",
      };
    },
  });
}
