"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type State = { error: string } | { success: true } | null;

function parseInvestmentFields(formData: FormData) {
  const interest_rate_raw = formData.get("interest_rate") as string;
  const interest_rate = interest_rate_raw ? parseFloat(interest_rate_raw) / 100 : null;
  return {
    name: formData.get("name") as string,
    institution_id: formData.get("institution_id") as string,
    account_id: formData.get("account_id") as string,
    instrument_type: formData.get("instrument_type") as string,
    currency: formData.get("currency") as string,
    iban: (formData.get("iban") as string) || null,
    initial_amount: parseFloat(formData.get("initial_amount") as string),
    current_balance: parseFloat(formData.get("current_balance") as string),
    interest_rate,
    interest_frequency: (formData.get("interest_frequency") as string) || null,
    purchase_date: (formData.get("purchase_date") as string) || null,
    maturity_date: (formData.get("maturity_date") as string) || null,
    status: formData.get("status") as string,
    notes: (formData.get("notes") as string) || null,
  };
}

export async function createInvestment(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("investments").insert(parseInvestmentFields(formData));
  if (error) return { error: error.message };
  revalidatePath("/dashboard/inversiones");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateInvestment(_prev: State, formData: FormData): Promise<State> {
  const id = formData.get("id") as string;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("investments")
    .update(parseInvestmentFields(formData))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/inversiones");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteInvestment(id: string): Promise<State> {
  const supabase = await createServerSupabaseClient();
  // Delete related transactions first
  await supabase.from("transactions").delete().eq("investment_id", id);
  // Delete the investment
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/inversiones");
  revalidatePath("/dashboard");
  return { success: true };
}
