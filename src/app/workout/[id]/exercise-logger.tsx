"use client";

import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Badge, cn, Input } from "@/components/ui";
import { IconSubmit, SubmitButton } from "@/components/ui/submit-button";
import type { Exercise } from "@/lib/data/exercises";
import type { WorkoutSet } from "@/lib/data/sets";
import { useEffect, useRef } from "react";
import { deleteSetAction, logSetAction } from "../actions";
import { useRestTimer } from "./timers";

export function ExerciseLogger({
  workoutId,
  workoutExerciseId,
  exercise,
  previousSets,
  currentSets,
  targetSets,
  targetReps,
  restSeconds,
}: {
  workoutId: string;
  workoutExerciseId: string;
  exercise: Exercise;
  previousSets: WorkoutSet[] | null;
  currentSets: WorkoutSet[];
  targetSets: number | null;
  targetReps: string | null;
  restSeconds: number;
}) {
  // Referencia para prellenar la serie nueva: la última serie de esta
  // sesión si ya hay alguna, si no la última de la sesión anterior.
  const reference =
    currentSets[currentSets.length - 1] ??
    (previousSets ? previousSets[previousSets.length - 1] : null);

  const rest = useRestTimer();
  const loggedCount = useRef(currentSets.length);

  // Al confirmar una serie, el descanso arranca solo: es el momento
  // exacto en que el usuario suelta el teléfono.
  useEffect(() => {
    if (currentSets.length > loggedCount.current) {
      const nextLabel = `${exercise.name} · ${reference?.weight ?? "—"} kg × ${
        reference?.reps ?? "—"
      }`;
      rest?.start(restSeconds, nextLabel);
    }
    loggedCount.current = currentSets.length;
  }, [currentSets.length, exercise.name, reference, rest, restSeconds]);

  const pending = targetSets ? Math.max(0, targetSets - currentSets.length) : 0;

  return (
    <section id={`ex-${workoutExerciseId}`} className="scroll-mt-20">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">
          {exercise.name}
        </h2>
        {targetSets && (
          <span className="shrink-0 text-[13px] tabular-nums text-muted">
            <span
              className={cn(
                "font-semibold",
                currentSets.length >= targetSets ? "text-accent" : "text-ink",
              )}
            >
              {currentSets.length}
            </span>
            /{targetSets}
          </span>
        )}
      </div>

      <p className="text-[13px] text-muted">
        {[
          exercise.muscle_group,
          targetSets && targetReps ? `${targetSets} × ${targetReps}` : null,
          restSeconds ? `${restSeconds} s` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {previousSets && previousSets.length > 0 && (
        <p className="mt-1 text-[13px] text-faint">
          Última vez:{" "}
          <span className="text-muted">
            {previousSets
              .map((s) => `${s.weight ?? "—"}×${s.reps ?? "—"}`)
              .join("  ")}
          </span>
        </p>
      )}

      {/* Series: las hechas con check en acento, las que faltan en hueco */}
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {currentSets.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <CheckIcon width={14} height={14} />
            </span>
            <span className="w-14 shrink-0 text-[13px] text-faint">
              Serie {s.set_number}
            </span>
            <span className="flex-1 text-[15px] font-semibold tabular-nums">
              {s.weight ?? "—"}
              <span className="ml-0.5 text-[13px] font-normal text-muted">kg</span>
              <span className="mx-1.5 text-faint">×</span>
              {s.reps ?? "—"}
            </span>
            {s.is_failure && <Badge tone="warning">fallo</Badge>}
            {s.note && (
              <span
                className="max-w-24 truncate text-[12px] text-faint"
                title={s.note}
              >
                {s.note}
              </span>
            )}
            <form action={deleteSetAction}>
              <input type="hidden" name="workoutId" value={workoutId} />
              <input type="hidden" name="setId" value={s.id} />
              <IconSubmit label={`Deshacer serie ${s.set_number}`}>
                <TrashIcon width={15} height={15} />
              </IconSubmit>
            </form>
          </li>
        ))}

        {Array.from({ length: pending }).map((_, i) => (
          <li
            key={`pending-${i}`}
            className="flex items-center gap-3 px-3 py-2.5 text-faint"
          >
            <span className="h-6 w-6 shrink-0 rounded-full border border-line" />
            <span className="w-14 shrink-0 text-[13px]">
              Serie {currentSets.length + i + 1}
            </span>
            <span className="flex-1 text-[15px] tabular-nums">—</span>
          </li>
        ))}

        {currentSets.length === 0 && pending === 0 && (
          <li className="px-3 py-2.5 text-[13px] text-faint">
            Sin series todavía.
          </li>
        )}
      </ul>

      {/* key: al confirmar una serie el form se remonta y los campos
          vuelven a tomar el valor de referencia actualizado */}
      <form key={currentSets.length} action={logSetAction} className="mt-3">
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

        <div className="grid grid-cols-2 gap-2">
          <label className="relative">
            <span className="absolute left-3 top-2 text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
              Kg
            </span>
            <Input
              type="number"
              name="weight"
              step="0.5"
              min="0"
              inputMode="decimal"
              defaultValue={reference?.weight ?? ""}
              aria-label="Peso en kilos"
              className="h-16 pt-5 text-center text-2xl font-bold tabular-nums"
            />
          </label>

          <label className="relative">
            <span className="absolute left-3 top-2 text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
              Reps
            </span>
            <Input
              type="number"
              name="reps"
              min="0"
              inputMode="numeric"
              defaultValue={reference?.reps ?? ""}
              placeholder={targetReps ?? ""}
              aria-label="Repeticiones"
              className="h-16 pt-5 text-center text-2xl font-bold tabular-nums"
            />
          </label>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="checkbox" name="isFailure" className="peer sr-only" />
            <span className="inline-flex h-9 items-center rounded-xl border border-line px-3 text-[13px] font-medium text-muted transition-colors peer-checked:border-warning/40 peer-checked:bg-warning/15 peer-checked:text-warning peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              Fallo
            </span>
          </label>

          <details className="min-w-0 flex-1">
            <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-xl border border-line px-3 text-[13px] font-medium text-muted transition-colors hover:text-ink">
              Nota
            </summary>
            <Input
              type="text"
              name="note"
              maxLength={120}
              placeholder="Ej. mejor técnica, subir peso"
              className="mt-2"
            />
          </details>
        </div>

        <SubmitButton
          size="lg"
          className="mt-2 w-full"
          pendingLabel="Guardando…"
        >
          <PlusIcon width={18} height={18} />
          Agregar serie
        </SubmitButton>
      </form>
    </section>
  );
}
