# Despliegue

## Qué aplica cada quién

Lo más importante de entender: **un `git push` no lleva todo.**

| Qué cambia | Quién lo aplica |
|---|---|
| Código (pantallas, lógica) | Vercel, automático en cada push a `main` |
| Variables de entorno | Vos, una vez, en el panel de Vercel |
| Migraciones SQL | Vos, cada vez, en Supabase |

Los `.sql` viajan al repo, pero **Vercel no tiene acceso a tu base de datos**:
no las ejecuta nadie por vos.

## Variables de entorno

Solo dos, y las dos son públicas (viajan al navegador):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```

Están en Supabase → **Project Settings → Data API**.

> La clave `service_role` **no se usa en este proyecto** y no debe cargarse en
> Vercel. Todo el acceso pasa por RLS con la clave pública.

En local van en `.env.local` (ignorado por git). En producción se cargan en
Vercel → Project → Settings → Environment Variables.

## Primer deploy

1. [vercel.com](https://vercel.com) → **Add New → Project** → importar el repo.
   Vercel detecta Next.js solo; no hay que tocar build ni output.
2. Cargar las dos variables de entorno.
3. **Deploy**. Anotar la URL resultante (`https://<algo>.vercel.app`).

De ahí en adelante, cada push a `main` despliega solo. Si el build falla, la
versión anterior sigue en línea.

## Login en producción

Es el paso que más se olvida y el que rompe el login. Hay que registrar la URL
de producción en **dos lugares distintos**.

### Supabase

**Authentication → URL Configuration**:

- **Site URL**: `https://tu-app.vercel.app`
- **Redirect URLs**: agregar `https://tu-app.vercel.app/auth/callback`
  (dejando también `http://localhost:3000/auth/callback` para desarrollo)

### Google

Solo si usás login con Google.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
   crear un proyecto → **Pantalla de consentimiento OAuth** (tipo Externo).
2. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación
   web**:
   - **Orígenes autorizados de JavaScript**: `http://localhost:3000` y
     `https://tu-app.vercel.app`
   - **URI de redireccionamiento autorizado**: el de **Supabase**, no el tuyo.
     Lo muestra Supabase en la pantalla del proveedor y termina en
     `/auth/v1/callback`.
3. Copiar Client ID y Client Secret y pegarlos en Supabase →
   **Authentication → Sign In / Providers → Google**.

El error más común es `redirect_uri_mismatch`: casi siempre es esa URI del
paso 2 mal copiada.

### Por qué el callback mira `x-forwarded-host`

En `app/auth/callback/route.ts` el destino de la redirección no sale de
`request.url`: detrás del proxy de Vercel eso apunta al host interno del
contenedor, y el login terminaría en una URL que el navegador no puede
resolver. Por eso se usa `x-forwarded-host` cuando existe.

## Migraciones en producción

Cada vez que se agrega un archivo a `supabase/migrations/`:

**Opción A** — SQL Editor de Supabase: pegar el contenido y ejecutar.

**Opción B** — con la CLI:

```bash
npx supabase link --project-ref <tu-ref>
npx supabase db push
```

Si una funcionalidad nueva falla en producción con un error de columna
inexistente, casi siempre es una migración sin aplicar.

## PWA

La app trae `manifest.webmanifest`, iconos generados en el build y los metas de
iOS. Para instalarla en el iPhone: Safari → Compartir → **Agregar a inicio**.

> iOS **cachea el manifest y el ícono al instalar**. Si ya la tenías agregada
> desde antes de que existiera el manifest, hay que borrar el ícono de la
> pantalla de inicio y volver a agregarlo.

## Si va lento

En orden de impacto:

1. **¿Estás midiendo contra `npm run dev`?** El servidor de desarrollo compila
   cada ruta la primera vez que la visitás. No sirve para juzgar velocidad.
2. **¿En qué región quedó el proyecto de Supabase?** Si está lejos de la región
   donde Vercel sirve la app, cada consulta paga la latencia del viaje, y una
   pantalla hace varias. Eso no se arregla con código.
3. Recién después, mirar consultas: que todo lo paralelizable esté en
   `Promise.all` y que no haya un `await` suelto agregando un viaje en serie.
