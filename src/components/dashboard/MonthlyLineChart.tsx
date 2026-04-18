"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatUSD } from "@/lib/utils";

export interface MonthlyPoint {
  period: string;
  label: string;
  total: number;
  interest: number;
}

interface Props {
  data: MonthlyPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs"
      style={{ background: "#162040", border: "1px solid #1A2744" }}>
      <p className="text-text-muted mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: p.name === "total" ? "#00D9FF" : "#00E5A0" }}
          />
          <span className="text-text-secondary capitalize">
            {p.name === "total" ? "Cartera" : "Intereses"}
          </span>
          <span className="font-mono font-medium text-text-primary ml-1">
            {formatUSD(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

export default function MonthlyLineChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Sin datos históricos
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradInterest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1A2744"
          vertical={false}
        />

        <XAxis
          dataKey="label"
          tick={{ fill: "#7A8FB0", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />

        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: "#7A8FB0", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="total"
          name="total"
          stroke="#00D9FF"
          strokeWidth={2}
          fill="url(#gradTotal)"
          dot={false}
          activeDot={{ r: 4, fill: "#00D9FF", strokeWidth: 0 }}
        />

        <Area
          type="monotone"
          dataKey="interest"
          name="interest"
          stroke="#00E5A0"
          strokeWidth={1.5}
          fill="url(#gradInterest)"
          dot={false}
          activeDot={{ r: 3, fill: "#00E5A0", strokeWidth: 0 }}
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
