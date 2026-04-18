"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type State = { error: string } | { success: true } | null;

export async function createInstitution(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("institutions").insert({
    name: formData.get("name") as string,
    country: formData.get("country") as string,
    active: formData.get("active") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/instituciones");
  revalidatePath("/dashboard/inversiones");
  return { success: true };
}
