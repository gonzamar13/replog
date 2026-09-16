import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ── Botones ────────────────────────────────────────────────── */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-canvas hover:bg-accent-pressed",
  secondary: "border border-line bg-elevated text-ink hover:border-muted/40",
  ghost: "text-muted hover:text-ink hover:bg-elevated",
  danger: "border border-line text-danger hover:bg-danger/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3 text-[13px]",
  md: "h-11 gap-2 px-4 text-sm",
  lg: "h-14 gap-2.5 px-5 text-base",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex select-none items-center justify-center rounded-xl font-semibold transition-colors",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button {...props} className={buttonClass({ variant, size, className })} />
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass({ variant, size, className })} />;
}

/* ── Superficies y estructura ───────────────────────────────── */

export function Page({
  children,
  className,
  wide,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 pt-6 pb-28 lg:px-8 lg:pt-10 lg:pb-14",
        wide ? "max-w-5xl" : "max-w-xl",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-block text-[13px] text-faint transition-colors hover:text-muted"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Panel({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <As className={cn("rounded-2xl border border-line bg-surface p-4", className)}>
      {children}
    </As>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mb-3 text-faint">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Datos ───────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.1em] text-faint">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums tracking-tight",
          accent ? "text-accent" : "text-ink",
        )}
      >
        {value}
        {unit && (
          <span className="ml-1 text-sm font-medium text-muted">{unit}</span>
        )}
      </p>
    </div>
  );
}

type Tone = "accent" | "neutral" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  accent: "bg-accent/15 text-accent",
  neutral: "bg-elevated text-muted",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* Metadatos secundarios separados por · — "Pecho · Compuesto · 90 s" */
export function MetaLine({
  items,
  className,
}: {
  items: (string | null | undefined | false)[];
  className?: string;
}) {
  const visible = items.filter(Boolean) as string[];
  if (visible.length === 0) return null;
  return (
    <p className={cn("text-[13px] text-muted", className)}>
      {visible.join(" · ")}
    </p>
  );
}

/* ── Formularios ─────────────────────────────────────────────── */

export const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent/50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(fieldClass, className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(fieldClass, "appearance-none pr-8", className)}
    />
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
