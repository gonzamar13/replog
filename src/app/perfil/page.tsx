import { SignOutButton } from "@/app/sign-out-button";
import {
  ChevronRightIcon,
  ScaleIcon,
  TagIcon,
  TrophyIcon,
  UserIcon,
} from "@/components/icons";
import {
  Field,
  Input,
  Page,
  PageHeader,
  Panel,
  SectionTitle,
  Select,
  StatTile,
} from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { listBodyWeightLogs } from "@/lib/data/body-weight";
import { getHomeSummary } from "@/lib/data/home";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getPersonalRecords } from "@/lib/data/progress";
import Link from "next/link";
import { updateProfileAction } from "./actions";

const LINKS = [
  { href: "/peso", label: "Peso corporal", Icon: ScaleIcon },
  { href: "/ejercicios", label: "Ejercicios", Icon: TagIcon },
  { href: "/records", label: "Récords", Icon: TrophyIcon },
];

export default async function PerfilPage() {
  const user = await requireUser();
  const [profile, summary, records, weights] = await Promise.all([
    getCurrentProfile(),
    getHomeSummary(),
    getPersonalRecords(),
    listBodyWeightLogs(),
  ]);

  const unit = profile?.unit_pref ?? "kg";
  const latestWeight = weights[0] ?? null;

  return (
    <Page>
      <PageHeader title="Perfil" />

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted">
          <UserIcon width={26} height={26} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">
            {profile?.display_name || user.email?.split("@")[0]}
          </p>
          <p className="truncate text-[13px] text-faint">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Sesiones" value={summary.totalWorkouts} />
        <StatTile label="Récords" value={records.length} accent />
        <StatTile
          label="Peso"
          value={latestWeight ? latestWeight.weight : "—"}
          unit={latestWeight ? unit : undefined}
        />
      </div>

      <section className="mt-8">
        <SectionTitle>Accesos</SectionTitle>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {LINKS.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated"
              >
                <Icon className="shrink-0 text-muted" />
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ChevronRightIcon className="shrink-0 text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <SectionTitle>Ajustes</SectionTitle>
        <Panel>
          <form action={updateProfileAction} className="space-y-3">
            <Field label="Nombre">
              <Input
                type="text"
                name="displayName"
                defaultValue={profile?.display_name ?? ""}
                placeholder="Cómo querés que te salude la app"
              />
            </Field>

            <Field label="Unidad de peso">
              <Select name="unitPref" defaultValue={unit}>
                <option value="kg">Kilogramos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </Select>
            </Field>

            <SubmitButton className="w-full" pendingLabel="Guardando…">
              Guardar cambios
            </SubmitButton>
          </form>
        </Panel>
      </section>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </Page>
  );
}
