import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/rentme/AppShell";
import { Btn, Empty, Field, Panel, StatCard, TableWrap, Tag, Td, Th, inputClass } from "@/components/rentme/ui";
import { dateFmt, money } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — RentMe" },
      {
        name: "description",
        content: "Log repair requests, assign contractors and track maintenance costs per unit.",
      },
      { property: "og:title", content: "Maintenance — RentMe" },
      { property: "og:description", content: "Track repairs, contractors and costs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ property_id: "", unit_id: "", description: "", contractor: "", cost: "" });

  const properties = useQuery({
    queryKey: ["properties"],
    queryFn: async () => (await supabase.from("properties").select("id, name").order("name")).data ?? [],
  });
  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => (await supabase.from("units").select("id, number, property_id").order("number")).data ?? [],
  });
  const jobs = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () =>
      (
        await supabase
          .from("maintenance")
          .select("*, properties(name), units(number)")
          .order("logged_on", { ascending: false })
      ).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.property_id) throw new Error("Select a property");
      const { error } = await supabase.from("maintenance").insert({
        property_id: form.property_id,
        unit_id: form.unit_id || null,
        description: form.description,
        contractor: form.contractor || null,
        cost: Number(form.cost || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request logged");
      setForm({ property_id: "", unit_id: "", description: "", contractor: "", cost: "" });
      qc.invalidateQueries({ queryKey: ["maintenance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("maintenance").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const open = (jobs.data ?? []).filter((j) => j.status !== "Completed").length;
  const cost = (jobs.data ?? []).reduce((s, j) => s + Number(j.cost), 0);

  return (
    <AppShell title="Maintenance">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open requests" value={open} />
        <StatCard label="Total requests" value={jobs.data?.length ?? 0} />
        <StatCard label="Total cost" value={money(cost)} />
      </div>

      <Panel title="Log a request">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Field label="Property">
            <select
              className={inputClass}
              value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value, unit_id: "" })}
              required
            >
              <option value="">Select property…</option>
              {properties.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit (optional)">
            <select className={inputClass} value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
              <option value="">Whole property</option>
              {units.data
                ?.filter((u) => u.property_id === form.property_id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.number}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Contractor">
            <input
              className={inputClass}
              value={form.contractor}
              onChange={(e) => setForm({ ...form, contractor: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </Field>
          <Field label="Cost estimate">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <Btn className="w-full" disabled={add.isPending}>
              Log request
            </Btn>
          </div>
        </form>
      </Panel>

      <Panel title="Requests">
        {jobs.data?.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Description</Th>
                <Th>Property / Unit</Th>
                <Th>Contractor</Th>
                <Th>Cost</Th>
                <Th>Logged</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {jobs.data.map((j) => (
                <tr key={j.id}>
                  <Td>{j.description}</Td>
                  <Td>
                    {j.properties?.name ?? "—"} · {j.units?.number ? `Unit ${j.units.number}` : "General"}
                  </Td>
                  <Td>{j.contractor ?? "—"}</Td>
                  <Td className="font-mono">{money(j.cost)}</Td>
                  <Td>{dateFmt(j.logged_on)}</Td>
                  <Td>
                    <select
                      className="border border-input bg-background px-2 py-1 text-xs"
                      value={j.status}
                      onChange={(e) => setStatus.mutate({ id: j.id, status: e.target.value })}
                    >
                      <option>In progress</option>
                      <option>Pending</option>
                      <option>Completed</option>
                    </select>
                    <div className="mt-1">
                      <Tag tone={j.status === "Completed" ? "good" : "warn"}>{j.status}</Tag>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty title="No maintenance requests" />
        )}
      </Panel>
    </AppShell>
  );
}
