import { cn } from "@/components/ui";

type Point = { label: string; value: number };

// Gráfico de línea en SVG puro — una sola métrica, sin librerías.
// La escala se calcula con los datos reales y toda etiqueta que se
// dibuja corresponde a un valor que el gráfico efectivamente alcanza.
export function LineChart({
  points,
  unit = "",
  className,
}: {
  points: Point[];
  unit?: string;
  className?: string;
}) {
  if (points.length === 0) return null;

  const W = 320;
  const H = 150;
  const PAD_T = 18;
  const PAD_B = 24;
  const PAD_R = 44;

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || max || 1;
  const chartH = H - PAD_T - PAD_B;
  const chartW = W - PAD_R;

  const xAt = (i: number) =>
    points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW;
  const yAt = (v: number) => PAD_T + chartH - ((v - min) / span) * chartH;

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`)
    .join(" ");

  const area = `${line} L${xAt(points.length - 1).toFixed(1)},${PAD_T + chartH} L${xAt(0).toFixed(1)},${PAD_T + chartH} Z`;

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("w-full", className)}
      role="img"
      aria-label={`Evolución: de ${points[0].value}${unit} el ${points[0].label} a ${last.value}${unit} el ${last.label}`}
    >
      {/* guías horizontales en máximo y mínimo reales */}
      {[max, min].map((v, i) => (
        <g key={i}>
          <line
            x1="0"
            x2={chartW}
            y1={yAt(v)}
            y2={yAt(v)}
            stroke="var(--color-line)"
            strokeDasharray="3 4"
          />
          <text
            x={chartW + 8}
            y={yAt(v) + 4}
            fontSize="11"
            fill="var(--color-faint)"
          >
            {v}
            {unit}
          </text>
        </g>
      ))}

      <path d={area} fill="var(--color-accent)" opacity="0.1" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={xAt(i)}
          cy={yAt(p.value)}
          r={i === points.length - 1 ? 4 : 2.5}
          fill={i === points.length - 1 ? "var(--color-accent)" : "var(--color-canvas)"}
          stroke="var(--color-accent)"
          strokeWidth="1.5"
        />
      ))}

      <text x="0" y={H - 6} fontSize="11" fill="var(--color-faint)">
        {points[0].label}
      </text>
      {points.length > 1 && (
        <text
          x={chartW}
          y={H - 6}
          fontSize="11"
          textAnchor="end"
          fill="var(--color-faint)"
        >
          {last.label}
        </text>
      )}
    </svg>
  );
}

// Barras mínimas para la tendencia de la home. Sin ejes ni etiquetas:
// solo la forma de las últimas sesiones.
export function Sparkbars({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values) || 1;

  return (
    <div
      className={cn("flex h-10 items-end gap-1", className)}
      aria-hidden="true"
    >
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-sm",
            i === values.length - 1 ? "bg-accent" : "bg-elevated",
          )}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
