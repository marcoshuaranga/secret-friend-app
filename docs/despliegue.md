# Despliegue en Cloudflare

El despliegue es **manual**: se lanza desde GitHub Actions y publica el Worker (API + web estática) en `https://secret-friend.<tu-subdominio>.workers.dev`. Todo cabe en el plan gratuito.

## Configuración inicial (una sola vez)

1. **Cuenta de Cloudflare** (gratuita) y, si es la primera vez, elegir el subdominio `*.workers.dev` en *Workers & Pages*.
2. **Base de datos D1**: *Storage & Databases → D1 → Create*, con el nombre `secret-friend`. Copiar su **Database ID**.
3. **Token de API**: *My Profile → API Tokens → Create Token → Custom token* con estos permisos de cuenta:
   - *Workers Scripts*: Edit
   - *D1*: Edit
4. **ID de cuenta**: aparece en la barra lateral de *Workers & Pages* (*Account ID*).
5. **GitHub** → *Settings → Secrets and variables → Actions*:
   - *Secrets*: `CLOUDFLARE_API_TOKEN` (el token) y `CLOUDFLARE_ACCOUNT_ID`.
   - *Variables*: `D1_DATABASE_ID` (el Database ID).
6. **Entorno `production`**: *Settings → Environments → New environment* `production`. Opcional: exigir aprobación antes de desplegar.

El repositorio no guarda ningún identificador de la cuenta: el workflow sustituye el marcador de `apps/api/wrangler.jsonc` al desplegar.

## Desplegar

*Actions → Deploy → Run workflow* (rama `main`). El workflow:

1. Comprueba que existan los secretos y la variable.
2. Ejecuta `pnpm verify`.
3. Aplica las migraciones pendientes de `apps/api/migrations` a D1.
4. Ejecuta `wrangler deploy`, que sube el Worker, los archivos de `apps/web/dist` y el Cron Trigger diario de limpieza.

## Después del primer despliegue

- Abrir la URL y crear un evento de prueba.
- Comprobar en *Workers & Pages → secret-friend → Metrics* que abrir páginas **no** suma solicitudes al Worker (solo `/api/*` debe contarse).
- Si una solicitud supera el límite de CPU del plan gratuito (10 ms), aparecerá en *Logs*; la más costosa es crear el evento o entrar con contraseña (PBKDF2). En ese caso, bajar `PASSWORD_ITERATIONS` en `apps/api/src/deps.ts`.

## Desarrollo local

```bash
pnpm build                                        # web + validación del Worker
pnpm --filter @secret-friend/api db:migrate:local # D1 local
pnpm --filter @secret-friend/api dev              # http://localhost:8787
```

Para trabajar la interfaz con recarga en caliente: `pnpm --filter @secret-friend/web dev` (redirige `/api` a `wrangler dev` en el puerto 8787).
