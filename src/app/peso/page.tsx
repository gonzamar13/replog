import { ScaleIcon } from "@/components/icons";
import {
  Badge,
  EmptyState,
  Field,
  Input,
  Page,
  PageHeader,
  Panel,
  SectionTitle,
  StatTile,
} from "@/components/ui";
import { LineChart } from "@/components/ui/chart";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { listBodyWeightLogs } from "@/lib/data/body-weight";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createBodyWeightLogAction } from "./actions";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default async function PesoPage() {
  await requireUser();
  const [logs, profile] = await Promise.all([
    listBodyWeightLogs(),
    getCurrentProfile(),
  ]);

  const unit = profile?.unit_pref ?? "kg";
  const today = new Date().toISOString().slice(0, 10);

  const latest = logs[0] ?? null;
  const previous = logs[1] ?? null;
  const delta =
    latest && previous
      ? Math.round((latest.weight - previous.weight) * 10) / 10
      : null;

  // El gráfico va del más viejo al más nuevo; la lista al revés.
  const chartPoints = [...logs]
    .slice(0, 20)
    .reverse()
    .map((log) => ({ label: formatDate(log.logged_at), value: log.weight }));

  return (
    <Page>
      <PageHeader
        title="Peso corporal"
        back={{ href: "/perfil", label: "Perfil" }}
      />

      <Panel className="mb-6 border-dashed bg-transparent">
        <form action={createBodyWeightLogAction} className="flex items-end gap-2">
          <Field label={`Peso (${unit})`} className="flex-1">
            <Input
              type="number"
              name="weight"
              step="0.1"
              min="0"
              required
              inputMode="decimal"
              placeholder={latest ? String(latest.weight) : "0.0"}
              className="text-lg font-semibold tabular-nums"
            />
          </Field>
          <Field label="Fecha" className="flex-1">
            <Input type="date" name="loggedAt" defaultValue={today} />
          </Field>
          <SubmitButton pendingLabel="…">Guardar</SubmitButton>
        </form>
      </Panel>

      {logs.length === 0 ? (
        <EmptyState
          icon={<ScaleIcon width={28} height={28} />}
          title="Sin registros"
          description="Anotá tu peso cada tanto para ver la tendencia."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Actual" value={latest!.weight} unit={unit} accent />
            <StatTile
              label="Cambio"
              value={delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
              unit={delta === null ? undefined : unit}
            />
          </div>

          {chartPoints.length > 1 && (
            <Panel className="mt-3">
              <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-faint">
                Evolución
              </p>
              <LineChart points={chartPoints} unit={unit} />
            </Panel>
          )}

          <section className="mt-8">
            <SectionTitle>Registros</SectionTitle>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {logs.map((log, index) => {
                const prev = logs[index + 1];
                const diff = prev
                  ? Math.round((log.weight - prev.weight) * 10) / 10
                  : null;

                return (
                  <li
                    key={log.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="flex-1 text-sm text-muted">
                      {formatDate(log.logged_at)}
                    </span>
                    {diff !== null && diff !== 0 && (
                      <Badge tone={diff > 0 ? "neutral" : "accent"}>
                        {diff > 0 ? "+" : ""}
                        {diff}
                      </Badge>
                    )}
                    <span className="text-[15px] font-semibold tabular-nums">
                      {log.weight}
                      <span className="text-[13px] font-medium text-muted">
                        {" "}
                        {unit}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </Page>
  );
}
