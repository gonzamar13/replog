import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type RoutineGroup = Database["public"]["Tables"]["routine_groups"]["Row"];

export async function listRoutineGroups() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routine_groups")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getRoutineGroup(groupId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routine_groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  return data;
}

export async function createRoutineGroup(input: {
  name: string;
  startsOn: string | null;
  endsOn: string | null;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("routine_groups")
    .insert({
      owner_id: user.id,
      name: input.name,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
