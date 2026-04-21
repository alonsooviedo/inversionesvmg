"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatUSD, instrumentLabel } from "@/lib/utils";

export interface DonutSlice {
  type: string;
  label: string;
  value: number;
  percentage: number;
}

const COLORS: Record<string, string> = {
  fondo_vista: "#00D9FF",
  fondo_cerrado: "#00E5A0",
  cdp: "#F59E0B",
  bono: "#A78BFA",
};

const DEFAULT_COLOR = "#3D5080";

interface Props {
  data: DonutSlice[];
  totalUSD: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: DonutSlice }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      className="rounded-lg px-4 py-2 text-xs"
      style={{
        background: "#162040",
        border: "1px solid #1A2744",
        minWidth: "280px",
        zIndex: 50,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.8)",
      }}>
      <div className="space-y-1">
        <p className="text-text-secondary font-medium">{d.name}</p>
        <p className="font-mono text-xs font-bold text-text-primary">
          {formatUSD(d.value)}
        </p>
        <p className="text-text-muted font-medium">{(d.payload.percentage * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}

export default function DonutChart({ data, totalUSD }: Props) {
  const [isHovering, setIsHovering] = React.useState(false);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Sin datos
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 h-full">
      {/* Donut */}
      <div
        className="flex-shrink-0 w-[180px] h-[180px] relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
              strokeWidth={0}>
              {data.map((entry) => (
                <Cell
                  key={entry.type}
                  fill={COLORS[entry.type] ?? DEFAULT_COLOR}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label - hidden on hover */}
        {!isHovering && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] text-text-muted uppercase tracking-wider">Total</span>
            <span className="text-[11px] font-mono font-semibold text-text-primary mt-0.5 leading-tight">
              {formatUSD(totalUSD)}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5 min-w-0">
        {data
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((entry) => {
            const color = COLORS[entry.type] ?? DEFAULT_COLOR;
            return (
              <div key={entry.type} className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-secondary truncate">
                      {instrumentLabel(entry.type)}
                    </span>
                    <span className="text-xs font-mono text-text-primary flex-shrink-0">
                      {(entry.percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div
                    className="mt-1 h-0.5 rounded-full"
                    style={{ background: "#1A2744" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${entry.percentage * 100}%`,
                        background: color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
