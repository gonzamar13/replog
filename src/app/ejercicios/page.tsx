import { PlusIcon } from "@/components/icons";
import {
  Badge,
  Field,
  Input,
  Page,
  PageHeader,
  Panel,
  SectionTitle,
} from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/data/exercises";
import Link from "next/link";
import { createExerciseAction } from "./actions";

export default async function EjerciciosPage() {
  await requireUser();
  const exercises = await listExercises();

  const groups = new Map<string, typeof exercises>();
  for (const exercise of exercises) {
    const key = exercise.muscle_group ?? "Otros";
    const list = groups.get(key) ?? [];
    list.push(exercise);
    groups.set(key, list);
  }

  const customCount = exercises.filter((e) => e.is_custom).length;

  return (
    <Page>
      <PageHeader
        title="Ejercicios"
        back={{ href: "/perfil", label: "Perfil" }}
        subtitle={`${exercises.length} disponibles${
          customCount ? ` · ${customCount} tuyos` : ""
        }`}
      />

      <Panel className="mb-8 border-dashed bg-transparent">
        <form action={createExerciseAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <Input
                type="text"
                name="name"
                required
                placeholder="Ej. Press Arnold"
              />
            </Field>
            <Field label="Grupo muscular">
              <Input
                type="text"
                name="muscleGroup"
                placeholder="Opcional — ej. Hombros"
                list="muscle-groups"
              />
              <datalist id="muscle-groups">
                {[...groups.keys()].map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </Field>
          </div>
          <SubmitButton
            variant="secondary"
            className="w-full"
            pendingLabel="Creando…"
          >
            <PlusIcon width={16} height={16} />
            Crear ejercicio
          </SubmitButton>
        </form>
      </Panel>

      <div className="space-y-6">
        {[...groups.entries()].map(([muscleGroup, items]) => (
          <section key={muscleGroup}>
            <SectionTitle>{muscleGroup}</SectionTitle>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {items.map((exercise) => (
                <li key={exercise.id}>
                  <Link
                    href={`/progreso?exercise=${exercise.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-elevated"
                  >
                    <span className="flex-1 truncate text-sm">
                      {exercise.name}
                    </span>
                    {exercise.is_custom && <Badge tone="accent">tuyo</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Page>
  );
}
