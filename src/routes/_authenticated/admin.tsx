import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/rentme/AppShell";
import { Btn, Empty, Panel, StatCard, TableWrap, Tag, Td, Th } from "@/components/rentme/ui";
import { dateFmt, money } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Business Metrics — RentMe" },
      {
        name: "description",
        content: "Platform-wide metrics for RentMe admins: owners, clients, revenue, pending payments and approvals.",
      },
      { property: "og:title", content: "Admin — Business Metrics — RentMe" },
      { property: "og:description", content: "Owner approvals and platform revenue metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const { data: account, isLoading: accountLoading } = useAccount();
  const isAdmin = !!account?.isAdmin;

  const profiles = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () =>
      (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const properties = useQuery({
    queryKey: ["admin-properties"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("properties").select("id, name, status").order("name")).data ?? [],
  });
  const applications = useQuery({
    queryKey: ["admin-applications"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("applications").select("id, stage").limit(1000)).data ?? [],
  });
  const leases = useQuery({
    queryKey: ["admin-leases"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("leases").select("id, rent, status").limit(1000)).data ?? [],
  });
  const payments = useQuery({
    queryKey: ["admin-payments"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("payments").select("amount, status").limit(1000)).data ?? [],
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Account updated");
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (accountLoading) {
    return (
      <AppShell title="Admin">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin">
        <Empty title="Admins only" hint="Your account does not have the admin role." />
      </AppShell>
    );
  }

  const collected = (payments.data ?? []).filter((p) => p.status === "Paid").reduce((s, p) => s + Number(p.amount), 0);
  const pending = (payments.data ?? []).filter((p) => p.status !== "Paid").reduce((s, p) => s + Number(p.amount), 0);
  const activeLeases = (leases.data ?? []).filter((l) => l.status === "active");
  const monthlyRent = activeLeases.reduce((s, l) => s + Number(l.rent), 0);
  const pendingOwners = (profiles.data ?? []).filter((p) => p.status !== "approved");

  return (
    <AppShell title="Admin">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Accounts" value={profiles.data?.length ?? 0} sub={`${pendingOwners.length} awaiting approval`} />
        <StatCard label="Properties" value={properties.data?.length ?? 0} />
        <StatCard label="Clients (tenants)" value={activeLeases.length} sub={`${applications.data?.length ?? 0} applications`} />
        <StatCard label="Monthly rent roll" value={money(monthlyRent)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Revenue collected" value={money(collected)} />
        <StatCard label="Pending payments" value={money(pending)} />
      </div>

      <Panel title="Account approvals">
        {profiles.data?.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {profiles.data.map((p) => (
                <tr key={p.id}>
                  <Td>{p.full_name ?? "—"}</Td>
                  <Td>{p.email ?? "—"}</Td>
                  <Td>{p.phone ?? "—"}</Td>
                  <Td>{dateFmt(p.created_at)}</Td>
                  <Td>
                    <Tag tone={p.status === "approved" ? "good" : p.status === "suspended" ? "bad" : "warn"}>
                      {p.status}
                    </Tag>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      {p.status !== "approved" ? (
                        <Btn onClick={() => setStatus.mutate({ id: p.id, status: "approved" })}>Approve</Btn>
                      ) : (
                        <Btn variant="outline" onClick={() => setStatus.mutate({ id: p.id, status: "suspended" })}>
                          Suspend
                        </Btn>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty title="No accounts yet" />
        )}
      </Panel>
    </AppShell>
  );
}
