"use client";

import { useState } from "react";
import { formatUSD } from "@/lib/utils";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import type { MonthRow } from "./page";

const PAGE_SIZE = 12;

interface Props {
  rows: MonthRow[];
}

export default function HistoricoClient({ rows }: Props) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const ytdYear = new Date().getFullYear();
  const ytdInterest = rows
    .filter((r) => r.period.startsWith(String(ytdYear)))
    .reduce((s, r) => s + r.interest, 0);
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Histórico de Ganancias</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {rows.length} mes{rows.length !== 1 ? "es" : ""} registrado{rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Ganancias YTD", value: formatUSD(ytdInterest), sub: `Año ${ytdYear}`, accent: "#00E5A0" },
          { label: "Ganancias Totales", value: formatUSD(totalInterest), sub: "Historial completo", accent: "#00D9FF" },
          { label: "Meses con Intereses", value: String(rows.length), sub: "Meses registrados", accent: "#A78BFA" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-10 pointer-events-none" style={{ background: kpi.accent, transform: "translate(30%,-30%)" }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">{kpi.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.accent}18`, color: kpi.accent }}>
                <TrendingUp size={14} />
              </div>
            </div>
            <p className="text-lg font-mono font-semibold text-text-primary">{kpi.value}</p>
            <p className="text-xs text-text-muted mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      {rows.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-text-muted text-sm" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          No hay movimientos de interés registrados aún.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2744" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
                {["Período", "Año", "Ganancias (USD)", "Movimientos"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={row.period}
                  style={{ background: i % 2 === 0 ? "#111C33" : "#0E1628", borderBottom: "1px solid #1A274455" }}>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-text-primary capitalize">{row.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: "#1A2744", color: "#7A8FB0" }}>
                      {row.period.split("-")[0]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-sm font-semibold" style={{ color: "#00E5A0" }}>
                      {formatUSD(row.interest)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-text-secondary">
                      {row.txCount} movimiento{row.txCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "#0E1628", borderTop: "1px solid #1A2744" }}>
              <p className="text-xs text-text-muted">
                Página {page + 1} de {totalPages} · {rows.length} meses en total
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: "#111C33", border: "1px solid #1A2744", color: "#7A8FB0" }}
                  onMouseEnter={(e) => { if (page > 0) e.currentTarget.style.color = "#E8EDF5"; }}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors"
                    style={{
                      background: i === page ? "#162040" : "#111C33",
                      border: i === page ? "1px solid #00D9FF33" : "1px solid #1A2744",
                      color: i === page ? "#00D9FF" : "#7A8FB0",
                    }}>
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: "#111C33", border: "1px solid #1A2744", color: "#7A8FB0" }}
                  onMouseEnter={(e) => { if (page < totalPages - 1) e.currentTarget.style.color = "#E8EDF5"; }}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
