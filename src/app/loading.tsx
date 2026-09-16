// Sin este archivo, Next espera a que el servidor termine TODO antes de
// pintar un pixel: tocabas una pestaña, no pasaba nada visible, y volvías
// a tocar. El esqueleto aparece al instante y el toque se siente atendido.
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="mx-auto w-full max-w-xl px-4 pt-6 pb-28 lg:max-w-5xl lg:px-8 lg:pt-10"
    >
      <div className="animate-pulse-soft h-8 w-40 rounded-lg bg-surface" />
      <div className="animate-pulse-soft mt-6 h-14 rounded-xl bg-surface" />
      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse-soft h-16 rounded-2xl bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
