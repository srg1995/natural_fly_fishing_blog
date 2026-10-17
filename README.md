# Natural Fly Fishing

Blog personal de pesca a mosca: montajes de moscas, entrenamientos, campeonatos y días de pesca libre.
Uso limitado: solo pueden entrar usuarios creados a mano en Supabase.

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
2. Si va a poder gestionar entradas, dale permisos de administrador:

   ```sql
   insert into profiles (id, is_admin)
   select id, true from auth.users where email = 'tu@email.com';
   ```

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
- `entries.status` es `draft` o `published`.
- `profiles` marca qué usuarios son administradores (`is_admin`).

### Seguridad (RLS)

- Cualquiera puede leer las entradas `published` y sus detalles. Solo los administradores ven los borradores.
- Solo los administradores (`es_admin()`) pueden crear, editar o borrar.
- Además, la app exige iniciar sesión para ver cualquier página salvo `/login`.

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

## Recrear el scaffold

El proyecto se generó con:

```sh
bun x sv@1.1.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" tailwindcss="plugins:typography,forms" enhanced-img sveltekit-adapter="adapter:vercel" --install bun natural_fly_fishing
```
