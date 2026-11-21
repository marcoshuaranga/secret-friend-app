# PRD — Secret Friend (Amigo Secreto)

> Estado: borrador v0.7 · Documento funcional y de negocio. Las decisiones técnicas y lineamientos viven en [`AGENTS.md`](./AGENTS.md). Todas las decisiones están confirmadas (2026-11-21); no quedan supuestos abiertos.

## 1. Resumen

Aplicación web *mobile first* para organizar un amigo secreto entre un grupo de personas. Existe **un solo enlace por evento**. Cada participante abre el enlace, **selecciona su propio nombre de una lista** y descubre a quién le toca regalar mediante una **ruleta de swipe hacia abajo** que termina con una revelación festiva (confeti).

## 2. Objetivos

- Que un grupo pueda hacer su amigo secreto en menos de 2 minutos, sin registro ni instalación.
- Que descubrir tu amigo secreto sea un momento divertido y memorable.
- Garantizar que nadie se saque a sí mismo y que nadie vea la asignación de otros.
- **Costo de operación cero**: es un proyecto por diversión entre amigos y no debe generar gastos.

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

1. **Crear evento** (organizador): ingresa nombre del evento, la lista de participantes (mínimo 3) y una contraseña de organizador. Opcionales: fecha del intercambio y presupuesto sugerido.
2. **Sorteo**: al crear el evento se genera la asignación completa y queda definida.
3. **Compartir**: la app muestra el enlace único del evento para copiar o compartir (WhatsApp, etc.).
4. **Elegir nombre** (participante): al abrir el enlace ve la lista de nombres y toca el suyo. Esto lo identifica en ese dispositivo y lo excluye de ser su propio amigo secreto.
5. **Ruleta**: pantalla con una ruleta/carrusel vertical de nombres, con puesta en escena de casino. El usuario hace **swipe hacia abajo** y la ruleta gira rápido, desacelera y se detiene en su amigo secreto.
6. **Revelación**: aparece el nombre resaltado con **confeti** y animación. Se muestra el recordatorio de fecha y presupuesto si existen.
7. **Revisitar**: si vuelve a abrir el enlace en el mismo dispositivo, ve directamente su resultado, sin ruleta: la ruleta se gira una sola vez.
8. **Administrar** (organizador): desde "Mis eventos" en su dispositivo (o con su contraseña en otro) ve quién ya eligió nombre y quién ya vio su resultado, libera nombres elegidos por error y edita o elimina el evento.

## 5. Requisitos funcionales

### 5.1 Evento
- RF-1: Crear un evento con nombre y lista de participantes (3–50). Los nombres deben ser únicos dentro del evento.
- RF-2: Cada evento tiene un enlace único e inadivinable.
- RF-3: El organizador puede copiar/compartir el enlace (menú de compartir del dispositivo cuando esté disponible).

### 5.2 Selección de identidad
- RF-4: La lista muestra todos los participantes; el usuario toca el suyo y confirma ("¿Eres Ana?").
- RF-5: Un nombre ya reclamado aparece marcado como tomado y no puede elegirse desde otro dispositivo. Esto evita que alguien espíe la asignación de otro.
- RF-6: No hay sesiones de usuario: **el dispositivo es la identidad**. Al elegir el nombre, el dispositivo queda asociado a ese participante y se recuerda para volver a ver el resultado. Abrir el enlace en otro navegador o borrar los datos cuenta como otro dispositivo. Un dispositivo solo puede elegir un nombre por evento.

### 5.3 Ruleta
- RF-7: Gesto principal: **swipe hacia abajo** que dispara el giro. Alternativa accesible: botón "Girar".
- RF-8: La ruleta muestra los nombres de los demás participantes (nunca el propio) girando con inercia y desaceleración, y se detiene en el resultado real.
- RF-9: El resultado está definido desde la creación del evento; la ruleta es puramente visual y nunca lo decide.
- RF-10: Al terminar: confeti, vibración corta en móvil (si está disponible) y nombre destacado.
- RF-14: La ruleta se gira **una sola vez** por participante. Después, en cualquier visita, solo se muestra el resultado. Si el organizador libera el nombre, quien lo vuelva a elegir gira de nuevo.
- RF-15: Estilo **casino** en la pantalla de la ruleta: palanca de tragamonedas (el swipe), luces de marquesina, nombres que pasan casi deteniéndose antes del real, sonido opcional (apagado por defecto). El resto de la app tiene un estilo neutro y moderno.

### 5.4 Sorteo
- RF-11: Nadie puede tocarse a sí mismo.
- RF-12: Cada participante regala a exactamente una persona y recibe de exactamente una. El reparto es aleatorio y justo: todas las combinaciones válidas son igual de probables.
- RF-13: El sorteo se genera una sola vez y no cambia.

### 5.5 Administración
- RF-16: El dispositivo que crea el evento queda como su administrador. No hay enlaces de administración aparte.
- RF-17: El panel muestra por participante si está libre, si ya eligió nombre y si ya vio su resultado. **Nunca muestra asignaciones.**
- RF-18: El organizador puede liberar un nombre elegido para que se elija de nuevo (p. ej. alguien eligió mal o cambió de teléfono).
- RF-19: El organizador puede editar nombre, fecha y presupuesto del evento, y eliminarlo. La lista de participantes no se edita después del sorteo.

### 5.6 Mis eventos y recuperación
- RF-20: El inicio muestra **"Mis eventos"**: los que se crearon o en los que se eligió nombre desde este dispositivo, para volver a ellos sin buscar el enlace.
- RF-21: Si el organizador perdió el acceso (otro navegador, datos borrados u otro dispositivo), la app intenta reconocer el dispositivo y le sugiere sus eventos; para entrar al panel siempre pide la **contraseña de organizador**. Tras 5 intentos fallidos en una hora, se bloquea temporalmente.
- RF-22: Un participante que perdió el acceso no se recupera solo: el organizador libera su nombre y lo vuelve a elegir.

## 6. Requisitos no funcionales

- **Mobile first**: diseñada para pantallas de 360–430 px; usable en escritorio.
- **Rendimiento**: carga inicial < 2 s en 4G; interactividad mínima solo donde hace falta.
- **Privacidad**: ningún participante puede ver las asignaciones de otros, ni siquiera inspeccionando la aplicación. Cada uno ve únicamente la suya.
- **Accesibilidad**: respeta la preferencia de movimiento reducido (sin giro largo ni confeti), contraste suficiente, alternativa al gesto swipe.
- **Idioma**: español (v1), con los textos preparados para traducir en el futuro.
- **Datos mínimos**: sin cuentas ni datos personales más allá de los nombres ingresados y un identificador anónimo del dispositivo. El evento y sus datos se borran automáticamente a los 90 días.
- **Costo**: operación sin costo (ver objetivos).
- **Limitación aceptada**: la vista previa del enlace al compartirlo por chat es genérica (igual para todos los eventos, no muestra el nombre del evento).

## 7. Pantallas

1. **Inicio / Mis eventos**: eventos de este dispositivo y acceso a crear uno nuevo.
2. **Crear evento**: formulario simple, lista dinámica de nombres y contraseña de organizador.
3. **Evento creado**: enlace para copiar/compartir.
4. **Elegir nombre**: lista tocable con estados (libre / tomado).
5. **Ruleta**: zona de swipe con indicación visual ("desliza hacia abajo").
6. **Resultado**: nombre, confeti (solo tras el giro), fecha y presupuesto.
7. **Panel del organizador**: estado de los participantes y acciones de administración.
8. **Errores**: enlace inválido/expirado, nombre ya tomado por otro dispositivo.

## 8. Casos borde

- Alguien elige el nombre equivocado → el organizador libera el nombre desde su panel.
- Dispositivo cambiado, otro navegador o datos borrados → el nombre queda reclamado; se resuelve con la liberación del organizador.
- El organizador pierde el acceso → entra con su contraseña desde cualquier dispositivo (RF-21).
- El organizador olvida la contraseña y perdió su dispositivo → no hay recuperación posible sin cuentas; se advierte al crearla.
- Dos personas con el mismo nombre → el organizador debe diferenciarlas (p. ej. "Ana R.").
- Mínimo de 3 participantes; con 2 el sorteo sería trivial.

## 9. Métricas de éxito

- % de eventos donde todos los participantes ven su resultado.
- Tiempo desde crear el evento hasta compartir el enlace.
- Tasa de abandono en la pantalla de selección de nombre.

## 10. Roadmap

- **v1**: crear evento, enlace único, selección de nombre, ruleta, confeti.
- **v2**: lista de deseos, pistas anónimas, exclusiones (parejas), temas visuales.
- **v3**: chat anónimo con tu amigo secreto, recordatorios.

## 11. Preguntas abiertas

Ninguna por ahora.

### Resueltas (2026-11-21)

- Exclusiones de parejas: v2.
- Panel del organizador: sí (RF-16 a RF-19).
- Ruleta: se gira una sola vez, con estilo casino (RF-14, RF-15).
- Identidad: el dispositivo es la sesión (RF-6), con "Mis eventos" y recuperación del organizador por contraseña (RF-20 a RF-22).
- Vencimiento a 90 días, textos preparados para i18n: confirmados.
