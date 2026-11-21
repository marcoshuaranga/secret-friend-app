# HANDOFF — Secret Friend

Documento para retomar el trabajo en otra sesión. Fecha: 2026-11-21.
Lee primero [`PRD.md`](./PRD.md) (qué y por qué) y [`AGENTS.md`](./AGENTS.md) (cómo y lineamientos). Este archivo resume el estado y lo que sigue.

## 1. La idea en una línea

Amigo secreto web *mobile first*. Un enlace por evento; cada persona elige su nombre en una lista y gira una ruleta con swipe hacia abajo; al final aparece el nombre de a quién le toca, con confeti. Costo de operación cero.

## 2. Estado del repositorio

- Rama de trabajo: **`main`** (trunk-based: todo va directo a `main`, sin ramas ni PR salvo petición explícita).
- Último commit: ver `git log` (todo está subido a `main`, árbol de trabajo limpio al cierre de la sesión).
- La rama `ccr-04c706aa-saoadn` es legado de la primera sesión: quedó atrasada y no se debe usar.
- **Pendiente del usuario**: hacer de `main` la rama por defecto en GitHub (Settings → Branches → Default branch). No se pudo hacer desde la sesión. Probablemente el defecto sigue siendo `ccr-04c706aa-saoadn`.

## 3. Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Infraestructura | Cloudflare, plan gratuito (todo debe caber sin costo) |
| Despliegue | Un único Worker con Static Assets: sirve el sitio Astro estático y la API Hono bajo `/api/*` |
| Base de datos | D1 (SQLite) con Drizzle ORM |
| Frontend | Astro estático, **sin SSR**, **sin islas ni frameworks de UI**; Tailwind 4 + **Starwind UI**; interactividad con `<script>` TS y custom elements |
| Backend | TypeScript estricto, Hono, Drizzle, **Zod Mini** (`zod/mini`, único punto de entrada permitido), wrangler, Biome; estilo funcional (composición, inmutabilidad, currying, fail fast) |
| Pruebas | BDD con Cucumber/Gherkin (en español) |
| Toolchain | Node 26, pnpm 12, últimas versiones de todo salvo excepciones de `AGENTS.md` |
| Flujo | Trunk-based; ejecutar `pnpm verify` antes de cada push |
| Idioma | Producto en español |

Todas las decisiones de producto están confirmadas; el resumen está en `PLAN.md` ("Decisiones cerradas").

## 4. Qué hay construido

La v1 completa de `PLAN.md` está implementada y probada. Solo falta lo que depende del usuario: la cuenta de Cloudflare y el primer despliegue (ver §7).

```
apps/api/           Worker Hono con toda la API (PLAN §2), D1 + Drizzle, cron de limpieza, 27 escenarios
apps/web/           Astro estático: inicio/Mis eventos, crear, elegir nombre, ruleta, resultado, panel, 404
apps/e2e/           4 escenarios de punta a punta con Playwright contra wrangler dev
packages/core/      sorteo, reglas de reclamo, límite de contraseña, vencimiento y tira de la ruleta (22 escenarios)
packages/contract/  esquemas Zod Mini y tipos de respuesta compartidos por API y web (13 escenarios)
docs/despliegue.md  pasos para Cloudflare y GitHub
```

- **Calidad medida** (local): carga < 0,8 s en 4G simulado; ~20 KB de JS comprimido en todo el sitio; botones con nombre accesible; modo oscuro y movimiento reducido revisados.
- **Verificación**: `pnpm verify` y `pnpm test:e2e` pasan; el CI de GitHub ejecuta ambos.

## 5. Cómo trabajar (importante)

```bash
export PATH=/opt/node26/bin:$PATH   # Node 26 está en /opt/node26 (si no existe, instalarlo); el Node del sistema es el 22
pnpm install
pnpm verify                          # antes de cada push
pnpm test                            # Cucumber: core, contract y API (D1 local)
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm test:e2e   # UI de punta a punta
pnpm dlx starwind@latest add <componente>   # añadir componentes de UI
```

Si la sesión nueva no tiene `/opt/node26`, instalar Node 26 (LTS) desde nodejs.org y pnpm 12 con `npm i -g pnpm@latest`.

## 6. Trampas y hallazgos (para no repetirlos)

1. **Validación con Zod Mini**: solo `zod/mini`. Biome bloquea `zod`, `zod/v4` y `zod/v3` (`noRestrictedImports` en `biome.json`). Los esquemas viven en `packages/contract`. En `zod/mini` los límites van en `.check(z.minLength(..), z.trim(), ...)`, no como métodos encadenados.
2. **TypeScript**: `apps/api`, `core` y `contract` usan TS 7; `apps/web` usa **TS 6** porque `astro check` no soporta TS 7.
3. **Starwind**: su código no cumple `exactOptionalPropertyTypes`, por eso `apps/web` lo desactiva; y su código vendorizado está excluido de Biome. Biome tiene falsos positivos de "import sin usar" en `.astro` (desactivados solo para esos archivos).
4. **pnpm 12** bloquea scripts de instalación: solo `esbuild` y `workerd` están aprobados en `allowBuilds`. pnpm añadió solo una excepción de antigüedad mínima para `@cloudflare/workers-types` (publicado el mismo día); es solo tipos, riesgo bajo.
5. **Biome no formatea Markdown** (excluido a propósito para no reescribir los documentos).
6. **Cuidado al encadenar comandos con `| tail`**: oculta el código de salida y puede dejar pasar errores de Biome. Usar `pnpm verify` y mirar su código de salida.
7. La plantilla oficial de Astro y otras descargas de GitHub pueden fallar por la red; el proyecto web se creó a mano.
8. Los errores de validación de Zod se convierten en `{ path, message }`; `path` usa puntos (p. ej. `participants.2`).
9. **`wrangler dev` deja de servir la web si se recompila** `apps/web/dist` mientras corre: reiniciarlo.
10. **`World` de Cucumber ya tiene `link`, `attach` y `log`**: no usar esos nombres como propiedades del mundo.
11. **Playwright**: el paquete usa la última versión; el Chromium preinstalado de la sesión puede ser de otra versión, por eso existe `PLAYWRIGHT_CHROMIUM_PATH`.

## 7. Qué sigue

1. **Usuario**: configurar Cloudflare y GitHub según `docs/despliegue.md` y lanzar *Actions → Deploy*.
2. **Usuario**: hacer de `main` la rama por defecto en GitHub.
3. Tras el primer despliegue: comprobar en las métricas que solo `/api/*` cuenta solicitudes y que crear evento / entrar con contraseña no superan los 10 ms de CPU (si pasa, bajar `PASSWORD_ITERATIONS`).
4. Prueba real con un grupo de amigos; lo que surja se registra primero en el PRD.

## 8. Decisiones del 2026-11-21

No quedan preguntas abiertas. Resumen en `PLAN.md` ("Decisiones cerradas"): panel del organizador, ruleta de un solo giro estilo casino, estilo neutro y moderno, identidad híbrida (ID aleatorio del dispositivo + *fingerprint* solo como pista + contraseña del organizador), 90 días, i18n preparada, Playwright, despliegue manual con GitHub Actions, exclusiones en v2.

## 9. Notas sobre cómo trabaja el usuario

- Prefiere que se hagan preguntas aclaratorias breves (máx. 3) cuando falta contexto importante; si hay supuestos razonables, indicarlos y avanzar.
- Quiere el PRD solo con lo funcional y de negocio; todo lo técnico va en `AGENTS.md`.
- Quiere las últimas versiones de los paquetes, Node 26 y cero rastros de tecnologías descartadas (React).
- Responder en español.
