// Días de la semana en numeración ISO-8601: 1 = lunes … 7 = domingo.
// Es la misma que usa Postgres en isodow, así que no hay traducción
// de por medio en ningún lado.

export const WEEK_DAYS = [
  { value: 1, short: "Lu", label: "Lunes" },
  { value: 2, short: "Ma", label: "Martes" },
  { value: 3, short: "Mi", label: "Miércoles" },
  { value: 4, short: "Ju", label: "Jueves" },
  { value: 5, short: "Vi", label: "Viernes" },
  { value: 6, short: "Sá", label: "Sábado" },
  { value: 7, short: "Do", label: "Domingo" },
] as const;

/** Día de hoy en ISO-8601 (Date.getDay() devuelve 0 para domingo). */
export function todayIso(date = new Date()) {
  return date.getDay() === 0 ? 7 : date.getDay();
}

/** [1,3,5] → "Lu · Mi · Vi" */
export function formatDays(days: number[] | null | undefined) {
  if (!days || days.length === 0) return null;
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEK_DAYS.find((w) => w.value === d)?.short)
    .filter(Boolean)
    .join(" · ");
}
