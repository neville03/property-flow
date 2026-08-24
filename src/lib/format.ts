export const CURRENCY = "UGX";

export const money = (n: number | null | undefined) =>
  `${CURRENCY} ${Number(n ?? 0).toLocaleString("en-UG")}`;

export const moneyShort = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
};

export const dateFmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const monthKey = (d: string) => new Date(d).toLocaleDateString("en-GB", { month: "short" });
