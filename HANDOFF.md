# HANDOFF — Secret Friend

Documento para retomar el trabajo en otra sesión. Fecha: 2026-11-21.
Lee primero [`PRD.md`](./PRD.md) (qué y por qué) y [`AGENTS.md`](./AGENTS.md) (cómo y lineamientos). Este archivo resume el estado y lo que sigue.

## 1. La idea en una línea

Amigo secreto web *mobile first*. Un enlace por evento; cada persona elige su nombre en una lista y gira una ruleta con swipe hacia abajo; al final aparece el nombre de a quién le toca, con confeti. Costo de operación cero.

## 2. Estado del repositorio

- Rama de trabajo: **`main`** (trunk-based: todo va directo a `main`, sin ramas ni PR salvo petición explícita).
- Ver `git log` para el último commit; todo se sube a `main`.
- La rama `ccr-04c706aa-saoadn` es legado de la primera sesión: quedó atrasada y no se debe usar.
- **Pendiente del usuario**: hacer de `main` la rama por defecto en GitHub (Settings → Branches → Default branch). No se pudo hacer desde la sesión. Probablemente el defecto sigue siendo `ccr-04c706aa-saoadn`.

## 3. Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Infraestructura | Cloudflare, plan gratuito (todo debe caber sin costo) |
| Despliegue | Un único Worker con Static Assets: sirve el sitio Astro estático y la API Hono bajo `/api/*` |
| Base de datos | D1 (SQLite) con Drizzle ORM |
| Frontend | Astro estático, **sin SSR**, **sin islas ni frameworks de UI**; Tailwind 4 + **Starwind UI**; interactividad con `<script>` TS y custom elements |
| Backend | TypeScript estricto, Hono, Drizzle, Typia, esbuild, Biome; estilo funcional (composición, inmutabilidad, currying, fail fast) |
| Pruebas | BDD con Cucumber/Gherkin (en español) |
| Toolchain | Node 26, pnpm 12, últimas versiones de todo salvo excepciones de `AGENTS.md` |
| Flujo | Trunk-based; ejecutar `pnpm verify` antes de cada push |
| Idioma | Producto en español |

Decisiones de producto aún **no confirmadas** (marcadas **[Supuesto]** en el PRD): nombre ya elegido queda bloqueado para otros dispositivos (RF-5), liberación por el organizador con clave de administración, expiración a 90 días, i18n futura.

## 4. Qué hay construido

```
apps/api/        Worker Hono (solo GET /api/health), esquema Drizzle, migración 0000_init.sql, wrangler.jsonc, build esbuild+ttsc
apps/web/        Astro 7 estático con Starwind UI (button, input, label, card) y una página de inicio mínima
packages/core/   Sorteo sin puntos fijos (derangement) + 9 escenarios Gherkin (36 pasos) pasando
```

- **Sorteo** (`packages/core/src/draw.ts`): puro, aleatoriedad inyectada (`secureRandomInt` para producción, `seededRandomInt` para pruebas). Baraja Fisher-Yates y descarta si alguien se toca a sí mismo. Valida 3–50 participantes y nombres únicos. Devuelve un tipo `Result`, no lanza excepciones.
- **Esquema** (`apps/api/src/db/schema.ts`): `events`, `participants`, `assignments`. Índices únicos solo en `events.token` y `(participants.event_id, name)` para gastar pocas escrituras de D1.
- **Verificación**: `pnpm verify` (Biome + typecheck + pruebas + build) pasa completo.

## 5. Cómo trabajar (importante)

```bash
export PATH=/opt/node26/bin:$PATH   # Node 26 está en /opt/node26 (si no existe, instalarlo); el Node del sistema es el 22
pnpm install
pnpm verify                          # antes de cada push
pnpm test                            # solo Cucumber (packages/core)
pnpm dlx starwind@latest add <componente>   # añadir componentes de UI
```

Si la sesión nueva no tiene `/opt/node26`, instalar Node 26 (LTS) desde nodejs.org y pnpm 12 con `npm i -g pnpm@latest`.

## 6. Trampas y hallazgos (para no repetirlos)

1. **Typia 15 + esbuild**: `unplugin-typia` NO funciona. Se usa `ttsc` + `@ttsc/unplugin/esbuild` (ver `apps/api/build.mjs`). La primera compilación genera un binario en Go y tarda varios minutos (necesita Go y red); luego ~2 s. Usar `ttsc`/`ttsx`, nunca `tsc`/`tsx`, para ejecutar el transformador. La caché `.ttsc/` está en `.gitignore`.
2. **TypeScript**: `apps/api` usa TS 7 (lo requiere `ttsc`); `apps/web` usa **TS 6** porque `astro check` no soporta TS 7.
3. **Starwind**: su código no cumple `exactOptionalPropertyTypes`, por eso `apps/web` lo desactiva; y su código vendorizado está excluido de Biome. Biome tiene falsos positivos de "import sin usar" en `.astro` (desactivados solo para esos archivos).
4. **pnpm 12** bloquea scripts de instalación: solo `esbuild` está aprobado en `allowBuilds`. pnpm añadió solo una excepción de antigüedad mínima para `@cloudflare/workers-types` (publicado el mismo día); es solo tipos, riesgo bajo.
5. **Biome no formatea Markdown** (excluido a propósito para no reescribir los documentos).
6. **Cuidado al encadenar comandos con `| tail`**: oculta el código de salida y puede dejar pasar errores de Biome. Usar `pnpm verify` y mirar su código de salida.
7. La plantilla oficial de Astro y otras descargas de GitHub pueden fallar por la red; el proyecto web se creó a mano.
8. Typia con strings: las restricciones (`tags.MinLength`, etc.) van en los tipos; el validador se genera en el build (`typia.createValidate<T>()`).

## 7. Qué sigue

El plan completo de v1, por fases y con criterios de terminado, está en [`PLAN.md`](./PLAN.md). Empezar por la fase 0 (fundaciones: core como dependencia, wrangler, CI y pruebas de la API).

## 8. Decisiones del 2026-11-21 y preguntas abiertas

- Confirmado: panel del organizador (RF-16 a RF-19), ruleta repetible con estilo casino (RF-14, RF-15) y el dispositivo como identidad (RF-6), implementado con un token aleatorio y no con *fingerprinting* del navegador (motivo en `AGENTS.md §5`).
- Abierta: exclusiones de parejas en v1 (propuesta: v2).
- CI con GitHub Actions: incluido en el plan (fase 0.3) a la espera de confirmación.

## 9. Notas sobre cómo trabaja el usuario

- Prefiere que se hagan preguntas aclaratorias breves (máx. 3) cuando falta contexto importante; si hay supuestos razonables, indicarlos y avanzar.
- Quiere el PRD solo con lo funcional y de negocio; todo lo técnico va en `AGENTS.md`.
- Quiere las últimas versiones de los paquetes, Node 26 y cero rastros de tecnologías descartadas (React).
- Responder en español.
