# language: es
Característica: Elegir mi nombre
  Cubre RF-4 (elegir mi nombre), RF-5 (un nombre tomado no se puede elegir desde otro
  dispositivo) y RF-6 (el dispositivo es la identidad).

  Antecedentes:
    Dado que "Ana" creó el evento "Navidad" con los participantes "Ana, Beto, Carla"

  Escenario: Elegir un nombre libre
    Cuando "Beto" elige el nombre "Beto" en "Navidad"
    Entonces la respuesta es 200
    Y al abrir "Navidad", "Beto" aparece como "Beto"
    Y al abrir "Navidad", el nombre "Beto" figura como tomado

  Escenario: Un nombre tomado no se puede elegir desde otro dispositivo
    Dado que "Beto" eligió el nombre "Beto" en "Navidad"
    Cuando "Intruso" elige el nombre "Beto" en "Navidad"
    Entonces la respuesta es 409 con el error "NAME_TAKEN"

  Escenario: Elegir de nuevo el propio nombre no falla
    Dado que "Beto" eligió el nombre "Beto" en "Navidad"
    Cuando "Beto" elige el nombre "Beto" en "Navidad"
    Entonces la respuesta es 200

  Escenario: Un dispositivo solo puede tener un nombre por evento
    Dado que "Beto" eligió el nombre "Beto" en "Navidad"
    Cuando "Beto" elige el nombre "Carla" en "Navidad"
    Entonces la respuesta es 409 con el error "ALREADY_CLAIMED"

  Escenario: Un enlace inexistente da error
    Cuando "Beto" abre un evento con un enlace inventado
    Entonces la respuesta es 404 con el error "NOT_FOUND"
