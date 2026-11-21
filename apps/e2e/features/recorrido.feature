# language: es
Característica: Recorrido completo en el navegador
  Cubre de punta a punta RF-1 a RF-10, RF-14 y RF-16 a RF-21 en un teléfono simulado:
  RF-3 (copiar el enlace), RF-7 (tirar hacia abajo o botón "Girar") y RF-10 (confeti,
  vibración y resultado anunciado).

  Escenario: El organizador copia el enlace del evento
    Dado que Ana crea el evento "Navidad" con "Ana, Beto, Carla, Dani"
    Cuando Ana copia el enlace
    Entonces el portapapeles contiene el enlace del evento

  Escenario: Crear, elegir nombre, girar una sola vez y revisitar
    Dado que Ana crea el evento "Navidad" con "Ana, Beto, Carla, Dani"
    Cuando Ana elige su nombre "Ana"
    Y Ana tira de la ruleta hacia abajo
    Entonces la ruleta celebra con confeti y vibración y anuncia el resultado
    Y Ana ve a quién le regala, y no es ella misma
    Cuando Ana vuelve a abrir el enlace
    Entonces Ana ve el mismo resultado sin la ruleta

  Escenario: Un nombre elegido aparece tomado en otro teléfono
    Dado que Ana crea el evento "Navidad" con "Ana, Beto, Carla, Dani"
    Y Ana elige su nombre "Ana"
    Cuando Beto abre el enlace
    Entonces Beto ve el nombre "Ana" como tomado
    Y Beto puede elegir su nombre "Beto" y girar con el botón

  Escenario: El organizador libera un nombre desde su panel
    Dado que Ana crea el evento "Navidad" con "Ana, Beto, Carla, Dani"
    Y Beto abre el enlace
    Y Beto elige su nombre "Beto"
    Cuando Ana abre su panel desde "Mis eventos"
    Entonces el panel muestra a "Beto" como "Eligió su nombre"
    Cuando Ana libera el nombre de "Beto"
    Entonces el panel muestra a "Beto" como "Pendiente"

  Escenario: Recuperar el panel desde otro teléfono con la contraseña
    Dado que Ana crea el evento "Navidad" con "Ana, Beto, Carla, Dani"
    Cuando Ana abre el panel en otro teléfono
    Entonces se le pide la contraseña de organizador
    Cuando escribe la contraseña "secreto123"
    Entonces ve el panel de "Navidad"
