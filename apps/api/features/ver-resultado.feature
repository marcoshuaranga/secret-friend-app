# language: es
Característica: Ver mi amigo secreto
  Cubre RF-8 (nunca me toco), RF-9 (el resultado viene del servidor), RF-14 (la ruleta
  se gira una sola vez) y la privacidad: nadie ve el resultado de otro.

  Antecedentes:
    Dado que "Ana" creó el evento "Navidad" con los participantes "Ana, Beto, Carla, Dani"

  Escenario: Ver mi resultado por primera vez
    Dado que "Beto" eligió el nombre "Beto" en "Navidad"
    Cuando "Beto" pide su resultado en "Navidad"
    Entonces la respuesta es 200
    Y su amigo secreto es otro participante distinto de "Beto"
    Y los demás participantes no incluyen a "Beto"
    Y el resultado es nuevo

  Escenario: La segunda vez se indica que ya lo vio y el resultado no cambia
    Dado que "Beto" eligió el nombre "Beto" en "Navidad"
    Y que "Beto" ya vio su resultado en "Navidad"
    Cuando "Beto" pide su resultado en "Navidad"
    Entonces el resultado ya había sido visto
    Y el amigo secreto es el mismo que la primera vez
    Y al abrir "Navidad", "Beto" figura con el resultado visto

  Escenario: Sin elegir nombre no hay resultado
    Cuando "Intruso" pide su resultado en "Navidad"
    Entonces la respuesta es 403 con el error "NOT_CLAIMED"

  Escenario: Cada participante ve solo su propia asignación y el reparto es válido
    Dado que cada participante eligió su nombre en "Navidad" desde su dispositivo
    Cuando cada participante pide su resultado en "Navidad"
    Entonces nadie se tocó a sí mismo y cada uno recibe de exactamente una persona
