"use client";

import { CheckIcon, XIcon } from "@/components/icons";
import { cn } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { useState } from "react";
import { logSetAction } from "../actions";

const WEIGHT_STEP = 0.5;
const RIR_OPTIONS = [0, 1, 2, 3, 4, 5];

// 45.5 + 0.5 en punto flotante da 46.00000000000001 si no se redondea.
function round(value: number) {
  return Math.round(value * 100) / 100;
}

type Editing = "weight" | "reps" | null;

function Stepper({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 flex-1 rounded-xl border border-line bg-elevated text-[15px] font-semibold text-muted transition-colors active:scale-[0.97] active:bg-surface"
    >
      {label}
    </button>
  );
}

function Numpad({
  editing,
  value,
  unit,
  onPress,
  onClose,
}: {
  editing: Exclude<Editing, null>;
  value: string;
  unit: string;
  onPress: (key: string) => void;
  onClose: () => void;
}) {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar teclado"
        onClick={onClose}
        className="fixed inset-0 z-[45] bg-canvas/70"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-elevated px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-[0.1em] text-faint">
              {editing === "weight" ? "Peso" : "Repeticiones"}
            </span>
            <span className="text-3xl font-bold tabular-nums">
              {value || "0"}
              <span className="ml-1 text-sm font-medium text-muted">{unit}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onPress(key)}
                className="h-14 rounded-xl border border-line bg-surface text-xl font-semibold tabular-nums transition-colors active:scale-[0.97] active:bg-elevated"
              >
                {key}
              </button>
            ))}

            <button
              type="button"
              onClick={() => onPress(".")}
              disabled={editing !== "weight"}
              className="h-14 rounded-xl border border-line bg-surface text-xl font-semibold transition-colors active:bg-elevated disabled:opacity-30"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => onPress("0")}
              className="h-14 rounded-xl border border-line bg-surface text-xl font-semibold tabular-nums transition-colors active:scale-[0.97] active:bg-elevated"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => onPress("del")}
              aria-label="Borrar"
              className="flex h-14 items-center justify-center rounded-xl border border-line bg-surface text-muted transition-colors active:bg-elevated"
            >
              <XIcon width={20} height={20} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 h-12 w-full rounded-xl bg-accent text-sm font-semibold text-canvas transition-colors active:bg-accent-pressed"
          >
            Listo
          </button>
        </div>
      </div>
    </>
  );
}

export function SetInput({
  workoutId,
  workoutExerciseId,
  defaultWeight,
  defaultReps,
  targetReps,
}: {
  workoutId: string;
  workoutExerciseId: string;
  defaultWeight: string;
  defaultReps: string;
  targetReps: string | null;
}) {
  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [rir, setRir] = useState<number | null>(null);
  const [editing, setEditing] = useState<Editing>(null);

  function bump(kind: "weight" | "reps", delta: number) {
    if (kind === "weight") {
      setWeight(String(Math.max(0, round((parseFloat(weight) || 0) + delta))));
    } else {
      setReps(String(Math.max(0, (parseInt(reps, 10) || 0) + delta)));
    }
  }

  function press(key: string) {
    if (!editing) return;
    const current = editing === "weight" ? weight : reps;

    let next: string;
    if (key === "del") {
      next = current.slice(0, -1);
    } else if (key === ".") {
      if (current.includes(".")) return;
      next = (current || "0") + ".";
    } else {
      next = current === "0" ? key : current + key;
    }

    if (next.length > 6) return;
    if (editing === "weight") setWeight(next);
    else setReps(next);
  }

  return (
    <form action={logSetAction} className="space-y-2">
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />
      <input type="hidden" name="weight" value={weight} />
      <input type="hidden" name="reps" value={reps} />
      <input type="hidden" name="rir" value={rir ?? ""} />

      {/* Números grandes: tocarlos abre el teclado propio, nunca el del
          sistema, que tapa media pantalla y necesita cerrarse a mano. */}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { kind: "weight" as const, value: weight, unit: "kg", step: WEIGHT_STEP },
            { kind: "reps" as const, value: reps, unit: "reps", step: 1 },
          ]
        ).map(({ kind, value, unit, step }) => (
          <div key={kind}>
            <button
              type="button"
              onClick={() => setEditing(kind)}
              aria-label={`Editar ${kind === "weight" ? "peso" : "repeticiones"}`}
              className="flex h-16 w-full items-baseline justify-center gap-1 rounded-xl border border-line bg-elevated transition-colors active:bg-surface"
            >
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {value || "—"}
              </span>
              <span className="text-[13px] font-medium text-muted">{unit}</span>
            </button>

            <div className="mt-2 flex gap-2">
              <Stepper label={`−${step}`} onClick={() => bump(kind, -step)} />
              <Stepper label={`+${step}`} onClick={() => bump(kind, step)} />
            </div>
          </div>
        ))}
      </div>

      {/* RIR: opcional, un toque. Tocar de nuevo lo saca. */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-faint">
          RIR
        </span>
        {RIR_OPTIONS.map((option) => {
          const active = rir === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setRir(active ? null : option)}
              aria-pressed={active}
              className={cn(
                "h-9 flex-1 rounded-lg border text-[13px] font-semibold tabular-nums transition-colors",
                active
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-line text-muted active:bg-elevated",
                option === 0 && active && "border-warning/40 bg-warning/15 text-warning",
              )}
            >
              {option === 5 ? "5+" : option}
            </button>
          );
        })}
      </div>

      <SubmitButton size="lg" className="w-full" pendingLabel="Guardando…">
        <CheckIcon width={18} height={18} />
        Registrar serie
        {targetReps && !reps && (
          <span className="text-canvas/60"> · objetivo {targetReps}</span>
        )}
      </SubmitButton>

      {editing && (
        <Numpad
          editing={editing}
          value={editing === "weight" ? weight : reps}
          unit={editing === "weight" ? "kg" : "reps"}
          onPress={press}
          onClose={() => setEditing(null)}
        />
      )}
    </form>
  );
}
