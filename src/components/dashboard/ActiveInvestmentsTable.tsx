"use client";

import { useRouter } from "next/navigation";
import { formatUSD, formatCurrency, formatDate, formatPercent, instrumentLabel } from "@/lib/utils";

export interface ActiveRow {
  id: string;
  name: string;
  institution_name: string;
  account_name: string;
  instrument_type: string;
  currency: string;
  current_balance: number;
  current_balance_usd: number;
  interest_rate?: number;
  maturity_date?: string;
}

interface Props {
  rows: ActiveRow[];
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  fondo_vista:    { bg: "#00D9FF18", text: "#00D9FF" },
  fondo_cerrado:  { bg: "#00E5A018", text: "#00E5A0" },
  cdp:            { bg: "#F59E0B18", text: "#F59E0B" },
  bono:           { bg: "#A78BFA18", text: "#A78BFA" },
};

const DEFAULT_TYPE = { bg: "#3D508018", text: "#7A8FB0" };

function MaturityBadge({ date }: { date?: string }) {
  if (!date) return <span className="text-text-muted">—</span>;
  const diff = new Date(date).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  let color = "#7A8FB0";
  if (days < 0) color = "#EF4444";
  else if (days <= 30) color = "#F59E0B";
  else if (days <= 90) color = "#00D9FF";
  return <span className="font-mono text-xs" style={{ color }}>{formatDate(date)}</span>;
}

export default function ActiveInvestmentsTable({ rows }: Props) {
  const router = useRouter();

  if (!rows.length) {
    return (
      <div
        className="rounded-2xl p-8 text-center text-text-muted text-sm"
        style={{ background: "#111C33", border: "1px solid #1A2744" }}>
        No hay inversiones activas
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2744" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
              {["Inversión", "Tipo", "Saldo", "Equiv. USD", "Tasa", "Vencimiento"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const typeColor = TYPE_COLORS[row.instrument_type] ?? DEFAULT_TYPE;
              return (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/dashboard/inversiones/${row.id}`)}
                  className="transition-colors cursor-pointer"
                  style={{ background: i % 2 === 0 ? "#111C33" : "#0E1628", borderBottom: "1px solid #1A274466" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#162040")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#111C33" : "#0E1628")}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary leading-snug">{row.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{row.institution_name} · {row.account_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap" style={{ background: typeColor.bg, color: typeColor.text }}>
                      {instrumentLabel(row.instrument_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-text-primary">{formatCurrency(row.current_balance, row.currency)}</span>
                    <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: "#1A2744", color: "#7A8FB0" }}>{row.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-accent-cyan">{formatUSD(row.current_balance_usd)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.interest_rate != null
                      ? <span className="font-mono text-xs text-accent-green">{formatPercent(row.interest_rate)}</span>
                      : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3"><MaturityBadge date={row.maturity_date} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
