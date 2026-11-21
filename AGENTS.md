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

## 3. Stack

### Backend
- TypeScript en modo `strict` (con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`).
- **Hono** (rutas), **Drizzle** (ORM sobre D1), **Typia** (validación y tipos en runtime).
- **esbuild** para empaquetar el Worker.
- **Biome** para lint y formato.
- **Typia 15 + esbuild (validado)**: Typia 15 ya no usa plugins de bundler propios; requiere `ttsc` (compilador basado en TypeScript-Go) y `@ttsc/unplugin/esbuild` en el build. `unplugin-typia` no es compatible. La primera compilación genera un binario en Go (tarda varios minutos y necesita la toolchain de Go y red); las siguientes tardan ~2 s. Hay que usar `ttsc`/`ttsx`, no `tsc`/`tsx`, para cualquier paso que ejecute el transformador.

### Frontend
- **Astro** (estático), **Tailwind**, **shadcn/ui** como sistema de UI.
- Iconos SVG: **[Supuesto]** `lucide`.
- **Biome** para lint y formato.
- **[Supuesto]** shadcn/ui es para React: las islas interactivas (selección de nombre y ruleta) usan React, hidratadas solo donde hacen falta.
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
