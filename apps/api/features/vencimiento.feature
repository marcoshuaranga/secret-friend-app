# language: es
Característica: Vencimiento del evento
  Cubre PRD §6: el evento vence a los 90 días y se borra.

  Antecedentes:
    Dado que "Ana" creó el evento "Navidad" con los participantes "Ana, Beto, Carla"

  Escenario: A los 89 días el evento sigue disponible
    Cuando pasan 89 días
    Y "Beto" abre el evento "Navidad"
    Entonces la respuesta es 200

  Escenario: A los 90 días el evento ya no existe
    Cuando pasan 90 días
    Y "Beto" abre el evento "Navidad"
    Entonces la respuesta es 404 con el error "NOT_FOUND"
    Y "Ana" no ve eventos creados
