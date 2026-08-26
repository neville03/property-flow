import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/rentme/AppShell";
import { Btn, Empty, Field, Panel, TableWrap, Tag, Td, Th, inputClass } from "@/components/rentme/ui";
import { dateFmt, money } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff — RentMe" },
      {
        name: "description",
        content: "Assign caretakers, security and cleaners to properties and track their salaries and status.",
      },
      { property: "og:title", content: "Staff — RentMe" },
      { property: "og:description", content: "Manage the people running your properties." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ property_id: "", name: "", role: "Caretaker", contact: "", salary: "" });

  const properties = useQuery({
    queryKey: ["properties"],
    queryFn: async () => (await supabase.from("properties").select("id, name").order("name")).data ?? [],
  });
  const staff = useQuery({
    queryKey: ["staff"],
    queryFn: async () =>
      (await supabase.from("staff").select("*, properties(name)").order("created_at", { ascending: false })).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.property_id) throw new Error("Select a property");
      const { error } = await supabase.from("staff").insert({
        property_id: form.property_id,
        name: form.name,
        role: form.role,
        contact: form.contact || null,
        salary: Number(form.salary || 0),
        assigned_on: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff member added");
      setForm({ property_id: "", name: "", role: "Caretaker", contact: "", salary: "" });
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("staff").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Staff">
      <Panel title="Add staff member">
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
              onChange={(e) => setForm({ ...form, property_id: e.target.value })}
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
          <Field label="Full name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Role">
            <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Caretaker</option>
              <option>Security</option>
              <option>Cleaner</option>
              <option>Manager</option>
            </select>
          </Field>
          <Field label="Contact">
            <input className={inputClass} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </Field>
          <Field label="Monthly salary">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <Btn className="w-full" disabled={add.isPending}>
              Add staff
            </Btn>
          </div>
        </form>
      </Panel>

      <Panel title="Team">
        {staff.data?.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Property</Th>
                <Th>Role</Th>
                <Th>Contact</Th>
                <Th>Salary</Th>
                <Th>Assigned</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {staff.data.map((s) => (
                <tr key={s.id}>
                  <Td>{s.name}</Td>
                  <Td>{s.properties?.name ?? "—"}</Td>
                  <Td>{s.role ?? "—"}</Td>
                  <Td>{s.contact ?? "—"}</Td>
                  <Td className="font-mono">{money(s.salary)}</Td>
                  <Td>{dateFmt(s.assigned_on)}</Td>
                  <Td>
                    <button
                      onClick={() => toggle.mutate({ id: s.id, status: s.status === "Active" ? "Inactive" : "Active" })}
                    >
                      <Tag tone={s.status === "Active" ? "good" : "default"}>{s.status}</Tag>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty title="No staff yet" hint="Add caretakers or security assigned to a property." />
        )}
      </Panel>
    </AppShell>
  );
}
