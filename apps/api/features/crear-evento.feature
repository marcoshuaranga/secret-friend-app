# language: es
Característica: Crear un evento
  Cubre RF-1 (crear con 3–50 nombres únicos), RF-2 (enlace inadivinable),
  RF-13 (sorteo único al crear) y RF-16 (el dispositivo creador administra).

  Escenario: El organizador crea un evento y queda como administrador
    Cuando "Ana" crea el evento "Navidad" con los participantes "Ana, Beto, Carla"
    Entonces la respuesta es 201
    Y el enlace del evento es largo e inadivinable
    Y "Ana" es administradora de "Navidad"

  Escenario: Se rechaza un evento con nombres repetidos
    Cuando "Ana" intenta crear el evento "Navidad" con los participantes "Ana, Beto, ana"
    Entonces la respuesta es 400 con el error "INVALID_INPUT"

  Escenario: Se rechaza un evento sin contraseña de organizador
    Cuando "Ana" intenta crear el evento "Navidad" sin contraseña
    Entonces la respuesta es 400 con el error "INVALID_INPUT"

  Escenario: Los datos públicos no revelan asignaciones
    Dado que "Ana" creó el evento "Navidad" con los participantes "Ana, Beto, Carla"
    Cuando "Beto" abre el evento "Navidad"
    Entonces la respuesta es 200
    Y ve a los participantes "Ana, Beto, Carla" libres
    Y la respuesta no contiene asignaciones
