# language: es
Característica: Reglas del evento
  Cubre RF-1 (nombres únicos), RF-4 a RF-6 (elegir nombre), RF-21 (límite de intentos)
  y el vencimiento a 90 días.

  Esquema del escenario: Dos nombres iguales sin importar tildes ni mayúsculas
    Dados los nombres "<nombres>"
    Entonces los nombres <resultado> únicos

    Ejemplos:
      | nombres             | resultado |
      | Ana, Luis, Marta    | son       |
      | Ana, Aná, Luis      | no son    |
      | ana  lópez, Ana Lopez, Luis | no son |

  Escenario: Tomar un nombre libre
    Dado un nombre libre y un dispositivo sin nombre en el evento
    Cuando el dispositivo intenta tomar el nombre
    Entonces puede tomarlo

  Escenario: Volver a tomar el propio nombre es idempotente
    Dado un nombre tomado por el mismo dispositivo
    Cuando el dispositivo intenta tomar el nombre
    Entonces ya es suyo

  Escenario: Un nombre tomado por otro dispositivo no se puede elegir
    Dado un nombre tomado por otro dispositivo
    Cuando el dispositivo intenta tomar el nombre
    Entonces falla con "name_taken"

  Escenario: Un dispositivo solo puede tener un nombre por evento
    Dado un nombre libre y un dispositivo que ya tiene otro nombre en el evento
    Cuando el dispositivo intenta tomar el nombre
    Entonces falla con "already_claimed"

  Escenario: Tras 5 contraseñas erróneas en una hora se bloquea
    Dado un evento sin intentos fallidos
    Cuando se registran 5 intentos fallidos en 10 minutos
    Entonces no se permite intentar de nuevo
    Pero una hora después del primer fallo se permite intentar

  Escenario: 4 intentos fallidos todavía permiten intentar
    Dado un evento sin intentos fallidos
    Cuando se registran 4 intentos fallidos en 10 minutos
    Entonces se permite intentar

  Escenario: Un evento vence a los 90 días
    Dado un evento creado hoy
    Entonces sigue vigente a los 89 días
    Y vence a los 90 días
