// La sesión tiene un layout propio (columna a pantalla completa), así
// que su esqueleto también.
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Cargando entrenamiento"
      className="flex h-dvh flex-col overflow-hidden"
    >
      <header className="shrink-0 border-b border-line px-4 py-3 lg:px-8">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between">
          <div className="space-y-2">
            <div className="animate-pulse-soft h-4 w-36 rounded bg-surface" />
            <div className="animate-pulse-soft h-3 w-24 rounded bg-surface" />
          </div>
          <div className="animate-pulse-soft h-8 w-20 rounded-lg bg-surface" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-3 lg:px-8">
        <div className="animate-pulse-soft h-6 w-44 rounded bg-surface" />
        <div className="animate-pulse-soft mt-4 h-48 rounded-2xl bg-surface" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="animate-pulse-soft h-16 rounded-xl bg-surface" />
          <div className="animate-pulse-soft h-16 rounded-xl bg-surface" />
        </div>
        <div className="animate-pulse-soft mt-3 h-14 rounded-xl bg-surface" />
      </div>
    </div>
  );
}
