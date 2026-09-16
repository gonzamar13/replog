"use server";

import { updateProfile } from "@/lib/data/profiles";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const displayName = (formData.get("displayName") as string)?.trim() || null;
  const unitPref = formData.get("unitPref") === "lb" ? "lb" : "kg";

  await updateProfile({ displayName, unitPref });
  revalidatePath("/perfil");
  revalidatePath("/");
}
