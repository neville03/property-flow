import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/rentme/AppShell";
import { Empty, Panel, StatCard, Tag, TableWrap, Td, Th } from "@/components/rentme/ui";
import { dateFmt, money, moneyShort } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RentMe" },
      {
        name: "description",
        content: "Portfolio overview: occupancy, rent collected, outstanding balances and recent activity.",
      },
      { property: "og:title", content: "Dashboard — RentMe" },
      { property: "og:description", content: "Occupancy, rent collected and recent portfolio activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function useOverview() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: async () => {
      const [properties, units, payments, expenses, applications] = await Promise.all([
        supabase.from("properties").select("id, name, status"),
        supabase.from("units").select("id, property_id, rent, status"),
        supabase.from("payments").select("amount, paid_on, status, tenant_name"),
        supabase.from("expenses").select("amount, spent_on, category"),
        supabase.from("applications").select("id, full_name, stage, created_at"),
      ]);
      return {
        properties: properties.data ?? [],
        units: units.data ?? [],
        payments: payments.data ?? [],
        expenses: expenses.data ?? [],
        applications: applications.data ?? [],
      };
    },
  });
}

function DashboardPage() {
  const { data: account } = useAccount();
  const { data, isLoading } = useOverview();

  const units = data?.units ?? [];
  const occupied = units.filter((u) => u.status === "occupied").length;
  const collected = (data?.payments ?? [])
    .filter((p) => p.status === "Paid")
    .reduce((s, p) => s + Number(p.amount), 0);
  const spent = (data?.expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const expected = units.reduce((s, u) => s + Number(u.rent), 0);

  const months = buildMonthly(data?.payments ?? [], data?.expenses ?? []);
  const byProperty = (data?.properties ?? []).map((p) => {
    const own = units.filter((u) => u.property_id === p.id);
    return {
      name: p.name.length > 12 ? `${p.name.slice(0, 12)}…` : p.name,
      units: own.length,
      occupied: own.filter((u) => u.status === "occupied").length,
    };
  });

  return (
    <AppShell title="Dashboard">
      {account && !account.isApproved ? (
        <div className="border border-warning bg-card p-4 text-sm text-foreground">
          Your account is awaiting admin approval. You can look around, but creating properties is disabled until
          approval.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={data?.properties.length ?? 0} sub="Active portfolio" />
        <StatCard
          label="Occupancy"
          value={`${units.length ? Math.round((occupied / units.length) * 100) : 0}%`}
          sub={`${occupied} of ${units.length} units`}
        />
        <StatCard label="Rent collected" value={money(collected)} sub={`Expected monthly ${money(expected)}`} />
        <StatCard label="Expenses" value={money(spent)} sub={`Net ${money(collected - spent)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Cash flow" className="lg:col-span-2">
          {months.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={months}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={moneyShort} />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--chart-3)"
                    fill="var(--chart-3)"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty title="No payments yet" hint="Record rent payments to see cash flow." />
          )}
        </Panel>

        <Panel title="Units per property">
          {byProperty.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProperty}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="units" fill="var(--chart-2)" />
                  <Bar dataKey="occupied" fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty title="No properties yet" hint="Add your first property to begin." />
          )}
        </Panel>
      </div>

      <Panel title="Recent applications">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data?.applications.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Stage</Th>
                <Th>Received</Th>
              </tr>
            </thead>
            <tbody>
              {data.applications.slice(0, 6).map((a) => (
                <tr key={a.id}>
                  <Td>{a.full_name}</Td>
                  <Td>
                    <Tag tone={a.stage === "approved" ? "good" : a.stage === "rejected" ? "bad" : "default"}>
                      {a.stage}
                    </Tag>
                  </Td>
                  <Td>{dateFmt(a.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty title="No applications yet" hint="Share an application link from a vacant unit." />
        )}
      </Panel>
    </AppShell>
  );
}

function buildMonthly(
  payments: { amount: number; paid_on: string; status: string }[],
  expenses: { amount: number; spent_on: string }[],
) {
  const map = new Map<string, { month: string; income: number; expenses: number }>();
  const key = (d: string) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  for (const p of payments) {
    const k = key(p.paid_on);
    const row = map.get(k) ?? { month: k, income: 0, expenses: 0 };
    if (p.status === "Paid") row.income += Number(p.amount);
    map.set(k, row);
  }
  for (const e of expenses) {
    const k = key(e.spent_on);
    const row = map.get(k) ?? { month: k, income: 0, expenses: 0 };
    row.expenses += Number(e.amount);
    map.set(k, row);
  }
  return [...map.values()].slice(-8);
}
