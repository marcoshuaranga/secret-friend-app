# PRD — Secret Friend (Amigo Secreto)

> Estado: borrador v0.3 · Los puntos marcados con **[Supuesto]** no fueron confirmados y deben validarse antes de implementar.

## 1. Resumen

Aplicación web *mobile first* para organizar un amigo secreto entre un grupo de personas. Existe **un solo enlace por evento**. Cada participante abre el enlace, **selecciona su propio nombre de una lista** y descubre a quién le toca regalar mediante una **ruleta de swipe hacia abajo** que termina con una revelación festiva (confeti).

## 2. Objetivos

- Que un grupo pueda hacer su amigo secreto en menos de 2 minutos, sin registro ni instalación.
- Que descubrir tu amigo secreto sea un momento divertido y memorable.
- Garantizar que nadie se saque a sí mismo y que nadie vea la asignación de otros.

### No objetivos (v1)

- Cuentas de usuario, login o perfiles.
- Chat anónimo, pistas o listas de deseos (candidatos para v2).
- Pagos, compra de regalos o integración con tiendas.
- App nativa.

## 3. Usuarios

| Rol | Descripción |
|---|---|
| **Organizador** | Crea el evento, carga la lista de nombres y comparte el enlace. |
| **Participante** | Abre el enlace, elige su nombre y gira la ruleta. El organizador también es participante. |

## 4. Flujo principal

1. **Crear evento** (organizador): ingresa nombre del evento y la lista de participantes (mínimo 3). Opcionales: fecha del intercambio y presupuesto sugerido.
2. **Sorteo**: al crear el evento se genera la asignación completa en el servidor (ver §6).
3. **Compartir**: la app muestra el enlace único del evento para copiar o compartir (WhatsApp, etc.).
4. **Elegir nombre** (participante): al abrir el enlace ve la lista de nombres y toca el suyo. Esto lo identifica y lo excluye de ser su propio amigo secreto.
5. **Ruleta**: pantalla con una ruleta/carrusel vertical de nombres. El usuario hace **swipe hacia abajo** y la ruleta gira rápido, desacelera y se detiene en su amigo secreto.
6. **Revelación**: aparece el nombre resaltado con **confeti** y animación. Se muestra el recordatorio de fecha y presupuesto si existen.
7. **Revisitar**: si vuelve a abrir el enlace en el mismo dispositivo, ve directamente su resultado (sin repetir la ruleta, aunque puede repetir la animación de forma visual con el mismo resultado).

## 5. Requisitos funcionales

### 5.1 Evento
- RF-1: Crear un evento con nombre y lista de participantes (3–50). Los nombres deben ser únicos dentro del evento.
- RF-2: Cada evento tiene un enlace único e inadivinable (token aleatorio, no secuencial).
- RF-3: El organizador puede copiar/compartir el enlace (Web Share API cuando esté disponible).

### 5.2 Selección de identidad
- RF-4: La lista muestra todos los participantes; el usuario toca el suyo y confirma ("¿Eres Ana?").
- RF-5: Un nombre ya reclamado aparece marcado como tomado y no puede elegirse desde otro dispositivo. **[Supuesto]** Esto evita que alguien espíe la asignación de otro.
- RF-6: Se recuerda la identidad en el dispositivo (localStorage/cookie) para poder volver a ver el resultado.

### 5.3 Ruleta
- RF-7: Gesto principal: **swipe hacia abajo** que dispara el giro. Alternativa accesible: botón "Girar".
- RF-8: La ruleta muestra los nombres de los demás participantes (nunca el propio) girando con inercia y desaceleración, y se detiene en el resultado real.
- RF-9: El resultado lo determina el servidor, no la animación. La ruleta es puramente visual.
- RF-10: Al terminar: confeti, vibración corta en móvil (si está disponible) y nombre destacado.

### 5.4 Sorteo
- RF-11: Nadie puede tocarse a sí mismo.
- RF-12: La asignación es un ciclo/permutación sin puntos fijos (*derangement*), con distribución uniforme sobre las válidas.
- RF-13: El sorteo se genera una sola vez y es inmutable.

## 6. Requisitos no funcionales

- **Mobile first**: diseñada para pantallas de 360–430 px; usable en escritorio.
- **Rendimiento**: carga inicial < 2 s en 4G; JS mínimo (arquitectura de islas de Astro).
- **Privacidad**: la API solo devuelve a cada participante su propia asignación. Nunca se expone la lista completa de asignaciones al cliente.
- **Accesibilidad**: respeta `prefers-reduced-motion` (sin giro largo ni confeti), contraste suficiente, alternativa al gesto swipe.
- **Idioma**: español (v1). **[Supuesto]** Preparar textos para i18n futura.
- **Sin cuentas ni datos personales** más allá de los nombres ingresados. Evento con expiración automática. **[Supuesto]** 90 días.

## 7. Enfoque técnico

### 7.1 Restricción principal: costo cero
Es un proyecto por diversión entre amigos. Toda la infraestructura debe caber en **planes gratuitos**. Ninguna decisión técnica debe introducir costos fijos.

### 7.2 Decisiones confirmadas
- **Infraestructura**: **Cloudflare**, plan gratuito.
- **Componentes**: **un único Worker con Static Assets** (sirve el sitio Astro estático y la API Hono) + **D1** como base de datos. Esto resuelve §7.3: la API vive en el mismo Worker (equivale a la opción A, sin Pages Functions).
- **Frontend**: Astro con **salida estática** (`output: 'static'`), islas interactivas solo para la ruleta y la selección de nombre. SSR queda **pendiente de decidir** (ver §12); por defecto, estático.
- **Base de datos**: **SQLite sobre D1** con **Drizzle ORM** (ver §7.4).
- **Stack detallado**: ver §7.7.

### 7.3 Dónde vive la lógica de servidor
Aunque el sitio sea estático, el sorteo y la privacidad exigen código en servidor: si las asignaciones llegaran al navegador, cualquiera podría verlas con las herramientas de desarrollo. Opciones, todas gratuitas:

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| **A. Pages Functions / Worker aparte** (recomendada) | Astro 100% estático + carpeta `functions/api/*` (o un Worker) con la API. | El frontend queda puramente estático; separación clara. | Dos piezas que mantener en el mismo repo. |
| B. Astro estático + rutas on-demand | `output: 'static'` con el adaptador `@astrojs/cloudflare` y `export const prerender = false` solo en `src/pages/api/*`. | Todo dentro de Astro; un solo proyecto. | Ya es un modo híbrido; depende del adaptador. |
| C. SSR completo | Todo renderizado en Workers. | Máxima flexibilidad. | Innecesario para este alcance; descartado por ahora. |

Las opciones A y B no cambian el frontend, así que se puede decidir durante el scaffold.

### 7.4 Proveedor de SQLite
| Proveedor | Plan gratuito | Encaje con Cloudflare + Drizzle |
|---|---|---|
| **Cloudflare D1** | Incluido en el plan gratuito de Workers. | Nativo (binding directo, sin credenciales externas). Drizzle tiene driver `d1`. |
| **Turso** | Plan gratuito con límites generosos. | Driver `libsql` de Drizzle; requiere token como secreto. |

**[Supuesto] Recomendación:** D1, porque mantiene todo en una sola cuenta y no necesita credenciales externas. Turso queda como alternativa si se quiere portabilidad fuera de Cloudflare. Con Drizzle, el cambio entre ambos afecta casi solo la configuración del cliente.

### 7.5 Esquema mínimo
- `events(id, token, admin_token_hash, name, date, budget, created_at, expires_at)`
- `participants(id, event_id, name, claimed_at, claim_token_hash)`
- `assignments(event_id, giver_id, receiver_id)`

### 7.6 Otros
- **Animación**: CSS/JS propio para la ruleta + librería ligera de confeti (p. ej. `canvas-confetti`).
- **Enlace del evento**: como el sitio es estático, el enlace usa una sola página con el token en la query o en el hash (p. ej. `/e?t=abc123` o `/e#abc123`), y la isla consulta la API. Así no hace falta generar una página por evento.

### API (borrador)
| Método | Ruta | Función |
|---|---|---|
| POST | `/api/events` | Crea evento y sortea. Devuelve el enlace. |
| GET | `/api/events/:token` | Datos públicos: nombre, fecha, lista de participantes y cuáles están tomados. |
| POST | `/api/events/:token/claim` | Reclama un nombre; devuelve un token de dispositivo. |
| GET | `/api/events/:token/result` | Devuelve solo la asignación del participante identificado. |

### 7.7 Stack y convenciones

**Backend**
- TypeScript en modo `strict` (con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`).
- **Hono** (rutas) + **Drizzle** (ORM sobre D1) + **Typia** (validación y tipos en runtime a partir de los tipos TS).
- **esbuild** para empaquetar el Worker. **[Riesgo]** Typia necesita un transformador de TypeScript; esbuild no los ejecuta, así que se usa un plugin de esbuild para Typia (p. ej. `unplugin-typia`). Hay que validarlo en el scaffold.
- **Biome** para lint y formato.
- Estilo de código: composición de funciones, inmutabilidad (`readonly`, sin mutaciones), *currying*, *fail fast* (validar en el borde y fallar pronto con errores tipados), funciones pequeñas y puras, efectos aislados en los bordes (D1, aleatoriedad, reloj).

**Frontend**
- **Astro** (estático) + **Tailwind** + **shadcn/ui** como sistema de UI.
- Librería de iconos SVG popular **[Supuesto]**: `lucide`.
- **Biome** para lint y formato.
- **[Supuesto]** shadcn/ui está pensado para React, así que las islas interactivas usarían React. Se mantiene el JS mínimo: solo se hidrata la ruleta y la selección de nombre.

**Pruebas (BDD)**
- **Cucumber** con Gherkin. Los escenarios viven en archivos `.feature` y describen el comportamiento (crear evento, elegir nombre, girar la ruleta, nadie se toca a sí mismo).
- **[Supuesto]** Pruebas de extremo a extremo con Playwright para los escenarios de UI. Los escenarios de sorteo y API pueden ejecutarse directamente contra la app Hono, sin navegador.

**Herramientas de desarrollo**
- Para UX se buscarán skills ya existentes con la herramienta de búsqueda de skills, para ahorrar tokens y no reinventar patrones.

## 8. Pantallas

1. **Home / Crear evento**: formulario simple, lista dinámica de nombres.
2. **Evento creado**: enlace para copiar/compartir.
3. **Elegir nombre**: lista tocable con estados (libre / tomado).
4. **Ruleta**: zona de swipe con indicación visual ("desliza hacia abajo").
5. **Resultado**: nombre, confeti, fecha y presupuesto.
6. **Errores**: enlace inválido/expirado, evento lleno de reclamos.

## 9. Casos borde

- Alguien elige el nombre equivocado → **[Supuesto]** el organizador puede liberar un nombre reclamado (requiere un enlace/clave de administración devuelto al crear el evento).
- Dispositivo cambiado o datos borrados → el nombre queda reclamado; se resuelve con la liberación del organizador.
- Dos personas con el mismo nombre → el organizador debe diferenciarlas (p. ej. "Ana R.").
- Mínimo de 3 participantes; con 2 el sorteo sería trivial.

## 10. Métricas de éxito

- % de eventos donde todos los participantes ven su resultado.
- Tiempo desde crear el evento hasta compartir el enlace.
- Tasa de abandono en la pantalla de selección de nombre.

## 11. Roadmap

- **v1**: crear evento, enlace único, selección de nombre, ruleta, confeti.
- **v2**: lista de deseos, pistas anónimas, exclusiones (parejas), temas visuales.
- **v3**: chat anónimo con tu amigo secreto, recordatorios.

## 12. Preguntas abiertas

1. ¿El organizador necesita un panel para ver quién ya reveló (sin ver asignaciones) y liberar nombres?
2. ¿Se permiten exclusiones (parejas que no se pueden tocar) en v1?
3. ¿Se confirma D1 como base de datos? (en el stack se escribió "R1"; se asume D1, ya que R2 es almacenamiento de objetos y no se necesita).
4. ¿SSR solo en `/e/[token]` para la vista previa al compartir, o todo estático? (§7.2)
5. ¿Se permite volver a girar la ruleta o solo una vez? (Propuesta: una vez, luego solo se muestra el resultado.)
