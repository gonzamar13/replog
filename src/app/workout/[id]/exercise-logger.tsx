"use client";

import { CheckIcon, TrashIcon } from "@/components/icons";
import { Badge, cn } from "@/components/ui";
import { IconSubmit } from "@/components/ui/submit-button";
import type { Exercise } from "@/lib/data/exercises";
import type { WorkoutSet } from "@/lib/data/sets";
import { useEffect, useRef } from "react";
import { deleteSetAction } from "../actions";
import { SetInput } from "./set-input";
import { useRestTimer } from "./timers";

function SetRow({
  set,
  workoutId,
}: {
  set: WorkoutSet;
  workoutId: string;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <CheckIcon width={14} height={14} />
      </span>
      <span className="w-6 shrink-0 text-[13px] tabular-nums text-faint">
        {set.set_number}
      </span>
      <span className="flex-1 text-[15px] font-semibold tabular-nums">
        {set.weight ?? "—"}
        <span className="ml-0.5 text-[13px] font-normal text-muted">kg</span>
        <span className="mx-1.5 text-faint">×</span>
        {set.reps ?? "—"}
      </span>

      {set.rir === 0 ? (
        <Badge tone="warning">fallo</Badge>
      ) : set.rir != null ? (
        <Badge tone="neutral">RIR {set.rir}</Badge>
      ) : set.is_failure ? (
        <Badge tone="warning">fallo</Badge>
      ) : null}

      {set.note && (
        <span
          className="max-w-20 truncate text-[12px] text-faint"
          title={set.note}
        >
          {set.note}
        </span>
      )}

      <form action={deleteSetAction}>
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="setId" value={set.id} />
        <IconSubmit label={`Deshacer serie ${set.set_number}`}>
          <TrashIcon width={15} height={15} />
        </IconSubmit>
      </form>
    </li>
  );
}

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
  const done = targetSets != null && currentSets.length >= targetSets;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="truncate text-lg font-bold tracking-tight">
            {exercise.name}
          </h2>
          {targetSets && (
            <span className="shrink-0 text-[13px] tabular-nums text-muted">
              <span
                className={cn("font-semibold", done ? "text-accent" : "text-ink")}
              >
                {currentSets.length}
              </span>
              /{targetSets}
            </span>
          )}
        </div>

        <p className="mt-0.5 text-[13px] text-muted">
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
      </header>

      {/* Las series scrollean solas si son muchas: el control de abajo
          nunca se va de la zona del pulgar. */}
      <ul className="my-3 min-h-0 flex-1 divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-surface">
        {currentSets.map((set) => (
          <SetRow key={set.id} set={set} workoutId={workoutId} />
        ))}

        {Array.from({ length: pending }).map((_, i) => (
          <li
            key={`pending-${i}`}
            className="flex items-center gap-3 px-3 py-2.5 text-faint"
          >
            <span className="h-6 w-6 shrink-0 rounded-full border border-line" />
            <span className="w-6 shrink-0 text-[13px] tabular-nums">
              {currentSets.length + i + 1}
            </span>
            <span className="flex-1 text-[15px] tabular-nums">—</span>
          </li>
        ))}

        {currentSets.length === 0 && pending === 0 && (
          <li className="px-3 py-3 text-[13px] text-faint">
            Sin series todavía.
          </li>
        )}
      </ul>

      {/* key: al confirmar una serie el control se remonta y vuelve a
          tomar el valor de referencia actualizado */}
      <div className="shrink-0">
        <SetInput
          key={currentSets.length}
          workoutId={workoutId}
          workoutExerciseId={workoutExerciseId}
          defaultWeight={reference?.weight != null ? String(reference.weight) : ""}
          defaultReps={reference?.reps != null ? String(reference.reps) : ""}
          targetReps={targetReps}
        />
      </div>
    </div>
  );
}
