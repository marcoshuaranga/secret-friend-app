# PLAN — Secret Friend v1

Plan de construcción de la aplicación completa. El **qué** está en [`PRD.md`](./PRD.md) y el **cómo** en [`AGENTS.md`](./AGENTS.md); este archivo ordena el trabajo en fases y define cuándo cada una está terminada.

> Todo se trabaja en `main` (trunk-based). Cada tarea termina con `pnpm verify` en verde y un commit pequeño. Las fases se entregan en orden porque cada una se apoya en la anterior. Dentro de una fase, primero el escenario Gherkin y después el código.

## Decisiones que guían el plan (confirmadas el 2026-11-21)

1. **El organizador administra el evento** desde un panel propio: ve quién ya eligió nombre y quién ya vio su resultado (nunca las asignaciones), libera nombres, edita los datos del evento y lo elimina.
2. **La ruleta se gira todas las veces que se quiera**, con una puesta en escena de casino. El resultado es siempre el mismo porque viene del servidor (RF-9 y RF-13 no cambian).
3. **El dispositivo es la sesión.** No hay cuentas, así que la identidad es una **huella del dispositivo**: un token aleatorio que el servidor entrega al elegir el nombre, que se guarda en el navegador y que se envía en cada solicitud. Ver la decisión técnica abajo.

### Huella del dispositivo: token aleatorio, no *fingerprinting* del navegador

La huella se implementa como un **token aleatorio de dispositivo** (256 bits) y no como un *fingerprint* calculado a partir del navegador (canvas, fuentes, user agent, etc.). Razones:

- **Privacidad (bloqueante)**: dos teléfonos del mismo modelo y versión dan la misma huella. Safari reduce a propósito la información que expone, así que dos iPhone iguales del mismo grupo serían indistinguibles y uno podría ver el resultado del otro. Eso rompe el requisito de privacidad del PRD.
- **Estabilidad**: la huella del navegador cambia con actualizaciones, modo oscuro o zoom, y la persona perdería su identidad sin haber hecho nada.
- **Costo y simplicidad**: un token aleatorio no necesita librerías ni cálculo, y su hash SHA-256 cabe sin problema en los 10 ms de CPU.

Cómo se guarda:

- **Cookie `HttpOnly`, `Secure`, `SameSite=Strict`** emitida por la API, con `Path=/api/events/<token>`: queda limitada a ese evento, el JavaScript no la puede leer y no se envía a otros eventos. Safari no aplica a las cookies del servidor el límite de 7 días que sí aplica al almacenamiento escrito por scripts.
- **`localStorage`** guarda solo datos para la interfaz: qué participante soy en cada evento, si ya vi la ruleta y la clave de administración si soy el organizador. Nunca es la fuente de verdad.
- En la base de datos solo se guarda el **hash SHA-256** del token.

Limitación aceptada: si la persona abre el enlace en otro navegador (por ejemplo, el navegador interno de WhatsApp y luego Safari), cuenta como otro dispositivo. La pantalla de "nombre tomado" lo explica y propone pedir al organizador que libere el nombre. El navegador interno de WhatsApp en iOS puede borrar su almacenamiento al cerrarse, así que la pantalla del resultado sugiere abrir el enlace en el navegador del sistema.

## Fase 0 — Fundaciones

| # | Tarea | Listo cuando |
|---|---|---|
| 0.1 | Conectar `@secret-friend/core` y `@secret-friend/contract` como dependencias de workspace de `apps/api` | La API importa `draw` y `parseWith` y el build los empaqueta |
| 0.2 | Instalar `wrangler` en `apps/api` y añadir los scripts `dev` (`wrangler dev`) y `db:migrate:local` | `pnpm --filter api dev` levanta el Worker con D1 local y sirve `apps/web/dist` |
| 0.3 | ~~CI en GitHub Actions~~ **Hecho** (`.github/workflows/ci.yml`) | Confirmar que la última ejecución está en verde |
| 0.4 | Infraestructura de pruebas de la API: Cucumber ejecutando la app Hono con `app.request()` y un D1 local de `getPlatformProxy()` de wrangler | Un escenario de `GET /api/health` pasa |

## Fase 1 — Dominio puro (`packages/core`)

Todo lo que es regla del negocio, sin E/S, probado con escenarios Gherkin y con aleatoriedad y reloj inyectados.

| # | Tarea | RF |
|---|---|---|
| 1.1 | Validación de entrada: ya existe en `@secret-friend/contract` (recorte, largos, 3–50, únicos sin distinguir mayúsculas). Falta: que la unicidad ignore también tildes ("Ana" = "Aná"), añadir los esquemas de las rutas de administración y que la UI reutilice los mismos esquemas | RF-1 |
| 1.2 | Ya existe: sorteo sin puntos fijos, uniforme | RF-11, RF-12 |
| 1.3 | Reglas de reclamo como funciones puras: libre → tomado, tomado por mí → idempotente, tomado por otro → error `NAME_TAKEN` | RF-4, RF-5 |
| 1.4 | Vencimiento: `expiresAt = createdAt + 90 días`; un evento vencido equivale a inexistente | PRD §6 |
| 1.5 | Secuencia de la ruleta: dado el resultado, la lista de los demás y una semilla, genera la tira de nombres que pasa por la ruleta (sin el propio, con "casi aciertos" antes de detenerse en el resultado). Es pura, así que la UI solo anima | RF-8, RF-9 |

## Fase 2 — API (`apps/api`)

Rutas Hono finas: validan en el borde con los esquemas Zod Mini de `@secret-friend/contract` (`parseWith`), llaman al núcleo y a un repositorio con currying (`crearRepo(db)`), y traducen los errores `Result` a HTTP. Tokens de 256 bits en base64url; en D1 solo sus hashes SHA-256.

### Cambios de esquema (migración `0001`)

- `participants.revealed_at` (integer, nullable): primera vez que vio su resultado; alimenta el panel del organizador y la métrica del PRD.
- Nada más. La clave de administración se busca por el token del evento y se compara contra su hash, sin índice nuevo.

### Rutas

| Método | Ruta | Auth | Función | RF |
|---|---|---|---|---|
| POST | `/api/events` | — | Valida, sortea, guarda en un `batch` de D1. Devuelve `eventToken` y `adminKey` (una única vez) | RF-1, RF-2, RF-13 |
| GET | `/api/events/:token` | — | Nombre, fecha, presupuesto y participantes con `id`, `name`, `taken`. Si la cookie corresponde, `me` | RF-4, RF-5 |
| POST | `/api/events/:token/claim` | — | `{ participantId }`. Emite la cookie del dispositivo. 409 si otro dispositivo ya lo tiene | RF-4, RF-5, RF-6 |
| GET | `/api/events/:token/result` | cookie | Solo el nombre de mi amigo secreto. La primera vez marca `revealed_at` | RF-8, RF-9 |
| GET | `/api/events/:token/admin` | `Authorization: Bearer <adminKey>` | Participantes con `claimed` y `revealed`, sin asignaciones | Admin |
| DELETE | `/api/events/:token/participants/:id/claim` | admin | Libera el nombre: borra el hash del reclamo y `revealed_at` | Admin |
| PATCH | `/api/events/:token` | admin | Edita nombre, fecha y presupuesto. Los participantes no se editan: cambiarlos rompería el sorteo | Admin |
| DELETE | `/api/events/:token` | admin | Borra el evento y todo en cascada | Admin |

Respuestas de error uniformes `{ error: "<CODIGO>" }` (con `issues: [{ path, message }]` de `parseWith` cuando es `INVALID_INPUT`): `INVALID_INPUT`, `NOT_FOUND` (también si venció), `NAME_TAKEN`, `NOT_CLAIMED`, `UNAUTHORIZED`. Comparaciones de hashes en tiempo constante. `Cache-Control: no-store` en todo `/api/*`.

### Escenarios Gherkin de la API

`crear-evento.feature`, `elegir-nombre.feature` (incluye "nombre tomado por otro dispositivo"), `ver-resultado.feature` (incluye "nadie ve el resultado de otro"), `administrar.feature`, `vencimiento.feature`.

## Fase 3 — Interfaz base (`apps/web`)

Astro estático, sin islas. Un cliente de API tipado (`src/lib/api.ts`) compartido por los `<script>`; textos en un único módulo `src/i18n/es.ts` para la i18n futura.

| # | Pantalla | Ruta | Detalle |
|---|---|---|---|
| 3.1 | Layout y sistema visual | — | Tema festivo, tipografía, colores tokenizados, modo oscuro, 360–430 px primero. Añadir con Starwind lo que haga falta (`dialog`, `badge`, `alert`, `toast`) |
| 3.2 | Crear evento | `/` | Formulario con lista dinámica de nombres (agregar con Enter, pegar varios separados por línea o coma, quitar), validación en vivo con las mismas reglas del núcleo |
| 3.3 | Evento creado | `/` (estado tras crear) | Enlace para participantes con copiar y `navigator.share`; enlace de administración aparte con advertencia de guardarlo. La clave se guarda también en `localStorage` |
| 3.4 | Elegir nombre | `/e?t=<token>` | Lista tocable libre/tomado, confirmación "¿Eres Ana?", y redirección a la ruleta si este dispositivo ya eligió |
| 3.5 | Errores | `/e`, `/404` | Enlace inválido o vencido, nombre tomado (con la explicación de "otro navegador"), sin conexión |

## Fase 4 — Ruleta de casino

Custom element `<sf-roulette>` con la secuencia de la fase 1.5. Sin dependencias salvo `canvas-confetti`.

- **Gesto**: arrastrar hacia abajo como la palanca de una tragamonedas; la fuerza del swipe define la velocidad inicial. Botón "Girar" equivalente (RF-7).
- **Movimiento**: carrete vertical con `transform` y `requestAnimationFrame`, desaceleración con curva de frenado, "casi aciertos" y un rebote final en el resultado.
- **Puesta en escena**: luces de marquesina parpadeando alrededor del carrete, tic sonoro en cada nombre que pasa (Web Audio, **silenciado por defecto** con un botón para activarlo), vibración corta al detenerse, confeti y nombre destacado (RF-10).
- **Repetir**: botón "Girar otra vez" ilimitado; siempre cae en el mismo nombre. El resultado se pide al servidor una sola vez y se reutiliza en cada giro.
- **Revisitar** (paso 7 del PRD): si el dispositivo ya giró, se muestra directo el resultado con el botón para volver a girar.
- **Movimiento reducido**: sin carrete largo ni confeti; transición corta al resultado.
- Pantalla de resultado con fecha y presupuesto, y "Agregar al calendario" (archivo `.ics` generado en el navegador) si hay fecha.

## Fase 5 — Panel del organizador

- Ruta `/admin#<eventToken>.<adminKey>`: el fragmento `#` nunca llega al servidor ni a los registros; el script lo lee y lo envía en el encabezado `Authorization`.
- Estado por participante: libre, eligió nombre, ya vio su resultado; progreso "5 de 8 ya vieron su amigo secreto".
- Acciones: liberar nombre (con confirmación), editar nombre/fecha/presupuesto, volver a copiar los enlaces y eliminar el evento (confirmación escribiendo el nombre).
- Si el organizador abre el enlace del evento en el dispositivo donde lo creó, ve un acceso al panel.

## Fase 6 — Despliegue y operación

| # | Tarea |
|---|---|
| 6.1 | Crear la base D1 de producción, reemplazar `database_id`, aplicar las migraciones |
| 6.2 | Primer `wrangler deploy` y comprobar que solo `/api/*` despierta al Worker (las páginas no deben contar solicitudes) |
| 6.3 | Despliegue continuo desde `main` (Workers Builds o un paso de CI con un token de API de Cloudflare guardado como secreto) |
| 6.4 | Limpieza de eventos vencidos con un Cron Trigger diario (incluido en el plan gratuito) |
| 6.5 | Encabezados de seguridad para los estáticos con `_headers`: CSP sin scripts externos, `Referrer-Policy: no-referrer`, `X-Content-Type-Options` |

## Fase 7 — Calidad y cierre de v1

- Escenarios de UI con Playwright para el recorrido completo: crear, compartir, elegir nombre en dos "dispositivos" (contextos distintos), girar, revisitar, liberar desde el panel.
- Revisión de accesibilidad: foco visible, etiquetas, contraste, lectores de pantalla en la ruleta (anunciar el resultado con `aria-live`).
- Presupuesto de rendimiento: < 2 s en 4G simulado, JS por página < 30 KB comprimido.
- Prueba real con un grupo de amigos antes de darla por terminada.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Alguien elige un nombre que no es el suyo | Confirmación "¿Eres Ana?" y liberación desde el panel |
| Se pierde la identidad del dispositivo (otro navegador, datos borrados) | Mensaje claro y liberación por el organizador |
| El organizador pierde el enlace de administración | Se guarda también en `localStorage` del dispositivo creador; se advierte al crearlo. Sin cuentas no hay recuperación posible |
| Superar límites del plan gratuito | Estáticos fuera del Worker, pocas escrituras por evento (unas 2 + 4 por participante, contando índices), CPU baja por SHA-256 |

## Fuera de v1

Exclusiones de parejas, listas de deseos, pistas anónimas, temas visuales, chat y recordatorios (PRD §10).
