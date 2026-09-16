"use server";

import { updateProfile, UsernameTakenError } from "@/lib/data/profiles";
import { revalidatePath } from "next/cache";

export type ProfileFormState = { ok?: boolean; error?: string } | null;

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const displayName = (formData.get("displayName") as string)?.trim() || null;
  const unitPref = formData.get("unitPref") === "lb" ? "lb" : "kg";

  const rawUsername = (formData.get("username") as string)?.trim().toLowerCase();
  const username = rawUsername || null;

  if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
    return {
      error: "El username va entre 3 y 20 caracteres: letras, números o _",
    };
  }

  try {
    await updateProfile({ displayName, username, unitPref });
  } catch (error) {
    if (error instanceof UsernameTakenError) return { error: error.message };
    throw error;
  }

  revalidatePath("/perfil");
  revalidatePath("/");
  return { ok: true };
}
