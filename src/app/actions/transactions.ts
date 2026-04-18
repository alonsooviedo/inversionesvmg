"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type State = { error: string } | { success: true } | null;

// Transaction types that ADD to balance
const ADD_TYPES = ["interest", "deposit", "purchase"];
// Transaction types that SUBTRACT from balance
const SUB_TYPES = ["sale", "liquidation"];

export async function createTransaction(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createServerSupabaseClient();

  const investment_id = formData.get("investment_id") as string;
  const type         = formData.get("type") as string;
  const amount       = parseFloat(formData.get("amount") as string);
  const balance_after_raw = formData.get("balance_after") as string;

  // ── Fetch current balance ────────────────────────────────────────────────
  const { data: inv, error: fetchErr } = await supabase
    .from("investments")
    .select("current_balance")
    .eq("id", investment_id)
    .single();

  if (fetchErr || !inv) return { error: "No se encontró la inversión." };

  // ── Calculate new balance ────────────────────────────────────────────────
  let newBalance: number = inv.current_balance;
  if (ADD_TYPES.includes(type)) newBalance = inv.current_balance + amount;
  if (SUB_TYPES.includes(type)) newBalance = inv.current_balance - amount;

  const balance_after = balance_after_raw
    ? parseFloat(balance_after_raw)
    : newBalance;

  // ── Insert transaction ───────────────────────────────────────────────────
  const { error: txErr } = await supabase.from("transactions").insert({
    investment_id,
    transaction_date: formData.get("transaction_date") as string,
    type,
    amount,
    balance_after,
    description: (formData.get("description") as string) || null,
  });
  if (txErr) return { error: txErr.message };

  // ── Update investment balance ────────────────────────────────────────────
  const { error: updErr } = await supabase
    .from("investments")
    .update({ current_balance: balance_after })
    .eq("id", investment_id);

  if (updErr) return { error: updErr.message };

  revalidatePath("/dashboard/movimientos");
  revalidatePath("/dashboard/inversiones");
  revalidatePath(`/dashboard/inversiones/${investment_id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<State> {
  const supabase = await createServerSupabaseClient();

  // Fetch transaction to reverse its balance effect
  const { data: tx, error: fetchErr } = await supabase
    .from("transactions")
    .select("amount, type, investment_id")
    .eq("id", id)
    .single();

  if (fetchErr || !tx) return { error: "No se encontró el movimiento." };

  // Fetch current investment balance
  const { data: inv, error: invErr } = await supabase
    .from("investments")
    .select("current_balance")
    .eq("id", tx.investment_id)
    .single();

  if (invErr || !inv) return { error: "No se encontró la inversión." };

  // Reverse the effect on balance
  let newBalance = inv.current_balance;
  if (ADD_TYPES.includes(tx.type)) newBalance -= tx.amount;
  if (SUB_TYPES.includes(tx.type)) newBalance += tx.amount;

  // Delete the transaction
  const { error: delErr } = await supabase.from("transactions").delete().eq("id", id);
  if (delErr) return { error: delErr.message };

  // Update investment balance
  const { error: updErr } = await supabase
    .from("investments")
    .update({ current_balance: newBalance })
    .eq("id", tx.investment_id);

  if (updErr) return { error: updErr.message };

  revalidatePath("/dashboard/movimientos");
  revalidatePath("/dashboard/inversiones");
  revalidatePath(`/dashboard/inversiones/${tx.investment_id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTransaction(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createServerSupabaseClient();

  const id          = formData.get("id") as string;
  const new_type    = formData.get("type") as string;
  const new_amount  = parseFloat(formData.get("amount") as string);
  const balance_after_raw = formData.get("balance_after") as string;
  const description = (formData.get("description") as string) || null;
  const transaction_date = formData.get("transaction_date") as string;

  // ── Fetch old transaction ────────────────────────────────────────────────
  const { data: oldTx, error: oldErr } = await supabase
    .from("transactions")
    .select("amount, type, investment_id")
    .eq("id", id)
    .single();

  if (oldErr || !oldTx) return { error: "No se encontró el movimiento." };

  const investment_id = oldTx.investment_id;

  // ── Fetch current investment balance ─────────────────────────────────────
  const { data: inv, error: fetchErr } = await supabase
    .from("investments")
    .select("current_balance")
    .eq("id", investment_id)
    .single();

  if (fetchErr || !inv) return { error: "No se encontró la inversión." };

  // ── Recalculate balance: undo old effect, apply new effect ───────────────
  let balance = inv.current_balance;
  if (ADD_TYPES.includes(oldTx.type)) balance -= oldTx.amount;  // undo old
  if (SUB_TYPES.includes(oldTx.type)) balance += oldTx.amount;  // undo old
  if (ADD_TYPES.includes(new_type))   balance += new_amount;     // apply new
  if (SUB_TYPES.includes(new_type))   balance -= new_amount;     // apply new

  const balance_after = balance_after_raw ? parseFloat(balance_after_raw) : balance;

  // ── Update transaction ───────────────────────────────────────────────────
  const { error: txErr } = await supabase
    .from("transactions")
    .update({ type: new_type, amount: new_amount, balance_after, description, transaction_date })
    .eq("id", id);

  if (txErr) return { error: txErr.message };

  // ── Update investment balance ────────────────────────────────────────────
  const { error: updErr } = await supabase
    .from("investments")
    .update({ current_balance: balance_after })
    .eq("id", investment_id);

  if (updErr) return { error: updErr.message };

  revalidatePath("/dashboard/movimientos");
  revalidatePath("/dashboard/inversiones");
  revalidatePath(`/dashboard/inversiones/${investment_id}`);
  revalidatePath("/dashboard");
  return { success: true };
}
