"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { ExchangeRate } from "@/lib/types";
import HistoricoClient from "./HistoricoClient";

function toUSD(amount: number, currency: string, rate: number): number {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

export interface MonthRow {
  period: string;       // "2026-04"
  label: string;        // "Abril 2026"
  interest: number;     // USD
  txCount: number;
}

export default async function HistoricoPage() {
  const supabase = await createServerSupabaseClient();

  const [txRes, ratesRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, transaction_date, investment:investments(currency)")
      .eq("type", "interest")
      .order("transaction_date", { ascending: false }),
    supabase.from("exchange_rates").select("*").order("period", { ascending: false }).limit(1),
  ]);

  const exchangeRate = ((ratesRes.data ?? []) as ExchangeRate[])[0]?.usd_to_crc ?? 520;

  type TxRow = {
    amount: number;
    transaction_date: string;
    investment: { currency: string } | { currency: string }[] | null;
  };

  const txs = (txRes.data ?? []) as unknown as TxRow[];

  // Agrupar por mes (YYYY-MM)
  const map: Record<string, { interest: number; txCount: number }> = {};

  for (const tx of txs) {
    const inv = tx.investment;
    const currency = (Array.isArray(inv) ? inv[0]?.currency : inv?.currency) ?? "USD";
    const usd = toUSD(tx.amount, currency, exchangeRate);
    const period = tx.transaction_date.slice(0, 7); // "2026-04"
    if (!map[period]) map[period] = { interest: 0, txCount: 0 };
    map[period].interest += usd;
    map[period].txCount += 1;
  }

  // Convertir a array ordenado por período descendente
  const rows: MonthRow[] = Object.entries(map)
    .map(([period, data]) => {
      const [year, month] = period.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      const label = date.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
      return { period, label, ...data };
    })
    .sort((a, b) => b.period.localeCompare(a.period));

  return <HistoricoClient rows={rows} />;
}
