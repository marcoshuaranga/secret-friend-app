# PRD — Secret Friend (Amigo Secreto)

> Estado: borrador v0.1 · Los puntos marcados con **[Supuesto]** no fueron confirmados y deben validarse antes de implementar.

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

## 7. Enfoque técnico (propuesto)

- **Frontend**: Astro (requerido) con islas interactivas para la ruleta y la selección de nombre. Framework de isla **[Supuesto]**: Svelte o Preact por tamaño.
- **Backend**: endpoints de Astro en modo SSR/server (`src/pages/api/*`). El sorteo y la validación viven en el servidor.
- **Persistencia** **[Supuesto]**: base de datos ligera (SQLite/Turso o similar). Esquema mínimo:
  - `events(id, token, name, date, budget, created_at, expires_at)`
  - `participants(id, event_id, name, claimed, claim_token_hash)`
  - `assignments(giver_id, receiver_id)`
- **Animación**: CSS/JS propio para la ruleta + una librería ligera de confeti (p. ej. `canvas-confetti`).
- **Despliegue**: adaptador de Astro acorde al hosting elegido (por definir).

### API (borrador)
| Método | Ruta | Función |
|---|---|---|
| POST | `/api/events` | Crea evento y sortea. Devuelve el enlace. |
| GET | `/api/events/:token` | Datos públicos: nombre, fecha, lista de participantes y cuáles están tomados. |
| POST | `/api/events/:token/claim` | Reclama un nombre; devuelve un token de dispositivo. |
| GET | `/api/events/:token/result` | Devuelve solo la asignación del participante identificado. |

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
3. ¿Hosting y base de datos preferidos?
4. ¿Se permite volver a girar la ruleta o solo una vez? (Propuesta: una vez, luego solo se muestra el resultado.)
