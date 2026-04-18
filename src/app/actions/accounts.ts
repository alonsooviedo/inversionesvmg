"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type State = { error: string } | { success: true } | null;

export async function createAccount(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("accounts").insert({
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    active: formData.get("active") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/titulares");
  revalidatePath("/dashboard/inversiones");
  return { success: true };
}

export async function createExchangeRate(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("exchange_rates").insert({
    period: formData.get("period") as string,
    usd_to_crc: parseFloat(formData.get("usd_to_crc") as string),
    notes: (formData.get("notes") as string) || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracion");
  return { success: true };
}
