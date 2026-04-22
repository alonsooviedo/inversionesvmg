import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatUSD, formatCRC, instrumentLabel, currentPeriod, monthsBack } from "@/lib/utils";
import type { Investment, MonthlySnapshot, ExchangeRate } from "@/lib/types";
import KpiCard from "@/components/dashboard/KpiCard";
import DonutChart from "@/components/dashboard/DonutChart";
import MonthlyLineChart from "@/components/dashboard/MonthlyLineChart";
import ActiveInvestmentsTable from "@/components/dashboard/ActiveInvestmentsTable";
import type { ActiveRow } from "@/components/dashboard/ActiveInvestmentsTable";
import type { DonutSlice } from "@/components/dashboard/DonutChart";
import type { MonthlyPoint } from "@/components/dashboard/MonthlyLineChart";
import ExportButton from "@/components/dashboard/ExportButton";
import {
  TrendingUp,
  Wallet,
  CalendarCheck,
  BarChart3,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function toUSD(amount: number, currency: string, rate: number): number {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount; // EUR treated as 1:1 USD (simplification)
}

function prevPeriod(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function periodLabel(period: string): string {
  return new Date(period).toLocaleDateString("es-CR", {
    month: "short",
    year: "2-digit",
  });
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const currentP = currentPeriod();
  const ytdStart = `${new Date().getFullYear()}-01-01`;

  // Parallel fetches
  const [investmentsRes, ratesRes, snapshotsRes, txInterestRes] = await Promise.all([
    supabase
      .from("investments")
      .select(
        "*, account:accounts(id,name,type,active,created_at), institution:institutions(id,name,country,active,created_at)"
      )
      .eq("status", "active")
      .order("current_balance", { ascending: false }),

    supabase
      .from("exchange_rates")
      .select("*")
      .order("period", { ascending: false })
      .limit(1),

    supabase
      .from("monthly_snapshots")
      .select("*, investment:investments(currency)")
      .gte("period", monthsBack(11))
      .order("period", { ascending: true }),

    // Fallback: interest from transactions when no monthly_snapshots exist
    supabase
      .from("transactions")
      .select("amount, transaction_date, investment:investments(currency)")
      .eq("type", "interest")
      .gte("transaction_date", ytdStart),
  ]);

  const investments = (investmentsRes.data ?? []) as Investment[];
  const exchangeRate = ((ratesRes.data ?? []) as ExchangeRate[])[0]?.usd_to_crc ?? 520;
  const snapshots = (snapshotsRes.data ?? []) as (MonthlySnapshot & {
    investment: { currency: string } | null;
  })[];

  // ── Portfolio totals ──────────────────────────────────────────────────────

  let totalUSD = 0;
  let totalCRC = 0;
  let totalInUSD = 0;

  for (const inv of investments) {
    if (inv.currency === "USD") totalUSD += inv.current_balance;
    if (inv.currency === "CRC") totalCRC += inv.current_balance;
    totalInUSD += toUSD(inv.current_balance, inv.currency, exchangeRate);
  }

  // ── Monthly & YTD interest (from snapshots) ──────────────────────────────

  const prevP = prevPeriod();

  let snapshotMonthly = 0;
  let prevMonthInterest = 0;
  let snapshotYTD = 0;

  for (const s of snapshots) {
    const currency = s.investment?.currency ?? "USD";
    const interestUSD = toUSD(s.interest_earned, currency, exchangeRate);
    if (s.period === currentP) snapshotMonthly += interestUSD;
    if (s.period === prevP) prevMonthInterest += interestUSD;
    if (s.period >= ytdStart) snapshotYTD += interestUSD;
  }

  // Fallback: interest from transactions when snapshots are empty
  type TxInterest = { amount: number; transaction_date: string; investment: { currency: string } | { currency: string }[] | null };
  const txInterests = (txInterestRes.data ?? []) as unknown as TxInterest[];
  let txMonthly = 0;
  let txYTD = 0;
  for (const tx of txInterests) {
    const inv = tx.investment;
    const currency = (Array.isArray(inv) ? inv[0]?.currency : inv?.currency) ?? "USD";
    const usd = toUSD(tx.amount, currency, exchangeRate);
    if (tx.transaction_date.slice(0, 7) === currentP.slice(0, 7)) txMonthly += usd;
    txYTD += usd;
  }

  // Use snapshots if data exists, otherwise use transactions
  const monthlyInterest = snapshotMonthly > 0 ? snapshotMonthly : txMonthly;
  const ytdInterest     = snapshotYTD > 0     ? snapshotYTD     : txYTD;

  // ── By instrument type (donut) ────────────────────────────────────────────

  const typeMap: Record<string, number> = {};
  for (const inv of investments) {
    const usd = toUSD(inv.current_balance, inv.currency, exchangeRate);
    typeMap[inv.instrument_type] = (typeMap[inv.instrument_type] ?? 0) + usd;
  }

  const donutData: DonutSlice[] = Object.entries(typeMap)
    .map(([type, value]) => ({
      type,
      label: instrumentLabel(type),
      value,
      percentage: totalInUSD > 0 ? value / totalInUSD : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // ── Monthly evolution (line chart) ───────────────────────────────────────

  const lineMap: Record<string, { total: number; interest: number }> = {};
  for (const s of snapshots) {
    const currency = s.investment?.currency ?? "USD";
    if (!lineMap[s.period]) lineMap[s.period] = { total: 0, interest: 0 };
    lineMap[s.period].total += toUSD(s.closing_balance, currency, exchangeRate);
    lineMap[s.period].interest += toUSD(s.interest_earned, currency, exchangeRate);
  }

  const lineData: MonthlyPoint[] = Object.entries(lineMap).map(
    ([period, vals]) => ({
      period,
      label: periodLabel(period),
      total: Math.round(vals.total * 100) / 100,
      interest: Math.round(vals.interest * 100) / 100,
    })
  );

  // ── Active investments table ──────────────────────────────────────────────

  const tableRows: ActiveRow[] = investments.map((inv) => ({
    id: inv.id,
    name: inv.name,
    institution_name: inv.institution?.name ?? "—",
    account_name: inv.account?.name ?? "—",
    instrument_type: inv.instrument_type,
    currency: inv.currency,
    current_balance: inv.current_balance,
    current_balance_usd: toUSD(inv.current_balance, inv.currency, exchangeRate),
    interest_rate: inv.interest_rate,
    maturity_date: inv.maturity_date,
  }));

  // ── Trend ─────────────────────────────────────────────────────────────────

  const monthTrend =
    prevMonthInterest > 0
      ? {
          value: `${Math.abs(((monthlyInterest - prevMonthInterest) / prevMonthInterest) * 100).toFixed(1)}%`,
          positive: monthlyInterest >= prevMonthInterest,
        }
      : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  const institutionCount = new Set(investments.map((i) => i.institution_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-0">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Resumen</h1>
              <p className="text-sm text-text-muted mt-0.5">
                {investments.length} inversiones activas · tipo de cambio{" "}
                <span className="font-mono text-text-secondary">
                  ₡{exchangeRate.toLocaleString("es-CR")} / USD
                </span>
              </p>
            </div>
            <ExportButton
              investments={tableRows.map((r) => ({
                name: r.name,
                institution_name: r.institution_name,
                account_name: r.account_name,
                account_type: (investments.find((i) => i.id === r.id)?.account as { type?: string } | undefined)?.type,
                instrument_type: r.instrument_type,
                currency: r.currency,
                current_balance: r.current_balance,
                current_balance_usd: r.current_balance_usd,
                interest_rate: r.interest_rate,
                maturity_date: r.maturity_date,
              }))}
              totalUSD={totalUSD}
              totalCRC={totalCRC}
              totalInUSD={totalInUSD}
              monthlyInterestUSD={monthlyInterest}
              ytdInterestUSD={ytdInterest}
              exchangeRate={exchangeRate}
            />
          </div>
          <span className="text-xs font-mono text-text-muted mt-2 inline-block md:hidden">
            {new Date().toLocaleDateString("es-CR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <span className="text-xs font-mono text-text-muted hidden md:inline">
          {new Date().toLocaleDateString("es-CR", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Cartera Total"
          value={formatUSD(totalInUSD)}
          subtitle={`${formatUSD(totalUSD)} USD + ${formatCRC(totalCRC)} CRC`}
          accent="cyan"
          icon={<Wallet size={15} />}
        />
        <KpiCard
          title="Ganancias del Mes"
          value={formatUSD(monthlyInterest)}
          subtitle="Intereses devengados"
          trend={monthTrend}
          accent="green"
          icon={<TrendingUp size={15} />}
        />
        <KpiCard
          title="Ganancias YTD"
          value={formatUSD(ytdInterest)}
          subtitle={`Enero – ${new Date().toLocaleDateString("es-CR", { month: "long" })}`}
          accent="amber"
          icon={<CalendarCheck size={15} />}
        />
        <KpiCard
          title="Inversiones Activas"
          value={String(investments.length)}
          subtitle={`${institutionCount} institución${institutionCount !== 1 ? "es" : ""}`}
          accent="cyan"
          icon={<BarChart3 size={15} />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Donut: composition */}
        <div
          className="xl:col-span-2 rounded-2xl p-6 card-hover"
          style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                Composición
              </p>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                Por instrumento
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#00D9FF18", color: "#00D9FF" }}>
              <BarChart3 size={15} />
            </div>
          </div>
          <div className="h-[200px]">
            <DonutChart data={donutData} totalUSD={totalInUSD} />
          </div>
        </div>

        {/* Line: monthly evolution */}
        <div
          className="xl:col-span-3 rounded-2xl p-6 card-hover"
          style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                Evolución
              </p>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                Cartera mensual (USD)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#00D9FF" }} />
                Cartera
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#00E5A0" }} />
                Intereses
              </span>
            </div>
          </div>
          <div className="h-[200px]">
            <MonthlyLineChart data={lineData} />
          </div>
        </div>
      </div>

      {/* Active investments table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Inversiones Activas
          </p>
          <a
            href="/dashboard/inversiones"
            className="text-xs text-accent-cyan hover:underline">
            Ver todas →
          </a>
        </div>
        <ActiveInvestmentsTable rows={tableRows} />
      </div>
    </div>
  );
}
