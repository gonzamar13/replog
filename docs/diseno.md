# Sistema visual

**Performance Minimalism.** Una herramienta profesional, no una red social
fitness. Oscura, sobria, con los números como protagonistas.

La app se usa **durante** un entrenamiento: cansado, entre series, con una
mano, caminando entre máquinas. Todo lo demás se subordina a eso.

## Paleta

Definida como tokens de Tailwind v4 en `src/app/globals.css`. Se usan siempre
por su nombre (`bg-surface`, `text-muted`), nunca con el hex suelto.

| Token | Hex | Uso |
|---|---|---|
| `canvas` | `#0B0E0D` | Fondo de la app |
| `surface` | `#141918` | Tarjetas y listas |
| `elevated` | `#1D2422` | Inputs, controles, lo que está "encima" |
| `line` | `#2A3330` | Bordes y separadores |
| `accent` | `#B8FF34` | **Ver abajo** |
| `accent-pressed` | `#8FD12E` | Estado presionado del acento |
| `warning` | `#FFB84D` | Al fallo (RIR 0) |
| `danger` | `#FF5A5F` | Errores y acciones destructivas |
| `ink` | `#F3F5F4` | Texto principal |
| `muted` | `#A7B0AD` | Texto secundario |
| `faint` | `#68726E` | Etiquetas y metadatos |

### La regla del verde

El acento **comunica, no decora**. Solo aparece en:

- la acción principal de la pantalla,
- una serie completada,
- un ejercicio que cumplió su objetivo,
- un récord nuevo,
- el cronómetro de la sesión activa,
- el elemento seleccionado (pestaña, chip, día).

Si aparece en otro lado, está mal.

El borde por defecto de Tailwind v4 es `currentColor`; en `@layer base` se fija
a `line` para no repetir `border-line` en cada elemento.

## Tipografía

**Inter**, cargada con `next/font`.

Los números importantes mandan: peso, reps y tiempo van grandes y en negrita.
Los metadatos van chicos, en `muted` o `faint`, separados por `·`
("Pecho · 4 × 12–15 · 120 s").

Todo lo numérico lleva `tabular-nums` para que no baile al cambiar de valor.

| Uso | Clases |
|---|---|
| Título de pantalla | `text-2xl font-bold tracking-tight` |
| Número protagonista | `text-3xl font-bold tabular-nums` |
| Nombre de ejercicio | `text-lg font-bold tracking-tight` |
| Cuerpo | `text-sm` |
| Metadato | `text-[13px] text-muted` |
| Etiqueta de sección | `text-[11px] uppercase tracking-[0.1em] text-faint` |

## Componentes

Todo en `src/components/ui/index.tsx` salvo que se aclare.

| Componente | Para qué |
|---|---|
| `Button` / `ButtonLink` | Variantes `primary`, `secondary`, `ghost`, `danger`; tamaños `sm`, `md`, `lg` |
| `SubmitButton` | El de los formularios: muestra el estado de guardado con `useFormStatus` |
| `IconSubmit` | Acción secundaria en línea (deshacer, quitar, reordenar) |
| `Input`, `Select`, `Field` | Campos con su etiqueta |
| `Page`, `PageHeader`, `SectionTitle` | Estructura de pantalla |
| `Panel` | Superficie con borde. **Usar con criterio** |
| `StatTile` | Número grande con su etiqueta |
| `Badge` | Píldora de estado (`accent`, `neutral`, `warning`, `danger`) |
| `MetaLine` | Metadatos separados por `·`, ignora los nulos |
| `EmptyState` | Estado vacío con icono, texto y acción |
| `LineChart`, `Sparkbars` | Gráficos en SVG puro (`ui/chart.tsx`) |
| `ExercisePicker` | Buscador de ejercicios (`components/exercise-picker.tsx`) |
| `AppNav` | Tab bar en móvil, rail lateral en escritorio |

`icons.tsx` tiene los iconos propios: SVG de trazo, 24×24, `currentColor`,
grosor 1.75. **Sin emojis y sin librería de iconos.**

### No todo es una tarjeta

Borde, relleno, radio y sombra dicen "objeto separado". Se gastan por función,
no por costumbre. La jerarquía se construye antes con **tamaño, peso
tipográfico, espaciado y contraste** que con cajas.

## Espaciado

Escala de Tailwind, sin valores arbitrarios:

- Margen de pantalla: `px-4` en móvil, `lg:px-8` en escritorio
- Entre secciones: `mt-6` / `mt-8`
- Dentro de una tarjeta: `p-4`
- Entre elementos de una lista: `gap-2` / `space-y-2`
- Radios: `rounded-xl` para controles, `rounded-2xl` para superficies

## Responsive

Mobile-first de verdad, no una versión de escritorio encogida:

- **Móvil**: una columna, `max-w-xl`, tab bar abajo al alcance del pulgar.
- **Escritorio (`lg:`)**: la navegación pasa a rail lateral y la home se
  reacomoda en dos columnas. No se estira el móvil.
- Los controles principales viven en el **tercio inferior**.
- Los objetivos táctiles nunca bajan de 44 px (`h-11`).
- Las áreas seguras del iPhone se respetan con
  `pb-[max(...,env(safe-area-inset-bottom))]`.

## Microinteracciones

Solo cuando aportan información:

- `active:scale-[0.98]` en los botones — confirma el toque.
- `animate-pop` al confirmar una serie y al mostrar un récord.
- `animate-pulse-soft` en los esqueletos de carga y al terminar el descanso.
- Vibración al terminar el temporizador — feedback que no depende de mirar.

Todo respeta `prefers-reduced-motion` desde `globals.css`.

## Accesibilidad

- Contraste suficiente sobre los fondos oscuros.
- El estado **nunca depende solo del color**: una serie hecha tiene tilde, no
  solo color; el RIR 0 dice "fallo".
- `aria-label` en los botones que son solo icono, `aria-pressed` en los
  conmutadores, `role="alert"` y `role="status"` en los mensajes.
- Foco visible en todo (`:focus-visible` global con el acento).
- El deslizamiento lateral entre ejercicios tiene alternativa: los chips del
  encabezado saltan a cualquiera.

## Modo claro

No existe a propósito. El scaffold de Next traía un `prefers-color-scheme` que
invertía los colores sin que nadie lo hubiera diseñado; se sacó. La app es
oscura y punto.
