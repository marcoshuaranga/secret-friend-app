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
  api/   Worker con Hono, Drizzle y Typia (build con esbuild + ttsc)
  web/   Astro estático (todo .astro, sin frameworks de UI) + Tailwind + Starwind UI
packages/
  core/  núcleo puro del dominio (sorteo) + escenarios Gherkin (`features/`)
```

- `packages/core`: TypeScript puro, sin dependencias de runtime. Se ejecuta directamente con Node 26 (type stripping; imports relativos con extensión `.ts`, sin `enum` ni parameter properties). El Worker lo consumirá como dependencia del workspace.
- `apps/api/migrations`: migraciones SQL generadas con `drizzle-kit generate`; `apps/api/wrangler.jsonc` define el Worker, los assets (`../web/dist`, con `run_worker_first` solo para `/api/*`) y el binding D1 `DB`. El `database_id` es un marcador: reemplazar al crear la base de datos.
- Pruebas: `pnpm test` (Cucumber). Estado: sorteo cubierto (RF-11, RF-12); faltan escenarios de la API y de la UI.

- **pnpm workspaces** (`apps/*`, `packages/*`). Los scripts de la raíz (`build`, `typecheck`, `check`) recorren todos los paquetes.
- **Biome** vive en la raíz y cubre todo el repo (excepto Markdown, que se edita a mano).

### Versiones y toolchain

- **Regla: usar las últimas versiones estables de todos los paquetes** (`pnpm up --latest -r`), salvo excepciones documentadas aquí.
- **Node 26** (`.nvmrc`, `engines`) y **pnpm 12**.
- pnpm 12 bloquea por defecto los scripts de instalación: solo se aprueban los necesarios en `allowBuilds` de `pnpm-workspace.yaml` (hoy, `esbuild`). Respetar también su política de antigüedad mínima de paquetes (cadena de suministro).
- **Excepción**: `apps/web` desactiva `exactOptionalPropertyTypes` porque el código generado por Starwind no lo cumple; el resto de `strictest` sigue activo. El código vendorizado de Starwind (`src/components/starwind`, `starwind.css`) se excluye de Biome.
- **Excepción**: `apps/web` usa **TypeScript 6** porque `astro check` aún no soporta TypeScript 7. `apps/api` usa TypeScript 7 (requerido por `ttsc`). Revisar al actualizar Astro.

## 3. Stack

### Backend
- TypeScript en modo `strict` (con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`).
- **Hono** (rutas), **Drizzle** (ORM sobre D1), **Typia** (validación y tipos en runtime).
- **esbuild** para empaquetar el Worker.
- **Biome** para lint y formato.
- **Typia 15 + esbuild (validado)**: Typia 15 ya no usa plugins de bundler propios; requiere `ttsc` (compilador basado en TypeScript-Go) y `@ttsc/unplugin/esbuild` en el build. `unplugin-typia` no es compatible. La primera compilación genera un binario en Go (tarda varios minutos y necesita la toolchain de Go y red); las siguientes tardan ~2 s. Hay que usar `ttsc`/`ttsx`, no `tsc`/`tsx`, para cualquier paso que ejecute el transformador.

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
- **Fail fast**: validar en el borde (Typia) y fallar pronto con errores tipados; no propagar datos sin validar.
- **Efectos en los bordes**: D1, aleatoriedad y reloj se inyectan; el núcleo (sorteo, reglas) es puro y testeable de forma determinista.
- Sin `any`; los errores esperados son valores (tipo resultado/unión), no excepciones.
- Biome es la única fuente de formato y lint; no se discute estilo fuera de su configuración.
- Buenas prácticas generales: nombres claros, módulos con una responsabilidad, sin código muerto ni comentarios que repitan el código.

## 5. Modelo de datos (borrador)

- `events(id, token, admin_token_hash, name, date, budget, created_at, expires_at)`
- `participants(id, event_id, name, claimed_at, claim_token_hash)`
- `assignments(event_id, giver_id, receiver_id)`

Tokens: aleatorios criptográficamente, largos, inadivinables; en base de datos solo se guarda su hash (SHA-256) cuando corresponda.

## 6. API (borrador)

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/events` | Crea el evento y sortea. Devuelve el enlace y la clave de administración. |
| GET | `/api/events/:token` | Datos públicos: nombre, fecha, presupuesto, participantes y cuáles están tomados. |
| POST | `/api/events/:token/claim` | Reclama un nombre; devuelve un token de dispositivo. |
| GET | `/api/events/:token/result` | Devuelve solo la asignación del participante identificado. |

## 7. Sorteo

- Permutación sin puntos fijos (*derangement*), uniforme sobre las válidas, generada una sola vez al crear el evento e inmutable.
- Función pura que recibe la lista y una fuente de aleatoriedad inyectada, para poder probarla con semillas fijas.

## 8. Skills y herramientas

- Para UX se buscarán skills existentes con una herramienta de búsqueda de skills, para ahorrar tokens y no reinventar patrones. Pendiente: la búsqueda inicial en la cuenta no encontró resultados.

## 9. Flujo de trabajo

- Desarrollar en la rama indicada por la sesión; no crear PR sin pedirlo explícitamente.
- Commits pequeños y descriptivos; cambios funcionales se reflejan primero en `PRD.md` y cambios técnicos aquí.
