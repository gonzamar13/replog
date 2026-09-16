import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type BodyWeightLog =
  Database["public"]["Tables"]["body_weight_logs"]["Row"];

export async function listBodyWeightLogs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("body_weight_logs")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(90);

  return data ?? [];
}

export async function createBodyWeightLog(input: {
  weight: number;
  loggedAt: string | null;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("body_weight_logs").insert({
    user_id: user.id,
    weight: input.weight,
    logged_at: input.loggedAt ?? undefined,
  });

  if (error) throw error;
}
