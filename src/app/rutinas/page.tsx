import { ChevronRightIcon, PlusIcon, RoutinesIcon } from "@/components/icons";
import {
  Badge,
  EmptyState,
  Field,
  Input,
  MetaLine,
  Page,
  PageHeader,
  Panel,
  SectionTitle,
  Select,
} from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { formatDays } from "@/lib/days";
import {
  getRoutineStats,
  listRoutinesGroupedByProgram,
  type Routine,
} from "@/lib/data/routines";
import Link from "next/link";
import { createRoutineAction, createRoutineGroupAction } from "./actions";

type Stats = Map<string, { exerciseCount: number; avgMinutes: number | null }>;

function RoutineRow({ routine, stats }: { routine: Routine; stats: Stats }) {
  const stat = stats.get(routine.id);

  return (
    <li>
      <Link
        href={`/rutinas/${routine.id}`}
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-muted/40"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{routine.name}</p>
          <MetaLine
            className="mt-0.5"
            items={[
              stat?.exerciseCount
                ? `${stat.exerciseCount} ${stat.exerciseCount === 1 ? "ejercicio" : "ejercicios"}`
                : "Sin ejercicios",
              stat?.avgMinutes ? `${stat.avgMinutes} min` : null,
              formatDays(routine.days),
            ]}
          />
        </div>
        <ChevronRightIcon className="shrink-0 text-faint" />
      </Link>
    </li>
  );
}

export default async function RutinasPage() {
  await requireUser();
  const [{ groups, ungrouped }, stats] = await Promise.all([
    listRoutinesGroupedByProgram(),
    getRoutineStats(),
  ]);

  const isEmpty = groups.length === 0 && ungrouped.length === 0;

  return (
    <Page>
      <PageHeader
        title="Rutinas"
        subtitle="Tus plantillas de entrenamiento, agrupadas por programa."
      />

      {isEmpty && (
        <EmptyState
          icon={<RoutinesIcon width={28} height={28} />}
          title="Todavía no tenés rutinas"
          description="Creá una con el formulario de abajo y agregale ejercicios."
        />
      )}

      <div className="space-y-7">
        {groups.map(({ group, routines }) => (
          <section key={group.id}>
            <SectionTitle
              action={
                group.starts_on ? (
                  <Badge tone="accent">
                    desde{" "}
                    {new Date(`${group.starts_on}T00:00:00`).toLocaleDateString(
                      "es-AR",
                      { day: "numeric", month: "short" },
                    )}
                  </Badge>
                ) : undefined
              }
            >
              {group.name}
            </SectionTitle>

            {routines.length > 0 ? (
              <ul className="space-y-2">
                {routines.map((routine) => (
                  <RoutineRow key={routine.id} routine={routine} stats={stats} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-[13px] text-faint">
                Este programa todavía no tiene rutinas.
              </p>
            )}
          </section>
        ))}

        {ungrouped.length > 0 && (
          <section>
            <SectionTitle>Sin programa</SectionTitle>
            <ul className="space-y-2">
              {ungrouped.map((routine) => (
                <RoutineRow key={routine.id} routine={routine} stats={stats} />
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Crear */}
      <Panel className="mt-8 border-dashed bg-transparent">
        <form action={createRoutineAction} className="space-y-3">
          <Field label="Nueva rutina">
            <Input
              type="text"
              name="name"
              required
              placeholder="Ej. Pecho + Tríceps"
            />
          </Field>

          {groups.length > 0 && (
            <Field label="Programa">
              <Select name="groupId" defaultValue="">
                <option value="">Sin programa</option>
                {groups.map(({ group }) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <SubmitButton className="w-full" pendingLabel="Creando…">
            <PlusIcon width={16} height={16} />
            Crear rutina
          </SubmitButton>
        </form>
      </Panel>

      <details className="mt-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted transition-colors hover:text-ink">
          + Crear un programa
        </summary>
        <form action={createRoutineGroupAction} className="mt-3 space-y-3">
          <Field label="Nombre">
            <Input
              type="text"
              name="name"
              required
              placeholder="Ej. Trimestre 1 2026"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Desde">
              <Input type="date" name="startsOn" />
            </Field>
            <Field label="Hasta">
              <Input type="date" name="endsOn" />
            </Field>
          </div>
          <SubmitButton
            variant="secondary"
            className="w-full"
            pendingLabel="Creando…"
          >
            Crear programa
          </SubmitButton>
        </form>
      </details>
    </Page>
  );
}
