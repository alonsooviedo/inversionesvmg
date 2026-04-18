import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatUSD } from "@/lib/utils";
import type { Investment, Account, ExchangeRate } from "@/lib/types";
import KpiCard from "@/components/dashboard/KpiCard";
import TitularesManager from "@/components/titulares/TitularesManager";
import { Users, Wallet, Building, User } from "lucide-react";

function toUSD(amount: number, currency: string, rate: number): number {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

export default async function TitularesPage() {
  const supabase = await createServerSupabaseClient();

  const [accountsRes, investRes, ratesRes] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("investments").select("*, institution:institutions(id,name,country,active,created_at)").eq("status", "active").order("current_balance", { ascending: false }),
    supabase.from("exchange_rates").select("*").order("period", { ascending: false }).limit(1),
  ]);

  const accounts    = (accountsRes.data ?? []) as Account[];
  const investments = (investRes.data ?? []) as Investment[];
  const exchangeRate = ((ratesRes.data ?? []) as ExchangeRate[])[0]?.usd_to_crc ?? 520;

  const grandTotalUSD = investments.reduce((s, i) => s + toUSD(i.current_balance, i.currency, exchangeRate), 0);
  const empresas = accounts.filter((a) => a.type === "empresa").length;
  const personas = accounts.filter((a) => a.type === "persona").length;
  const activeAccounts = accounts.filter((a) => investments.some((i) => i.account_id === a.id)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Titulares</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {accounts.length} titular{accounts.length !== 1 ? "es" : ""} · {activeAccounts} con inversiones activas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Titulares" value={String(accounts.length)} subtitle={`${activeAccounts} con inversiones activas`} accent="cyan" icon={<Users size={15} />} />
        <KpiCard title="Cartera Total" value={formatUSD(grandTotalUSD)} subtitle="Inversiones activas consolidadas" accent="green" icon={<Wallet size={15} />} />
        <KpiCard title="Empresas" value={String(empresas)} subtitle="Cuentas empresariales" accent="amber" icon={<Building size={15} />} />
        <KpiCard title="Personas" value={String(personas)} subtitle="Cuentas personales" accent="cyan" icon={<User size={15} />} />
      </div>

      <TitularesManager
        accounts={accounts}
        investments={investments}
        exchangeRate={exchangeRate}
        grandTotalUSD={grandTotalUSD}
      />
    </div>
  );
}
