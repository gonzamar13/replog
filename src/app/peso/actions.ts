"use server";

import { createBodyWeightLog } from "@/lib/data/body-weight";
import { revalidatePath } from "next/cache";

export async function createBodyWeightLogAction(formData: FormData) {
  const weightRaw = formData.get("weight") as string;
  if (!weightRaw) return;

  const loggedAt = (formData.get("loggedAt") as string) || null;

  await createBodyWeightLog({ weight: Number(weightRaw), loggedAt });
  revalidatePath("/peso");
}
