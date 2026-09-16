"use client";

import {
  HistoryIcon,
  HomeIcon,
  ProgressIcon,
  RoutinesIcon,
  UserIcon,
} from "@/components/icons";
import { cn } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", Icon: HomeIcon, match: (p: string) => p === "/" },
  {
    href: "/rutinas",
    label: "Rutinas",
    Icon: RoutinesIcon,
    match: (p: string) => p.startsWith("/rutinas"),
  },
  {
    href: "/historial",
    label: "Historial",
    Icon: HistoryIcon,
    match: (p: string) => p.startsWith("/historial"),
  },
  {
    href: "/progreso",
    label: "Progreso",
    Icon: ProgressIcon,
    match: (p: string) => p.startsWith("/progreso") || p.startsWith("/records"),
  },
  {
    href: "/perfil",
    label: "Perfil",
    Icon: UserIcon,
    match: (p: string) =>
      p.startsWith("/perfil") || p.startsWith("/peso") || p.startsWith("/ejercicios"),
  },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight", className)}>
      REP<span className="text-accent">LOG</span>
    </span>
  );
}

export function AppNav() {
  const pathname = usePathname();

  // Durante un entrenamiento activo la navegación desaparece: esa
  // pantalla tiene una sola tarea y nada debe competir con ella.
  if (
    pathname.startsWith("/workout/") ||
    pathname === "/login" ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <>
      {/* Mobile: tab bar inferior, dentro del alcance del pulgar */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          {ITEMS.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                    active ? "text-accent" : "text-faint hover:text-muted",
                  )}
                >
                  <Icon width={22} height={22} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: rail lateral, la app no se estira, se reacomoda */}
      <nav
        aria-label="Navegación principal"
        className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-surface px-3 py-6 lg:flex"
      >
        <Logo className="mb-8 px-3 text-lg" />
        <ul className="flex flex-col gap-1">
          {ITEMS.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-elevated hover:text-ink",
                  )}
                >
                  <Icon width={20} height={20} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
