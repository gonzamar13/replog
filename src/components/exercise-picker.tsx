"use client";

import { ChevronRightIcon, PlusIcon, XIcon } from "@/components/icons";
import { Badge, cn, Field, Input } from "@/components/ui";
import type { Exercise } from "@/lib/data/exercises";
import { useState } from "react";
import { useFormStatus } from "react-dom";

// "triceps" tiene que encontrar "Extensión de tríceps en polea".
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Objetivo por defecto al sumar el ejercicio a una rutina. Va plegado:
 *  si los valores sirven, no se abre nunca y agregar es un solo toque. */
function TargetFields() {
  const [sets, setSets] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("10");
  const [rest, setRest] = useState("90");

  return (
    <details className="rounded-xl border border-line bg-surface px-3 py-2">
      <summary className="cursor-pointer list-none text-[13px] text-muted">
        Objetivo:{" "}
        <span className="font-semibold tabular-nums text-ink">
          {sets || "?"} × {repsMin || "?"}
          {repsMax && repsMax !== repsMin ? `–${repsMax}` : ""}
        </span>{" "}
        · {rest || "0"} s
      </summary>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Series">
          <Input
            type="number"
            name="targetSets"
            min={1}
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
        </Field>
        <Field label="Reps min">
          <Input
            type="number"
            name="targetRepsMin"
            min={1}
            value={repsMin}
            onChange={(e) => setRepsMin(e.target.value)}
          />
        </Field>
        <Field label="Reps max">
          <Input
            type="number"
            name="targetRepsMax"
            min={1}
            value={repsMax}
            onChange={(e) => setRepsMax(e.target.value)}
          />
        </Field>
        <Field label="Descanso">
          <Input
            type="number"
            name="targetRestSeconds"
            min={0}
            step={15}
            value={rest}
            onChange={(e) => setRest(e.target.value)}
          />
        </Field>
      </div>
    </details>
  );
}

function ResultList({
  groups,
  query,
  submitName,
  mode,
}: {
  groups: Map<string, Exercise[]>;
  query: string;
  submitName: string;
  mode: "add" | "select";
}) {
  const { pending } = useFormStatus();
  const total = [...groups.values()].reduce((sum, list) => sum + list.length, 0);

  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[13px] text-muted">
        Sin resultados para «{query}»
      </p>
    );
  }

  return (
    <div
      className={cn(
        "max-h-72 overflow-y-auto rounded-xl border border-line bg-surface",
        pending && "pointer-events-none opacity-50",
      )}
    >
      {[...groups.entries()].map(([muscleGroup, items]) => (
        <div key={muscleGroup}>
          <p className="sticky top-0 z-10 bg-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
            {muscleGroup}
          </p>
          <ul className="divide-y divide-line">
            {items.map((exercise) => (
              <li key={exercise.id}>
                {/* El propio ítem envía el form: un toque = agregado */}
                <button
                  type="submit"
                  name={submitName}
                  value={exercise.id}
                  disabled={pending}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-elevated"
                >
                  {mode === "add" ? (
                    <PlusIcon
                      width={15}
                      height={15}
                      className="shrink-0 text-faint"
                    />
                  ) : null}
                  <span className="flex-1 truncate">{exercise.name}</span>
                  {exercise.is_custom && <Badge tone="accent">tuyo</Badge>}
                  {mode === "select" ? (
                    <ChevronRightIcon
                      width={15}
                      height={15}
                      className="shrink-0 text-faint"
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ExercisePicker({
  exercises,
  action,
  method,
  hiddenFields = {},
  withTarget = false,
  submitName = "exerciseId",
  mode = "add",
}: {
  exercises: Exercise[];
  /** Server Action para agregar. En modo "select" se omite y el form
   *  navega por GET con el id del ejercicio en la query. */
  action?: (formData: FormData) => void | Promise<void>;
  method?: "get";
  hiddenFields?: Record<string, string>;
  withTarget?: boolean;
  submitName?: string;
  mode?: "add" | "select";
}) {
  const [query, setQuery] = useState("");

  const needle = normalize(query.trim());
  const filtered = needle
    ? exercises.filter((e) =>
        normalize(`${e.name} ${e.muscle_group ?? ""}`).includes(needle),
      )
    : exercises;

  const groups = new Map<string, Exercise[]>();
  for (const exercise of filtered) {
    const key = exercise.muscle_group ?? "Otros";
    const list = groups.get(key);
    if (list) list.push(exercise);
    else groups.set(key, [exercise]);
  }

  return (
    <form action={action} method={method} className="space-y-3">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {withTarget && <TargetFields />}

      <div className="relative">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio o músculo…"
          aria-label="Buscar ejercicio"
          autoCapitalize="none"
          autoCorrect="off"
          className={cn(query && "pr-10")}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-faint transition-colors hover:text-ink"
          >
            <XIcon width={16} height={16} />
          </button>
        )}
      </div>

      <ResultList
        groups={groups}
        query={query.trim()}
        submitName={submitName}
        mode={mode}
      />
    </form>
  );
}
