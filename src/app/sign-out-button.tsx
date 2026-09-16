"use client";

import { LogOutIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSignOut}
      disabled={pending}
      className="w-full justify-start"
    >
      <LogOutIcon width={18} height={18} />
      {pending ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}
