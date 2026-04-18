"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatUSD, formatDate } from "@/lib/utils";
import type { MonthlySnapshot } from "@/lib/types";

interface Props {
  snapshots: (MonthlySnapshot & {
    investment: { currency: string } | null;
  })[];
  exchangeRate: number;
}

function toUSD(amount: number, currency: string, rate: number): number {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

export default function InterestHistory({ snapshots, exchangeRate }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Aggregate snapshots by period
  const monthlyData: Record<
    string,
    { period: string; interest: number; balance: number }
  > = {};

  for (const s of snapshots) {
    const currency = s.investment?.currency ?? "USD";
    const interestUSD = toUSD(s.interest_earned, currency, exchangeRate);
    const balanceUSD = toUSD(s.closing_balance, currency, exchangeRate);

    if (!monthlyData[s.period]) {
      monthlyData[s.period] = { period: s.period, interest: 0, balance: 0 };
    }
    monthlyData[s.period].interest += interestUSD;
    monthlyData[s.period].balance += balanceUSD;
  }

  // Sort by period descending (newest first)
  const sortedMonths = Object.values(monthlyData).sort(
    (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()
  );

  // Calculate YTD cumulative interest
  const currentYear = new Date().getFullYear();
  let ytdInterest = 0;
  let ytdBalance = 0;
  const ytdMonths = sortedMonths.filter((m) => {
    const year = new Date(m.period).getFullYear();
    return year === currentYear;
  });

  for (const month of ytdMonths) {
    ytdInterest += month.interest;
  }

  if (ytdMonths.length > 0) {
    ytdBalance = ytdMonths[0].balance;
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-t-2xl transition-colors"
        style={{
          background: "#111C33",
          border: "1px solid #1A2744",
          borderBottom: expanded ? "none" : "1px solid #1A2744",
          color: "#E8EDF5",
        }}>
        <div className="flex items-center gap-3">
          <ChevronDown
            size={14}
            style={{
              transform: `rotate(${expanded ? 180 : 0}deg)`,
              transition: "transform 0.2s",
              color: "#7A8FB0",
            }}
          />
          <div className="text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              Histórico de Ganancias
            </p>
            <p className="text-sm text-text-primary mt-0.5">
              {ytdMonths.length} meses en {currentYear} •{" "}
              <span className="text-accent-green">{formatUSD(ytdInterest)}</span>
            </p>
          </div>
        </div>
        {ytdMonths.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-text-muted">YTD Cartera</p>
            <p className="text-sm font-mono text-text-primary">
              {formatUSD(ytdBalance)}
            </p>
          </div>
        )}
      </button>

      {expanded && sortedMonths.length > 0 && (
        <div
          style={{
            background: "#111C33",
            border: "1px solid #1A2744",
            borderTop: "none",
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
          }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
                  {["Período", "Intereses", "Cartera", "Año"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map((month, idx) => {
                  const monthDate = new Date(month.period);
                  const monthLabel = monthDate.toLocaleDateString("es-CR", {
                    month: "long",
                    year: "numeric",
                  });
                  const year = monthDate.getFullYear();

                  return (
                    <tr
                      key={month.period}
                      style={{
                        background: idx % 2 === 0 ? "#111C33" : "#0E1628",
                        borderBottom:
                          idx < sortedMonths.length - 1
                            ? "1px solid #1A274433"
                            : "none",
                      }}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary capitalize">
                          {monthLabel}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-accent-green">
                          {formatUSD(month.interest)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-text-primary">
                          {formatUSD(month.balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-text-secondary">
                          {year}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedMonths.length === 0 && (
        <div
          style={{
            background: "#111C33",
            border: "1px solid #1A2744",
            borderTop: "none",
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
            padding: "24px",
            textAlign: "center",
            color: "#7A8FB0",
            fontSize: "14px",
          }}>
          Sin datos de histórico disponibles
        </div>
      )}
    </div>
  );
}
