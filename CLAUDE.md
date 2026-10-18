# CLAUDE.md

Guía para Claude Code en este repositorio. El [README](README.md) explica el proyecto para personas; aquí está lo que hace falta para trabajar en él sin romper nada.

## Proyecto

Blog personal de pesca a mosca. SvelteKit 3 + Svelte 5 (runes) + TypeScript, Tailwind 4, Supabase (Postgres, Auth, Storage, RLS), despliegue en Vercel, Bun como gestor de paquetes.

- La interfaz y los textos para el usuario van **en español**. Los comentarios del código, en inglés.
- Los nombres de rutas y acciones visibles van en español (`/admin/nueva`, `?/crear`, `cambiarPublicacion`).

## Comandos

```sh
bun install
bun run dev          # servidor de desarrollo (puerto 5173)
bun run check        # svelte-check: debe dar 0 errores y 0 warnings
bun run lint         # prettier --check + eslint
bun run format       # prettier --write
bunx vitest run --project server   # tests unitarios (los de navegador necesitan `npx playwright install`)
```

Antes de dar algo por terminado: `check`, `lint` y los tests de servidor en verde.

Vite valida las variables de `src/env.ts` al arrancar, así que `test` y `build` fallan con `env_invalid` si no hay `.env`. En local existe. En CI se usan valores de ejemplo; los reales solo están en Vercel.

## Flujo de trabajo: una PR por petición

- **Nunca** hagas commit ni push a `main`, ni fusiones PRs: el dueño del repo revisa y aprueba cada una.
- Cada petición va en su propia rama, que sale de `origin/main` actualizado (`git fetch` primero). Si depende de una PR sin fusionar, sale de esa rama y la PR lo indica.
- Tipo de rama → título (Conventional Commits, en español) → etiqueta:

  | Rama         | Título        | Etiqueta        |
  | ------------ | ------------- | --------------- |
  | `feature/…`  | `feat: …`     | `enhancement`   |
  | `fix/…`      | `fix: …`      | `bug`           |
  | `docs/…`     | `docs: …`     | `documentation` |
  | `refactor/…` | `refactor: …` | —               |
  | `chore/…`    | `chore: …`    | —               |

- Cada PR ejecuta la CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): tipos, lint, tests y build. Además, Vercel despliega una preview por su integración con Git (check _Vercel_). Producción se despliega sola al fusionar en `main`; no hay despliegue desde Actions. Después de abrirla, comprueba el resultado con `gh pr checks`. Si algo falla, arréglalo en la misma rama antes de darla por lista.
- Descripción de la PR en español: **Qué cambia**, **Por qué**, **Migraciones SQL** a ejecutar (si las hay), **Cómo probarlo** y **Comprobaciones** (lo verificado y lo que no se ha podido verificar).

## SvelteKit 3: diferencias con la documentación antigua

Muchos ejemplos de internet son de SvelteKit 1/2 y aquí no funcionan:

- **Variables de entorno:** se declaran en [`src/env.ts`](src/env.ts) con `defineEnvVars` (de `@sveltejs/kit/env`) y se importan desde `$app/env/public` o `$app/env/private`. `$env/static/*` ya no existe. Las variables `static: true` se fijan al arrancar: hay que reiniciar `dev` al cambiar `.env`.
- **Tipos de hooks:** `Handle` y `sequence` vienen de `@sveltejs/kit/hooks`, no de `@sveltejs/kit`.
- **`SubmitFunction`** viene de `$app/forms`.
- **Opciones de enlaces:** `data-sveltekit-noscroll` se sustituye por `data-sveltekit-reset="false"`.
- **Enlaces internos:** ESLint (`svelte/no-navigation-without-resolve`) exige `href={resolve('/ruta')}` de `$app/paths`. `resolve` admite parámetros y query: `resolve('/entries/[slug]', { slug })`, ``resolve(`/?tipo=${key}`)``.
- **Alias `#lib`:** es un subpath import de `package.json` y **requiere extensión**: `import … from '#lib/entries.ts'`.
- **Acciones:** usa `export const actions = { … } satisfies Actions` (no `: Actions`) para que `form` quede tipado en la página.

## Supabase

- **Esquema:** solo con migraciones en [`supabase/migrations/`](supabase/migrations), nombradas `AAAAMMDDHHMMSS_descripcion.sql`. **Nunca edites una migración existente**: ya están aplicadas en producción; crea una nueva. Claude no tiene acceso a la base de datos: el usuario las ejecuta a mano en el SQL Editor, así que hay que decírselo en la PR.
- **`PUBLIC_SUPABASE_URL`** es la URL base del proyecto, **sin** `/rest/v1/`.
- **Clientes:**
  - Servidor: `locals.supabase`, creado en [`hooks.server.ts`](src/hooks.server.ts) con las cookies de la sesión.
  - Navegador: `getBrowserSupabase()` de [`src/lib/supabase.ts`](src/lib/supabase.ts). Solo para subir fotos directamente a Storage.
- **Sesión:** `locals.user`, `locals.session` y `locals.role` (`'reader' | 'superadmin' | null`) se rellenan en los hooks. Usa `safeGetSession()`, que valida el JWT con `getUser()`; nunca te fíes solo de `getSession()`.
- **Sin tipos generados:** todavía no hay tipos de `supabase gen types`. Los tipos del dominio están escritos a mano en [`src/lib/entries.ts`](src/lib/entries.ts) y hay que mantenerlos en sintonía con las migraciones.

### Seguridad: la regla la pone RLS

| Entrada                 | Sin sesión | `reader` | `superadmin` |
| ----------------------- | :--------: | :------: | :----------: |
| `draft`                 |     —      |    —     |      ✓       |
| `published` + `private` |     —      |    ✓     |      ✓       |
| `published` + `public`  |     ✓      |    ✓     |      ✓       |

- **RLS es la fuente de verdad.** Cada visitante recibe lo que RLS le deja leer. Si una consulta devuelve menos filas de las esperadas, piensa primero en RLS.
- **Protección extra sin sesión:** la portada y `/entries/[slug]` también filtran `visibility = 'public'` cuando no hay sesión. Se añadió después de que una política mal configurada en producción mostrara entradas privadas a visitantes anónimos. No lo quites.
- **Comprobar RLS de verdad:** consulta la API REST con la publishable key y sin sesión (`curl "$URL/rest/v1/entries?select=slug,status,visibility" -H "apikey: $KEY"`), o en SQL con `set role anon;`. Las políticas que están en producción pueden no coincidir con las migraciones si alguna no se aplicó o se tocó desde el panel.
- **`es_admin()`** (SQL) devuelve `true` para el rol `superadmin`. Todas las políticas de escritura lo usan.
- **Tablas de detalle y `entry_images`:** sus políticas de lectura usan `exists (select 1 from entries …)`. Esa subconsulta pasa por la RLS de `entries`, así que heredan su visibilidad.
- **En la app,** `/admin` está protegido en los hooks, y eso cubre páginas y acciones. Una acción fuera de `/admin` que escriba datos (por ejemplo en `/entries/[slug]`) **debe comprobar `locals.role === 'superadmin'` por sí misma**.
- **Escrituras bloqueadas:** cuando RLS bloquea un `update` o `delete`, no da error: afecta a 0 filas. Añade `.select('id')` y comprueba que vuelve algo.
- **Roles:** nadie puede cambiar su rol desde la app, porque `profiles` no tiene política de `update`.

## Arquitectura

- **[`src/lib/entries.ts`](src/lib/entries.ts)** es la fuente única del modelo: tipos de entrada (`ENTRY_TYPES`), tabla de detalle de cada uno y sus campos. De ahí salen el formulario de admin, la validación, la ficha de la entrada y los filtros de la portada. Un tipo o campo nuevo se añade aquí, además de en una migración.
- **Detalles 1:1:** cada entrada tiene una fila en la tabla de detalle de su `type`. PostgREST la embebe como objeto o `null`, no como lista.
- **[`src/lib/server/entry-input.ts`](src/lib/server/entry-input.ts):** validación compartida por el formulario y la importación de Markdown ([`markdown-import.ts`](src/lib/server/markdown-import.ts), frontmatter YAML). Si cambias reglas, actualiza sus tests (`*.spec.ts`).
- **Creación en dos pasos:** se inserta en `entries` y luego en la tabla de detalle. Si falla lo segundo, se borra la entrada; no hay transacción.
- **Fotos** ([`src/lib/images.ts`](src/lib/images.ts)): el navegador las reduce a 2000 px en JPEG y las sube directamente al bucket privado `entry-images`, con la ruta `<entry_id>/<uuid>.jpg`. **No las pases por el servidor de la app**: Vercel corta las peticiones de más de 4,5 MB. El servidor las sirve con URLs firmadas de una hora (`signImagePaths`). La primera por `position` es la portada.
- **Markdown:** `entries.body` se convierte a HTML en el servidor con `marked` y se pinta con `{@html}`. Es aceptable porque solo los superadmins escriben. Si algún día escribe más gente, hay que sanear el HTML.
