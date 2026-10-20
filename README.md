# Natural Fly Fishing

Blog personal de pesca a mosca: montajes de moscas, entrenamientos, campeonatos y días de pesca libre.
Cada entrada puede ser pública (la ve cualquiera) o privada (solo usuarios con sesión). Los usuarios se crean a mano en Supabase; no hay registro abierto.

## Stack

- [SvelteKit 3](https://svelte.dev/docs/kit) + Svelte 5 (runes) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) con los plugins `typography` y `forms`
- [Supabase](https://supabase.com): Postgres, Auth y Row Level Security
- Despliegue en [Vercel](https://vercel.com) (`@sveltejs/adapter-vercel`)
- [Bun](https://bun.sh) como gestor de paquetes

## Puesta en marcha

### 1. Dependencias

```sh
bun install
```

### 2. Base de datos

El esquema está en [`supabase/migrations/`](supabase/migrations). Para crearlo en un proyecto nuevo de Supabase:

- **Desde el panel:** abre el SQL Editor y ejecuta las migraciones en orden.
- **Con el CLI:** `supabase link --project-ref <ref>` y después `supabase db push`.

Cualquier cambio posterior del esquema va en una migración **nueva**: no edites las que ya se han aplicado.

### 3. Usuarios

El registro público está desactivado (Authentication → Sign In / Providers → Email → _Allow new users to sign up_ desactivado).

1. Crea el usuario en Authentication → Users → **Add user**, con _Auto Confirm User_ marcado.
   Un trigger le crea automáticamente un perfil con rol `reader`, que solo puede leer.
2. Si va a poder gestionar entradas, hazlo `superadmin`:

   ```sql
   update profiles set role = 'superadmin'
   where id = (select id from auth.users where email = 'tu@email.com');
   ```

   El rol solo se puede cambiar desde SQL: `profiles` no tiene política de `update`.

### 4. Variables de entorno

Copia `.env.example` a `.env` y rellénalo con los datos de Project Settings → API:

| Variable                          | Valor                                     |
| --------------------------------- | ----------------------------------------- |
| `PUBLIC_SUPABASE_URL`             | Project URL, **sin** `/rest/v1/` al final |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (o la antigua anon key)   |

Las variables se declaran en `src/env.ts` con `defineEnvVars` y se importan desde `$app/env/public`.
Son estáticas, así que hay que reiniciar el servidor de desarrollo después de cambiarlas.

### 5. Desarrollo

```sh
bun run dev
```

## Modelo de datos

Cada publicación es una fila de `entries` con los datos comunes. Según su `type`, tiene además una fila en la tabla de detalle correspondiente, con relación 1:1 por `entry_id`.

| `entries.type`   | Tabla de detalle    | Datos principales                                       |
| ---------------- | ------------------- | ------------------------------------------------------- |
| `montaje_moscas` | `fly_tyings`        | nombre y patrón de la mosca, anzuelo, materiales        |
| `entrenamiento`  | `training_sessions` | fecha, lugar, duración, enfoque                         |
| `campeonato`     | `championships`     | competición, fecha, lugar, puesto, participantes        |
| `pesca_libre`    | `free_fishing_days` | fecha, lugar, tipo de agua, técnica, especies, capturas |

- `entries.body` guarda el contenido en Markdown.
- `entries.youtube_id` guarda el identificador de un vídeo de YouTube opcional (ver [Vídeo](#vídeo)).
- `entries.status` es `draft` o `published`.
- `entries.visibility` es `private` (por defecto) o `public`; solo cuenta cuando la entrada está publicada.
- `profiles.role` es `reader` (lector) o `superadmin` (gestiona entradas).

La descripción de los tipos y sus campos para la app está en [`src/lib/entries.ts`](src/lib/entries.ts). Si cambias una tabla de detalle, actualízala ahí también: de ella salen el formulario, la validación y la ficha de cada entrada.

### Seguridad (RLS)

Quién ve cada entrada lo decide la base de datos:

| Entrada               | Sin sesión | Usuario (`reader`) | `superadmin` |
| --------------------- | :--------: | :----------------: | :----------: |
| Borrador (`draft`)    |     —      |         —          |      ✓       |
| Publicada y `private` |     —      |         ✓          |      ✓       |
| Publicada y `public`  |     ✓      |         ✓          |      ✓       |

- **Base de datos:** las políticas RLS aplican la tabla anterior a `entries`. Las tablas de detalle son visibles exactamente cuando lo es su entrada. Solo los `superadmin` (`es_admin()`) pueden crear, editar o borrar.
- **App:** la lectura es abierta y cada visitante recibe lo que RLS le deja ver. Si alguien sin sesión abre una entrada privada, se le manda a `/login`. `/admin` exige sesión de `superadmin`.

## Publicar entradas

Con un usuario `superadmin` aparece el enlace **Admin** en la cabecera:

- `/admin`: todas las entradas, borradores incluidos, con botones para publicar o pasar a borrador y para hacerlas públicas o privadas. Los mismos botones aparecen en la propia entrada.
- `/admin/nueva`: crea una entrada de dos formas:
  - **Formulario:** los campos de detalle cambian según el tipo elegido.
  - **Archivo Markdown:** sube un `.md` y sus datos se cargan en el formulario para revisarlos antes de guardar.

Formato del archivo: los campos van en un frontmatter YAML y el resto es el cuerpo. Si no hay `title`, se usa el primer `# Título`.

```markdown
---
type: montaje_moscas # montaje_moscas | entrenamiento | campeonato | pesca_libre
title: Pardón en CDC
slug: pardon-en-cdc # opcional, se genera del título
excerpt: Una seca sencilla para las tardes de mayo.
status: draft # draft | published
visibility: private # private (con sesión) | public (cualquiera)
published_at: 2026-05-12 # opcional; si se publica sin fecha, se usa la actual
video: https://youtu.be/dQw4w9WgXcQ # opcional; cualquier enlace de YouTube
fly_name: Pardón CDC
fly_pattern: seca
hook_size: 16
target_species: trucha común
materials: [hilo 8/0 marrón, CDC natural]
---

El cuerpo de la entrada en **Markdown**.
```

Los campos de detalle de cada tipo son las columnas de su tabla (ver [Modelo de datos](#modelo-de-datos)). La página de importación muestra la lista completa.

## Fotos

Cada entrada puede tener varias fotos. La primera es la portada, que también aparece en el listado.

- **Dónde se suben:** en el formulario de nueva entrada, o desde la propia entrada (solo `superadmin`), donde también se borran.
- **Cómo:** el navegador reduce cada foto a 2000 px como máximo, la convierte a JPEG (lo que de paso quita los datos EXIF y GPS) y la sube **directamente a Supabase Storage**, sin pasar por el servidor de la app: Vercel corta las peticiones de más de 4,5 MB.
- **Dónde se guardan:** en el bucket privado `entry-images`, con la ruta `<entry_id>/<archivo>.jpg`. La tabla `entry_images` guarda el orden.
- **Quién las ve:** las mismas personas que ven su entrada. La app sirve las fotos con URLs firmadas que caducan en una hora, y Storage solo las firma si la política RLS deja ver la entrada.

En el plan gratuito de Supabase hay 1 GB de Storage y 5 GB de transferencia al mes. A unos 300–500 KB por foto, eso da para unas 2.000–3.000 fotos.

En la entrada, una sola foto se muestra tal cual y varias forman un carrusel (deslizable en el móvil, con flechas y teclado en escritorio).

## Vídeo

Cada entrada puede llevar un vídeo de YouTube, que se muestra debajo de las fotos. Se indica en el formulario de nueva entrada, en el campo `video` del frontmatter o desde la propia entrada (solo `superadmin`), donde también se cambia o se quita.

Vale cualquier enlace (`youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`, `/embed/…`); en `entries.youtube_id` solo se guarda el identificador del vídeo. El reproductor usa `youtube-nocookie.com`, que no pone cookies hasta que se pulsa play. Para que el vídeo no sea público en YouTube, súbelo como **oculto** (no como privado, que no se puede insertar).

## Scripts

| Comando           | Qué hace                                 |
| ----------------- | ---------------------------------------- |
| `bun run dev`     | Servidor de desarrollo                   |
| `bun run build`   | Build de producción                      |
| `bun run preview` | Sirve el build de producción             |
| `bun run check`   | Comprobación de tipos con `svelte-check` |
| `bun run lint`    | Prettier + ESLint                        |
| `bun run format`  | Formatea el código con Prettier          |
| `bun run test`    | Tests con Vitest                         |

## CI/CD

**Comprobaciones:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se ejecuta en cada PR y en cada push a `main`:

| Trabajo      | Qué hace                                            |
| ------------ | --------------------------------------------------- |
| Tipos y lint | `bun run check` y `bun run lint`                    |
| Tests        | `bun run test` (servidor y componentes en Chromium) |
| Build        | `bun run build`                                     |

Usan valores de ejemplo para las variables de Supabase, porque SvelteKit las exige al arrancar.

**Despliegue:** lo hace la integración de Vercel con GitHub, con las variables reales configuradas en Vercel (Settings → Environment Variables):

- Cada PR genera una **preview** y su estado aparece en la PR como check _Vercel_. Las previews están protegidas: solo se ven con sesión iniciada en Vercel.
- Cada push a `main`, es decir, cada PR fusionada, despliega en **producción**: <https://natural-fly-fishing.vercel.app>.

Para que solo llegue a producción código que pasa la CI, protege `main` en GitHub → Settings → Branches y exige _Tipos y lint_, _Tests_, _Build_ y _Vercel_ antes de fusionar.

## Recrear el scaffold

El proyecto se generó con:

```sh
bun x sv@1.1.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" tailwindcss="plugins:typography,forms" enhanced-img sveltekit-adapter="adapter:vercel" --install bun natural_fly_fishing
```
