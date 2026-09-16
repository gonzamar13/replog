type DatedGroup = {
  id: string;
  starts_on: string | null;
  ends_on: string | null;
};

/**
 * El programa vigente hoy según sus fechas. Las columnas starts_on /
 * ends_on ya se guardaban pero no se usaban para nada: acá es donde
 * pasan a tener sentido. Un programa sin ninguna fecha no se considera
 * vigente (si no, siempre ganaría el primero). Si ninguno cubre hoy,
 * se cae al más reciente, que es el primero de la lista.
 */
export function pickCurrentGroup<T extends DatedGroup>(groups: T[]): T | null {
  const today = new Date().toISOString().slice(0, 10);

  const active = groups.find(
    (g) =>
      (g.starts_on || g.ends_on) &&
      (!g.starts_on || g.starts_on <= today) &&
      (!g.ends_on || g.ends_on >= today),
  );

  return active ?? groups[0] ?? null;
}
