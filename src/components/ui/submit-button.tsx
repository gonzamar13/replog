"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { Button, cn } from "@/components/ui";

// Feedback de "guardando…" en cualquier form con Server Action.
// Es la única microinteracción global: comunica estado, no decora.
export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(pending && "opacity-70", className)}
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

// Variante compacta para acciones secundarias en línea (deshacer, ↑↓, quitar).
export function IconSubmit({
  children,
  label,
  className,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      disabled={pending || props.disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors",
        "hover:bg-elevated hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
