import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Investment, Institution, Account, Transaction, ExchangeRate } from "@/lib/types";
import InvestmentDetail from "@/components/inversiones/InvestmentDetail";

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const [invRes, txRes, instRes, accountsRes, ratesRes] = await Promise.all([
    supabase
      .from("investments")
      .select("*, institution:institutions(id, name), account:accounts(id, name)")
      .eq("id", id)
      .single(),
    supabase
      .from("transactions")
      .select("*")
      .eq("investment_id", id)
      .order("transaction_date", { ascending: false }),
    supabase.from("institutions").select("*").order("name"),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("exchange_rates").select("*").order("period", { ascending: false }).limit(1),
  ]);

  if (invRes.error || !invRes.data) {
    return (
      <div className="rounded-2xl p-8 text-center text-text-muted text-sm" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
        Inversión no encontrada
      </div>
    );
  }

  const investment = invRes.data as Investment;
  const transactions = (txRes.data ?? []) as Transaction[];
  const institutions = (instRes.data ?? []) as Institution[];
  const accounts = (accountsRes.data ?? []) as Account[];
  const exchangeRate = ((ratesRes.data ?? []) as ExchangeRate[])[0]?.usd_to_crc ?? 520;

  return (
    <InvestmentDetail
      investment={investment}
      institutions={institutions}
      accounts={accounts}
      transactions={transactions}
      exchangeRate={exchangeRate}
    />
  );
}
