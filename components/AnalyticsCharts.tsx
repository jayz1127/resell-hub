"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import type { MarketplaceRow, MonthlyRow } from "@/lib/analytics";

const PLATFORM_COLORS: Record<string, string> = {
  EBAY: "#e53238",
  POSHMARK: "#8f0022",
  MERCARI: "#6a5acd",
  VINTED: "#09b1ba",
  DEPOP: "#ff2300",
};

function colorFor(platform: string): string {
  return PLATFORM_COLORS[platform] || "#888";
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: "1rem",
};

export function RevenueProfitChart({ data }: { data: MonthlyRow[] }) {
  if (data.length === 0) return <EmptyChart label="Not enough sales yet for a trend line." />;
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>Revenue &amp; profit over time</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          <Legend />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.18} />
          <Area type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MarketplacePieChart({
  data,
  metric,
  title,
}: {
  data: MarketplaceRow[];
  metric: "revenue" | "profit";
  title: string;
}) {
  if (data.length === 0) return <EmptyChart label="No sales yet." />;
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey={metric}
            nameKey="platform"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={(d: any) => `${d.platform}: $${d[metric].toFixed(0)}`}
          >
            {data.map((row) => (
              <Cell key={row.platform} fill={colorFor(row.platform)} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MarketplaceBarChart({
  data,
  metric,
  title,
  format,
}: {
  data: MarketplaceRow[];
  metric: "soldCount" | "avgSalePrice";
  title: string;
  format: "count" | "money";
}) {
  if (data.length === 0) return <EmptyChart label="No sales yet." />;
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => (format === "money" ? `$${v.toFixed(2)}` : v)} />
          <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.platform} fill={colorFor(row.platform)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", minHeight: 200 }}>
      {label}
    </div>
  );
}
