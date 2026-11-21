# PRD — Secret Friend (Amigo Secreto)

> Estado: borrador v0.6 · Documento funcional y de negocio. Las decisiones técnicas y lineamientos viven en [`AGENTS.md`](./AGENTS.md). Los puntos marcados con **[Supuesto]** no fueron confirmados y deben validarse antes de implementar.

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
| **Organizador** | Crea el evento, carga la lista de nombres, comparte el enlace y sigue el avance desde su panel. |
| **Participante** | Abre el enlace, elige su nombre y gira la ruleta. El organizador también es participante. |

## 4. Flujo principal

1. **Crear evento** (organizador): ingresa nombre del evento y la lista de participantes (mínimo 3). Opcionales: fecha del intercambio y presupuesto sugerido.
2. **Sorteo**: al crear el evento se genera la asignación completa y queda definida.
3. **Compartir**: la app muestra el enlace único del evento para copiar o compartir (WhatsApp, etc.).
4. **Elegir nombre** (participante): al abrir el enlace ve la lista de nombres y toca el suyo. Esto lo identifica y lo excluye de ser su propio amigo secreto.
5. **Ruleta**: pantalla con una ruleta/carrusel vertical de nombres. El usuario hace **swipe hacia abajo** y la ruleta gira rápido, desacelera y se detiene en su amigo secreto.
6. **Revelación**: aparece el nombre resaltado con **confeti** y animación. Se muestra el recordatorio de fecha y presupuesto si existen.
7. **Revisitar**: si vuelve a abrir el enlace en el mismo dispositivo, ve directamente su resultado. La ruleta se gira **una sola vez**: después ya no se puede volver a girar.
8. **Seguimiento** (organizador): desde su panel, con la clave de administración, ve quién ya eligió su nombre y quién ya descubrió a su amigo secreto, sin ver ninguna asignación, y puede liberar un nombre reclamado por error.

## 5. Requisitos funcionales

### 5.1 Evento
- RF-1: Crear un evento con nombre y lista de participantes (3–50). Los nombres deben ser únicos dentro del evento.
- RF-2: Cada evento tiene un enlace único e inadivinable.
- RF-3: El organizador puede copiar/compartir el enlace (menú de compartir del dispositivo cuando esté disponible).

### 5.2 Selección de identidad
- RF-4: La lista muestra todos los participantes; el usuario toca el suyo y confirma ("¿Eres Ana?").
- RF-5: Un nombre ya reclamado aparece marcado como tomado y no puede elegirse desde otro dispositivo. **[Supuesto]** Esto evita que alguien espíe la asignación de otro.
- RF-6: Se recuerda la identidad en el dispositivo para poder volver a ver el resultado.

### 5.3 Ruleta
- RF-7: Gesto principal: **swipe hacia abajo** que dispara el giro. Alternativa accesible: botón "Girar".
- RF-8: La ruleta muestra los nombres de los demás participantes (nunca el propio) girando con inercia y desaceleración, y se detiene en el resultado real.
- RF-9: El resultado está definido desde la creación del evento; la ruleta es puramente visual y nunca lo decide.
- RF-10: Al terminar: confeti, vibración corta en móvil (si está disponible) y nombre destacado.
- RF-14: La ruleta se gira una sola vez por participante. Después de la revelación no se puede volver a girar; al volver solo se muestra el resultado.

### 5.4 Sorteo
- RF-11: Nadie puede tocarse a sí mismo.
- RF-12: Cada participante regala a exactamente una persona y recibe de exactamente una. El reparto es aleatorio y justo: todas las combinaciones válidas son igual de probables.
- RF-13: El sorteo se genera una sola vez y no cambia.

### 5.5 Organizador
- RF-15: Panel del organizador, accesible solo con la clave de administración que recibe al crear el evento. Muestra el estado de cada participante: libre, tomado (eligió su nombre) o revelado (ya vio a su amigo secreto). Nunca muestra asignaciones.
- RF-16: Desde el panel, el organizador puede liberar un nombre reclamado. El nombre vuelve a estar libre, el dispositivo que lo tenía pierde el acceso y la asignación de ese nombre no cambia.

### 5.6 Datos
- RF-17: El evento expira automáticamente 90 días después de su creación; a partir de entonces el enlace muestra un error.

## 6. Requisitos no funcionales

- **Mobile first**: diseñada para pantallas de 360–430 px; usable en escritorio.
- **Rendimiento**: carga inicial < 2 s en 4G; interactividad mínima solo donde hace falta.
- **Privacidad**: ningún participante puede ver las asignaciones de otros, ni siquiera inspeccionando la aplicación. Cada uno ve únicamente la suya.
- **Accesibilidad**: respeta la preferencia de movimiento reducido (sin giro largo ni confeti), contraste suficiente, alternativa al gesto swipe.
- **Idioma**: español (v1). **[Supuesto]** Preparar textos para i18n futura.
- **Datos mínimos**: sin cuentas ni datos personales más allá de los nombres ingresados. Evento con expiración automática a los 90 días (RF-17).
- **Costo**: operación sin costo (ver objetivos).
- **Limitación aceptada**: la vista previa del enlace al compartirlo por chat es genérica (igual para todos los eventos, no muestra el nombre del evento).

## 7. Pantallas

1. **Home / Crear evento**: formulario simple, lista dinámica de nombres.
2. **Evento creado**: enlace para copiar/compartir y clave de administración.
3. **Elegir nombre**: lista tocable con estados (libre / tomado).
4. **Ruleta**: zona de swipe con indicación visual ("desliza hacia abajo").
5. **Resultado**: nombre, confeti, fecha y presupuesto.
6. **Errores**: enlace inválido/expirado, evento lleno de reclamos.
7. **Panel del organizador**: estado de cada participante (libre / tomado / revelado) y opción de liberar un nombre.

## 8. Casos borde

- Alguien elige el nombre equivocado → el organizador libera ese nombre desde su panel (RF-16).
- Dispositivo cambiado o datos borrados → el nombre queda reclamado; se resuelve con la liberación del organizador.
- Dos personas con el mismo nombre → el organizador debe diferenciarlas (p. ej. "Ana R.").
- Mínimo de 3 participantes; con 2 el sorteo sería trivial.

## 9. Métricas de éxito

- % de eventos donde todos los participantes ven su resultado.
- Tiempo desde crear el evento hasta compartir el enlace.
- Tasa de abandono en la pantalla de selección de nombre.

## 10. Roadmap

- **v1**: crear evento, enlace único, selección de nombre, ruleta, confeti, panel del organizador.
- **v2**: lista de deseos, pistas anónimas, exclusiones (parejas), temas visuales.
- **v3**: chat anónimo con tu amigo secreto, recordatorios.

## 11. Preguntas abiertas

1. ¿Se permiten exclusiones (parejas que no se pueden tocar) en v1?

Resueltas en v0.6: el organizador tiene panel (RF-15, RF-16); la ruleta se gira una sola vez (RF-14); la liberación de nombres y la expiración a 90 días quedan confirmadas (RF-16, RF-17).
