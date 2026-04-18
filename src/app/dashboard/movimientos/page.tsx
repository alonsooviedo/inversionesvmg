import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatUSD, currentPeriod } from "@/lib/utils";
import type { Transaction, Investment, ExchangeRate } from "@/lib/types";
import KpiCard from "@/components/dashboard/KpiCard";
import MovimientosManager from "@/components/movimientos/MovimientosManager";
import { ArrowLeftRight, TrendingUp, ArrowDownToLine, Receipt } from "lucide-react";

function toUSD(amount: number, currency: string, rate: number): number {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

type TxWithInvestment = Transaction & {
  investment: { id: string; name: string; currency: string; institution: { name: string } | null } | null;
};

export default async function MovimientosPage() {
  const supabase = await createServerSupabaseClient();

  const [txRes, activeInvRes, ratesRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, investment:investments(id, name, currency, institution:institutions(name))")
      .order("transaction_date", { ascending: false })
      .limit(200),
    supabase
      .from("investments")
      .select("id, name, currency, institution:institutions(name)")
      .eq("status", "active")
      .order("name"),
    supabase.from("exchange_rates").select("*").order("period", { ascending: false }).limit(1),
  ]);

  const transactions = (txRes.data ?? []) as TxWithInvestment[];
  const exchangeRate = ((ratesRes.data ?? []) as ExchangeRate[])[0]?.usd_to_crc ?? 520;

  const activeInvestments = (activeInvRes.data ?? []).map((i: { id: string; name: string; currency: string; institution: { name: string }[] | { name: string } | null }) => ({
    id: i.id as string,
    name: i.name as string,
    institution_name: Array.isArray(i.institution) ? (i.institution[0]?.name ?? "—") : (i.institution?.name ?? "—"),
    currency: i.currency as string,
  }));

  const currentP = currentPeriod();
  const ytdStart = `${new Date().getFullYear()}-01-01`;

  let monthInterestUSD = 0, ytdInterestUSD = 0, ytdDepositsUSD = 0;
  for (const tx of transactions) {
    const currency = tx.investment?.currency ?? "USD";
    const usd = toUSD(tx.amount, currency, exchangeRate);
    const month = tx.transaction_date.slice(0, 7);
    if (tx.type === "interest") {
      if (month === currentP.slice(0, 7)) monthInterestUSD += usd;
      if (tx.transaction_date >= ytdStart) ytdInterestUSD += usd;
    }
    if (tx.type === "deposit" && tx.transaction_date >= ytdStart) ytdDepositsUSD += usd;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Movimientos</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {transactions.length} movimiento{transactions.length !== 1 ? "s" : ""} recientes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Movimientos" value={String(transactions.length)} subtitle="Últimos 200 registros" accent="cyan" icon={<ArrowLeftRight size={15} />} />
        <KpiCard title="Intereses del Mes" value={formatUSD(monthInterestUSD)} subtitle="Devengados este período" accent="green" icon={<TrendingUp size={15} />} />
        <KpiCard title="Intereses YTD" value={formatUSD(ytdInterestUSD)} subtitle={`Acumulado ${new Date().getFullYear()}`} accent="amber" icon={<Receipt size={15} />} />
        <KpiCard title="Depósitos YTD" value={formatUSD(ytdDepositsUSD)} subtitle={`Capital ingresado ${new Date().getFullYear()}`} accent="cyan" icon={<ArrowDownToLine size={15} />} />
      </div>

      <MovimientosManager transactions={transactions} activeInvestments={activeInvestments} />
    </div>
  );
}
