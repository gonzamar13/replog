# Decisiones

Por qué las cosas son como son. Sirve para no rediscutirlas, y para saber cuál
revisar cuando algo cambie.

---

### Lo planeado y lo ejecutado son tablas distintas

`routine_exercises` guarda el objetivo; `sets` guarda lo que pasó. Si
compartieran tabla, ajustar el peso a mitad de una serie reescribiría la
plantilla de la rutina — un bug silencioso y carísimo de deshacer después.

### No hay ORM

La fuente de verdad es el esquema de Postgres. `database.types.ts` es su
espejo tipado y se puede regenerar con `supabase gen types`. Sumar Prisma o
Drizzle traería una segunda definición del modelo que hay que mantener en
sincronía, a cambio de poco.

### RLS en vez de chequeos de propiedad

Cada tabla tiene políticas que la limitan a `auth.uid()`. La capa de datos no
filtra por usuario: si el `id` es de otro, la consulta devuelve vacío. La
seguridad no depende de que nos acordemos de poner un `where`.

### Sin joins embebidos de PostgREST

`select("*, exercises(*)")` funciona en runtime pero rompe el tipado, porque
los tipos escritos a mano no describen las relaciones. Se hacen consultas
separadas y se arman con un `Map`. Más código, tipos reales.

---

### El programa es un filtro, no un nivel de navegación

La tentación era Rutinas → Programa → Rutina. Pero la tarea diaria de esa
pantalla es *empezar a entrenar*, y ese nivel extra cuesta un toque **todos los
días** para ordenar algo que se toca una vez por trimestre.

El programa vigente se elige solo según `starts_on` / `ends_on`, y los demás
quedan en chips a un toque.

### La duración de la rutina es mediana, no promedio

"Finalizar" es manual. Alcanza con olvidarse de cerrar una sesión **una vez**
para que un valor de tres horas arruine el promedio para siempre. La mediana
ignora ese tipo de outlier.

Tampoco es un campo que se escribe a mano: se deriva de las sesiones reales, o
sea que refleja cuánto te lleva de verdad y no cuánto creés que te lleva.

### RIR reemplaza al checkbox "Fallo"

Son lo mismo: RIR 0 *es* al fallo. Tener las dos cosas era pedir el mismo dato
dos veces. `is_failure` se mantiene sincronizada para no romper el historial
anterior, y el RIR es siempre **opcional**: una serie sin RIR es una serie
perfectamente válida.

Si algún día se prefiere RPE, es la misma columna con otra etiqueta:
RPE = 10 − RIR.

### La sesión no avanza sola al ejercicio siguiente

Aunque completes las series objetivo. Es tentador, pero si querés meter una
serie extra y la app ya te movió de pantalla, es exactamente el tipo de cosa
que hace putear a mitad de un entrenamiento.

### No se pueden tener dos sesiones activas

Cualquier "empezar entrenamiento" —libre, desde una rutina o repitiendo una
pasada— primero chequea si hay una en curso y entra a esa. Sin importar qué
botón se apretó.

### No hay botón de borrar en cada fila del historial

En una lista que se scrollea con el pulgar, un botón destructivo por fila es un
accidente esperando pasar. Borrar vive dentro de la sesión, detrás de una
confirmación.

---

### Ajustar, no tipear

El teclado numérico del sistema tapa media pantalla y necesita un toque extra
para cerrarse: subir 2.5 kg eran seis interacciones. Ahora hay steppers y, para
el caso raro de escribir un valor nuevo, un **teclado numérico propio** fijo
abajo, con teclas grandes en la zona del pulgar.

El incremento es **0.5 kg** por pedido explícito del usuario, no por criterio
técnico. Si se vuelve lento para saltos grandes, la solución es un selector de
incremento en Perfil, no cambiar el valor por defecto.

### Un ejercicio por tarjeta, con `scroll-snap` de CSS

Sin librerías de gestos: el navegador da el desplazamiento con inercia, y
funciona con el dedo, con trackpad y con teclado. Dentro de la tarjeta todo
scrollea en vertical, así que el deslizamiento lateral no pelea con nada.

### El alto de la sesión es flexbox, no `calc()`

La primera versión usaba `h-[calc(100dvh-15rem)]`, o sea que **adivinaba**
cuánto medía el pie de página. Cuando aparecía la barra de descanso, el pie
crecía y tapaba el botón de registrar. Ahora es una columna flex: el mazo ocupa
lo que sobra y se encoge solo. El bug no puede volver porque ya no hay ningún
número mágico.

### "Finalizar" no va en el pie

Se toca una vez por sesión y estaba ocupando el mejor lugar de la pantalla. Ese
lugar es de "Registrar serie", que se toca treinta veces. Finalizar vive en el
encabezado.

---

### `auth.getUser()` va cacheado

No decodifica el token localmente: **le pregunta al servidor de Supabase cada
vez**. Estaba repartido en once lugares, o sea tres o cuatro viajes de red por
pantalla. Envuelto en `cache()` de React es uno solo por request.

`proxy.ts` conserva el suyo porque es el que refresca el token y corre en otro
ciclo de vida.

### Los `loading.tsx` no son decoración

Sin ellos, Next espera a que el servidor termine todo antes de pintar un pixel.
El usuario tocaba una pestaña, no veía ninguna reacción, y volvía a tocar. El
primer toque siempre había funcionado; nadie se lo había dicho.

**Efecto secundario esperado**: las rutas protegidas ahora responden `200` con
el esqueleto en vez de `307`, porque la respuesta empieza a transmitirse antes
de resolver la redirección. No filtra datos —solo el esqueleto— y la
redirección igual ocurre.

### Los tipos de la base se escriben a mano

Para no depender de tener el proyecto de Supabase linkeado. Se pueden
regenerar 1:1 con `supabase gen types typescript`. Dos detalles que cuestan
una tarde si no se saben:

- Cada tabla necesita `Relationships: []`, aunque no se usen joins embebidos.
- El esquema necesita `Views` y `Functions`, aunque estén vacíos.

Sin eso, `supabase-js` no matchea el tipo y **todas las filas se infieren como
`never`**, con errores que no apuntan a la causa.

### `apple-mobile-web-app-capable` a mano

Next emite el meta estándar (`mobile-web-app-capable`) pero no el de Apple, que
iOS anterior a 16.4 sigue necesitando para abrir en modo standalone. Se agrega
explícito en el layout; React lo sube solo al `<head>`.

---

## Pendientes conocidos

- **Editar el objetivo de un ejercicio ya agregado a una rutina**: hoy hay que
  quitarlo y volver a agregarlo.
- **Profesores y gimnasios**: diseñados en el esquema, sin implementar. Ver
  [`base-de-datos.md`](base-de-datos.md).
- **Offline**: la app necesita conexión. Un enfoque local-first se evaluó y se
  descartó por ahora: agrega mucha complejidad para un problema que el LTE
  resuelve.
- **El nombre**: existe otra app de registro de entrenamientos llamada RepLog
  (replog.co.uk). No afecta nada técnico, pero conviene saberlo antes de
  invertir en la marca.
