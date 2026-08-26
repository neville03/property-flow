import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/rentme/AppShell";
import { Btn, Empty, Field, Panel, StatCard, TableWrap, Tag, Td, Th, inputClass } from "@/components/rentme/ui";
import { dateFmt, money } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Finance — Rent & Expenses — RentMe" },
      {
        name: "description",
        content: "Record rent payments, track expenses and monitor net income across your rental portfolio.",
      },
      { property: "og:title", content: "Finance — Rent & Expenses — RentMe" },
      { property: "og:description", content: "Rent collection and expense tracking for your portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  const qc = useQueryClient();

  const properties = useQuery({
    queryKey: ["properties"],
    queryFn: async () => (await supabase.from("properties").select("id, name").order("name")).data ?? [],
  });
  const leases = useQuery({
    queryKey: ["leases"],
    queryFn: async () =>
      (await supabase.from("leases").select("*, units(number), properties(name)").order("created_at")).data ?? [],
  });
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: async () =>
      (await supabase.from("payments").select("*, properties(name), units(number)").order("paid_on", { ascending: false }))
        .data ?? [],
  });
  const expenses = useQuery({
    queryKey: ["expenses"],
    queryFn: async () =>
      (await supabase.from("expenses").select("*, properties(name)").order("spent_on", { ascending: false })).data ?? [],
  });

  const [pay, setPay] = useState({ lease_id: "", amount: "", method: "Mobile money", reference: "", status: "Paid" });
  const [exp, setExp] = useState({ property_id: "", category: "Maintenance", description: "", amount: "" });

  const addPayment = useMutation({
    mutationFn: async () => {
      const lease = leases.data?.find((l) => l.id === pay.lease_id);
      if (!lease) throw new Error("Select a lease");
      const { error } = await supabase.from("payments").insert({
        property_id: lease.property_id,
        unit_id: lease.unit_id,
        lease_id: lease.id,
        tenant_name: lease.tenant_name,
        amount: Number(pay.amount || 0),
        method: pay.method,
        reference: pay.reference || null,
        status: pay.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setPay({ lease_id: "", amount: "", method: "Mobile money", reference: "", status: "Paid" });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      if (!exp.property_id) throw new Error("Select a property");
      const { error } = await supabase.from("expenses").insert({
        property_id: exp.property_id,
        category: exp.category,
        description: exp.description || null,
        amount: Number(exp.amount || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense recorded");
      setExp({ property_id: "", category: "Maintenance", description: "", amount: "" });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const collected = (payments.data ?? [])
    .filter((p) => p.status === "Paid")
    .reduce((s, p) => s + Number(p.amount), 0);
  const pending = (payments.data ?? [])
    .filter((p) => p.status !== "Paid")
    .reduce((s, p) => s + Number(p.amount), 0);
  const spent = (expenses.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <AppShell title="Finance">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Collected" value={money(collected)} />
        <StatCard label="Pending" value={money(pending)} />
        <StatCard label="Expenses" value={money(spent)} />
        <StatCard label="Net" value={money(collected - spent)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Record rent payment">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              addPayment.mutate();
            }}
          >
            <Field label="Lease">
              <select
                className={inputClass}
                value={pay.lease_id}
                onChange={(e) => setPay({ ...pay, lease_id: e.target.value })}
                required
              >
                <option value="">Select lease…</option>
                {leases.data?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.tenant_name} · {l.properties?.name} unit {l.units?.number}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={pay.amount}
                  onChange={(e) => setPay({ ...pay, amount: e.target.value })}
                  required
                />
              </Field>
              <Field label="Method">
                <select
                  className={inputClass}
                  value={pay.method}
                  onChange={(e) => setPay({ ...pay, method: e.target.value })}
                >
                  <option>Mobile money</option>
                  <option>Bank transfer</option>
                  <option>Cash</option>
                </select>
              </Field>
              <Field label="Reference">
                <input
                  className={inputClass}
                  value={pay.reference}
                  onChange={(e) => setPay({ ...pay, reference: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={pay.status}
                  onChange={(e) => setPay({ ...pay, status: e.target.value })}
                >
                  <option>Paid</option>
                  <option>Pending</option>
                </select>
              </Field>
            </div>
            <Btn disabled={addPayment.isPending}>Record payment</Btn>
          </form>
        </Panel>

        <Panel title="Record expense">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              addExpense.mutate();
            }}
          >
            <Field label="Property">
              <select
                className={inputClass}
                value={exp.property_id}
                onChange={(e) => setExp({ ...exp, property_id: e.target.value })}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category">
                <select
                  className={inputClass}
                  value={exp.category}
                  onChange={(e) => setExp({ ...exp, category: e.target.value })}
                >
                  <option>Maintenance</option>
                  <option>Utilities</option>
                  <option>Salaries</option>
                  <option>Taxes</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Amount">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={exp.amount}
                  onChange={(e) => setExp({ ...exp, amount: e.target.value })}
                  required
                />
              </Field>
            </div>
            <Field label="Description">
              <input
                className={inputClass}
                value={exp.description}
                onChange={(e) => setExp({ ...exp, description: e.target.value })}
              />
            </Field>
            <Btn disabled={addExpense.isPending}>Record expense</Btn>
          </form>
        </Panel>
      </div>

      <Panel title="Payments">
        {payments.data?.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Tenant</Th>
                <Th>Property / Unit</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {payments.data.map((p) => (
                <tr key={p.id}>
                  <Td>{p.tenant_name ?? "—"}</Td>
                  <Td>
                    {p.properties?.name ?? "—"} · {p.units?.number ?? "—"}
                  </Td>
                  <Td className="font-mono">{money(p.amount)}</Td>
                  <Td>{p.method ?? "—"}</Td>
                  <Td>{dateFmt(p.paid_on)}</Td>
                  <Td>
                    <Tag tone={p.status === "Paid" ? "good" : "warn"}>{p.status}</Tag>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty title="No payments recorded" hint="Create a lease from an approved application first." />
        )}
      </Panel>

      <Panel title="Expenses">
        {expenses.data?.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Property</Th>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {expenses.data.map((e) => (
                <tr key={e.id}>
                  <Td>{e.properties?.name ?? "—"}</Td>
                  <Td>{e.category}</Td>
                  <Td>{e.description ?? "—"}</Td>
                  <Td className="font-mono">{money(e.amount)}</Td>
                  <Td>{dateFmt(e.spent_on)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty title="No expenses recorded" />
        )}
      </Panel>
    </AppShell>
  );
}
