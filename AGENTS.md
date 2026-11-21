# AGENTS.md — Secret Friend

Guía técnica y lineamientos para quien programe en este repositorio (personas o agentes).
El **qué** y el **por qué** viven en [`PRD.md`](./PRD.md); aquí vive el **cómo**.
Si algo contradice al PRD en lo funcional, gana el PRD.

> Los puntos marcados con **[Supuesto]** no fueron confirmados y deben validarse.

## 1. Restricción principal: costo cero

Proyecto por diversión entre amigos. Toda la infraestructura debe caber en **planes gratuitos** y ninguna decisión puede introducir costos fijos. Si un límite gratuito se supera, las operaciones fallan (no cobran), pero conviene diseñar lejos del límite.

Límites relevantes del plan gratuito de Cloudflare (verificados por búsqueda; revisar la documentación oficial antes de depender de ellos):

| Recurso | Límite gratuito |
|---|---|
| Archivos estáticos | Gratis e ilimitados (hasta 20.000 archivos, 25 MiB c/u) |
| Solicitudes al Worker | 100.000 al día (reinicio 00:00 UTC) |
| CPU por solicitud | 10 ms (esperar a la red no cuenta) |
| D1, filas leídas | 5 millones al día |
| D1, filas escritas | 100.000 al día (cada índice suma una escritura) |
| D1, almacenamiento | 500 MB por base de datos, 5 GB por cuenta |

Consecuencias de diseño:
- Hashes **rápidos (SHA-256)** para tokens aleatorios largos; nada de bcrypt/argon2 (riesgo de pasar los 10 ms de CPU).
- **Pocos índices**: basta el `token` del evento y las claves foráneas necesarias.
- El frontend es estático para no consumir solicitudes del Worker al abrir páginas.

## 2. Arquitectura

- **Infraestructura**: Cloudflare, plan gratuito.
- **Un único Worker con Static Assets**: sirve el sitio Astro estático y la API (Hono) bajo `/api/*`. El Worker solo debe ejecutarse para `/api/*`; todo lo demás se sirve como archivo estático.
- **Base de datos**: **D1** (SQLite) con **Drizzle ORM**.
- **Frontend**: Astro con salida estática (`output: 'static'`). **Sin SSR** (decisión confirmada). La página del evento es un cascarón que carga datos desde la API; la vista previa al compartir el enlace es genérica.
- **Enlace del evento**: una sola página para todos los eventos con el token en la query, p. ej. `/e?t=<token>`. No se generan páginas por evento ni se recompila al crear uno.
- **Por qué hay servidor**: el sorteo y la privacidad lo exigen; si las asignaciones llegaran al navegador, cualquiera podría verlas. La API solo devuelve a cada participante **su propia** asignación.

### Estructura del monorepo

```
apps/
  api/   Worker con Hono y Drizzle (build con esbuild)
  web/   Astro estático (todo .astro, sin frameworks de UI) + Tailwind + Starwind UI
packages/
  core/      núcleo puro del dominio (sorteo) + escenarios Gherkin (`features/`)
  contract/  contrato de la API: esquemas Zod Mini compartidos por api y web + escenarios Gherkin
```

- `packages/core`: TypeScript puro, sin dependencias de runtime. Se ejecuta directamente con Node 26 (type stripping; imports relativos con extensión `.ts`, sin `enum` ni parameter properties). El Worker lo consumirá como dependencia del workspace.
- `packages/contract`: única fuente de los esquemas de entrada de la API (`createEventSchema`, `claimSchema`, `eventTokenSchema`) y de sus tipos (`z.infer`). Reutiliza los límites de `core` (3–50 participantes). Expone `parseWith(schema)(entrada)`, que devuelve un `Result` en lugar de lanzar. El API valida con él en el borde y el frontend puede importar los mismos tipos.
- `apps/api/migrations`: migraciones SQL generadas con `drizzle-kit generate`; `apps/api/wrangler.jsonc` define el Worker, los assets (`../web/dist`, con `run_worker_first` solo para `/api/*`) y el binding D1 `DB`. El `database_id` es un marcador: reemplazar al crear la base de datos.
- Pruebas: `pnpm test` (Cucumber). Estado: sorteo (RF-11, RF-12) y validación de la creación de eventos (RF-1) cubiertos; faltan escenarios de la API y de la UI.

- **pnpm workspaces** (`apps/*`, `packages/*`). Los scripts de la raíz (`build`, `typecheck`, `check`) recorren todos los paquetes.
- **Biome** vive en la raíz y cubre todo el repo (excepto Markdown, que se edita a mano).

### Versiones y toolchain

- **Regla: usar las últimas versiones estables de todos los paquetes** (`pnpm up --latest -r`), salvo excepciones documentadas aquí.
- **Node 26** (`.nvmrc`, `engines`) y **pnpm 12**.
- pnpm 12 bloquea por defecto los scripts de instalación: solo se aprueban los necesarios en `allowBuilds` de `pnpm-workspace.yaml` (hoy, `esbuild`). Respetar también su política de antigüedad mínima de paquetes (cadena de suministro).
- **Excepción**: `apps/web` desactiva `exactOptionalPropertyTypes` porque el código generado por Starwind no lo cumple; el resto de `strictest` sigue activo. El código vendorizado de Starwind (`src/components/starwind`, `starwind.css`) se excluye de Biome.
- **Excepción**: `apps/web` usa **TypeScript 6** porque `astro check` aún no soporta TypeScript 7. `apps/api`, `packages/core` y `packages/contract` usan TypeScript 7. Revisar al actualizar Astro.

## 3. Stack

### Backend
- TypeScript en modo `strict` (con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`).
- **Hono** (rutas), **Drizzle** (ORM sobre D1), **Zod Mini** (validación y tipos en runtime).
- **esbuild** para empaquetar el Worker.
- **Biome** para lint y formato.
- **Validación: solo `zod/mini`** (API funcional y tree-shakable, bundle pequeño para el Worker y el navegador). Se usa `import * as z from "zod/mini"` y `z.safeParse(schema, dato)`; los límites se expresan con `.check(z.minLength(…), z.maxLength(…), z.regex(…), z.refine(…))` y los opcionales con `z.optional(…)`. **Prohibido** importar `zod`, `zod/v4` o `zod/v3`: Biome lo bloquea con `noRestrictedImports`. Los esquemas viven únicamente en `packages/contract`.

### Frontend
- **Astro** (estático), **Tailwind 4** y **Starwind UI** como sistema de UI (componentes `.astro` copiados a `src/components/starwind`, gestionados con `pnpm dlx starwind@latest add <componente>`).
- **Todo Astro, sin islas**: no se usa ningún framework de UI. Está prohibido añadir directivas `client:*` o integraciones de frameworks de componentes. La interactividad se escribe con `<script>` (TypeScript) en componentes `.astro` y **custom elements** (Web Components) para piezas reutilizables como la ruleta y el selector de nombre. Los datos del servidor llegan por atributos `data-*`; el estado compartido, si hace falta, con Nano Stores.
- Iconos SVG: los que trae Starwind (`@tabler/icons`), renderizados como SVG sin JS.
- **Biome** para lint y formato.
- Animación de la ruleta en CSS/JS propio; confeti con una librería ligera (p. ej. `canvas-confetti`).

### Pruebas (BDD)
- **Cucumber** con Gherkin; los escenarios viven en archivos `.feature` y describen comportamiento (crear evento, elegir nombre, girar la ruleta, nadie se toca a sí mismo).
- **[Supuesto]** Escenarios de UI con Playwright; escenarios de sorteo y API directamente contra la app Hono, sin navegador.
- Todo cambio de comportamiento parte de un escenario Gherkin que referencie el requisito del PRD (RF-n).

## 4. Lineamientos de código

- **Composición de funciones**: funciones pequeñas, puras y componibles.
- **Inmutabilidad**: `readonly`, `as const`, sin mutar argumentos ni estado compartido.
- **Currying** para fijar dependencias y configuración (p. ej. `crearRepo(db)(...)`).
- **Fail fast**: validar en el borde (Zod Mini) y fallar pronto con errores tipados; no propagar datos sin validar.
- **Efectos en los bordes**: D1, aleatoriedad y reloj se inyectan; el núcleo (sorteo, reglas) es puro y testeable de forma determinista.
- Sin `any`; los errores esperados son valores (tipo resultado/unión), no excepciones.
- Biome es la única fuente de formato y lint; no se discute estilo fuera de su configuración.
- Buenas prácticas generales: nombres claros, módulos con una responsabilidad, sin código muerto ni comentarios que repitan el código.

## 5. Modelo de datos

- `events(id, token, admin_token_hash, name, date, budget, created_at, expires_at)`
- `participants(id, event_id, name, claimed_at, claim_token_hash, revealed_at)` (`revealed_at` llega en la migración `0001`)
- `assignments(event_id, giver_id, receiver_id)`

Tokens: aleatorios criptográficamente (256 bits, base64url), inadivinables; en base de datos solo se guarda su hash (SHA-256). La clave de administración se valida buscando el evento por su `token` y comparando hashes en tiempo constante, sin índice adicional.

### Identidad del dispositivo ("huella")

No hay sesiones de usuario: el dispositivo es la sesión (RF-6). La huella es un **token aleatorio de dispositivo** emitido por la API al reclamar un nombre, **no** un *fingerprint* del navegador. El *fingerprinting* está descartado: dos teléfonos iguales producen la misma huella (sobre todo en Safari), lo que permitiría ver el resultado de otro, y además cambia con actualizaciones del navegador.

- Se entrega como cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/events/<token>`, con vencimiento igual al del evento.
- `localStorage` guarda solo estado de la interfaz (participante elegido por evento, si ya giró y la clave de administración del organizador). Envolver todo acceso en `try/catch`; nunca es fuente de verdad.
- La clave de administración viaja en el fragmento de la URL (`/admin#<token>.<clave>`) y se envía a la API en `Authorization: Bearer`, para que no aparezca en registros ni en `Referer`.

## 6. API

| Método | Ruta | Auth | Función |
|---|---|---|---|
| POST | `/api/events` | — | Crea el evento y sortea. Devuelve el token del evento y la clave de administración. |
| GET | `/api/events/:token` | — | Datos públicos: nombre, fecha, presupuesto, participantes y cuáles están tomados; `me` si la cookie corresponde. |
| POST | `/api/events/:token/claim` | — | Reclama un nombre y emite la cookie del dispositivo. |
| GET | `/api/events/:token/result` | cookie | Solo la asignación del participante identificado; la primera vez marca `revealed_at`. |
| GET | `/api/events/:token/admin` | admin | Estado de los participantes (eligió, vio resultado), sin asignaciones. |
| DELETE | `/api/events/:token/participants/:id/claim` | admin | Libera un nombre. |
| PATCH | `/api/events/:token` | admin | Edita nombre, fecha y presupuesto. |
| DELETE | `/api/events/:token` | admin | Elimina el evento en cascada. |

Errores como `{ error: "<CODIGO>" }` (`INVALID_INPUT`, que además incluye `issues: [{ path, message }]` de `parseWith`, `NOT_FOUND`, `NAME_TAKEN`, `NOT_CLAIMED`, `UNAUTHORIZED`). Un evento vencido responde `NOT_FOUND`. Todo `/api/*` lleva `Cache-Control: no-store`. El detalle y el orden de construcción están en [`PLAN.md`](./PLAN.md).

## 7. Sorteo y ruleta

- Permutación sin puntos fijos (*derangement*), uniforme sobre las válidas, generada una sola vez al crear el evento e inmutable.
- Función pura que recibe la lista y una fuente de aleatoriedad inyectada, para poder probarla con semillas fijas.
- La ruleta se puede girar sin límite (RF-14). La secuencia de nombres que pasa por el carrete la genera una función pura del núcleo a partir del resultado y una semilla; la UI solo anima. El resultado se pide al servidor una vez y se reutiliza en cada giro.

## 8. Skills y herramientas

- Para UX se buscarán skills existentes con una herramienta de búsqueda de skills, para ahorrar tokens y no reinventar patrones. Pendiente: la búsqueda inicial en la cuenta no encontró resultados.

## 9. Flujo de trabajo

**Trunk-based development**: `main` es la única rama de trabajo y la rama por defecto del repositorio.

- Todos los cambios van **directamente a `main`**. No se crean ramas de funcionalidad ni PR salvo petición explícita.
- Commits pequeños y frecuentes, cada uno coherente y desplegable por sí solo.
- **`main` siempre debe estar en verde**: antes de cada push, ejecutar `pnpm verify` (Biome, typecheck, pruebas BDD y build). Si falla, se corrige antes de subir; no se sube código roto.
- Para trabajo incompleto visible al usuario, usar interruptores de funcionalidad o dejar el código sin enlazar, en lugar de ramas de larga vida.
- Los cambios funcionales se reflejan primero en `PRD.md` y los técnicos en este archivo, en el mismo commit que el código.
- Mensajes de commit descriptivos, en imperativo.
