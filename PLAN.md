# PLAN — Secret Friend v1

Plan de construcción de la aplicación completa. El **qué** está en [`PRD.md`](./PRD.md) y el **cómo** en [`AGENTS.md`](./AGENTS.md); este archivo ordena el trabajo en fases y define cuándo cada una está terminada.

> Todo se trabaja en `main` (trunk-based). Cada tarea termina con `pnpm verify` en verde y un commit pequeño. Las fases se entregan en orden porque cada una se apoya en la anterior. Dentro de una fase, primero el escenario Gherkin y después el código.

## Decisiones cerradas (2026-11-21)

No quedan preguntas abiertas. Cualquier cambio sobre esto se registra primero en el PRD o en AGENTS.

| Tema | Decisión |
|---|---|
| Administración | El organizador tiene un panel: estado de cada participante (nunca asignaciones), liberar nombres, editar y eliminar el evento |
| Ruleta | Se gira sin límite, siempre cae en el mismo resultado; puesta en escena de casino **solo en la pantalla de la ruleta** |
| Estilo visual | **Neutro y moderno** en el resto de la app: claro, minimalista, acentos de color, modo oscuro |
| Identidad | **Híbrida**: ID aleatorio del dispositivo como "cuenta" + *fingerprint* del navegador solo como pista de recuperación (detalle abajo) |
| Recuperar la administración | Contraseña del organizador, definida al crear el evento |
| Vencimiento | 90 días; el evento y sus datos se borran |
| Idioma | Solo español en v1, con los textos centralizados para traducir después |
| Pruebas | Cucumber para núcleo y API; Playwright para la UI |
| Despliegue | Workflow **manual** de GitHub Actions (`workflow_dispatch`) que aplica migraciones y ejecuta `wrangler deploy` |
| Dominio | `*.workers.dev` gratuito |
| Exclusiones de parejas | v2 |

### Identidad híbrida

**1. ID del dispositivo (la "cuenta").** La primera vez que un dispositivo crea un evento, elige un nombre o inicia sesión como organizador, la API genera un token aleatorio de 256 bits y lo entrega en la cookie `sf_device` (`HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=400 días`). En D1 solo se guarda su hash SHA-256. Ese ID:

- identifica al participante para ver su resultado (RF-6);
- identifica al organizador para entrar al panel sin enlaces especiales;
- alimenta **"Mis eventos"** en el inicio: los eventos que creé y en los que elegí nombre en este dispositivo.

**2. *Fingerprint* (solo pista).** El navegador calcula una huella propia, sin librerías (zona horaria, idiomas, pantalla, núcleos, memoria, puntos táctiles, *canvas* y renderizador WebGL), la reduce con SHA-256 y la envía al crear el dispositivo. Nunca autoriza nada por sí sola, porque dos teléfonos iguales pueden dar la misma huella. Solo sirve para que, si se borraron los datos o cambió de navegador en el mismo equipo, la app muestre **"¿Eres el organizador de alguno de estos eventos?"** con el nombre y la fecha de los eventos que coinciden.

**3. Contraseña del organizador (lo que autoriza).** Para entrar al panel desde un dispositivo que no es el suyo (con o sin la pista del *fingerprint*, o desde el enlace del evento con "Soy el organizador"), se pide la contraseña elegida al crear el evento. Al acertar, ese dispositivo queda como administrador además del original. Mínimo 8 caracteres, PBKDF2-SHA256 con sal y **5 intentos fallidos por hora por evento**.

**Participantes que pierden su identidad**: el nombre sigue tomado; el organizador lo libera desde el panel y la persona lo vuelve a elegir. El *fingerprint* no se usa para recuperar participantes, porque una coincidencia por error le mostraría a alguien el resultado de otro.

**Datos que viajan a la interfaz**: `localStorage` solo guarda conveniencias (sonido activado, si ya giré en este evento). La identidad vive en la cookie, que el JavaScript no puede leer.

## Fase 0 — Fundaciones

| # | Tarea | Listo cuando |
|---|---|---|
| 0.1 | Conectar `@secret-friend/core` y `@secret-friend/contract` como dependencias de workspace de `apps/api` | La API importa `draw` y `parseWith` y el build los empaqueta |
| 0.2 | Instalar `wrangler` en `apps/api` y añadir los scripts `dev` (`wrangler dev`) y `db:migrate:local` | `pnpm --filter @secret-friend/api dev` levanta el Worker con D1 local y sirve `apps/web/dist` |
| 0.3 | ~~CI en GitHub Actions~~ **Hecho** (`.github/workflows/ci.yml`) | La última ejecución está en verde |
| 0.4 | Infraestructura de pruebas de la API: Cucumber ejecutando la app Hono con `app.request()` y un D1 local de `getPlatformProxy()` de wrangler | Un escenario de `GET /api/health` pasa |
| 0.5 | Nuevo esquema de datos (abajo) y **regenerar `0000_init.sql`**: aún no existe ninguna base real, así que no hace falta migración incremental | `drizzle-kit generate` produce la migración y se aplica en local |

## Fase 1 — Dominio puro (`packages/core` y `packages/contract`)

Todo lo que es regla del negocio, sin E/S, probado con escenarios Gherkin y con aleatoriedad y reloj inyectados.

| # | Tarea | RF |
|---|---|---|
| 1.1 | Validación de entrada (ya existe en `contract`). Falta: unicidad que ignore tildes ("Ana" = "Aná"), contraseña de 8–128 caracteres en `createEventSchema`, y esquemas de *login*, recuperación y edición | RF-1, RF-21 |
| 1.2 | Ya existe: sorteo sin puntos fijos, uniforme | RF-11, RF-12 |
| 1.3 | Reglas de reclamo: libre → tomado; tomado por mí → idempotente; tomado por otro → `NAME_TAKEN`; un dispositivo solo puede tener un nombre por evento → `ALREADY_CLAIMED` | RF-4, RF-5, RF-6 |
| 1.4 | Vencimiento: `expiresAt = createdAt + 90 días`; un evento vencido equivale a inexistente | PRD §6 |
| 1.5 | Bloqueo de *login*: dado el historial de fallos y el reloj, decide si se permite intentar (5 por hora) | RF-21 |
| 1.6 | Secuencia de la ruleta: dado el resultado, los demás participantes y una semilla, genera la tira de nombres del carrete (sin el propio, con "casi aciertos" antes del resultado). Pura; la UI solo anima | RF-8, RF-9, RF-15 |

## Fase 2 — API (`apps/api`)

Rutas Hono finas: validan en el borde con `parseWith` de `contract`, llaman al núcleo y a un repositorio con currying (`crearRepo(db)`), y traducen los `Result` a HTTP. Un *middleware* `device` lee la cookie y, en las rutas que lo necesitan, crea el dispositivo si no existe.

### Esquema

- `devices(id, token_hash, fingerprint, created_at)` · índice único `token_hash`, índice `fingerprint`
- `events(id, token, name, date, budget, admin_password_hash, admin_password_salt, failed_logins, login_window_start, created_at, expires_at)` · índice único `token`
- `event_admins(event_id, device_id)` · PK `(event_id, device_id)`, índice `device_id`
- `participants(id, event_id, name, device_id, claimed_at, revealed_at)` · únicos `(event_id, name)` y `(device_id, event_id)`
- `assignments(event_id, giver_id, receiver_id)` · PK `(event_id, giver_id)`

Escrituras al crear un evento de *n* personas: unas 4 + 5·*n* contando índices (≈ 54 para 10 personas), lejos del límite diario de 100.000.

### Rutas

| Método | Ruta | Auth | Función | RF |
|---|---|---|---|---|
| POST | `/api/events` | dispositivo (se crea) | Valida, sortea y guarda en un `batch`; el dispositivo queda como admin. Devuelve `token` | RF-1, RF-2, RF-13, RF-16 |
| GET | `/api/events/:token` | — | Nombre, fecha, presupuesto, participantes (`id`, `name`, `taken`); `me` e `isAdmin` según la cookie | RF-4, RF-5 |
| POST | `/api/events/:token/claim` | dispositivo (se crea) | `{ participantId }`. 409 `NAME_TAKEN` / `ALREADY_CLAIMED` | RF-4, RF-5, RF-6 |
| GET | `/api/events/:token/result` | dispositivo | Solo el nombre de mi amigo secreto; la primera vez marca `revealed_at` | RF-8, RF-9 |
| GET | `/api/me/events` | dispositivo | "Mis eventos": creados y unidos, con su enlace | RF-20 |
| POST | `/api/recovery` | — | `{ fingerprint }` → eventos vigentes administrados por dispositivos con esa huella: solo `id`, `name`, `date` | RF-21 |
| POST | `/api/admin/login` | dispositivo (se crea) | `{ eventId, password }`. Si acierta, suma este dispositivo a `event_admins`. 429 si está bloqueado | RF-21 |
| GET | `/api/events/:token/admin` | admin | Participantes con `claimed` y `revealed`, sin asignaciones | RF-17 |
| DELETE | `/api/events/:token/participants/:id/claim` | admin | Libera el nombre (`device_id`, `claimed_at` y `revealed_at` a nulo) | RF-18 |
| PATCH | `/api/events/:token` | admin | Edita nombre, fecha y presupuesto | RF-19 |
| DELETE | `/api/events/:token` | admin | Borra el evento en cascada | RF-19 |

Errores `{ error: "<CODIGO>" }`: `INVALID_INPUT` (con `issues`), `NOT_FOUND` (también vencido), `NAME_TAKEN`, `ALREADY_CLAIMED`, `NOT_CLAIMED`, `UNAUTHORIZED`, `TOO_MANY_ATTEMPTS`. Comparaciones en tiempo constante. `Cache-Control: no-store` en todo `/api/*`.

### Escenarios Gherkin

`crear-evento`, `elegir-nombre` (incluye "tomado por otro dispositivo" y "un nombre por dispositivo"), `ver-resultado` (incluye "nadie ve el resultado de otro"), `mis-eventos`, `administrar`, `recuperar-administracion` (huella coincidente sin contraseña no da acceso; bloqueo tras 5 fallos), `vencimiento`.

## Fase 3 — Interfaz base (`apps/web`)

Astro estático, sin islas. Cliente de API tipado (`src/lib/api.ts`), textos en `src/i18n/es.ts`, huella en `src/lib/fingerprint.ts`.

| # | Pantalla | Ruta | Detalle |
|---|---|---|---|
| 3.1 | Layout y sistema visual | — | Neutro y moderno: tokens de color, tipografía, modo oscuro, 360–430 px primero. Añadir con Starwind lo necesario (`dialog`, `badge`, `alert`, `toast`) |
| 3.2 | Inicio: Mis eventos + crear | `/` | Lista de eventos del dispositivo; si no hay cookie, consulta la pista de recuperación |
| 3.3 | Crear evento | `/nuevo` | Nombre, lista dinámica de nombres (Enter, pegar varios, quitar), fecha, presupuesto y contraseña del organizador. Validación en vivo con los esquemas de `contract` |
| 3.4 | Evento creado | `/nuevo` (estado final) | Enlace para copiar y `navigator.share`; recordatorio de la contraseña |
| 3.5 | Elegir nombre | `/e?t=<token>` | Lista libre/tomado, confirmación "¿Eres Ana?", redirección a la ruleta si ya elegí; acceso "Soy el organizador" |
| 3.6 | Errores | `/e`, `/404` | Enlace inválido o vencido, nombre tomado (con la explicación de "otro navegador"), sin conexión |

## Fase 4 — Ruleta de casino

Custom element `<sf-roulette>` con la secuencia de la fase 1.6. Única dependencia: `canvas-confetti`.

- **Gesto**: arrastrar hacia abajo como la palanca de una tragamonedas; la fuerza del swipe fija la velocidad inicial. Botón "Girar" equivalente (RF-7).
- **Movimiento**: carrete vertical con `transform` y `requestAnimationFrame`, frenado progresivo, "casi aciertos" y rebote final.
- **Puesta en escena** (solo en esta pantalla): luces de marquesina, tic sonoro por nombre (Web Audio, **apagado por defecto**), vibración corta, confeti y nombre destacado (RF-10, RF-15).
- **Repetir**: "Girar otra vez" ilimitado; el resultado se pide al servidor una vez y se reutiliza (RF-14).
- **Revisitar**: si ya giré, se muestra el resultado con el botón para volver a girar.
- **Movimiento reducido**: sin carrete largo ni confeti; transición corta al resultado.
- Resultado con fecha, presupuesto y "Agregar al calendario" (`.ics` generado en el navegador).

## Fase 5 — Panel del organizador

- Ruta `/admin?t=<token>`. Si el dispositivo no es admin, pide la contraseña.
- Estado por participante: libre, eligió nombre, ya vio su resultado; progreso "5 de 8 ya vieron su amigo secreto".
- Acciones: liberar nombre (con confirmación), editar nombre/fecha/presupuesto, copiar el enlace y eliminar el evento (confirmación escribiendo el nombre).

## Fase 6 — Despliegue y operación

| # | Tarea | Quién |
|---|---|---|
| 6.1 | Crear la base D1 `secret-friend` en el panel de Cloudflare y guardar en GitHub: *secrets* `CLOUDFLARE_API_TOKEN` (permisos Workers Scripts y D1: edición) y `CLOUDFLARE_ACCOUNT_ID`; *variable* `D1_DATABASE_ID` | Usuario, con pasos que dejo escritos en `docs/despliegue.md` |
| 6.2 | Workflow manual `.github/workflows/deploy.yml` (`workflow_dispatch`): `pnpm verify`, sustituye `database_id`, `wrangler d1 migrations apply DB --remote`, `wrangler deploy` | Agente |
| 6.3 | Primer despliegue y comprobación de que solo `/api/*` despierta al Worker | Usuario lanza, agente verifica |
| 6.4 | Cron Trigger diario: borra eventos vencidos y dispositivos sin eventos | Agente |
| 6.5 | `_headers` para los estáticos: CSP sin scripts externos, `Referrer-Policy: no-referrer`, `X-Content-Type-Options` | Agente |

## Fase 7 — Calidad y cierre de v1

- Escenarios de UI con Playwright: crear, compartir, elegir nombre en dos contextos de navegador, girar varias veces, revisitar, liberar desde el panel, recuperar la administración con contraseña.
- Accesibilidad: foco visible, etiquetas, contraste, resultado anunciado con `aria-live`.
- Rendimiento: < 2 s en 4G simulado, JS por página < 30 KB comprimido.
- Prueba real con un grupo de amigos.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Alguien elige un nombre que no es el suyo | Confirmación "¿Eres Ana?" y liberación desde el panel |
| Se pierde la cookie (otro navegador, datos borrados) | Participante: liberación por el organizador. Organizador: pista por huella + contraseña |
| Dos dispositivos con la misma huella | La huella solo muestra nombre y fecha de eventos; entrar exige contraseña |
| Ataque a la contraseña | 5 intentos por hora por evento, PBKDF2 con sal |
| CPU de PBKDF2 en el plan gratuito (10 ms) | Iteraciones calibradas midiendo en el Worker (objetivo < 5 ms); el límite de intentos compensa |
| Superar límites del plan gratuito | Estáticos fuera del Worker y pocas escrituras por evento |

## Fuera de v1

Exclusiones de parejas, listas de deseos, pistas anónimas, temas visuales, chat y recordatorios (PRD §10).
