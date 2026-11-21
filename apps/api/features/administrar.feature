# language: es
Característica: Administrar el evento
  Cubre RF-17 (estado sin asignaciones), RF-18 (liberar un nombre), RF-19 (editar y eliminar)
  y RF-22 (un participante que perdió su acceso lo recupera cuando el organizador libera su nombre).

  Antecedentes:
    Dado que "Ana" creó el evento "Navidad" con los participantes "Ana, Beto, Carla"
    Y que "Beto" eligió el nombre "Beto" en "Navidad"
    Y que "Beto" ya vio su resultado en "Navidad"

  Escenario: El panel muestra quién eligió y quién ya vio, sin asignaciones
    Cuando "Ana" abre el panel de "Navidad"
    Entonces la respuesta es 200
    Y el panel muestra a "Beto" con nombre elegido y resultado visto
    Y el panel muestra a "Carla" libre
    Y la respuesta no contiene asignaciones

  Escenario: Solo el administrador ve el panel
    Cuando "Beto" abre el panel de "Navidad"
    Entonces la respuesta es 401 con el error "UNAUTHORIZED"

  Escenario: Liberar un nombre permite elegirlo de nuevo desde otro dispositivo y volver a girar
    Cuando "Ana" libera el nombre "Beto" en "Navidad"
    Entonces la respuesta es 204
    Y "Beto nuevo" puede elegir el nombre "Beto" en "Navidad"
    Y el resultado de "Beto nuevo" en "Navidad" es nuevo

  Escenario: Editar los datos del evento
    Cuando "Ana" cambia el nombre de "Navidad" a "Navidad 2026" con presupuesto "30 USD"
    Entonces la respuesta es 204
    Y al abrir "Navidad", el evento se llama "Navidad 2026" con presupuesto "30 USD"

  Escenario: Eliminar el evento
    Cuando "Ana" elimina "Navidad"
    Entonces la respuesta es 204
    Y "Beto" ya no encuentra "Navidad"
