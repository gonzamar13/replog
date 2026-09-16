"use client";

import { TimerIcon, XIcon } from "@/components/icons";
import { cn } from "@/components/ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

function mmss(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ── Descanso ───────────────────────────────────────────────────
   Vive en un contexto para que la barra sea una sola, fija abajo y
   siempre visible, en vez de un contador perdido dentro de la
   tarjeta del ejercicio (que se va con el scroll).                */

type RestState = {
  remaining: number;
  total: number;
  label: string;
  running: boolean;
};

const RestTimerContext = createContext<{
  start: (seconds: number, label: string) => void;
  state: RestState | null;
  setState: (s: RestState | null) => void;
} | null>(null);

export function useRestTimer() {
  return useContext(RestTimerContext);
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RestState | null>(null);

  const start = useCallback((seconds: number, label: string) => {
    if (seconds <= 0) return;
    setState({ remaining: seconds, total: seconds, label, running: true });
  }, []);

  useEffect(() => {
    if (!state?.running || state.remaining <= 0) return;
    const id = setTimeout(
      () => setState((s) => (s ? { ...s, remaining: s.remaining - 1 } : s)),
      1000,
    );
    return () => clearTimeout(id);
  }, [state]);

  // Feedback no visual al terminar el descanso: el teléfono puede
  // estar en el bolsillo entre series.
  useEffect(() => {
    if (state && state.remaining === 0) {
      navigator.vibrate?.(180);
      const id = setTimeout(() => setState(null), 5000);
      return () => clearTimeout(id);
    }
  }, [state]);

  return (
    <RestTimerContext.Provider value={{ start, state, setState }}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function RestTimerBar() {
  const ctx = useRestTimer();
  if (!ctx?.state) return null;

  const { state, setState } = ctx;
  const done = state.remaining === 0;
  const progress = done ? 0 : (state.remaining / state.total) * 100;

  return (
    <div className="animate-pop mb-2 overflow-hidden rounded-2xl border border-line bg-elevated">
      <div className="flex items-center gap-3 px-4 py-3">
        <TimerIcon
          className={cn("shrink-0", done ? "text-accent" : "text-muted")}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
            {done ? "Descanso terminado" : "Descanso"}
          </p>
          <p className="truncate text-[13px] text-muted">
            Siguiente: {state.label}
          </p>
        </div>

        <p
          className={cn(
            "text-2xl font-bold tabular-nums tracking-tight",
            done ? "animate-pulse-soft text-accent" : "text-ink",
          )}
        >
          {mmss(state.remaining)}
        </p>

        {!done && (
          <button
            type="button"
            onClick={() => setState({ ...state, running: !state.running })}
            className="rounded-lg px-2 py-1 text-[13px] font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            {state.running ? "Pausar" : "Seguir"}
          </button>
        )}

        <button
          type="button"
          onClick={() => setState(null)}
          aria-label="Saltar descanso"
          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface hover:text-ink"
        >
          <XIcon width={18} height={18} />
        </button>
      </div>

      <div
        className="h-0.5 bg-accent transition-[width] duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ── Duración del entrenamiento ─────────────────────────────────
   El reloj es un sistema externo: se suscribe con useSyncExternalStore
   y el snapshot de servidor es null, así no hay desfasaje de
   hidratación entre el reloj del servidor y el del teléfono.      */
function subscribeToClock(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

export function ElapsedTime({ startedAt }: { startedAt: string }) {
  const now = useSyncExternalStore(
    subscribeToClock,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );

  if (now === null) return <span className="tabular-nums">--:--</span>;

  const seconds = Math.max(
    0,
    Math.floor((now - new Date(startedAt).getTime()) / 1000),
  );
  const hours = Math.floor(seconds / 3600);
  const rest = seconds % 3600;

  return (
    <span className="tabular-nums">
      {hours > 0 ? `${hours}:${mmss(rest)}` : mmss(rest)}
    </span>
  );
}
