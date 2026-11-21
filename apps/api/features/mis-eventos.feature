# language: es
Característica: Mis eventos
  Cubre RF-20: el inicio muestra los eventos creados y unidos desde este dispositivo.

  Escenario: Eventos creados y unidos
    Dado que "Ana" creó el evento "Navidad" con los participantes "Ana, Beto, Carla"
    Y que "Beto" creó el evento "Oficina" con los participantes "Beto, Eva, Fito"
    Y que "Ana" eligió el nombre "Beto" en "Oficina"
    Cuando "Ana" ve sus eventos
    Entonces creó los eventos "Navidad"
    Y está en los eventos "Oficina" como "Beto"

  Escenario: Un dispositivo nuevo no tiene eventos
    Cuando "Nuevo" ve sus eventos
    Entonces creó los eventos ""
