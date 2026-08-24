import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Building2, Users, HardHat, Wallet, FileText,
  Settings, LogOut, Search, ChevronRight, ArrowLeft, MapPin,
  Wrench, Plus, Download,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data (no backend). Everything below is illustrative only.     */
/* ------------------------------------------------------------------ */

const CURRENCY = "UGX";

const properties = [
  {
    id: "p1",
    name: "Acacia Apartments",
    location: "Kampala",
    type: "Apartment block",
    status: "Active",
    units: [
      { number: "A1", tenant: "Sarah Nakato", moveIn: "2024-03-01", leaseMonths: 12, rent: 1200000, paid: 10800000, outstanding: 0, nextPayment: "2026-09-01" },
      { number: "A2", tenant: "James Okello", moveIn: "2025-01-15", leaseMonths: 12, rent: 1200000, paid: 8400000, outstanding: 1200000, nextPayment: "2026-08-15" },
      { number: "A3", tenant: null, moveIn: null, leaseMonths: null, rent: 1200000, paid: 0, outstanding: 0, nextPayment: null },
      { number: "A4", tenant: "Grace Auma", moveIn: "2024-06-01", leaseMonths: 24, rent: 1350000, paid: 16200000, outstanding: 0, nextPayment: "2026-09-01" },
    ],
    maintenance: [
      { date: "2026-07-12", description: "Roof leak repair, block A", cost: 850000, contractor: "Moses (in-house)", status: "Completed" },
      { date: "2026-08-02", description: "Water pump replacement", cost: 1400000, contractor: "Kampala Plumbers Ltd", status: "In progress" },
    ],
    staff: [
      { name: "Moses Kato", role: "Caretaker", contact: "0772 100 200", status: "Active", salary: 450000, assigned: "2023-11-01" },
      { name: "Ali Ssemwogerere", role: "Security guard", contact: "0701 334 556", status: "Active", salary: 380000, assigned: "2024-02-10" },
    ],
  },
  {
    id: "p2",
    name: "Nakasero Suites",
    location: "Kampala",
    type: "Serviced apartments",
    status: "Active",
    units: [
      { number: "S1", tenant: "David Mugisha", moveIn: "2025-05-01", leaseMonths: 12, rent: 2500000, paid: 20000000, outstanding: 2500000, nextPayment: "2026-08-01" },
      { number: "S2", tenant: "Lydia Namono", moveIn: "2024-09-01", leaseMonths: 12, rent: 2500000, paid: 30000000, outstanding: 0, nextPayment: "2026-09-01" },
      { number: "S3", tenant: null, moveIn: null, leaseMonths: null, rent: 2500000, paid: 0, outstanding: 0, nextPayment: null },
    ],
    maintenance: [
      { date: "2026-06-20", description: "AC servicing, all suites", cost: 600000, contractor: "CoolTech", status: "Completed" },
    ],
    staff: [
      { name: "Rita Achieng", role: "Property manager", contact: "0788 900 122", status: "Active", salary: 900000, assigned: "2023-08-01" },
    ],
  },
  {
    id: "p3",
    name: "Rwizi View Rentals",
    location: "Mbarara",
    type: "Rental houses",
    status: "Active",
    units: [
      { number: "H1", tenant: "Peter Tumusiime", moveIn: "2024-02-01", leaseMonths: 12, rent: 700000, paid: 8400000, outstanding: 0, nextPayment: "2026-09-01" },
      { number: "H2", tenant: "Mary Kirungi", moveIn: "2025-03-01", leaseMonths: 12, rent: 700000, paid: 4200000, outstanding: 1400000, nextPayment: "2026-08-01" },
      { number: "H3", tenant: "Robert Ainebyona", moveIn: "2024-07-01", leaseMonths: 12, rent: 650000, paid: 7800000, outstanding: 0, nextPayment: "2026-09-01" },
    ],
    maintenance: [
      { date: "2026-05-15", description: "Repaint exterior, H2", cost: 500000, contractor: "Mbarara Finishes", status: "Completed" },
    ],
    staff: [
      { name: "John Byaruhanga", role: "Caretaker", contact: "0752 445 667", status: "Active", salary: 300000, assigned: "2024-01-05" },
    ],
  },
  {
    id: "p4",
    name: "Kakoba Court",
    location: "Mbarara",
    type: "Apartment block",
    status: "Under renovation",
    units: [
      { number: "K1", tenant: "Esther Nabirye", moveIn: "2024-11-01", leaseMonths: 12, rent: 900000, paid: 8100000, outstanding: 900000, nextPayment: "2026-08-01" },
      { number: "K2", tenant: null, moveIn: null, leaseMonths: null, rent: 900000, paid: 0, outstanding: 0, nextPayment: null },
    ],
    maintenance: [
      { date: "2026-08-05", description: "Full renovation, block K", cost: 4200000, contractor: "BuildRight Co.", status: "In progress" },
    ],
    staff: [],
  },
  {
    id: "p5",
    name: "Machinga Trading Rooms",
    location: "Machinga",
    type: "Commercial units",
    status: "Active",
    units: [
      { number: "M1", tenant: "Sadat Kirya", moveIn: "2024-04-01", leaseMonths: 12, rent: 500000, paid: 6000000, outstanding: 0, nextPayment: "2026-09-01" },
      { number: "M2", tenant: "Winnie Adong", moveIn: "2025-02-01", leaseMonths: 12, rent: 500000, paid: 3000000, outstanding: 1000000, nextPayment: "2026-08-01" },
      { number: "M3", tenant: null, moveIn: null, leaseMonths: null, rent: 500000, paid: 0, outstanding: 0, nextPayment: null },
    ],
    maintenance: [],
    staff: [
      { name: "Ibra Waiswa", role: "Gatekeeper", contact: "0703 221 889", status: "Active", salary: 250000, assigned: "2024-05-01" },
    ],
  },
];

// 6-month trend data for the dashboard charts.
const revenueExpenses = [
  { month: "Mar", revenue: 11200000, expenses: 4100000 },
  { month: "Apr", revenue: 11800000, expenses: 3600000 },
  { month: "May", revenue: 12100000, expenses: 4900000 },
  { month: "Jun", revenue: 12600000, expenses: 3800000 },
  { month: "Jul", revenue: 12900000, expenses: 5200000 },
  { month: "Aug", revenue: 13400000, expenses: 6100000 },
];

const rentCollection = [
  { month: "Mar", collected: 10800000, expected: 12000000 },
  { month: "Apr", collected: 11500000, expected: 12000000 },
  { month: "May", collected: 11200000, expected: 12400000 },
  { month: "Jun", collected: 12100000, expected: 12400000 },
  { month: "Jul", collected: 11900000, expected: 12800000 },
  { month: "Aug", collected: 11400000, expected: 12800000 },
];

// Payments & Finance ledger (frontend only).
const revenueTx = [
  { id: "R-1042", tenant: "Lydia Namono", property: "Nakasero Suites", unit: "S2", amount: 2500000, date: "2026-08-01", method: "Mobile Money", ref: "MM-88213", status: "Paid" },
  { id: "R-1041", tenant: "Grace Auma", property: "Acacia Apartments", unit: "A4", amount: 1350000, date: "2026-08-01", method: "Bank transfer", ref: "BT-55190", status: "Paid" },
  { id: "R-1040", tenant: "Peter Tumusiime", property: "Rwizi View Rentals", unit: "H1", amount: 700000, date: "2026-08-02", method: "Cash", ref: "CSH-201", status: "Paid" },
  { id: "R-1039", tenant: "Sadat Kirya", property: "Machinga Trading Rooms", unit: "M1", amount: 500000, date: "2026-08-03", method: "Mobile Money", ref: "MM-88250", status: "Paid" },
  { id: "R-1038", tenant: "James Okello", property: "Acacia Apartments", unit: "A2", amount: 1200000, date: "2026-08-05", method: "Mobile Money", ref: "MM-88301", status: "Pending" },
  { id: "R-1037", tenant: "David Mugisha", property: "Nakasero Suites", unit: "S1", amount: 2500000, date: "2026-08-06", method: "Bank transfer", ref: "BT-55240", status: "Overdue" },
  { id: "D-1009", tenant: "Winnie Adong", property: "Machinga Trading Rooms", unit: "M2", amount: 500000, date: "2026-07-28", method: "Cash", ref: "DEP-77", status: "Paid" },
];

const expensesTx = [
  { id: "E-2051", category: "Maintenance", property: "Acacia Apartments", description: "Water pump replacement", amount: 1400000, date: "2026-08-02", status: "Paid" },
  { id: "E-2050", category: "Salaries", property: "Nakasero Suites", description: "Manager salary — August", amount: 900000, date: "2026-08-01", status: "Paid" },
  { id: "E-2049", category: "Renovation", property: "Kakoba Court", description: "Block K renovation (part 1)", amount: 4200000, date: "2026-08-05", status: "Pending" },
  { id: "E-2048", category: "Utilities", property: "Nakasero Suites", description: "Water & electricity — July", amount: 620000, date: "2026-07-30", status: "Paid" },
  { id: "E-2047", category: "Maintenance", property: "Rwizi View Rentals", description: "Exterior repaint, H2", amount: 500000, date: "2026-05-15", status: "Paid" },
  { id: "E-2046", category: "Salaries", property: "Acacia Apartments", description: "Caretaker + guard — August", amount: 830000, date: "2026-08-01", status: "Paid" },
];

const taxes = [
  { id: "T-301", type: "Rental income tax", property: "Nakasero Suites", period: "Q2 2026", amount: 3200000, paid: 3200000, due: "2026-07-15", status: "Paid" },
  { id: "T-302", type: "Rental income tax", property: "Acacia Apartments", period: "Q2 2026", amount: 2100000, paid: 1000000, due: "2026-07-15", status: "Partial" },
  { id: "T-303", type: "Property rates", property: "Rwizi View Rentals", period: "2026", amount: 800000, paid: 0, due: "2026-09-30", status: "Unpaid" },
  { id: "T-304", type: "Property rates", property: "Machinga Trading Rooms", period: "2026", amount: 450000, paid: 0, due: "2026-09-30", status: "Unpaid" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n) => `${CURRENCY} ${n.toLocaleString("en-UG")}`;
const fmtShort = (n) => `${(n / 1_000_000).toFixed(1)}M`;

const occupiedUnits = (p) => p.units.filter((u) => u.tenant).length;
const vacantUnits = (p) => p.units.filter((u) => !u.tenant).length;
const propRevenue = (p) => p.units.reduce((s, u) => s + u.paid, 0);
const propExpected = (p) => p.units.reduce((s, u) => s + u.rent * (u.leaseMonths ? 1 : 0), 0);
const propOutstanding = (p) => p.units.reduce((s, u) => s + u.outstanding, 0);

// Tenants and staff are derived from the properties data — single source of truth.
const allTenants = properties.flatMap((p) =>
  p.units
    .filter((u) => u.tenant)
    .map((u) => ({
      name: u.tenant,
      property: p.name,
      location: p.location,
      unit: u.number,
      rent: u.rent,
      paid: u.paid,
      outstanding: u.outstanding,
      moveIn: u.moveIn,
      leaseMonths: u.leaseMonths,
      nextPayment: u.nextPayment,
      status: u.outstanding > 0 ? "Overdue" : "Active",
    }))
);

const allStaff = properties.flatMap((p) =>
  p.staff.map((s) => ({ ...s, property: p.name, location: p.location }))
);

// Chart colours — the ONLY place colour is used in the system.
const CHART = {
  revenue: "#2563eb",
  expenses: "#f97316",
  collected: "#059669",
  expected: "#94a3b8",
  occupied: "#111111",
  vacant: "#d4d4d4",
  bars: ["#2563eb", "#7c3aed", "#059669", "#f97316", "#0891b2"],
};

/* ------------------------------------------------------------------ */
/*  Small shared UI                                                   */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-neutral-200 bg-white p-4">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-2 font-mono text-xl text-neutral-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <div className="border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="border border-neutral-300 px-2 py-0.5 text-[11px] uppercase tracking-wide text-neutral-700">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth page                                                         */
/* ------------------------------------------------------------------ */

function AuthPage({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center bg-black text-white">
            <Building2 size={20} />
          </div>
          <h1 className="mt-4 text-lg font-semibold tracking-tight text-neutral-900">Rentaly</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to your rental workspace</p>
        </div>

        <div className="space-y-4 border border-neutral-200 p-6">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          <button
            onClick={onSignIn}
            className="w-full bg-black py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Sign in
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-neutral-400">Frontend preview — any details will sign you in.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar + shell                                                   */
/* ------------------------------------------------------------------ */

const NAV = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "staff", label: "Staff", icon: HardHat },
  { id: "finance", label: "Payments & Finance", icon: Wallet },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

function Sidebar({ active, onNavigate, onSignOut }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center bg-black text-white">
          <Building2 size={16} />
        </div>
        <span className="text-sm font-semibold tracking-tight">Rentaly</span>
      </div>
      <nav className="flex-1 p-2">
        {NAV.map(({ id, label, icon: Icon }) => {
          const on = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`mb-0.5 flex w-full items-center gap-3 px-3 py-2 text-sm ${
                on ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-neutral-200 p-2">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function TopBar({ title, right }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
      <h2 className="text-base font-semibold tracking-tight text-neutral-900">{title}</h2>
      <div className="flex items-center gap-3">{right}</div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

const PERIODS = ["This Month", "Last Month", "This Year", "Custom"];

function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex border border-neutral-300">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 text-xs ${
            value === p ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function Dashboard() {
  const [period, setPeriod] = useState("This Month");

  const totals = useMemo(() => {
    const units = properties.reduce((s, p) => s + p.units.length, 0);
    const occupied = properties.reduce((s, p) => s + occupiedUnits(p), 0);
    const tenants = occupied;
    const staff = properties.reduce((s, p) => s + p.staff.length, 0);
    const revenue = properties.reduce((s, p) => s + propRevenue(p), 0);
    const expenses = properties.reduce(
      (s, p) => s + p.maintenance.reduce((m, x) => m + x.cost, 0) + p.staff.reduce((m, x) => m + x.salary, 0),
      0
    );
    const outstanding = properties.reduce((s, p) => s + propOutstanding(p), 0);
    return {
      properties: properties.length,
      units,
      occupied,
      vacant: units - occupied,
      tenants,
      staff,
      revenue,
      expenses,
      outstanding,
      net: revenue - expenses,
    };
  }, []);

  const occupancyData = [
    { name: "Occupied", value: totals.occupied },
    { name: "Vacant", value: totals.vacant },
  ];

  const revenueByProperty = properties.map((p) => ({ name: p.name.split(" ")[0], revenue: propRevenue(p) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Overview of your rental business</p>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total Properties" value={totals.properties} />
        <StatCard label="Total Units" value={totals.units} />
        <StatCard label="Occupied Units" value={totals.occupied} />
        <StatCard label="Vacant Units" value={totals.vacant} />
        <StatCard label="Total Tenants" value={totals.tenants} />
        <StatCard label="Total Staff" value={totals.staff} />
        <StatCard label="Revenue" value={fmt(totals.revenue)} />
        <StatCard label="Expenses" value={fmt(totals.expenses)} />
        <StatCard label="Outstanding Rent" value={fmt(totals.outstanding)} />
        <StatCard label="Net Income" value={fmt(totals.net)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Revenue vs Expenses">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueExpenses} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#737373" }} axisLine={{ stroke: "#e5e5e5" }} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Line type="monotone" dataKey="revenue" stroke={CHART.revenue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke={CHART.expenses} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Rent Collection Performance">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rentCollection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#737373" }} axisLine={{ stroke: "#e5e5e5" }} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="expected" fill={CHART.expected} radius={[2, 2, 0, 0]} />
              <Bar dataKey="collected" fill={CHART.collected} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Occupancy Rate">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={occupancyData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  <Cell fill={CHART.occupied} />
                  <Cell fill={CHART.vacant} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-2xl">{Math.round((totals.occupied / totals.units) * 100)}%</div>
                <div className="text-xs text-neutral-500">occupied across all units</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block h-3 w-3" style={{ background: CHART.occupied }} /> Occupied ({totals.occupied})
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block h-3 w-3" style={{ background: CHART.vacant }} /> Vacant ({totals.vacant})
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Revenue by Property">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByProperty} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="revenue" radius={[0, 2, 2, 0]}>
                {revenueByProperty.map((_, i) => (
                  <Cell key={i} fill={CHART.bars[i % CHART.bars.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Properties                                                        */
/* ------------------------------------------------------------------ */

function PropertiesList({ onOpen }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");

  const types = ["All", ...Array.from(new Set(properties.map((p) => p.type)))];
  const statuses = ["All", ...Array.from(new Set(properties.map((p) => p.status)))];

  const filtered = properties.filter(
    (p) =>
      (type === "All" || p.type === type) &&
      (status === "All" || p.status === status) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const byLocation = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      (map[p.location] = map[p.location] || []).push(p);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-neutral-300 px-3 py-2">
          <Search size={15} className="text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search properties"
            className="text-sm outline-none"
          />
        </div>
        <Filter label="Type" value={type} options={types} onChange={setType} />
        <Filter label="Status" value={status} options={statuses} onChange={setStatus} />
        <button className="ml-auto flex items-center gap-2 bg-black px-3 py-2 text-sm text-white hover:bg-neutral-800">
          <Plus size={15} /> Add property
        </button>
      </div>

      {Object.keys(byLocation).map((loc) => (
        <div key={loc}>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-900">
            <MapPin size={15} className="text-neutral-500" /> {loc}
            <span className="text-neutral-400">· {byLocation[loc].length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {byLocation[loc].map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="border border-neutral-200 bg-white p-4 text-left hover:border-neutral-400"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-neutral-900">{p.name}</div>
                    <div className="text-xs text-neutral-500">{p.type}</div>
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Units" value={p.units.length} />
                  <MiniStat label="Occupied" value={occupiedUnits(p)} />
                  <MiniStat label="Vacant" value={vacantUnits(p)} />
                </div>
                <div className="mt-4 space-y-1 border-t border-neutral-100 pt-3 text-xs">
                  <Row k="Revenue" v={fmt(propRevenue(p))} />
                  <Row k="Outstanding" v={fmt(propOutstanding(p))} />
                </div>
                <div className="mt-3 flex items-center justify-end text-xs text-neutral-500">
                  View details <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Filter({ label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-2 border border-neutral-300 px-3 py-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-neutral-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-white text-sm outline-none">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="border border-neutral-100 py-2">
      <div className="font-mono text-base text-neutral-900">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{k}</span>
      <span className="font-mono text-neutral-900">{v}</span>
    </div>
  );
}

function PropertyDetail({ property, onBack }) {
  const p = property;
  const tabs = ["Units & Tenants", "Maintenance", "Staff"];
  const [tab, setTab] = useState(tabs[0]);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black">
        <ArrowLeft size={15} /> Back to properties
      </button>

      <div className="border border-neutral-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{p.name}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
              <MapPin size={14} /> {p.location} · {p.type}
            </div>
          </div>
          <Badge>{p.status}</Badge>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Units" value={p.units.length} />
          <StatCard label="Occupied" value={occupiedUnits(p)} />
          <StatCard label="Revenue" value={fmt(propRevenue(p))} />
          <StatCard label="Outstanding" value={fmt(propOutstanding(p))} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm ${
              tab === t ? "border-b-2 border-black text-black" : "text-neutral-500 hover:text-black"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Units & Tenants" && (
        <Table
          head={["Unit", "Tenant", "Move-in", "Lease", "Rent", "Paid", "Outstanding", "Next payment"]}
          rows={p.units.map((u) => [
            u.number,
            u.tenant || <span className="text-neutral-400">Vacant</span>,
            u.moveIn || "—",
            u.leaseMonths ? `${u.leaseMonths} mo` : "—",
            fmt(u.rent),
            fmt(u.paid),
            u.outstanding > 0 ? <span className="font-medium">{fmt(u.outstanding)}</span> : fmt(0),
            u.nextPayment || "—",
          ])}
        />
      )}

      {tab === "Maintenance" && (
        p.maintenance.length ? (
          <Table
            head={["Date", "Description", "Cost", "Contractor / staff", "Status"]}
            rows={p.maintenance.map((m) => [m.date, m.description, fmt(m.cost), m.contractor, <Badge>{m.status}</Badge>])}
          />
        ) : (
          <Empty icon={Wrench} text="No maintenance records for this property yet." />
        )
      )}

      {tab === "Staff" && (
        p.staff.length ? (
          <Table
            head={["Name", "Role", "Contact", "Status", "Salary", "Assigned"]}
            rows={p.staff.map((s) => [s.name, s.role, s.contact, <Badge>{s.status}</Badge>, fmt(s.salary), s.assigned])}
          />
        ) : (
          <Empty icon={HardHat} text="No staff assigned to this property yet." />
        )
      )}
    </div>
  );
}

function Table({ head, rows, monoCols }) {
  const isMono = (j) => (monoCols ? monoCols.includes(j) : j > 3);
  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-3 text-neutral-700 ${isMono(j) ? "font-mono" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 py-16 text-center">
      <Icon size={22} className="text-neutral-400" />
      <p className="mt-2 text-sm text-neutral-500">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search input (shared)                                             */
/* ------------------------------------------------------------------ */

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 border border-neutral-300 px-3 py-2">
      <Search size={15} className="text-neutral-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm outline-none" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tenants                                                           */
/* ------------------------------------------------------------------ */

function Tenants() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const rows = allTenants.filter(
    (t) =>
      (status === "All" || t.status === status) &&
      (t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.property.toLowerCase().includes(query.toLowerCase()))
  );

  const overdue = allTenants.filter((t) => t.status === "Overdue").length;
  const outstanding = allTenants.reduce((s, t) => s + t.outstanding, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Tenants" value={allTenants.length} />
        <StatCard label="Active Leases" value={allTenants.length - overdue} />
        <StatCard label="Overdue" value={overdue} />
        <StatCard label="Total Outstanding" value={fmt(outstanding)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search tenants" />
        <Filter label="Status" value={status} options={["All", "Active", "Overdue"]} onChange={setStatus} />
        <button className="ml-auto flex items-center gap-2 bg-black px-3 py-2 text-sm text-white hover:bg-neutral-800">
          <Plus size={15} /> Add tenant
        </button>
      </div>

      <Table
        head={["Tenant", "Property", "Unit", "Rent", "Paid", "Outstanding", "Next payment", "Status"]}
        monoCols={[3, 4, 5, 6]}
        rows={rows.map((t) => [
          t.name,
          t.property,
          t.unit,
          fmt(t.rent),
          fmt(t.paid),
          t.outstanding > 0 ? <span className="font-medium">{fmt(t.outstanding)}</span> : fmt(0),
          t.nextPayment || "—",
          <Badge>{t.status}</Badge>,
        ])}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Staff                                                             */
/* ------------------------------------------------------------------ */

function Staff() {
  const [role, setRole] = useState("All");
  const roles = ["All", ...Array.from(new Set(allStaff.map((s) => s.role)))];
  const rows = allStaff.filter((s) => role === "All" || s.role === role);

  const payroll = allStaff.reduce((s, x) => s + x.salary, 0);
  const active = allStaff.filter((s) => s.status === "Active").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Staff" value={allStaff.length} />
        <StatCard label="Active" value={active} />
        <StatCard label="Monthly Payroll" value={fmt(payroll)} />
        <StatCard label="Roles" value={roles.length - 1} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter label="Role" value={role} options={roles} onChange={setRole} />
        <button className="ml-auto flex items-center gap-2 bg-black px-3 py-2 text-sm text-white hover:bg-neutral-800">
          <Plus size={15} /> Add staff
        </button>
      </div>

      <Table
        head={["Name", "Role", "Property", "Contact", "Status", "Salary", "Assigned"]}
        monoCols={[3, 5, 6]}
        rows={rows.map((s) => [
          s.name,
          s.role,
          s.property,
          s.contact,
          <Badge>{s.status}</Badge>,
          fmt(s.salary),
          s.assigned,
        ])}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payments & Finance                                                */
/* ------------------------------------------------------------------ */

function Finance() {
  const tabs = ["Revenue", "Expenses", "Taxes"];
  const [tab, setTab] = useState(tabs[0]);

  const revenue = properties.reduce((s, p) => s + propRevenue(p), 0);
  const staffCosts = allStaff.reduce((s, x) => s + x.salary, 0);
  const maintenanceCosts = properties.reduce((s, p) => s + p.maintenance.reduce((m, x) => m + x.cost, 0), 0);
  const taxTotal = taxes.reduce((s, t) => s + t.amount, 0);
  const expenses = staffCosts + maintenanceCosts;
  const collected = revenueTx.filter((r) => r.status === "Paid").reduce((s, r) => s + r.amount, 0);
  const outstanding = properties.reduce((s, p) => s + propOutstanding(p), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Revenue" value={fmt(revenue)} />
        <StatCard label="Total Expenses" value={fmt(expenses)} />
        <StatCard label="Net Income" value={fmt(revenue - expenses)} />
        <StatCard label="Rent Collected" value={fmt(collected)} />
        <StatCard label="Outstanding Rent" value={fmt(outstanding)} />
        <StatCard label="Staff Costs" value={fmt(staffCosts)} />
        <StatCard label="Maintenance Costs" value={fmt(maintenanceCosts)} />
        <StatCard label="Taxes" value={fmt(taxTotal)} />
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm ${tab === t ? "border-b-2 border-black text-black" : "text-neutral-500 hover:text-black"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Revenue" && (
        <Table
          head={["Reference", "Tenant", "Property", "Unit", "Amount", "Date", "Method", "Status"]}
          monoCols={[0, 4, 5]}
          rows={revenueTx.map((r) => [r.id, r.tenant, r.property, r.unit, fmt(r.amount), r.date, r.method, <Badge>{r.status}</Badge>])}
        />
      )}
      {tab === "Expenses" && (
        <Table
          head={["Reference", "Category", "Property", "Description", "Amount", "Date", "Status"]}
          monoCols={[0, 4, 5]}
          rows={expensesTx.map((e) => [e.id, e.category, e.property, e.description, fmt(e.amount), e.date, <Badge>{e.status}</Badge>])}
        />
      )}
      {tab === "Taxes" && (
        <Table
          head={["Reference", "Type", "Property", "Period", "Amount", "Paid", "Due", "Status"]}
          monoCols={[0, 4, 5, 6]}
          rows={taxes.map((t) => [t.id, t.type, t.property, t.period, fmt(t.amount), fmt(t.paid), t.due, <Badge>{t.status}</Badge>])}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reports                                                           */
/* ------------------------------------------------------------------ */

const REPORT_CATALOG = [
  { name: "Revenue report", desc: "All income by property and period" },
  { name: "Expense report", desc: "Spending by category and property" },
  { name: "Profit / loss report", desc: "Net position across the portfolio" },
  { name: "Rent collection report", desc: "Collected vs expected over time" },
  { name: "Outstanding rent report", desc: "Balances owed by tenant" },
  { name: "Property profitability", desc: "Revenue minus costs per property" },
  { name: "Staff cost report", desc: "Payroll and commissions" },
  { name: "Tax report", desc: "Tax due and paid by period" },
];

function Reports() {
  const profitability = properties.map((p) => {
    const rev = propRevenue(p);
    const cost = p.maintenance.reduce((m, x) => m + x.cost, 0) + p.staff.reduce((m, x) => m + x.salary, 0);
    return { name: p.name, rev, cost, net: rev - cost };
  });

  return (
    <div className="space-y-6">
      <Panel title="Property profitability">
        <Table
          head={["Property", "Revenue", "Costs", "Net"]}
          monoCols={[1, 2, 3]}
          rows={profitability.map((r) => [
            r.name,
            fmt(r.rev),
            fmt(r.cost),
            <span className="font-medium">{fmt(r.net)}</span>,
          ])}
        />
      </Panel>

      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-900">Generate a report</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {REPORT_CATALOG.map((r) => (
            <div key={r.name} className="flex flex-col justify-between border border-neutral-200 bg-white p-4">
              <div>
                <div className="text-sm font-medium text-neutral-900">{r.name}</div>
                <div className="mt-1 text-xs text-neutral-500">{r.desc}</div>
              </div>
              <button className="mt-4 flex items-center justify-center gap-2 border border-neutral-300 py-2 text-sm text-neutral-700 hover:border-black hover:text-black">
                <Download size={14} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings                                                          */
/* ------------------------------------------------------------------ */

function Field({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">{label}</label>
      <input defaultValue={value} className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black" />
    </div>
  );
}

function SettingsView() {
  return (
    <div className="max-w-3xl space-y-5">
      <Panel title="Profile">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full name" value="Vivian Komuhendo" />
          <Field label="Email" value="admin@rentaly.ug" />
          <Field label="Phone" value="0772 000 111" />
          <Field label="Role" value="Owner / Manager" />
        </div>
      </Panel>

      <Panel title="Organization">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Company name" value="Rentaly Properties Ltd" />
          <Field label="Contact email" value="info@rentaly.ug" />
          <Field label="Phone" value="0414 000 222" />
          <Field label="Locations" value="Kampala, Mbarara, Machinga" />
        </div>
      </Panel>

      <Panel title="System configuration">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Currency" value="UGX (Ugandan Shilling)" />
          <Field label="Payment methods" value="Mobile Money, Bank transfer, Cash" />
          <Field label="Rent due day" value="1st of every month" />
          <Field label="User roles" value="Owner, Manager, Accountant" />
        </div>
        <button className="mt-5 bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800">Save changes</button>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function RentalManagement() {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState("dashboard");
  const [propertyId, setPropertyId] = useState(null);

  if (!authed) return <AuthPage onSignIn={() => setAuthed(true)} />;

  const openProperty = (id) => {
    setPropertyId(id);
    setView("property-detail");
  };
  const navigate = (id) => {
    setPropertyId(null);
    setView(id);
  };

  const activeNav = view === "property-detail" ? "properties" : view;
  const titleMap = {
    dashboard: "Home",
    properties: "Properties",
    tenants: "Tenants",
    staff: "Staff",
    finance: "Payments & Finance",
    reports: "Reports",
    settings: "Settings",
  };
  const title = view === "property-detail" ? "Property details" : titleMap[view] || "Home";

  return (
    <div className="flex min-h-screen bg-white font-sans text-neutral-900">
      <Sidebar active={activeNav} onNavigate={navigate} onSignOut={() => setAuthed(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          right={
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center bg-neutral-900 text-xs text-white">VK</div>
            </div>
          }
        />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          {view === "dashboard" && <Dashboard />}
          {view === "properties" && <PropertiesList onOpen={openProperty} />}
          {view === "property-detail" && (
            <PropertyDetail property={properties.find((p) => p.id === propertyId)} onBack={() => navigate("properties")} />
          )}
          {view === "tenants" && <Tenants />}
          {view === "staff" && <Staff />}
          {view === "finance" && <Finance />}
          {view === "reports" && <Reports />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
