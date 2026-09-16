import { ChevronRightIcon, PlusIcon, RoutinesIcon } from "@/components/icons";
import {
  Badge,
  cn,
  EmptyState,
  Field,
  Input,
  MetaLine,
  Page,
  PageHeader,
  Panel,
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
import { pickCurrentGroup } from "@/lib/programs";
import Link from "next/link";
import { createRoutineAction, createRoutineGroupAction } from "./actions";

type Stats = Awaited<ReturnType<typeof getRoutineStats>>;

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

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
              stat?.typicalMinutes ? `~${stat.typicalMinutes} min` : null,
              formatDays(routine.days),
            ]}
          />
        </div>
        <ChevronRightIcon className="shrink-0 text-faint" />
      </Link>
    </li>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-line text-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{ programa?: string }>;
}) {
  await requireUser();
  const { programa } = await searchParams;

  const [{ groups, ungrouped }, stats] = await Promise.all([
    listRoutinesGroupedByProgram(),
    getRoutineStats(),
  ]);

  const programs = groups.map((g) => g.group);
  // Sin selección explícita se abre en el programa vigente por fechas.
  const current = pickCurrentGroup(programs);
  const selected = programa ?? current?.id ?? "todas";

  const selectedProgram = programs.find((p) => p.id === selected) ?? null;

  const visible: Routine[] =
    selected === "todas"
      ? [...groups.flatMap((g) => g.routines), ...ungrouped]
      : selected === "sin"
        ? ungrouped
        : (groups.find((g) => g.group.id === selected)?.routines ?? []);

  const hasAnything = programs.length > 0 || ungrouped.length > 0;

  return (
    <Page>
      <PageHeader title="Rutinas" />

      {/* Selector de programa: el vigente arranca elegido, los viejos
          quedan a un toque sin estorbar el camino diario */}
      {programs.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {programs.map((program) => (
            <FilterChip
              key={program.id}
              href={`/rutinas?programa=${program.id}`}
              active={selected === program.id}
            >
              {program.name}
              {current?.id === program.id && (
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  vigente
                </span>
              )}
            </FilterChip>
          ))}
          {ungrouped.length > 0 && (
            <FilterChip href="/rutinas?programa=sin" active={selected === "sin"}>
              Sin programa
            </FilterChip>
          )}
          <FilterChip href="/rutinas?programa=todas" active={selected === "todas"}>
            Todas
          </FilterChip>
        </div>
      )}

      {selectedProgram && (selectedProgram.starts_on || selectedProgram.ends_on) && (
        <p className="mb-4 text-[13px] text-faint">
          {selectedProgram.starts_on
            ? `Desde ${shortDate(selectedProgram.starts_on)}`
            : "Sin fecha de inicio"}
          {selectedProgram.ends_on
            ? ` hasta ${shortDate(selectedProgram.ends_on)}`
            : ""}
        </p>
      )}

      {!hasAnything && (
        <EmptyState
          icon={<RoutinesIcon width={28} height={28} />}
          title="Todavía no tenés rutinas"
          description="Creá una con el formulario de abajo y agregale ejercicios."
        />
      )}

      {hasAnything && visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          {selected === "sin"
            ? "Todas tus rutinas están dentro de un programa."
            : "Este programa todavía no tiene rutinas."}
        </p>
      )}

      {visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((routine) => (
            <RoutineRow key={routine.id} routine={routine} stats={stats} />
          ))}
        </ul>
      )}

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

          {programs.length > 0 && (
            <Field label="Programa">
              <Select
                name="groupId"
                defaultValue={selectedProgram?.id ?? ""}
              >
                <option value="">Sin programa</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
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
          <p className="text-[12px] text-faint">
            Con fechas, el programa se selecciona solo mientras esté vigente.
          </p>
          <SubmitButton
            variant="secondary"
            className="w-full"
            pendingLabel="Creando…"
          >
            Crear programa
          </SubmitButton>
        </form>
      </details>

      {programs.length > 0 && (
        <p className="mt-3 text-center">
          <Badge tone="neutral">
            {visible.length}{" "}
            {visible.length === 1 ? "rutina" : "rutinas"} en esta vista
          </Badge>
        </p>
      )}
    </Page>
  );
}
