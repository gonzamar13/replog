"use client";

import { Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "./actions";

export function ProfileForm({
  displayName,
  username,
  unitPref,
}: {
  displayName: string;
  username: string;
  unitPref: "kg" | "lb";
}) {
  const [state, action] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <Field label="Nombre">
        <Input
          type="text"
          name="displayName"
          defaultValue={displayName}
          placeholder="Cómo querés que te salude la app"
        />
      </Field>

      <Field label="Username">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">
            @
          </span>
          <Input
            type="text"
            name="username"
            defaultValue={username}
            placeholder="marcos"
            pattern="[a-zA-Z0-9_]{3,20}"
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="pl-7"
          />
        </div>
      </Field>

      <Field label="Unidad de peso">
        <Select name="unitPref" defaultValue={unitPref}>
          <option value="kg">Kilogramos (kg)</option>
          <option value="lb">Libras (lb)</option>
        </Select>
      </Field>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p
          role="status"
          className="animate-pop rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-[13px] text-accent"
        >
          Cambios guardados.
        </p>
      )}

      <SubmitButton className="w-full" pendingLabel="Guardando…">
        Guardar cambios
      </SubmitButton>
    </form>
  );
}
