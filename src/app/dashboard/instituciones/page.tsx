import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatUSD } from "@/lib/utils";
import type { Investment, Institution, ExchangeRate } from "@/lib/types";
import KpiCard from "@/components/dashboard/KpiCard";
import InstitucionesManager from "@/components/instituciones/InstitucionesManager";
import { Building2, TrendingUp, Globe, BarChart3 } from "lucide-react";

function toUSD(amount: number, currency: string, rate: number): number {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

export default async function InstitucionesPage() {
  const supabase = await createServerSupabaseClient();

  const [instRes, investRes, ratesRes] = await Promise.all([
    supabase.from("institutions").select("*").order("name"),
    supabase.from("investments").select("*, institution:institutions(id,name,country,active,created_at)").eq("status", "active").order("current_balance", { ascending: false }),
    supabase.from("exchange_rates").select("*").order("period", { ascending: false }).limit(1),
  ]);

  const institutions = (instRes.data ?? []) as Institution[];
  const investments  = (investRes.data ?? []) as Investment[];
  const exchangeRate = ((ratesRes.data ?? []) as ExchangeRate[])[0]?.usd_to_crc ?? 520;

  const grandTotalUSD = investments.reduce((s, i) => s + toUSD(i.current_balance, i.currency, exchangeRate), 0);
  const activeInstitutions = institutions.filter((inst) => investments.some((i) => i.institution_id === inst.id)).length;
  const countries = new Set(institutions.map((i) => i.country)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Instituciones</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {institutions.length} institución{institutions.length !== 1 ? "es" : ""} · {activeInstitutions} con inversiones activas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Instituciones" value={String(institutions.length)} subtitle={`${activeInstitutions} con inversiones activas`} accent="cyan" icon={<Building2 size={15} />} />
        <KpiCard title="Cartera Total" value={formatUSD(grandTotalUSD)} subtitle="Inversiones activas consolidadas" accent="green" icon={<TrendingUp size={15} />} />
        <KpiCard title="Países" value={String(countries)} subtitle="Distribución geográfica" accent="amber" icon={<Globe size={15} />} />
        <KpiCard title="Inversiones Activas" value={String(investments.length)} subtitle="En todas las instituciones" accent="cyan" icon={<BarChart3 size={15} />} />
      </div>

      <InstitucionesManager
        institutions={institutions}
        investments={investments}
        exchangeRate={exchangeRate}
        grandTotalUSD={grandTotalUSD}
      />
    </div>
  );
}
