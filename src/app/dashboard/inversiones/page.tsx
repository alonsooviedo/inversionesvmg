import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatUSD, formatPercent } from "@/lib/utils";
import type { Investment, Institution, Account, ExchangeRate } from "@/lib/types";
import KpiCard from "@/components/dashboard/KpiCard";
import InversionesManager from "@/components/inversiones/InversionesManager";
import { TrendingUp, Wallet, Percent, BarChart3 } from "lucide-react";

function toUSD(amount: number, currency: string, rate: number): number {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

export default async function InversionesPage() {
  const supabase = await createServerSupabaseClient();

  const [investmentsRes, instRes, accountsRes, ratesRes] = await Promise.all([
    supabase
      .from("investments")
      .select("*, account:accounts(id,name,type,active,created_at), institution:institutions(id,name,country,active,created_at)")
      .order("status", { ascending: true })
      .order("current_balance", { ascending: false }),
    supabase.from("institutions").select("*").order("name"),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("exchange_rates").select("*").order("period", { ascending: false }).limit(1),
  ]);

  const investments  = (investmentsRes.data ?? []) as Investment[];
  const institutions = (instRes.data ?? []) as Institution[];
  const accounts     = (accountsRes.data ?? []) as Account[];
  const exchangeRate = ((ratesRes.data ?? []) as ExchangeRate[])[0]?.usd_to_crc ?? 520;

  const active   = investments.filter((i) => i.status === "active");
  const inactive = investments.filter((i) => i.status !== "active");

  const totalActiveUSD = active.reduce((s, i) => s + toUSD(i.current_balance, i.currency, exchangeRate), 0);
  const ratedInvestments = active.filter((i) => i.interest_rate != null);
  const avgRate = ratedInvestments.length > 0
    ? ratedInvestments.reduce((s, i) => s + (i.interest_rate ?? 0), 0) / ratedInvestments.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Inversiones</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {active.length} activas · {inactive.length} históricas · tipo de cambio{" "}
          <span className="font-mono text-text-secondary">₡{exchangeRate.toLocaleString("es-CR")} / USD</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Inversiones Activas" value={String(active.length)} subtitle={`${investments.length} en total`} accent="cyan" icon={<TrendingUp size={15} />} />
        <KpiCard title="Cartera Activa (USD)" value={formatUSD(totalActiveUSD)} subtitle="Valor actual consolidado" accent="green" icon={<Wallet size={15} />} />
        <KpiCard title="Tasa Promedio" value={formatPercent(avgRate)} subtitle={`${ratedInvestments.length} inversión${ratedInvestments.length !== 1 ? "es" : ""} con tasa`} accent="amber" icon={<Percent size={15} />} />
        <KpiCard title="Históricas" value={String(inactive.length)} subtitle="Liquidadas o vendidas" accent="cyan" icon={<BarChart3 size={15} />} />
      </div>

      <InversionesManager
        investments={investments}
        institutions={institutions}
        accounts={accounts}
        exchangeRate={exchangeRate}
      />
    </div>
  );
}
